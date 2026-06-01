import type { SupabaseClient } from "@supabase/supabase-js";
import { calculateMatchPoints } from "./calculateMatchPoints";
import {
  effectivePrediction,
  applyPowerups,
  type GoalAdjustment,
  type SelfEffect,
} from "./applyPowerups";
import { awardAchievements } from "@/lib/achievements/award";

const SCORE_MOD_EFFECTS = new Set([
  "multiply_points",
  "multiply_if_exact",
  "min_points",
  "exact_bonus",
  "team_goals_boost",
  "flat_bonus",
  "draw_consolation",
  "clean_sheet_bonus",
]);

type EffectRow = {
  match_id: string;
  user_id: string;
  effect: {
    type?: string;
    config?: Record<string, any>;
    side?: "home" | "away";
    target_user_id?: string;
  };
};
import {
  DEFAULT_RULES,
  DEFAULT_MULTIPLIERS,
  type ScoringRules,
  type PhaseMultipliers,
  type MatchPhase,
} from "./types";

/**
 * Recompute the MATCH portion of a tournament's points ledger from scratch.
 *
 * It reads the rules, the finished matches and everyone's predictions, runs the
 * pure `calculateMatchPoints` engine for each, then replaces the `source='match'`
 * ledger rows in one transaction-like pass (delete + bulk insert). Idempotent:
 * running it twice yields the same ledger.
 *
 * IMPORTANT: pass a service-role client. Writing to points_ledger bypasses RLS,
 * so the CALLER must have already verified that the requester is the admin.
 *
 * (Question and powerup scoring are layered on in later phases; this only owns
 * the 'match' source.)
 */
export async function recalculateTournamentStandings(
  supabase: SupabaseClient,
  tournamentId: string,
): Promise<{ matchesScored: number; ledgerRows: number }> {
  // 1. Rules
  const { data: r } = await supabase
    .from("scoring_rules")
    .select("*")
    .eq("tournament_id", tournamentId)
    .maybeSingle();

  const rules: ScoringRules = r
    ? {
        exactPoints: r.exact_points,
        signPoints: r.sign_points,
        goalDiffPoints: r.goal_diff_points,
        teamGoalsPoints: r.team_goals_points,
        knockoutAdvancePoints: r.knockout_advance_points,
      }
    : DEFAULT_RULES;

  // 2. Phase multipliers
  const { data: pm } = await supabase
    .from("phase_multipliers")
    .select("phase, multiplier")
    .eq("tournament_id", tournamentId);

  const multipliers: PhaseMultipliers = { ...DEFAULT_MULTIPLIERS };
  for (const row of pm ?? []) {
    multipliers[row.phase as MatchPhase] = Number(row.multiplier);
  }

  // 3. Finished matches with a complete result
  const { data: matches } = await supabase
    .from("matches")
    .select("id, phase, home_score, away_score, advancing_team_id")
    .eq("tournament_id", tournamentId)
    .eq("status", "finished")
    .not("home_score", "is", null)
    .not("away_score", "is", null);

  const finished = matches ?? [];
  if (finished.length === 0) {
    // Nothing to score yet — clear any stale match rows and return.
    await supabase
      .from("points_ledger")
      .delete()
      .eq("tournament_id", tournamentId)
      .eq("source", "match");
    return { matchesScored: 0, ledgerRows: 0 };
  }

  const matchIds = finished.map((m) => m.id);

  // 4. All predictions for those matches
  const { data: preds } = await supabase
    .from("match_predictions")
    .select("match_id, user_id, home_goals, away_goals, advancing_team_id")
    .in("match_id", matchIds);

  // 4b. Powerup effects activated on those matches
  const { data: effectRows } = await supabase
    .from("match_powerup_effects")
    .select("match_id, user_id, effect")
    .in("match_id", matchIds);

  const effects = (effectRows ?? []) as EffectRow[];

  // Index effects by match for quick lookup.
  const effectsByMatch = new Map<string, EffectRow[]>();
  for (const e of effects) {
    const arr = effectsByMatch.get(e.match_id) ?? [];
    arr.push(e);
    effectsByMatch.set(e.match_id, arr);
  }

  const matchById = new Map(finished.map((m) => [m.id, m]));

  // 5. Score each prediction, applying any powerups
  const ledgerRows = (preds ?? []).map((p) => {
    const m = matchById.get(p.match_id)!;
    const phase = m.phase as MatchPhase;
    const matchEffects = effectsByMatch.get(p.match_id) ?? [];

    // Goal adjustments: own (ghost/scissors) + incoming offensive (curse/push),
    // unless this user shielded the match with a padlock.
    const protectedByPadlock = matchEffects.some(
      (e) => e.effect?.type === "protect" && e.user_id === p.user_id,
    );
    const adjustments: GoalAdjustment[] = [];
    for (const e of matchEffects) {
      const t = e.effect?.type;
      if (t === "adjust_own_goal" && e.user_id === p.user_id && e.effect.side) {
        adjustments.push({ side: e.effect.side, delta: Number(e.effect.config?.delta ?? 0) });
      }
      if (
        t === "adjust_other_goal" &&
        e.effect.target_user_id === p.user_id &&
        e.effect.side &&
        !protectedByPadlock
      ) {
        adjustments.push({ side: e.effect.side, delta: Number(e.effect.config?.delta ?? 0) });
      }
    }

    // Self score-modifier powerups owned by this user on this match.
    const selfEffects: SelfEffect[] = matchEffects
      .filter((e) => e.user_id === p.user_id && SCORE_MOD_EFFECTS.has(e.effect?.type ?? ""))
      .map((e) => ({ effectType: e.effect!.type!, config: e.effect!.config ?? {} }));

    const stored = {
      homeGoals: p.home_goals,
      awayGoals: p.away_goals,
      advancingTeamId: p.advancing_team_id,
    };
    const eff = effectivePrediction(stored, adjustments);
    const result = {
      homeGoals: m.home_score,
      awayGoals: m.away_score,
      phase,
      isKnockout: phase !== "group",
      advancingTeamId: m.advancing_team_id,
    };
    const base = calculateMatchPoints(eff, result, rules, multipliers);
    const score = applyPowerups(eff, result, base, selfEffects);

    return {
      tournament_id: tournamentId,
      user_id: p.user_id,
      source: "match" as const,
      match_id: p.match_id,
      points: score.total,
      multiplier_applied: score.multiplier,
      breakdown: score.breakdown,
      note: null,
    };
  });

  // 6. Replace the match ledger atomically-ish: wipe then insert.
  await supabase
    .from("points_ledger")
    .delete()
    .eq("tournament_id", tournamentId)
    .eq("source", "match");

  if (ledgerRows.length > 0) {
    const { error } = await supabase.from("points_ledger").insert(ledgerRows);
    if (error) throw new Error(`No se pudo guardar la clasificación: ${error.message}`);
  }

  // 7. Grant any newly-earned achievements (sticky, best-effort).
  try {
    await awardAchievements(supabase, tournamentId);
  } catch {
    /* non-fatal: standings are saved regardless */
  }

  return { matchesScored: finished.length, ledgerRows: ledgerRows.length };
}

// lib/achievements/award.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { evaluateUserAchievements, type MatchItem } from "./evaluate";

/**
 * Grant any newly-earned achievements to every member, based on finished
 * matches. Idempotent and additive: achievements are never revoked, and
 * re-running only inserts the ones a player doesn't already have.
 *
 * Pass a service-role client (user_achievements has no insert policy).
 */
export async function awardAchievements(
  supabase: SupabaseClient,
  tournamentId: string,
): Promise<{ granted: number }> {
  const { data: matches } = await supabase
    .from("matches")
    .select("id, matchday_id, kickoff_at, home_score, away_score")
    .eq("tournament_id", tournamentId)
    .eq("status", "finished");
  const finished = matches ?? [];
  if (finished.length === 0) return { granted: 0 };

  const matchIds = finished.map((m) => m.id);
  const matchById = new Map(finished.map((m) => [m.id, m]));

  // Finished-match count per matchday (for "unbeaten").
  const mdCount = new Map<string, number>();
  for (const m of finished) {
    if (m.matchday_id) mdCount.set(m.matchday_id, (mdCount.get(m.matchday_id) ?? 0) + 1);
  }

  const [{ data: preds }, { data: ledger }, { data: catalog }] = await Promise.all([
    supabase
      .from("match_predictions")
      .select("match_id, user_id, home_goals, away_goals")
      .in("match_id", matchIds),
    supabase
      .from("points_ledger")
      .select("user_id, match_id, points")
      .eq("tournament_id", tournamentId)
      .eq("source", "match"),
    supabase.from("achievements").select("id, key"),
  ]);

  const achId = new Map((catalog ?? []).map((a) => [a.key, a.id]));
  const pointsByUserMatch = new Map<string, number>();
  for (const l of ledger ?? []) pointsByUserMatch.set(`${l.user_id}:${l.match_id}`, l.points);

  // Group each user's predicted finished matches into MatchItem[].
  const itemsByUser = new Map<string, MatchItem[]>();
  for (const p of preds ?? []) {
    const m = matchById.get(p.match_id);
    if (!m || m.home_score == null || m.away_score == null) continue;
    const arr = itemsByUser.get(p.user_id) ?? [];
    arr.push({
      kickoff: m.kickoff_at,
      matchdayId: m.matchday_id,
      resHome: m.home_score,
      resAway: m.away_score,
      predHome: p.home_goals,
      predAway: p.away_goals,
      points: pointsByUserMatch.get(`${p.user_id}:${p.match_id}`) ?? 0,
    });
    itemsByUser.set(p.user_id, arr);
  }

  const rows: { tournament_id: string; user_id: string; achievement_id: string }[] = [];
  for (const [userId, items] of Array.from(itemsByUser)) {
    const earned = evaluateUserAchievements(items, mdCount);
    for (const key of Array.from(earned)) {
      const id = achId.get(key);
      if (id) rows.push({ tournament_id: tournamentId, user_id: userId, achievement_id: id });
    }
  }

  if (rows.length > 0) {
    await supabase
      .from("user_achievements")
      .upsert(rows, { onConflict: "tournament_id,user_id,achievement_id", ignoreDuplicates: true });
  }
  return { granted: rows.length };
}

// lib/scoring/applyPowerups.ts
// PURE powerup logic for scoring. No DB/network.
//
// Two stages:
//  1) effectivePrediction(): turn a stored prediction into the one that actually
//     gets scored, after applying goal adjustments (own ghost/scissors and any
//     incoming offensive curse/push, unless the target is protected by a padlock).
//  2) applyPowerups(): take the base MatchScore and apply the user's own
//     score-modifier powerups (multipliers, bonuses, shields) in a fixed order.

import { calculateMatchPoints } from "./calculateMatchPoints";
import type {
  Prediction,
  MatchResult,
  ScoringRules,
  PhaseMultipliers,
  MatchScore,
  ScoreBreakdownItem,
} from "./types";

export type TeamSide = "home" | "away";

export interface GoalAdjustment {
  side: TeamSide;
  delta: number; // +1 or -1
}

/** Apply goal adjustments to a prediction (goals never go below 0). */
export function effectivePrediction(
  base: Prediction,
  adjustments: GoalAdjustment[],
): Prediction {
  let home = base.homeGoals;
  let away = base.awayGoals;
  for (const adj of adjustments) {
    if (adj.side === "home") home = Math.max(0, home + adj.delta);
    else away = Math.max(0, away + adj.delta);
  }
  return { ...base, homeGoals: home, awayGoals: away };
}

export interface SelfEffect {
  effectType: string;
  config: Record<string, any>;
}

const sign = (h: number, a: number) => (h > a ? 1 : h < a ? -1 : 0);

/**
 * Apply the user's own score-modifying powerups to a base score.
 * `score` must be the result of calculateMatchPoints for the EFFECTIVE prediction.
 */
export function applyPowerups(
  prediction: Prediction,
  result: MatchResult,
  score: MatchScore,
  effects: SelfEffect[],
): MatchScore {
  const exact =
    prediction.homeGoals === result.homeGoals &&
    prediction.awayGoals === result.awayGoals;
  const realDraw = sign(result.homeGoals, result.awayGoals) === 0;
  const predDraw = sign(prediction.homeGoals, prediction.awayGoals) === 0;

  const breakdown: ScoreBreakdownItem[] = [...score.breakdown];
  let extraBase = 0;

  const has = (t: string) => effects.find((e) => e.effectType === t);

  // --- additive bonuses (applied to the pre-multiplier base) ---
  const epic = has("exact_bonus");
  if (epic && exact) {
    const b = Number(epic.config.bonus ?? 3);
    extraBase += b;
    breakdown.push({ label: "🔥 Remontada épica", points: b });
  }

  const prophet = has("team_goals_boost");
  if (prophet) {
    let bonus = 0;
    if (prediction.homeGoals === result.homeGoals) bonus += 1;
    if (prediction.awayGoals === result.awayGoals) bonus += 1;
    if (bonus > 0) {
      extraBase += bonus;
      breakdown.push({ label: "🔮 Profeta del gol", points: bonus });
    }
  }

  const bench = has("flat_bonus");
  if (bench) {
    const b = Number(bench.config.bonus ?? 1);
    extraBase += b;
    breakdown.push({ label: "💪 Inspiración del banquillo", points: b });
  }

  const glove = has("clean_sheet_bonus");
  if (glove) {
    let bonus = 0;
    if (result.homeGoals === 0 && prediction.homeGoals === 0) bonus += 1;
    if (result.awayGoals === 0 && prediction.awayGoals === 0) bonus += 1;
    if (bonus > 0) {
      extraBase += bonus;
      breakdown.push({ label: "🧤 Guante de oro", points: bonus });
    }
  }

  const joker = has("draw_consolation");
  if (joker && realDraw && !predDraw) {
    const b = Number(joker.config.points ?? 1);
    extraBase += b;
    breakdown.push({ label: "🤝 Comodín del empate", points: b });
  }

  const newBase = score.base + extraBase;
  let total = Math.round(newBase * score.multiplier);

  // --- multipliers (applied to the post-phase total) ---
  const dbl = has("multiply_points");
  if (dbl) {
    const f = Number(dbl.config.factor ?? 2);
    total = Math.round(total * f);
    breakdown.push({ label: "✖️ Doble o nada", points: 0 });
  }
  const allin = has("multiply_if_exact");
  if (allin && exact) {
    const f = Number(allin.config.factor ?? 3);
    total = Math.round(total * f);
    breakdown.push({ label: "🎰 All-in (exacto)", points: 0 });
  }

  // --- floor / shield (last, so a 0 can become the minimum) ---
  const shield = has("min_points");
  if (shield) {
    const min = Number(shield.config.min ?? 1);
    if (total < min) {
      total = min;
      breakdown.push({ label: "🛡️ Escudo anti-cero", points: min });
    }
  }

  if (total < 0) total = 0;
  return { base: newBase, multiplier: score.multiplier, total, breakdown };
}

/** Convenience: score a prediction with adjustments + self effects in one call. */
export function scoreWithPowerups(
  basePrediction: Prediction,
  adjustments: GoalAdjustment[],
  result: MatchResult,
  rules: ScoringRules,
  multipliers: PhaseMultipliers,
  selfEffects: SelfEffect[],
): MatchScore {
  const eff = effectivePrediction(basePrediction, adjustments);
  const base = calculateMatchPoints(eff, result, rules, multipliers);
  return applyPowerups(eff, result, base, selfEffects);
}

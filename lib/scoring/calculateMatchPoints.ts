// lib/scoring/calculateMatchPoints.ts
// Función PURA y testeable. No toca base de datos ni red.
//
// Modelo de puntuación (derivado de los ejemplos del briefing):
//  1. Resultado exacto  → exactPoints (es el máximo; no se suma nada más).
//  2. Si NO es exacto, componente de "resultado" (se toma el mejor que aplique):
//       · ganador correcto (no empate) Y diferencia de goles correcta → goalDiffPoints
//       · signo correcto (ganador o empate)                          → signPoints
//  3. Bonus por goles exactos de un equipo: +teamGoalsPoints por cada equipo
//     cuyos goles aciertes (sólo cuando NO es exacto; en exacto ya está incluido).
//  4. Eliminatoria con empate a 90': si aciertas quién pasa → knockoutAdvancePoints.
//  5. Se aplica el multiplicador de fase. Nunca hay puntos negativos.

import {
  Prediction,
  MatchResult,
  ScoringRules,
  PhaseMultipliers,
  MatchScore,
  ScoreBreakdownItem,
} from './types';

const sign = (h: number, a: number): -1 | 0 | 1 =>
  h > a ? 1 : h < a ? -1 : 0;

export function calculateMatchPoints(
  prediction: Prediction,
  result: MatchResult,
  rules: ScoringRules,
  multipliers: PhaseMultipliers,
): MatchScore {
  const breakdown: ScoreBreakdownItem[] = [];
  let base = 0;

  const exact =
    prediction.homeGoals === result.homeGoals &&
    prediction.awayGoals === result.awayGoals;

  const pSign = sign(prediction.homeGoals, prediction.awayGoals);
  const rSign = sign(result.homeGoals, result.awayGoals);
  const signCorrect = pSign === rSign;
  const isDraw = rSign === 0;
  const predDiff = prediction.homeGoals - prediction.awayGoals;
  const realDiff = result.homeGoals - result.awayGoals;

  if (exact) {
    base += rules.exactPoints;
    breakdown.push({ label: 'Resultado exacto', points: rules.exactPoints });
  } else {
    // componente de resultado (excluyente)
    if (signCorrect && !isDraw && predDiff === realDiff) {
      base += rules.goalDiffPoints;
      breakdown.push({ label: 'Ganador + diferencia de goles', points: rules.goalDiffPoints });
    } else if (signCorrect) {
      base += rules.signPoints;
      breakdown.push({
        label: isDraw ? 'Empate acertado' : 'Ganador acertado',
        points: rules.signPoints,
      });
    }
    // bonus por goles exactos de un equipo
    let teamBonus = 0;
    if (prediction.homeGoals === result.homeGoals) teamBonus += rules.teamGoalsPoints;
    if (prediction.awayGoals === result.awayGoals) teamBonus += rules.teamGoalsPoints;
    if (teamBonus > 0) {
      base += teamBonus;
      breakdown.push({ label: 'Goles exactos de un equipo', points: teamBonus });
    }
  }

  // eliminatoria: quién pasa de ronda cuando hubo empate a 90'
  if (
    result.isKnockout &&
    isDraw &&
    result.advancingTeamId &&
    prediction.advancingTeamId &&
    prediction.advancingTeamId === result.advancingTeamId
  ) {
    base += rules.knockoutAdvancePoints;
    breakdown.push({ label: 'Acertó quién pasa de ronda', points: rules.knockoutAdvancePoints });
  }

  const multiplier = multipliers[result.phase] ?? 1;
  let total = Math.round(base * multiplier);
  if (total < 0) total = 0; // nunca negativos

  return { base, multiplier, total, breakdown };
}

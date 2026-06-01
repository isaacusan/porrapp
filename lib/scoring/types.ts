// lib/scoring/types.ts
// Tipos del motor de puntuación de PORRAPP.

export type MatchPhase =
  | 'group'
  | 'round32'
  | 'round16'
  | 'quarter'
  | 'semi'
  | 'third_place'
  | 'final';

/** Reglas de puntuación, todas editables por el admin. */
export interface ScoringRules {
  exactPoints: number;          // resultado exacto
  signPoints: number;           // acierto de signo (ganador/empate)
  goalDiffPoints: number;       // acierto de ganador + diferencia de goles
  teamGoalsPoints: number;      // por cada equipo cuyos goles aciertes
  knockoutAdvancePoints: number;// acertar quién pasa de ronda en eliminatoria
}

export type PhaseMultipliers = Record<MatchPhase, number>;

export interface Prediction {
  homeGoals: number;
  awayGoals: number;
  advancingTeamId?: string | null; // sólo eliminatorias, ante empate a 90'
}

export interface MatchResult {
  homeGoals: number;                // a 90' en eliminatorias
  awayGoals: number;
  phase: MatchPhase;
  isKnockout: boolean;
  advancingTeamId?: string | null;  // equipo que pasó de ronda (si empate a 90')
}

export interface ScoreBreakdownItem {
  label: string;
  points: number;
}

export interface MatchScore {
  base: number;        // puntos antes del multiplicador de fase
  multiplier: number;
  total: number;       // base * multiplier (redondeado, nunca negativo)
  breakdown: ScoreBreakdownItem[]; // detalle para el historial público
}

export const DEFAULT_RULES: ScoringRules = {
  exactPoints: 5,
  signPoints: 2,
  goalDiffPoints: 3,
  teamGoalsPoints: 1,
  knockoutAdvancePoints: 2,
};

export const DEFAULT_MULTIPLIERS: PhaseMultipliers = {
  group: 1,
  round32: 1.25,
  round16: 1.5,
  quarter: 2,
  semi: 2.5,
  third_place: 2,
  final: 3,
};

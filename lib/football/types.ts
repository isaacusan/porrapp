// lib/football/types.ts
// Normalized shape that every provider maps INTO, so the sync engine never has
// to know which API the data came from.

export type MatchPhase =
  | "group"
  | "round32"
  | "round16"
  | "quarter"
  | "semi"
  | "third_place"
  | "final";

export type MatchStatus =
  | "scheduled"
  | "live"
  | "finished"
  | "postponed"
  | "cancelled";

export interface ProviderTeam {
  externalId: string; // unique within the provider
  name: string;
  shortName: string | null;
}

export interface ProviderMatch {
  externalId: string;
  utcDate: string; // ISO
  status: MatchStatus;
  phase: MatchPhase;
  matchdayName: string; // human label, e.g. "Jornada 1" / "Octavos"
  matchdayOrder: number;
  homeTeam: ProviderTeam | null; // null when not yet determined (knockout placeholders)
  awayTeam: ProviderTeam | null;
  homeScore: number | null; // 90-minute score
  awayScore: number | null;
  advancingTeamExternalId: string | null; // knockout winner, if decided
}

export interface FootballProvider {
  key: string;
  label: string;
  /** Fetch and normalize all matches for the configured competition. */
  fetchMatches(competition: string): Promise<ProviderMatch[]>;
}

/** Order offset so knockout matchdays always sort after the group stage. */
export const PHASE_ORDER: Record<MatchPhase, number> = {
  group: 0,
  round32: 100,
  round16: 101,
  quarter: 102,
  semi: 103,
  third_place: 104,
  final: 105,
};

export const PHASE_LABEL: Record<MatchPhase, string> = {
  group: "Fase de grupos",
  round32: "Dieciseisavos",
  round16: "Octavos",
  quarter: "Cuartos",
  semi: "Semifinales",
  third_place: "Tercer puesto",
  final: "Final",
};

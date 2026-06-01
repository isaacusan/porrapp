// lib/achievements/evaluate.ts
// PURE logic deciding which achievements a single player has earned, from their
// finished-match predictions. No DB. Achievements are sticky (never revoked).

export interface MatchItem {
  kickoff: string;
  matchdayId: string | null;
  resHome: number;
  resAway: number;
  predHome: number;
  predAway: number;
  points: number; // points this player got on this match (from the ledger)
}

/** Keys that this engine awards automatically (the rest are special/decorative). */
export const AUTO_KEYS = [
  "first_exact",
  "draw_king",
  "goal_prophet",
  "three_streak",
  "matchday_unbeaten",
] as const;

const sign = (h: number, a: number) => (h > a ? 1 : h < a ? -1 : 0);

export function evaluateUserAchievements(
  items: MatchItem[],
  matchdayFinishedCount: Map<string, number>,
): Set<string> {
  const earned = new Set<string>();
  if (items.length === 0) return earned;

  const exact = (i: MatchItem) => i.predHome === i.resHome && i.predAway === i.resAway;

  // first_exact — clavó al menos un marcador
  if (items.some(exact)) earned.add("first_exact");

  // draw_king — acertó >= 2 empates
  const draws = items.filter(
    (i) => sign(i.resHome, i.resAway) === 0 && sign(i.predHome, i.predAway) === 0,
  ).length;
  if (draws >= 2) earned.add("draw_king");

  // goal_prophet — acertó los goles de un equipo en >= 5 partidos
  const teamGoalHits = items.filter(
    (i) => i.predHome === i.resHome || i.predAway === i.resAway,
  ).length;
  if (teamGoalHits >= 5) earned.add("goal_prophet");

  // three_streak — 3 partidos seguidos (por fecha) puntuando
  const sorted = [...items].sort((a, b) => +new Date(a.kickoff) - +new Date(b.kickoff));
  let run = 0;
  for (const i of sorted) {
    run = i.points > 0 ? run + 1 : 0;
    if (run >= 3) {
      earned.add("three_streak");
      break;
    }
  }

  // matchday_unbeaten — puntuó en TODOS los partidos de una jornada (>=2) que predijo entera
  const byMd = new Map<string, MatchItem[]>();
  for (const i of items) {
    if (!i.matchdayId) continue;
    const arr = byMd.get(i.matchdayId) ?? [];
    arr.push(i);
    byMd.set(i.matchdayId, arr);
  }
  for (const [mdId, mdItems] of Array.from(byMd)) {
    const finished = matchdayFinishedCount.get(mdId) ?? 0;
    if (
      finished >= 2 &&
      mdItems.length === finished &&
      mdItems.every((i: MatchItem) => i.points > 0)
    ) {
      earned.add("matchday_unbeaten");
      break;
    }
  }

  return earned;
}

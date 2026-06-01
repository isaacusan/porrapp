// lib/matchday/summary.ts
import type { SupabaseClient } from "@supabase/supabase-js";

export interface MatchdaySummary {
  name: string;
  played: number;
  rows: { userId: string; points: number }[]; // sorted desc
  topPoints: number;
}

/**
 * Summarize the most recently finished matchday: each player's points that
 * matchday, sorted. Returns null if nothing has finished yet. Uses the caller's
 * (member) client — RLS already lets members read the ledger.
 */
export async function getLatestMatchdaySummary(
  supabase: SupabaseClient,
  tournamentId: string,
): Promise<MatchdaySummary | null> {
  const { data: finished } = await supabase
    .from("matches")
    .select("id, matchday_id, kickoff_at")
    .eq("tournament_id", tournamentId)
    .eq("status", "finished")
    .not("matchday_id", "is", null)
    .order("kickoff_at", { ascending: false });

  if (!finished || finished.length === 0) return null;
  const mdId = finished[0].matchday_id as string;
  const matchIds = finished.filter((m) => m.matchday_id === mdId).map((m) => m.id);

  const [{ data: md }, { data: ledger }] = await Promise.all([
    supabase.from("matchdays").select("name").eq("id", mdId).maybeSingle(),
    supabase
      .from("points_ledger")
      .select("user_id, points, match_id")
      .eq("tournament_id", tournamentId)
      .in("match_id", matchIds),
  ]);

  const sums = new Map<string, number>();
  for (const l of ledger ?? []) sums.set(l.user_id, (sums.get(l.user_id) ?? 0) + l.points);

  const rows = Array.from(sums.entries())
    .map(([userId, points]) => ({ userId, points }))
    .sort((a, b) => b.points - a.points);

  return {
    name: md?.name ?? "Última jornada",
    played: matchIds.length,
    rows,
    topPoints: rows[0]?.points ?? 0,
  };
}

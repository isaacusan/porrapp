// lib/football/sync.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { getProvider } from "./providers";
import { recalculateTournamentStandings } from "@/lib/scoring/recalculate";
import type { ProviderMatch, ProviderTeam } from "./types";

export interface SyncResult {
  ok: boolean;
  message: string;
  synced: number;
  finished: number;
}

/**
 * Pull the latest fixtures/results from the configured provider and upsert them
 * into the tournament, then recalculate the standings. Idempotent: everything is
 * keyed by `provider:externalId`, so running it repeatedly just updates rows.
 *
 * Pass a service-role client; the caller authorizes the admin / cron secret.
 */
export async function syncTournament(
  admin: SupabaseClient,
  tournament: { id: string; api_provider: string | null; api_competition: string | null },
): Promise<SyncResult> {
  const startedAt = new Date().toISOString();
  const provider = getProvider(tournament.api_provider);

  const log = (status: string, message: string, items = 0) =>
    admin.from("api_sync_logs").insert({
      tournament_id: tournament.id,
      provider: tournament.api_provider,
      status,
      message,
      items_synced: items,
      started_at: startedAt,
      finished_at: new Date().toISOString(),
    });

  if (!provider) {
    await log("error", "Proveedor no configurado o no válido.");
    return { ok: false, message: "Proveedor no configurado.", synced: 0, finished: 0 };
  }

  let matches: ProviderMatch[];
  try {
    matches = await provider.fetchMatches(tournament.api_competition ?? "");
  } catch (e: any) {
    await log("error", e?.message ?? "Error al contactar con la API.");
    return { ok: false, message: e?.message ?? "Error al contactar con la API.", synced: 0, finished: 0 };
  }

  const prefix = provider.key;
  const extTeam = (t: ProviderTeam) => `${prefix}:${t.externalId}`;
  const extMatch = (m: ProviderMatch) => `${prefix}:${m.externalId}`;

  // --- 1) Teams -------------------------------------------------------------
  const teamMap = new Map<string, ProviderTeam>();
  for (const m of matches) {
    if (m.homeTeam) teamMap.set(extTeam(m.homeTeam), m.homeTeam);
    if (m.awayTeam) teamMap.set(extTeam(m.awayTeam), m.awayTeam);
  }
  const teamRows = Array.from(teamMap.entries()).map(([ext, t]) => ({
    external_id: ext,
    name: t.name,
    short_name: t.shortName,
  }));
  const teamIdByExt = new Map<string, string>();
  if (teamRows.length) {
    const { data, error } = await admin
      .from("teams")
      .upsert(teamRows, { onConflict: "external_id" })
      .select("id, external_id");
    if (error) {
      await log("error", `Equipos: ${error.message}`);
      return { ok: false, message: "No se pudieron guardar los equipos.", synced: 0, finished: 0 };
    }
    for (const row of data ?? []) teamIdByExt.set(row.external_id, row.id);
    await admin.from("tournament_teams").upsert(
      (data ?? []).map((r) => ({ tournament_id: tournament.id, team_id: r.id })),
      { onConflict: "tournament_id,team_id", ignoreDuplicates: true },
    );
  }

  // --- 2) Matchdays ---------------------------------------------------------
  const mdMap = new Map<string, { phase: string; order: number }>();
  for (const m of matches) {
    if (!mdMap.has(m.matchdayName))
      mdMap.set(m.matchdayName, { phase: m.phase, order: m.matchdayOrder });
  }
  const mdRows = Array.from(mdMap.entries()).map(([name, v]) => ({
    tournament_id: tournament.id,
    name,
    phase: v.phase,
    order_index: v.order,
  }));
  const mdIdByName = new Map<string, string>();
  if (mdRows.length) {
    const { data, error } = await admin
      .from("matchdays")
      .upsert(mdRows, { onConflict: "tournament_id,name" })
      .select("id, name");
    if (error) {
      await log("error", `Jornadas: ${error.message}`);
      return { ok: false, message: "No se pudieron guardar las jornadas.", synced: 0, finished: 0 };
    }
    for (const row of data ?? []) mdIdByName.set(row.name, row.id);
  }

  // --- 3) Matches -----------------------------------------------------------
  let finished = 0;
  const matchRows = matches.map((m) => {
    if (m.status === "finished") finished++;
    const homeId = m.homeTeam ? teamIdByExt.get(extTeam(m.homeTeam)) ?? null : null;
    const awayId = m.awayTeam ? teamIdByExt.get(extTeam(m.awayTeam)) ?? null : null;
    const advId =
      m.advancingTeamExternalId
        ? teamIdByExt.get(`${prefix}:${m.advancingTeamExternalId}`) ?? null
        : null;
    return {
      tournament_id: tournament.id,
      external_id: extMatch(m),
      matchday_id: mdIdByName.get(m.matchdayName) ?? null,
      phase: m.phase,
      home_team_id: homeId,
      away_team_id: awayId,
      kickoff_at: m.utcDate,
      status: m.status,
      home_score: m.homeScore,
      away_score: m.awayScore,
      advancing_team_id: advId,
      finished_at: m.status === "finished" ? new Date().toISOString() : null,
    };
  });

  if (matchRows.length) {
    const { error } = await admin
      .from("matches")
      .upsert(matchRows, { onConflict: "tournament_id,external_id" });
    if (error) {
      await log("error", `Partidos: ${error.message}`);
      return { ok: false, message: "No se pudieron guardar los partidos.", synced: 0, finished: 0 };
    }
  }

  // --- 4) Re-score ----------------------------------------------------------
  try {
    await recalculateTournamentStandings(admin, tournament.id);
  } catch {
    /* non-fatal: scores are saved; standings will catch up on the next run */
  }

  await log("success", `OK: ${matchRows.length} partidos (${finished} jugados).`, matchRows.length);
  return {
    ok: true,
    message: `${matchRows.length} partidos sincronizados (${finished} con resultado).`,
    synced: matchRows.length,
    finished,
  };
}

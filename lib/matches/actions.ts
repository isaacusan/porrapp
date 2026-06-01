"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { recalculateTournamentStandings } from "@/lib/scoring/recalculate";
import { resolveGeneralQuestions } from "@/lib/scoring/resolveQuestions";
import { logAudit } from "@/lib/admin/audit";
import { predictionSchema, resultSchema } from "./validation";
import type { ActionState } from "@/lib/auth/actions";

export type { ActionState };

/** Confirm the current user is an admin of the tournament. */
async function assertAdmin(
  supabase: ReturnType<typeof createClient>,
  tournamentId: string,
  userId: string,
) {
  const { data } = await supabase
    .from("tournament_members")
    .select("role")
    .eq("tournament_id", tournamentId)
    .eq("user_id", userId)
    .single();
  return data?.role === "admin";
}

/** Has this match's prediction window closed? Mirrors the DB's match_has_started. */
function isClosed(match: {
  locked: boolean;
  status: string;
  kickoff_at: string;
}) {
  return (
    match.locked ||
    match.status === "live" ||
    match.status === "finished" ||
    new Date(match.kickoff_at).getTime() <= Date.now()
  );
}

// ---------------------------------------------------------------------------
// SAVE PREDICTION (create or update). The database is the final authority:
// RLS refuses any write to a match that has already started.
// ---------------------------------------------------------------------------
export async function savePredictionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = predictionSchema.safeParse({
    matchId: String(formData.get("matchId") ?? ""),
    homeGoals: formData.get("homeGoals"),
    awayGoals: formData.get("awayGoals"),
    advancingTeamId: String(formData.get("advancingTeamId") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, message: "Revisa los goles: deben ser números enteros." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Read the match through RLS — only a member of its tournament can see it.
  // This also gives us the authoritative tournament_id (don't trust the client).
  const { data: match } = await supabase
    .from("matches")
    .select(
      "id, tournament_id, phase, status, kickoff_at, locked, home_team_id, away_team_id",
    )
    .eq("id", parsed.data.matchId)
    .maybeSingle();

  if (!match) {
    return { ok: false, message: "No tienes acceso a este partido." };
  }
  if (isClosed(match)) {
    return {
      ok: false,
      message: "Este partido ya ha empezado. Las predicciones están cerradas.",
    };
  }

  // Validate the advancing team for knockout matches.
  let advancing: string | null = null;
  if (match.phase !== "group" && parsed.data.advancingTeamId) {
    if (
      parsed.data.advancingTeamId !== match.home_team_id &&
      parsed.data.advancingTeamId !== match.away_team_id
    ) {
      return { ok: false, message: "El equipo que pasa no es válido." };
    }
    advancing = parsed.data.advancingTeamId;
  }

  const { error } = await supabase.from("match_predictions").upsert(
    {
      tournament_id: match.tournament_id,
      match_id: match.id,
      user_id: user.id,
      home_goals: parsed.data.homeGoals,
      away_goals: parsed.data.awayGoals,
      advancing_team_id: advancing,
      is_auto: false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "match_id,user_id" },
  );

  if (error) {
    return {
      ok: false,
      message: "No se pudo guardar tu predicción. Inténtalo de nuevo.",
    };
  }

  revalidatePath(`/t/${match.tournament_id}/partidos`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// LOAD MOCK WORLD CUP (admin only). Lets the admin fill a brand-new tournament
// with example matches and questions so everyone can start predicting before
// the real football API is wired up.
// ---------------------------------------------------------------------------
export async function loadMockWorldCupAction(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  if (!tournamentId) redirect("/dashboard");

  const supabase = createClient();
  const { error } = await supabase.rpc("seed_mock_world_cup", {
    p_tournament: tournamentId,
  });

  // The function itself enforces admin-only and "no duplicates".
  if (error) {
    redirect(`/t/${tournamentId}?error=mock_failed`);
  }

  revalidatePath(`/t/${tournamentId}`);
  revalidatePath(`/t/${tournamentId}/partidos`);
  redirect(`/t/${tournamentId}/partidos`);
}

// ---------------------------------------------------------------------------
// ENTER / UPDATE A MATCH RESULT (admin only) -> marks finished and re-scores.
// Basic version lives here because scoring needs results; the full admin panel
// (audit log, CSV export, bans...) comes in a later phase.
// ---------------------------------------------------------------------------
export async function enterResultAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resultSchema.safeParse({
    matchId: String(formData.get("matchId") ?? ""),
    homeScore: formData.get("homeScore"),
    awayScore: formData.get("awayScore"),
    advancingTeamId: String(formData.get("advancingTeamId") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, message: "Revisa el resultado: deben ser números enteros." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: match } = await supabase
    .from("matches")
    .select("id, tournament_id, phase, home_team_id, away_team_id")
    .eq("id", parsed.data.matchId)
    .maybeSingle();
  if (!match) return { ok: false, message: "Partido no encontrado." };

  if (!(await assertAdmin(supabase, match.tournament_id, user.id))) {
    return { ok: false, message: "Solo el admin puede meter resultados." };
  }

  let advancing: string | null = null;
  if (match.phase !== "group" && parsed.data.advancingTeamId) {
    if (
      parsed.data.advancingTeamId !== match.home_team_id &&
      parsed.data.advancingTeamId !== match.away_team_id
    ) {
      return { ok: false, message: "El equipo que pasa no es válido." };
    }
    advancing = parsed.data.advancingTeamId;
  }

  const { error: updErr } = await supabase
    .from("matches")
    .update({
      home_score: parsed.data.homeScore,
      away_score: parsed.data.awayScore,
      advancing_team_id: advancing,
      status: "finished",
      finished_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", match.id);

  if (updErr) {
    return { ok: false, message: "No se pudo guardar el resultado." };
  }

  // Re-score with the privileged client (writing the ledger bypasses RLS).
  try {
    const admin = createAdminClient();
    await recalculateTournamentStandings(admin, match.tournament_id);
    await logAudit(admin, {
      tournamentId: match.tournament_id,
      actorUserId: user.id,
      action: "result_entered",
      entity: "match",
      entityId: match.id,
      details: { home: parsed.data.homeScore, away: parsed.data.awayScore },
    });
  } catch {
    return {
      ok: false,
      message: "Resultado guardado, pero no se pudo recalcular la clasificación.",
    };
  }

  revalidatePath(`/t/${match.tournament_id}/partidos`);
  revalidatePath(`/t/${match.tournament_id}/clasificacion`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// MANUAL RECALCULATION (admin only) — handy after changing the scoring rules.
// ---------------------------------------------------------------------------
export async function recalcAction(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  if (!tournamentId) redirect("/dashboard");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (await assertAdmin(supabase, tournamentId, user.id)) {
    try {
      const admin = createAdminClient();
      await recalculateTournamentStandings(admin, tournamentId);
      await resolveGeneralQuestions(admin, tournamentId);
      await logAudit(admin, {
        tournamentId,
        actorUserId: user.id,
        action: "recalculated",
      });
    } catch {
      /* surfaced as no change; ranking page will show current state */
    }
  }

  revalidatePath(`/t/${tournamentId}/clasificacion`);
  redirect(`/t/${tournamentId}/clasificacion`);
}

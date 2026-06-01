"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveGeneralQuestions } from "@/lib/scoring/resolveQuestions";
import { logAudit } from "@/lib/admin/audit";
import type { ActionState } from "@/lib/auth/actions";
import type { QuestionType, AnswerJson } from "@/lib/scoring/scoreQuestion";

export type { ActionState };

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

/** Build the answer/solution JSON from the submitted form value(s). */
function buildAnswerJson(
  type: QuestionType,
  single: string,
  multi: string[],
): AnswerJson | null {
  switch (type) {
    case "team":
      return single ? { team_id: single } : null;
    case "player":
      return single ? { player_id: single } : null;
    case "number":
      return single !== "" && !Number.isNaN(Number(single))
        ? { value: Number(single) }
        : null;
    case "team_ordered":
      return multi.length ? { team_ids: multi } : null;
    case "player_multi":
      return multi.length ? { player_ids: multi } : null;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// SAVE ANSWER (member; editable until questions lock)
// ---------------------------------------------------------------------------
export async function saveAnswerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const questionId = String(formData.get("questionId") ?? "");
  const single = String(formData.get("value") ?? "");
  const multi = formData.getAll("value").map(String).filter(Boolean);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: q } = await supabase
    .from("general_questions")
    .select("id, type, tournament_id")
    .eq("id", questionId)
    .maybeSingle();
  if (!q) return { ok: false, message: "Pregunta no encontrada." };

  const answer = buildAnswerJson(q.type as QuestionType, single, multi);
  if (!answer) return { ok: false, message: "Elige una respuesta válida." };

  const { error } = await supabase.from("general_answers").upsert(
    {
      tournament_id: q.tournament_id,
      question_id: q.id,
      user_id: user.id,
      answer,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "question_id,user_id" },
  );

  if (error) {
    return {
      ok: false,
      message: /closed|policy/i.test(error.message)
        ? "Las preguntas ya están cerradas."
        : "No se pudo guardar tu respuesta.",
    };
  }

  revalidatePath(`/t/${q.tournament_id}/preguntas`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// LOCK / UNLOCK answering (admin)
// ---------------------------------------------------------------------------
export async function setQuestionsLockAction(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const lock = String(formData.get("lock") ?? "") === "true";

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (await assertAdmin(supabase, tournamentId, user.id)) {
    await supabase
      .from("tournaments")
      .update({ questions_locked_at: lock ? new Date().toISOString() : null })
      .eq("id", tournamentId);
  }

  revalidatePath(`/t/${tournamentId}/preguntas`);
  redirect(`/t/${tournamentId}/preguntas`);
}

// ---------------------------------------------------------------------------
// RESOLVE a question (admin): set the correct answer + re-score
// ---------------------------------------------------------------------------
export async function resolveQuestionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const questionId = String(formData.get("questionId") ?? "");
  const single = String(formData.get("value") ?? "");
  const multi = formData.getAll("value").map(String).filter(Boolean);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: q } = await supabase
    .from("general_questions")
    .select("id, type, tournament_id")
    .eq("id", questionId)
    .maybeSingle();
  if (!q) return { ok: false, message: "Pregunta no encontrada." };

  if (!(await assertAdmin(supabase, q.tournament_id, user.id))) {
    return { ok: false, message: "Solo el admin puede resolver preguntas." };
  }

  const correct = buildAnswerJson(q.type as QuestionType, single, multi);
  if (!correct) return { ok: false, message: "Elige la respuesta correcta." };

  const { error } = await supabase
    .from("general_questions")
    .update({ correct_answer: correct, resolved: true })
    .eq("id", q.id);
  if (error) return { ok: false, message: "No se pudo resolver la pregunta." };

  try {
    const admin = createAdminClient();
    await resolveGeneralQuestions(admin, q.tournament_id);
    await logAudit(admin, {
      tournamentId: q.tournament_id,
      actorUserId: user.id,
      action: "question_resolved",
      entity: "question",
      entityId: q.id,
    });
  } catch {
    return { ok: false, message: "Resuelta, pero falló el recálculo de puntos." };
  }

  revalidatePath(`/t/${q.tournament_id}/preguntas`);
  revalidatePath(`/t/${q.tournament_id}/clasificacion`);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// CREATE a question (admin)
// ---------------------------------------------------------------------------
export async function createQuestionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const prompt = String(formData.get("prompt") ?? "").trim();
  const type = String(formData.get("type") ?? "") as QuestionType;
  const points = Number(formData.get("points") ?? 5);

  if (prompt.length < 5) {
    return { ok: false, message: "Escribe una pregunta más larga." };
  }
  const validTypes: QuestionType[] = [
    "team",
    "player",
    "number",
    "team_ordered",
    "player_multi",
  ];
  if (!validTypes.includes(type)) {
    return { ok: false, message: "Tipo de pregunta no válido." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!(await assertAdmin(supabase, tournamentId, user.id))) {
    return { ok: false, message: "Solo el admin puede crear preguntas." };
  }

  const { error } = await supabase.from("general_questions").insert({
    tournament_id: tournamentId,
    type,
    prompt,
    points: Number.isFinite(points) ? Math.max(1, Math.min(50, points)) : 5,
  });
  if (error) return { ok: false, message: "No se pudo crear la pregunta." };

  revalidatePath(`/t/${tournamentId}/preguntas`);
  return { ok: true };
}

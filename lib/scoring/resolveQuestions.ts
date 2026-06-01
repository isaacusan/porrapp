import type { SupabaseClient } from "@supabase/supabase-js";
import { scoreQuestion, type QuestionType, type AnswerJson } from "./scoreQuestion";

/**
 * Recompute the QUESTION portion of a tournament's points ledger.
 *
 * For every RESOLVED question (one with a correct answer set), it scores each
 * member's answer with the pure `scoreQuestion` engine and rewrites the
 * `source='question'` ledger rows. Idempotent. Pass a service-role client; the
 * caller must have verified the requester is the admin.
 *
 * The ranking RPC already sums every ledger source, so once these rows exist
 * the question points show up in the standings automatically.
 */
export async function resolveGeneralQuestions(
  supabase: SupabaseClient,
  tournamentId: string,
): Promise<{ questionsScored: number; ledgerRows: number }> {
  const { data: questions } = await supabase
    .from("general_questions")
    .select("id, type, prompt, points, correct_answer, resolved")
    .eq("tournament_id", tournamentId)
    .eq("resolved", true)
    .not("correct_answer", "is", null);

  const resolved = questions ?? [];

  // Always clear stale question rows first.
  await supabase
    .from("points_ledger")
    .delete()
    .eq("tournament_id", tournamentId)
    .eq("source", "question");

  if (resolved.length === 0) return { questionsScored: 0, ledgerRows: 0 };

  const qIds = resolved.map((q) => q.id);
  const { data: answers } = await supabase
    .from("general_answers")
    .select("question_id, user_id, answer")
    .in("question_id", qIds);

  const qById = new Map(resolved.map((q) => [q.id, q]));

  const rows = (answers ?? []).map((ans) => {
    const q = qById.get(ans.question_id)!;
    const score = scoreQuestion(
      q.type as QuestionType,
      ans.answer as AnswerJson,
      q.correct_answer as AnswerJson,
      q.points,
    );
    return {
      tournament_id: tournamentId,
      user_id: ans.user_id,
      source: "question" as const,
      question_id: ans.question_id,
      points: score.points,
      breakdown: [{ label: q.prompt, points: score.points }],
      note: score.status,
    };
  });

  if (rows.length > 0) {
    const { error } = await supabase.from("points_ledger").insert(rows);
    if (error) throw new Error(`No se pudieron guardar los puntos: ${error.message}`);
  }

  return { questionsScored: resolved.length, ledgerRows: rows.length };
}

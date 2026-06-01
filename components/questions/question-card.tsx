"use client";

import { type ReactNode } from "react";
import { useFormState } from "react-dom";
import {
  saveAnswerAction,
  resolveQuestionAction,
  type ActionState,
} from "@/lib/questions/actions";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/auth/form-bits";
import type { Question, TeamOption, PlayerOption } from "@/lib/questions/types";
import type { AnswerJson } from "@/lib/scoring/scoreQuestion";
import { CheckCircle2, ChevronDown, ShieldCheck, XCircle } from "lucide-react";

const initial: ActionState = {};

const selectCls =
  "h-12 w-full rounded-xl border-2 border-input bg-card px-3 text-base focus-visible:border-primary focus-visible:outline-none";

function Picker({
  type,
  teamOptions,
  playerOptions,
  defaultValue,
}: {
  type: Question["type"];
  teamOptions: TeamOption[];
  playerOptions: PlayerOption[];
  defaultValue?: string;
}) {
  if (type === "team") {
    return (
      <select name="value" defaultValue={defaultValue ?? ""} className={selectCls}>
        <option value="">Elige un equipo…</option>
        {teamOptions.map((t) => (
          <option key={t.id} value={t.id}>
            {t.flag_url} {t.name}
          </option>
        ))}
      </select>
    );
  }
  if (type === "player") {
    return (
      <select name="value" defaultValue={defaultValue ?? ""} className={selectCls}>
        <option value="">Elige un jugador…</option>
        {playerOptions.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    );
  }
  // number
  return (
    <input
      type="number"
      name="value"
      inputMode="numeric"
      defaultValue={defaultValue ?? ""}
      placeholder="Tu respuesta"
      className={selectCls}
    />
  );
}

export function QuestionCard({
  question,
  teamOptions,
  playerOptions,
  myAnswer,
  closed,
  isAdmin,
  reveal,
  revealCount,
  myAnswerLabel,
  correctAnswerLabel,
  myResult,
}: {
  question: Question;
  teamOptions: TeamOption[];
  playerOptions: PlayerOption[];
  myAnswer?: AnswerJson;
  closed: boolean;
  isAdmin: boolean;
  reveal?: ReactNode;
  revealCount?: number;
  myAnswerLabel: ReactNode;
  correctAnswerLabel?: ReactNode;
  myResult?: { points: number; status: string } | null;
}) {
  const [aState, answerAction] = useFormState(saveAnswerAction, initial);
  const [rState, resolveAction] = useFormState(resolveQuestionAction, initial);

  const def =
    question.type === "team"
      ? myAnswer?.team_id ?? ""
      : question.type === "player"
        ? myAnswer?.player_id ?? ""
        : myAnswer?.value != null
          ? String(myAnswer.value)
          : "";

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold leading-snug">{question.prompt}</h3>
        <span className="shrink-0 rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-bold text-gold-foreground">
          {question.points} pts
        </span>
      </div>

      {/* Answering (open) */}
      {!closed ? (
        <form action={answerAction} className="space-y-2">
          <input type="hidden" name="questionId" value={question.id} />
          <Picker
            type={question.type}
            teamOptions={teamOptions}
            playerOptions={playerOptions}
            defaultValue={def}
          />
          {aState.message && !aState.ok && (
            <Alert variant="error">{aState.message}</Alert>
          )}
          <div className="flex items-center justify-between">
            {aState.ok ? (
              <span className="text-sm font-semibold text-pitch">¡Guardado! ✓</span>
            ) : myAnswer ? (
              <span className="text-xs text-muted-foreground">
                Puedes cambiarla hasta el cierre
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Sin responder</span>
            )}
            <SubmitButton size="sm" variant={myAnswer ? "outline" : "default"}>
              {myAnswer ? "Cambiar" : "Responder"}
            </SubmitButton>
          </div>
        </form>
      ) : (
        // Closed
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-xl bg-secondary px-3 py-2 text-sm">
            <span className="text-muted-foreground">Tu respuesta</span>
            <span className="font-semibold">{myAnswerLabel}</span>
          </div>

          {question.resolved && (
            <>
              <div className="flex items-center justify-between rounded-xl bg-pitch/10 px-3 py-2 text-sm">
                <span className="font-semibold text-pitch-dark">Correcta</span>
                <span className="font-semibold">{correctAnswerLabel}</span>
              </div>
              {myResult && (
                <div className="flex items-center justify-center gap-1.5 text-sm font-semibold">
                  {myResult.status === "correct" ? (
                    <CheckCircle2 className="size-4 text-pitch" />
                  ) : myResult.status === "partial" ? (
                    <CheckCircle2 className="size-4 text-gold" />
                  ) : (
                    <XCircle className="size-4 text-muted-foreground" />
                  )}
                  {myResult.points > 0
                    ? `+${myResult.points} pts`
                    : "Sin puntos"}
                </div>
              )}
            </>
          )}

          {reveal && (
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-center gap-1 py-1 text-sm font-semibold text-primary">
                Ver respuestas de todos
                {typeof revealCount === "number" && ` (${revealCount})`}
                <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
              </summary>
              <div className="mt-1">{reveal}</div>
            </details>
          )}
        </div>
      )}

      {/* Admin: resolve */}
      {isAdmin && (
        <details className="group mt-2 rounded-xl border border-gold/40 bg-gold/5">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gold-foreground">
            <ShieldCheck className="size-4" />
            Admin: {question.resolved ? "cambiar respuesta correcta" : "resolver"}
          </summary>
          <form action={resolveAction} className="space-y-2 p-3 pt-0">
            <input type="hidden" name="questionId" value={question.id} />
            <Picker
              type={question.type}
              teamOptions={teamOptions}
              playerOptions={playerOptions}
              defaultValue={
                question.type === "team"
                  ? question.correct_answer?.team_id ?? ""
                  : question.type === "player"
                    ? question.correct_answer?.player_id ?? ""
                    : question.correct_answer?.value != null
                      ? String(question.correct_answer.value)
                      : ""
              }
            />
            {rState.message && (
              <Alert variant={rState.ok ? "success" : "error"}>
                {rState.ok ? "Resuelta y puntos actualizados ✓" : rState.message}
              </Alert>
            )}
            <SubmitButton size="sm" variant="gold" className="w-full">
              Guardar respuesta correcta
            </SubmitButton>
          </form>
        </details>
      )}
    </div>
  );
}

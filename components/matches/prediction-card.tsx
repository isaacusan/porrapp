"use client";

import { useState, type ReactNode } from "react";
import { useFormState } from "react-dom";
import { savePredictionAction, type ActionState } from "@/lib/matches/actions";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/auth/form-bits";
import { TeamBadge, MatchStatusPill } from "./team-badge";
import { LocalDateTime } from "./local-datetime";
import type { MatchRow, Team, Prediction } from "@/lib/matches/types";
import { Lock, ChevronDown } from "lucide-react";

const initial: ActionState = {};

export function PredictionCard({
  match,
  home,
  away,
  myPrediction,
  started,
  finished,
  reveal,
  revealCount,
}: {
  match: MatchRow;
  home?: Team;
  away?: Team;
  myPrediction?: Prediction;
  started: boolean;
  finished: boolean;
  reveal?: ReactNode;
  revealCount?: number;
}) {
  const [state, formAction] = useFormState(savePredictionAction, initial);
  const isKnockout = match.phase !== "group";
  const [advancing, setAdvancing] = useState(
    myPrediction?.advancing_team_id ?? "",
  );

  const header = (
    <div className="mb-3 flex items-center justify-between text-xs font-semibold text-muted-foreground">
      <LocalDateTime iso={match.kickoff_at} />
      {finished || match.status === "live" ? (
        <MatchStatusPill status={match.status} />
      ) : started ? (
        <span className="inline-flex items-center gap-1">
          <Lock className="size-3" /> Cerrado
        </span>
      ) : null}
    </div>
  );

  // -------- READ-ONLY (match started or finished) --------
  if (started) {
    return (
      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        {header}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <TeamBadge team={home} />
          <div className="text-center font-display text-3xl tabular-nums">
            {finished ? (
              <>
                {match.home_score}
                <span className="mx-1 text-muted-foreground">–</span>
                {match.away_score}
              </>
            ) : (
              <span className="text-muted-foreground">vs</span>
            )}
          </div>
          <TeamBadge team={away} align="right" />
        </div>

        <div className="mt-3 rounded-xl bg-secondary px-3 py-2 text-center text-sm">
          {myPrediction ? (
            <>
              Tu porra:{" "}
              <span className="font-display text-base">
                {myPrediction.home_goals}–{myPrediction.away_goals}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">No predijiste este partido</span>
          )}
        </div>

        {reveal && (
          <details className="group mt-2">
            <summary className="flex cursor-pointer list-none items-center justify-center gap-1 py-1.5 text-sm font-semibold text-primary">
              Ver la porra de todos
              {typeof revealCount === "number" && ` (${revealCount})`}
              <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-1">{reveal}</div>
          </details>
        )}
      </div>
    );
  }

  // -------- EDITABLE (match not started) --------
  return (
    <form
      action={formAction}
      className="rounded-2xl border border-border bg-card p-4 shadow-card"
    >
      {header}
      <input type="hidden" name="matchId" value={match.id} />
      {isKnockout && (
        <input type="hidden" name="advancingTeamId" value={advancing} />
      )}

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <TeamBadge team={home} className="min-w-0" />
        <div className="flex items-center gap-1.5">
          <Input
            name="homeGoals"
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            defaultValue={myPrediction?.home_goals ?? ""}
            aria-label={`Goles de ${home?.name ?? "local"}`}
            className="h-12 w-12 px-0 text-center font-display text-2xl"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            name="awayGoals"
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            defaultValue={myPrediction?.away_goals ?? ""}
            aria-label={`Goles de ${away?.name ?? "visitante"}`}
            className="h-12 w-12 px-0 text-center font-display text-2xl"
          />
        </div>
        <TeamBadge team={away} align="right" className="min-w-0" />
      </div>

      {isKnockout && (
        <div className="mt-3">
          <p className="mb-1.5 text-center text-xs font-semibold text-muted-foreground">
            Si hay empate, ¿quién pasa?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[home, away].map((t) =>
              t ? (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setAdvancing(t.id)}
                  aria-pressed={advancing === t.id}
                  className={`rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-colors ${
                    advancing === t.id
                      ? "border-primary bg-pitch/10"
                      : "border-input hover:bg-secondary"
                  }`}
                >
                  {t.flag_url} {t.short_name || t.name}
                </button>
              ) : null,
            )}
          </div>
        </div>
      )}

      {state.message && !state.ok && (
        <Alert variant="error" className="mt-3">
          {state.message}
        </Alert>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        {state.ok ? (
          <span className="text-sm font-semibold text-pitch">¡Guardado! ✓</span>
        ) : myPrediction ? (
          <span className="text-xs text-muted-foreground">
            Puedes cambiarla hasta el inicio
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Aún sin predecir</span>
        )}
        <SubmitButton size="sm" variant={myPrediction ? "outline" : "default"}>
          {myPrediction ? "Actualizar" : "Guardar"}
        </SubmitButton>
      </div>
    </form>
  );
}

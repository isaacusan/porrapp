"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { enterResultAction, type ActionState } from "@/lib/matches/actions";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/auth/form-bits";
import type { MatchRow, Team } from "@/lib/matches/types";
import { ShieldCheck } from "lucide-react";

const initial: ActionState = {};

export function AdminResultForm({
  match,
  home,
  away,
}: {
  match: MatchRow;
  home?: Team;
  away?: Team;
}) {
  const [state, formAction] = useFormState(enterResultAction, initial);
  const isKnockout = match.phase !== "group";
  const [advancing, setAdvancing] = useState(match.advancing_team_id ?? "");

  return (
    <details className="group mt-2 rounded-xl border border-gold/40 bg-gold/5">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gold-foreground">
        <ShieldCheck className="size-4" />
        Admin: {match.status === "finished" ? "editar resultado" : "meter resultado"}
      </summary>
      <form action={formAction} className="space-y-3 p-3 pt-0">
        <input type="hidden" name="matchId" value={match.id} />
        {isKnockout && (
          <input type="hidden" name="advancingTeamId" value={advancing} />
        )}
        <div className="flex items-center justify-center gap-2">
          <span className="text-xl">{home?.flag_url}</span>
          <Input
            name="homeScore"
            type="number"
            min={0}
            max={99}
            defaultValue={match.home_score ?? ""}
            aria-label="Goles local (resultado)"
            className="h-11 w-12 px-0 text-center font-display text-xl"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            name="awayScore"
            type="number"
            min={0}
            max={99}
            defaultValue={match.away_score ?? ""}
            aria-label="Goles visitante (resultado)"
            className="h-11 w-12 px-0 text-center font-display text-xl"
          />
          <span className="text-xl">{away?.flag_url}</span>
        </div>

        {isKnockout && (
          <div className="grid grid-cols-2 gap-2">
            {[home, away].map((t) =>
              t ? (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setAdvancing(t.id)}
                  aria-pressed={advancing === t.id}
                  className={`rounded-lg border-2 px-2 py-1.5 text-xs font-semibold ${
                    advancing === t.id
                      ? "border-primary bg-pitch/10"
                      : "border-input"
                  }`}
                >
                  Pasa {t.short_name || t.name}
                </button>
              ) : null,
            )}
          </div>
        )}

        {state.message && (
          <Alert variant={state.ok ? "success" : "error"}>
            {state.ok ? "Resultado guardado y clasificación recalculada ✓" : state.message}
          </Alert>
        )}

        <SubmitButton size="sm" variant="gold" className="w-full">
          Guardar resultado
        </SubmitButton>
      </form>
    </details>
  );
}

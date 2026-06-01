"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { usePowerupAction, type ActionState } from "@/lib/powerups/actions";
import { useTargetFor, POWERUP_EMOJI, RARITY_STYLE, RARITY_LABEL } from "@/lib/powerups/catalog";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/auth/form-bits";
import { cn } from "@/lib/utils";

const initial: ActionState = {};
const sel =
  "h-11 w-full rounded-xl border-2 border-input bg-card px-3 text-sm focus-visible:border-primary focus-visible:outline-none";

export type UpcomingMatch = {
  id: string;
  label: string;
  homeName: string;
  awayName: string;
};

export function PowerupInventoryCard({
  inventoryId,
  powerupKey,
  name,
  description,
  rarity,
  effectType,
  matches,
  members,
}: {
  inventoryId: string;
  powerupKey: string;
  name: string;
  description: string;
  rarity: string;
  effectType: string;
  matches: UpcomingMatch[];
  members: { user_id: string; display_name: string }[];
}) {
  const [state, action] = useFormState(usePowerupAction, initial);
  const [matchId, setMatchId] = useState("");
  const need = useTargetFor(effectType);
  const selectedMatch = matches.find((m) => m.id === matchId);

  if (state.ok) {
    return (
      <div className="animate-pop-in rounded-2xl border border-pitch/40 bg-pitch/5 p-4 text-center">
        <div className="text-3xl">{POWERUP_EMOJI[powerupKey] ?? "✨"}</div>
        <p className="mt-1 font-semibold text-pitch-dark">¡{name} activado!</p>
        <p className="text-sm text-muted-foreground">
          Su efecto se aplicará al puntuar el partido.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-start gap-3">
        <span className="text-3xl">{POWERUP_EMOJI[powerupKey] ?? "✨"}</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{name}</h3>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-bold",
                RARITY_STYLE[rarity],
              )}
            >
              {RARITY_LABEL[rarity]}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <details className="group mt-2">
        <summary className="flex cursor-pointer list-none items-center justify-center rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground">
          Usar powerup
        </summary>
        <form action={action} className="mt-3 space-y-2">
          <input type="hidden" name="inventoryId" value={inventoryId} />
          {matches.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay partidos abiertos donde usarlo ahora mismo.
            </p>
          ) : (
            <>
              <select
                name="matchId"
                value={matchId}
                onChange={(e) => setMatchId(e.target.value)}
                className={sel}
              >
                <option value="">Elige un partido…</option>
                {matches.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>

              {(need === "match_team" || need === "match_user_team") &&
                selectedMatch && (
                  <select name="side" className={sel} defaultValue="">
                    <option value="">¿A qué equipo?</option>
                    <option value="home">{selectedMatch.homeName}</option>
                    <option value="away">{selectedMatch.awayName}</option>
                  </select>
                )}

              {need === "match_user_team" && (
                <select name="targetUserId" className={sel} defaultValue="">
                  <option value="">¿A qué rival?</option>
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.display_name}
                    </option>
                  ))}
                </select>
              )}

              {state.message && !state.ok && (
                <Alert variant="error">{state.message}</Alert>
              )}

              <SubmitButton size="sm" className="w-full" disabled={!matchId}>
                Confirmar
              </SubmitButton>
            </>
          )}
        </form>
      </details>
    </div>
  );
}

"use client";

import { useFormState } from "react-dom";
import { useFormStatus } from "react-dom";
import { openChestAction, type ChestState } from "@/lib/powerups/actions";
import { POWERUP_EMOJI, RARITY_LABEL, RARITY_STYLE } from "@/lib/powerups/catalog";
import { cn } from "@/lib/utils";

const initial: ChestState = {};

function OpenButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "group relative flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-gold/50 bg-gold/10 p-6 transition-transform",
        pending ? "animate-pulse" : "hover:-translate-y-0.5 active:translate-y-0",
      )}
    >
      <span className={cn("text-5xl transition-transform", !pending && "group-hover:scale-110")}>
        🎁
      </span>
      <span className="font-display text-lg text-gold-foreground">
        {pending ? "Abriendo…" : "Abrir cofre"}
      </span>
    </button>
  );
}

export function ChestCard({
  chestId,
  matchdayName,
}: {
  chestId: string;
  matchdayName: string;
}) {
  const [state, action] = useFormState(openChestAction, initial);

  if (state.ok && state.reward) {
    const r = state.reward;
    return (
      <div className="animate-pop-in rounded-2xl border-2 border-gold bg-card p-6 text-center shadow-card">
        <div className="text-5xl">{POWERUP_EMOJI[r.key] ?? "✨"}</div>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          ¡Has conseguido!
        </p>
        <h3 className="font-display text-2xl">{r.name}</h3>
        <span
          className={cn(
            "mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold",
            RARITY_STYLE[r.rarity],
          )}
        >
          {RARITY_LABEL[r.rarity]}
        </span>
        <p className="mt-2 text-sm text-muted-foreground">{r.description}</p>
      </div>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="chestId" value={chestId} />
      <OpenButton />
      <p className="mt-1 text-center text-xs text-muted-foreground">{matchdayName}</p>
      {state.message && (
        <p className="mt-1 text-center text-xs text-destructive">{state.message}</p>
      )}
    </form>
  );
}

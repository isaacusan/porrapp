"use client";

import { leaveTournamentAction } from "@/lib/tournaments/actions";
import { LogOut } from "lucide-react";

export function LeaveTournamentButton({
  tournamentId,
}: {
  tournamentId: string;
}) {
  return (
    <form
      action={leaveTournamentAction}
      onSubmit={(e) => {
        if (
          !confirm(
            "¿Seguro que quieres salir de este torneo? Podrás volver a entrar con el código.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-destructive hover:underline"
      >
        <LogOut className="size-4" />
        Salir del torneo
      </button>
    </form>
  );
}

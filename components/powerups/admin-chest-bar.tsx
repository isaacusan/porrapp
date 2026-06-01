"use client";

import { assignChestsAction } from "@/lib/powerups/actions";
import { Button } from "@/components/ui/button";
import { Gift } from "lucide-react";

export function AdminChestBar({
  tournamentId,
  matchdays,
}: {
  tournamentId: string;
  matchdays: { id: string; name: string }[];
}) {
  return (
    <div className="rounded-2xl border border-gold/40 bg-gold/5 p-4">
      <p className="font-semibold">Repartir cofres</p>
      <p className="mb-3 text-sm text-muted-foreground">
        Da un cofre a cada jugador para una jornada. Los que van por detrás en la
        clasificación tienen mejores probabilidades de powerups raros.
      </p>
      <form action={assignChestsAction} className="flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="tournamentId" value={tournamentId} />
        <select
          name="matchdayId"
          required
          defaultValue=""
          className="h-11 flex-1 rounded-xl border-2 border-input bg-card px-3 text-sm focus-visible:border-primary focus-visible:outline-none"
        >
          <option value="" disabled>
            Elige jornada…
          </option>
          {matchdays.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="gold">
          <Gift />
          Repartir
        </Button>
      </form>
    </div>
  );
}

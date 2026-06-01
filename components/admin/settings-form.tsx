"use client";

import { useFormState } from "react-dom";
import { updateSettingsAction, type ActionState } from "@/lib/admin/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/auth/form-bits";

const initial: ActionState = {};

export function SettingsForm({
  tournamentId,
  name,
  description,
  powerupsEnabled,
}: {
  tournamentId: string;
  name: string;
  description: string | null;
  powerupsEnabled: boolean;
}) {
  const [state, action] = useFormState(updateSettingsAction, initial);

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card">
      <input type="hidden" name="tournamentId" value={tournamentId} />
      <div>
        <Label htmlFor="name">Nombre del torneo</Label>
        <Input id="name" name="name" defaultValue={name} />
      </div>
      <div>
        <Label htmlFor="description">Descripción</Label>
        <Input
          id="description"
          name="description"
          defaultValue={description ?? ""}
          placeholder="Opcional"
        />
      </div>
      <label className="flex items-center gap-3 rounded-xl bg-secondary p-3">
        <input
          type="checkbox"
          name="powerupsEnabled"
          defaultChecked={powerupsEnabled}
          className="size-5 accent-pitch"
        />
        <span className="text-sm font-medium">
          Powerups activados
          <span className="block text-xs font-normal text-muted-foreground">
            Cofres y poderes para los jugadores
          </span>
        </span>
      </label>
      {state.message && (
        <Alert variant={state.ok ? "success" : "error"}>
          {state.ok ? "Ajustes guardados ✓" : state.message}
        </Alert>
      )}
      <SubmitButton>Guardar ajustes</SubmitButton>
    </form>
  );
}

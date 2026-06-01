"use client";

import { useFormState } from "react-dom";
import {
  createQuestionAction,
  setQuestionsLockAction,
  type ActionState,
} from "@/lib/questions/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/auth/form-bits";
import { Lock, Unlock, Plus } from "lucide-react";

const initial: ActionState = {};
const selectCls =
  "h-12 w-full rounded-xl border-2 border-input bg-card px-3 text-base focus-visible:border-primary focus-visible:outline-none";

export function AdminQuestionsBar({
  tournamentId,
  closed,
}: {
  tournamentId: string;
  closed: boolean;
}) {
  const [state, action] = useFormState(createQuestionAction, initial);

  return (
    <div className="space-y-3 rounded-2xl border border-gold/40 bg-gold/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-semibold">
            {closed ? "Respuestas cerradas" : "Respuestas abiertas"}
          </p>
          <p className="text-sm text-muted-foreground">
            {closed
              ? "Los jugadores ya no pueden cambiar sus respuestas."
              : "Ciérralas cuando empiece el torneo para revelar las respuestas."}
          </p>
        </div>
        <form action={setQuestionsLockAction}>
          <input type="hidden" name="tournamentId" value={tournamentId} />
          <input type="hidden" name="lock" value={(!closed).toString()} />
          <Button type="submit" variant={closed ? "outline" : "default"} size="sm">
            {closed ? <Unlock /> : <Lock />}
            {closed ? "Reabrir" : "Cerrar"}
          </Button>
        </form>
      </div>

      <details className="group">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-gold-foreground">
          <Plus className="size-4" />
          Añadir pregunta
        </summary>
        <form action={action} className="mt-3 space-y-3">
          <input type="hidden" name="tournamentId" value={tournamentId} />
          <div>
            <Label htmlFor="prompt">Pregunta</Label>
            <Input
              id="prompt"
              name="prompt"
              placeholder="¿Quién será el máximo goleador?"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="type">Tipo</Label>
              <select id="type" name="type" className={selectCls} defaultValue="team">
                <option value="team">Elegir equipo</option>
                <option value="player">Elegir jugador</option>
                <option value="number">Número</option>
              </select>
            </div>
            <div>
              <Label htmlFor="points">Puntos</Label>
              <Input
                id="points"
                name="points"
                type="number"
                min={1}
                max={50}
                defaultValue={5}
              />
            </div>
          </div>
          {state.message && (
            <Alert variant={state.ok ? "success" : "error"}>
              {state.ok ? "Pregunta añadida ✓" : state.message}
            </Alert>
          )}
          <SubmitButton size="sm" variant="gold">
            Crear pregunta
          </SubmitButton>
        </form>
      </details>
    </div>
  );
}

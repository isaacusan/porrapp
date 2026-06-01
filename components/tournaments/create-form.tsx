"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import {
  createTournamentAction,
  type ActionState,
} from "@/lib/tournaments/actions";
import { MISSING_POLICY_LABELS } from "@/lib/tournaments/validation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { AvatarPicker } from "@/components/brand/avatar";
import { SubmitButton, FieldError } from "@/components/auth/form-bits";

const initial: ActionState = {};
const POLICIES = ["zero", "auto_random", "auto_limited", "emergency_joker"] as const;

export function CreateTournamentForm({
  defaultDisplayName,
}: {
  defaultDisplayName: string;
}) {
  const [state, formAction] = useFormState(createTournamentAction, initial);
  const [avatar, setAvatar] = useState("avatar-02");
  const [policy, setPolicy] = useState<string>("zero");
  const [powerups, setPowerups] = useState(true);

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.message && !state.ok && (
        <Alert variant="error">{state.message}</Alert>
      )}

      <div>
        <Label htmlFor="name">Nombre del torneo</Label>
        <Input
          id="name"
          name="name"
          placeholder="La Porra de los Colegas 2026"
          defaultValue={state.values?.name}
          aria-invalid={!!state.fieldErrors?.name}
          autoFocus
        />
        <FieldError messages={state.fieldErrors?.name} />
      </div>

      <div>
        <Label htmlFor="description">Descripción (opcional)</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Una porra sana entre amigos. El último paga las cañas. 🍻"
          defaultValue={state.values?.description}
        />
        <FieldError messages={state.fieldErrors?.description} />
      </div>

      <hr className="border-border" />

      <div>
        <p className="text-lg font-display">Tu identidad en este torneo</p>
        <p className="mb-3 text-sm text-muted-foreground">
          Así te verán los demás. Puede ser distinto en cada porra.
        </p>
        <div className="space-y-3">
          <div>
            <Label htmlFor="displayName">Nombre visible</Label>
            <Input
              id="displayName"
              name="displayName"
              defaultValue={state.values?.displayName || defaultDisplayName}
              aria-invalid={!!state.fieldErrors?.displayName}
            />
            <FieldError messages={state.fieldErrors?.displayName} />
          </div>
          <div>
            <Label>Avatar</Label>
            <AvatarPicker value={avatar} onChange={setAvatar} />
          </div>
        </div>
      </div>

      <hr className="border-border" />

      {/* Powerups toggle */}
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          name="powerupsEnabled"
          checked={powerups}
          onChange={(e) => setPowerups(e.target.checked)}
          className="mt-1 size-5 accent-pitch"
        />
        <span>
          <span className="font-semibold">Powerups activados</span>
          <span className="block text-sm text-muted-foreground">
            Cofres y poderes estilo Mario Kart. Puedes cambiarlo luego.
          </span>
        </span>
      </label>

      {/* Missing prediction policy */}
      <div>
        <Label>Si alguien no predice un partido…</Label>
        <input type="hidden" name="missingPolicy" value={policy} />
        <div className="mt-1 space-y-2">
          {POLICIES.map((key) => {
            const opt = MISSING_POLICY_LABELS[key];
            const active = policy === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setPolicy(key)}
                aria-pressed={active}
                className={`w-full rounded-xl border-2 p-3 text-left transition-colors ${
                  active
                    ? "border-primary bg-pitch/5"
                    : "border-input hover:bg-secondary"
                }`}
              >
                <span className="font-semibold">{opt.title}</span>
                <span className="block text-sm text-muted-foreground">
                  {opt.help}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <SubmitButton size="lg" className="w-full">
        Crear torneo
      </SubmitButton>
    </form>
  );
}

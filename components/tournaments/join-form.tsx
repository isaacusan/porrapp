"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import {
  joinTournamentAction,
  type ActionState,
} from "@/lib/tournaments/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { AvatarPicker } from "@/components/brand/avatar";
import { SubmitButton, FieldError } from "@/components/auth/form-bits";

const initial: ActionState = {};

export function JoinTournamentForm({
  defaultDisplayName,
  defaultCode = "",
  lockedCode = false,
}: {
  defaultDisplayName: string;
  defaultCode?: string;
  lockedCode?: boolean;
}) {
  const [state, formAction] = useFormState(joinTournamentAction, initial);
  const [avatar, setAvatar] = useState("avatar-03");

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.message && !state.ok && (
        <Alert variant="error">{state.message}</Alert>
      )}

      <div>
        <Label htmlFor="code">Código de invitación</Label>
        <Input
          id="code"
          name="code"
          placeholder="A1B2C3D4"
          defaultValue={state.values?.code || defaultCode}
          readOnly={lockedCode}
          aria-invalid={!!state.fieldErrors?.code}
          className={`text-center font-display text-2xl uppercase tracking-widest ${
            lockedCode ? "bg-secondary" : ""
          }`}
          autoFocus={!lockedCode}
        />
        <FieldError messages={state.fieldErrors?.code} />
      </div>

      <div>
        <Label htmlFor="displayName">Tu nombre visible en este torneo</Label>
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

      <SubmitButton size="lg" className="w-full">
        Unirme al torneo
      </SubmitButton>
    </form>
  );
}

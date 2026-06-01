"use client";

import { useFormState } from "react-dom";
import { resetPasswordAction, type ActionState } from "@/lib/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { SubmitButton, FieldError } from "./form-bits";

const initial: ActionState = {};

export function ResetForm() {
  const [state, formAction] = useFormState(resetPasswordAction, initial);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="mb-2">
        <h1 className="text-3xl">Nueva contraseña</h1>
        <p className="text-sm text-muted-foreground">
          Elige una contraseña nueva para tu cuenta.
        </p>
      </div>

      {state.message && !state.ok && (
        <Alert variant="error">{state.message}</Alert>
      )}

      <div>
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          aria-invalid={!!state.fieldErrors?.password}
          autoFocus
        />
        <FieldError messages={state.fieldErrors?.password} />
      </div>

      <div>
        <Label htmlFor="confirmPassword">Repite la contraseña</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          aria-invalid={!!state.fieldErrors?.confirmPassword}
        />
        <FieldError messages={state.fieldErrors?.confirmPassword} />
      </div>

      <SubmitButton size="lg" className="w-full">
        Guardar contraseña
      </SubmitButton>
    </form>
  );
}

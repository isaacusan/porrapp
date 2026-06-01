"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { forgotAction, type ActionState } from "@/lib/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { SubmitButton, FieldError } from "./form-bits";

const initial: ActionState = {};

export function ForgotForm() {
  const [state, formAction] = useFormState(forgotAction, initial);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="mb-2">
        <h1 className="text-3xl">Recuperar acceso</h1>
        <p className="text-sm text-muted-foreground">
          Te enviaremos un enlace para crear una contraseña nueva.
        </p>
      </div>

      {state.ok && state.message && (
        <Alert variant="success">{state.message}</Alert>
      )}
      {state.message && !state.ok && (
        <Alert variant="error">{state.message}</Alert>
      )}

      <div>
        <Label htmlFor="email">Email de tu cuenta</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          defaultValue={state.values?.email}
          aria-invalid={!!state.fieldErrors?.email}
          autoFocus
        />
        <FieldError messages={state.fieldErrors?.email} />
      </div>

      <SubmitButton size="lg" className="w-full">
        Enviar enlace
      </SubmitButton>

      <p className="pt-1 text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className="font-semibold text-primary hover:underline"
        >
          Volver a iniciar sesión
        </Link>
      </p>
    </form>
  );
}

"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { loginAction, type ActionState } from "@/lib/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { SubmitButton, FieldError } from "./form-bits";

const initial: ActionState = {};

export function LoginForm({
  next,
  initialError,
}: {
  next?: string;
  initialError?: string;
}) {
  const [state, formAction] = useFormState(loginAction, initial);
  const message = state.message ?? initialError;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {message && <Alert variant="error">{message}</Alert>}

      <input type="hidden" name="next" value={next ?? ""} />

      <div>
        <Label htmlFor="identifier">Usuario o email</Label>
        <Input
          id="identifier"
          name="identifier"
          autoComplete="username"
          placeholder="tu_usuario o tu@email.com"
          defaultValue={state.values?.identifier}
          aria-invalid={!!state.fieldErrors?.identifier}
          autoFocus
        />
        <FieldError messages={state.fieldErrors?.identifier} />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <Label htmlFor="password" className="mb-0">
            Contraseña
          </Label>
          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-primary hover:underline"
          >
            ¿La olvidaste?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          aria-invalid={!!state.fieldErrors?.password}
        />
        <FieldError messages={state.fieldErrors?.password} />
      </div>

      <SubmitButton size="lg" className="w-full">
        Entrar
      </SubmitButton>

      <p className="pt-2 text-center text-sm text-muted-foreground">
        ¿Aún no tienes cuenta?{" "}
        <Link
          href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"}
          className="font-semibold text-primary hover:underline"
        >
          Regístrate
        </Link>
      </p>
    </form>
  );
}

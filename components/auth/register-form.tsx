"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormState } from "react-dom";
import { registerAction, type ActionState } from "@/lib/auth/actions";
import { usernameSchema } from "@/lib/auth/validation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { SubmitButton, FieldError } from "./form-bits";
import { Check, X } from "lucide-react";

const initial: ActionState = {};

type Availability = "idle" | "checking" | "free" | "taken" | "invalid";

export function RegisterForm({ next }: { next?: string }) {
  const [state, formAction] = useFormState(registerAction, initial);
  const [availability, setAvailability] = useState<Availability>("idle");

  let debounce: ReturnType<typeof setTimeout>;
  function onUsernameChange(value: string) {
    clearTimeout(debounce);
    const parsed = usernameSchema.safeParse(value);
    if (!parsed.success) {
      setAvailability(value.length === 0 ? "idle" : "invalid");
      return;
    }
    setAvailability("checking");
    debounce = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/username-available?u=${encodeURIComponent(parsed.data)}`,
        );
        const json = (await res.json()) as { available: boolean | null };
        if (json.available === null) setAvailability("idle");
        else setAvailability(json.available ? "free" : "taken");
      } catch {
        setAvailability("idle");
      }
    }, 450);
  }

  // Success screen (email confirmation required)
  if (state.ok && state.message) {
    return (
      <div className="space-y-4 text-center">
        <div className="text-5xl">📩</div>
        <h1 className="text-3xl">¡Revisa tu email!</h1>
        <Alert variant="success">{state.message}</Alert>
        <Link
          href="/login"
          className="inline-block font-semibold text-primary hover:underline"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="next" value={next ?? ""} />
      <div className="mb-2">
        <h1 className="text-3xl">Crea tu cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Una cuenta, todas tus porras. ⚽
        </p>
      </div>

      {state.message && !state.ok && (
        <Alert variant="error">{state.message}</Alert>
      )}

      <div>
        <Label htmlFor="username">Nombre de usuario</Label>
        <div className="relative">
          <Input
            id="username"
            name="username"
            autoComplete="username"
            placeholder="elprofetadelgol"
            defaultValue={state.values?.username}
            aria-invalid={!!state.fieldErrors?.username}
            onChange={(e) => onUsernameChange(e.target.value)}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {availability === "free" && (
              <Check className="size-5 text-pitch" />
            )}
            {availability === "taken" && <X className="size-5 text-destructive" />}
          </span>
        </div>
        {availability === "taken" && (
          <p className="mt-1 text-xs font-medium text-destructive">
            Ese nombre ya está cogido
          </p>
        )}
        {availability === "free" && (
          <p className="mt-1 text-xs font-medium text-pitch">¡Disponible!</p>
        )}
        {availability === "invalid" && (
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            3–20 caracteres: letras, números y _
          </p>
        )}
        <FieldError messages={state.fieldErrors?.username} />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="tu@email.com"
          defaultValue={state.values?.email}
          aria-invalid={!!state.fieldErrors?.email}
        />
        <FieldError messages={state.fieldErrors?.email} />
      </div>

      <div>
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          aria-invalid={!!state.fieldErrors?.password}
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
        Crear cuenta
      </SubmitButton>

      <p className="pt-1 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          className="font-semibold text-primary hover:underline"
        >
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}

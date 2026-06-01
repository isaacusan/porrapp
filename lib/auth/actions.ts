"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/url";
import {
  registerSchema,
  loginSchema,
  forgotSchema,
  resetSchema,
} from "./validation";

export type FieldErrors = Record<string, string[] | undefined>;

export type ActionState = {
  ok?: boolean;
  message?: string;
  fieldErrors?: FieldErrors;
  values?: Record<string, string>;
};

// ---------------------------------------------------------------------------
// REGISTER
// ---------------------------------------------------------------------------
export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    username: String(formData.get("username") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };
  const values = { username: raw.username, email: raw.email };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  const rawNext = String(formData.get("next") ?? "");
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  const supabase = createClient();
  const { username, email, password } = parsed.data;

  // Pre-check username availability for a friendly error (the DB also enforces it).
  const { data: available, error: rpcError } = await supabase.rpc(
    "username_available",
    { p_username: username },
  );
  if (rpcError) {
    return { ok: false, message: "No se pudo validar el usuario. Inténtalo de nuevo.", values };
  }
  if (available === false) {
    return {
      ok: false,
      fieldErrors: { username: ["Ese nombre de usuario ya está cogido"] },
      values,
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Picked up by the handle_new_user trigger to create the profile row.
      data: { username },
      emailRedirectTo: `${getBaseUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    // Most common: email already registered, or username race lost at the trigger.
    const msg = /already registered|already exists/i.test(error.message)
      ? "Ya existe una cuenta con ese email."
      : /username|profiles_username/i.test(error.message)
        ? "Ese nombre de usuario ya está cogido."
        : "No se pudo crear la cuenta. Revisa los datos e inténtalo de nuevo.";
    return { ok: false, message: msg, values };
  }

  // If email confirmation is ON in Supabase, there is no session yet.
  if (!data.session) {
    return {
      ok: true,
      message:
        "¡Casi listo! Te hemos enviado un email para confirmar tu cuenta. Ábrelo y entra a marcar tus porras. ⚽",
    };
  }

  // Email confirmation OFF -> logged in immediately.
  revalidatePath("/", "layout");
  redirect(next);
}

// ---------------------------------------------------------------------------
// LOGIN  (accepts email OR username)
// ---------------------------------------------------------------------------
export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    identifier: String(formData.get("identifier") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const next = String(formData.get("next") ?? "") || "/dashboard";
  const values = { identifier: raw.identifier };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
      values,
    };
  }

  const supabase = createClient();
  let email = parsed.data.identifier;

  // If they typed a username, resolve it to the account email.
  if (!email.includes("@")) {
    const { data: resolved } = await supabase.rpc("get_email_by_username", {
      p_username: email,
    });
    if (!resolved) {
      return { ok: false, message: "Usuario o contraseña incorrectos.", values };
    }
    email = resolved as string;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error) {
    const msg = /email not confirmed/i.test(error.message)
      ? "Tienes que confirmar tu email antes de entrar. Revisa tu bandeja."
      : "Usuario o contraseña incorrectos.";
    return { ok: false, message: msg, values };
  }

  // Only allow internal redirects to avoid open-redirect abuse.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  revalidatePath("/", "layout");
  redirect(safeNext);
}

// ---------------------------------------------------------------------------
// LOGOUT
// ---------------------------------------------------------------------------
export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

// ---------------------------------------------------------------------------
// REQUEST PASSWORD RESET  (always reports success — no email enumeration)
// ---------------------------------------------------------------------------
export async function forgotAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = { email: String(formData.get("email") ?? "") };
  const parsed = forgotSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      fieldErrors: parsed.error.flatten().fieldErrors,
      values: raw,
    };
  }

  const supabase = createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getBaseUrl()}/auth/callback?next=/reset-password`,
  });

  // Same response whether or not the email exists.
  return {
    ok: true,
    message:
      "Si ese email tiene una cuenta, te hemos enviado un enlace para restablecer la contraseña.",
  };
}

// ---------------------------------------------------------------------------
// UPDATE PASSWORD  (after clicking the recovery link)
// ---------------------------------------------------------------------------
export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };
  const parsed = resetSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      message:
        "El enlace ha caducado o no es válido. Pide uno nuevo desde 'He olvidado mi contraseña'.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return {
      ok: false,
      message: "No se pudo cambiar la contraseña. Pide un enlace nuevo e inténtalo otra vez.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

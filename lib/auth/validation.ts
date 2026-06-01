import { z } from "zod";

/** Username rules must match the DB constraint: 3–20 chars, letters/numbers/_/. */
export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Mínimo 3 caracteres")
  .max(20, "Máximo 20 caracteres")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Solo letras, números y guion bajo (_)",
  );

export const emailSchema = z
  .string()
  .trim()
  .email("Introduce un email válido");

export const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .max(72, "Máximo 72 caracteres");

export const registerSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  // Accepts either an email or a username.
  identifier: z.string().trim().min(1, "Introduce tu usuario o email"),
  password: z.string().min(1, "Introduce tu contraseña"),
});

export const forgotSchema = z.object({
  email: emailSchema,
});

export const resetSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotInput = z.infer<typeof forgotSchema>;
export type ResetInput = z.infer<typeof resetSchema>;

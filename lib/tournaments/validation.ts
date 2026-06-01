import { z } from "zod";

const displayName = z
  .string()
  .trim()
  .min(2, "Mínimo 2 caracteres")
  .max(30, "Máximo 30 caracteres");

const avatarId = z
  .string()
  .regex(/^avatar-\d{2}$/, "Avatar no válido")
  .default("avatar-01");

export const createTournamentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Ponle un nombre de al menos 3 caracteres")
    .max(60, "Máximo 60 caracteres"),
  description: z.string().trim().max(280, "Máximo 280 caracteres").optional(),
  displayName,
  avatarId,
  powerupsEnabled: z.boolean().default(true),
  missingPolicy: z
    .enum(["zero", "auto_random", "auto_limited", "emergency_joker"])
    .default("zero"),
});

export const joinTournamentSchema = z.object({
  code: z
    .string()
    .trim()
    .min(4, "El código tiene 8 caracteres")
    .max(12, "Código demasiado largo")
    .transform((s) => s.toUpperCase().replace(/\s/g, "")),
  displayName,
  avatarId,
});

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;
export type JoinTournamentInput = z.infer<typeof joinTournamentSchema>;

/** Human labels for the missing-prediction policy options. */
export const MISSING_POLICY_LABELS: Record<string, { title: string; help: string }> = {
  zero: {
    title: "0 puntos",
    help: "Si no predices un partido, te llevas un 0. Lo más sencillo.",
  },
  auto_random: {
    title: "Predicción automática",
    help: "Si te olvidas, el sistema rellena una predicción al azar por ti.",
  },
  auto_limited: {
    title: "Automática limitada",
    help: "Como la anterior, pero solo unas pocas veces por torneo.",
  },
  emergency_joker: {
    title: "Comodín de emergencia",
    help: "Reservas un comodín para salvar un partido olvidado.",
  },
};

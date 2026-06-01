import { z } from "zod";

const goals = z.coerce
  .number({ invalid_type_error: "Pon un número" })
  .int("Sin decimales")
  .min(0, "No puede ser negativo")
  .max(99, "Demasiados goles");

export const predictionSchema = z.object({
  matchId: z.string().uuid(),
  homeGoals: goals,
  awayGoals: goals,
  // Only meaningful for knockout matches; the form sends it when relevant.
  advancingTeamId: z.string().uuid().optional().or(z.literal("")),
});

export const resultSchema = z.object({
  matchId: z.string().uuid(),
  homeScore: goals,
  awayScore: goals,
  advancingTeamId: z.string().uuid().optional().or(z.literal("")),
});

export type PredictionInput = z.infer<typeof predictionSchema>;
export type ResultInput = z.infer<typeof resultSchema>;

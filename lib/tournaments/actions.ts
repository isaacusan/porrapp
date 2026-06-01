"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  createTournamentSchema,
  joinTournamentSchema,
} from "./validation";
import type { ActionState } from "@/lib/auth/actions";

export type { ActionState };

// ---------------------------------------------------------------------------
// CREATE TOURNAMENT
// A single insert; a DB trigger then sets the creator as admin and seeds the
// scoring rules, phase multipliers and powerup catalogue automatically.
// ---------------------------------------------------------------------------
export async function createTournamentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? "") || undefined,
    displayName: String(formData.get("displayName") ?? ""),
    avatarId: String(formData.get("avatarId") ?? "avatar-01"),
    powerupsEnabled: formData.get("powerupsEnabled") === "on",
    missingPolicy: String(formData.get("missingPolicy") ?? "zero"),
  };
  const values = {
    name: raw.name,
    description: raw.description ?? "",
    displayName: raw.displayName,
  };

  const parsed = createTournamentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors, values };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: created, error } = await supabase
    .from("tournaments")
    .insert({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      powerups_enabled: parsed.data.powerupsEnabled,
      missing_prediction_policy: parsed.data.missingPolicy,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !created) {
    return {
      ok: false,
      message: "No se pudo crear el torneo. Inténtalo de nuevo.",
      values,
    };
  }

  // Personalise the creator's membership (the trigger created it with defaults).
  await supabase
    .from("tournament_members")
    .update({
      display_name: parsed.data.displayName,
      avatar_id: parsed.data.avatarId,
    })
    .eq("tournament_id", created.id)
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
  redirect(`/t/${created.id}`);
}

// ---------------------------------------------------------------------------
// JOIN TOURNAMENT (by invite code)
// ---------------------------------------------------------------------------
export async function joinTournamentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    code: String(formData.get("code") ?? ""),
    displayName: String(formData.get("displayName") ?? ""),
    avatarId: String(formData.get("avatarId") ?? "avatar-01"),
  };
  const values = { code: raw.code, displayName: raw.displayName };

  const parsed = joinTournamentSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors, values };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: tournamentId, error } = await supabase.rpc(
    "join_tournament_by_code",
    { p_code: parsed.data.code, p_display_name: parsed.data.displayName },
  );

  if (error || !tournamentId) {
    const msg = /no válido|not found/i.test(error?.message ?? "")
      ? "Ese código no corresponde a ningún torneo. Revísalo."
      : /bloqueado|banned/i.test(error?.message ?? "")
        ? "No puedes unirte: has sido bloqueado en este torneo."
        : "No se pudo unir al torneo. Inténtalo de nuevo.";
    return { ok: false, message: msg, values };
  }

  // Apply the chosen avatar (the RPC set role/status/display_name).
  await supabase
    .from("tournament_members")
    .update({ avatar_id: parsed.data.avatarId })
    .eq("tournament_id", tournamentId as string)
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
  redirect(`/t/${tournamentId as string}`);
}

// ---------------------------------------------------------------------------
// LEAVE TOURNAMENT (participants only; an admin must hand over first)
// ---------------------------------------------------------------------------
export async function leaveTournamentAction(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  if (!tournamentId) redirect("/dashboard");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("tournament_members")
    .select("role")
    .eq("tournament_id", tournamentId)
    .eq("user_id", user.id)
    .single();

  // Admins can't simply leave (would orphan the tournament). Handled later in
  // the admin panel via ownership transfer.
  if (membership?.role === "admin") {
    redirect(`/t/${tournamentId}?error=admin_leave`);
  }

  await supabase
    .from("tournament_members")
    .update({ status: "left" })
    .eq("tournament_id", tournamentId)
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

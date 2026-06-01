"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncTournament } from "./sync";
import { getProvider } from "./providers";
import type { ActionState } from "@/lib/auth/actions";

export type { ActionState };

async function isAdmin(
  supabase: ReturnType<typeof createClient>,
  tournamentId: string,
  userId: string,
) {
  const { data } = await supabase
    .from("tournament_members")
    .select("role")
    .eq("tournament_id", tournamentId)
    .eq("user_id", userId)
    .single();
  return data?.role === "admin";
}

// Save provider + competition + auto-sync toggle
export async function updateSyncConfigAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const providerRaw = String(formData.get("provider") ?? "");
  const provider = providerRaw === "none" ? null : providerRaw;
  const competition = String(formData.get("competition") ?? "").trim() || null;
  const enabled = formData.get("enabled") === "on";

  if (provider && !getProvider(provider)) {
    return { ok: false, message: "Proveedor no válido." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await isAdmin(supabase, tournamentId, user.id))) {
    return { ok: false, message: "Solo el admin puede cambiar esto." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("tournaments")
    .update({
      api_provider: provider,
      api_competition: competition,
      api_sync_enabled: provider ? enabled : false,
    })
    .eq("id", tournamentId);
  if (error) return { ok: false, message: "No se pudo guardar la configuración." };

  revalidatePath(`/t/${tournamentId}/admin`);
  return { ok: true };
}

// Run a sync right now
export async function syncNowAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tournamentId = String(formData.get("tournamentId") ?? "");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await isAdmin(supabase, tournamentId, user.id))) {
    return { ok: false, message: "Solo el admin puede sincronizar." };
  }

  const admin = createAdminClient();
  const { data: tournament } = await admin
    .from("tournaments")
    .select("id, api_provider, api_competition")
    .eq("id", tournamentId)
    .single();
  if (!tournament?.api_provider) {
    return { ok: false, message: "Primero elige un proveedor de datos." };
  }

  const result = await syncTournament(admin, tournament);

  revalidatePath(`/t/${tournamentId}/admin`);
  revalidatePath(`/t/${tournamentId}/partidos`);
  revalidatePath(`/t/${tournamentId}/clasificacion`);
  return { ok: result.ok, message: result.message };
}

"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "./audit";
import type { ActionState } from "@/lib/auth/actions";

export type { ActionState };

async function getRole(
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
  return data?.role ?? null;
}

// ---------------------------------------------------------------------------
// BAN / UNBAN a member
// ---------------------------------------------------------------------------
export async function setMemberStatusAction(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const targetUserId = String(formData.get("targetUserId") ?? "");
  const status = String(formData.get("status") ?? "");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const back = `/t/${tournamentId}/admin`;
  if (!["banned", "active"].includes(status) || targetUserId === user.id) {
    redirect(back);
  }
  if ((await getRole(supabase, tournamentId, user.id)) !== "admin") redirect(back);

  // Don't ban another admin.
  const { data: target } = await supabase
    .from("tournament_members")
    .select("role")
    .eq("tournament_id", tournamentId)
    .eq("user_id", targetUserId)
    .single();
  if (!target || target.role === "admin") redirect(back);

  const admin = createAdminClient();
  await admin
    .from("tournament_members")
    .update({ status })
    .eq("tournament_id", tournamentId)
    .eq("user_id", targetUserId);

  await logAudit(admin, {
    tournamentId,
    actorUserId: user.id,
    action: status === "banned" ? "member_banned" : "member_unbanned",
    entity: "member",
    entityId: targetUserId,
  });

  revalidatePath(back);
  redirect(back);
}

// ---------------------------------------------------------------------------
// TRANSFER admin role to another member (demotes the current admin)
// ---------------------------------------------------------------------------
export async function transferAdminAction(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const targetUserId = String(formData.get("targetUserId") ?? "");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const back = `/t/${tournamentId}/admin`;
  if (!targetUserId || targetUserId === user.id) redirect(back);
  if ((await getRole(supabase, tournamentId, user.id)) !== "admin") redirect(back);

  const { data: target } = await supabase
    .from("tournament_members")
    .select("status")
    .eq("tournament_id", tournamentId)
    .eq("user_id", targetUserId)
    .single();
  if (!target || target.status !== "active") redirect(back);

  const admin = createAdminClient();
  // Promote target, then demote self (privileged client; order is safe).
  await admin
    .from("tournament_members")
    .update({ role: "admin" })
    .eq("tournament_id", tournamentId)
    .eq("user_id", targetUserId);
  await admin
    .from("tournament_members")
    .update({ role: "participant" })
    .eq("tournament_id", tournamentId)
    .eq("user_id", user.id);

  await logAudit(admin, {
    tournamentId,
    actorUserId: user.id,
    action: "admin_transferred",
    entity: "member",
    entityId: targetUserId,
  });

  revalidatePath(`/t/${tournamentId}`);
  redirect(`/t/${tournamentId}`);
}

// ---------------------------------------------------------------------------
// UPDATE tournament settings (name, description, powerups on/off)
// ---------------------------------------------------------------------------
export async function updateSettingsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const powerupsEnabled = formData.get("powerupsEnabled") === "on";

  if (name.length < 3) {
    return { ok: false, message: "El nombre debe tener al menos 3 caracteres." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if ((await getRole(supabase, tournamentId, user.id)) !== "admin") {
    return { ok: false, message: "Solo el admin puede cambiar los ajustes." };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("tournaments")
    .update({
      name,
      description: description || null,
      powerups_enabled: powerupsEnabled,
    })
    .eq("id", tournamentId);
  if (error) return { ok: false, message: "No se pudieron guardar los ajustes." };

  await logAudit(admin, {
    tournamentId,
    actorUserId: user.id,
    action: "settings_updated",
    entity: "tournament",
    entityId: tournamentId,
    details: { name, powerups_enabled: powerupsEnabled },
  });

  revalidatePath(`/t/${tournamentId}/admin`);
  revalidatePath(`/t/${tournamentId}`);
  return { ok: true };
}

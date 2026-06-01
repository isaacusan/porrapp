"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendEmail, inviteEmailHtml } from "./resend";
import { getBaseUrl } from "@/lib/url";
import type { ActionState } from "@/lib/auth/actions";

export type { ActionState };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function inviteByEmailAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!EMAIL_RE.test(email)) {
    return { ok: false, message: "Escribe un email válido." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Caller must be an active member (members can invite via the code).
  const { data: membership } = await supabase
    .from("tournament_members")
    .select("display_name, status")
    .eq("tournament_id", tournamentId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership || membership.status !== "active") {
    return { ok: false, message: "No puedes invitar a este torneo." };
  }

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("name, invite_code")
    .eq("id", tournamentId)
    .maybeSingle();
  if (!tournament) return { ok: false, message: "Torneo no encontrado." };

  const joinUrl = `${getBaseUrl()}/join/${tournament.invite_code}`;
  const result = await sendEmail({
    to: email,
    subject: `${membership.display_name} te invita a una porra`,
    html: inviteEmailHtml({
      tournamentName: tournament.name,
      joinUrl,
      inviterName: membership.display_name,
    }),
  });

  return result.ok
    ? { ok: true, message: `Invitación enviada a ${email} ✓` }
    : { ok: false, message: result.message };
}

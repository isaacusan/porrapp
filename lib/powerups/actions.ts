"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { assignPowerupChest, openChest } from "./chests";
import { useTargetFor } from "./catalog";
import { logAudit } from "@/lib/admin/audit";
import type { ActionState } from "@/lib/auth/actions";

export type { ActionState };

export type ChestState = {
  ok?: boolean;
  message?: string;
  reward?: { key: string; name: string; description: string; rarity: string };
};

async function assertAdmin(
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

function matchClosed(m: { locked: boolean; status: string; kickoff_at: string }) {
  return (
    m.locked ||
    m.status === "live" ||
    m.status === "finished" ||
    new Date(m.kickoff_at).getTime() <= Date.now()
  );
}

// ---------------------------------------------------------------------------
// ADMIN: hand out the matchday chests
// ---------------------------------------------------------------------------
export async function assignChestsAction(formData: FormData) {
  const tournamentId = String(formData.get("tournamentId") ?? "");
  const matchdayId = String(formData.get("matchdayId") ?? "");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (matchdayId && (await assertAdmin(supabase, tournamentId, user.id))) {
    try {
      const admin = createAdminClient();
      const { assigned } = await assignPowerupChest(admin, tournamentId, matchdayId);
      await logAudit(admin, {
        tournamentId,
        actorUserId: user.id,
        action: "chests_assigned",
        entity: "matchday",
        entityId: matchdayId,
        details: { assigned },
      });
    } catch {
      /* ignore; page reflects current state */
    }
  }
  revalidatePath(`/t/${tournamentId}/powerups`);
  redirect(`/t/${tournamentId}/powerups`);
}

// ---------------------------------------------------------------------------
// USER: open a chest -> reveal + store the powerup
// ---------------------------------------------------------------------------
export async function openChestAction(
  _prev: ChestState,
  formData: FormData,
): Promise<ChestState> {
  const chestId = String(formData.get("chestId") ?? "");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify ownership through RLS before doing the privileged write.
  const { data: chest } = await supabase
    .from("chests")
    .select("id, user_id, opened, tournament_id")
    .eq("id", chestId)
    .maybeSingle();
  if (!chest || chest.user_id !== user.id) {
    return { ok: false, message: "Ese cofre no es tuyo." };
  }
  if (chest.opened) {
    return { ok: false, message: "Ese cofre ya estaba abierto." };
  }

  const reward = await openChest(createAdminClient(), chestId, user.id);
  if (!reward) {
    return { ok: false, message: "No se pudo abrir el cofre. Inténtalo de nuevo." };
  }

  revalidatePath(`/t/${chest.tournament_id}/powerups`);
  return { ok: true, reward };
}

// ---------------------------------------------------------------------------
// USER: use a powerup on a match (before kickoff)
// ---------------------------------------------------------------------------
export async function usePowerupAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const inventoryId = String(formData.get("inventoryId") ?? "");
  const matchId = String(formData.get("matchId") ?? "");
  const side = String(formData.get("side") ?? "") as "home" | "away" | "";
  const targetUserId = String(formData.get("targetUserId") ?? "");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Inventory item must be the user's and unused.
  const { data: inv } = await supabase
    .from("user_powerup_inventory")
    .select(
      "id, user_id, status, tournament_id, tournament_powerup_id, tp:tournament_powerup_id(config_override, powerup:powerup_id(effect_type, config, target))",
    )
    .eq("id", inventoryId)
    .maybeSingle();

  if (!inv || inv.user_id !== user.id) {
    return { ok: false, message: "Ese powerup no es tuyo." };
  }
  if (inv.status !== "stored") {
    return { ok: false, message: "Ese powerup ya se ha usado." };
  }

  const tp: any = Array.isArray((inv as any).tp) ? (inv as any).tp[0] : (inv as any).tp;
  const powerup: any = Array.isArray(tp?.powerup) ? tp.powerup[0] : tp?.powerup;
  if (!powerup) return { ok: false, message: "Powerup no válido." };
  const effectType: string = powerup.effect_type;
  const config = (tp?.config_override ?? powerup.config) || {};
  const need = useTargetFor(effectType);

  // Match must belong to the tournament and not have started.
  const { data: match } = await supabase
    .from("matches")
    .select("id, tournament_id, status, kickoff_at, locked, home_team_id, away_team_id")
    .eq("id", matchId)
    .maybeSingle();
  if (!match || match.tournament_id !== inv.tournament_id) {
    return { ok: false, message: "Partido no válido." };
  }
  if (matchClosed(match)) {
    return { ok: false, message: "Ese partido ya ha empezado: no puedes usar powerups." };
  }

  // Validate the required target inputs.
  if ((need === "match_team" || need === "match_user_team") && side !== "home" && side !== "away") {
    return { ok: false, message: "Elige a qué equipo afecta." };
  }
  if (need === "match_user_team" && !targetUserId) {
    return { ok: false, message: "Elige a qué rival apuntas." };
  }

  const effect: Record<string, any> = { type: effectType, config };
  if (side) effect.side = side;
  if (need === "match_user_team") effect.target_user_id = targetUserId;

  const admin = createAdminClient();

  const { data: useRow, error: useErr } = await admin
    .from("powerup_uses")
    .insert({
      tournament_id: inv.tournament_id,
      inventory_id: inv.id,
      user_id: user.id,
      match_id: match.id,
      target_user_id: need === "match_user_team" ? targetUserId : null,
      effect_summary: effectType,
    })
    .select("id")
    .single();
  if (useErr || !useRow) {
    return { ok: false, message: "No se pudo usar el powerup." };
  }

  await admin.from("match_powerup_effects").insert({
    match_id: match.id,
    user_id: need === "match_user_team" ? targetUserId : user.id,
    powerup_use_id: useRow.id,
    effect,
  });

  await admin
    .from("user_powerup_inventory")
    .update({ status: "used" })
    .eq("id", inv.id);

  revalidatePath(`/t/${inv.tournament_id}/powerups`);
  revalidatePath(`/t/${inv.tournament_id}/partidos`);
  return { ok: true };
}

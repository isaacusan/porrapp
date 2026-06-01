import type { SupabaseClient } from "@supabase/supabase-js";
import { LIVE_KEYS, RARITY_BASE_WEIGHT } from "./catalog";

/**
 * Assign one chest per active member for a matchday (idempotent), pre-rolling
 * its contents. Mario-Kart rubber-banding: players lower in the standings get
 * better odds at rare/epic/legendary powerups, to keep the pool competitive.
 *
 * Pass a service-role client; the caller must have verified admin rights.
 */
export async function assignPowerupChest(
  supabase: SupabaseClient,
  tournamentId: string,
  matchdayId: string,
): Promise<{ assigned: number }> {
  // Active members
  const { data: members } = await supabase
    .from("tournament_members")
    .select("user_id")
    .eq("tournament_id", tournamentId)
    .eq("status", "active");
  const userIds = (members ?? []).map((m) => m.user_id);
  if (userIds.length === 0) return { assigned: 0 };

  // Current standings (compute positions from the ledger; service role can read all).
  const { data: ledger } = await supabase
    .from("points_ledger")
    .select("user_id, points")
    .eq("tournament_id", tournamentId);
  const totals = new Map<string, number>();
  for (const u of userIds) totals.set(u, 0);
  for (const row of ledger ?? [])
    totals.set(row.user_id, (totals.get(row.user_id) ?? 0) + row.points);
  const sorted = [...userIds].sort((a, b) => (totals.get(b)! - totals.get(a)!));
  const positionOf = new Map(sorted.map((u, i) => [u, i + 1])); // 1 = leader
  const n = userIds.length;

  // Live, enabled powerups for this tournament
  const { data: tps } = await supabase
    .from("tournament_powerups")
    .select("id, enabled, probability, powerup:powerup_id(key, rarity)")
    .eq("tournament_id", tournamentId);

  type Row = {
    id: string;
    enabled: boolean;
    probability: number;
    powerup: { key: string; rarity: string } | { key: string; rarity: string }[];
  };
  const pool = ((tps ?? []) as Row[])
    .map((r) => ({
      id: r.id,
      enabled: r.enabled,
      probability: Number(r.probability),
      powerup: Array.isArray(r.powerup) ? r.powerup[0] : r.powerup,
    }))
    .filter((r) => r.enabled && r.powerup && LIVE_KEYS.has(r.powerup.key));

  if (pool.length === 0) return { assigned: 0 };

  // Who already has a chest this matchday?
  const { data: existing } = await supabase
    .from("chests")
    .select("user_id")
    .eq("matchday_id", matchdayId);
  const haveChest = new Set((existing ?? []).map((c) => c.user_id));

  let assigned = 0;
  for (const userId of userIds) {
    if (haveChest.has(userId)) continue;

    const { data: chest, error: chestErr } = await supabase
      .from("chests")
      .insert({ tournament_id: tournamentId, matchday_id: matchdayId, user_id: userId })
      .select("id")
      .single();
    if (chestErr || !chest) continue;

    // Rubber-band: 0 for the leader, 1 for last place.
    const pos = positionOf.get(userId) ?? n;
    const luck = n > 1 ? (pos - 1) / (n - 1) : 0;

    const weights = pool.map((p) => {
      const rarityW = RARITY_BASE_WEIGHT[p.powerup.rarity] ?? 1;
      const boost = p.powerup.rarity === "common" ? 1 : 1 + luck * 2;
      return Math.max(0.0001, p.probability * rarityW * boost);
    });
    const totalW = weights.reduce((s, w) => s + w, 0);
    let r = Math.random() * totalW;
    let pick = pool[0];
    for (let i = 0; i < pool.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        pick = pool[i];
        break;
      }
    }

    await supabase.from("powerup_assignments").insert({
      tournament_id: tournamentId,
      matchday_id: matchdayId,
      chest_id: chest.id,
      user_id: userId,
      tournament_powerup_id: pick.id,
    });
    assigned++;
  }

  return { assigned };
}

/**
 * Open a chest: reveal its pre-assigned powerup, drop it into the user's
 * inventory and mark the chest opened. Returns the powerup for the reveal.
 */
export async function openChest(
  supabase: SupabaseClient,
  chestId: string,
  userId: string,
): Promise<{
  key: string;
  name: string;
  description: string;
  rarity: string;
} | null> {
  const { data: chest } = await supabase
    .from("chests")
    .select("id, user_id, opened, tournament_id")
    .eq("id", chestId)
    .maybeSingle();
  if (!chest || chest.user_id !== userId || chest.opened) return null;

  const { data: assignment } = await supabase
    .from("powerup_assignments")
    .select("tournament_powerup_id")
    .eq("chest_id", chestId)
    .maybeSingle();
  if (!assignment) return null;

  await supabase.from("user_powerup_inventory").insert({
    tournament_id: chest.tournament_id,
    user_id: userId,
    tournament_powerup_id: assignment.tournament_powerup_id,
    status: "stored",
    source: "chest",
  });

  await supabase
    .from("chests")
    .update({ opened: true, opened_at: new Date().toISOString() })
    .eq("id", chestId);

  // Resolve the powerup details for the reveal animation.
  const { data: tp } = await supabase
    .from("tournament_powerups")
    .select("name_override, description_override, powerup:powerup_id(key, name, description, rarity)")
    .eq("id", assignment.tournament_powerup_id)
    .maybeSingle();
  const p: any = Array.isArray((tp as any)?.powerup)
    ? (tp as any).powerup[0]
    : (tp as any)?.powerup;
  if (!p) return null;
  return {
    key: p.key,
    name: (tp as any)?.name_override ?? p.name,
    description: (tp as any)?.description_override ?? p.description,
    rarity: p.rarity,
  };
}

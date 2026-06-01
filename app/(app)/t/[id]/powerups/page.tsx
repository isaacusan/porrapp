import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  POWERUP_EMOJI,
  RARITY_STYLE,
  RARITY_LABEL,
  LIVE_KEYS,
} from "@/lib/powerups/catalog";
import { ChestCard } from "@/components/powerups/chest-card";
import {
  PowerupInventoryCard,
  type UpcomingMatch,
} from "@/components/powerups/inventory-card";
import { AdminChestBar } from "@/components/powerups/admin-chest-bar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import type { Team, MatchRow } from "@/lib/matches/types";

export const metadata: Metadata = { title: "Powerups · PORRAPP" };

const RARITY_RANK: Record<string, number> = {
  legendary: 0,
  epic: 1,
  rare: 2,
  common: 3,
};

function hasStarted(m: { locked: boolean; status: string; kickoff_at: string }) {
  return (
    m.locked ||
    m.status === "live" ||
    m.status === "finished" ||
    new Date(m.kickoff_at).getTime() <= Date.now()
  );
}

export default async function PowerupsPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name, powerups_enabled")
    .eq("id", params.id)
    .maybeSingle();
  if (!tournament) notFound();

  const [
    { data: membership },
    { data: matchdays },
    { data: chests },
    { data: inventory },
    { data: catalog },
    { data: matches },
    { data: teams },
    { data: members },
  ] = await Promise.all([
    supabase
      .from("tournament_members")
      .select("role")
      .eq("tournament_id", tournament.id)
      .eq("user_id", user!.id)
      .single(),
    supabase
      .from("matchdays")
      .select("id, name, order_index")
      .eq("tournament_id", tournament.id)
      .order("order_index"),
    supabase
      .from("chests")
      .select("id, matchday_id")
      .eq("user_id", user!.id)
      .eq("opened", false),
    supabase
      .from("user_powerup_inventory")
      .select(
        "id, status, tp:tournament_powerup_id(name_override, powerup:powerup_id(key,name,description,rarity,effect_type))",
      )
      .eq("user_id", user!.id)
      .eq("status", "stored"),
    supabase
      .from("powerups")
      .select("key, name, description, rarity, effect_type"),
    supabase
      .from("matches")
      .select("id, status, kickoff_at, locked, home_team_id, away_team_id")
      .eq("tournament_id", tournament.id),
    supabase.from("teams").select("id, name, short_name, flag_url"),
    supabase
      .from("tournament_members")
      .select("user_id, display_name")
      .eq("tournament_id", tournament.id)
      .eq("status", "active"),
  ]);

  const isAdmin = membership?.role === "admin";
  const mdName = new Map((matchdays ?? []).map((m) => [m.id, m.name]));
  const teamsById = new Map<string, Team>(
    (teams as Team[] | null)?.map((t) => [t.id, t]) ?? [],
  );

  // Upcoming matches for the "use powerup" flow
  const upcoming: UpcomingMatch[] = ((matches as MatchRow[] | null) ?? [])
    .filter((m) => !hasStarted(m))
    .sort((a, b) => +new Date(a.kickoff_at) - +new Date(b.kickoff_at))
    .map((m) => {
      const h = m.home_team_id ? teamsById.get(m.home_team_id) : undefined;
      const a = m.away_team_id ? teamsById.get(m.away_team_id) : undefined;
      return {
        id: m.id,
        label: `${h?.short_name || h?.name || "?"} vs ${a?.short_name || a?.name || "?"}`,
        homeName: h?.name || "Local",
        awayName: a?.name || "Visitante",
      };
    });

  const otherMembers = ((members ?? []) as { user_id: string; display_name: string }[])
    .filter((m) => m.user_id !== user!.id);

  const inv = ((inventory ?? []) as any[]).map((row) => {
    const tp = Array.isArray(row.tp) ? row.tp[0] : row.tp;
    const p = Array.isArray(tp?.powerup) ? tp.powerup[0] : tp?.powerup;
    return {
      id: row.id as string,
      key: p?.key as string,
      name: (tp?.name_override ?? p?.name) as string,
      description: p?.description as string,
      rarity: p?.rarity as string,
      effectType: p?.effect_type as string,
    };
  });

  const cat = ((catalog ?? []) as any[]).sort(
    (a, b) =>
      (RARITY_RANK[a.rarity] ?? 9) - (RARITY_RANK[b.rarity] ?? 9) ||
      a.name.localeCompare(b.name),
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/t/${tournament.id}`}
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {tournament.name}
      </Link>

      <div>
        <h1 className="text-4xl">Powerups</h1>
        <p className="text-muted-foreground">
          Abre cofres, guarda poderes y úsalos antes de que empiece un partido. ⚡
        </p>
      </div>

      {isAdmin && (
        <AdminChestBar
          tournamentId={tournament.id}
          matchdays={(matchdays ?? []).map((m) => ({ id: m.id, name: m.name }))}
        />
      )}

      {/* Chests to open */}
      {(chests ?? []).length > 0 && (
        <section className="space-y-3">
          <h2 className="text-2xl">Cofres por abrir 🎁</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(chests ?? []).map((c) => (
              <ChestCard
                key={c.id}
                chestId={c.id}
                matchdayName={mdName.get(c.matchday_id ?? "") ?? "Cofre"}
              />
            ))}
          </div>
        </section>
      )}

      {/* Inventory */}
      <section className="space-y-3">
        <h2 className="text-2xl">Tu mochila</h2>
        {inv.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              Aún no tienes powerups. Abre un cofre cuando el admin los reparta.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {inv.map((p) => (
              <PowerupInventoryCard
                key={p.id}
                inventoryId={p.id}
                powerupKey={p.key}
                name={p.name}
                description={p.description}
                rarity={p.rarity}
                effectType={p.effectType}
                matches={upcoming}
                members={otherMembers}
              />
            ))}
          </div>
        )}
      </section>

      {/* Catalog */}
      <section className="space-y-3">
        <h2 className="text-2xl">Catálogo</h2>
        <p className="-mt-2 text-sm text-muted-foreground">
          Los 22 powerups de PORRAPP. Los marcados como “pronto” se activarán en
          una próxima actualización.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {cat.map((p) => {
            const live = LIVE_KEYS.has(p.key);
            return (
              <div
                key={p.key}
                className={cn(
                  "flex gap-3 rounded-xl border border-border bg-card p-3",
                  !live && "opacity-60",
                )}
              >
                <span className="text-2xl">{POWERUP_EMOJI[p.key] ?? "✨"}</span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold">{p.name}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold",
                        RARITY_STYLE[p.rarity],
                      )}
                    >
                      {RARITY_LABEL[p.rarity]}
                    </span>
                    {!live && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                        pronto
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{p.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

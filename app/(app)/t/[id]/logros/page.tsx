import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AUTO_KEYS } from "@/lib/achievements/evaluate";
import { Avatar } from "@/components/brand/avatar";
import { cn } from "@/lib/utils";
import { ArrowLeft, Lock } from "lucide-react";

export const metadata: Metadata = { title: "Logros · PORRAPP" };

const AUTO = new Set<string>(AUTO_KEYS);

export default async function AchievementsPage({
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
    .select("id, name")
    .eq("id", params.id)
    .maybeSingle();
  if (!tournament) notFound();

  const [{ data: catalog }, { data: earned }, { data: members }] = await Promise.all([
    supabase.from("achievements").select("id, key, name, description, icon"),
    supabase
      .from("user_achievements")
      .select("achievement_id, user_id")
      .eq("tournament_id", tournament.id),
    supabase
      .from("tournament_members")
      .select("user_id, display_name, avatar_id")
      .eq("tournament_id", tournament.id)
      .eq("status", "active"),
  ]);

  const memberById = new Map((members ?? []).map((m) => [m.user_id, m]));
  const earnersByAch = new Map<string, string[]>();
  for (const e of earned ?? []) {
    const arr = earnersByAch.get(e.achievement_id) ?? [];
    arr.push(e.user_id);
    earnersByAch.set(e.achievement_id, arr);
  }

  const myCount = (earned ?? []).filter((e) => e.user_id === user!.id).length;
  const list = (catalog ?? []).sort(
    (a, b) => Number(AUTO.has(b.key)) - Number(AUTO.has(a.key)),
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href={`/t/${tournament.id}`}
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {tournament.name}
      </Link>

      <div>
        <h1 className="text-4xl">Logros</h1>
        <p className="text-muted-foreground">
          Has desbloqueado <strong className="text-foreground">{myCount}</strong> de{" "}
          {list.length}. 🏅
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((a) => {
          const earners = earnersByAch.get(a.id) ?? [];
          const mineEarned = earners.includes(user!.id);
          const auto = AUTO.has(a.key);
          return (
            <div
              key={a.key}
              className={cn(
                "rounded-2xl border bg-card p-4 shadow-card transition-colors",
                mineEarned ? "border-gold bg-gold/5" : "border-border",
                !auto && !mineEarned && "opacity-70",
              )}
            >
              <div className="flex items-start gap-3">
                <span className={cn("text-3xl", !mineEarned && "grayscale")}>
                  {a.icon}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold leading-tight">{a.name}</h3>
                    {mineEarned && (
                      <span className="rounded-full bg-gold/25 px-2 py-0.5 text-[10px] font-bold text-gold-foreground">
                        ✓ Conseguido
                      </span>
                    )}
                    {!auto && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                        <Lock className="size-2.5" />
                        especial
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{a.description}</p>
                </div>
              </div>
              {earners.length > 0 && (
                <div className="mt-3 flex items-center gap-1 border-t border-border/60 pt-2">
                  <div className="flex -space-x-2">
                    {earners.slice(0, 5).map((uid) => (
                      <Avatar
                        key={uid}
                        id={memberById.get(uid)?.avatar_id}
                        size="sm"
                      />
                    ))}
                  </div>
                  <span className="ml-1 text-xs text-muted-foreground">
                    {earners.length === 1
                      ? "1 jugador"
                      : `${earners.length} jugadores`}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Los marcados como “especial” se conceden en situaciones concretas del
        torneo y llegarán en una próxima actualización. El resto se desbloquean
        solos según tus aciertos.
      </p>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { recalcAction } from "@/lib/matches/actions";
import {
  RankingTable,
  type RankRow,
} from "@/components/ranking/ranking-table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, RefreshCw } from "lucide-react";

export const metadata: Metadata = { title: "Clasificación · PORRAPP" };

const PHASE_LABEL: Record<string, string> = {
  group: "Grupos",
  round32: "16avos",
  round16: "Octavos",
  quarter: "Cuartos",
  semi: "Semis",
  third_place: "3er puesto",
  final: "Final",
};

type View = "general" | "jornada" | "fase";

export default async function RankingPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { vista?: string; md?: string; fase?: string };
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

  const [{ data: membership }, { data: matchdays }] = await Promise.all([
    supabase
      .from("tournament_members")
      .select("role")
      .eq("tournament_id", tournament.id)
      .eq("user_id", user!.id)
      .single(),
    supabase
      .from("matchdays")
      .select("id, name, phase, order_index")
      .eq("tournament_id", tournament.id)
      .order("order_index"),
  ]);

  const isAdmin = membership?.role === "admin";
  const mds = matchdays ?? [];
  const phases = Array.from(new Set(mds.map((m) => m.phase)));

  const vista = (["general", "jornada", "fase"].includes(searchParams.vista ?? "")
    ? searchParams.vista
    : "general") as View;
  const selectedMd =
    vista === "jornada" ? searchParams.md ?? mds[0]?.id ?? null : null;
  const selectedPhase =
    vista === "fase" ? searchParams.fase ?? phases[0] ?? null : null;

  const { data: ranking } = await supabase.rpc("tournament_ranking", {
    p_tournament: tournament.id,
    p_matchday: selectedMd,
    p_phase: selectedPhase,
  });

  const rows = (ranking as RankRow[] | null) ?? [];

  const tab = (label: string, view: View, extra = "") => {
    const href = `/t/${tournament.id}/clasificacion?vista=${view}${extra}`;
    const active = vista === view;
    return (
      <Link
        href={href}
        className={cn(
          "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground hover:bg-secondary/70",
        )}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href={`/t/${tournament.id}`}
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {tournament.name}
      </Link>

      <div className="flex items-end justify-between gap-3">
        <h1 className="text-4xl">Clasificación</h1>
        {isAdmin && (
          <form action={recalcAction}>
            <input type="hidden" name="tournamentId" value={tournament.id} />
            <Button type="submit" variant="ghost" size="sm" title="Recalcular">
              <RefreshCw />
              <span className="hidden sm:inline">Recalcular</span>
            </Button>
          </form>
        )}
      </div>

      {/* View tabs */}
      <div className="flex flex-wrap gap-2">
        {tab("General", "general")}
        {mds.length > 0 && tab("Por jornada", "jornada")}
        {phases.length > 1 && tab("Por fase", "fase")}
      </div>

      {/* Sub-selectors */}
      {vista === "jornada" && mds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {mds.map((m) => (
            <Link
              key={m.id}
              href={`/t/${tournament.id}/clasificacion?vista=jornada&md=${m.id}`}
              className={cn(
                "rounded-lg border px-3 py-1 text-sm font-medium",
                selectedMd === m.id
                  ? "border-primary bg-pitch/10"
                  : "border-border hover:bg-secondary",
              )}
            >
              {m.name}
            </Link>
          ))}
        </div>
      )}
      {vista === "fase" && phases.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {phases.map((p) => (
            <Link
              key={p}
              href={`/t/${tournament.id}/clasificacion?vista=fase&fase=${p}`}
              className={cn(
                "rounded-lg border px-3 py-1 text-sm font-medium",
                selectedPhase === p
                  ? "border-primary bg-pitch/10"
                  : "border-border hover:bg-secondary",
              )}
            >
              {PHASE_LABEL[p] ?? p}
            </Link>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <RankingTable rows={rows} myUserId={user!.id} />
        </CardContent>
      </Card>
    </div>
  );
}

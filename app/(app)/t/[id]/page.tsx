import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBaseUrl } from "@/lib/url";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { RoleBadge, StatusBadge } from "@/components/tournaments/badges";
import { InvitePanel } from "@/components/tournaments/invite-panel";
import {
  MemberRoster,
  type Member,
} from "@/components/tournaments/member-roster";
import { LeaveTournamentButton } from "@/components/tournaments/leave-button";
import { Avatar } from "@/components/brand/avatar";
import { ArrowLeft, CalendarClock, ChevronRight, HelpCircle, Medal, Shield, Trophy, UserPlus, Zap } from "lucide-react";
import { getLatestMatchdaySummary } from "@/lib/matchday/summary";
import { MatchdaySummaryCard } from "@/components/ranking/matchday-summary";

export const metadata: Metadata = { title: "Torneo · PORRAPP" };

export default async function TournamentPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS guarantees we only get the row if we're a member.
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name, description, status, invite_code, created_by, powerups_enabled")
    .eq("id", params.id)
    .maybeSingle();

  if (!tournament) notFound();

  const { data: members } = await supabase
    .from("tournament_members")
    .select("user_id, display_name, avatar_id, role")
    .eq("tournament_id", tournament.id)
    .eq("status", "active")
    .order("role", { ascending: true })
    .order("joined_at", { ascending: true });

  const roster = (members ?? []) as Member[];
  const me = roster.find((m) => m.user_id === user!.id);
  const myRole = me?.role ?? "participant";
  const summary = await getLatestMatchdaySummary(supabase, tournament.id);
  const memberById = new Map(
    roster.map((m) => [m.user_id, { display_name: m.display_name, avatar_id: m.avatar_id }]),
  );

  const joinUrl = `${getBaseUrl()}/join/${tournament.invite_code}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Mis porras
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-pitch/10 text-3xl">
          🏆
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-4xl leading-none">{tournament.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <RoleBadge role={myRole} />
            <StatusBadge status={tournament.status} />
          </div>
          {tournament.description && (
            <p className="mt-2 text-muted-foreground">{tournament.description}</p>
          )}
        </div>
      </div>

      {searchParams.error === "admin_leave" && (
        <Alert variant="error">
          Como admin no puedes abandonar el torneo. Más adelante podrás traspasar
          la administración a otra persona desde el panel de admin.
        </Alert>
      )}
      {searchParams.error === "mock_failed" && (
        <Alert variant="error">
          No se pudo cargar el Mundial de prueba. Puede que este torneo ya tenga
          partidos.
        </Alert>
      )}

      {myRole === "admin" && (
        <Link
          href={`/t/${tournament.id}/admin`}
          className="group flex items-center gap-3 rounded-2xl border-2 border-gold/50 bg-gold/10 p-4 transition-transform hover:-translate-y-0.5"
        >
          <Shield className="size-6 shrink-0 text-gold" />
          <div className="flex-1">
            <p className="font-semibold text-gold-foreground">Panel de admin</p>
            <p className="text-sm text-muted-foreground">
              Resultados, jugadores, ajustes y registro
            </p>
          </div>
          <ChevronRight className="size-5 text-gold-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}

      {/* Invite */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="size-5 text-pitch" />
            Invita a tus amigos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InvitePanel
            tournamentId={tournament.id}
            tournamentName={tournament.name}
            inviteCode={tournament.invite_code}
            joinUrl={joinUrl}
          />
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            Jugadores ({roster.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MemberRoster members={roster} />
        </CardContent>
      </Card>

      {summary && (
        <MatchdaySummaryCard
          summary={summary}
          memberById={memberById}
          myUserId={user!.id}
        />
      )}

      {/* Sections */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href={`/t/${tournament.id}/partidos`}
          className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card transition-transform hover:-translate-y-0.5"
        >
          <CalendarClock className="size-6 shrink-0 text-pitch" />
          <div className="flex-1">
            <p className="font-semibold">Partidos y predicciones</p>
            <p className="text-sm text-muted-foreground">Marca tu porra</p>
          </div>
          <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link
          href={`/t/${tournament.id}/clasificacion`}
          className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card transition-transform hover:-translate-y-0.5"
        >
          <Trophy className="size-6 shrink-0 text-gold" />
          <div className="flex-1">
            <p className="font-semibold">Clasificación</p>
            <p className="text-sm text-muted-foreground">¿Quién manda?</p>
          </div>
          <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
        <Link
          href={`/t/${tournament.id}/preguntas`}
          className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card transition-transform hover:-translate-y-0.5"
        >
          <HelpCircle className="size-6 shrink-0 text-coral" />
          <div className="flex-1">
            <p className="font-semibold">Preguntas generales</p>
            <p className="text-sm text-muted-foreground">
              Campeón, goleador y más
            </p>
          </div>
          <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
        {tournament.powerups_enabled && (
          <Link
            href={`/t/${tournament.id}/powerups`}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card transition-transform hover:-translate-y-0.5"
          >
            <Zap className="size-6 shrink-0 text-gold" />
            <div className="flex-1">
              <p className="font-semibold">Powerups</p>
              <p className="text-sm text-muted-foreground">Cofres y poderes</p>
            </div>
            <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
        <Link
          href={`/t/${tournament.id}/logros`}
          className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-card transition-transform hover:-translate-y-0.5"
        >
          <Medal className="size-6 shrink-0 text-coral" />
          <div className="flex-1">
            <p className="font-semibold">Logros</p>
            <p className="text-sm text-muted-foreground">Tus medallas</p>
          </div>
          <ChevronRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Your identity + leave */}
      <div className="flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Avatar id={me?.avatar_id} size="sm" />
          Juegas como{" "}
          <span className="font-semibold text-foreground">
            {me?.display_name}
          </span>
        </div>
        {myRole !== "admin" && (
          <LeaveTournamentButton tournamentId={tournament.id} />
        )}
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/admin/settings-form";
import { MemberManager } from "@/components/admin/member-manager";
import { AuditList, type AuditEntry } from "@/components/admin/audit-list";
import { SyncConfig } from "@/components/admin/sync-config";
import {
  ArrowLeft,
  CalendarClock,
  Download,
  Gift,
  HelpCircle,
} from "lucide-react";

export const metadata: Metadata = { title: "Panel de admin · PORRAPP" };

function summarize(action: string, details: any): string | undefined {
  if (!details) return undefined;
  if (action === "result_entered" && details.home != null)
    return `${details.home}-${details.away}`;
  if (action === "chests_assigned" && details.assigned != null)
    return `${details.assigned} cofres`;
  if (action === "settings_updated" && details.name) return details.name;
  return undefined;
}

export default async function AdminPage({
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
    .select(
      "id, name, description, powerups_enabled, api_provider, api_competition, api_sync_enabled",
    )
    .eq("id", params.id)
    .maybeSingle();
  if (!tournament) notFound();

  const { data: me } = await supabase
    .from("tournament_members")
    .select("role")
    .eq("tournament_id", tournament.id)
    .eq("user_id", user!.id)
    .single();
  if (me?.role !== "admin") redirect(`/t/${tournament.id}`);

  const [{ data: members }, { data: logs }, { data: syncLog }] = await Promise.all([
    supabase
      .from("tournament_members")
      .select("user_id, display_name, avatar_id, role, status")
      .eq("tournament_id", tournament.id)
      .neq("status", "left"),
    supabase
      .from("audit_logs")
      .select("action, actor_user_id, created_at, details")
      .eq("tournament_id", tournament.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("api_sync_logs")
      .select("status, message, finished_at")
      .eq("tournament_id", tournament.id)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const mlist = (members ?? []).sort((a, b) =>
    a.role === b.role
      ? a.display_name.localeCompare(b.display_name)
      : a.role === "admin"
        ? -1
        : 1,
  );
  const nameById = new Map(mlist.map((m) => [m.user_id, m.display_name]));

  const auditEntries: AuditEntry[] = (logs ?? []).map((l) => ({
    action: l.action,
    actorName: nameById.get(l.actor_user_id ?? "") ?? "Admin",
    created_at: l.created_at,
    summary: summarize(l.action, l.details),
  }));

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
        <h1 className="text-4xl">Panel de admin</h1>
        <p className="text-muted-foreground">
          Todo lo que controlas como organizador del torneo.
        </p>
      </div>

      {/* Quick actions */}
      <section className="space-y-3">
        <h2 className="text-2xl">Acciones rápidas</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <Link
            href={`/t/${tournament.id}/partidos`}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card hover:-translate-y-0.5"
          >
            <CalendarClock className="size-5 text-pitch" />
            <span className="text-sm font-semibold">Introducir resultados</span>
          </Link>
          <Link
            href={`/t/${tournament.id}/preguntas`}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card hover:-translate-y-0.5"
          >
            <HelpCircle className="size-5 text-coral" />
            <span className="text-sm font-semibold">Resolver preguntas</span>
          </Link>
          {tournament.powerups_enabled && (
            <Link
              href={`/t/${tournament.id}/powerups`}
              className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card hover:-translate-y-0.5"
            >
              <Gift className="size-5 text-gold" />
              <span className="text-sm font-semibold">Repartir cofres</span>
            </Link>
          )}
          <a
            href={`/t/${tournament.id}/admin/export`}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-card hover:-translate-y-0.5"
          >
            <Download className="size-5 text-pitch" />
            <span className="text-sm font-semibold">Exportar clasificación (CSV)</span>
          </a>
        </div>
      </section>

      {/* Members */}
      <section className="space-y-3">
        <h2 className="text-2xl">Jugadores</h2>
        <MemberManager
          tournamentId={tournament.id}
          members={mlist as any}
        />
        <p className="text-xs text-muted-foreground">
          Banear a un jugador lo saca de la clasificación y le impide volver a
          unirse. Puedes readmitirlo cuando quieras.
        </p>
      </section>

      {/* Settings */}
      <section className="space-y-3">
        <h2 className="text-2xl">Ajustes</h2>
        <SettingsForm
          tournamentId={tournament.id}
          name={tournament.name}
          description={tournament.description}
          powerupsEnabled={tournament.powerups_enabled}
        />
      </section>

      {/* Automatic data */}
      <section className="space-y-3">
        <h2 className="text-2xl">Datos automáticos</h2>
        <SyncConfig
          tournamentId={tournament.id}
          provider={tournament.api_provider}
          competition={tournament.api_competition}
          enabled={tournament.api_sync_enabled}
          lastSync={syncLog ?? null}
        />
      </section>

      {/* Audit log */}
      <section className="space-y-3">
        <h2 className="text-2xl">Registro de actividad</h2>
        <AuditList entries={auditEntries} />
      </section>
    </div>
  );
}

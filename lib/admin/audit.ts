import type { SupabaseClient } from "@supabase/supabase-js";

export type AuditAction =
  | "result_entered"
  | "member_banned"
  | "member_unbanned"
  | "admin_transferred"
  | "settings_updated"
  | "chests_assigned"
  | "question_resolved"
  | "recalculated";

export const AUDIT_LABEL: Record<string, string> = {
  result_entered: "Resultado introducido",
  member_banned: "Jugador baneado",
  member_unbanned: "Jugador readmitido",
  admin_transferred: "Administración traspasada",
  settings_updated: "Ajustes actualizados",
  chests_assigned: "Cofres repartidos",
  question_resolved: "Pregunta resuelta",
  recalculated: "Clasificación recalculada",
};

/**
 * Write an audit entry. Best-effort: never throws, so it can't break the action
 * it's recording. Pass a service-role client (audit_logs has no insert policy).
 */
export async function logAudit(
  admin: SupabaseClient,
  entry: {
    tournamentId: string;
    actorUserId: string;
    action: AuditAction;
    entity?: string;
    entityId?: string;
    details?: Record<string, any>;
  },
): Promise<void> {
  try {
    await admin.from("audit_logs").insert({
      tournament_id: entry.tournamentId,
      actor_user_id: entry.actorUserId,
      action: entry.action,
      entity: entry.entity ?? null,
      entity_id: entry.entityId ?? null,
      details: entry.details ?? null,
    });
  } catch {
    /* swallow: auditing must not break the underlying action */
  }
}

import { AUDIT_LABEL } from "@/lib/admin/audit";
import { ScrollText } from "lucide-react";

export type AuditEntry = {
  action: string;
  actorName: string;
  created_at: string;
  summary?: string;
};

function when(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AuditList({ entries }: { entries: AuditEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-card">
        <ScrollText className="size-5 shrink-0" />
        Todavía no hay actividad registrada.
      </div>
    );
  }
  return (
    <ul className="divide-y divide-border rounded-2xl border border-border bg-card shadow-card">
      {entries.map((e, i) => (
        <li key={i} className="flex items-start gap-3 p-3">
          <span className="mt-0.5 size-2 shrink-0 rounded-full bg-pitch" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {AUDIT_LABEL[e.action] ?? e.action}
              {e.summary && (
                <span className="font-normal text-muted-foreground"> · {e.summary}</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {e.actorName} · {when(e.created_at)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

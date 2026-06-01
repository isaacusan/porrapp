import { cn } from "@/lib/utils";
import { Crown, User } from "lucide-react";

export function RoleBadge({ role }: { role: "admin" | "participant" }) {
  const isAdmin = role === "admin";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        isAdmin
          ? "bg-gold/20 text-gold-foreground"
          : "bg-secondary text-secondary-foreground",
      )}
    >
      {isAdmin ? <Crown className="size-3" /> : <User className="size-3" />}
      {isAdmin ? "Admin" : "Jugador"}
    </span>
  );
}

const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Borrador", cls: "bg-secondary text-secondary-foreground" },
  open: { label: "Abierto", cls: "bg-pitch/15 text-pitch-dark" },
  in_progress: { label: "En juego", cls: "bg-lime/25 text-lime-foreground" },
  finished: { label: "Finalizado", cls: "bg-gold/20 text-gold-foreground" },
  archived: { label: "Archivado", cls: "bg-muted text-muted-foreground" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? STATUS.open;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        s.cls,
      )}
    >
      {s.label}
    </span>
  );
}

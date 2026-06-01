import { cn } from "@/lib/utils";
import type { Team } from "@/lib/matches/types";

export function TeamBadge({
  team,
  align = "left",
  className,
}: {
  team: Team | undefined;
  align?: "left" | "right";
  className?: string;
}) {
  const label = team?.short_name || team?.name || "¿?";
  return (
    <span
      className={cn(
        "flex items-center gap-2 font-semibold",
        align === "right" && "flex-row-reverse text-right",
        className,
      )}
    >
      <span className="text-2xl leading-none" aria-hidden="true">
        {team?.flag_url || "🏳️"}
      </span>
      <span className="truncate">{team?.name || "Por definir"}</span>
    </span>
  );
}

const STATUS: Record<string, { label: string; cls: string; dot?: boolean }> = {
  live: { label: "En directo", cls: "bg-coral/15 text-coral", dot: true },
  finished: { label: "Final", cls: "bg-secondary text-muted-foreground" },
  postponed: { label: "Aplazado", cls: "bg-gold/20 text-gold-foreground" },
  cancelled: { label: "Cancelado", cls: "bg-secondary text-muted-foreground" },
};

export function MatchStatusPill({ status }: { status: string }) {
  const s = STATUS[status];
  if (!s) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        s.cls,
      )}
    >
      {s.dot && (
        <span className="size-1.5 animate-pulse rounded-full bg-coral" />
      )}
      {s.label}
    </span>
  );
}

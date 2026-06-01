import { Avatar } from "@/components/brand/avatar";
import { cn } from "@/lib/utils";

export type RankRow = {
  user_id: string;
  display_name: string;
  avatar_id: string | null;
  points: number;
  played: number;
  exact_hits: number;
  position: number;
};

const MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export function RankingTable({
  rows,
  myUserId,
}: {
  rows: RankRow[];
  myUserId: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Aún no hay puntos. En cuanto se jueguen partidos y el admin meta los
        resultados, aparecerá aquí la clasificación. ⚽
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {rows.map((r) => {
        const isMe = r.user_id === myUserId;
        const medal = MEDALS[r.position];
        return (
          <li
            key={r.user_id}
            className={cn(
              "flex items-center gap-3 rounded-2xl border p-3",
              isMe
                ? "border-primary bg-pitch/5"
                : "border-border bg-card",
            )}
          >
            <div className="flex w-8 shrink-0 justify-center">
              {medal ? (
                <span className="text-2xl">{medal}</span>
              ) : (
                <span className="font-display text-xl text-muted-foreground">
                  {r.position}
                </span>
              )}
            </div>
            <Avatar id={r.avatar_id} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">
                {r.display_name}
                {isMe && (
                  <span className="ml-1 text-xs text-muted-foreground">(tú)</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {r.played} jugados · {r.exact_hits} exactos
              </p>
            </div>
            <div className="text-right">
              <span className="font-display text-2xl tabular-nums">
                {r.points}
              </span>
              <span className="ml-1 text-xs text-muted-foreground">pts</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

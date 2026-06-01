import { Avatar } from "@/components/brand/avatar";
import { Card, CardContent } from "@/components/ui/card";
import type { MatchdaySummary } from "@/lib/matchday/summary";
import { Sparkles } from "lucide-react";

export function MatchdaySummaryCard({
  summary,
  memberById,
  myUserId,
}: {
  summary: MatchdaySummary;
  memberById: Map<string, { display_name: string; avatar_id: string | null }>;
  myUserId: string;
}) {
  const mvps = summary.rows.filter((r) => r.points === summary.topPoints && r.points > 0);
  const mine = summary.rows.find((r) => r.userId === myUserId);

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 bg-pitch px-4 py-2.5 text-primary-foreground">
        <Sparkles className="size-4" />
        <p className="font-semibold">Resumen · {summary.name}</p>
      </div>
      <CardContent className="space-y-3 p-4">
        {mvps.length > 0 ? (
          <div className="flex items-center gap-3 rounded-xl bg-gold/10 p-3">
            <span className="text-2xl">🏆</span>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-gold-foreground">
                {mvps.length > 1 ? "MVPs de la jornada" : "MVP de la jornada"}
              </p>
              <p className="font-semibold">
                {mvps
                  .map((r) => memberById.get(r.userId)?.display_name ?? "Jugador")
                  .join(", ")}
              </p>
            </div>
            <span className="font-display text-2xl text-gold-foreground">
              {summary.topPoints}
              <span className="text-sm"> pts</span>
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nadie puntuó esta jornada. ¡La próxima será!
          </p>
        )}

        {mine && (
          <div className="flex items-center gap-2 text-sm">
            <Avatar id={memberById.get(myUserId)?.avatar_id} size="sm" />
            <span className="flex-1 text-muted-foreground">Tú esta jornada</span>
            <span className="font-bold">{mine.points} pts</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

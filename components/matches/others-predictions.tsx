import { Avatar } from "@/components/brand/avatar";
import type { Prediction, MemberLite, Team } from "@/lib/matches/types";

export function OthersPredictions({
  predictions,
  membersById,
  teamsById,
  myUserId,
  isKnockout,
}: {
  predictions: Prediction[];
  membersById: Map<string, MemberLite>;
  teamsById: Map<string, Team>;
  myUserId: string;
  isKnockout: boolean;
}) {
  if (predictions.length === 0) {
    return (
      <p className="py-2 text-center text-sm text-muted-foreground">
        Nadie predijo este partido.
      </p>
    );
  }

  const sorted = [...predictions].sort((a, b) =>
    a.user_id === myUserId ? -1 : b.user_id === myUserId ? 1 : 0,
  );

  return (
    <ul className="space-y-1.5">
      {sorted.map((p) => {
        const m = membersById.get(p.user_id);
        const advancing = p.advancing_team_id
          ? teamsById.get(p.advancing_team_id)
          : null;
        const isMe = p.user_id === myUserId;
        return (
          <li
            key={p.user_id}
            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${
              isMe ? "bg-pitch/5" : ""
            }`}
          >
            <Avatar id={m?.avatar_id} size="sm" />
            <span className="flex-1 truncate text-sm font-medium">
              {m?.display_name ?? "Jugador"}
              {isMe && (
                <span className="ml-1 text-xs text-muted-foreground">(tú)</span>
              )}
              {p.is_auto && (
                <span className="ml-1 text-xs text-muted-foreground">
                  · auto
                </span>
              )}
            </span>
            <span className="font-display text-lg tabular-nums">
              {p.home_goals}–{p.away_goals}
            </span>
            {isKnockout && advancing && (
              <span className="text-base" title={`Pasa: ${advancing.name}`}>
                {advancing.flag_url}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

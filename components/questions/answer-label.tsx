import type { AnswerJson, QuestionType } from "@/lib/scoring/scoreQuestion";
import type { TeamOption, PlayerOption } from "@/lib/questions/types";

/** Render an answer JSON as readable text (flags for teams, names for players). */
export function AnswerLabel({
  type,
  answer,
  teamsById,
  playersById,
}: {
  type: QuestionType;
  answer: AnswerJson | null | undefined;
  teamsById: Map<string, TeamOption>;
  playersById: Map<string, PlayerOption>;
}) {
  if (!answer) return <span className="text-muted-foreground">—</span>;

  switch (type) {
    case "team": {
      const t = answer.team_id ? teamsById.get(answer.team_id) : undefined;
      return (
        <span>
          {t?.flag_url} {t?.name ?? "—"}
        </span>
      );
    }
    case "player": {
      const p = answer.player_id ? playersById.get(answer.player_id) : undefined;
      return <span>{p?.name ?? "—"}</span>;
    }
    case "number":
      return <span>{answer.value ?? "—"}</span>;
    case "team_ordered":
      return (
        <span>
          {(answer.team_ids ?? [])
            .map((id) => teamsById.get(id)?.flag_url ?? "")
            .join(" ")}
        </span>
      );
    case "player_multi":
      return (
        <span>
          {(answer.player_ids ?? [])
            .map((id) => playersById.get(id)?.name ?? "?")
            .join(", ")}
        </span>
      );
    default:
      return <span>—</span>;
  }
}

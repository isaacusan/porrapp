import { Avatar } from "@/components/brand/avatar";
import { AnswerLabel } from "./answer-label";
import type { QuestionType } from "@/lib/scoring/scoreQuestion";
import type {
  AnswerRow,
  TeamOption,
  PlayerOption,
} from "@/lib/questions/types";
import type { MemberLite } from "@/lib/matches/types";

export function OthersAnswers({
  type,
  answers,
  membersById,
  teamsById,
  playersById,
  myUserId,
}: {
  type: QuestionType;
  answers: AnswerRow[];
  membersById: Map<string, MemberLite>;
  teamsById: Map<string, TeamOption>;
  playersById: Map<string, PlayerOption>;
  myUserId: string;
}) {
  if (answers.length === 0) {
    return (
      <p className="py-2 text-center text-sm text-muted-foreground">
        Nadie respondió.
      </p>
    );
  }
  const sorted = [...answers].sort((a, b) =>
    a.user_id === myUserId ? -1 : b.user_id === myUserId ? 1 : 0,
  );
  return (
    <ul className="space-y-1.5">
      {sorted.map((ans) => {
        const m = membersById.get(ans.user_id);
        const isMe = ans.user_id === myUserId;
        return (
          <li
            key={ans.user_id}
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
            </span>
            <span className="text-sm font-semibold">
              <AnswerLabel
                type={type}
                answer={ans.answer}
                teamsById={teamsById}
                playersById={playersById}
              />
            </span>
          </li>
        );
      })}
    </ul>
  );
}

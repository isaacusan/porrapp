// lib/scoring/scoreQuestion.ts
// Función PURA para puntuar una respuesta a una pregunta general.
// No toca base de datos ni red.

export type QuestionType =
  | "team"
  | "player"
  | "team_ordered"
  | "player_multi"
  | "number";

/** Forma del JSON guardado tanto en la respuesta como en la solución. */
export type AnswerJson = {
  team_id?: string | null;
  player_id?: string | null;
  team_ids?: string[];
  player_ids?: string[];
  value?: number | string | null;
};

export type QuestionStatus = "correct" | "partial" | "wrong";

export interface QuestionScore {
  points: number;
  status: QuestionStatus;
}

const ratio = (matched: number, total: number, points: number) =>
  total > 0 ? Math.round((points * matched) / total) : 0;

export function scoreQuestion(
  type: QuestionType,
  answer: AnswerJson | null | undefined,
  correct: AnswerJson | null | undefined,
  points: number,
): QuestionScore {
  if (!answer || !correct) return { points: 0, status: "wrong" };

  switch (type) {
    case "team": {
      const ok = !!answer.team_id && answer.team_id === correct.team_id;
      return { points: ok ? points : 0, status: ok ? "correct" : "wrong" };
    }
    case "player": {
      const ok = !!answer.player_id && answer.player_id === correct.player_id;
      return { points: ok ? points : 0, status: ok ? "correct" : "wrong" };
    }
    case "number": {
      const ok =
        answer.value != null &&
        correct.value != null &&
        Number(answer.value) === Number(correct.value);
      return { points: ok ? points : 0, status: ok ? "correct" : "wrong" };
    }
    case "team_ordered": {
      const a = answer.team_ids ?? [];
      const c = correct.team_ids ?? [];
      let matched = 0;
      for (let i = 0; i < c.length; i++) if (a[i] && a[i] === c[i]) matched++;
      const pts = ratio(matched, c.length, points);
      return {
        points: pts,
        status: matched === c.length ? "correct" : matched > 0 ? "partial" : "wrong",
      };
    }
    case "player_multi": {
      const a = new Set(answer.player_ids ?? []);
      const c = correct.player_ids ?? [];
      const matched = c.filter((id) => a.has(id)).length;
      const pts = ratio(matched, c.length, points);
      return {
        points: pts,
        status: matched === c.length ? "correct" : matched > 0 ? "partial" : "wrong",
      };
    }
    default:
      return { points: 0, status: "wrong" };
  }
}

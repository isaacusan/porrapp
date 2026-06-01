import type { QuestionType, AnswerJson } from "@/lib/scoring/scoreQuestion";

export type Question = {
  id: string;
  type: QuestionType;
  prompt: string;
  points: number;
  resolved: boolean;
  correct_answer: AnswerJson | null;
  order_index: number;
};

export type TeamOption = {
  id: string;
  name: string;
  short_name: string | null;
  flag_url: string | null;
};

export type PlayerOption = {
  id: string;
  name: string;
};

export type AnswerRow = {
  question_id: string;
  user_id: string;
  answer: AnswerJson;
};

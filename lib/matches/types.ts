export type Team = {
  id: string;
  name: string;
  short_name: string | null;
  flag_url: string | null;
};

export type MatchPhase =
  | "group"
  | "round32"
  | "round16"
  | "quarter"
  | "semi"
  | "third_place"
  | "final";

export type MatchRow = {
  id: string;
  phase: MatchPhase;
  home_team_id: string | null;
  away_team_id: string | null;
  kickoff_at: string;
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  home_score: number | null;
  away_score: number | null;
  advancing_team_id: string | null;
  locked: boolean;
  matchday_id: string | null;
};

export type Prediction = {
  match_id: string;
  user_id: string;
  home_goals: number;
  away_goals: number;
  advancing_team_id: string | null;
  is_auto: boolean;
};

export type MemberLite = {
  user_id: string;
  display_name: string;
  avatar_id: string | null;
};

export type Matchday = {
  id: string;
  name: string;
  phase: MatchPhase;
  order_index: number;
  status: "upcoming" | "open" | "in_progress" | "closed" | "finished";
};

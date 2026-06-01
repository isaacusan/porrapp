// lib/powerups/catalog.ts
// UI metadata + which powerups are fully active in scoring right now.

/** Effect types whose scoring/prediction logic is fully implemented and tested. */
export const LIVE_EFFECTS = new Set<string>([
  "multiply_points", // double_or_nothing
  "multiply_if_exact", // all_in
  "min_points", // anti_zero_shield
  "exact_bonus", // epic_comeback
  "team_goals_boost", // goal_prophet
  "flat_bonus", // bench_inspiration
  "draw_consolation", // draw_joker
  "clean_sheet_bonus", // golden_glove
  "adjust_own_goal", // ghost_goal, def_scissors
  "adjust_other_goal", // leader_curse, stand_push
  "protect", // padlock
]);

/** Which powerup keys are live (derived for convenience in the UI). */
export const LIVE_KEYS = new Set<string>([
  "double_or_nothing",
  "all_in",
  "anti_zero_shield",
  "epic_comeback",
  "goal_prophet",
  "bench_inspiration",
  "draw_joker",
  "golden_glove",
  "ghost_goal",
  "def_scissors",
  "leader_curse",
  "stand_push",
  "padlock",
]);

export function isLiveEffect(effectType: string) {
  return LIVE_EFFECTS.has(effectType);
}

/** What the player must pick when using a powerup. */
export type UseTarget = "match" | "match_team" | "match_user_team" | "match_protect";

export function useTargetFor(effectType: string): UseTarget {
  switch (effectType) {
    case "adjust_own_goal":
      return "match_team"; // pick a match + which team
    case "adjust_other_goal":
      return "match_user_team"; // pick a match + rival + team
    case "protect":
      return "match_protect"; // pick a match to shield
    default:
      return "match"; // just pick a match
  }
}

/** Emoji per powerup key for a playful, card-like look. */
export const POWERUP_EMOJI: Record<string, string> = {
  double_or_nothing: "✖️2️⃣",
  var_savior: "📺",
  ghost_goal: "👻",
  def_scissors: "✂️",
  leader_curse: "😈",
  stand_push: "📣",
  anti_zero_shield: "🛡️",
  epic_comeback: "🔥",
  hawk_eye: "🦅",
  blind_copy: "🃏",
  late_change: "⏱️",
  goal_prophet: "🔮",
  padlock: "🔒",
  rebound: "↩️",
  all_in: "🎰",
  draw_joker: "🤝",
  soft_steal: "🥷",
  bench_inspiration: "💪",
  lightning_lock: "⚡",
  second_chance: "🔁",
  golden_glove: "🧤",
  controlled_jinx: "🎯",
};

export const RARITY_STYLE: Record<string, string> = {
  common: "bg-secondary text-secondary-foreground",
  rare: "bg-pitch/15 text-pitch-dark",
  epic: "bg-coral/15 text-coral",
  legendary: "bg-gold/25 text-gold-foreground",
};

export const RARITY_LABEL: Record<string, string> = {
  common: "Común",
  rare: "Rara",
  epic: "Épica",
  legendary: "Legendaria",
};

/** Rubber-band weight multiplier per rarity, before the ranking boost. */
export const RARITY_BASE_WEIGHT: Record<string, number> = {
  common: 1.0,
  rare: 0.5,
  epic: 0.22,
  legendary: 0.08,
};

// lib/football/normalize.ts
// PURE functions turning each provider's raw JSON into ProviderMatch[]. No I/O.

import {
  type ProviderMatch,
  type ProviderTeam,
  type MatchPhase,
  type MatchStatus,
  PHASE_ORDER,
  PHASE_LABEL,
} from "./types";

/** A name with a digit is an undetermined knockout slot ("2A", "W73"), not a team. */
function isPlaceholder(name: string) {
  return /\d/.test(name) || name.trim().length === 0;
}

function slug(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ---------------------------------------------------------------------------
// openfootball (github, public domain, no key)
// round names: "Matchday N", "Round of 32/16", "Quarter-final(s)",
// "Semi-final(s)", "Match for third place", "Final"
// score: { ft:[h,a], ht:[h,a], et?:[h,a], p?:[h,a] } present only when played
// ---------------------------------------------------------------------------
function openfootballPhase(round: string): { phase: MatchPhase; name: string; order: number; mdNum: number | null } {
  const md = round.match(/^Matchday\s+(\d+)/i);
  if (md) {
    const n = Number(md[1]);
    return { phase: "group", name: `Jornada ${n}`, order: n, mdNum: n };
  }
  const r = round.toLowerCase();
  let phase: MatchPhase = "group";
  if (r.includes("round of 32")) phase = "round32";
  else if (r.includes("round of 16")) phase = "round16";
  else if (r.includes("quarter")) phase = "quarter";
  else if (r.includes("semi")) phase = "semi";
  else if (r.includes("third")) phase = "third_place";
  else if (r.includes("final")) phase = "final";
  return { phase, name: PHASE_LABEL[phase], order: PHASE_ORDER[phase], mdNum: null };
}

function teamFrom(name: string): ProviderTeam | null {
  if (!name || isPlaceholder(name)) return null;
  return { externalId: slug(name), name, shortName: null };
}

export function normalizeOpenfootball(json: any): ProviderMatch[] {
  const matches: any[] = Array.isArray(json?.matches) ? json.matches : [];
  const out: ProviderMatch[] = [];

  for (const m of matches) {
    const { phase, name, order } = openfootballPhase(String(m.round ?? ""));
    const home = teamFrom(String(m.team1 ?? ""));
    const away = teamFrom(String(m.team2 ?? ""));
    const score = m.score;

    const status: MatchStatus = score?.ft ? "finished" : "scheduled";
    const homeScore = score?.ft ? Number(score.ft[0]) : null;
    const awayScore = score?.ft ? Number(score.ft[1]) : null;

    // Knockout winner (penalties > extra time > full time).
    let advancing: string | null = null;
    if (phase !== "group" && score && home && away) {
      const tie = score.p ?? score.et ?? score.ft;
      if (tie) advancing = tie[0] > tie[1] ? home.externalId : tie[1] > tie[0] ? away.externalId : null;
    }

    const externalId =
      m.num != null
        ? `m${m.num}`
        : `${m.date ?? ""}-${slug(String(m.team1 ?? "x"))}-${slug(String(m.team2 ?? "y"))}`;

    out.push({
      externalId,
      utcDate: m.date ? `${m.date}T${(m.time ?? "12:00").split(" ")[0]}:00Z` : new Date().toISOString(),
      status,
      phase,
      matchdayName: name,
      matchdayOrder: order,
      homeTeam: home,
      awayTeam: away,
      homeScore,
      awayScore,
      advancingTeamExternalId: advancing,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// football-data.org v4
// GET /v4/competitions/{code}/matches  (header X-Auth-Token)
// match: { id, utcDate, status, stage, homeTeam{id,name,tla}, awayTeam{...},
//          score:{ winner, fullTime:{home,away} } }
// ---------------------------------------------------------------------------
const FD_STATUS: Record<string, MatchStatus> = {
  SCHEDULED: "scheduled",
  TIMED: "scheduled",
  IN_PLAY: "live",
  PAUSED: "live",
  FINISHED: "finished",
  AWARDED: "finished",
  SUSPENDED: "postponed",
  POSTPONED: "postponed",
  CANCELLED: "cancelled",
};

function fdPhase(stage: string): MatchPhase {
  switch (stage) {
    case "LAST_32":
      return "round32";
    case "LAST_16":
      return "round16";
    case "QUARTER_FINALS":
    case "QUARTER_FINAL":
      return "quarter";
    case "SEMI_FINALS":
    case "SEMI_FINAL":
      return "semi";
    case "THIRD_PLACE":
    case "3RD_PLACE":
      return "third_place";
    case "FINAL":
      return "final";
    default:
      return "group";
  }
}

function fdTeam(t: any): ProviderTeam | null {
  if (!t || t.id == null) return null;
  return {
    externalId: String(t.id),
    name: t.name ?? t.shortName ?? t.tla ?? "?",
    shortName: t.tla ?? t.shortName ?? null,
  };
}

export function normalizeFootballData(json: any): ProviderMatch[] {
  const matches: any[] = Array.isArray(json?.matches) ? json.matches : [];
  return matches.map((m) => {
    const phase = fdPhase(String(m.stage ?? ""));
    const home = fdTeam(m.homeTeam);
    const away = fdTeam(m.awayTeam);
    const status = FD_STATUS[m.status] ?? "scheduled";
    const ft = m.score?.fullTime ?? {};
    const homeScore = status === "finished" && ft.home != null ? Number(ft.home) : null;
    const awayScore = status === "finished" && ft.away != null ? Number(ft.away) : null;

    let advancing: string | null = null;
    if (phase !== "group" && m.score?.winner && home && away) {
      if (m.score.winner === "HOME_TEAM") advancing = home.externalId;
      else if (m.score.winner === "AWAY_TEAM") advancing = away.externalId;
    }

    const name =
      phase === "group"
        ? `Jornada ${m.matchday ?? 1}`
        : PHASE_LABEL[phase];
    const order = phase === "group" ? Number(m.matchday ?? 1) : PHASE_ORDER[phase];

    return {
      externalId: String(m.id),
      utcDate: m.utcDate ?? new Date().toISOString(),
      status,
      phase,
      matchdayName: name,
      matchdayOrder: order,
      homeTeam: home,
      awayTeam: away,
      homeScore,
      awayScore,
      advancingTeamExternalId: advancing,
    };
  });
}

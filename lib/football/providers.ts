// lib/football/providers.ts
import type { FootballProvider, ProviderMatch } from "./types";
import { normalizeOpenfootball, normalizeFootballData } from "./normalize";

async function getJson(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, { headers, cache: "no-store" });
  if (!res.ok) {
    throw new Error(`La API respondió ${res.status} ${res.statusText}`);
  }
  return res.json();
}

/** openfootball — public domain JSON on GitHub, NO API key required. */
const openfootball: FootballProvider = {
  key: "openfootball",
  label: "openfootball (gratis, sin clave)",
  async fetchMatches(competition: string): Promise<ProviderMatch[]> {
    const season = competition || "2026";
    const url = `https://raw.githubusercontent.com/openfootball/worldcup.json/master/${season}/worldcup.json`;
    return normalizeOpenfootball(await getJson(url));
  },
};

/** football-data.org v4 — free tier covers the World Cup (code "WC"). */
const footballdata: FootballProvider = {
  key: "footballdata",
  label: "football-data.org (gratis con clave)",
  async fetchMatches(competition: string): Promise<ProviderMatch[]> {
    const token = process.env.FOOTBALL_API_KEY;
    if (!token) throw new Error("Falta FOOTBALL_API_KEY en el servidor.");
    const code = competition || "WC";
    const url = `https://api.football-data.org/v4/competitions/${code}/matches`;
    return normalizeFootballData(await getJson(url, { "X-Auth-Token": token }));
  },
};

const PROVIDERS: Record<string, FootballProvider> = {
  openfootball,
  footballdata,
};

export function getProvider(key: string | null | undefined): FootballProvider | null {
  if (!key) return null;
  return PROVIDERS[key] ?? null;
}

export const PROVIDER_OPTIONS = [
  { key: "openfootball", label: "openfootball — gratis, sin clave", competitionHint: "2026" },
  { key: "footballdata", label: "football-data.org — gratis con clave", competitionHint: "WC" },
];

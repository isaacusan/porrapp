import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadMockWorldCupAction } from "@/lib/matches/actions";
import { PredictionCard } from "@/components/matches/prediction-card";
import { OthersPredictions } from "@/components/matches/others-predictions";
import { AdminResultForm } from "@/components/matches/admin-result-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SoccerBall } from "@/components/brand/soccer-ball";
import { ArrowLeft, Download } from "lucide-react";
import type {
  Team,
  MatchRow,
  Prediction,
  MemberLite,
  Matchday,
} from "@/lib/matches/types";

export const metadata: Metadata = { title: "Partidos · PORRAPP" };

function hasStarted(m: MatchRow) {
  return (
    m.locked ||
    m.status === "live" ||
    m.status === "finished" ||
    new Date(m.kickoff_at).getTime() <= Date.now()
  );
}

export default async function MatchesPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id, name")
    .eq("id", params.id)
    .maybeSingle();
  if (!tournament) notFound();

  const [
    { data: membership },
    { data: matchdays },
    { data: matches },
    { data: teams },
    { data: members },
    { data: predictions },
  ] = await Promise.all([
    supabase
      .from("tournament_members")
      .select("role")
      .eq("tournament_id", tournament.id)
      .eq("user_id", user!.id)
      .single(),
    supabase
      .from("matchdays")
      .select("id, name, phase, order_index, status")
      .eq("tournament_id", tournament.id)
      .order("order_index"),
    supabase
      .from("matches")
      .select(
        "id, phase, home_team_id, away_team_id, kickoff_at, status, home_score, away_score, advancing_team_id, locked, matchday_id",
      )
      .eq("tournament_id", tournament.id)
      .order("kickoff_at"),
    supabase.from("teams").select("id, name, short_name, flag_url"),
    supabase
      .from("tournament_members")
      .select("user_id, display_name, avatar_id")
      .eq("tournament_id", tournament.id)
      .eq("status", "active"),
    supabase
      .from("match_predictions")
      .select("match_id, user_id, home_goals, away_goals, advancing_team_id, is_auto")
      .eq("tournament_id", tournament.id),
  ]);

  const isAdmin = membership?.role === "admin";
  const teamsById = new Map<string, Team>(
    (teams as Team[] | null)?.map((t) => [t.id, t]) ?? [],
  );
  const membersById = new Map<string, MemberLite>(
    (members as MemberLite[] | null)?.map((m) => [m.user_id, m]) ?? [],
  );
  const allPredictions = (predictions as Prediction[] | null) ?? [];
  const myPredByMatch = new Map<string, Prediction>(
    allPredictions.filter((p) => p.user_id === user!.id).map((p) => [p.match_id, p]),
  );
  const predsByMatch = new Map<string, Prediction[]>();
  for (const p of allPredictions) {
    const arr = predsByMatch.get(p.match_id) ?? [];
    arr.push(p);
    predsByMatch.set(p.match_id, arr);
  }

  const mdList = (matchdays as Matchday[] | null) ?? [];
  const allMatches = (matches as MatchRow[] | null) ?? [];

  const header = (
    <Link
      href={`/t/${tournament.id}`}
      className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      {tournament.name}
    </Link>
  );

  // Empty: no matches loaded yet
  if (allMatches.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        {header}
        <h1 className="text-4xl">Partidos</h1>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <SoccerBall className="size-14 text-pitch" />
            <div>
              <h2 className="text-2xl">Aún no hay partidos</h2>
              <p className="mt-1 text-muted-foreground">
                {isAdmin
                  ? "Carga el Mundial de prueba para empezar a predecir mientras conectamos los datos reales."
                  : "El admin todavía no ha cargado los partidos. ¡Paciencia!"}
              </p>
            </div>
            {isAdmin && (
              <form action={loadMockWorldCupAction}>
                <input type="hidden" name="tournamentId" value={tournament.id} />
                <Button type="submit" size="lg" variant="gold">
                  <Download />
                  Cargar Mundial de prueba
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const grouped = mdList
    .map((md) => ({
      md,
      matches: allMatches.filter((m) => m.matchday_id === md.id),
    }))
    .filter((g) => g.matches.length > 0);
  const orphan = allMatches.filter((m) => !m.matchday_id);

  function renderMatch(m: MatchRow) {
    const started = hasStarted(m);
    const finished = m.status === "finished";
    const home = m.home_team_id ? teamsById.get(m.home_team_id) : undefined;
    const away = m.away_team_id ? teamsById.get(m.away_team_id) : undefined;
    const reveal = started ? (
      <OthersPredictions
        predictions={predsByMatch.get(m.id) ?? []}
        membersById={membersById}
        teamsById={teamsById}
        myUserId={user!.id}
        isKnockout={m.phase !== "group"}
      />
    ) : undefined;
    return (
      <div key={m.id}>
        <PredictionCard
          match={m}
          home={home}
          away={away}
          myPrediction={myPredByMatch.get(m.id)}
          started={started}
          finished={finished}
          reveal={reveal}
          revealCount={(predsByMatch.get(m.id) ?? []).length}
        />
        {isAdmin && <AdminResultForm match={m} home={home} away={away} />}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {header}
      <div>
        <h1 className="text-4xl">Partidos</h1>
        <p className="text-muted-foreground">
          Marca tu porra antes del pitido inicial. Después se bloquea y se revela
          la de todos. 🔒
        </p>
      </div>

      {grouped.map(({ md, matches }) => (
        <section key={md.id} className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl">{md.name}</h2>
          </div>
          {matches.map(renderMatch)}
        </section>
      ))}

      {orphan.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-2xl">Otros partidos</h2>
          {orphan.map(renderMatch)}
        </section>
      )}
    </div>
  );
}

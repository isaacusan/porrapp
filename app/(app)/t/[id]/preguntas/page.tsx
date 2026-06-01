import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { scoreQuestion, type AnswerJson } from "@/lib/scoring/scoreQuestion";
import { QuestionCard } from "@/components/questions/question-card";
import { OthersAnswers } from "@/components/questions/others-answers";
import { AnswerLabel } from "@/components/questions/answer-label";
import { AdminQuestionsBar } from "@/components/questions/admin-questions-bar";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, HelpCircle } from "lucide-react";
import type {
  Question,
  TeamOption,
  PlayerOption,
  AnswerRow,
} from "@/lib/questions/types";
import type { MemberLite } from "@/lib/matches/types";

export const metadata: Metadata = { title: "Preguntas · PORRAPP" };

export default async function QuestionsPage({
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
    .select("id, name, questions_locked_at")
    .eq("id", params.id)
    .maybeSingle();
  if (!tournament) notFound();

  const [
    { data: membership },
    { data: questions },
    { data: tteams },
    { data: players },
    { data: members },
    { data: answers },
  ] = await Promise.all([
    supabase
      .from("tournament_members")
      .select("role")
      .eq("tournament_id", tournament.id)
      .eq("user_id", user!.id)
      .single(),
    supabase
      .from("general_questions")
      .select("id, type, prompt, points, resolved, correct_answer, order_index")
      .eq("tournament_id", tournament.id)
      .eq("active", true)
      .order("order_index"),
    supabase
      .from("tournament_teams")
      .select("team:team_id(id, name, short_name, flag_url)")
      .eq("tournament_id", tournament.id),
    supabase.from("players").select("id, name").order("name"),
    supabase
      .from("tournament_members")
      .select("user_id, display_name, avatar_id")
      .eq("tournament_id", tournament.id)
      .eq("status", "active"),
    supabase
      .from("general_answers")
      .select("question_id, user_id, answer")
      .eq("tournament_id", tournament.id),
  ]);

  const isAdmin = membership?.role === "admin";
  const closed =
    !!tournament.questions_locked_at &&
    new Date(tournament.questions_locked_at).getTime() <= Date.now();

  const teamOptions = ((tteams ?? []) as unknown as {
    team: TeamOption | TeamOption[] | null;
  }[])
    .map((r) => (Array.isArray(r.team) ? r.team[0] : r.team))
    .filter((t): t is TeamOption => !!t)
    .sort((a, b) => a.name.localeCompare(b.name));
  const playerOptions = (players as PlayerOption[] | null) ?? [];

  const teamsById = new Map(teamOptions.map((t) => [t.id, t]));
  const playersById = new Map(playerOptions.map((p) => [p.id, p]));
  const membersById = new Map<string, MemberLite>(
    (members as MemberLite[] | null)?.map((m) => [m.user_id, m]) ?? [],
  );

  const allAnswers = (answers as AnswerRow[] | null) ?? [];
  const myAnswerByQ = new Map<string, AnswerJson>(
    allAnswers.filter((a) => a.user_id === user!.id).map((a) => [a.question_id, a.answer]),
  );
  const answersByQ = new Map<string, AnswerRow[]>();
  for (const a of allAnswers) {
    const arr = answersByQ.get(a.question_id) ?? [];
    arr.push(a);
    answersByQ.set(a.question_id, arr);
  }

  const qs = (questions as Question[] | null) ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href={`/t/${tournament.id}`}
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {tournament.name}
      </Link>

      <div>
        <h1 className="text-4xl">Preguntas</h1>
        <p className="text-muted-foreground">
          Las grandes apuestas del torneo. Responde antes del cierre; luego se
          revelan todas. 🔮
        </p>
      </div>

      {isAdmin && (
        <AdminQuestionsBar tournamentId={tournament.id} closed={closed} />
      )}

      {qs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <HelpCircle className="size-12 text-pitch" />
            <p className="text-muted-foreground">
              {isAdmin
                ? "Aún no hay preguntas. Añade la primera arriba."
                : "El admin todavía no ha publicado preguntas."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {qs.map((q) => {
            const myAnswer = myAnswerByQ.get(q.id);
            const qAnswers = answersByQ.get(q.id) ?? [];
            const myResult =
              q.resolved && myAnswer
                ? scoreQuestion(q.type, myAnswer, q.correct_answer, q.points)
                : null;
            return (
              <QuestionCard
                key={q.id}
                question={q}
                teamOptions={teamOptions}
                playerOptions={playerOptions}
                myAnswer={myAnswer}
                closed={closed}
                isAdmin={isAdmin}
                revealCount={qAnswers.length}
                reveal={
                  closed ? (
                    <OthersAnswers
                      type={q.type}
                      answers={qAnswers}
                      membersById={membersById}
                      teamsById={teamsById}
                      playersById={playersById}
                      myUserId={user!.id}
                    />
                  ) : undefined
                }
                myAnswerLabel={
                  <AnswerLabel
                    type={q.type}
                    answer={myAnswer}
                    teamsById={teamsById}
                    playersById={playersById}
                  />
                }
                correctAnswerLabel={
                  q.resolved ? (
                    <AnswerLabel
                      type={q.type}
                      answer={q.correct_answer}
                      teamsById={teamsById}
                      playersById={playersById}
                    />
                  ) : undefined
                }
                myResult={myResult}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

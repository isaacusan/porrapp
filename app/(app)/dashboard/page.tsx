import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SoccerBall } from "@/components/brand/soccer-ball";
import {
  TournamentCard,
  type TournamentSummary,
} from "@/components/tournaments/tournament-card";
import { Plus, Ticket } from "lucide-react";

export const metadata: Metadata = { title: "Inicio · PORRAPP" };

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: tournaments }] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", user!.id).single(),
    supabase.rpc("my_tournaments"),
  ]);

  const list = (tournaments ?? []) as TournamentSummary[];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Hola{profile?.username ? `, @${profile.username}` : ""} 👋
          </p>
          <h1 className="text-4xl">Tus porras</h1>
        </div>
      </div>

      {list.length === 0 ? (
        <Card className="animate-pop-in overflow-hidden">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <SoccerBall className="size-16 text-pitch" />
            <div>
              <h2 className="text-2xl">Todavía no estás en ninguna porra</h2>
              <p className="mt-1 text-muted-foreground">
                Crea tu propio torneo del Mundial o únete al de un amigo con un
                código de invitación.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/tournaments/new" className={cn(buttonVariants({ size: "lg" }))}>
                <Plus />
                Crear torneo
              </Link>
              <Link
                href="/join"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                <Ticket />
                Unirme con código
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {list.map((t) => (
              <TournamentCard key={t.id} t={t} />
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/tournaments/new"
              className={cn(buttonVariants({ size: "lg" }), "flex-1")}
            >
              <Plus />
              Crear otro torneo
            </Link>
            <Link
              href="/join"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "flex-1")}
            >
              <Ticket />
              Unirme con código
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

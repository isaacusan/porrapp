import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { JoinTournamentForm } from "@/components/tournaments/join-form";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Unirme a un torneo · PORRAPP" };

export default async function JoinPage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user!.id)
    .single();

  return (
    <div className="mx-auto max-w-md space-y-5">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>
      <div>
        <h1 className="text-4xl">Unirme a un torneo</h1>
        <p className="text-muted-foreground">
          Pega el código que te ha pasado tu amigo.
        </p>
      </div>
      <Card>
        <CardContent className="p-5">
          <JoinTournamentForm
            defaultDisplayName={profile?.username ?? ""}
            defaultCode={searchParams.code ?? ""}
          />
        </CardContent>
      </Card>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateTournamentForm } from "@/components/tournaments/create-form";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Crear torneo · PORRAPP" };

export default async function NewTournamentPage() {
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
    <div className="mx-auto max-w-xl space-y-5">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver
      </Link>
      <div>
        <h1 className="text-4xl">Crear torneo</h1>
        <p className="text-muted-foreground">
          Serás el admin: podrás invitar, poner resultados y ajustar las reglas.
        </p>
      </div>
      <Card>
        <CardContent className="p-5">
          <CreateTournamentForm defaultDisplayName={profile?.username ?? ""} />
        </CardContent>
      </Card>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { JoinTournamentForm } from "@/components/tournaments/join-form";
import { Card, CardContent } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

export const metadata: Metadata = { title: "Invitación · PORRAPP" };

type Preview = {
  name: string;
  description: string | null;
  member_count: number;
  status: string;
};

export default async function JoinByCodePage({
  params,
}: {
  params: { code: string };
}) {
  const code = params.code.toUpperCase();
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: previews }] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", user!.id).single(),
    supabase.rpc("tournament_preview_by_code", { p_code: code }),
  ]);

  const preview = (previews as Preview[] | null)?.[0];

  if (!preview) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <Alert variant="error">
          Esta invitación no es válida o el torneo ya no existe.
        </Alert>
        <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Te han invitado a
        </p>
        <h1 className="text-4xl">{preview.name}</h1>
        {preview.description && (
          <p className="mt-1 text-muted-foreground">{preview.description}</p>
        )}
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="size-4" />
          {preview.member_count}{" "}
          {preview.member_count === 1 ? "jugador" : "jugadores"} ya dentro
        </p>
      </div>
      <Card>
        <CardContent className="p-5">
          <JoinTournamentForm
            defaultDisplayName={profile?.username ?? ""}
            defaultCode={code}
            lockedCode
          />
        </CardContent>
      </Card>
    </div>
  );
}

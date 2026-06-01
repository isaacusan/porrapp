import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncTournament } from "@/lib/football/sync";

export const dynamic = "force-dynamic";

/**
 * Called by Vercel Cron (see vercel.json). Protected by CRON_SECRET so nobody
 * else can trigger it. Syncs every tournament that has auto-sync enabled.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  const url = new URL(req.url);
  const provided = auth?.replace(/^Bearer\s+/i, "") || url.searchParams.get("secret");

  if (!secret || provided !== secret) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const admin = createAdminClient();
  const { data: tournaments } = await admin
    .from("tournaments")
    .select("id, api_provider, api_competition, api_sync_enabled")
    .eq("api_sync_enabled", true);

  const results = [];
  for (const t of tournaments ?? []) {
    const r = await syncTournament(admin, t);
    results.push({ tournament: t.id, ...r });
  }

  return NextResponse.json({ ran: results.length, results });
}

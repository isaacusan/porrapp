import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function csvCell(v: string | number) {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("No autorizado", { status: 401 });

  const { data: membership } = await supabase
    .from("tournament_members")
    .select("role")
    .eq("tournament_id", params.id)
    .eq("user_id", user.id)
    .single();
  if (membership?.role !== "admin") {
    return new NextResponse("Solo el admin puede exportar.", { status: 403 });
  }

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("name")
    .eq("id", params.id)
    .single();

  const { data: ranking } = await supabase.rpc("tournament_ranking", {
    p_tournament: params.id,
  });

  const rows = [
    ["Posición", "Jugador", "Puntos"],
    ...(ranking ?? []).map((r: any) => [r.position, r.display_name, r.points]),
  ];
  const csv = "\uFEFF" + rows.map((r) => r.map(csvCell).join(",")).join("\r\n");

  const slug = (tournament?.name ?? "porrapp")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clasificacion-${slug}.csv"`,
    },
  });
}

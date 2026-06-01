import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { usernameSchema } from "@/lib/auth/validation";

/**
 * Lightweight availability check used by the registration form as the user
 * types. Runs server-side so the Supabase SDK never ships to the browser.
 */
export async function GET(request: NextRequest) {
  const u = request.nextUrl.searchParams.get("u") ?? "";
  const parsed = usernameSchema.safeParse(u);
  if (!parsed.success) {
    return NextResponse.json({ available: false, invalid: true });
  }

  const supabase = createClient();
  const { data, error } = await supabase.rpc("username_available", {
    p_username: parsed.data,
  });

  if (error) {
    return NextResponse.json({ available: null }, { status: 200 });
  }
  return NextResponse.json({ available: data === true });
}

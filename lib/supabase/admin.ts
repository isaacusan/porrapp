import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * PRIVILEGED client that bypasses Row Level Security using the service role key.
 *
 * Use ONLY inside trusted server code (Cron jobs, API sync, full ranking
 * recalculation) where we have already checked permissions ourselves.
 * NEVER import this from a Client Component. The `server-only` guard above
 * makes the build fail if that ever happens by mistake.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

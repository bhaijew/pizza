/**
 * Admin Supabase client.
 * Uses service_role key when configured, which bypasses RLS.
 * If service_role key is not configured yet, falls back to publishable key
 * with an informative warning so admin pages can still render.
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function isServiceRoleConfigured(): boolean {
  return (
    !!serviceRoleKey &&
    serviceRoleKey !== "your-service-role-key-here" &&
    serviceRoleKey.length > 20
  );
}

export function createAdminClient() {
  const key = isServiceRoleConfigured()
    ? serviceRoleKey!
    : (publishableKey || "dummy-key");

  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

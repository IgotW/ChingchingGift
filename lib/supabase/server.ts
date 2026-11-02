import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getSupabaseConfig,
  SupabaseNotConfiguredError,
} from "./config";

/**
 * Request-scoped Supabase client that reads and refreshes the auth cookies.
 * Create a fresh client for every server render — never share it.
 */
export async function createServerSupabase(): Promise<SupabaseClient> {
  const config = getSupabaseConfig();
  if (!config) throw new SupabaseNotConfiguredError();

  const cookieStore = await cookies();

  return createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. The proxy refreshes the
          // session for those requests, so this is safe to ignore here.
        }
      },
    },
  });
}

/**
 * Service-role client for cross-user side effects (notification emails).
 * Server-only. Returns null when no service key is configured, which simply
 * disables email delivery while keeping in-app notifications working.
 */
export function createAdminSupabase(): SupabaseClient | null {
  const config = getSupabaseConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!config || !serviceKey) return null;

  return createClient(config.url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

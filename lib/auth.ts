import { cache } from "react";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createServerSupabase } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/config";
import type { Profile } from "./types";

/**
 * The verified signed-in user for this request, or null.
 * Wrapped in React cache so multiple components share one auth check.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  // Supabase validates session expiry against the clock, so this read can't
  // be part of the prerendered shell.
  await connection();

  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
});

export const getCurrentProfile = cache(
  async (): Promise<{ user: User; profile: Profile } | null> => {
    const user = await getCurrentUser();
    if (!user) return null;

    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, created_at")
      .eq("id", user.id)
      .maybeSingle<Profile>();

    if (data) return { user, profile: data };

    // The database trigger normally creates this row. If it was missed, the
    // user can safely create their own profile thanks to the RLS policy.
    const fallbackName =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email?.split("@")[0] ??
      "Christmas friend";

    const { data: created } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        full_name: fallbackName,
        avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
      })
      .select("id, full_name, avatar_url, created_at")
      .maybeSingle<Profile>();

    return created ? { user, profile: created } : null;
  },
);

/**
 * Guard for protected pages. Redirects to the setup screen when the database
 * is not connected, or to sign-in while remembering where the user was going.
 */
export async function requireProfile(nextPath = "/dashboard") {
  if (!isSupabaseConfigured()) redirect("/setup");

  const session = await getCurrentProfile();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return session;
}

export async function requireUser(nextPath = "/dashboard") {
  if (!isSupabaseConfigured()) redirect("/setup");

  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return user;
}

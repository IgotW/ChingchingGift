import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/validation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeInternalPath(url.searchParams.get("next"));
  const errorDescription = url.searchParams.get("error_description");

  if (errorDescription) {
    return NextResponse.redirect(
      new URL(
        `/auth/auth-code-error?reason=${encodeURIComponent(errorDescription)}`,
        url.origin,
      ),
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL("/auth/auth-code-error", url.origin));
  }

  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(
          `/auth/auth-code-error?reason=${encodeURIComponent(error.message)}`,
          url.origin,
        ),
      );
    }
  } catch {
    return NextResponse.redirect(new URL("/auth/auth-code-error", url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}

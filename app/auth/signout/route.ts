import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
  } catch {
    // If the project is not configured there is nothing to sign out of.
  }

  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}

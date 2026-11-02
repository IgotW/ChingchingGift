"use client";

import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

export function GoogleSignInButton({
  next = "/dashboard",
  label = "Continue with Google",
  className = "btn btn-pine w-full sm:w-auto",
}: {
  next?: string;
  label?: string;
  className?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn() {
    setLoading(true);
    setError(null);
    try {
      const supabase = getBrowserSupabase();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: { prompt: "select_account" },
        },
      });
      if (authError) {
        setError(authError.message);
        setLoading(false);
      }
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not start Google sign-in. Please try again.",
      );
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={signIn}
        disabled={loading}
        className={className}
      >
        <svg viewBox="0 0 24 24" className="size-4 shrink-0" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.5 12.27c0-.85-.08-1.66-.23-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.27-2.09 3.57-5.17 3.57-8.81Z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.96-1.07 7.93-2.92l-3.87-3c-1.08.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.95H1.28v3.09A12 12 0 0 0 12 24Z"
          />
          <path
            fill="#FBBC05"
            d="M5.27 14.28a7.2 7.2 0 0 1 0-4.56V6.63H1.28a12 12 0 0 0 0 10.74l3.99-3.09Z"
          />
          <path
            fill="#EA4335"
            d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.43-3.43A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.28 6.63l3.99 3.09C6.22 6.88 8.87 4.77 12 4.77Z"
          />
        </svg>
        {loading ? "Opening Google…" : label}
      </button>
      {error ? (
        <p role="alert" className="text-sm font-medium text-holly-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

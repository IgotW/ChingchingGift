import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { getCurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { safeInternalPath } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Sign in",
};

type LoginSearchParams = {
  next?: string;
  error?: string;
};

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<LoginSearchParams>;
}) {
  if (!isSupabaseConfigured()) redirect("/setup");

  const params = await searchParams;
  const next = safeInternalPath(params.next);
  const user = await getCurrentUser();
  if (user) redirect(next);

  return (
    <div className="container-page grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1fr_0.9fr] lg:py-20">
      <div className="max-w-lg">
        <span className="chip bg-gold-100 text-gold-500 shadow-none">
          <span className="size-1.5 rounded-full bg-gold-500" />
          One tap, no passwords
        </span>
        <h1 className="mt-5 font-display text-4xl leading-tight text-pine-950 sm:text-5xl">
          Welcome to the
          <br />
          Christmas exchange.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-muted">
          Sign in with the Google account you use every day. We only keep your
          name, avatar, and verified email — never a password.
        </p>

        <div className="mt-8 max-w-sm">
          <GoogleSignInButton next={next} />
          {params.error ? (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-holly-600/25 bg-holly-100/70 px-3.5 py-2.5 text-sm font-medium text-holly-700"
            >
              Google sign-in did not finish. Please try again.
            </p>
          ) : null}
          <p className="prose-note mt-4">
            By continuing you agree to keep every Secret Santa assignment
            confidential. The surprise depends on it.
          </p>
        </div>

        <p className="mt-8 text-sm text-muted">
          Joining an exchange instead?{" "}
          <Link href="/join" className="link">
            Use your invitation code
          </Link>
        </p>
      </div>

      <div className="relative mx-auto w-full max-w-sm">
        <div className="absolute -right-4 -top-5 z-10 rotate-6 rounded-xl border border-cream-200 bg-white px-3 py-2 shadow-lg">
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-muted">
            This year
          </p>
          <p className="font-display text-lg text-pine-900">Secret, sorted</p>
        </div>
        <div className="card overflow-hidden">
          <div className="bg-pine-950 px-6 py-8 text-cream-50">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-gold-400">
              ChingChingGift
            </p>
            <p className="mt-2 font-display text-3xl leading-tight">
              Ho ho ho,
              <br />
              let&apos;s get organised.
            </p>
          </div>
          <div className="space-y-4 p-6">
            {[
              ["Draw names fairly", "No self-gifts, no duplicates."],
              ["Keep it private", "Only you see your recipient."],
              ["Share wishlists", "The right list, for the right person."],
            ].map(([title, body]) => (
              <div key={title} className="flex gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-pine-100 text-pine-800">
                  <svg
                    viewBox="0 0 24 24"
                    className="size-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-pine-950">{title}</p>
                  <p className="text-xs text-muted">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<LoginSearchParams>;
}) {
  return (
    <Suspense
      fallback={
        <div className="container-page py-24">
          <div className="h-10 w-64 animate-pulse rounded-full bg-cream-200" />
          <div className="mt-6 h-4 w-80 animate-pulse rounded-full bg-cream-200" />
          <div className="mt-10 h-12 w-56 animate-pulse rounded-full bg-cream-200" />
        </div>
      }
    >
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}

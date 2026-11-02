import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign-in problem",
};

async function AuthCodeErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  return (
    <div className="container-page flex flex-1 items-center justify-center py-20">
      <div className="card w-full max-w-lg p-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-holly-100 text-holly-600">
          <svg
            viewBox="0 0 24 24"
            className="size-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" />
          </svg>
        </span>
        <h1 className="mt-5 font-display text-3xl text-pine-950">
          We couldn&apos;t finish signing you in
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          The Google sign-in link may have expired or been used already. Head
          back and try once more — it usually works on the second try.
        </p>
        {reason ? (
          <p className="mt-4 rounded-xl bg-cream-100 px-3 py-2 text-xs text-muted">
            {reason}
          </p>
        ) : null}
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/login" className="btn btn-primary">
            Try signing in again
          </Link>
          <Link href="/" className="btn btn-secondary">
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthCodeErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="container-page flex flex-1 items-center justify-center py-20">
          <div className="card w-full max-w-lg p-8">
            <div className="mx-auto size-14 animate-pulse rounded-full bg-cream-200" />
            <div className="mx-auto mt-5 h-8 w-72 animate-pulse rounded-full bg-cream-200" />
            <div className="mx-auto mt-4 h-4 w-80 animate-pulse rounded-full bg-cream-200" />
            <div className="mx-auto mt-7 h-10 w-48 animate-pulse rounded-full bg-cream-200" />
          </div>
        </div>
      }
    >
      <AuthCodeErrorContent searchParams={searchParams} />
    </Suspense>
  );
}

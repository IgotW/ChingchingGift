"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[chingchinggift] page error", error.message);
  }, [error]);

  return (
    <div className="container-page flex flex-1 items-center justify-center py-20">
      <div className="card w-full max-w-lg p-8 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-gold-100 text-gold-500">
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
            <path d="M12 3 2.8 20h18.4L12 3Z" />
            <path d="M12 9v5M12 17h.01" />
          </svg>
        </span>
        <h1 className="mt-5 font-display text-3xl text-pine-950">
          A little tangle in the tinsel
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Something went wrong while loading this page. Nothing was lost — try
          again, or head back to your dashboard.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="btn btn-primary">
            Try again
          </button>
          <Link href="/dashboard" className="btn btn-secondary">
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

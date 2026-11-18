import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { EmptyState } from "@/components/empty-state";
import { PublicDraw } from "@/components/public-draw";
import { StatusChip } from "@/components/status-chip";
import { drawAndRevealAction } from "@/lib/actions/events";
import { getEventPreview } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Draw your Secret Santa",
};

async function PreviewContent({ code }: { code: string }) {
  await connection();

  if (!isSupabaseConfigured()) redirect("/setup");

  const preview = await getEventPreview(code);

  if (!preview) {
    return (
      <div className="container-page max-w-2xl py-14">
        <Link
          href="/"
          className="text-sm font-semibold text-muted hover:text-pine-800"
        >
          ← Home
        </Link>
        <div className="mt-6">
          <EmptyState
            icon="gift"
            title="That invitation was not found"
            body="The link may be incomplete or the code may have a typo. Ask the organizer for the correct public link."
            action={
              <Link href="/" className="btn btn-secondary">
                Back home
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const drawnCount = preview.members.filter((m) => m.drawn).length;

  return (
    <div className="container-page max-w-2xl py-6 sm:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="text-sm font-semibold text-muted hover:text-pine-800"
        >
          ← Home
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip bg-gold-100 text-gold-500">Public draw</span>
          <StatusChip status={preview.status} />
        </div>
      </div>

      <header className="mt-5 sm:mt-6">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-holly-600">
          Gift exchange
        </p>
        <h1 className="mt-1 font-display text-3xl leading-tight text-pine-950 sm:text-4xl">
          {preview.name}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Hosted by {preview.organizer_name} · {drawnCount} of{" "}
          {preview.member_count} drawn
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="chip bg-cream-100 text-muted">
            Party {formatDate(preview.party_date)}
          </span>
          <span className="chip bg-cream-100 text-muted">
            Budget {formatMoney(preview.gift_budget, preview.currency)}
          </span>
          {preview.wishlist_deadline ? (
            <span className="chip bg-cream-100 text-muted">
              Wishlists due {formatDate(preview.wishlist_deadline)}
            </span>
          ) : null}
        </div>
      </header>

      <section className="card mt-5 p-4 sm:mt-6 sm:p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-pine-950 sm:text-xl">
            Pick your name to draw
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Choose your own name and draw once. Your recipient is shown only once
            — save a screenshot or note before leaving.
          </p>
        </div>

        {preview.members.length ? (
          <PublicDraw
            action={drawAndRevealAction}
            members={preview.members}
            code={code}
          />
        ) : (
          <p className="rounded-xl bg-cream-100 px-4 py-3 text-sm text-muted">
            The organizer has not added any names to the roster yet.
          </p>
        )}
      </section>

      <details className="mt-4 rounded-2xl border border-cream-200 bg-white/70 px-4 py-3 sm:mt-5">
        <summary className="cursor-pointer text-sm font-semibold text-pine-900">
          Event details & how it works
        </summary>
        <div className="mt-3 space-y-4 text-sm leading-relaxed text-muted">
          {preview.description ? (
            <p className="whitespace-pre-line text-pine-950/80">
              {preview.description}
            </p>
          ) : null}
          <ol className="space-y-2">
            <li>
              <span className="font-semibold text-pine-900">1.</span> Open this
              public link (no sign-in required).
            </li>
            <li>
              <span className="font-semibold text-pine-900">2.</span> Select your
              own name from the roster.
            </li>
            <li>
              <span className="font-semibold text-pine-900">3.</span> Draw once to
              see who you are buying for.
            </li>
            <li>
              <span className="font-semibold text-pine-900">4.</span> Save the
              result immediately — it will not be shown again, not even to the
              organizer.
            </li>
          </ol>
          <p className="text-xs">
            Fair draw: no self-draws and no duplicate recipients.{" "}
            <Link href="/login" className="link">
              Sign in
            </Link>{" "}
            (optional) if you want wishlist/account features.
          </p>
        </div>
      </details>
    </div>
  );
}

export default function PreviewPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="container-page max-w-5xl py-14">
          <div className="h-10 w-80 animate-pulse rounded-full bg-cream-200" />
          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_21rem]">
            <div className="h-72 animate-pulse rounded-2xl bg-cream-200/70" />
            <div className="h-52 animate-pulse rounded-2xl bg-cream-200/70" />
          </div>
        </div>
      }
    >
      <PreviewContentWrapper params={params} />
    </Suspense>
  );
}

async function PreviewContentWrapper({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!code) notFound();
  return <PreviewContent code={code} />;
}

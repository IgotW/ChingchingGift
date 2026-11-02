import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { EmptyState } from "@/components/empty-state";
import { StatusChip } from "@/components/status-chip";
import { TokenDrawButton } from "@/components/token-draw-button";
import { TokenReveal } from "@/components/token-reveal";
import { drawByTokenAction } from "@/lib/actions/events";
import { getMemberView } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Your Secret Santa",
  robots: { index: false, follow: false },
};

async function ClaimContent({ token }: { token: string }) {
  if (!isSupabaseConfigured()) redirect("/setup");

  const view = await getMemberView(token);

  if (!view) {
    return (
      <div className="container-page max-w-2xl py-14">
        <Link
          href="/"
          className="text-sm font-semibold text-muted hover:text-pine-800"
        >
          ← ChingChingGift
        </Link>
        <div className="mt-6">
          <EmptyState
            icon="gift"
            title="This private link is not valid"
            body="It may have been copied incompletely, or the name was removed from the roster. Ask your host for a fresh personal link."
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

  if (!view.drawn) {
    return (
      <div className="container-page max-w-2xl py-10 lg:py-14">
        <Link
          href="/"
          className="text-sm font-semibold text-muted hover:text-pine-800"
        >
          ← ChingChingGift
        </Link>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="chip bg-gold-100 text-gold-500">
            Private personal link
          </span>
          <StatusChip status={view.event_status} />
        </div>

        <section className="card mt-5 overflow-hidden">
          <div className="bg-pine-950 px-6 py-7 text-center text-cream-50 sm:px-8 sm:py-9">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-gold-400">
              {view.event_name}
            </p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl">
              Hi {view.member_name.split(" ")[0]}, you are in!
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-cream-200/80">
              Everyone is already on the roster, so there is nothing to wait
              for. Tap the button to draw your Secret Santa recipient.
            </p>
          </div>

          <div className="px-6 py-7 sm:px-8">
            <div className="flex justify-center">
              <TokenDrawButton action={drawByTokenAction} token={token} />
            </div>
            <p className="mx-auto mt-4 max-w-sm text-center text-xs leading-relaxed text-muted">
              No sign-in needed. Only your own recipient is shown, and this
              private link stays yours — keep it to yourself until the party.
            </p>
          </div>
        </section>

        <section className="card mt-6 p-6">
          <h2 className="text-xl font-semibold text-pine-950">
            {view.event_name}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Hosted by {view.organizer_name}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-cream-100 px-4 py-3">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-muted">
                Party date
              </p>
              <p className="mt-1 text-sm font-semibold text-pine-950">
                {formatDate(view.party_date)}
              </p>
            </div>
            <div className="rounded-xl bg-cream-100 px-4 py-3">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-muted">
                Gift budget
              </p>
              <p className="mt-1 text-sm font-semibold text-pine-950">
                {formatMoney(view.gift_budget, view.currency)}
              </p>
            </div>
            <div className="rounded-xl bg-cream-100 px-4 py-3">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-muted">
                Wishlists due
              </p>
              <p className="mt-1 text-sm font-semibold text-pine-950">
                {formatDate(view.wishlist_deadline)}
              </p>
            </div>
          </div>
          {view.instructions ? (
            <p className="mt-4 whitespace-pre-line rounded-xl bg-cream-50 px-4 py-3 text-sm leading-relaxed text-muted ring-1 ring-cream-200">
              {view.instructions}
            </p>
          ) : null}
        </section>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted">
          Want to build a wishlist too? Ask your host for the invitation link and
          sign in with Google to claim your name.
        </p>
      </div>
    );
  }

  if (!view.recipient_name) {
    return (
      <div className="container-page max-w-2xl py-14">
        <div className="mt-6">
          <EmptyState
            icon="gift"
            title="No recipient on this link"
            body="The draw is complete, but this name was not part of it. Ask your host to check the roster and personal links."
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

  return (
    <div className="container-page max-w-3xl py-10 lg:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="chip bg-gold-100 text-gold-500">
          Private personal link
        </span>
        <StatusChip status={view.event_status} />
      </div>

      <div className="mt-5">
        <TokenReveal
          eventName={view.event_name}
          memberName={view.member_name}
          recipientName={view.recipient_name}
          recipientAvatar={view.recipient_avatar_url}
          wishlistPublished={view.recipient_wishlist_published}
          items={view.recipient_wishlist_items ?? []}
          currency={view.currency}
          budget={formatMoney(view.gift_budget, view.currency)}
          wishlistDeadline={formatDate(view.wishlist_deadline)}
          completed={view.event_status === "completed"}
        />
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-muted">
        This page needs no sign-in. Anyone with the link can see it, so keep it
        to yourself until the party.
      </p>
    </div>
  );
}

export default function ClaimPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="container-page max-w-3xl py-14">
          <div className="h-6 w-44 animate-pulse rounded-full bg-cream-200" />
          <div className="mt-6 h-72 animate-pulse rounded-3xl bg-cream-200/70" />
        </div>
      }
    >
      <ClaimContentWrapper params={params} />
    </Suspense>
  );
}

async function ClaimContentWrapper({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token) notFound();
  return <ClaimContent token={token} />;
}

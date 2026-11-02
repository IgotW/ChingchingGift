import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { StatusChip } from "@/components/status-chip";
import { WishlistItemCard } from "@/components/wishlist-item-card";
import { requireProfile } from "@/lib/auth";
import { getEventForMember, getMyAssignment, getWishlist } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = {
  title: "My recipient's wishlist",
};

async function RecipientContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireProfile(`/events/${id}/recipient`);

  const context = await getEventForMember(id);
  if (!context) notFound();

  const { event } = context;
  const assignment = await getMyAssignment(id);

  if (!assignment) {
    const waiting =
      event.status === "upcoming" || event.status === "registration_closed";
    return (
      <div className="container-page max-w-3xl py-10 lg:py-14">
        <Link
          href={`/events/${id}`}
          className="text-sm font-semibold text-muted hover:text-pine-800"
        >
          ← {event.name}
        </Link>
        <div className="mt-6">
          {waiting ? (
            <EmptyState
              icon="gift"
              title="Your recipient is still sealed"
              body="The organizer has not drawn names yet. This page opens the moment the draw is complete, and you will get a private notification."
              action={
                <Link href={`/events/${id}/wishlist`} className="btn btn-secondary">
                  Work on my wishlist meanwhile
                </Link>
              }
            />
          ) : (
            <EmptyState
              icon="gift"
              title="You do not have an assignment"
              body="This name was not part of the draw, so there is no recipient to shop for. The organizer can explain if you expected to be included."
              action={
                <Link href={`/events/${id}`} className="btn btn-secondary">
                  Back to the event
                </Link>
              }
            />
          )}
        </div>
        <div className="mt-8 flex justify-center">
          <StatusChip status={event.status} />
        </div>
      </div>
    );
  }

  const recipientName = assignment.recipient_name;
  const wishlist = assignment.recipient_user_id
    ? await getWishlist(id, assignment.recipient_user_id)
    : null;
  const items = wishlist?.items ?? [];
  const published = wishlist?.is_published ?? assignment.wishlist_published;
  const canBuildWishlist = assignment.recipient_user_id !== null;

  return (
    <div className="container-page max-w-4xl py-10 lg:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/events/${id}`}
          className="text-sm font-semibold text-muted hover:text-pine-800"
        >
          ← {event.name}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status={event.status} />
          <span className="chip bg-cream-100 text-muted">Private to you</span>
        </div>
      </div>

      <section className="card mt-6 overflow-hidden">
        <div className="bg-pine-950 px-6 py-6 text-cream-50 sm:px-8">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-gold-400">
            Your Secret Santa recipient
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Avatar
              name={recipientName}
              src={assignment.recipient_avatar_url}
              size="lg"
              className="ring-4 ring-pine-900"
            />
            <div>
              <h1 className="font-display text-3xl leading-tight sm:text-4xl">
                {recipientName}
              </h1>
              <p className="mt-1 text-sm text-cream-200/80">
                Only you can see who you are buying for. Keep the surprise until
                the party.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
          <div className="rounded-xl bg-cream-100 px-4 py-3">
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-muted">
              Gift budget
            </p>
            <p className="mt-1 text-sm font-semibold text-pine-950">
              {formatMoney(event.gift_budget, event.currency)}
            </p>
          </div>
          <div className="rounded-xl bg-cream-100 px-4 py-3">
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-muted">
              Wishlist deadline
            </p>
            <p className="mt-1 text-sm font-semibold text-pine-950">
              {formatDate(event.wishlist_deadline)}
            </p>
          </div>
          <div className="rounded-xl bg-cream-100 px-4 py-3">
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-muted">
              Party date
            </p>
            <p className="mt-1 text-sm font-semibold text-pine-950">
              {formatDate(event.party_date)}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_18rem]">
        <section className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold text-pine-950">
                Their wishlist
              </h2>
              <p className="text-xs text-muted">
                {items.length} gift idea{items.length === 1 ? "" : "s"}
                {published ? " · published" : " · still a draft"}
              </p>
            </div>
            <span
              className={`chip ${
                published
                  ? "bg-pine-100 text-pine-800"
                  : "bg-gold-100 text-gold-500"
              }`}
            >
              {published ? "Ready to shop" : "Giver preview"}
            </span>
          </div>

          {!canBuildWishlist ? (
            <p className="mt-4 rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm leading-relaxed text-muted">
              {recipientName.split(" ")[0]} joined through a personal link
              without signing in, so they cannot build a wishlist here. Use the
              gift budget and the exchange notes for inspiration.
            </p>
          ) : !published && items.length ? (
            <p className="mt-4 rounded-xl border border-gold-500/25 bg-gold-100/50 px-4 py-3 text-sm leading-relaxed text-pine-900">
              This wishlist is not published yet. You can still browse it, and
              you will get a private notification if they make meaningful
              updates.
            </p>
          ) : null}

          {items.length ? (
            <ul className="mt-4 space-y-4">
              {items.map((item) => (
                <WishlistItemCard
                  key={item.id}
                  item={item}
                  currency={event.currency}
                />
              ))}
            </ul>
          ) : (
            <div className="mt-5">
              <EmptyState
                icon="list"
                title="No gift ideas yet"
                body={
                  canBuildWishlist
                    ? `${recipientName.split(" ")[0]} has not added anything to their wishlist yet. You will get a private notification when they publish one.`
                    : `${recipientName.split(" ")[0]} has no wishlist because they joined without signing in.`
                }
                action={
                  <Link
                    href={`/events/${id}/draw`}
                    className="btn btn-secondary btn-sm"
                  >
                    Back to my assignment
                  </Link>
                }
              />
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <div className="rounded-2xl bg-pine-950 p-5 text-cream-50">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-gold-400">
              Keep it secret
            </p>
            <p className="mt-2 text-sm leading-relaxed text-cream-200/90">
              {recipientName.split(" ")[0]} does not know you drew their name.
              Avoid asking them about the list in a way that gives it away.
            </p>
          </div>

          <div className="card p-5">
            <h2 className="text-base font-semibold text-pine-950">
              Gift notes
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Their top-priority ideas are the safest starting point. Colour and
              size details are there so you can get it right the first time.
            </p>
            <Link
              href={`/events/${id}/draw`}
              className="btn btn-secondary btn-sm mt-4"
            >
              Revisit my assignment
            </Link>
          </div>

          {event.instructions ? (
            <div className="card p-5">
              <h2 className="text-base font-semibold text-pine-950">
                Exchange notes
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
                {event.instructions}
              </p>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

export default function RecipientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="container-page max-w-4xl py-14">
          <div className="h-10 w-72 animate-pulse rounded-full bg-cream-200" />
          <div className="mt-6 h-52 animate-pulse rounded-3xl bg-cream-200/70" />
          <div className="mt-6 h-64 animate-pulse rounded-2xl bg-cream-200/70" />
        </div>
      }
    >
      <RecipientContent params={params} />
    </Suspense>
  );
}

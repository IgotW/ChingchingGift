import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ActionForm } from "@/components/action-form";
import { EmptyState } from "@/components/empty-state";
import { RevealRecipient } from "@/components/reveal-recipient";
import { StatusChip } from "@/components/status-chip";
import { drawNamesAction } from "@/lib/actions/events";
import { requireProfile } from "@/lib/auth";
import { getEventForMember, getMyAssignment, getWishlist } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = {
  title: "My assignment",
};

async function DrawContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ claimed?: string | string[] }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const session = await requireProfile(`/events/${id}/draw`);

  const context = await getEventForMember(id);
  if (!context) notFound();

  const { event, member } = context;
  const assignment = await getMyAssignment(id);
  const justClaimed = query.claimed === "1";

  if (!assignment) {
    const waiting =
      event.status === "upcoming" || event.status === "registration_closed";
    const canStartDraw = Boolean(member) && waiting;

    if (canStartDraw) {
      return (
        <div className="container-page max-w-3xl py-10 lg:py-14">
          <Link
            href={`/events/${id}`}
            className="text-sm font-semibold text-muted hover:text-pine-800"
          >
            ← {event.name}
          </Link>

          {justClaimed ? (
            <div className="mt-5 rounded-2xl border border-pine-600/20 bg-pine-100/70 px-4 py-3 text-sm font-medium text-pine-900">
              You are in as {member?.display_name}. The roster is already
              complete, so you can draw right now.
            </div>
          ) : null}

          <div className="mt-6">
            <EmptyState
              icon="gift"
              title={`Ready to draw, ${member?.display_name.split(" ")[0]}?`}
              body="Everyone is already on the roster, so there is nothing to wait for. Draw once and your private recipient appears here."
              action={
                <ActionForm
                  action={drawNamesAction}
                  submitLabel="Draw my name now"
                  pendingLabel="Drawing names…"
                  className="flex flex-col items-center gap-3"
                  buttonClassName="btn btn-primary px-7 py-3 text-base"
                  confirm="Draw the names now? Everyone's assignment becomes final until the organizer resets the draw."
                >
                  <input type="hidden" name="event_id" value={id} />
                </ActionForm>
              }
            />
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-muted">
            The draw is shared: if another guest taps first, you will see the
            same result. Nobody except you can see who you drew.
          </p>
        </div>
      );
    }

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
              title="No assignment yet"
              body={
                member
                  ? "Your name is on the roster, but there are not enough names to draw yet. Ask the organizer to add more people."
                  : "Claim your name on the event page first, then come back to draw."
              }
              action={
                member ? (
                  <Link
                    href={`/events/${id}/wishlist`}
                    className="btn btn-secondary"
                  >
                    Work on my wishlist meanwhile
                  </Link>
                ) : (
                  <Link href={`/events/${id}`} className="btn btn-secondary">
                    Back to the event
                  </Link>
                )
              }
            />
          ) : (
            <EmptyState
              icon="gift"
              title="You are not part of this draw"
              body="This name was not included in the final roster, so there is no assignment for you. Talk to the organizer if you think this is a mistake."
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

  const wishlist = assignment.recipient_user_id
    ? await getWishlist(id, assignment.recipient_user_id)
    : null;
  const giftCount = wishlist?.items.length ?? assignment.wishlist_item_count;
  const published = wishlist?.is_published ?? assignment.wishlist_published;

  return (
    <div className="container-page max-w-3xl py-10 lg:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/events/${id}`}
          className="text-sm font-semibold text-muted hover:text-pine-800"
        >
          ← {event.name}
        </Link>
        <div className="flex items-center gap-2">
          <StatusChip status={event.status} />
          <span className="chip bg-cream-100 text-muted">
            Signed in as {session.profile.full_name.split(" ")[0]}
          </span>
        </div>
      </div>

      <div className="mt-6">
        <RevealRecipient
          eventId={id}
          eventName={event.name}
          recipientName={assignment.recipient_name}
          recipientAvatar={assignment.recipient_avatar_url}
          wishlistCount={giftCount}
          wishlistPublished={published}
          budget={formatMoney(event.gift_budget, event.currency)}
          wishlistDeadline={formatDate(event.wishlist_deadline, false)}
          completed={event.status === "completed"}
        />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="card-muted px-4 py-3 text-sm leading-relaxed text-muted">
          <strong className="font-semibold text-pine-950">Privacy check:</strong>{" "}
          only you can open your assignment. Your recipient cannot see that you
          drew them, and other guests cannot guess from the roster.
        </div>
        <div className="card-muted px-4 py-3 text-sm leading-relaxed text-muted">
          <strong className="font-semibold text-pine-950">Need ideas?</strong>{" "}
          Their wishlist is the best place to start. You will get a notification
          if they update it.
        </div>
      </div>
    </div>
  );
}

export default function DrawPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ claimed?: string | string[] }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="container-page max-w-3xl py-14">
          <div className="h-10 w-72 animate-pulse rounded-full bg-cream-200" />
          <div className="mt-6 h-80 animate-pulse rounded-3xl bg-cream-200/70" />
        </div>
      }
    >
      <DrawContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ActionForm } from "@/components/action-form";
import { EmptyState } from "@/components/empty-state";
import { StatusChip } from "@/components/status-chip";
import { WishlistItemFields } from "@/components/wishlist-item-fields";
import {
  addWishlistItemAction,
  deleteWishlistItemAction,
  setWishlistPublishedAction,
  updateWishlistItemAction,
} from "@/lib/actions/wishlist";
import { requireProfile } from "@/lib/auth";
import { getEventForMember, getWishlist } from "@/lib/data";
import { formatDate, formatMoney, safeExternalUrl } from "@/lib/format";
import type { WishlistItem } from "@/lib/types";

export const metadata: Metadata = {
  title: "My wishlist",
};

const priorityMeta: Record<number, { label: string; tone: string }> = {
  1: { label: "Top of my list", tone: "bg-holly-100 text-holly-700" },
  2: { label: "Would love it", tone: "bg-gold-100 text-gold-500" },
  3: { label: "Nice to have", tone: "bg-cream-100 text-muted" },
};

function ItemCard({
  item,
  eventId,
}: {
  item: WishlistItem;
  eventId: string;
}) {
  const priority = priorityMeta[item.priority] ?? priorityMeta[2];
  const url = safeExternalUrl(item.product_url);

  return (
    <li className="rounded-2xl border border-cream-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className={`chip ${priority.tone}`}>{priority.label}</span>
          <h3 className="mt-2 font-display text-xl text-pine-950">
            {item.title}
          </h3>
        </div>
        {item.price !== null ? (
          <span className="rounded-full bg-cream-100 px-3 py-1 text-xs font-semibold text-muted">
            ≈ {item.price.toFixed(2)}
          </span>
        ) : null}
      </div>

      {item.details ? (
        <p className="mt-2 text-sm leading-relaxed text-muted">{item.details}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
        {item.color ? (
          <span className="rounded-full bg-cream-50 px-2.5 py-1 ring-1 ring-cream-200">
            Colour: {item.color}
          </span>
        ) : null}
        {item.size ? (
          <span className="rounded-full bg-cream-50 px-2.5 py-1 ring-1 ring-cream-200">
            Size: {item.size}
          </span>
        ) : null}
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-full bg-pine-100 px-2.5 py-1 font-semibold text-pine-800 hover:bg-pine-100/70"
          >
            Shop link ↗
          </a>
        ) : null}
      </div>

      {item.notes ? (
        <p className="mt-3 rounded-xl bg-cream-100 px-3 py-2 text-xs leading-relaxed text-muted">
          <span className="font-semibold text-ink">Note:</span> {item.notes}
        </p>
      ) : null}

      <details className="mt-4 border-t border-cream-200 pt-3">
        <summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-muted hover:text-pine-800">
          Edit this idea
        </summary>
        <div className="mt-4">
          <ActionForm
            action={updateWishlistItemAction}
            submitLabel="Save changes"
            pendingLabel="Saving…"
            className="space-y-4"
            buttonClassName="btn btn-pine btn-sm"
          >
            <input type="hidden" name="event_id" value={eventId} />
            <input type="hidden" name="item_id" value={item.id} />
            <WishlistItemFields item={item} />
          </ActionForm>

          <div className="mt-4 border-t border-cream-200 pt-3">
            <ActionForm
              action={deleteWishlistItemAction}
              submitLabel="Remove from wishlist"
              pendingLabel="Removing…"
              className="space-y-2"
              buttonClassName="btn btn-sm border border-holly-600/30 bg-transparent text-holly-700 hover:bg-holly-100"
              confirm={`Remove "${item.title}" from your wishlist?`}
            >
              <input type="hidden" name="event_id" value={eventId} />
              <input type="hidden" name="item_id" value={item.id} />
            </ActionForm>
          </div>
        </div>
      </details>
    </li>
  );
}

async function WishlistContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireProfile(`/events/${id}/wishlist`);

  const context = await getEventForMember(id);
  if (!context) notFound();

  const { event, user, member, isOrganizer } = context;

  if (!member) {
    return (
      <div className="container-page max-w-3xl py-10 lg:py-14">
        <Link
          href={`/events/${id}`}
          className="text-sm font-semibold text-muted hover:text-pine-800"
        >
          ← {event.name}
        </Link>
        <div className="mt-6">
          <EmptyState
            icon="list"
            title="You are not on the roster"
            body="Wishlists belong to members who claimed a name. Add yourself from the organizer tools, then claim your name to start a list."
            action={
              <Link
                href={`/events/${id}/manage`}
                className="btn btn-secondary"
              >
                Open organizer tools
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const wishlist = await getWishlist(id, user.id);
  const items = wishlist?.items ?? [];
  const published = wishlist?.is_published ?? false;
  const isLocked = event.status === "completed";

  return (
    <div className="container-page max-w-4xl py-10 lg:py-14">
      <Link
        href={`/events/${id}`}
        className="text-sm font-semibold text-muted hover:text-pine-800"
      >
        ← {event.name}
      </Link>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={event.status} />
            <span className="chip bg-cream-100 text-muted">My wishlist</span>
          </div>
          <h1 className="mt-3 font-display text-4xl text-pine-950 sm:text-5xl">
            Gifts I would love
          </h1>
          <p className="mt-2 max-w-xl text-muted">
            Your Secret Santa is the only person who can see this list. Add a
            few ideas, sizes, and the things you would rather avoid.
          </p>
        </div>
        <div className="rounded-xl border border-cream-200 bg-white px-4 py-3 text-sm">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted">
            Wishlist deadline
          </p>
          <p className="mt-1 font-semibold text-pine-950">
            {formatDate(event.wishlist_deadline)}
          </p>
          <p className="text-xs text-muted">
            Budget {formatMoney(event.gift_budget, event.currency)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="card-muted px-5 py-4">
          <p className="text-sm font-semibold text-pine-950">
            {published ? "Your wishlist is published ✓" : "Your wishlist is a draft"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {published
              ? "Your Secret Santa can see these ideas and will be notified when you make meaningful updates."
              : "Publish it when you are ready. Your Secret Santa gets a private notification with a link — never your giver's identity."}
          </p>
        </div>
        {!isLocked ? (
          <ActionForm
            action={setWishlistPublishedAction}
            submitLabel={published ? "Unpublish" : "Publish wishlist"}
            pendingLabel="Saving…"
            className="space-y-2"
            buttonClassName={published ? "btn btn-secondary" : "btn btn-primary"}
          >
            <input type="hidden" name="event_id" value={id} />
            <input type="hidden" name="published" value={published ? "false" : "true"} />
          </ActionForm>
        ) : null}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-pine-950">
            {items.length} gift idea{items.length === 1 ? "" : "s"}
          </h2>
          {published ? (
            <span className="chip bg-pine-100 text-pine-800">Shared privately</span>
          ) : (
            <span className="chip bg-gold-100 text-gold-500">Only you can see this</span>
          )}
        </div>

        {items.length ? (
          <ul className="mt-4 space-y-4">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} eventId={id} />
            ))}
          </ul>
        ) : (
          <div className="mt-4">
            <EmptyState
              icon="list"
              title="Your wishlist is a blank canvas"
              body="Add at least one idea so your Secret Santa has somewhere to start. Links, colours, sizes, and notes all help."
            />
          </div>
        )}
      </div>

      {!isLocked ? (
        <section className="card mt-8 p-6">
          <h2 className="text-xl font-semibold text-pine-950">
            Add a gift idea
          </h2>
          <p className="mt-1 text-sm text-muted">
            You can keep editing until the event is completed.
          </p>
          <div className="mt-5">
            <ActionForm
              action={addWishlistItemAction}
              submitLabel="Add to wishlist"
              pendingLabel="Adding…"
              className="space-y-4"
              resetOnSuccess
            >
              <input type="hidden" name="event_id" value={id} />
              <WishlistItemFields />
            </ActionForm>
          </div>
        </section>
      ) : null}

      <div className="mt-8 rounded-2xl bg-pine-950 p-5 text-cream-50">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-gold-400">
          A small kindness
        </p>
        <p className="mt-2 text-sm leading-relaxed text-cream-200/90">
          Keep your list realistic and within the gift budget. A few thoughtful
          options are more helpful than a long list of maybes.
        </p>
        {isOrganizer ? (
          <p className="mt-2 text-xs text-cream-200/70">
            As the organizer, you can also see everyone&apos;s completion
            progress in the{" "}
            <Link
              href={`/events/${id}/manage`}
              className="font-semibold text-gold-400 underline underline-offset-2"
            >
              organizer tools
            </Link>
            .
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function WishlistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="container-page max-w-4xl py-14">
          <div className="h-10 w-72 animate-pulse rounded-full bg-cream-200" />
          <div className="mt-4 h-5 w-96 animate-pulse rounded-full bg-cream-200" />
          <div className="mt-8 h-52 animate-pulse rounded-2xl bg-cream-200/70" />
        </div>
      }
    >
      <WishlistContent params={params} />
    </Suspense>
  );
}

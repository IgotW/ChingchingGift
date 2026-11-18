import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Avatar } from "@/components/avatar";
import { CopyButton } from "@/components/copy-button";
import { EmptyState } from "@/components/empty-state";
import { StatusChip } from "@/components/status-chip";
import { requireProfile } from "@/lib/auth";
import {
  getEventForMember,
  getEventMembers,
  getMyAssignment,
  getWishlist,
  getWishlistStatus,
} from "@/lib/data";
import {
  countdownLabel,
  eventStatusMeta,
  formatDate,
  formatMoney,
} from "@/lib/format";
import { getSiteUrl } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Event details",
};

async function EventContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ claimed?: string | string[] }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  await requireProfile(`/events/${id}`);

  const context = await getEventForMember(id);
  if (!context) notFound();

  const { event, user, member, isOrganizer } = context;
  const [members, assignment, myWishlist, wishlistStatus] = await Promise.all([
    getEventMembers(id),
    getMyAssignment(id),
    member ? getWishlist(id, user.id) : Promise.resolve(null),
    isOrganizer ? getWishlistStatus(id) : Promise.resolve([]),
  ]);

  const statusMeta = eventStatusMeta[event.status];
  const claimedCount = members.filter((row) => row.user_id).length;
  const wishlistMap = new Map(wishlistStatus.map((row) => [row.member_id, row]));
  const wishlistReady = wishlistStatus.filter(
    (row) => row.is_published && row.item_count > 0,
  ).length;
  const joinUrl = `${getSiteUrl()}/join/${event.invite_code}`;
  const justClaimed = query.claimed === "1";

  return (
    <div className="container-page py-10 lg:py-14">
      {justClaimed ? (
        <div className="mb-6 rounded-2xl border border-pine-600/20 bg-pine-100/70 px-4 py-3 text-sm font-medium text-pine-900">
          You are in as {member?.display_name ?? "a participant"}. Add a wishlist
          item or two so your Secret Santa knows what you love.
        </div>
      ) : null}

      <Link
        href="/dashboard"
        className="text-sm font-semibold text-muted hover:text-pine-800"
      >
        ← Dashboard
      </Link>

      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={event.status} />
            {isOrganizer ? (
              <span className="chip bg-cream-100 text-muted">You organize</span>
            ) : null}
            {member ? (
              <span className="chip bg-pine-100 text-pine-800">
                You are {member.display_name}
              </span>
            ) : (
              <span className="chip bg-amber-100 text-amber-900">
                Not in the draw
              </span>
            )}
          </div>
          <h1 className="mt-3 font-display text-4xl text-pine-950 sm:text-5xl">
            {event.name}
          </h1>
          {event.description ? (
            <p className="mt-3 whitespace-pre-line text-muted">
              {event.description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {isOrganizer ? (
            <Link href={`/events/${id}/manage`} className="btn btn-pine">
              Manage event
            </Link>
          ) : null}
          {member ? (
            <Link href={`/events/${id}/wishlist`} className="btn btn-secondary">
              My wishlist
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="card px-4 py-3">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted">
            Party date
          </p>
          <p className="mt-1 font-semibold text-pine-950">
            {formatDate(event.party_date)}
          </p>
          <p className="text-xs text-muted">{countdownLabel(event.party_date)}</p>
        </div>
        <div className="card px-4 py-3">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted">
            Gift budget
          </p>
          <p className="mt-1 font-semibold text-pine-950">
            {formatMoney(event.gift_budget, event.currency)}
          </p>
          <p className="text-xs text-muted">A friendly ceiling, not a rule</p>
        </div>
        <div className="card px-4 py-3">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted">
            The roster
          </p>
          <p className="mt-1 font-semibold text-pine-950">
            {members.length} {members.length === 1 ? "name" : "names"}
          </p>
          <p className="text-xs text-muted">
            {claimedCount} claimed · {members.length - claimedCount} waiting
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_21rem]">
        <div className="space-y-6">
          <section className="card overflow-hidden">
            <div className="bg-pine-950 px-6 py-5 text-cream-50">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-gold-400">
                Your Secret Santa
              </p>
              {assignment ? (
                <>
                  <h2 className="mt-1 font-display text-2xl">
                    {assignment.revealed
                      ? "Your draw has been revealed once."
                      : "Your recipient is ready to reveal once."}
                  </h2>
                  <p className="mt-1 text-sm text-cream-200/80">
                    {assignment.revealed
                      ? "For privacy, the name you drew was shown only once and cannot be displayed again — not even to the organizer. Use the screenshot or note you saved."
                      : "Reveal now to see who you are buying for. The result is shown only once, so save it immediately."}
                  </p>
                  {!assignment.revealed ? (
                    <Link
                      href={`/events/${id}/draw`}
                      className="btn btn-primary btn-sm mt-4"
                    >
                      Reveal my recipient once
                    </Link>
                  ) : null}
                </>
              ) : (
                <>
                  <h2 className="mt-1 font-display text-2xl">
                    {member
                      ? `${member.display_name.split(" ")[0]}, draw once to get your name.`
                      : "Draw from the shared public link."}
                  </h2>
                  <p className="mt-1 text-sm text-cream-200/80">
                    {member
                      ? "Use the shared public link to choose your name and draw once. Your recipient is shown only once and cannot be viewed again."
                      : "Open the shared public link, choose your own name from the roster, and draw once. No sign-in is required."}
                  </p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/join/${event.invite_code}`}
                      className="btn btn-primary btn-sm"
                    >
                      Open public draw link
                    </Link>
                    {member ? (
                      <Link
                        href={`/events/${id}/wishlist`}
                        className="btn btn-sm bg-cream-50 text-pine-950 hover:bg-cream-100"
                      >
                        Work on my wishlist
                      </Link>
                    ) : null}
                  </div>
                </>
              )}
            </div>

            {member ? (
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <span
                    className={`grid size-6 place-items-center rounded-full ${
                      myWishlist?.is_published
                        ? "bg-pine-100 text-pine-800"
                        : "bg-gold-100 text-gold-500"
                    }`}
                  >
                    {myWishlist?.is_published ? "✓" : "!"}
                  </span>
                  {myWishlist?.items.length
                    ? `${myWishlist.items.length} wishlist item${myWishlist.items.length === 1 ? "" : "s"}${myWishlist.is_published ? " · published" : " · draft"}`
                    : "Your wishlist is empty"}
                </div>
                <Link
                  href={`/events/${id}/wishlist`}
                  className="text-sm font-semibold text-pine-700 hover:text-holly-600"
                >
                  {myWishlist?.items.length ? "Edit wishlist →" : "Add gift ideas →"}
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                <p className="text-sm text-muted">
                  {isOrganizer
                    ? "You are organizing this exchange without taking part."
                    : "Use the shared public link to choose your name and draw once."}
                </p>
                {isOrganizer ? (
                  <Link
                    href={`/events/${id}/manage`}
                    className="text-sm font-semibold text-pine-700 hover:text-holly-600"
                  >
                    Manage the roster →
                  </Link>
                ) : (
                  <Link
                    href={`/join/${event.invite_code}`}
                    className="text-sm font-semibold text-pine-700 hover:text-holly-600"
                  >
                    Open public draw link →
                  </Link>
                )}
              </div>
            )}
          </section>

          <section className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-semibold text-pine-950">
                  Who is coming
                </h2>
                <p className="text-xs text-muted">
                  {members.length} on the roster · {claimedCount} claimed
                </p>
              </div>
              {isOrganizer ? (
                <Link
                  href={`/events/${id}/manage`}
                  className="text-sm font-semibold text-pine-700 hover:text-holly-600"
                >
                  Manage roster →
                </Link>
              ) : null}
            </div>

            {members.length ? (
              <ul className="mt-4 divide-y divide-cream-200">
                {members.map((row) => {
                  const isYou = row.id === member?.id;
                  const isHost = row.user_id === event.organizer_id;
                  const wishlist = wishlistMap.get(row.id);
                  const name = row.profile?.full_name ?? row.display_name;
                  return (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-center gap-3 py-3"
                    >
                      <Avatar
                        name={name}
                        src={row.profile?.avatar_url}
                        size="sm"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">
                          {row.display_name}
                          {isYou ? (
                            <span className="ml-1.5 text-xs font-normal text-muted">
                              (you)
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-muted">
                          {isHost
                            ? "Organizer"
                            : row.user_id
                              ? "Name claimed"
                              : "On the roster"}
                        </p>
                      </div>
                      {isOrganizer ? (
                        <span
                          className={`chip ${
                            wishlist?.is_published && wishlist.item_count > 0
                              ? "bg-pine-100 text-pine-800"
                              : wishlist?.has_wishlist
                                ? "bg-gold-100 text-gold-500"
                                : "bg-cream-100 text-muted"
                          }`}
                        >
                          {wishlist?.is_published && wishlist.item_count > 0
                            ? `Wishlist ready · ${wishlist.item_count}`
                            : wishlist?.item_count
                              ? `Draft · ${wishlist.item_count}`
                              : row.user_id
                                ? "No wishlist"
                                : "Not signed in"}
                        </span>
                      ) : (
                        <span className="chip bg-cream-100 text-muted">
                          {row.user_id ? "Claimed" : "On the roster"}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="mt-4">
                <EmptyState
                  icon="users"
                  title="The roster is empty"
                  body="Add names from the organizer tools to start the exchange."
                />
              </div>
            )}
          </section>

          {isOrganizer ? (
            <section className="card p-6">
              <h2 className="text-xl font-semibold text-pine-950">
                Share the public draw link
              </h2>
              <p className="mt-1 text-sm text-muted">
                This is the only link guests need. Each person opens it, chooses
                their own name, and draws once. The result is shown only once and
                is never visible to the organizer.
              </p>
              <div className="mt-4 rounded-xl border border-cream-200 bg-cream-50 px-4 py-3">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted">
                  Public draw link
                </p>
                <p className="mt-1 break-all font-mono text-sm text-pine-900">
                  {joinUrl}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <CopyButton value={joinUrl} label="Copy link" />
                  <CopyButton
                    value={event.invite_code}
                    label={`Code: ${event.invite_code}`}
                    copiedLabel="Code copied!"
                  />
                  <a
                    href={`mailto:?subject=${encodeURIComponent(`Draw your name for ${event.name}`)}&body=${encodeURIComponent(`Open this shared link, choose your own name, and draw once to see who you are buying for: ${joinUrl}\n\nThe result is shown only once, so please take a screenshot or write it down.\n\nCode: ${event.invite_code}`)}`}
                    className="btn btn-secondary btn-sm"
                  >
                    Email link
                  </a>
                </div>
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-5">
          <div className="card p-5">
            <h2 className="text-base font-semibold text-pine-950">
              Important dates
            </h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Party</dt>
                <dd className="font-semibold text-ink">
                  {formatDate(event.party_date)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Wishlists due</dt>
                <dd className="font-semibold text-ink">
                  {formatDate(event.wishlist_deadline)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="card p-5">
            <h2 className="text-base font-semibold text-pine-950">
              How this works
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {statusMeta.description}
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              <li className="flex gap-2">
                <span className="text-pine-700">•</span> Everyone uses the same
                shared public link.
              </li>
              <li className="flex gap-2">
                <span className="text-pine-700">•</span> Each person chooses
                their own name and draws once.
              </li>
              <li className="flex gap-2">
                <span className="text-pine-700">•</span> The result is shown only
                once and never visible to the organizer.
              </li>
            </ul>
          </div>

          {event.instructions ? (
            <div className="card p-5">
              <h2 className="text-base font-semibold text-pine-950">
                Gift exchange notes
              </h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
                {event.instructions}
              </p>
            </div>
          ) : null}

          {isOrganizer ? (
            <div className="rounded-2xl bg-pine-950 p-5 text-cream-50">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-gold-400">
                Organizer view
              </p>
              <p className="mt-2 text-sm leading-relaxed text-cream-200/90">
                {wishlistReady} of {members.length} wishlists are ready. You can
                see completion progress, but never who drew whom.
              </p>
              <Link
                href={`/events/${id}/manage`}
                className="btn btn-sm mt-3 bg-cream-50 text-pine-950 hover:bg-cream-100"
              >
                Open organizer tools
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl bg-cream-100 p-5">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted">
                One-time reveal
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                When you draw, take a screenshot or write down the name. For
                privacy, it will not be shown again.
              </p>
            </div>
          )}

          <p className="text-center text-xs text-muted">
            Organizer: {event.organizer?.full_name ?? "the host"}
          </p>
        </aside>
      </div>
    </div>
  );
}

export default function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ claimed?: string | string[] }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="container-page py-14">
          <div className="h-10 w-80 animate-pulse rounded-full bg-cream-200" />
          <div className="mt-4 h-5 w-96 animate-pulse rounded-full bg-cream-200" />
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="h-64 animate-pulse rounded-2xl bg-cream-200/70" />
            <div className="h-64 animate-pulse rounded-2xl bg-cream-200/70" />
          </div>
        </div>
      }
    >
      <EventContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

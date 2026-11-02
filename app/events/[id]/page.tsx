import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ActionForm } from "@/components/action-form";
import { Avatar } from "@/components/avatar";
import { CopyButton } from "@/components/copy-button";
import { EmptyState } from "@/components/empty-state";
import { StatusChip } from "@/components/status-chip";
import { drawNamesAction } from "@/lib/actions/events";
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
  const isDrawn = event.status === "drawn" || event.status === "completed";
  const joinUrl = `${getSiteUrl()}/join/${event.invite_code}`;
  const justClaimed = query.claimed === "1";

  return (
    <div className="container-page py-10 lg:py-14">
      {justClaimed ? (
        <div className="mb-6 rounded-2xl border border-pine-600/20 bg-pine-100/70 px-4 py-3 text-sm font-medium text-pine-900">
          You claimed your name! Add a wishlist item or two so your Secret Santa
          knows what you love.
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
              {isDrawn ? (
                <>
                  <h2 className="mt-1 font-display text-2xl">
                    {assignment
                      ? `${assignment.recipient_name} is yours to spoil.`
                      : "The draw is complete."}
                  </h2>
                  <p className="mt-1 text-sm text-cream-200/80">
                    {assignment
                      ? "Only you can see this. Open your private assignment to view their wishlist."
                      : member
                        ? "This name was not part of the final draw."
                        : "You are not part of this draw, so there is no assignment for you."}
                  </p>
                  {assignment ? (
                    <Link
                      href={`/events/${id}/draw`}
                      className="btn btn-primary btn-sm mt-4"
                    >
                      Reveal my recipient
                    </Link>
                  ) : null}
                </>
              ) : (
                <>
                  <h2 className="mt-1 font-display text-2xl">
                    {member
                      ? `${member.display_name.split(" ")[0]}, you are in!`
                      : "The roster is taking shape."}
                  </h2>
                  <p className="mt-1 text-sm text-cream-200/80">
                    {member
                      ? "Everyone is already on the roster, so you can draw your recipient right now — no need to wait for the others to join."
                      : "The organizer will draw names when the roster is ready. Ask them to include you if you expected to take part."}
                  </p>
                  {member ? (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <ActionForm
                        action={drawNamesAction}
                        submitLabel="Draw my name now"
                        pendingLabel="Drawing…"
                        className="flex flex-wrap items-center gap-2"
                        buttonClassName="btn btn-primary btn-sm"
                        confirm="Draw the names now? Everyone's assignment becomes final until the organizer resets the draw."
                      >
                        <input type="hidden" name="event_id" value={id} />
                      </ActionForm>
                      <Link
                        href={`/events/${id}/wishlist`}
                        className="btn btn-sm bg-cream-50 text-pine-950 hover:bg-cream-100"
                      >
                        Work on my wishlist
                      </Link>
                    </div>
                  ) : null}
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
                  You are organizing this exchange without taking part.
                </p>
                <Link
                  href={`/events/${id}/manage`}
                  className="text-sm font-semibold text-pine-700 hover:text-holly-600"
                >
                  Manage the roster →
                </Link>
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
                              : "Waiting to be claimed"}
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
                          {row.user_id ? "In the draw" : "Unclaimed"}
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
                Invite your guests
              </h2>
              <p className="mt-1 text-sm text-muted">
                Share this link so guests can preview the exchange and claim
                their own name. Personal reveal links for each name live in the
                organizer tools.
              </p>
              <div className="mt-4 rounded-xl border border-cream-200 bg-cream-50 px-4 py-3">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted">
                  Invitation link
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
                    href={`mailto:?subject=${encodeURIComponent(`You're invited to ${event.name}`)}&body=${encodeURIComponent(`Claim your name in our Christmas gift exchange: ${joinUrl}\n\nInvitation code: ${event.invite_code}`)}`}
                    className="btn btn-secondary btn-sm"
                  >
                    Email invite
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
                <span className="text-pine-700">•</span> Every name on the
                roster is included in the draw.
              </li>
              <li className="flex gap-2">
                <span className="text-pine-700">•</span> Nobody draws their own
                name.
              </li>
              <li className="flex gap-2">
                <span className="text-pine-700">•</span> Assignments stay private
                — including from the organizer.
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
                Keep it under wraps
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Your recipient cannot see that you are their Secret Santa. Keep
                the surprise until the party.
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

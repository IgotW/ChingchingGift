import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ActionForm } from "@/components/action-form";
import { EmptyState } from "@/components/empty-state";
import { StatusChip } from "@/components/status-chip";
import { lookupCodeAction } from "@/lib/actions/events";
import { requireProfile } from "@/lib/auth";
import { getDashboardEvents, getNotifications, type DashboardEvent } from "@/lib/data";
import {
  countdownLabel,
  eventStatusMeta,
  formatDate,
  formatMoney,
  relativeTime,
} from "@/lib/format";

export const metadata: Metadata = {
  title: "Dashboard",
};

function EventCard({ event }: { event: DashboardEvent }) {
  const meta = eventStatusMeta[event.status];
  const inDraw = Boolean(event.my_member_name);
  const wishlistDone = event.my_wishlist_published;
  const wishlistTone = !inDraw
    ? "bg-cream-100 text-muted"
    : wishlistDone
      ? "bg-pine-100 text-pine-800"
      : "bg-gold-100 text-gold-500";
  const wishlistMark = !inDraw ? "–" : wishlistDone ? "✓" : "!";

  return (
    <article className="card group relative overflow-hidden p-5 transition-shadow hover:shadow-lg sm:p-6">
      <span
        className={`absolute inset-y-0 left-0 w-1.5 ${
          event.status === "completed"
            ? "bg-cream-300"
            : event.status === "drawn"
              ? "bg-holly-500"
              : event.status === "registration_closed"
                ? "bg-gold-400"
                : "bg-pine-700"
        }`}
      />
      <div className="flex flex-wrap items-start justify-between gap-3 pl-1">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={event.status} />
            {event.is_organizer ? (
              <span className="chip bg-cream-100 text-muted">Organizer</span>
            ) : null}
          </div>
          <h2 className="mt-3 font-display text-2xl leading-tight text-pine-950">
            <Link
              href={`/events/${event.id}`}
              className="transition-colors hover:text-holly-600"
            >
              {event.name}
            </Link>
          </h2>
          <p className="mt-1 text-sm text-muted">
            {event.party_date ? formatDate(event.party_date) : "Date to be set"}
            {" · "}
            {formatMoney(event.gift_budget, event.currency)} gift budget
          </p>
        </div>
        {event.party_date ? (
          <span className="rounded-full bg-cream-100 px-3 py-1 text-xs font-semibold text-muted">
            {countdownLabel(event.party_date)}
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid gap-2.5 pl-1 sm:grid-cols-2">
        <div className="flex items-center gap-2 rounded-xl bg-cream-50 px-3 py-2.5 text-sm">
          <span
            className={`grid size-6 place-items-center rounded-full ${wishlistTone}`}
          >
            {wishlistMark}
          </span>
          <span className={wishlistDone ? "text-muted" : "font-medium text-ink"}>
            {event.my_member_name
              ? event.my_wishlist_items > 0
                ? `${event.my_wishlist_items} wishlist item${event.my_wishlist_items === 1 ? "" : "s"}`
                : "No wishlist yet"
              : event.is_organizer
                ? "Organizing only"
                : "Not in the draw"}
            {wishlistDone ? " · published" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-cream-50 px-3 py-2.5 text-sm text-muted">
          <span className="grid size-6 place-items-center rounded-full bg-pine-100 text-pine-800">
            <svg
              viewBox="0 0 24 24"
              className="size-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="9" cy="8" r="3.2" />
              <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
            </svg>
          </span>
          {event.member_count} on the roster · {event.claimed_count} claimed
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 pl-1">
        <Link href={`/events/${event.id}`} className="btn btn-secondary btn-sm">
          View event
        </Link>
        {event.is_organizer ? (
          <Link
            href={`/events/${event.id}/manage`}
            className="btn btn-pine btn-sm"
          >
            Manage
          </Link>
        ) : null}
        {event.my_member_name &&
        event.status !== "drawn" &&
        event.status !== "completed" ? (
          <Link
            href={`/events/${event.id}/draw`}
            className="btn btn-primary btn-sm"
          >
            Draw now
          </Link>
        ) : null}
        {event.status === "drawn" || event.status === "completed" ? (
          event.has_assignment ? (
            <Link
              href={`/events/${event.id}/draw`}
              className="btn btn-primary btn-sm"
            >
              {event.status === "completed" ? "See your recipient" : "Reveal recipient"}
            </Link>
          ) : null
        ) : null}
        {event.my_member_name ? (
          <Link
            href={`/events/${event.id}/wishlist`}
            className="btn btn-ghost btn-sm"
          >
            My wishlist
          </Link>
        ) : null}
      </div>
      <p className="mt-3 pl-1 text-xs text-muted">{meta.description}</p>
    </article>
  );
}

async function DashboardContent() {
  const { profile } = await requireProfile("/dashboard");
  const [events, notifications] = await Promise.all([
    getDashboardEvents(),
    getNotifications(4),
  ]);

  const firstName = profile.full_name.split(" ")[0];
  const active = events.filter((event) => event.status !== "completed");
  const completed = events.filter((event) => event.status === "completed");
  const toPlan = events.filter(
    (event) => event.has_assignment && event.status !== "completed",
  ).length;
  const wishlistsLeft = active.filter(
    (event) => event.my_member_name && !event.my_wishlist_published,
  ).length;
  const organizing = active.filter((event) => event.is_organizer).length;

  return (
    <div className="container-page py-10 lg:py-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-holly-600">
            Your Christmas HQ
          </p>
          <h1 className="mt-2 font-display text-4xl text-pine-950 sm:text-5xl">
            Merry Christmas, {firstName}.
          </h1>
          <p className="mt-2 max-w-xl text-muted">
            Your exchanges, wishlists, and secret assignments in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/events/new" className="btn btn-primary">
            <span aria-hidden="true">＋</span> Create event
          </Link>
          <Link href="/join" className="btn btn-secondary">
            Join with a code
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active exchanges", value: active.length, hint: `${organizing} organized by you` },
          { label: "Wishlists to finish", value: wishlistsLeft, hint: "Publish before the deadline" },
          { label: "Gifts to plan", value: toPlan, hint: "Recipient revealed" },
          { label: "Unread updates", value: notifications.filter((n) => !n.read_at).length, hint: "Notifications" },
        ].map((stat) => (
          <div key={stat.label} className="card px-5 py-4">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted">
              {stat.label}
            </p>
            <p className="mt-2 font-display text-3xl text-pine-950">
              {stat.value}
            </p>
            <p className="text-xs text-muted">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-pine-950">
              Your exchanges
            </h2>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              {events.length} total
            </span>
          </div>

          {active.length ? (
            <div className="mt-4 space-y-4">
              {active.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="No exchanges yet"
                body="Create your first Christmas exchange, or join one with an invitation code. It takes less than a minute."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Link href="/events/new" className="btn btn-primary">
                      Create an event
                    </Link>
                    <Link href="/join" className="btn btn-secondary">
                      I have a code
                    </Link>
                  </div>
                }
              />
            </div>
          )}

          {completed.length ? (
            <details className="mt-8">
              <summary className="cursor-pointer text-sm font-semibold text-muted hover:text-pine-800">
                Completed exchanges ({completed.length})
              </summary>
              <div className="mt-4 space-y-4 opacity-80">
                {completed.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </details>
          ) : null}
        </div>

        <aside className="space-y-5">
          <div className="card p-5">
            <h2 className="text-base font-semibold text-pine-950">
              Find an exchange
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Enter the code from your host, then claim your name from the
              roster.
            </p>
            <ActionForm
              action={lookupCodeAction}
              submitLabel="Find exchange"
              pendingLabel="Looking…"
              className="mt-3 space-y-2"
              buttonClassName="btn btn-pine btn-sm w-full"
            >
              <label htmlFor="join-code" className="sr-only">
                Invitation code
              </label>
              <input
                id="join-code"
                name="code"
                required
                maxLength={40}
                autoComplete="off"
                placeholder="e.g. A1B2C3D4"
                className="field font-mono uppercase tracking-[0.15em]"
              />
            </ActionForm>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-pine-950">
                Latest updates
              </h2>
              <Link href="/notifications" className="text-xs font-semibold text-pine-700">
                See all
              </Link>
            </div>
            {notifications.length ? (
              <ul className="mt-3 space-y-3">
                {notifications.map((notification) => (
                  <li key={notification.id} className="flex gap-2.5">
                    <span
                      className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                        notification.read_at ? "bg-cream-300" : "bg-holly-500"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {notification.url ? (
                          <Link href={notification.url} className="hover:text-holly-600">
                            {notification.title}
                          </Link>
                        ) : (
                          notification.title
                        )}
                      </p>
                      <p className="text-xs text-muted">
                        {relativeTime(notification.created_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">
                Nothing yet. Draw notifications and wishlist nudges land here.
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-pine-950 p-5 text-cream-50">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-gold-400">
              Keep the secret
            </p>
            <p className="mt-2 text-sm leading-relaxed text-cream-200/90">
              Your assignment is private to you. Even the organizer cannot see
              the full draw — that is what makes the reveal fun.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page py-14">
          <div className="h-10 w-72 animate-pulse rounded-full bg-cream-200" />
          <div className="mt-4 h-4 w-96 animate-pulse rounded-full bg-cream-200" />
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <div className="h-56 animate-pulse rounded-2xl bg-cream-200/70" />
            <div className="h-56 animate-pulse rounded-2xl bg-cream-200/70" />
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

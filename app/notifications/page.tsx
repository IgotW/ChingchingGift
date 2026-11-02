import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ActionForm } from "@/components/action-form";
import { EmptyState } from "@/components/empty-state";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/account";
import { requireProfile } from "@/lib/auth";
import { getNotifications } from "@/lib/data";
import { relativeTime } from "@/lib/format";
import type { NotificationRecord } from "@/lib/types";

export const metadata: Metadata = {
  title: "Notifications",
};

const kindMeta: Record<
  string,
  { label: string; tone: string; dot: string }
> = {
  draw_ready: {
    label: "Secret Santa ready",
    tone: "bg-pine-100 text-pine-800",
    dot: "bg-pine-600",
  },
  wishlist_update: {
    label: "Wishlist",
    tone: "bg-gold-100 text-gold-500",
    dot: "bg-gold-500",
  },
  announcement: {
    label: "Announcement",
    tone: "bg-holly-100 text-holly-700",
    dot: "bg-holly-600",
  },
  event_update: {
    label: "Event update",
    tone: "bg-cream-100 text-muted",
    dot: "bg-cream-300",
  },
  participant_joined: {
    label: "New guest",
    tone: "bg-pine-100 text-pine-800",
    dot: "bg-pine-600",
  },
  joined: {
    label: "Welcome",
    tone: "bg-pine-100 text-pine-800",
    dot: "bg-pine-600",
  },
};

function safeUrl(value: string | null) {
  if (!value) return null;
  return value.startsWith("/") && !value.startsWith("//") ? value : null;
}

function NotificationItem({
  notification,
}: {
  notification: NotificationRecord;
}) {
  const meta = kindMeta[notification.kind] ?? {
    label: "Update",
    tone: "bg-cream-100 text-muted",
    dot: "bg-cream-300",
  };
  const url = safeUrl(notification.url);
  const unread = !notification.read_at;

  return (
    <li
      className={`rounded-2xl border p-4 transition-colors sm:p-5 ${
        unread
          ? "border-pine-600/25 bg-white shadow-sm"
          : "border-cream-200 bg-cream-50/60"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-full ${meta.tone}`}
          aria-hidden="true"
        >
          <span className={`size-2 rounded-full ${meta.dot}`} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`chip ${meta.tone}`}>{meta.label}</span>
            {unread ? (
              <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-holly-600">
                New
              </span>
            ) : null}
          </div>

          <h2 className="mt-2 text-sm font-semibold leading-snug text-pine-950 sm:text-base">
            {url ? (
              <Link href={url} className="hover:text-holly-600">
                {notification.title}
              </Link>
            ) : (
              notification.title
            )}
          </h2>

          {notification.body ? (
            <p className="mt-1 text-sm leading-relaxed text-muted">
              {notification.body}
            </p>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span title={new Date(notification.created_at).toLocaleString()}>
              {relativeTime(notification.created_at)}
            </span>
            {url ? (
              <Link
                href={url}
                className="font-semibold text-pine-700 hover:text-holly-600"
              >
                Open →
              </Link>
            ) : null}
          </div>
        </div>

        {unread ? (
          <ActionForm
            action={markNotificationReadAction}
            submitLabel="Mark read"
            pendingLabel="…"
            className="shrink-0"
            buttonClassName="btn btn-ghost btn-sm"
          >
            <input
              type="hidden"
              name="notification_id"
              value={notification.id}
            />
          </ActionForm>
        ) : (
          <span className="shrink-0 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-muted">
            Read
          </span>
        )}
      </div>
    </li>
  );
}

async function NotificationsContent() {
  await requireProfile("/notifications");
  const notifications = await getNotifications();
  const unread = notifications.filter(
    (notification) => !notification.read_at,
  ).length;

  return (
    <div className="container-page max-w-3xl py-10 lg:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-holly-600">
            Your inbox
          </p>
          <h1 className="mt-2 font-display text-4xl text-pine-950 sm:text-5xl">
            Notifications
          </h1>
          <p className="mt-2 text-muted">
            {unread
              ? `${unread} unread update${unread === 1 ? "" : "s"} waiting for you.`
              : "You are all caught up. Draws, wishlists, and announcements land here."}
          </p>
        </div>
        {unread ? (
          <ActionForm
            action={markAllNotificationsReadAction}
            submitLabel="Mark all read"
            pendingLabel="Saving…"
            className="flex items-center"
            buttonClassName="btn btn-secondary btn-sm"
          >
            <span className="sr-only">Mark all notifications as read</span>
          </ActionForm>
        ) : null}
      </div>

      <div className="mt-8">
        {notifications.length ? (
          <ul className="space-y-3">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
          </ul>
        ) : (
          <EmptyState
            icon="bell"
            title="No notifications yet"
            body="When names are drawn, someone updates their wishlist, or your organizer sends an announcement, it will appear here."
            action={
              <Link href="/dashboard" className="btn btn-secondary">
                Back to dashboard
              </Link>
            }
          />
        )}
      </div>

      <div className="mt-8 rounded-2xl bg-pine-950 p-5 text-cream-50">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-gold-400">
          Quiet by design
        </p>
        <p className="mt-2 text-sm leading-relaxed text-cream-200/90">
          You only receive notifications for your own exchanges. Wishlist
          alerts never reveal who is buying for you, and the organizer never
          learns who drew whom.
        </p>
      </div>

      <p className="mt-5 text-center text-xs text-muted">
        Email notifications are sent when your organizer has configured them.
        Everything important always appears here.
      </p>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page max-w-3xl py-14">
          <div className="h-10 w-64 animate-pulse rounded-full bg-cream-200" />
          <div className="mt-4 h-4 w-80 animate-pulse rounded-full bg-cream-200" />
          <div className="mt-8 space-y-3">
            <div className="h-28 animate-pulse rounded-2xl bg-cream-200/70" />
            <div className="h-28 animate-pulse rounded-2xl bg-cream-200/70" />
            <div className="h-28 animate-pulse rounded-2xl bg-cream-200/70" />
          </div>
        </div>
      }
    >
      <NotificationsContent />
    </Suspense>
  );
}

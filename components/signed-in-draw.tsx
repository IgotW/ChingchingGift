"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/types";
import { Avatar } from "./avatar";
import { SubmitButton } from "./submit-button";
import { WishlistItemCard } from "./wishlist-item-card";

function formatMoney(amount: number | null, currency: string) {
  if (amount == null) return "No budget set";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function formatDate(value: string | null) {
  if (!value) return "No deadline";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function SignedInDraw({
  action,
  eventId,
  memberName,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  eventId: string;
  memberName: string;
}) {
  const [state, formAction] = useActionState(action, null);

  if (state?.reveal) {
    const r = state.reveal;
    const items = Array.isArray(r.wishlist_items) ? r.wishlist_items : [];
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-holly-600/30 bg-holly-100/70 px-4 py-4 text-sm leading-relaxed text-holly-900">
          <p className="font-bold">Shown once only — save this now</p>
          <p className="mt-1">
            For privacy and fairness, this result cannot be shown again (not even
            to the organizer). Please take a screenshot or write down who you drew
            before leaving this page.
          </p>
        </div>

        <section className="card overflow-hidden">
          <div className="bg-pine-950 px-6 py-7 text-center text-cream-50 sm:px-8">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-gold-400">
              {r.event_name}
            </p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">
              You are Secret Santa for
            </h2>
            <div className="mt-5 flex flex-col items-center">
              <Avatar
                name={r.recipient_name}
                src={r.recipient_avatar_url}
                size="xl"
                className="ring-4 ring-pine-900"
              />
              <p className="mt-4 font-display text-4xl text-cream-50">
                {r.recipient_name}
              </p>
              <p className="mt-1 text-sm text-cream-200/80">
                {r.member_name}, keep this a surprise 🎁
              </p>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl bg-cream-100 px-3 py-2.5">
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-muted">
                  Gift budget
                </p>
                <p className="mt-0.5 text-sm font-semibold text-pine-950">
                  {formatMoney(r.gift_budget, r.currency)}
                </p>
              </div>
              <div className="rounded-xl bg-cream-100 px-3 py-2.5">
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-muted">
                  Wishlist due
                </p>
                <p className="mt-0.5 text-sm font-semibold text-pine-950">
                  {formatDate(r.wishlist_deadline)}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-pine-950">
                  {r.recipient_name.split(" ")[0]}&rsquo;s wishlist
                </h3>
                <span
                  className={`chip ${
                    r.wishlist_published
                      ? "bg-pine-100 text-pine-800"
                      : "bg-gold-100 text-gold-500"
                  }`}
                >
                  {items.length
                    ? r.wishlist_published
                      ? "Published"
                      : "Draft preview"
                    : "No items yet"}
                </span>
              </div>

              {items.length ? (
                <ul className="mt-4 space-y-4">
                  {items.map((item) => (
                    <WishlistItemCard
                      key={item.id}
                      item={item}
                      currency={r.currency}
                    />
                  ))}
                </ul>
              ) : (
                <p className="mt-3 rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm leading-relaxed text-muted">
                  No wishlist items were available at the moment of your draw.
                  Use the budget and exchange notes as your guide.
                </p>
              )}
            </div>

            <p className="mt-6 text-center text-xs leading-relaxed text-muted">
              This page will not show this result again if refreshed or reopened.
              Keep your screenshot or note safe.
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <section className="card overflow-hidden">
      <div className="bg-pine-950 px-6 py-7 text-center text-cream-50 sm:px-8 sm:py-9">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-gold-400">
          One-time reveal
        </p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl">
          Ready to draw, {memberName.split(" ")[0]}?
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-cream-200/80">
          When you reveal, you will see who you are buying for exactly once. Save
          it immediately — it cannot be shown again, not even to the organizer.
        </p>
      </div>

      <div className="px-6 py-7 sm:px-8">
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="event_id" value={eventId} />

          <div className="rounded-xl border border-gold-500/25 bg-gold-100/50 px-4 py-3 text-sm leading-relaxed text-pine-900">
            <strong className="font-semibold">Important:</strong> take a screenshot
            or write down the name as soon as it appears. After this reveal, it is
            hidden forever for privacy.
          </div>

          {state?.error ? (
            <p
              role="alert"
              className="rounded-xl border border-holly-600/25 bg-holly-100/70 px-3.5 py-2.5 text-sm font-medium text-holly-700"
            >
              {state.error}
            </p>
          ) : null}

          <div className="flex justify-center">
            <SubmitButton
              label="Reveal my Secret Santa"
              pendingLabel="Revealing securely…"
              className="btn btn-primary px-7 py-3 text-base"
            />
          </div>
        </form>
      </div>
    </section>
  );
}

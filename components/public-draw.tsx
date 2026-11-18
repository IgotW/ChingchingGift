"use client";

import { useActionState, useMemo, useState } from "react";
import type { ActionState, PreviewMember } from "@/lib/types";
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

export function PublicDraw({
  action,
  members,
  code,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  members: PreviewMember[];
  code: string;
}) {
  const [state, formAction] = useActionState(action, null);
  const [selected, setSelected] = useState<string | null>(null);

  const normalizedMembers = useMemo(
    () =>
      members.map((m) => ({
        ...m,
        drawn: m.drawn === true,
        claimed: m.claimed === true,
      })),
    [members],
  );

  const selectedMember = useMemo(
    () => normalizedMembers.find((m) => m.id === selected) ?? null,
    [normalizedMembers, selected],
  );
  const availableCount = normalizedMembers.filter((m) => !m.drawn).length;

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
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="code" value={code} />
      <input type="hidden" name="member_id" value={selected ?? ""} />

      <p className="rounded-xl border border-gold-500/25 bg-gold-100/50 px-3.5 py-2.5 text-sm leading-relaxed text-pine-900">
        <strong className="font-semibold">One-time draw:</strong> your result is
        shown once only — screenshot or write it down.
      </p>

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-pine-950">Choose your name</p>
        <span className="chip bg-cream-100 text-muted">
          {availableCount} of {normalizedMembers.length} available
        </span>
      </div>

      {availableCount === 0 ? (
        <p
          role="status"
          className="rounded-xl border border-cream-200 bg-cream-100 px-4 py-3 text-sm leading-relaxed text-muted"
        >
          Everyone on this roster has already drawn. If you haven’t drawn yet,
          ask the organizer to confirm your name is on the list or to reset the
          draw if needed.
        </p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {normalizedMembers.map((member) => {
            const isSelected = selected === member.id;
            const disabled = member.drawn;
            return (
              <li key={member.id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => setSelected(member.id)}
                  aria-pressed={isSelected}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition sm:px-4 ${
                    disabled
                      ? "cursor-not-allowed border-cream-200 bg-cream-100/60 text-muted"
                      : isSelected
                        ? "cursor-pointer border-pine-700 bg-pine-50 text-pine-950 shadow-sm ring-2 ring-pine-700/20"
                        : "cursor-pointer border-cream-200 bg-white text-pine-950 active:bg-cream-50 sm:hover:border-pine-300 sm:hover:bg-cream-50"
                  }`}
                >
                  <span className="min-w-0 truncate font-semibold">
                    {member.name}
                  </span>
                  <span
                    className={`shrink-0 text-[0.6rem] font-bold uppercase tracking-[0.12em] ${
                      disabled
                        ? "text-muted"
                        : isSelected
                          ? "text-pine-700"
                          : "text-holly-600"
                    }`}
                  >
                    {disabled ? "Drawn" : isSelected ? "Selected" : "Tap"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {state?.error ? (
        <p
          role="alert"
          className="rounded-xl border border-holly-600/25 bg-holly-100/70 px-3.5 py-2.5 text-sm font-medium text-holly-700"
        >
          {state.error}
        </p>
      ) : null}

      <div className="sticky bottom-0 -mx-1 mt-1 space-y-2 rounded-xl border border-cream-200 bg-cream-50/95 p-3 backdrop-blur sm:static sm:mx-0 sm:bg-cream-50 sm:p-4">
        <p className="text-sm text-pine-950">
          {selectedMember ? (
            <>
              Drawing as <strong>{selectedMember.name}</strong>. Make sure this is
              you.
            </>
          ) : (
            "Tap your name above, then draw."
          )}
        </p>
        <SubmitButton
          label={
            selectedMember
              ? `Draw as ${selectedMember.name}`
              : "Select your name to draw"
          }
          pendingLabel="Drawing…"
          className="btn btn-primary w-full py-3 text-base"
          disabled={!selectedMember}
        />
        <p className="text-center text-xs text-muted">
          No sign-in required. Result shown once and never stored for viewing again.
        </p>
      </div>
    </form>
  );
}

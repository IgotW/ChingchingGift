import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ActionForm } from "@/components/action-form";
import { createEventAction } from "@/lib/actions/events";
import { requireProfile } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Create an exchange",
};

function defaultDates() {
  const now = new Date();
  let year = now.getFullYear();
  if (now.getMonth() === 11 && now.getDate() > 25) year += 1;
  return {
    party: `${year}-12-25`,
    wishlist: `${year}-12-15`,
  };
}

async function NewEventContent() {
  const session = await requireProfile("/events/new");
  const dates = defaultDates();

  return (
    <div className="container-page max-w-3xl py-10 lg:py-14">
      <Link
        href="/dashboard"
        className="text-sm font-semibold text-muted hover:text-pine-800"
      >
        ← Back to dashboard
      </Link>

      <div className="mt-5">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-holly-600">
          Set the scene
        </p>
        <h1 className="mt-2 font-display text-4xl text-pine-950 sm:text-5xl">
          Create a Christmas exchange
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          List everyone joining now. Guests claim their own name from the list
          and can draw straight away — the roster is already complete, so nobody
          has to wait.
        </p>
      </div>

      <div className="card mt-8 p-6 sm:p-8">
        <ActionForm
          action={createEventAction}
          submitLabel="Create event"
          pendingLabel="Creating…"
          className="space-y-8"
        >
          <div className="space-y-5">
            <div>
              <label htmlFor="name" className="label">
                Event name <span className="text-holly-600">*</span>
              </label>
              <input
                id="name"
                name="name"
                required
                minLength={2}
                maxLength={120}
                placeholder="e.g. Deck the Desks 2026"
                className="field"
              />
            </div>

            <div>
              <label htmlFor="description" className="label">
                Short description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                maxLength={2000}
                placeholder="A little context for your guests — who is invited, what the vibe is, whether ugly sweaters are mandatory."
                className="field resize-y"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="party_date" className="label">
                  Party date <span className="text-holly-600">*</span>
                </label>
                <input
                  id="party_date"
                  name="party_date"
                  type="date"
                  required
                  defaultValue={dates.party}
                  className="field"
                />
              </div>
              <div>
                <label htmlFor="gift_budget" className="label">
                  Gift budget
                </label>
                <div className="flex gap-2">
                  <select
                    name="currency"
                    defaultValue="USD"
                    aria-label="Currency"
                    className="field w-24 shrink-0"
                  >
                    {["USD", "EUR", "GBP", "PHP", "AUD", "CAD", "SGD"].map(
                      (currency) => (
                        <option key={currency} value={currency}>
                          {currency}
                        </option>
                      ),
                    )}
                  </select>
                  <input
                    id="gift_budget"
                    name="gift_budget"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="25"
                    className="field"
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted">
                  A friendly spending ceiling, not a strict rule.
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="wishlist_deadline" className="label">
                Wishlist deadline
              </label>
              <input
                id="wishlist_deadline"
                name="wishlist_deadline"
                type="date"
                defaultValue={dates.wishlist}
                className="field"
              />
              <p className="mt-1.5 text-xs text-muted">
                A gentle nudge for signed-in members to finish their wishlists.
              </p>
            </div>
          </div>

          <div className="space-y-5 border-t border-cream-200 pt-7">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-holly-600">
                The roster
              </p>
              <h2 className="mt-2 font-display text-2xl text-pine-950">
                Who is taking part?
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Every name here is included in the draw. Add one name per line —
                first names are fine. Guests will claim their own name from this
                list.
              </p>
            </div>

            <div className="rounded-2xl border border-cream-200 bg-cream-50 p-4 sm:p-5">
              <label htmlFor="organizer_name" className="label">
                Your name in the exchange
              </label>
              <input
                id="organizer_name"
                name="organizer_name"
                maxLength={80}
                defaultValue={session.profile.full_name}
                placeholder="e.g. Alex"
                className="field"
              />
              <label className="mt-4 flex items-start gap-3 text-sm text-pine-950">
                <input
                  type="checkbox"
                  name="include_organizer"
                  defaultChecked
                  className="mt-0.5 size-4 rounded border-cream-300 text-pine-700 focus:ring-pine-600"
                />
                <span>
                  <span className="font-semibold">
                    I&rsquo;m taking part in the exchange.
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                    We&rsquo;ll reserve this name for your account. Uncheck it if
                    you are only organizing.
                  </span>
                </span>
              </label>
            </div>

            <div>
              <label htmlFor="members" className="label">
                Everyone else joining
              </label>
              <textarea
                id="members"
                name="members"
                rows={8}
                maxLength={8000}
                placeholder={"Jamie\nSam\nTaylor\nGrandma Rose"}
                className="field resize-y font-mono text-sm"
              />
              <p className="mt-1.5 text-xs text-muted">
                One name per line. You need at least two people in total to draw
                names. You can add or remove names until the draw.
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="instructions" className="label">
              Gift exchange instructions
            </label>
            <textarea
              id="instructions"
              name="instructions"
              rows={3}
              maxLength={2000}
              placeholder="Where to bring gifts, whether handmade is welcome, dietary notes for the party…"
              className="field resize-y"
            />
          </div>

          <div className="rounded-xl border border-gold-500/25 bg-gold-100/50 px-4 py-3 text-sm leading-relaxed text-pine-900">
            <strong className="font-semibold">What happens next:</strong> you get
            a shareable invitation link and a private link for every name on the
            roster. Guests can claim their name with Google and draw immediately.
            Guests who do not use Google just open their private link and tap one
            Draw button — no sign-in at all.
          </div>
        </ActionForm>
      </div>

      <p className="mt-5 text-center text-xs text-muted">
        Wishlists are for signed-in members. Guests who use a personal link can
        still reveal their recipient and browse their wishlist.
      </p>
    </div>
  );
}

export default function NewEventPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page max-w-3xl py-16">
          <div className="h-10 w-80 animate-pulse rounded-full bg-cream-200" />
          <div className="mt-8 h-96 animate-pulse rounded-2xl bg-cream-200/70" />
        </div>
      }
    >
      <NewEventContent />
    </Suspense>
  );
}

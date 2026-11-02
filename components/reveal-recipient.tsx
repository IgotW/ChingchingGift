"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "./avatar";

export function RevealRecipient({
  eventId,
  eventName,
  recipientName,
  recipientAvatar,
  wishlistCount,
  wishlistPublished,
  budget,
  wishlistDeadline,
  completed,
}: {
  eventId: string;
  eventName: string;
  recipientName: string;
  recipientAvatar: string | null;
  wishlistCount: number;
  wishlistPublished: boolean;
  budget: string;
  wishlistDeadline: string;
  completed: boolean;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="card relative overflow-hidden">
      <div className="bg-pine-950 px-6 py-6 text-center text-cream-50 sm:px-10 sm:py-8">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] text-gold-400">
          {eventName}
        </p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl">
          {revealed ? "Your Secret Santa recipient" : "Your assignment is sealed"}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-cream-200/80">
          {revealed
            ? "This page is private to you. Choose something thoughtful, and keep the secret until the party."
            : "Take a breath, then unwrap. Only you can see this page."}
        </p>
      </div>

      {revealed ? (
        <div className="px-6 py-8 text-center sm:px-10 sm:py-10">
          <div className="mx-auto flex max-w-sm flex-col items-center">
            <Avatar
              name={recipientName}
              src={recipientAvatar}
              size="xl"
              className="ring-4 ring-cream-100"
            />
            <h2 className="mt-4 font-display text-4xl text-pine-950">
              {recipientName}
            </h2>
            <p className="mt-1 text-sm text-muted">
              You are their Secret Santa 🎄
            </p>

            <div className="mt-5 grid w-full grid-cols-2 gap-2 text-left">
              <div className="rounded-xl bg-cream-100 px-3 py-2.5">
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-muted">
                  Gift budget
                </p>
                <p className="mt-0.5 text-sm font-semibold text-pine-950">
                  {budget}
                </p>
              </div>
              <div className="rounded-xl bg-cream-100 px-3 py-2.5">
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-muted">
                  Wishlist due
                </p>
                <p className="mt-0.5 text-sm font-semibold text-pine-950">
                  {wishlistDeadline}
                </p>
              </div>
            </div>

            <div className="mt-5 w-full rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-left">
              <p className="text-sm font-semibold text-pine-950">
                {wishlistCount > 0
                  ? `${wishlistCount} gift idea${wishlistCount === 1 ? "" : "s"} waiting for you`
                  : "No wishlist yet"}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">
                {wishlistCount > 0
                  ? wishlistPublished
                    ? "Their wishlist is ready. Take a look before you shop."
                    : "They are still editing, but you can peek at what is there."
                  : "They have not added any ideas yet. You will get a private notification when they do."}
              </p>
            </div>

            <div className="mt-6 flex w-full flex-col gap-2">
              <Link
                href={`/events/${eventId}/recipient`}
                className="btn btn-primary w-full"
              >
                {wishlistCount > 0 ? "Open their wishlist" : "View their wishlist page"}
              </Link>
              <button
                type="button"
                onClick={() => setRevealed(false)}
                className="btn btn-ghost btn-sm"
              >
                Hide the name again
              </button>
            </div>

            <p className="mt-5 text-xs leading-relaxed text-muted">
              {completed
                ? "This exchange is complete. The memory stays here."
                : "Updated wishlists trigger a private notification for you — no need to keep checking."}
            </p>
          </div>
        </div>
      ) : (
        <div className="px-6 py-10 text-center sm:px-10 sm:py-12">
          <div className="relative mx-auto grid size-32 place-items-center rounded-3xl bg-holly-600 text-cream-50 shadow-xl shadow-holly-700/20">
            <svg
              viewBox="0 0 24 24"
              className="size-14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3.5" y="9" width="17" height="11.5" rx="1.6" />
              <path d="M2.5 9h19v3.5h-19zM12 9v11.5" />
              <path d="M12 9c-2.6 0-4.6-1.4-4.6-3.2C7.4 4.2 8.4 3.3 9.7 3.3c1.9 0 2.3 2.4 2.3 5.7Z" />
              <path d="M12 9c2.6 0 4.6-1.4 4.6-3.2 0-1.6-1-2.5-2.3-2.5-1.9 0-2.3 2.4-2.3 5.7Z" />
            </svg>
            <span className="absolute -right-2 -top-2 grid size-9 rotate-12 place-items-center rounded-full bg-gold-400 text-sm font-bold text-pine-950 shadow">
              🎁
            </span>
          </div>
          <p className="mx-auto mt-6 max-w-sm text-sm leading-relaxed text-muted">
            The name is ready and waiting. Open it somewhere private, ideally
            with a cup of something warm.
          </p>
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="btn btn-primary mt-6 px-7 py-3 text-base"
          >
            Unwrap my recipient
          </button>
        </div>
      )}
    </div>
  );
}

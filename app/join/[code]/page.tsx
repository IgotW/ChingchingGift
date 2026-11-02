import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ActionForm } from "@/components/action-form";
import { ClaimNamePicker } from "@/components/claim-name-picker";
import { EmptyState } from "@/components/empty-state";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { StatusChip } from "@/components/status-chip";
import { claimMemberAction, drawNamesAction } from "@/lib/actions/events";
import { getCurrentUser } from "@/lib/auth";
import { getEventPreview, getMyMember } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "You are invited",
};

async function PreviewContent({ code }: { code: string }) {
  await connection();

  if (!isSupabaseConfigured()) redirect("/setup");

  const preview = await getEventPreview(code);
  const user = await getCurrentUser();

  if (!preview) {
    return (
      <div className="container-page max-w-2xl py-14">
        <Link
          href="/join"
          className="text-sm font-semibold text-muted hover:text-pine-800"
        >
          ← Join another exchange
        </Link>
        <div className="mt-6">
          <EmptyState
            icon="gift"
            title="That invitation was not found"
            body="The code may have a typo, or the host may have replaced it. Double-check the link, or ask your organizer for a fresh invitation."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/join" className="btn btn-primary">
                  Try another code
                </Link>
                <Link href="/dashboard" className="btn btn-secondary">
                  Dashboard
                </Link>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  const membership = user ? await getMyMember(preview.id) : null;
  const claimsOpen = preview.status !== "completed";
  const available = preview.members.filter((member) => !member.claimed).length;
  const drawn =
    preview.status === "drawn" || preview.status === "completed";

  return (
    <div className="container-page max-w-5xl py-10 lg:py-14">
      <Link
        href={user ? "/dashboard" : "/"}
        className="text-sm font-semibold text-muted hover:text-pine-800"
      >
        ← {user ? "Dashboard" : "Home"}
      </Link>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="chip bg-gold-100 text-gold-500">Invitation</span>
        <StatusChip status={preview.status} />
        {membership ? (
          <span className="chip bg-pine-100 text-pine-800">
            You are in as {membership.display_name}
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_21rem]">
        <div className="space-y-6">
          <section className="card overflow-hidden">
            <div className="bg-pine-950 px-6 py-7 text-cream-50 sm:px-8 sm:py-9">
              <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-gold-400">
                You are invited to
              </p>
              <h1 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">
                {preview.name}
              </h1>
              <p className="mt-2 text-sm text-cream-200/80">
                Hosted by {preview.organizer_name} · {preview.member_count}{" "}
                {preview.member_count === 1 ? "person" : "people"} on the roster
              </p>
              {preview.description ? (
                <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-relaxed text-cream-100/90">
                  {preview.description}
                </p>
              ) : null}
            </div>

            <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
              <div className="rounded-xl bg-cream-100 px-4 py-3">
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-muted">
                  Party date
                </p>
                <p className="mt-1 text-sm font-semibold text-pine-950">
                  {formatDate(preview.party_date)}
                </p>
              </div>
              <div className="rounded-xl bg-cream-100 px-4 py-3">
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-muted">
                  Gift budget
                </p>
                <p className="mt-1 text-sm font-semibold text-pine-950">
                  {formatMoney(preview.gift_budget, preview.currency)}
                </p>
              </div>
              <div className="rounded-xl bg-cream-100 px-4 py-3">
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-muted">
                  Wishlists due
                </p>
                <p className="mt-1 text-sm font-semibold text-pine-950">
                  {formatDate(preview.wishlist_deadline)}
                </p>
              </div>
            </div>
          </section>

          <section className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold text-pine-950">
                The roster
              </h2>
              <span className="chip bg-cream-100 text-muted">
                {preview.member_count - available} of {preview.member_count}{" "}
                claimed
              </span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Find your own name below. A claimed name belongs to someone else
              and can no longer be picked.
            </p>

            {preview.members.length ? (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {preview.members.map((member) => (
                  <li
                    key={member.id}
                    className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
                      member.claimed
                        ? "border-cream-200 bg-cream-100/60 text-muted"
                        : "border-cream-200 bg-white font-semibold text-pine-950"
                    }`}
                  >
                    <span>{member.name}</span>
                    <span className="text-[0.62rem] font-bold uppercase tracking-[0.12em]">
                      {member.claimed ? "Claimed" : "Available"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-xl bg-cream-100 px-4 py-3 text-sm text-muted">
                The host has not added anyone to the roster yet.
              </p>
            )}
          </section>

          <section className="card p-6">
            <h2 className="text-xl font-semibold text-pine-950">
              How this exchange works
            </h2>
            <ol className="mt-4 space-y-4">
              {[
                [
                  "Claim your name",
                  "Pick yourself from the roster. The host already included everyone in the draw.",
                ],
                [
                  "Share a wishlist",
                  "Signed-in members can add a few gift ideas, sizes, colours, and anything to avoid.",
                ],
                [
                  "Draw straight away",
                  "Everyone is already on the roster. Once you claim your name you can tap Draw — no waiting for other guests.",
                ],
                [
                  "Keep the surprise",
                  "Your recipient never learns that you drew their name.",
                ],
              ].map(([title, body], index) => (
                <li key={title} className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-pine-100 text-xs font-bold text-pine-800">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-pine-950">
                      {title}
                    </p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted">
                      {body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="card p-5">
            <h2 className="text-lg font-semibold text-pine-950">
              {membership
                ? "You are already in"
                : !claimsOpen
                  ? "This exchange is complete"
                  : user
                    ? "Claim your name"
                    : "Sign in to claim your name"}
            </h2>

            {membership ? (
              <>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  Your spot is saved as{" "}
                  <strong className="font-semibold text-pine-950">
                    {membership.display_name}
                  </strong>
                  . The roster is already complete, so you can draw right away.
                </p>
                {drawn ? (
                  <Link
                    href={`/events/${preview.id}/draw`}
                    className="btn btn-primary mt-4 w-full"
                  >
                    Reveal my recipient
                  </Link>
                ) : (
                  <div className="mt-4">
                    <ActionForm
                      action={drawNamesAction}
                      submitLabel="Draw my name now"
                      pendingLabel="Drawing names…"
                      className="space-y-3"
                      buttonClassName="btn btn-primary w-full"
                      confirm="Draw the names now? Everyone's assignment becomes final until the organizer resets the draw."
                    >
                      <input
                        type="hidden"
                        name="event_id"
                        value={preview.id}
                      />
                    </ActionForm>
                  </div>
                )}
                <Link
                  href={`/events/${preview.id}`}
                  className={`btn w-full ${drawn ? "btn-secondary" : "btn-ghost"} mt-2`}
                >
                  Open the event
                </Link>
              </>
            ) : !claimsOpen ? (
              <>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  The exchange has been completed, so names can no longer be
                  claimed. Ask the host if you need access to your personal
                  reveal link.
                </p>
                <Link
                  href={user ? "/dashboard" : "/"}
                  className="btn btn-secondary mt-4 w-full"
                >
                  {user ? "Back to dashboard" : "Back home"}
                </Link>
              </>
            ) : user ? (
              <>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  Pick your own name from the roster. You can only claim one
                  name, and it stays yours for the rest of the exchange.
                </p>
                <div className="mt-4">
                  <ClaimNamePicker
                    action={claimMemberAction}
                    members={preview.members}
                    code={code}
                  />
                </div>
              </>
            ) : (
              <>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  Sign in with Google to claim your name. It only takes a
                  moment, and there is no password to remember.
                </p>
                <div className="mt-4">
                  <GoogleSignInButton
                    next={`/join/${encodeURIComponent(code)}`}
                    label="Sign in to claim"
                    className="btn btn-primary w-full"
                  />
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  Not a fan of Google sign-in? Ask your host for your personal
                  link. It opens a page with one big <strong>Draw</strong>{" "}
                  button and no sign-in at all.
                </p>
              </>
            )}
          </section>

          <section className="card p-5">
            <h2 className="text-base font-semibold text-pine-950">
              Key dates
            </h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Party</dt>
                <dd className="font-semibold text-ink">
                  {formatDate(preview.party_date)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Wishlists due</dt>
                <dd className="font-semibold text-ink">
                  {formatDate(preview.wishlist_deadline)}
                </dd>
              </div>
            </dl>
          </section>

          <div className="rounded-2xl bg-cream-100 p-5">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted">
              A private surprise
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Assignments are secret. The host can see the roster and wishlist
              progress, but never who drew whom.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function PreviewPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="container-page max-w-5xl py-14">
          <div className="h-10 w-80 animate-pulse rounded-full bg-cream-200" />
          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_21rem]">
            <div className="h-72 animate-pulse rounded-2xl bg-cream-200/70" />
            <div className="h-52 animate-pulse rounded-2xl bg-cream-200/70" />
          </div>
        </div>
      }
    >
      <PreviewContentWrapper params={params} />
    </Suspense>
  );
}

async function PreviewContentWrapper({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  if (!code) notFound();
  return <PreviewContent code={code} />;
}

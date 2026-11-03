import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ActionForm } from "@/components/action-form";
import { Avatar } from "@/components/avatar";
import { CopyButton } from "@/components/copy-button";
import { StatusChip } from "@/components/status-chip";
import {
  addExclusionAction,
  addMemberAction,
  announceAction,
  completeEventAction,
  drawNamesAction,
  removeExclusionAction,
  removeMemberAction,
  renameMemberAction,
  resetDrawAction,
  updateEventAction,
} from "@/lib/actions/events";
import { requireProfile } from "@/lib/auth";
import {
  getEvent,
  getEventAudit,
  getEventExclusions,
  getEventMembers,
  getMemberTokens,
  getWishlistStatus,
} from "@/lib/data";
import {
  countdownLabel,
  eventStatusMeta,
  formatDate,
  formatDateTime,
  formatMoney,
  relativeTime,
} from "@/lib/format";
import { getSiteUrl } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Manage exchange",
};

const CURRENCIES = ["USD", "EUR", "GBP", "PHP", "AUD", "CAD", "SGD"];

const auditLabels: Record<string, string> = {
  draw_completed: "Names drawn",
  draw_reset: "Draw reset",
  announcement: "Announcement sent",
};

function auditDetail(details: unknown): string | null {
  if (!details || typeof details !== "object") return null;
  const entries = Object.entries(details as Record<string, unknown>);
  if (!entries.length) return null;
  return entries
    .map(([key, value]) => `${key.replaceAll("_", " ")}: ${String(value)}`)
    .join(" · ");
}

const DANGER_BUTTON =
  "btn btn-sm border border-holly-600/30 bg-transparent text-holly-700 hover:bg-holly-100";

async function ManageContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireProfile(`/events/${id}/manage`);

  const event = await getEvent(id);
  if (!event || event.organizer_id !== session.user.id) notFound();

  const [members, wishlistStatus, tokens, audit, exclusions] = await Promise.all([
    getEventMembers(id),
    getWishlistStatus(id),
    getMemberTokens(id),
    getEventAudit(id),
    getEventExclusions(id),
  ]);

  const wishlistMap = new Map(wishlistStatus.map((row) => [row.member_id, row]));
  const memberName = new Map(members.map((row) => [row.id, row.display_name]));
  const claimedCount = members.filter((row) => row.user_id).length;
  const wishlistReady = wishlistStatus.filter(
    (row) => row.is_published && row.item_count > 0,
  ).length;
  const joinUrl = `${getSiteUrl()}/join/${event.invite_code}`;
  const statusMeta = eventStatusMeta[event.status];
  const isLocked = event.status === "drawn" || event.status === "completed";
  const isCompleted = event.status === "completed";
  const canDraw = !isLocked && members.length >= 2;
  const myMember = members.find((row) => row.user_id === session.user.id);

  return (
    <div className="container-page py-10 lg:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/events/${id}`}
          className="text-sm font-semibold text-muted hover:text-pine-800"
        >
          ← {event.name}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status={event.status} />
          <span className="chip bg-cream-100 text-muted">Organizer tools</span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-holly-600">
            Run the exchange
          </p>
          <h1 className="mt-2 font-display text-4xl text-pine-950 sm:text-5xl">
            {event.name}
          </h1>
          <p className="mt-2 max-w-2xl text-muted">{statusMeta.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/events/${id}`} className="btn btn-secondary">
            View as guest
          </Link>
          {myMember ? (
            <Link href={`/events/${id}/wishlist`} className="btn btn-secondary">
              My wishlist
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card px-5 py-4">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted">
            Roster
          </p>
          <p className="mt-2 font-display text-3xl text-pine-950">
            {members.length}
          </p>
          <p className="text-xs text-muted">names in the draw</p>
        </div>
        <div className="card px-5 py-4">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted">
            Claimed
          </p>
          <p className="mt-2 font-display text-3xl text-pine-950">
            {claimedCount}
          </p>
          <p className="text-xs text-muted">
            {members.length - claimedCount} still waiting
          </p>
        </div>
        <div className="card px-5 py-4">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted">
            Wishlists ready
          </p>
          <p className="mt-2 font-display text-3xl text-pine-950">
            {wishlistReady}
          </p>
          <p className="text-xs text-muted">published with at least one idea</p>
        </div>
        <div className="card px-5 py-4">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted">
            Party date
          </p>
          <p className="mt-2 font-display text-3xl text-pine-950">
            {formatDate(event.party_date, false)}
          </p>
          <p className="text-xs text-muted">
            {countdownLabel(event.party_date) ?? "Date not set"}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_21rem]">
        <div className="space-y-6">
          <section id="draw" className="card overflow-hidden">
            <div className="bg-pine-950 px-6 py-5 text-cream-50">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-gold-400">
                    The draw
                  </p>
                  <h2 className="mt-1 font-display text-2xl">
                    {isCompleted
                      ? "This exchange is complete."
                      : event.status === "drawn"
                        ? "Names are drawn and sealed."
                        : canDraw
                          ? "Ready when you are."
                          : "Add at least two names first."}
                  </h2>
                </div>
                <StatusChip status={event.status} />
              </div>
              <p className="mt-2 max-w-xl text-sm text-cream-200/80">
                {isCompleted
                  ? `Completed ${formatDateTime(event.completed_at)}. The history and assignments remain preserved for everyone.`
                  : event.status === "drawn"
                    ? `Drawn ${formatDateTime(event.drawn_at)}. Each name can now privately reveal one unique recipient. Personal links keep working without sign-in.`
                    : "The roster is complete, so guests can start the draw the moment they claim their name. You can start it now too — every name on the roster is included, claimed or not."}
              </p>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-cream-100 px-4 py-3">
                  <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-muted">
                    On the roster
                  </p>
                  <p className="mt-1 text-sm font-semibold text-pine-950">
                    {members.length} {members.length === 1 ? "name" : "names"}
                  </p>
                </div>
                <div className="rounded-xl bg-cream-100 px-4 py-3">
                  <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-muted">
                    Claimed
                  </p>
                  <p className="mt-1 text-sm font-semibold text-pine-950">
                    {claimedCount} of {members.length}
                  </p>
                </div>
                <div className="rounded-xl bg-cream-100 px-4 py-3">
                  <p className="text-[0.58rem] font-bold uppercase tracking-[0.12em] text-muted">
                    Privacy
                  </p>
                  <p className="mt-1 text-sm font-semibold text-pine-950">
                    You cannot see assignments
                  </p>
                </div>
              </div>

              {isCompleted ? (
                <p className="rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm leading-relaxed text-muted">
                  This event is now history. Editing, roster changes, and resets
                  are disabled, but everyone can still revisit their assignment
                  and wishlist.
                </p>
              ) : null}

              {!isLocked ? (
                <div className="space-y-4">
                  {canDraw ? (
                    <ActionForm
                      action={drawNamesAction}
                      submitLabel="Draw names now"
                      pendingLabel="Drawing names…"
                      className="flex flex-wrap items-center gap-3"
                      buttonClassName="btn btn-primary"
                      confirm="Draw names now? Every name on the roster is included, and assignments become final until you reset."
                    >
                      <input type="hidden" name="event_id" value={id} />
                    </ActionForm>
                  ) : (
                    <p className="rounded-xl border border-holly-600/25 bg-holly-100/70 px-4 py-3 text-sm font-medium text-holly-700">
                      You need at least two names on the roster before you can
                      draw. Add names below.
                    </p>
                  )}
                  <p className="text-xs leading-relaxed text-muted">
                    Unclaimed names are still included. For guests who do not use
                    Google, copy their private link below — they open it and tap
                    one Draw button, with no sign-in.
                  </p>
                </div>
              ) : null}

              {event.status === "drawn" ? (
                <div className="space-y-5">
                  <div className="flex flex-wrap gap-3">
                    {myMember ? (
                      <Link
                        href={`/events/${id}/draw`}
                        className="btn btn-secondary btn-sm"
                      >
                        Preview my own assignment
                      </Link>
                    ) : null}
                    <ActionForm
                      action={completeEventAction}
                      submitLabel="Mark exchange complete"
                      pendingLabel="Completing…"
                      className="flex flex-wrap items-center gap-2"
                      buttonClassName="btn btn-pine btn-sm"
                      confirm="Mark this exchange complete? This preserves history and locks further changes."
                    >
                      <input type="hidden" name="event_id" value={id} />
                    </ActionForm>
                  </div>

                  <details className="rounded-xl border border-holly-600/25 bg-holly-100/40 px-4 py-3">
                    <summary className="cursor-pointer text-sm font-semibold text-holly-700">
                      Reset the draw (emergency only)
                    </summary>
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                      This permanently deletes every assignment and the
                      notification that announced them, then reopens the roster
                      for editing. Everyone keeps their claimed name and personal
                      link. Type the event name exactly to confirm.
                    </p>
                    <ActionForm
                      action={resetDrawAction}
                      submitLabel="Reset draw"
                      pendingLabel="Resetting…"
                      className="mt-3 space-y-3"
                      buttonClassName={DANGER_BUTTON}
                    >
                      <input type="hidden" name="event_id" value={id} />
                      <label htmlFor="draw-reset-confirmation" className="label">
                        Type “{event.name}” to confirm
                      </label>
                      <input
                        id="draw-reset-confirmation"
                        name="confirmation"
                        required
                        maxLength={120}
                        autoComplete="off"
                        placeholder={event.name}
                        className="field"
                      />
                    </ActionForm>
                  </details>
                </div>
              ) : null}
            </div>
          </section>

          <section id="roster" className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-semibold text-pine-950">Roster</h2>
                <p className="text-xs text-muted">
                  {members.length} names · {claimedCount} claimed ·{" "}
                  {wishlistReady} wishlist{wishlistReady === 1 ? "" : "s"} ready
                </p>
              </div>
              {!isLocked ? (
                <span className="chip bg-cream-100 text-muted">
                  Editable before the draw
                </span>
              ) : (
                <span className="chip bg-cream-100 text-muted">
                  Locked after the draw
                </span>
              )}
            </div>

            {!isLocked ? (
              <div className="mt-4 rounded-xl border border-cream-200 bg-cream-50 p-4">
                <ActionForm
                  action={addMemberAction}
                  submitLabel="Add to roster"
                  pendingLabel="Adding…"
                  className="flex flex-wrap items-end gap-2"
                  buttonClassName="btn btn-primary btn-sm"
                  resetOnSuccess
                >
                  <input type="hidden" name="event_id" value={id} />
                  <div className="min-w-0 flex-1">
                    <label htmlFor="new-member" className="label">
                      Add another name
                    </label>
                    <input
                      id="new-member"
                      name="display_name"
                      required
                      maxLength={80}
                      placeholder="e.g. Cousin Mia"
                      className="field"
                    />
                  </div>
                </ActionForm>
              </div>
            ) : null}

            {members.length ? (
              <ul className="mt-4 divide-y divide-cream-200">
                {members.map((row) => {
                  const isYou = row.user_id === session.user.id;
                  const isHost = row.user_id === event.organizer_id;
                  const wishlist = wishlistMap.get(row.id);
                  const wishlistReadyFor =
                    wishlist?.is_published && wishlist.item_count > 0;
                  const token = tokens.get(row.id);
                  const personalUrl = token
                    ? `${getSiteUrl()}/claim/${token}`
                    : null;

                  return (
                    <li key={row.id} className="space-y-3 py-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <Avatar
                          name={row.profile?.full_name ?? row.display_name}
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
                            {" · "}
                            added {formatDate(row.created_at, false)}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`chip ${
                              wishlistReadyFor
                                ? "bg-pine-100 text-pine-800"
                                : wishlist?.item_count
                                  ? "bg-gold-100 text-gold-500"
                                  : "bg-cream-100 text-muted"
                            }`}
                          >
                            {wishlistReadyFor
                              ? `Wishlist ready · ${wishlist?.item_count}`
                              : wishlist?.item_count
                                ? `Draft · ${wishlist.item_count}`
                                : row.user_id
                                  ? "No wishlist"
                                  : "Not signed in"}
                          </span>
                          <span
                            className={`chip ${
                              row.user_id
                                ? "bg-pine-100 text-pine-800"
                                : "bg-cream-100 text-muted"
                            }`}
                          >
                            {row.user_id ? "Claimed" : "Unclaimed"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {personalUrl ? (
                          <>
                            <CopyButton
                              value={personalUrl}
                              label="Copy private link"
                              copiedLabel="Private link copied!"
                              className="btn btn-secondary btn-sm"
                            />
                            <CopyButton
                              value={`Hi ${row.display_name}! You are in the ${event.name} gift exchange. Open this private link and tap "Draw my name now" to see who you are buying for: ${personalUrl}`}
                              label="Copy friendly message"
                              copiedLabel="Message copied!"
                              className="btn btn-ghost btn-sm"
                            />
                          </>
                        ) : null}
                        {!isLocked ? (
                          <>
                            <details className="rounded-lg border border-cream-200 px-3 py-1.5">
                              <summary className="cursor-pointer text-xs font-semibold text-muted hover:text-pine-800">
                                Rename
                              </summary>
                              <div className="mt-3">
                                <ActionForm
                                  action={renameMemberAction}
                                  submitLabel="Save name"
                                  pendingLabel="Saving…"
                                  className="flex flex-wrap items-end gap-2"
                                  buttonClassName="btn btn-secondary btn-sm"
                                >
                                  <input
                                    type="hidden"
                                    name="event_id"
                                    value={id}
                                  />
                                  <input
                                    type="hidden"
                                    name="member_id"
                                    value={row.id}
                                  />
                                  <input
                                    name="display_name"
                                    required
                                    maxLength={80}
                                    defaultValue={row.display_name}
                                    aria-label={`Rename ${row.display_name}`}
                                    className="field w-44"
                                  />
                                </ActionForm>
                              </div>
                            </details>
                            <ActionForm
                              action={removeMemberAction}
                              submitLabel="Remove"
                              pendingLabel="Removing…"
                              className="flex items-center"
                              buttonClassName={DANGER_BUTTON}
                              confirm={`Remove ${row.display_name} from the roster? This also disables their personal link.`}
                            >
                              <input type="hidden" name="event_id" value={id} />
                              <input
                                type="hidden"
                                name="member_id"
                                value={row.id}
                              />
                            </ActionForm>
                          </>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 rounded-xl bg-cream-100 px-4 py-3 text-sm text-muted">
                The roster is empty. Add at least two names before drawing.
              </p>
            )}

            <p className="mt-4 text-xs leading-relaxed text-muted">
              Personal links are private and need no sign-in: anyone holding one
              can start the draw and see that member&rsquo;s recipient. Claims and
              personal links survive a draw reset; roster edits are locked once
              names are drawn.
            </p>
          </section>

          <section id="exclusions" className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-semibold text-pine-950">
                  Draw exclusions
                </h2>
                <p className="text-xs text-muted">
                  Optional. Choose who must not draw whom in this exchange.
                </p>
              </div>
              {isLocked ? (
                <span className="chip bg-cream-100 text-muted">
                  Locked after the draw
                </span>
              ) : (
                <span className="chip bg-cream-100 text-muted">
                  Editable before the draw
                </span>
              )}
            </div>

            {!isLocked && members.length >= 2 ? (
              <div className="mt-4 rounded-xl border border-cream-200 bg-cream-50 p-4">
                <ActionForm
                  action={addExclusionAction}
                  submitLabel="Add exclusion"
                  pendingLabel="Saving…"
                  className="space-y-3"
                  buttonClassName="btn btn-primary btn-sm"
                  resetOnSuccess
                >
                  <input type="hidden" name="event_id" value={id} />
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
                    <div>
                      <label htmlFor="exclusion-giver" className="label">
                        This person
                      </label>
                      <select
                        id="exclusion-giver"
                        name="giver_member_id"
                        required
                        defaultValue=""
                        className="field"
                      >
                        <option value="" disabled>
                          Choose a name
                        </option>
                        {members.map((row) => (
                          <option key={row.id} value={row.id}>
                            {row.display_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="pb-2 text-center text-sm font-semibold text-muted">
                      cannot draw
                    </p>
                    <div>
                      <label htmlFor="exclusion-recipient" className="label">
                        this person
                      </label>
                      <select
                        id="exclusion-recipient"
                        name="recipient_member_id"
                        required
                        defaultValue=""
                        className="field"
                      >
                        <option value="" disabled>
                          Choose a name
                        </option>
                        {members.map((row) => (
                          <option key={row.id} value={row.id}>
                            {row.display_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <label className="flex items-start gap-3 text-sm text-pine-950">
                    <input
                      type="checkbox"
                      name="both_sides"
                      className="mt-0.5 size-4 rounded border-cream-300 text-pine-700 focus:ring-pine-600"
                    />
                    <span>
                      <span className="font-semibold">Block both ways.</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                        Also stop the other person from drawing this name. Leave
                        unchecked for a one-way exclusion.
                      </span>
                    </span>
                  </label>
                </ActionForm>
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-cream-100 px-4 py-3 text-sm text-muted">
                {isLocked
                  ? "Exclusions are locked once names are drawn."
                  : "Add at least two names to the roster before creating exclusions."}
              </p>
            )}

            {exclusions.length ? (
              <ul className="mt-4 divide-y divide-cream-200">
                {exclusions.map((exclusion) => {
                  const giver = memberName.get(exclusion.giver_member_id);
                  const recipient = memberName.get(
                    exclusion.recipient_member_id,
                  );
                  return (
                    <li
                      key={exclusion.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <p className="text-sm text-ink">
                        <span className="font-semibold">
                          {giver ?? "Unknown"}
                        </span>
                        <span className="text-muted"> cannot draw </span>
                        <span className="font-semibold">
                          {recipient ?? "Unknown"}
                        </span>
                      </p>
                      {!isLocked ? (
                        <ActionForm
                          action={removeExclusionAction}
                          submitLabel="Remove"
                          pendingLabel="Removing…"
                          className="flex items-center"
                          buttonClassName={DANGER_BUTTON}
                        >
                          <input type="hidden" name="event_id" value={id} />
                          <input
                            type="hidden"
                            name="exclusion_id"
                            value={exclusion.id}
                          />
                        </ActionForm>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm text-muted">
                No exclusions yet. Everyone can draw anyone except themselves.
              </p>
            )}

            <p className="mt-4 text-xs leading-relaxed text-muted">
              Exclusions are directional. The draw still gives everyone exactly
              one recipient. If the rules make a fair draw impossible, the app
              will ask you to remove one or add more names.
            </p>
          </section>

          <section id="announce" className="card p-6">
            <h2 className="text-xl font-semibold text-pine-950">
              Send an announcement
            </h2>
            <p className="mt-1 text-sm text-muted">
              Everyone who claimed a name receives an in-app notification. Use
              this for reminders, venue details, or a cheerful nudge about
              wishlists. Guests using personal links will not receive it.
            </p>
            <div className="mt-5">
              <ActionForm
                action={announceAction}
                submitLabel="Send announcement"
                pendingLabel="Sending…"
                className="space-y-4"
                resetOnSuccess
              >
                <input type="hidden" name="event_id" value={id} />
                <div>
                  <label htmlFor="announcement-title" className="label">
                    Title <span className="text-holly-600">*</span>
                  </label>
                  <input
                    id="announcement-title"
                    name="title"
                    required
                    maxLength={120}
                    placeholder="Wishlists are due on Friday"
                    className="field"
                  />
                </div>
                <div>
                  <label htmlFor="announcement-body" className="label">
                    Message
                  </label>
                  <textarea
                    id="announcement-body"
                    name="body"
                    rows={3}
                    maxLength={1200}
                    placeholder="A gentle reminder to publish your wishlist before the deadline."
                    className="field resize-y"
                  />
                </div>
              </ActionForm>
            </div>
          </section>

          <section id="details" className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-semibold text-pine-950">
                  Event details
                </h2>
                <p className="text-xs text-muted">
                  {isCompleted
                    ? "Completed events are preserved as history."
                    : "Changes notify everyone who claimed a name."}
                </p>
              </div>
              {isCompleted ? (
                <span className="chip bg-cream-100 text-muted">Read only</span>
              ) : null}
            </div>

            {isCompleted ? (
              <div className="mt-4 space-y-3 rounded-xl bg-cream-100 px-4 py-4 text-sm text-muted">
                <p className="whitespace-pre-line">
                  {event.description ?? "No description was added."}
                </p>
                <p>
                  Party {formatDate(event.party_date)} · Budget{" "}
                  {formatMoney(event.gift_budget, event.currency)}
                </p>
                {event.instructions ? (
                  <p className="whitespace-pre-line">{event.instructions}</p>
                ) : null}
              </div>
            ) : (
              <div className="mt-5">
                <ActionForm
                  action={updateEventAction}
                  submitLabel="Save event details"
                  pendingLabel="Saving…"
                  className="space-y-6"
                >
                  <input type="hidden" name="event_id" value={id} />

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
                      defaultValue={event.name}
                      className="field"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="label">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      maxLength={2000}
                      defaultValue={event.description ?? ""}
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
                        defaultValue={event.party_date ?? ""}
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
                          defaultValue={event.currency}
                          aria-label="Currency"
                          className="field w-24 shrink-0"
                        >
                          {CURRENCIES.map((currency) => (
                            <option key={currency} value={currency}>
                              {currency}
                            </option>
                          ))}
                        </select>
                        <input
                          id="gift_budget"
                          name="gift_budget"
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          defaultValue={event.gift_budget ?? ""}
                          className="field"
                        />
                      </div>
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
                      defaultValue={event.wishlist_deadline ?? ""}
                      className="field"
                    />
                  </div>

                  <div>
                    <label htmlFor="instructions" className="label">
                      Gift exchange notes
                    </label>
                    <textarea
                      id="instructions"
                      name="instructions"
                      rows={3}
                      maxLength={2000}
                      defaultValue={event.instructions ?? ""}
                      className="field resize-y"
                    />
                  </div>
                </ActionForm>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section id="invite" className="card p-5">
            <h2 className="text-base font-semibold text-pine-950">
              Invitation
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Share this link so guests can preview the roster and claim their
              own name. No Google sign-in? Send the person&rsquo;s private link
              from the roster below — they just open it and tap Draw.
            </p>
            <div className="mt-3 rounded-xl border border-cream-200 bg-cream-50 px-3.5 py-3">
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-muted">
                Invitation link
              </p>
              <p className="mt-1 break-all font-mono text-xs text-pine-900">
                {joinUrl}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <CopyButton value={joinUrl} label="Copy link" />
                <CopyButton
                  value={event.invite_code}
                  label={`Code: ${event.invite_code}`}
                  copiedLabel="Code copied!"
                />
              </div>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-base font-semibold text-pine-950">
              Key dates
            </h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Party</dt>
                <dd className="text-right font-semibold text-ink">
                  {formatDate(event.party_date)}
                  <span className="block text-xs font-normal text-muted">
                    {countdownLabel(event.party_date) ?? "Not set"}
                  </span>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Wishlists due</dt>
                <dd className="text-right font-semibold text-ink">
                  {formatDate(event.wishlist_deadline)}
                  <span className="block text-xs font-normal text-muted">
                    {countdownLabel(event.wishlist_deadline) ?? "No deadline"}
                  </span>
                </dd>
              </div>
            </dl>
          </section>

          <section className="card p-5">
            <h2 className="text-base font-semibold text-pine-950">
              Organizer notes
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
              <li className="flex gap-2">
                <span className="text-pine-700">•</span> You see wishlist
                progress, never who drew whom.
              </li>
              <li className="flex gap-2">
                <span className="text-pine-700">•</span> The draw includes every
                name on the roster, claimed or not.
              </li>
              <li className="flex gap-2">
                <span className="text-pine-700">•</span> Roster edits are locked
                after the draw; reset to edit again.
              </li>
              <li className="flex gap-2">
                <span className="text-pine-700">•</span> Personal links need no
                sign-in and include a Draw button, so less tech-savvy guests can
                join in one tap.
              </li>
            </ul>
          </section>

          <section className="card p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-pine-950">
                Recent activity
              </h2>
              <span className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-muted">
                Organizer only
              </span>
            </div>
            {audit.length ? (
              <ul className="mt-3 space-y-3">
                {audit.map((entry) => {
                  const detail = auditDetail(entry.details);
                  return (
                    <li key={entry.id} className="flex gap-2.5">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-pine-600" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">
                          {auditLabels[entry.action] ?? entry.action}
                        </p>
                        <p className="text-xs text-muted">
                          {relativeTime(entry.created_at)}
                          {detail ? ` · ${detail}` : ""}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">
                Draws and announcements will appear here.
              </p>
            )}
          </section>

          <div className="rounded-2xl bg-cream-100 p-5">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted">
              A fair draw
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Every name on the roster gets exactly one recipient, nobody draws
              themselves, no recipient is assigned twice, and any draw
              exclusions you set are respected. The database does the work
              inside a transaction, so double clicks can never break it.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function ManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="container-page py-14">
          <div className="h-10 w-80 animate-pulse rounded-full bg-cream-200" />
          <div className="mt-4 h-5 w-96 animate-pulse rounded-full bg-cream-200" />
          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_21rem]">
            <div className="h-96 animate-pulse rounded-2xl bg-cream-200/70" />
            <div className="h-64 animate-pulse rounded-2xl bg-cream-200/70" />
          </div>
        </div>
      }
    >
      <ManageContent params={params} />
    </Suspense>
  );
}

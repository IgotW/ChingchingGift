import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EmptyState } from "@/components/empty-state";
import { SignedInDraw } from "@/components/signed-in-draw";
import { StatusChip } from "@/components/status-chip";
import { revealMyAssignmentAction } from "@/lib/actions/events";
import { requireProfile } from "@/lib/auth";
import { getEvent, getEventForMember, getMyAssignment } from "@/lib/data";

export const metadata: Metadata = {
  title: "My assignment",
};

async function DrawContent({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ claimed?: string | string[] }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const session = await requireProfile(`/events/${id}/draw`);

  const context = await getEventForMember(id);
  if (!context) {
    const event = await getEvent(id);
    if (!event) notFound();
    return (
      <div className="container-page max-w-3xl py-10 lg:py-14">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-muted hover:text-pine-800"
        >
          ← Dashboard
        </Link>
        <div className="mt-6">
          <EmptyState
            icon="gift"
            title="Join from the public link to draw"
            body="This exchange uses a shared public link. Open it, choose your own name from the roster, and draw once to see your recipient. If you are signed in, your name will be linked to your account when possible."
            action={
              <Link href={`/join/${event.invite_code}`} className="btn btn-primary">
                Open public draw link
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const { event, member } = context;
  const assignment = await getMyAssignment(id);
  const justClaimed = query.claimed === "1";

  if (!assignment) {
    return (
      <div className="container-page max-w-3xl py-10 lg:py-14">
        <Link
          href={`/events/${id}`}
          className="text-sm font-semibold text-muted hover:text-pine-800"
        >
          ← {event.name}
        </Link>

        {justClaimed ? (
          <div className="mt-5 rounded-2xl border border-pine-600/20 bg-pine-100/70 px-4 py-3 text-sm font-medium text-pine-900">
            You are in as {member?.display_name}. Draw once to see your Secret
            Santa recipient.
          </div>
        ) : null}

        <div className="mt-6">
          <EmptyState
            icon="gift"
            title={member ? "Ready when you are" : "No assignment yet"}
            body={
              member
                ? "Use the shared public draw link to choose your name and reveal your recipient once. The result is shown only once and cannot be viewed again."
                : "You do not have a roster membership in this exchange. Ask the organizer for the shared public link."
            }
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link
                  href={`/join/${event.invite_code}`}
                  className="btn btn-primary"
                >
                  Open public draw link
                </Link>
                <Link href={`/events/${id}`} className="btn btn-secondary">
                  Back to event
                </Link>
              </div>
            }
          />
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted">
          For privacy, each person draws once and the revealed name is shown only
          once — not even to the organizer.
        </p>
      </div>
    );
  }

  if (assignment.revealed) {
    return (
      <div className="container-page max-w-3xl py-10 lg:py-14">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/events/${id}`}
            className="text-sm font-semibold text-muted hover:text-pine-800"
          >
            ← {event.name}
          </Link>
          <div className="flex items-center gap-2">
            <StatusChip status={event.status} />
            <span className="chip bg-cream-100 text-muted">
              Signed in as {session.profile.full_name.split(" ")[0]}
            </span>
          </div>
        </div>

        <div className="mt-6">
          <EmptyState
            icon="gift"
            title="Your draw was already revealed"
            body="For privacy, your Secret Santa recipient was shown only once and cannot be displayed again — not even to the organizer. If you saved a screenshot or note, use that to remember who you drew."
            action={
              <Link href={`/events/${id}`} className="btn btn-secondary">
                Back to the event
              </Link>
            }
          />
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted">
          This protects the surprise and keeps the exchange fair for everyone.
        </p>
      </div>
    );
  }

  return (
    <div className="container-page max-w-3xl py-10 lg:py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/events/${id}`}
          className="text-sm font-semibold text-muted hover:text-pine-800"
        >
          ← {event.name}
        </Link>
        <div className="flex items-center gap-2">
          <StatusChip status={event.status} />
          <span className="chip bg-cream-100 text-muted">
            Signed in as {session.profile.full_name.split(" ")[0]}
          </span>
        </div>
      </div>

      <div className="mt-6">
        <SignedInDraw
          action={revealMyAssignmentAction}
          eventId={id}
          memberName={member?.display_name ?? session.profile.full_name}
        />
      </div>
    </div>
  );
}

export default function DrawPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ claimed?: string | string[] }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="container-page max-w-3xl py-14">
          <div className="h-10 w-72 animate-pulse rounded-full bg-cream-200" />
          <div className="mt-6 h-80 animate-pulse rounded-3xl bg-cream-200/70" />
        </div>
      }
    >
      <DrawContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

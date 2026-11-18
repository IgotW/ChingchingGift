import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { EmptyState } from "@/components/empty-state";
import { StatusChip } from "@/components/status-chip";
import { requireProfile } from "@/lib/auth";
import { getEvent, getEventForMember, getMyAssignment } from "@/lib/data";

export const metadata: Metadata = {
  title: "My recipient",
};

async function RecipientContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireProfile(`/events/${id}/recipient`);

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
            title="Recipient details are shown once"
            body="This exchange uses a shared public link for one-time draws. If you need to draw, open the public link and choose your name."
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

  const { event } = context;
  const assignment = await getMyAssignment(id);

  if (!assignment) {
    return (
      <div className="container-page max-w-3xl py-10 lg:py-14">
        <Link
          href={`/events/${id}`}
          className="text-sm font-semibold text-muted hover:text-pine-800"
        >
          ← {event.name}
        </Link>
        <div className="mt-6">
          <EmptyState
            icon="gift"
            title="No recipient to show yet"
            body="Draw once from the shared public link to see who you are buying for. For privacy, the result is shown only once and cannot be viewed again later."
            action={
              <Link href={`/join/${event.invite_code}`} className="btn btn-primary">
                Open public draw link
              </Link>
            }
          />
        </div>
        <div className="mt-8 flex justify-center">
          <StatusChip status={event.status} />
        </div>
      </div>
    );
  }

  if (!assignment.revealed) {
    return (
      <div className="container-page max-w-3xl py-10 lg:py-14">
        <Link
          href={`/events/${id}`}
          className="text-sm font-semibold text-muted hover:text-pine-800"
        >
          ← {event.name}
        </Link>
        <div className="mt-6">
          <EmptyState
            icon="gift"
            title="Your recipient is ready to reveal once"
            body="Go to your draw page to reveal who you are buying for. The result is shown only once, so take a screenshot or write it down."
            action={
              <Link href={`/events/${id}/draw`} className="btn btn-primary">
                Go to draw page
              </Link>
            }
          />
        </div>
        <div className="mt-8 flex justify-center">
          <StatusChip status={event.status} />
        </div>
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
        <StatusChip status={event.status} />
      </div>

      <div className="mt-6">
        <EmptyState
          icon="gift"
          title="Recipient details were shown once"
          body="For privacy and fairness, your Secret Santa recipient (and their wishlist at reveal time) was shown only once and cannot be displayed again — not even to the organizer. Please use the screenshot or note you saved."
          action={
            <Link href={`/events/${id}`} className="btn btn-secondary">
              Back to the event
            </Link>
          }
        />
      </div>

      {event.instructions ? (
        <div className="card mt-6 p-5">
          <h2 className="text-base font-semibold text-pine-950">Exchange notes</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted">
            {event.instructions}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default function RecipientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="container-page max-w-4xl py-14">
          <div className="h-10 w-72 animate-pulse rounded-full bg-cream-200" />
          <div className="mt-6 h-52 animate-pulse rounded-3xl bg-cream-200/70" />
          <div className="mt-6 h-64 animate-pulse rounded-2xl bg-cream-200/70" />
        </div>
      }
    >
      <RecipientContent params={params} />
    </Suspense>
  );
}

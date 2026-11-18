import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { EmptyState } from "@/components/empty-state";
import { getMemberView } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = {
  title: "Use the shared public link",
  robots: { index: false, follow: false },
};

async function ClaimContent({ token }: { token: string }) {
  if (!isSupabaseConfigured()) redirect("/setup");

  // Validate token existence to avoid leaking details, but never reveal secrets.
  const view = await getMemberView(token);
  const eventName = view?.event_name;

  return (
    <div className="container-page max-w-2xl py-14">
      <Link
        href="/"
        className="text-sm font-semibold text-muted hover:text-pine-800"
      >
        ← ChingChingGift
      </Link>
      <div className="mt-6">
        <EmptyState
          icon="gift"
          title="Personal links are no longer used"
          body={
            eventName
              ? `${eventName} now uses one shared public draw link. Open it, choose your own name from the roster, and draw once. Your result is shown only once and cannot be viewed again.`
              : "This exchange now uses one shared public draw link. Ask the organizer for the public link, then choose your own name from the roster and draw once. Results are shown only once and cannot be viewed again."
          }
          action={
            <Link href="/" className="btn btn-secondary">
              Back home
            </Link>
          }
        />
      </div>
      <p className="mt-6 text-center text-xs leading-relaxed text-muted">
        For privacy and fairness, recipients are revealed once per person and are
        never visible to the organizer.
      </p>
    </div>
  );
}

export default function ClaimPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="container-page max-w-3xl py-14">
          <div className="h-6 w-44 animate-pulse rounded-full bg-cream-200" />
          <div className="mt-6 h-72 animate-pulse rounded-3xl bg-cream-200/70" />
        </div>
      }
    >
      <ClaimContentWrapper params={params} />
    </Suspense>
  );
}

async function ClaimContentWrapper({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!token) notFound();
  return <ClaimContent token={token} />;
}

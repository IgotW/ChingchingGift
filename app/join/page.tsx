import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ActionForm } from "@/components/action-form";
import { lookupCodeAction } from "@/lib/actions/events";

export const metadata: Metadata = {
  title: "Join an exchange",
};

async function JoinContent({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[] }>;
}) {
  const query = await searchParams;
  const code = typeof query.code === "string" ? query.code : "";

  return (
    <div className="container-page max-w-3xl py-10 lg:py-14">
      <Link
        href="/"
        className="text-sm font-semibold text-muted hover:text-pine-800"
      >
        ← Home
      </Link>

      <div className="mt-5">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-holly-600">
          Shared public link
        </p>
        <h1 className="mt-2 font-display text-4xl text-pine-950 sm:text-5xl">
          Open your exchange
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          Enter the invitation code from your host to open the shared draw link.
          You will choose your own name from the roster and draw once — no sign-in
          required.
        </p>
      </div>

      <div className="card mt-8 p-6 sm:p-8">
        <ActionForm
          action={lookupCodeAction}
          submitLabel="Open draw link"
          pendingLabel="Opening…"
          className="space-y-5"
        >
          <div>
            <label htmlFor="join-code" className="label">
              Invitation code <span className="text-holly-600">*</span>
            </label>
            <input
              id="join-code"
              name="code"
              required
              maxLength={40}
              autoComplete="off"
              defaultValue={code}
              placeholder="e.g. A1B2C3D4"
              className="field font-mono uppercase tracking-[0.2em]"
            />
            <p className="mt-2 text-xs text-muted">
              Codes are not case-sensitive. Ask your host for the shared public
              link if you do not have one.
            </p>
          </div>

          <div className="rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm leading-relaxed text-muted">
            <strong className="font-semibold text-pine-950">
              What happens next:
            </strong>{" "}
            open the public link, select your own name (e.g. Juan, Pedro, Gio),
            and draw once. Your recipient is shown only once — take a screenshot
            or write it down. No one, including the organizer, can see it again.
          </div>
        </ActionForm>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          ["No sign-in required", "Anyone with the shared public link can draw by choosing their name."],
          ["Draw once", "Each name can be drawn only once to keep it fair."],
          ["Shown once only", "Save your result immediately. It cannot be viewed again."],
        ].map(([title, body]) => (
          <div key={title} className="card-muted px-4 py-4">
            <p className="text-sm font-semibold text-pine-950">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        Hosting instead?{" "}
        <Link href="/events/new" className="link">
          Create your own exchange
        </Link>
      </p>
    </div>
  );
}

export default function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[] }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="container-page max-w-3xl py-14">
          <div className="h-10 w-80 animate-pulse rounded-full bg-cream-200" />
          <div className="mt-4 h-4 w-96 animate-pulse rounded-full bg-cream-200" />
          <div className="mt-8 h-64 animate-pulse rounded-2xl bg-cream-200/70" />
        </div>
      }
    >
      <JoinContent searchParams={searchParams} />
    </Suspense>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ActionForm } from "@/components/action-form";
import { Avatar } from "@/components/avatar";
import { updateProfileAction } from "@/lib/actions/account";
import { requireProfile } from "@/lib/auth";
import { getDashboardEvents } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Your profile",
};

async function ProfileContent() {
  const { user, profile } = await requireProfile("/profile");
  const events = await getDashboardEvents();

  const active = events.filter((event) => event.status !== "completed").length;
  const organizing = events.filter((event) => event.is_organizer).length;

  return (
    <div className="container-page max-w-4xl py-10 lg:py-14">
      <Link
        href="/dashboard"
        className="text-sm font-semibold text-muted hover:text-pine-800"
      >
        ← Dashboard
      </Link>

      <div className="mt-5">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-holly-600">
          Your account
        </p>
        <h1 className="mt-2 font-display text-4xl text-pine-950 sm:text-5xl">
          Profile
        </h1>
        <p className="mt-2 max-w-xl text-muted">
          This is the name and photo your organizers and Secret Santa will see.
          Your email stays private.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <section className="card overflow-hidden">
            <div className="bg-pine-950 px-6 py-7 text-cream-50">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar
                  name={profile.full_name}
                  src={profile.avatar_url}
                  size="xl"
                  className="ring-4 ring-pine-900"
                />
                <div className="min-w-0">
                  <h2 className="font-display text-3xl leading-tight">
                    {profile.full_name}
                  </h2>
                  <p className="mt-1 truncate text-sm text-cream-200/80">
                    {user.email ?? "Signed in with Google"}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-pine-800 px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-cream-100">
                    <span className="size-1.5 rounded-full bg-gold-400" />
                    Verified with Google
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-7">
              <h2 className="text-xl font-semibold text-pine-950">
                Display name
              </h2>
              <p className="mt-1 text-sm text-muted">
                Use the name your friends will recognise. You can change it
                whenever you like.
              </p>
              <div className="mt-5">
                <ActionForm
                  action={updateProfileAction}
                  submitLabel="Save name"
                  pendingLabel="Saving…"
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor="full_name" className="label">
                      Full name <span className="text-holly-600">*</span>
                    </label>
                    <input
                      id="full_name"
                      name="full_name"
                      required
                      minLength={2}
                      maxLength={80}
                      autoComplete="name"
                      defaultValue={profile.full_name}
                      className="field"
                    />
                  </div>
                </ActionForm>
              </div>
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-xl font-semibold text-pine-950">
              How your account works
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
              <li className="flex gap-2">
                <span className="text-pine-700">•</span> Sign-in is handled by
                Google. ChingChingGift never sees or stores a password.
              </li>
              <li className="flex gap-2">
                <span className="text-pine-700">•</span> Your verified email is
                used only for account access and optional exchange emails.
              </li>
              <li className="flex gap-2">
                <span className="text-pine-700">•</span> Your wishlist is visible
                only to you and the one person assigned to you.
              </li>
              <li className="flex gap-2">
                <span className="text-pine-700">•</span> Your Secret Santa
                assignment stays private — even from organizers.
              </li>
            </ul>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="card p-5">
            <h2 className="text-base font-semibold text-pine-950">
              At a glance
            </h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Active exchanges</dt>
                <dd className="font-semibold text-ink">{active}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Organizing</dt>
                <dd className="font-semibold text-ink">{organizing}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Member since</dt>
                <dd className="font-semibold text-ink">
                  {formatDate(profile.created_at)}
                </dd>
              </div>
            </dl>
            <Link href="/dashboard" className="btn btn-secondary btn-sm mt-4">
              Go to dashboard
            </Link>
          </section>

          <section className="card p-5">
            <h2 className="text-base font-semibold text-pine-950">
              Notifications
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              Draw alerts, wishlist nudges, and organizer announcements appear
              in your inbox.
            </p>
            <Link href="/notifications" className="btn btn-secondary btn-sm mt-4">
              Open notifications
            </Link>
          </section>

          <section className="card p-5">
            <h2 className="text-base font-semibold text-pine-950">Sign out</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">
              You can sign back in with the same Google account at any time.
            </p>
            <form action="/auth/signout" method="post" className="mt-4">
              <button
                type="submit"
                className="btn btn-sm border border-holly-600/30 bg-transparent text-holly-700 hover:bg-holly-100"
              >
                Sign out
              </button>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="container-page max-w-4xl py-14">
          <div className="h-10 w-64 animate-pulse rounded-full bg-cream-200" />
          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_20rem]">
            <div className="h-80 animate-pulse rounded-2xl bg-cream-200/70" />
            <div className="h-56 animate-pulse rounded-2xl bg-cream-200/70" />
          </div>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}

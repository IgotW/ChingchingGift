import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "./avatar";
import { Logo } from "./logo";
import { getCurrentProfile } from "@/lib/auth";
import { getUnreadCount } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

function HeaderSkeleton() {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-20 animate-pulse rounded-full bg-cream-200" />
      <div className="size-8 animate-pulse rounded-full bg-cream-200" />
    </div>
  );
}

async function SignedInNav() {
  const session = await getCurrentProfile();
  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="btn btn-pine btn-sm">
          Sign in
        </Link>
      </div>
    );
  }

  const unread = await getUnreadCount();

  return (
    <nav className="flex items-center gap-1 sm:gap-2" aria-label="Account">
      <Link
        href="/dashboard"
        className="hidden rounded-full px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-cream-100 sm:block"
      >
        Dashboard
      </Link>
      <Link
        href="/notifications"
        className="relative grid size-10 place-items-center rounded-full text-ink transition-colors hover:bg-cream-100"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      >
        <BellIcon />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-holly-600 px-1 text-[0.62rem] font-bold leading-5 text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Link>
      <Link
        href="/profile"
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-1 transition-colors hover:bg-cream-100"
        aria-label="Your profile"
      >
        <Avatar
          name={session.profile.full_name}
          src={session.profile.avatar_url}
          size="sm"
        />
        <span className="hidden max-w-32 truncate pr-2 text-sm font-semibold text-ink md:block">
          {session.profile.full_name.split(" ")[0]}
        </span>
      </Link>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="rounded-full px-2 py-2 text-xs font-semibold uppercase tracking-wide text-muted transition-colors hover:text-holly-600 sm:px-3"
        >
          Sign out
        </button>
      </form>
    </nav>
  );
}

function HeaderShell({ children }: { children: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-cream-200/80 bg-cream-50/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />
        {children}
      </div>
    </header>
  );
}

export function SiteHeader() {
  if (!isSupabaseConfigured()) {
    return (
      <HeaderShell>
        <Link href="/setup" className="btn btn-secondary btn-sm">
          Finish setup
        </Link>
      </HeaderShell>
    );
  }

  return (
    <HeaderShell>
      <Suspense fallback={<HeaderSkeleton />}>
        <SignedInNav />
      </Suspense>
    </HeaderShell>
  );
}

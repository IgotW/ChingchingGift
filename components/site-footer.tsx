import Link from "next/link";
import { Logo } from "./logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-cream-200 bg-cream-100/60">
      <div className="container-page flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            Fair draws, private wishlists, and a little more sparkle in your
            Christmas exchange.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-muted">
          <Link href="/" className="hover:text-pine-800">
            Home
          </Link>
          <Link href="/dashboard" className="hover:text-pine-800">
            Dashboard
          </Link>
          <Link href="/notifications" className="hover:text-pine-800">
            Notifications
          </Link>
          <Link href="/setup" className="hover:text-pine-800">
            Setup
          </Link>
        </nav>
      </div>
      <div className="container-page border-t border-cream-200 py-5 text-xs text-muted">
        © ChingChingGift. Names stay secret, gifts stay thoughtful.
      </div>
    </footer>
  );
}

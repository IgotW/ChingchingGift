import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2.5"
      aria-label="ChingChingGift home"
    >
      <span className="relative grid size-9 place-items-center rounded-xl bg-pine-900 text-gold-400 shadow-sm transition-transform group-hover:-rotate-3">
        <svg
          viewBox="0 0 24 24"
          className="size-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="3.5" y="9" width="17" height="11.5" rx="1.6" />
          <path d="M2.5 9h19v3.5h-19z" />
          <path d="M12 9v11.5" />
          <path d="M12 9c-2.6 0-4.6-1.4-4.6-3.2C7.4 4.2 8.4 3.3 9.7 3.3c1.9 0 2.3 2.4 2.3 5.7Z" />
          <path d="M12 9c2.6 0 4.6-1.4 4.6-3.2 0-1.6-1-2.5-2.3-2.5-1.9 0-2.3 2.4-2.3 5.7Z" />
        </svg>
        <span className="absolute -right-1 -top-1 size-2 rounded-full bg-holly-500" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.15rem] font-semibold tracking-tight text-pine-950">
          ChingChingGift
        </span>
        <span className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-muted">
          Secret Santa, sorted
        </span>
      </span>
    </Link>
  );
}

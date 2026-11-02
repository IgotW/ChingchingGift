import type { ReactNode } from "react";

export function EmptyState({
  title,
  body,
  action,
  icon = "gift",
}: {
  title: string;
  body: string;
  action?: ReactNode;
  icon?: "gift" | "bell" | "users" | "list";
}) {
  return (
    <div className="card-muted flex flex-col items-center px-6 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-white text-pine-700 shadow-sm">
        <svg
          viewBox="0 0 24 24"
          className="size-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {icon === "gift" ? (
            <>
              <rect x="3.5" y="9" width="17" height="11.5" rx="1.6" />
              <path d="M2.5 9h19v3.5h-19zM12 9v11.5" />
              <path d="M12 9c-2.6 0-4.6-1.4-4.6-3.2C7.4 4.2 8.4 3.3 9.7 3.3c1.9 0 2.3 2.4 2.3 5.7Z" />
              <path d="M12 9c2.6 0 4.6-1.4 4.6-3.2 0-1.6-1-2.5-2.3-2.5-1.9 0-2.3 2.4-2.3 5.7Z" />
            </>
          ) : null}
          {icon === "bell" ? (
            <>
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </>
          ) : null}
          {icon === "users" ? (
            <>
              <circle cx="9" cy="8" r="3.2" />
              <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
              <path d="M16 4.8a3.2 3.2 0 0 1 0 6.4M17.5 14.4a5.5 5.5 0 0 1 3 5.6" />
            </>
          ) : null}
          {icon === "list" ? (
            <>
              <path d="M5 5h14v14H5z" />
              <path d="M8.5 9h7M8.5 12h7M8.5 15h4" />
            </>
          ) : null}
        </svg>
      </span>
      <h2 className="mt-4 text-lg font-semibold text-pine-950">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

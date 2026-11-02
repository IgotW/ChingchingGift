import { formatMoney, safeExternalUrl } from "@/lib/format";
import type { WishlistItem } from "@/lib/types";

const priorityMeta: Record<number, { label: string; tone: string }> = {
  1: { label: "Top of their list", tone: "bg-holly-100 text-holly-700" },
  2: { label: "Would love it", tone: "bg-gold-100 text-gold-500" },
  3: { label: "Nice to have", tone: "bg-cream-100 text-muted" },
};

export function WishlistItemCard({
  item,
  currency,
  ownerLabel = "their",
}: {
  item: WishlistItem;
  currency: string;
  ownerLabel?: string;
}) {
  const priority = priorityMeta[item.priority] ?? priorityMeta[2];
  const url = safeExternalUrl(item.product_url);

  return (
    <li className="rounded-2xl border border-cream-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className={`chip ${priority.tone}`}>{priority.label}</span>
          <h3 className="mt-2 font-display text-xl text-pine-950">
            {item.title}
          </h3>
        </div>
        {item.price !== null ? (
          <span className="rounded-full bg-cream-100 px-3 py-1 text-xs font-semibold text-muted">
            ≈ {formatMoney(item.price, currency)}
          </span>
        ) : null}
      </div>

      {item.details ? (
        <p className="mt-2 text-sm leading-relaxed text-muted">{item.details}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
        {item.color ? (
          <span className="rounded-full bg-cream-50 px-2.5 py-1 ring-1 ring-cream-200">
            Colour: {item.color}
          </span>
        ) : null}
        {item.size ? (
          <span className="rounded-full bg-cream-50 px-2.5 py-1 ring-1 ring-cream-200">
            Size: {item.size}
          </span>
        ) : null}
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer noopener"
            className="rounded-full bg-pine-100 px-2.5 py-1 font-semibold text-pine-800 hover:bg-pine-100/70"
          >
            Shop link ↗
          </a>
        ) : null}
      </div>

      {item.notes ? (
        <p className="mt-3 rounded-xl bg-cream-100 px-3 py-2 text-xs leading-relaxed text-muted">
          <span className="font-semibold text-ink">
            {ownerLabel === "my" ? "My" : "Their"} note:
          </span>{" "}
          {item.notes}
        </p>
      ) : null}
    </li>
  );
}

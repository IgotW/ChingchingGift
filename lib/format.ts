import type { EventStatus } from "./types";

export function formatDate(value: string | null | undefined, withYear = true) {
  if (!value) return "Not set";
  // Dates are stored as YYYY-MM-DD; parse as local noon to avoid timezone slips.
  const date = value.length === 10 ? new Date(`${value}T12:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: withYear ? "numeric" : undefined,
  }).format(date);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatMoney(
  amount: number | string | null | undefined,
  currency = "USD",
) {
  if (amount === null || amount === undefined || amount === "") return "No budget set";
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(value)) return "No budget set";
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function relativeTime(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diff = date.getTime() - Date.now();
  const abs = Math.abs(diff);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 365 * 24 * 3600 * 1000],
    ["month", 30 * 24 * 3600 * 1000],
    ["week", 7 * 24 * 3600 * 1000],
    ["day", 24 * 3600 * 1000],
    ["hour", 3600 * 1000],
    ["minute", 60 * 1000],
  ];
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, ms] of units) {
    if (abs >= ms) return formatter.format(Math.round(diff / ms), unit);
  }
  return "just now";
}

export function daysUntil(value: string | null | undefined): number | null {
  if (!value) return null;
  const target = new Date(`${value}T23:59:59`);
  if (Number.isNaN(target.getTime())) return null;
  const diff = target.getTime() - Date.now();
  return Math.ceil(diff / (24 * 3600 * 1000));
}

export function countdownLabel(value: string | null | undefined): string | null {
  const days = daysUntil(value);
  if (days === null) return null;
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

export const eventStatusMeta: Record<
  EventStatus,
  { label: string; tone: string; description: string }
> = {
  upcoming: {
    label: "Roster open",
    tone: "bg-emerald-100 text-emerald-900 ring-emerald-200",
    description:
      "Guests can claim their names. The organizer can draw whenever the list is ready.",
  },
  registration_closed: {
    label: "Roster locked",
    tone: "bg-amber-100 text-amber-900 ring-amber-200",
    description: "The roster is locked and ready for the draw.",
  },
  drawn: {
    label: "Names drawn",
    tone: "bg-rose-100 text-rose-900 ring-rose-200",
    description: "Assignments are secret and final. Happy gifting!",
  },
  completed: {
    label: "Completed",
    tone: "bg-stone-200 text-stone-700 ring-stone-300",
    description: "This exchange is wrapped up and preserved as history.",
  },
};

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

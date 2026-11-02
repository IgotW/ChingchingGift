export function text(
  formData: FormData,
  key: string,
  { max = 500, required = false }: { max?: number; required?: boolean } = {},
): string | null {
  const raw = formData.get(key);
  if (typeof raw !== "string") return required ? "" : null;
  const value = raw.trim();
  if (!value) return required ? "" : null;
  return value.slice(0, max);
}

export function numberValue(
  formData: FormData,
  key: string,
  { min = 0, max = 1_000_000 }: { min?: number; max?: number } = {},
): number | null {
  const raw = formData.get(key);
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) return null;
  return Math.round(value * 100) / 100;
}

export function dateValue(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  if (typeof raw !== "string" || !raw.trim()) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const date = new Date(`${raw}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : raw;
}

export function booleanValue(formData: FormData, key: string): boolean {
  const raw = formData.get(key);
  return raw === "on" || raw === "true" || raw === "1";
}

export function safeInternalPath(
  value: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;

  // Decode once to catch encoded protocol-relative paths such as /%2F%2Fevil.
  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return fallback;
  }

  if (
    decoded.startsWith("//") ||
    decoded.includes("\\") ||
    /[\u0000-\u001f]/.test(decoded)
  ) {
    return fallback;
  }

  return value;
}

export function friendlyError(
  error: { message?: string } | null | undefined,
  fallback = "Something went wrong. Please try again.",
): string {
  const message = error?.message?.trim().replace(/^P0001:\s*/, "");
  if (!message) return fallback;

  const known: [RegExp, string][] = [
    [/duplicate key.*invite_code/i, "Could not create a unique invite code. Please try again."],
    [/event_members_name_unique|duplicate key.*display_name/i, "That name is already on the list. Use a different spelling or add a last initial."],
    [/already been claimed/i, "That name has already been claimed. Pick another."],
    [/already claimed a name/i, "You already claimed a name in this exchange."],
    [/no longer on the list/i, "That name is no longer on the list. Refresh the page to see the latest roster."],
    [/locked after the draw|roster is locked/i, "The roster is locked after the draw. Reset the draw to make changes."],
    [/duplicate key/i, "That has already been done."],
    [/assignments_no_self/i, "A draw cannot assign someone to themselves."],
    [/at least two names|at least two/i, "Add at least two names before drawing."],
    [/already final/i, "This draw is already final."],
    [/complete\.|already completed|is already completed/i, "This exchange is complete and can no longer be changed."],
    [/deadline.*passed/i, "The deadline for this event has passed."],
    [/permission denied|row-level security/i, "You do not have permission to do that."],
    [/invalid input syntax/i, "One of the values is not valid."],
    [/please sign in/i, "Please sign in to continue."],
    [/event not found/i, "That exchange could not be found."],
    [/only the organizer or a claimed member/i, "Only the organizer or a claimed member can start the draw."],
    [/private link is not valid/i, "That private link is not valid."],
    [/only the organizer can reset/i, "Only the organizer can reset the draw."],
    [/completed exchanges cannot be reset/i, "Completed exchanges cannot be reset."],
    [/no final draw to reset/i, "There is no final draw to reset."],
    [/type the event name exactly/i, "Type the event name exactly to confirm the reset."],
    [/only the organizer can send announcements/i, "Only the organizer can send announcements."],
    [/give your announcement a title/i, "Give your announcement a title."],
    [/only the organizer can update/i, "Only the organizer can update this event."],
    [/not part of this event/i, "You are not part of this event."],
    [/wishlists are read-only/i, "This exchange is complete. Wishlists are read-only."],
    [/only the organizer can see wishlist progress/i, "Only the organizer can see wishlist progress."],
  ];

  for (const [pattern, replacement] of known) {
    if (pattern.test(message)) return replacement;
  }

  // Never echo raw Postgres/PostgREST text to the browser. Unexpected database
  // errors can contain table names, constraint details, or row values.
  return fallback;
}

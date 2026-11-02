"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "../auth";
import { createServerSupabase } from "../supabase/server";
import { friendlyError, text } from "../validation";
import type { ActionState, EventRecord } from "../types";

const CURRENCIES = ["USD", "EUR", "GBP", "PHP", "AUD", "CAD", "SGD"];

function readEventForm(formData: FormData) {
  const name = text(formData, "name", { max: 120, required: true });
  const description = text(formData, "description", { max: 2000 });
  const partyDate = text(formData, "party_date", { max: 10 });
  const wishlistDeadline = text(formData, "wishlist_deadline", { max: 10 });
  const instructions = text(formData, "instructions", { max: 2000 });
  const currencyRaw = text(formData, "currency", { max: 3 }) ?? "USD";
  const currency = CURRENCIES.includes(currencyRaw) ? currencyRaw : "USD";
  const budgetRaw = formData.get("gift_budget");
  const budgetString = typeof budgetRaw === "string" ? budgetRaw.trim() : "";

  if (!name || name.length < 2) {
    return { error: "Give your event a name (at least 2 characters)." } as const;
  }
  if (!partyDate) {
    return { error: "Choose the date of your Christmas party." } as const;
  }
  if (budgetString) {
    const value = Number(budgetString);
    if (!Number.isFinite(value) || value < 0) {
      return { error: "The gift budget must be a positive amount." } as const;
    }
  }
  if (wishlistDeadline && partyDate && wishlistDeadline > partyDate) {
    return {
      error: "The wishlist deadline should be on or before the party date.",
    } as const;
  }

  return {
    values: {
      name,
      description,
      party_date: partyDate,
      wishlist_deadline: wishlistDeadline,
      instructions,
      currency,
      gift_budget:
        budgetString && Number.isFinite(Number(budgetString))
          ? Math.round(Number(budgetString) * 100) / 100
          : null,
    },
  } as const;
}

/** One name per line, trimmed, de-duplicated case-insensitively. */
function parseRosterNames(raw: string | null): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const names: string[] = [];

  for (const line of raw.split(/\r?\n/)) {
    const name = line.trim().replace(/\s+/g, " ").slice(0, 80);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
    if (names.length >= 100) break;
  }

  return names;
}

export async function createEventAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireProfile("/events/new");
  const parsed = readEventForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const includeOrganizer = formData.get("include_organizer") !== null;
  const organizerName =
    text(formData, "organizer_name", { max: 80 }) ??
    session.profile.full_name.trim().slice(0, 80);
  const others = parseRosterNames(text(formData, "members", { max: 8000 }));

  const roster: { name: string; userId: string | null }[] = [];
  if (includeOrganizer) {
    roster.push({
      name: organizerName || session.profile.full_name.slice(0, 80),
      userId: session.user.id,
    });
  }
  for (const name of others) {
    if (roster.some((row) => row.name.toLowerCase() === name.toLowerCase())) {
      continue;
    }
    roster.push({ name, userId: null });
  }

  if (roster.length < 2) {
    return {
      error:
        "Add at least two names to the roster — including yourself if you are taking part.",
    };
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("events")
    .insert({ ...parsed.values, organizer_id: session.user.id })
    .select("id")
    .single<Pick<EventRecord, "id">>();

  if (error || !data) {
    return { error: friendlyError(error, "Could not create the event.") };
  }

  const { error: rosterError } = await supabase.from("event_members").insert(
    roster.map((row) => ({
      event_id: data.id,
      display_name: row.name,
      user_id: row.userId,
      claimed_at: row.userId ? new Date().toISOString() : null,
    })),
  );

  if (rosterError) {
    await supabase.from("events").delete().eq("id", data.id);
    return {
      error: friendlyError(
        rosterError,
        "The event was created but the roster could not be saved. Please try again.",
      ),
    };
  }

  revalidatePath("/dashboard");
  redirect(`/events/${data.id}/manage?created=1`);
}

export async function updateEventAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const eventId = text(formData, "event_id", { required: true });
  if (!eventId) return { error: "Missing event." };

  const session = await requireProfile(`/events/${eventId}/manage`);
  const parsed = readEventForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createServerSupabase();
  const { data: event } = await supabase
    .from("events")
    .select("id, organizer_id, status, name")
    .eq("id", eventId)
    .maybeSingle<Pick<EventRecord, "id" | "organizer_id" | "status" | "name">>();

  if (!event || event.organizer_id !== session.user.id) {
    return { error: "Only the organizer can edit this event." };
  }
  if (event.status === "completed") {
    return { error: "Completed events are history and can no longer be edited." };
  }

  const { error } = await supabase
    .from("events")
    .update(parsed.values)
    .eq("id", eventId);

  if (error) return { error: friendlyError(error, "Could not save the event.") };

  await supabase.rpc("notify_event_update", {
    p_event_id: eventId,
    p_title: `${parsed.values.name} has new details. Take a look.`,
  });

  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/${eventId}/manage`);
  revalidatePath("/dashboard");
  return { success: "Event details saved." };
}

async function editableRosterEvent(eventId: string, userId: string) {
  const supabase = await createServerSupabase();
  const { data: event } = await supabase
    .from("events")
    .select("id, organizer_id, status, name")
    .eq("id", eventId)
    .maybeSingle<Pick<EventRecord, "id" | "organizer_id" | "status" | "name">>();

  if (!event || event.organizer_id !== userId) {
    return { error: "Only the organizer can edit the roster." } as const;
  }
  if (event.status === "drawn" || event.status === "completed") {
    return {
      error:
        "The roster is locked after the draw. Reset the draw to make changes.",
    } as const;
  }

  return { event, supabase } as const;
}

export async function addMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const eventId = text(formData, "event_id", { required: true });
  const name = text(formData, "display_name", { max: 80, required: true });
  if (!eventId) return { error: "Missing event." };
  if (!name) return { error: "Type the name you want to add." };

  const session = await requireProfile(`/events/${eventId}/manage`);
  const context = await editableRosterEvent(eventId, session.user.id);
  if ("error" in context) return { error: context.error };

  const { error } = await context.supabase
    .from("event_members")
    .insert({ event_id: eventId, display_name: name });

  if (error) {
    return { error: friendlyError(error, "Could not add that name.") };
  }

  revalidatePath(`/events/${eventId}/manage`);
  revalidatePath(`/events/${eventId}`);
  return { success: `${name} added to the roster.` };
}

export async function renameMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const eventId = text(formData, "event_id", { required: true });
  const memberId = text(formData, "member_id", { required: true });
  const name = text(formData, "display_name", { max: 80, required: true });
  if (!eventId || !memberId) return { error: "Missing roster member." };
  if (!name) return { error: "Give this person a name." };

  const session = await requireProfile(`/events/${eventId}/manage`);
  const context = await editableRosterEvent(eventId, session.user.id);
  if ("error" in context) return { error: context.error };

  const { error } = await context.supabase
    .from("event_members")
    .update({ display_name: name })
    .eq("id", memberId)
    .eq("event_id", eventId);

  if (error) {
    return { error: friendlyError(error, "Could not rename that person.") };
  }

  revalidatePath(`/events/${eventId}/manage`);
  revalidatePath(`/events/${eventId}`);
  return { success: "Name updated." };
}

export async function removeMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const eventId = text(formData, "event_id", { required: true });
  const memberId = text(formData, "member_id", { required: true });
  if (!eventId || !memberId) return { error: "Missing roster member." };

  const session = await requireProfile(`/events/${eventId}/manage`);
  const context = await editableRosterEvent(eventId, session.user.id);
  if ("error" in context) return { error: context.error };

  const { error } = await context.supabase
    .from("event_members")
    .delete()
    .eq("id", memberId)
    .eq("event_id", eventId);

  if (error) return { error: friendlyError(error) };

  revalidatePath(`/events/${eventId}/manage`);
  revalidatePath(`/events/${eventId}`);
  return { success: "Name removed from the roster." };
}

export async function drawNamesAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const eventId = text(formData, "event_id", { required: true });
  if (!eventId) return { error: "Missing event." };

  await requireProfile(`/events/${eventId}/draw`);
  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("draw_event", { p_event_id: eventId });

  if (error) return { error: friendlyError(error, "The draw could not be completed.") };

  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/${eventId}/manage`);
  revalidatePath(`/events/${eventId}/draw`);
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
  return {
    success:
      "Names drawn and sealed. Open your assignment to see who you are buying for.",
  };
}

/**
 * Draw from a personal link. The token is the credential, so this deliberately
 * works without an account — perfect for guests who do not use Google sign-in.
 * The database makes repeat clicks safe, so everyone can use the same button.
 */
export async function drawByTokenAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = text(formData, "token", { max: 200, required: true });
  if (!token) return { error: "This personal link is incomplete." };

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("draw_by_token", {
    p_token: token,
  });

  if (error) {
    return { error: friendlyError(error, "The draw could not be completed.") };
  }

  const eventId = typeof data === "string" ? data : null;
  revalidatePath(`/claim/${encodeURIComponent(token)}`);
  if (eventId) {
    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/events/${eventId}/manage`);
    revalidatePath(`/events/${eventId}/draw`);
  }
  revalidatePath("/dashboard");
  revalidatePath("/notifications");

  return { success: "Names drawn! Your recipient is ready." };
}

export async function resetDrawAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const eventId = text(formData, "event_id", { required: true });
  const confirmation = text(formData, "confirmation", { max: 120 });
  if (!eventId) return { error: "Missing event." };

  await requireProfile(`/events/${eventId}/manage`);
  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("reset_draw", {
    p_event_id: eventId,
    p_confirmation: confirmation ?? "",
  });

  if (error) return { error: friendlyError(error, "The draw could not be reset.") };

  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/${eventId}/manage`);
  revalidatePath(`/events/${eventId}/draw`);
  revalidatePath("/dashboard");
  return {
    success:
      "Draw reset. The roster is editable again and everyone keeps their claimed name.",
  };
}

export async function completeEventAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const eventId = text(formData, "event_id", { required: true });
  if (!eventId) return { error: "Missing event." };

  const session = await requireProfile(`/events/${eventId}/manage`);
  const supabase = await createServerSupabase();

  const { data: event } = await supabase
    .from("events")
    .select("id, organizer_id, status, name")
    .eq("id", eventId)
    .maybeSingle<Pick<EventRecord, "id" | "organizer_id" | "status" | "name">>();

  if (!event || event.organizer_id !== session.user.id) {
    return { error: "Only the organizer can complete this event." };
  }
  if (event.status !== "drawn") {
    return { error: "Draw the names before marking the exchange complete." };
  }

  const { error } = await supabase
    .from("events")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", eventId);

  if (error) return { error: friendlyError(error) };

  await supabase.rpc("notify_event_update", {
    p_event_id: eventId,
    p_title: `${event.name} is complete. Thank you for the Christmas cheer!`,
  });

  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/${eventId}/manage`);
  revalidatePath("/dashboard");
  return { success: "Event marked complete. The history is preserved." };
}

export async function announceAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const eventId = text(formData, "event_id", { required: true });
  const title = text(formData, "title", { max: 120, required: true });
  const body = text(formData, "body", { max: 1200 });
  if (!eventId) return { error: "Missing event." };
  if (!title || title.length < 2) return { error: "Give the announcement a title." };

  await requireProfile(`/events/${eventId}/manage`);
  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("announce_event", {
    p_event_id: eventId,
    p_title: title,
    p_body: body,
  });

  if (error) return { error: friendlyError(error, "Could not send the announcement.") };

  revalidatePath("/notifications");
  revalidatePath(`/events/${eventId}/manage`);
  return { success: "Announcement sent to everyone who claimed a name." };
}

/** Signed-in guest claims one name from the public roster. */
export async function claimMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const memberId = text(formData, "member_id", { required: true });
  const code = text(formData, "code", { max: 40, required: true });
  if (!memberId || !code) {
    return { error: "Pick your name and use the original invitation link." };
  }

  await requireProfile(`/join/${encodeURIComponent(code)}`);

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("claim_member", {
    p_member_id: memberId,
    p_code: code,
  });

  if (error || !data) {
    return { error: friendlyError(error, "Could not claim that name.") };
  }

  revalidatePath("/dashboard");
  revalidatePath(`/events/${data}`);
  revalidatePath(`/events/${data}/draw`);
  revalidatePath(`/join/${encodeURIComponent(code)}`);
  revalidatePath("/notifications");
  redirect(`/events/${data}/draw?claimed=1`);
}

/** Dashboard quick join: look up a code and open its invitation page. */
export async function lookupCodeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const code = text(formData, "code", { max: 40, required: true });
  if (!code) return { error: "Enter the invitation code from your host." };

  await requireProfile(`/join?code=${encodeURIComponent(code)}`);
  redirect(`/join/${encodeURIComponent(code)}`);
}

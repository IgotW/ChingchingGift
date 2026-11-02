"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "../auth";
import { queueWishlistEmail } from "../email";
import { createServerSupabase } from "../supabase/server";
import { friendlyError, text } from "../validation";
import type { ActionState } from "../types";

type WishlistRow = {
  id: string;
  is_published: boolean;
};

async function ensureWishlist(eventId: string, userId: string) {
  const supabase = await createServerSupabase();
  const { data: existing } = await supabase
    .from("wishlists")
    .select("id, is_published")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .maybeSingle<WishlistRow>();

  if (existing) return existing;

  const { data, error } = await supabase
    .from("wishlists")
    .insert({ event_id: eventId, user_id: userId })
    .select("id, is_published")
    .single<WishlistRow>();

  if (error) {
    const { data: retry } = await supabase
      .from("wishlists")
      .select("id, is_published")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .maybeSingle<WishlistRow>();
    if (retry) return retry;
    throw new Error(friendlyError(error));
  }

  return data;
}

/**
 * Wishlists stay editable until the exchange is complete. RLS protects
 * ownership, and this check keeps completed events read-only for every
 * wishlist mutation.
 */
async function wishlistLockedReason(eventId: string): Promise<string | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("events")
    .select("status")
    .eq("id", eventId)
    .maybeSingle<{ status: string }>();

  if (!data) return "You are not part of this exchange.";
  if (data.status === "completed") {
    return "This exchange is complete. Wishlists are read-only history now.";
  }
  return null;
}

/**
 * Persists publish state and lets the database decide whether a fresh
 * notification (and therefore an email) is due. The DB merges rapid edits.
 */
async function syncWishlist(
  eventId: string,
  userId: string,
  publish: boolean,
) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("touch_wishlist", {
    p_event_id: eventId,
    p_publish: publish,
  });

  if (!error) {
    const row = (data as { recipient_name: string; notified: boolean }[] | null)?.[0];
    if (row?.notified) {
      queueWishlistEmail({ eventId, recipientId: userId });
    }
  }

  revalidatePath(`/events/${eventId}/wishlist`);
  revalidatePath(`/events/${eventId}/recipient`);
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/dashboard");
  revalidatePath("/notifications");
}

function readItem(formData: FormData) {
  const title = text(formData, "title", { max: 160, required: true });
  const details = text(formData, "details", { max: 800 });
  const productUrl = text(formData, "product_url", { max: 800 });
  const color = text(formData, "color", { max: 80 });
  const size = text(formData, "size", { max: 80 });
  const notes = text(formData, "notes", { max: 800 });
  const priorityRaw = text(formData, "priority", { max: 1 }) ?? "2";
  const priority = ["1", "2", "3"].includes(priorityRaw) ? Number(priorityRaw) : 2;
  const priceRaw = formData.get("price");
  const priceString = typeof priceRaw === "string" ? priceRaw.trim() : "";

  if (!title) return { error: "Give this gift idea a name." } as const;

  let price: number | null = null;
  if (priceString) {
    const value = Number(priceString);
    if (!Number.isFinite(value) || value < 0) {
      return { error: "The price should be a positive number." } as const;
    }
    price = Math.round(value * 100) / 100;
  }

  let normalizedUrl: string | null = null;
  if (productUrl) {
    try {
      const url = new URL(productUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return { error: "Product links must start with http:// or https://." } as const;
      }
      normalizedUrl = url.toString();
    } catch {
      return { error: "That product link does not look like a valid URL." } as const;
    }
  }

  return {
    values: {
      title,
      details,
      product_url: normalizedUrl,
      color,
      size,
      notes,
      priority,
      price,
    },
  } as const;
}

export async function addWishlistItemAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const eventId = text(formData, "event_id", { required: true });
  if (!eventId) return { error: "Missing event." };

  const session = await requireProfile(`/events/${eventId}/wishlist`);
  const locked = await wishlistLockedReason(eventId);
  if (locked) return { error: locked };
  const parsed = readItem(formData);
  if ("error" in parsed) return { error: parsed.error };

  try {
    const wishlist = await ensureWishlist(eventId, session.user.id);
    const supabase = await createServerSupabase();
    const { error } = await supabase.from("wishlist_items").insert({
      ...parsed.values,
      wishlist_id: wishlist.id,
    });

    if (error) return { error: friendlyError(error, "Could not add the item.") };

    await syncWishlist(eventId, session.user.id, wishlist.is_published);
    return { success: "Added to your wishlist." };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not add the item.",
    };
  }
}

export async function updateWishlistItemAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const eventId = text(formData, "event_id", { required: true });
  const itemId = text(formData, "item_id", { required: true });
  if (!eventId || !itemId) return { error: "Missing wishlist item." };

  const session = await requireProfile(`/events/${eventId}/wishlist`);
  const locked = await wishlistLockedReason(eventId);
  if (locked) return { error: locked };
  const parsed = readItem(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createServerSupabase();
  const { data: owned } = await supabase
    .from("wishlist_items")
    .select("id, wishlist:wishlists!inner(id, user_id, is_published)")
    .eq("id", itemId)
    .eq("wishlists.user_id", session.user.id)
    .maybeSingle<{ id: string; wishlist: { id: string; is_published: boolean } }>();

  if (!owned) return { error: "That wishlist item could not be found." };

  const { error } = await supabase
    .from("wishlist_items")
    .update(parsed.values)
    .eq("id", itemId);

  if (error) return { error: friendlyError(error, "Could not save the item.") };

  await syncWishlist(eventId, session.user.id, owned.wishlist.is_published);
  return { success: "Wishlist item updated." };
}

export async function deleteWishlistItemAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const eventId = text(formData, "event_id", { required: true });
  const itemId = text(formData, "item_id", { required: true });
  if (!eventId || !itemId) return { error: "Missing wishlist item." };

  const session = await requireProfile(`/events/${eventId}/wishlist`);
  const locked = await wishlistLockedReason(eventId);
  if (locked) return { error: locked };
  const supabase = await createServerSupabase();

  const { data: owned } = await supabase
    .from("wishlist_items")
    .select("id, wishlist:wishlists!inner(id, user_id, is_published)")
    .eq("id", itemId)
    .eq("wishlists.user_id", session.user.id)
    .maybeSingle<{ id: string; wishlist: { id: string; is_published: boolean } }>();

  if (!owned) return { error: "That wishlist item could not be found." };

  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("id", itemId);

  if (error) return { error: friendlyError(error, "Could not remove the item.") };

  await syncWishlist(eventId, session.user.id, owned.wishlist.is_published);
  return { success: "Item removed from your wishlist." };
}

export async function setWishlistPublishedAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const eventId = text(formData, "event_id", { required: true });
  const publish = formData.get("published") === "true";
  if (!eventId) return { error: "Missing event." };

  const session = await requireProfile(`/events/${eventId}/wishlist`);
  const locked = await wishlistLockedReason(eventId);
  if (locked) return { error: locked };

  try {
    await ensureWishlist(eventId, session.user.id);
    await syncWishlist(eventId, session.user.id, publish);
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Could not update your wishlist.",
    };
  }

  return {
    success: publish
      ? "Your wishlist is live. Your Secret Santa has been notified."
      : "Your wishlist is hidden from public view while you keep editing.",
  };
}

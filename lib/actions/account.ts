"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "../auth";
import { createServerSupabase } from "../supabase/server";
import { friendlyError, text } from "../validation";
import type { ActionState } from "../types";

export async function updateProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireProfile("/profile");
  const fullName = text(formData, "full_name", { max: 80, required: true });

  if (!fullName || fullName.length < 2) {
    return { error: "Your name should be at least 2 characters." };
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", session.user.id);

  if (error) return { error: friendlyError(error, "Could not update your profile.") };

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  return { success: "Profile updated." };
}

export async function markAllNotificationsReadAction(
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const session = await requireProfile("/notifications");
  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", session.user.id)
    .is("read_at", null);

  if (error) return { error: friendlyError(error) };

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  return { success: "All notifications marked as read." };
}

export async function markNotificationReadAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireProfile("/notifications");
  const id = text(formData, "notification_id", { required: true });
  if (!id) return { error: "Missing notification." };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (error) return { error: friendlyError(error) };

  revalidatePath("/notifications");
  revalidatePath("/", "layout");
  return { success: "Marked as read." };
}

import { getCurrentUser } from "./auth";
import { createServerSupabase } from "./supabase/server";
import type {
  AssignmentRecord,
  EventMember,
  EventPreview,
  EventWithOrganizer,
  MemberExclusion,
  MemberView,
  NotificationRecord,
  WishlistRecord,
  WishlistStatusRow,
} from "./types";

export type DashboardEvent = EventWithOrganizer & {
  member_count: number;
  claimed_count: number;
  my_member_name: string | null;
  my_wishlist_published: boolean;
  my_wishlist_items: number;
  has_assignment: boolean;
  is_organizer: boolean;
};

export type MyWishlist = WishlistRecord | null;

const EVENT_SELECT =
  "id, organizer_id, name, description, party_date, gift_budget, currency, registration_deadline, wishlist_deadline, instructions, invite_code, status, drawn_at, completed_at, created_at, updated_at, organizer:profiles!events_organizer_id_fkey(id, full_name, avatar_url)";

const ITEM_FIELDS =
  "id, wishlist_id, title, details, product_url, color, size, price, notes, priority, created_at, updated_at";

const MEMBER_SELECT =
  "id, event_id, display_name, user_id, claimed_at, created_at, profile:profiles!event_members_user_id_fkey(id, full_name, avatar_url)";

/** Events the viewer belongs to, with the small bits the dashboard needs. */
export async function getDashboardEvents(): Promise<DashboardEvent[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createServerSupabase();

  const [{ data: events }, { data: myMemberships }] = await Promise.all([
    supabase
      .from("events")
      .select(EVENT_SELECT)
      .order("created_at", { ascending: false }),
    supabase
      .from("event_members")
      .select("event_id, id, display_name, user_id")
      .eq("user_id", user.id),
  ]);

  if (!events?.length) return [];

  const ids = events.map((event) => event.id as string);
  const [members, wishlists, assignments] = await Promise.all([
    supabase
      .from("event_members")
      .select("event_id, user_id")
      .in("event_id", ids),
    supabase
      .from("wishlists")
      .select("event_id, is_published, item_count:wishlist_items(count)")
      .eq("user_id", user.id)
      .in("event_id", ids),
    supabase.from("assignments").select("event_id").in("event_id", ids),
  ]);

  const memberSet = new Set(
    (myMemberships ?? []).map((row) => row.event_id as string),
  );
  const myNameMap = new Map(
    (myMemberships ?? []).map((row) => [
      row.event_id as string,
      row.display_name as string,
    ]),
  );

  const counts = new Map<string, number>();
  const claimed = new Map<string, number>();
  for (const row of members.data ?? []) {
    const key = row.event_id as string;
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (row.user_id) claimed.set(key, (claimed.get(key) ?? 0) + 1);
  }

  const wishlistMap = new Map<string, { published: boolean; items: number }>();
  for (const row of (wishlists.data ?? []) as unknown as {
    event_id: string;
    is_published: boolean;
    item_count: { count: number }[];
  }[]) {
    wishlistMap.set(row.event_id, {
      published: row.is_published,
      items: row.item_count?.[0]?.count ?? 0,
    });
  }

  const assignedEvents = new Set(
    (assignments.data ?? []).map((row) => row.event_id as string),
  );

  return (events as unknown as EventWithOrganizer[])
    .filter(
      (event) => memberSet.has(event.id) || event.organizer_id === user.id,
    )
    .map((event) => {
      const wishlist = wishlistMap.get(event.id);
      return {
        ...event,
        member_count: counts.get(event.id) ?? 0,
        claimed_count: claimed.get(event.id) ?? 0,
        my_member_name: myNameMap.get(event.id) ?? null,
        my_wishlist_published: wishlist?.published ?? false,
        my_wishlist_items: wishlist?.items ?? 0,
        has_assignment: assignedEvents.has(event.id),
        is_organizer: event.organizer_id === user.id,
      };
    });
}

export async function getEvent(eventId: string): Promise<EventWithOrganizer | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("id", eventId)
    .maybeSingle();

  return (data as unknown as EventWithOrganizer) ?? null;
}

export async function getEventMembers(eventId: string): Promise<EventMember[]> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("event_members")
    .select(MEMBER_SELECT)
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  return (data as unknown as EventMember[]) ?? [];
}

export async function getMyMember(eventId: string): Promise<EventMember | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("event_members")
    .select(MEMBER_SELECT)
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  return (data as unknown as EventMember) ?? null;
}

/** Organizer-only directional draw exclusions. */
export async function getEventExclusions(
  eventId: string,
): Promise<MemberExclusion[]> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("event_member_exclusions")
    .select(
      "id, event_id, giver_member_id, recipient_member_id, created_at",
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  return (data as MemberExclusion[]) ?? [];
}

/** Organizer-only personal reveal links, keyed by roster member id. */
export async function getMemberTokens(
  eventId: string,
): Promise<Map<string, string>> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("event_member_tokens")
    .select("member_id, token")
    .eq("event_id", eventId);

  const tokens = new Map<string, string>();
  for (const row of data ?? []) {
    tokens.set(row.member_id as string, row.token as string);
  }
  return tokens;
}

export async function getMyAssignment(
  eventId: string,
): Promise<AssignmentRecord | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .rpc("my_assignment", { p_event_id: eventId })
    .maybeSingle();

  return (data as unknown as AssignmentRecord) ?? null;
}

export async function getWishlist(
  eventId: string,
  userId: string,
): Promise<MyWishlist> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("wishlists")
    .select(`id, event_id, user_id, is_published, created_at, updated_at, items:wishlist_items(${ITEM_FIELDS})`)
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .order("priority", { referencedTable: "wishlist_items", ascending: true })
    .order("created_at", { referencedTable: "wishlist_items", ascending: true })
    .maybeSingle();

  return (data as unknown as WishlistRecord) ?? null;
}

export async function getWishlistStatus(
  eventId: string,
): Promise<WishlistStatusRow[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("event_wishlist_status", {
    p_event_id: eventId,
  });
  if (error) return [];
  return (data as WishlistStatusRow[]) ?? [];
}

export async function getNotifications(
  limit = 40,
): Promise<NotificationRecord[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("notifications")
    .select("id, user_id, event_id, kind, title, body, url, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data as NotificationRecord[]) ?? [];
}

export async function getUnreadCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;

  const supabase = await createServerSupabase();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  return count ?? 0;
}

export async function getEventPreview(code: string): Promise<EventPreview | null> {
  let decoded = code;
  try {
    decoded = decodeURIComponent(code);
  } catch {
    // Keep the raw value when the path contains malformed escapes.
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .rpc("preview_event", { p_code: decoded })
    .maybeSingle();

  if (error || !data) return null;
  const preview = data as unknown as EventPreview;
  return {
    ...preview,
    members: Array.isArray(preview.members) ? preview.members : [],
  };
}

export async function getMemberView(token: string): Promise<MemberView | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .rpc("member_view", { p_token: token })
    .maybeSingle();

  if (error || !data) return null;
  const view = data as unknown as MemberView;
  return {
    ...view,
    recipient_wishlist_items: Array.isArray(view.recipient_wishlist_items)
      ? view.recipient_wishlist_items
      : [],
  };
}

export async function getEventAudit(eventId: string) {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("event_audit")
    .select("id, action, details, created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(10);

  return data ?? [];
}

export async function getEventForMember(eventId: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const event = await getEvent(eventId);
  if (!event) return null;

  const member = await getMyMember(eventId);
  const isOrganizer = event.organizer_id === user.id;
  if (!member && !isOrganizer) return null;

  return { user, event, member, isOrganizer };
}

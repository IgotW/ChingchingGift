export type EventStatus =
  | "upcoming"
  | "registration_closed"
  | "drawn"
  | "completed";

export type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
};

export type EventRecord = {
  id: string;
  organizer_id: string;
  name: string;
  description: string | null;
  party_date: string | null;
  gift_budget: number | null;
  currency: string;
  registration_deadline: string | null;
  wishlist_deadline: string | null;
  instructions: string | null;
  invite_code: string;
  status: EventStatus;
  drawn_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type EventWithOrganizer = EventRecord & {
  organizer: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
};

/** A name on the organizer's roster. `user_id` is set once someone claims it. */
export type EventMember = {
  id: string;
  event_id: string;
  display_name: string;
  user_id: string | null;
  claimed_at: string | null;
  created_at: string;
  profile: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
};

export type PreviewMember = {
  id: string;
  name: string;
  claimed: boolean;
};

/** The signed-in giver's own assignment, as returned by `my_assignment`. */
export type AssignmentRecord = {
  assignment_id: string;
  recipient_member_id: string;
  recipient_name: string;
  recipient_user_id: string | null;
  recipient_avatar_url: string | null;
  wishlist_published: boolean;
  wishlist_item_count: number;
};

/** What an anonymous personal-link holder can see. */
export type MemberView = {
  event_id: string;
  event_name: string;
  event_status: EventStatus;
  party_date: string | null;
  gift_budget: number | null;
  currency: string;
  wishlist_deadline: string | null;
  instructions: string | null;
  organizer_name: string;
  member_id: string;
  member_name: string;
  claimed: boolean;
  drawn: boolean;
  recipient_member_id: string | null;
  recipient_name: string | null;
  recipient_user_id: string | null;
  recipient_avatar_url: string | null;
  recipient_wishlist_published: boolean;
  recipient_wishlist_items: WishlistItem[] | null;
};

export type WishlistItem = {
  id: string;
  wishlist_id: string;
  title: string;
  details: string | null;
  product_url: string | null;
  color: string | null;
  size: string | null;
  price: number | null;
  notes: string | null;
  priority: number;
  created_at: string;
  updated_at: string;
};

export type WishlistRecord = {
  id: string;
  event_id: string;
  user_id: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  items: WishlistItem[];
};

export type NotificationRecord = {
  id: string;
  user_id: string;
  event_id: string | null;
  kind: string;
  title: string;
  body: string | null;
  url: string | null;
  read_at: string | null;
  created_at: string;
};

export type EventPreview = {
  id: string;
  name: string;
  description: string | null;
  party_date: string | null;
  gift_budget: number | null;
  currency: string;
  wishlist_deadline: string | null;
  organizer_name: string;
  member_count: number;
  status: EventStatus;
  members: PreviewMember[];
};

export type WishlistStatusRow = {
  member_id: string;
  display_name: string;
  user_id: string | null;
  has_wishlist: boolean;
  is_published: boolean;
  item_count: number;
  updated_at: string | null;
};

export type ActionState = {
  error?: string;
  success?: string;
} | null;

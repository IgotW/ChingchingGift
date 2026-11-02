-- ChingChingGift — database schema, row level security, and transactional functions.
-- Run this once in the Supabase SQL editor (or `supabase db push`).
--
-- The exchange is roster-first: the organizer lists every participant up front,
-- guests claim their own name once, and the draw runs over the whole roster.
-- Each roster row gets a private token so a guest can reveal their recipient
-- without signing in.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
do $$
begin
  create type public.event_status as enum ('upcoming', 'registration_closed', 'drawn', 'completed');
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- One-time migration from the old participant/account model.
-- The old assignments table used giver_id/recipient_id; the new one uses
-- member ids. When we detect the old shape, drop it and clear old events so a
-- fresh roster can be created. This block only ever runs once per database.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'assignments'
      and column_name = 'giver_id'
  ) then
    drop table if exists public.assignments cascade;
    drop table if exists public.event_participants cascade;
    delete from public.notifications;
    delete from public.events;
  end if;
end $$;

drop table if exists public.event_participants cascade;
drop function if exists public.join_event(text);

-- Return shapes changed in the roster model, so these must be recreated.
drop function if exists public.preview_event(text);
drop function if exists public.event_wishlist_status(uuid);
drop function if exists public.my_assignment(uuid);
drop function if exists public.member_view(text);
drop function if exists public.claim_member(uuid);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default 'Christmas friend',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  description text,
  party_date date,
  gift_budget numeric(12, 2) check (gift_budget is null or gift_budget >= 0),
  currency text not null default 'USD',
  -- Kept for backwards compatibility with existing rows; the roster flow no
  -- longer reads or writes a registration deadline.
  registration_deadline date,
  wishlist_deadline date,
  instructions text,
  invite_code text not null unique default upper(substr(encode(gen_random_bytes(5), 'hex'), 1, 8)),
  status public.event_status not null default 'upcoming',
  drawn_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_members (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 80),
  user_id uuid references public.profiles (id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.event_member_tokens (
  member_id uuid primary key references public.event_members (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  giver_member_id uuid not null references public.event_members (id) on delete cascade,
  recipient_member_id uuid not null references public.event_members (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint assignments_no_self check (giver_member_id <> recipient_member_id),
  constraint assignments_one_gift_per_giver unique (event_id, giver_member_id),
  constraint assignments_one_recipient_per_giver unique (event_id, recipient_member_id)
);

create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  details text,
  product_url text,
  color text,
  size text,
  price numeric(12, 2) check (price is null or price >= 0),
  notes text,
  priority smallint not null default 2 check (priority between 1 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event_id uuid references public.events (id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.event_audit (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

create index if not exists events_organizer_idx on public.events (organizer_id);
create unique index if not exists event_members_name_unique
  on public.event_members (event_id, lower(btrim(display_name)));
create unique index if not exists event_members_user_unique
  on public.event_members (event_id, user_id)
  where user_id is not null;
create index if not exists event_members_event_idx on public.event_members (event_id);
create index if not exists event_members_user_idx on public.event_members (user_id);
create index if not exists event_member_tokens_event_idx on public.event_member_tokens (event_id);
create index if not exists assignments_giver_idx on public.assignments (event_id, giver_member_id);
create index if not exists assignments_recipient_idx on public.assignments (event_id, recipient_member_id);
create index if not exists wishlist_items_wishlist_idx on public.wishlist_items (wishlist_id);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (user_id) where read_at is null;

-- ---------------------------------------------------------------------------
-- Profile bootstrap on first Google sign-in
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, 'friend@chingchinggift'), '@', 1)
    ),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists events_touch_updated_at on public.events;
create trigger events_touch_updated_at
before update on public.events
for each row execute function public.touch_updated_at();

-- Every roster row gets a private reveal token. The function is security
-- definer so the insert succeeds without a client-facing insert policy.
create or replace function public.create_member_token()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.event_member_tokens (member_id, event_id)
  values (new.id, new.event_id)
  on conflict (member_id) do nothing;
  return new;
end;
$$;

drop trigger if exists event_members_create_token on public.event_members;
create trigger event_members_create_token
after insert on public.event_members
for each row execute function public.create_member_token();

-- ---------------------------------------------------------------------------
-- Authorization helpers (security definer so RLS never recurses)
-- ---------------------------------------------------------------------------
create or replace function public.is_event_member(p_event uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.event_members
    where event_id = p_event and user_id = auth.uid()
  );
$$;

create or replace function public.is_event_organizer(p_event uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.events
    where id = p_event and organizer_id = auth.uid()
  );
$$;

create or replace function public.event_has_draw(p_event uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.assignments where event_id = p_event);
$$;

-- The wishlist owner, or the person drawn to give them a gift.
create or replace function public.can_view_wishlist(p_event uuid, p_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() = p_owner or exists (
    select 1
    from public.assignments a
    join public.event_members giver on giver.id = a.giver_member_id
    join public.event_members recipient on recipient.id = a.recipient_member_id
    where a.event_id = p_event
      and giver.user_id = auth.uid()
      and recipient.user_id = p_owner
  );
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_members enable row level security;
alter table public.event_member_tokens enable row level security;
alter table public.assignments enable row level security;
alter table public.wishlists enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.notifications enable row level security;
alter table public.event_audit enable row level security;

-- profiles: signed-in people can see each other's display name and avatar.
drop policy if exists "profiles are readable by signed-in users" on public.profiles;
create policy "profiles are readable by signed-in users"
  on public.profiles for select to authenticated using (true);

drop policy if exists "users insert their own profile" on public.profiles;
create policy "users insert their own profile"
  on public.profiles for insert to authenticated with check (id = auth.uid());

drop policy if exists "users update their own profile" on public.profiles;
create policy "users update their own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- events
drop policy if exists "members can read their events" on public.events;
create policy "members can read their events"
  on public.events for select to authenticated
  using (organizer_id = auth.uid() or public.is_event_member(id));

drop policy if exists "organizers create events" on public.events;
create policy "organizers create events"
  on public.events for insert to authenticated
  with check (organizer_id = auth.uid());

drop policy if exists "organizers update their events" on public.events;
create policy "organizers update their events"
  on public.events for update to authenticated
  using (organizer_id = auth.uid()) with check (organizer_id = auth.uid());

drop policy if exists "organizers delete their events" on public.events;
create policy "organizers delete their events"
  on public.events for delete to authenticated
  using (organizer_id = auth.uid() and not public.event_has_draw(id));

-- event roster
drop policy if exists "members can read the roster" on public.event_members;
create policy "members can read the roster"
  on public.event_members for select to authenticated
  using (public.is_event_member(event_id) or public.is_event_organizer(event_id));

drop policy if exists "organizers add members" on public.event_members;
create policy "organizers add members"
  on public.event_members for insert to authenticated
  with check (public.is_event_organizer(event_id));

drop policy if exists "organizers rename members" on public.event_members;
create policy "organizers rename members"
  on public.event_members for update to authenticated
  using (public.is_event_organizer(event_id) and not public.event_has_draw(event_id))
  with check (public.is_event_organizer(event_id) and not public.event_has_draw(event_id));

drop policy if exists "organizers remove members" on public.event_members;
create policy "organizers remove members"
  on public.event_members for delete to authenticated
  using (public.is_event_organizer(event_id) and not public.event_has_draw(event_id));

-- personal reveal links: organizer only, never exposed to other members.
drop policy if exists "organizers read personal links" on public.event_member_tokens;
create policy "organizers read personal links"
  on public.event_member_tokens for select to authenticated
  using (public.is_event_organizer(event_id));

-- assignments: a giver may read only their own secret. Nobody can write directly.
drop policy if exists "givers read only their own assignment" on public.assignments;
create policy "givers read only their own assignment"
  on public.assignments for select to authenticated
  using (
    exists (
      select 1 from public.event_members m
      where m.id = giver_member_id and m.user_id = auth.uid()
    )
  );

-- wishlists
drop policy if exists "wishlists visible to owner and giver" on public.wishlists;
create policy "wishlists visible to owner and giver"
  on public.wishlists for select to authenticated
  using (public.can_view_wishlist(event_id, user_id));

drop policy if exists "owners create their wishlist" on public.wishlists;
create policy "owners create their wishlist"
  on public.wishlists for insert to authenticated
  with check (user_id = auth.uid() and public.is_event_member(event_id));

drop policy if exists "owners update their wishlist" on public.wishlists;
create policy "owners update their wishlist"
  on public.wishlists for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "owners delete their wishlist" on public.wishlists;
create policy "owners delete their wishlist"
  on public.wishlists for delete to authenticated
  using (user_id = auth.uid());

-- wishlist items
drop policy if exists "items visible where the wishlist is visible" on public.wishlist_items;
create policy "items visible where the wishlist is visible"
  on public.wishlist_items for select to authenticated
  using (
    exists (
      select 1 from public.wishlists w
      where w.id = wishlist_id and public.can_view_wishlist(w.event_id, w.user_id)
    )
  );

drop policy if exists "owners add items" on public.wishlist_items;
create policy "owners add items"
  on public.wishlist_items for insert to authenticated
  with check (
    exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid())
  );

drop policy if exists "owners update items" on public.wishlist_items;
create policy "owners update items"
  on public.wishlist_items for update to authenticated
  using (
    exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid())
  );

drop policy if exists "owners delete items" on public.wishlist_items;
create policy "owners delete items"
  on public.wishlist_items for delete to authenticated
  using (
    exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid())
  );

-- notifications: strictly per user.
drop policy if exists "people read their notifications" on public.notifications;
create policy "people read their notifications"
  on public.notifications for select to authenticated using (user_id = auth.uid());

drop policy if exists "people update their notifications" on public.notifications;
create policy "people update their notifications"
  on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "people delete their notifications" on public.notifications;
create policy "people delete their notifications"
  on public.notifications for delete to authenticated using (user_id = auth.uid());

-- audit trail is visible to the organizer only.
drop policy if exists "organizers read the audit trail" on public.event_audit;
create policy "organizers read the audit trail"
  on public.event_audit for select to authenticated
  using (public.is_event_organizer(event_id));

-- ---------------------------------------------------------------------------
-- Preview an event from its invitation code (works before signing in).
-- Returns the roster so guests can pick their own name.
-- ---------------------------------------------------------------------------
create function public.preview_event(p_code text)
returns table (
  id uuid,
  name text,
  description text,
  party_date date,
  gift_budget numeric,
  currency text,
  wishlist_deadline date,
  organizer_name text,
  member_count bigint,
  status public.event_status,
  members jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id,
    e.name,
    e.description,
    e.party_date,
    e.gift_budget,
    e.currency,
    e.wishlist_deadline,
    coalesce(p.full_name, 'The organizer'),
    (select count(*) from public.event_members m where m.event_id = e.id),
    e.status,
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', m.id,
            'name', m.display_name,
            'claimed', m.user_id is not null
          )
          order by m.created_at, m.display_name
        )
        from public.event_members m
        where m.event_id = e.id
      ),
      '[]'::jsonb
    )
  from public.events e
  left join public.profiles p on p.id = e.organizer_id
  where upper(e.invite_code) = upper(trim(p_code))
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Claim a roster name. A guest may claim before or after the draw, but only
-- one name per event, and only if the name is still free.
-- ---------------------------------------------------------------------------
create function public.claim_member(p_member_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_member public.event_members;
  v_event public.events;
  v_name text;
begin
  if v_uid is null then
    raise exception 'Please sign in to claim a name.';
  end if;

  select * into v_member
  from public.event_members
  where id = p_member_id
  for update;

  if not found then
    raise exception 'That name is no longer on the list.';
  end if;

  select * into v_event
  from public.events
  where id = v_member.event_id
  for update;

  if not found then
    raise exception 'Event not found.';
  end if;

  if v_event.status = 'completed' then
    raise exception 'This exchange is complete. Names can no longer be claimed.';
  end if;

  if v_member.user_id = v_uid then
    return v_event.id;
  end if;

  if v_member.user_id is not null then
    raise exception 'That name has already been claimed. Pick another.';
  end if;

  if exists (
    select 1 from public.event_members
    where event_id = v_event.id and user_id = v_uid
  ) then
    raise exception 'You already claimed a name in this exchange.';
  end if;

  update public.event_members
  set user_id = v_uid, claimed_at = now()
  where id = p_member_id;

  select coalesce(full_name, v_member.display_name) into v_name
  from public.profiles
  where id = v_uid;

  if v_event.organizer_id <> v_uid then
    insert into public.notifications (user_id, event_id, kind, title, body, url)
    values (
      v_event.organizer_id,
      v_event.id,
      'member_claimed',
      coalesce(v_name, 'A guest') || ' claimed a name',
      'They are now part of ' || v_event.name || '.',
      '/events/' || v_event.id || '/manage'
    );
  end if;

  insert into public.notifications (user_id, event_id, kind, title, body, url)
  values (
    v_uid,
    v_event.id,
    'joined',
    'You are in! 🎄',
    'You claimed ' || v_member.display_name || ' in ' || v_event.name || '.',
    '/events/' || v_event.id
  );

  return v_event.id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Draw names over the whole roster. Sattolo's algorithm produces a single-cycle
-- permutation: every giver gets a different recipient, nobody draws themselves,
-- and every person receives exactly one gift. The whole set is written in one
-- transaction, under a lock on the event row.
--
-- `perform_event_draw` is the internal engine. It is intentionally not callable
-- by clients; both the signed-in path (`draw_event`) and the no-sign-in personal
-- link path (`draw_by_token`) check their own credential first and then call it.
-- Because the roster is fixed when the organizer creates the event, the first
-- person to tap "Draw" can start the draw immediately. The row lock makes the
-- operation safe when several people tap at the same time; later calls are
-- no-ops and simply reveal the assignment that already exists.
-- ---------------------------------------------------------------------------
create or replace function public.perform_event_draw(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_event public.events;
  v_ids uuid[];
  v_count int;
  v_i int;
  v_j int;
  v_tmp uuid;
begin
  select * into v_event from public.events where id = p_event_id for update;
  if not found then
    raise exception 'Event not found.';
  end if;
  if v_event.status = 'completed' then
    raise exception 'This event is already completed.';
  end if;
  if v_event.status = 'drawn' or exists (
    select 1 from public.assignments where event_id = p_event_id
  ) then
    -- Someone else already started the draw. Treat repeat clicks as success so
    -- every guest can simply reveal their recipient.
    return;
  end if;

  select array_agg(id order by id) into v_ids
  from public.event_members
  where event_id = p_event_id;

  v_count := coalesce(array_length(v_ids, 1), 0);
  if v_count < 2 then
    raise exception 'You need at least two names on the list to draw.';
  end if;

  -- Sattolo shuffle
  for v_i in reverse v_count .. 2 loop
    v_j := 1 + floor(random() * (v_i - 1))::int;
    v_tmp := v_ids[v_i];
    v_ids[v_i] := v_ids[v_j];
    v_ids[v_j] := v_tmp;
  end loop;

  -- Single cycle: ids[i] gives to ids[i + 1]
  for v_i in 1 .. v_count loop
    insert into public.assignments (event_id, giver_member_id, recipient_member_id)
    values (
      p_event_id,
      v_ids[v_i],
      v_ids[case when v_i = v_count then 1 else v_i + 1 end]
    );
  end loop;

  update public.events
  set status = 'drawn', drawn_at = now()
  where id = p_event_id;

  insert into public.notifications (user_id, event_id, kind, title, body, url)
  select
    m.user_id,
    p_event_id,
    'draw_ready',
    'Your Secret Santa is ready 🎁',
    'The names are drawn. Open your private link to reveal your assigned recipient.',
    '/events/' || p_event_id || '/draw'
  from public.event_members m
  where m.event_id = p_event_id and m.user_id is not null;

  insert into public.event_audit (event_id, actor_id, action, details)
  values (p_event_id, v_actor, 'draw_completed', jsonb_build_object('members', v_count));
end;
$$;

-- Signed-in path: the organizer or any guest who has claimed a roster name.
create or replace function public.draw_event(p_event_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Please sign in.';
  end if;
  if not (
    public.is_event_organizer(p_event_id)
    or public.is_event_member(p_event_id)
  ) then
    raise exception 'Only the organizer or a claimed member can start the draw.';
  end if;

  perform public.perform_event_draw(p_event_id);
end;
$$;

-- No-sign-in path: a valid personal link is the only credential.
create or replace function public.draw_by_token(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
begin
  select t.event_id into v_event_id
  from public.event_member_tokens t
  where t.token = trim(p_token)
  limit 1;

  if v_event_id is null then
    raise exception 'This private link is not valid.';
  end if;

  perform public.perform_event_draw(v_event_id);
  return v_event_id;
end;
$$;

-- Controlled recovery: wipe a draw and reopen roster editing. Claims survive.
-- Requires the organizer to type the event name as confirmation.
create or replace function public.reset_draw(p_event_id uuid, p_confirmation text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_event public.events;
begin
  select * into v_event from public.events where id = p_event_id for update;
  if not found then
    raise exception 'Event not found.';
  end if;
  if v_event.organizer_id <> v_uid then
    raise exception 'Only the organizer can reset the draw.';
  end if;
  if v_event.status = 'completed' then
    raise exception 'Completed exchanges cannot be reset.';
  end if;
  if v_event.status <> 'drawn' then
    raise exception 'There is no final draw to reset.';
  end if;
  if lower(trim(p_confirmation)) <> lower(v_event.name) then
    raise exception 'Type the event name exactly to confirm the reset.';
  end if;

  delete from public.assignments where event_id = p_event_id;
  delete from public.notifications
    where event_id = p_event_id and kind in ('draw_ready', 'wishlist_update');

  update public.events
  set status = 'upcoming', drawn_at = null
  where id = p_event_id;

  insert into public.event_audit (event_id, actor_id, action)
  values (p_event_id, v_uid, 'draw_reset');
end;
$$;

-- ---------------------------------------------------------------------------
-- Announcements and event-update notifications
-- ---------------------------------------------------------------------------
create or replace function public.announce_event(p_event_id uuid, p_title text, p_body text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_event_organizer(p_event_id) then
    raise exception 'Only the organizer can send announcements.';
  end if;
  if char_length(trim(p_title)) < 2 then
    raise exception 'Give your announcement a title.';
  end if;

  insert into public.notifications (user_id, event_id, kind, title, body, url)
  select m.user_id, p_event_id, 'announcement', trim(p_title), nullif(trim(p_body), ''),
         '/events/' || p_event_id
  from public.event_members m
  where m.event_id = p_event_id and m.user_id is not null;

  insert into public.event_audit (event_id, actor_id, action, details)
  values (p_event_id, auth.uid(), 'announcement', jsonb_build_object('title', trim(p_title)));
end;
$$;

create or replace function public.notify_event_update(p_event_id uuid, p_title text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_event_organizer(p_event_id) then
    raise exception 'Only the organizer can update this event.';
  end if;

  insert into public.notifications (user_id, event_id, kind, title, body, url)
  select m.user_id, p_event_id, 'event_update', 'Event details updated',
         coalesce(p_title, 'The organizer updated the details for your exchange.'),
         '/events/' || p_event_id
  from public.event_members m
  where m.event_id = p_event_id
    and m.user_id is not null
    and m.user_id <> auth.uid();
end;
$$;

-- ---------------------------------------------------------------------------
-- Wishlist publish / update: saves state and notifies the assigned giver.
-- The 30-minute merge window keeps rapid edits from flooding the giver.
-- Returns only whether a fresh notification was created — never the giver's
-- identity, so the recipient cannot learn who is buying for them.
-- ---------------------------------------------------------------------------
create or replace function public.touch_wishlist(p_event_id uuid, p_publish boolean)
returns table (recipient_name text, notified boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_name text;
  v_recipient_member uuid;
  v_giver uuid;
  v_existing uuid;
  v_notified boolean := false;
begin
  if v_uid is null then
    raise exception 'Please sign in.';
  end if;

  select m.id into v_recipient_member
  from public.event_members m
  where m.event_id = p_event_id and m.user_id = v_uid;

  if v_recipient_member is null then
    raise exception 'You are not part of this event.';
  end if;

  if exists (
    select 1 from public.events
    where id = p_event_id and status = 'completed'
  ) then
    raise exception 'This exchange is complete. Wishlists are read-only.';
  end if;

  insert into public.wishlists (event_id, user_id, is_published)
  values (p_event_id, v_uid, p_publish)
  on conflict (event_id, user_id) do update
    set is_published = excluded.is_published,
        updated_at = now();

  select coalesce(full_name, 'A participant') into v_name
  from public.profiles where id = v_uid;

  select giver.user_id into v_giver
  from public.assignments a
  join public.event_members giver on giver.id = a.giver_member_id
  where a.event_id = p_event_id
    and a.recipient_member_id = v_recipient_member;

  if p_publish and v_giver is not null then
    select n.id into v_existing
    from public.notifications n
    where n.user_id = v_giver
      and n.event_id = p_event_id
      and n.kind = 'wishlist_update'
      and n.read_at is null
      and n.created_at > now() - interval '30 minutes'
    order by n.created_at desc
    limit 1;

    if v_existing is not null then
      update public.notifications
      set body = v_name || ' updated their wishlist. Take another look at their latest gift ideas.',
          created_at = now(),
          read_at = null
      where id = v_existing;
    else
      insert into public.notifications (user_id, event_id, kind, title, body, url)
      values (
        v_giver,
        p_event_id,
        'wishlist_update',
        v_name || ' updated their wishlist 🎁',
        v_name || ' added or changed items on their Christmas wishlist. Sign in to see their latest gift preferences.',
        '/events/' || p_event_id || '/recipient'
      );
      v_notified := true;
    end if;
  end if;

  return query select v_name, v_notified;
end;
$$;

-- ---------------------------------------------------------------------------
-- Organizer-only wishlist completion overview, keyed by roster member.
-- ---------------------------------------------------------------------------
create function public.event_wishlist_status(p_event_id uuid)
returns table (
  member_id uuid,
  display_name text,
  user_id uuid,
  has_wishlist boolean,
  is_published boolean,
  item_count bigint,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_event_organizer(p_event_id) then
    raise exception 'Only the organizer can see wishlist progress.';
  end if;

  return query
  select
    m.id,
    m.display_name,
    m.user_id,
    (w.id is not null),
    coalesce(w.is_published, false),
    coalesce((select count(*) from public.wishlist_items wi where wi.wishlist_id = w.id), 0),
    w.updated_at
  from public.event_members m
  left join public.wishlists w
    on w.event_id = m.event_id and w.user_id = m.user_id
  where m.event_id = p_event_id
  order by m.created_at, m.display_name;
end;
$$;

-- ---------------------------------------------------------------------------
-- The signed-in giver's own assignment, with recipient wishlist metadata.
-- ---------------------------------------------------------------------------
create function public.my_assignment(p_event_id uuid)
returns table (
  assignment_id uuid,
  recipient_member_id uuid,
  recipient_name text,
  recipient_user_id uuid,
  recipient_avatar_url text,
  wishlist_published boolean,
  wishlist_item_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.id,
    recipient.id,
    recipient.display_name,
    recipient.user_id,
    p.avatar_url,
    coalesce(w.is_published, false),
    coalesce((select count(*) from public.wishlist_items wi where wi.wishlist_id = w.id), 0)
  from public.assignments a
  join public.event_members giver on giver.id = a.giver_member_id
  join public.event_members recipient on recipient.id = a.recipient_member_id
  left join public.profiles p on p.id = recipient.user_id
  left join public.wishlists w
    on w.event_id = a.event_id and w.user_id = recipient.user_id
  where a.event_id = p_event_id
    and giver.user_id = auth.uid()
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Anonymous personal-link view. The secret token is the only credential.
-- Returns the event summary, the member it belongs to, and — once drawn — that
-- member's recipient plus the recipient's wishlist. Never any other assignment.
-- ---------------------------------------------------------------------------
create function public.member_view(p_token text)
returns table (
  event_id uuid,
  event_name text,
  event_status public.event_status,
  party_date date,
  gift_budget numeric,
  currency text,
  wishlist_deadline date,
  instructions text,
  organizer_name text,
  member_id uuid,
  member_name text,
  claimed boolean,
  drawn boolean,
  recipient_member_id uuid,
  recipient_name text,
  recipient_user_id uuid,
  recipient_avatar_url text,
  recipient_wishlist_published boolean,
  recipient_wishlist_items jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    e.id,
    e.name,
    e.status,
    e.party_date,
    e.gift_budget,
    e.currency,
    e.wishlist_deadline,
    e.instructions,
    coalesce(org.full_name, 'The organizer'),
    m.id,
    m.display_name,
    (m.user_id is not null),
    exists (select 1 from public.assignments a where a.event_id = e.id),
    recipient.id,
    recipient.display_name,
    recipient.user_id,
    recipient_profile.avatar_url,
    coalesce(w.is_published, false),
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', wi.id,
            'wishlist_id', wi.wishlist_id,
            'title', wi.title,
            'details', wi.details,
            'product_url', wi.product_url,
            'color', wi.color,
            'size', wi.size,
            'price', wi.price,
            'notes', wi.notes,
            'priority', wi.priority,
            'created_at', wi.created_at,
            'updated_at', wi.updated_at
          )
          order by wi.priority, wi.created_at
        )
        from public.wishlist_items wi
        where wi.wishlist_id = w.id
      ),
      '[]'::jsonb
    )
  from public.event_member_tokens t
  join public.event_members m on m.id = t.member_id
  join public.events e on e.id = t.event_id
  left join public.profiles org on org.id = e.organizer_id
  left join public.assignments a
    on a.event_id = e.id and a.giver_member_id = m.id
  left join public.event_members recipient on recipient.id = a.recipient_member_id
  left join public.profiles recipient_profile on recipient_profile.id = recipient.user_id
  left join public.wishlists w
    on w.event_id = e.id and w.user_id = recipient.user_id
  where t.token = trim(p_token)
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Execution grants
-- ---------------------------------------------------------------------------
revoke all on function public.preview_event(text) from public;
revoke all on function public.claim_member(uuid) from public;
revoke all on function public.member_view(text) from public;
revoke all on function public.my_assignment(uuid) from public;
revoke all on function public.draw_event(uuid) from public;
revoke all on function public.draw_by_token(text) from public;
revoke all on function public.perform_event_draw(uuid) from public, anon, authenticated;
revoke all on function public.reset_draw(uuid, text) from public;
revoke all on function public.announce_event(uuid, text, text) from public;
revoke all on function public.notify_event_update(uuid, text) from public;
revoke all on function public.touch_wishlist(uuid, boolean) from public;
revoke all on function public.event_wishlist_status(uuid) from public;
revoke all on function public.is_event_member(uuid) from public;
revoke all on function public.is_event_organizer(uuid) from public;
revoke all on function public.can_view_wishlist(uuid, uuid) from public;
revoke all on function public.event_has_draw(uuid) from public;

grant execute on function public.preview_event(text) to anon, authenticated;
grant execute on function public.claim_member(uuid) to authenticated;
grant execute on function public.member_view(text) to anon, authenticated;
grant execute on function public.my_assignment(uuid) to authenticated;
grant execute on function public.draw_event(uuid) to authenticated;
grant execute on function public.draw_by_token(text) to anon, authenticated;
grant execute on function public.reset_draw(uuid, text) to authenticated;
grant execute on function public.announce_event(uuid, text, text) to authenticated;
grant execute on function public.notify_event_update(uuid, text) to authenticated;
grant execute on function public.touch_wishlist(uuid, boolean) to authenticated;
grant execute on function public.event_wishlist_status(uuid) to authenticated;
grant execute on function public.is_event_member(uuid) to authenticated;
grant execute on function public.is_event_organizer(uuid) to authenticated;
grant execute on function public.can_view_wishlist(uuid, uuid) to authenticated;
grant execute on function public.event_has_draw(uuid) to authenticated;

-- Personal tokens are organizer-only data, even at the table-privilege layer.
revoke all on public.event_member_tokens from anon, authenticated;
grant select on public.event_member_tokens to authenticated;

-- Keep helper internals off the public API surface.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.touch_updated_at() from public, anon, authenticated;
revoke all on function public.create_member_token() from public, anon, authenticated;

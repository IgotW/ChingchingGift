# ChingChingGift

A polished Christmas gift-exchange app: create an exchange, invite guests with a link or code, draw names fairly, share wishlists privately, and keep every assignment secret. Built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, and Supabase.

## Features

- **Google-only, passwordless auth** — verified email, automatic profile, one-click sign-out.
- **Events** — name, description, party date, budget, registration and wishlist deadlines, instructions, and status.
- **Invitations** — shareable link and short code. Guests preview the event before joining and join only once.
- **Fair, final draw** — one recipient per giver, no self-assignments, no duplicate recipients, minimum two confirmed participants. Optional directional exclusions let the organizer stop specific people from drawing each other (for example, partners or roommates). Runs atomically inside a locked Postgres transaction. Repeated requests cannot draw twice.
- **Private assignments** — each giver sees only their own recipient. Organizers cannot read assignments by default.
- **Wishlists** — multiple items with title, details, product link, colour, size, price, priority, and notes. Visible only to the owner and their assigned giver. Publish, edit, and remove at any time until the event is completed.
- **Notifications** — in-app notifications for the draw, wishlist updates, announcements, new guests, and event changes. Wishlist updates are merged by the database within 30 minutes so rapid edits do not flood the giver.
- **Organizer tools** — participant confirmation/removal, directional draw exclusions, wishlist progress, deadlines, announcements, draw controls, a controlled draw reset, event completion, and an audit trail.
- **Optional email** — Brevo transactional email for wishlist updates through a server-only service-role client. The app works fully without it.
- **Responsive, festive UI** — cream, pine, holly, and gold theme with accessible components and skeleton loading states.

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Cache Components, Partial Prefetching) |
| UI | React 19, TypeScript, Tailwind CSS 4 |
| Auth & data | Supabase (Postgres, RLS, RPC, Google OAuth) |
| Email (optional) | Brevo |
| Hosting | Vercel or any Node.js host |

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it. The script is safe to re-run.
3. Copy your project URL and publishable (anon) key from **Project Settings → API**.

### 3. Configure Google sign-in

In **Supabase → Authentication → Providers → Google**:

1. Enable Google.
2. Add your Google OAuth **Client ID** and **Client Secret**.
3. In **Google Cloud Console → APIs & Services → Credentials**, create an OAuth 2.0 Client ID of type *Web application*.
4. Add this **Authorized redirect URI** (replace the project ref):

```text
https://<project-ref>.supabase.co/auth/v1/callback
```

5. In **Supabase → Authentication → URL Configuration**, set the Site URL and add redirect URLs for local and production:

```text
http://localhost:3000/auth/callback
https://your-domain.com/auth/callback
```

### 4. Add environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable/anon key (safe for the browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Server-only key for optional email recipient lookup. **Never expose it to the client.** |
| `BREVO_API_KEY` | No | Enables transactional email |
| `BREVO_SENDER_EMAIL` | No | Verified Brevo sender address |
| `BREVO_SENDER_NAME` | No | Sender display name |
| `NEXT_PUBLIC_SITE_URL` | No | Absolute URL used in invite links and emails. Defaults to `http://localhost:3000`. |

Legacy `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` names are also accepted.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If Supabase is not configured yet, the app boots into a friendly `/setup` screen instead of crashing.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build with TypeScript checks |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |

## How it works

### The draw

`public.draw_event(p_event_id uuid)` runs in Postgres as a `security definer` function:

1. Locks the event row with `SELECT … FOR UPDATE`.
2. Rejects anyone who is not the organizer or when a draw already exists.
3. Requires the event to be `registration_closed` and at least two confirmed participants.
4. Uses **Sattolo's algorithm** to produce a single-cycle permutation — every giver gets exactly one recipient, nobody draws themselves, and every participant receives exactly one gift.
5. When the organizer added draw exclusions, first retries random single-cycle draws that avoid them, then falls back to a randomised perfect-matching search. If no assignment satisfies every rule, the draw stops with a clear message instead of creating an unfair result.
6. Inserts all assignments and marks the event `drawn` in one transaction.
7. Creates a private `draw_ready` notification for each confirmed participant and writes an audit entry.

Unique constraints on `(event_id, giver_id)` and `(event_id, recipient_id)` are a second line of defence.

### Draw exclusions

Organizers can add directional exclusions before the draw: "A cannot draw B". Opposite pairs are stored as two rows, so a mutual exclusion ("A cannot draw B and B cannot draw A") and a one-way exclusion ("A cannot draw B, but B can draw A") are both supported. Exclusions use roster member ids, are locked once names are drawn, and are deleted automatically when someone leaves the roster.

### Privacy model

- **RLS everywhere.** Every table is protected by row-level security.
- **Assignments** are readable only by the giver (`giver_id = auth.uid()`). There are no client insert/update/delete policies — the draw only happens through the RPC.
- **Wishlists** are readable by the owner or the one assigned giver via `can_view_wishlist`. Organizers can see completion status through `event_wishlist_status`, but not item contents.
- **Notifications** are readable and updatable only by their owner. Cross-user notifications are inserted by `security definer` functions.
- **Server actions** re-check the session, organizer role, and event status on every mutation. Client-side checks are treated as progressive enhancement only.
- **Secrets** stay server-side. The service-role key is only read in server code for optional email delivery.

### Statuses

```text
upcoming → registration_closed → drawn → completed
                 ↑                 │
                 └──── reset ──────┘
```

- `upcoming`: guests can join.
- `registration_closed`: guest list locked, draw available.
- `drawn`: assignments are final and private.
- `completed`: preserved as history; editing and resets are disabled.

### Controlled reset

A draw can only be reset by the organizer, only from the manage page, and only after typing the event name exactly. Reset deletes assignments and draw-related notifications, clears `drawn_at`, and returns the event to `registration_closed`.

## Project structure

```text
app/
  page.tsx                     Landing page
  login/                       Google sign-in
  auth/callback/route.ts       OAuth code exchange
  auth/auth-code-error/        Friendly sign-in failure
  auth/signout/route.ts        Sign-out
  setup/                       Supabase setup instructions
  dashboard/                   Personal exchanges and quick join
  events/new/                  Create an exchange
  events/[id]/                 Event detail
  events/[id]/wishlist/        Owner wishlist editor
  events/[id]/draw/            Private assignment reveal
  events/[id]/recipient/       Recipient profile and read-only wishlist
  events/[id]/manage/          Organizer tools
  join/                        Join with a code
  join/[code]/                 Public invitation preview
  notifications/               Notification inbox
  profile/                     Profile and account
components/                    Shared UI and form components
lib/
  actions/                     Server actions (events, wishlist, account)
  auth.ts                      Session and profile helpers
  data.ts                      Typed data access
  email.ts                     Optional Brevo delivery
  format.ts                    Dates, money, status labels
  validation.ts                Input parsing and safe redirects
  supabase/                    Browser, server, and admin clients
supabase/schema.sql            Schema, RLS, RPCs, triggers, grants
proxy.ts                       Session refresh and route protection
```

## Optional email

Email is best-effort and never blocks an action. To enable it, set `SUPABASE_SERVICE_ROLE_KEY`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, and `BREVO_SENDER_NAME`. The server looks up the assigned giver on the server only, renders a small HTML email, and sends it after the response using Next.js `after()`. Without these variables, notifications remain in-app.

## Security notes

- Never commit `.env.local` or the service-role key.
- Keep the Supabase redirect allow-list narrow.
- Run `supabase/schema.sql` in a fresh project before inviting real users.
- The app uses `security definer` functions with `set search_path = public` to avoid search-path attacks.
- Helper functions used internally are revoked from `public`, `anon`, and `authenticated`.

## License

Private project. All rights reserved.

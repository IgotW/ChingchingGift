import { getSiteUrl } from "@/lib/supabase/config";

export function GET() {
  const siteUrl = getSiteUrl();

  const body = `# ChingChingGift

> ChingChingGift is a free online Secret Santa and Christmas gift exchange organizer. It draws names fairly, keeps every assignment secret, and gives each participant a private wishlist their Secret Santa can shop from.

Canonical: ${siteUrl}
Sitemap: ${siteUrl}/sitemap.xml

## What it does

- Creates a Secret Santa, Christmas gift exchange, office gift exchange, or white elephant event.
- Draws names in a complete one-to-one loop. Every participant gives one gift and receives one gift. Nobody draws themselves.
- Lets the organizer add directional draw exclusions, such as "Juan cannot draw Pedro" or "Ruz cannot draw Santos", including mutual pairs.
- Keeps assignments private at the database level. The organizer cannot see who got whom.
- Lets participants build a wishlist with gift ideas, links, colors, sizes, prices, priorities, and notes.
- Publishes wishlists only to the assigned Secret Santa when the owner is ready.
- Sends a private notification when a recipient updates a published wishlist.
- Works in the browser with Google sign-in. No spreadsheet and no app install.

## Who it is for

Families, friend groups, offices, classrooms, clubs, and any group organizing a Christmas exchange or Secret Santa.

## Key facts

- Price: free.
- Platform: web.
- Sign-in: Google, passwordless.
- Minimum group size for a draw: two confirmed participants.
- Draw fairness: one recipient per giver, no duplicate recipients, no self-assignments.
- Privacy: each participant can see only their own assignment. Wishlists are visible to the owner and their assigned Secret Santa after publishing.
- Organizer tools: roster, invitation link and code, join status, wishlist progress, draw, reset, and completion.

## Frequently asked questions

### What is ChingChingGift?
ChingChingGift is a free online Secret Santa and Christmas gift exchange organizer. It draws names fairly, keeps every assignment secret, and gives each participant a private wishlist their Secret Santa can shop from.

### How does the Secret Santa draw work?
Once at least two people have joined, anyone in the exchange can run the draw. The app creates a complete one-to-one loop: every participant gives one gift and receives one gift, and nobody is assigned to themselves.

### Can the organizer see who got whom?
No. Assignments are protected by database-level rules. Each participant can only see their own recipient, even if the organizer created the exchange.

### Is ChingChingGift free?
Yes. You can create an exchange, invite your group, draw names, and share wishlists without paying.

### Do participants need an account?
Participants sign in with Google to claim their name and manage a wishlist. The organizer can also share a private reveal link so each person can view their assignment without hunting for the dashboard.

### Can I use it for an office party or white elephant exchange?
Yes. ChingChingGift works for family Christmases, friend groups, office parties, classrooms, and white elephant exchanges. Set a gift budget, add everyone to the roster, and share one invite link.

### How private are the wishlists?
Wishlists are visible only to the owner and their assigned Secret Santa after the owner publishes them. Drafts stay private, and the organizer cannot browse anyone's list.

### Do I need a spreadsheet or an app?
No spreadsheet and no app install. ChingChingGift runs in your browser and keeps the roster, draw, assignments, and wishlists in one place.

## Start

Homepage: ${siteUrl}/
Create an exchange: ${siteUrl}/login
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

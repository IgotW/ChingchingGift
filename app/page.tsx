import type { Metadata } from "next";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  JsonLd,
  SITE_DESCRIPTION,
  faqJsonLd,
  softwareApplicationJsonLd,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    absolute: "ChingChingGift — Free Secret Santa Generator & Gift Exchange",
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    url: "/",
    title: "ChingChingGift — Free Secret Santa Generator & Gift Exchange",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    title: "ChingChingGift — Free Secret Santa Generator & Gift Exchange",
    description: SITE_DESCRIPTION,
  },
};

const faqs = [
  {
    question: "What is ChingChingGift?",
    answer:
      "ChingChingGift is a free online Secret Santa and Christmas gift exchange organizer. It draws names fairly, keeps every assignment secret, and gives each participant a private wishlist their Secret Santa can shop from.",
  },
  {
    question: "How does the Secret Santa draw work?",
    answer:
      "Once at least two people have joined, anyone in the exchange can run the draw. The app creates a complete one-to-one loop: every participant gives one gift and receives one gift, and nobody is assigned to themselves.",
  },
  {
    question: "Can the organizer see who got whom?",
    answer:
      "No. Assignments are protected by database-level rules. Each participant can only see their own recipient, even if the organizer created the exchange.",
  },
  {
    question: "Is ChingChingGift free?",
    answer:
      "Yes. You can create an exchange, invite your group, draw names, and share wishlists without paying.",
  },
  {
    question: "Do participants need an account?",
    answer:
      "Participants sign in with Google to claim their name and manage a wishlist. The organizer can also share a private reveal link so each person can view their assignment without hunting for the dashboard.",
  },
  {
    question: "Can I use it for an office party or white elephant exchange?",
    answer:
      "Yes. ChingChingGift works for family Christmases, friend groups, office parties, classrooms, and white elephant exchanges. Set a gift budget, add everyone to the roster, and share one invite link.",
  },
  {
    question: "How private are the wishlists?",
    answer:
      "Wishlists are visible only to the owner and their assigned Secret Santa after the owner publishes them. Drafts stay private, and the organizer cannot browse anyone's list.",
  },
  {
    question: "Do I need a spreadsheet or an app?",
    answer:
      "No spreadsheet and no app install. ChingChingGift runs in your browser and keeps the roster, draw, assignments, and wishlists in one place.",
  },
];

const steps = [
  {
    number: "01",
    title: "Set the scene",
    body: "Name your exchange, set a gift budget, and pick the party date. Share one invitation link.",
  },
  {
    number: "02",
    title: "Gather the wishlists",
    body: "Everyone adds the gifts they would love. Only their Secret Santa can see the list.",
  },
  {
    number: "03",
    title: "Draw, secretly",
    body: "One tap creates a fair, complete draw. Nobody draws themselves and no gift-giver is revealed.",
  },
];

const features = [
  {
    title: "Fair by design",
    body: "Every participant gives to exactly one person and receives from exactly one person. Self-assignments are mathematically impossible.",
    icon: "draw",
  },
  {
    title: "Secret, actually",
    body: "Assignments are protected by database-level rules. Even the organizer cannot peek at who got whom.",
    icon: "lock",
  },
  {
    title: "Wishlists that update",
    body: "Gift ideas live beside the draw. When a recipient updates their list, their Secret Santa gets a private nudge.",
    icon: "gift",
  },
  {
    title: "Organizer calm",
    body: "See who joined, who finished their wishlist, and who is still deciding — without spoiling a single surprise.",
    icon: "list",
  },
];

function FeatureIcon({ name }: { name: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true" {...common}>
      {name === "draw" ? (
        <>
          <path d="M4 7h16M4 12h16M4 17h16" />
          <circle cx="8" cy="7" r="2" />
          <circle cx="15" cy="12" r="2" />
          <circle cx="10" cy="17" r="2" />
        </>
      ) : null}
      {name === "lock" ? (
        <>
          <rect x="4.5" y="10" width="15" height="10" rx="2" />
          <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
          <path d="M12 14v2" />
        </>
      ) : null}
      {name === "gift" ? (
        <>
          <rect x="4" y="9.5" width="16" height="10.5" rx="1.5" />
          <path d="M3 9.5h18M12 9.5V20" />
          <path d="M12 9.5C9.8 9.5 8 8.2 8 6.7 8 5.5 8.9 4.7 10 4.7c1.6 0 2 2 2 4.8Z" />
          <path d="M12 9.5c2.2 0 4-1.3 4-2.8 0-1.2-.9-2-2-2-1.6 0-2 2-2 4.8Z" />
        </>
      ) : null}
      {name === "list" ? (
        <>
          <path d="M5 5h14v14H5z" />
          <path d="M8.5 9h7M8.5 12h7M8.5 15h4" />
        </>
      ) : null}
    </svg>
  );
}

export default function Home() {
  const configured = isSupabaseConfigured();

  return (
    <div className="flex flex-col">
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd data={faqJsonLd(faqs)} />
      {!configured ? (
        <div className="border-b border-gold-500/30 bg-gold-100/70">
          <div className="container-page flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
            <p className="font-medium text-pine-900">
              This build is not connected to Supabase yet.
            </p>
            <Link href="/setup" className="link">
              Open the 3-minute setup guide →
            </Link>
          </div>
        </div>
      ) : null}

      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-10 size-72 rounded-full bg-gold-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-32 size-80 rounded-full bg-pine-700/10 blur-3xl" />
        <div className="container-page relative grid gap-14 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
          <div>
            <span className="chip bg-gold-100 text-gold-500 shadow-none">
              <span className="size-1.5 rounded-full bg-gold-500" />
              Christmas exchanges, minus the spreadsheet
            </span>
            <h1 className="mt-6 max-w-2xl font-display text-5xl leading-[1.02] text-pine-950 sm:text-6xl lg:text-7xl">
              Swap gifts.
              <br />
              <span className="text-holly-600">Keep the secret.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              ChingChingGift draws names fairly, keeps every assignment
              confidential, and puts each person&apos;s wishlist exactly where
              their Secret Santa needs it.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/login" className="btn btn-primary px-6 py-3 text-base">
                Start a Christmas exchange
              </Link>
              <Link
                href="/join"
                className="btn btn-secondary px-6 py-3 text-base"
              >
                I have an invite code
              </Link>
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm text-muted">
              <svg
                viewBox="0 0 24 24"
                className="size-4 text-pine-700"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              Passwordless Google sign-in · No app to install
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="animate-float absolute -right-3 -top-6 z-20 rotate-6 rounded-2xl border border-cream-200 bg-white px-4 py-3 shadow-xl">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-muted">
                Your Secret Santa
              </p>
              <p className="mt-1 font-display text-xl text-pine-900">
                Carla 🎁
              </p>
              <p className="text-xs text-muted">Wishlist updated 2h ago</p>
            </div>

            <div className="card relative z-10 overflow-hidden p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-muted">
                    Office Christmas
                  </p>
                  <h2 className="mt-1 font-display text-2xl text-pine-950">
                    Deck the Desks
                  </h2>
                </div>
                <span className="chip bg-pine-100 text-pine-800 shadow-none">
                  Names drawn
                </span>
              </div>

              <div className="mt-6 space-y-2.5">
                {[
                  ["Ana", "Carla"],
                  ["Ben", "Ella"],
                  ["Carla", "David"],
                  ["David", "Ana"],
                  ["Ella", "Ben"],
                ].map(([giver], index) => (
                  <div
                    key={giver}
                    className="flex items-center gap-3 rounded-xl border border-cream-200 bg-cream-50/70 px-3 py-2.5"
                  >
                    <span className="grid size-7 place-items-center rounded-full bg-pine-900 text-[0.62rem] font-bold text-cream-50">
                      {giver[0]}
                    </span>
                    <span className="text-sm font-medium text-ink">
                      {index === 2 ? "You" : giver}
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      className="size-4 text-muted"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                    <span
                      className={`text-sm ${index === 2 ? "font-semibold text-holly-600" : "text-muted"}`}
                    >
                      {index === 2 ? "David (secret)" : "•••••"}
                    </span>
                    <span className="ml-auto text-[0.62rem] font-semibold uppercase tracking-wide text-muted">
                      sealed
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl bg-pine-900 p-4 text-cream-50">
                <p className="text-xs uppercase tracking-[0.14em] text-cream-300">
                  Wishlist shared privately
                </p>
                <p className="mt-1 text-sm leading-relaxed">
                  “A cozy navy scarf, a good notebook, or anything for slow
                  Sunday mornings.”
                </p>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-4 z-20 -rotate-3 rounded-2xl border border-cream-200 bg-white px-4 py-3 shadow-xl">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-muted">
                Wishlist progress
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-2 w-28 overflow-hidden rounded-full bg-cream-200">
                  <div className="h-full w-4/5 rounded-full bg-pine-700" />
                </div>
                <span className="text-xs font-semibold text-pine-800">4 / 5</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-cream-200 bg-white/60">
        <div className="container-page grid gap-8 py-14 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="relative pl-14">
              <span className="absolute left-0 top-0 font-display text-3xl text-gold-500">
                {step.number}
              </span>
              <h2 className="text-lg font-semibold text-pine-950">
                {step.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-16 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="chip bg-holly-100 text-holly-700 shadow-none">
            Built for the whole group
          </span>
          <h2 className="mt-5 font-display text-4xl text-pine-950 sm:text-5xl">
            The joyful bits, without the admin
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Everything a Christmas exchange needs, and nothing that spoils the
            surprise.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.title} className="card p-6 sm:p-7">
              <span className="grid size-11 place-items-center rounded-xl bg-pine-100 text-pine-800">
                <FeatureIcon name={feature.icon} />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-pine-950">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page pb-16 lg:pb-20" aria-labelledby="faq-heading">
        <div className="mx-auto max-w-2xl text-center">
          <span className="chip bg-gold-100 text-gold-500 shadow-none">
            Good to know
          </span>
          <h2
            id="faq-heading"
            className="mt-5 font-display text-4xl text-pine-950 sm:text-5xl"
          >
            Secret Santa questions, answered
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Everything you need to know before you draw names.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl divide-y divide-cream-200 overflow-hidden rounded-2xl border border-cream-200 bg-white/70">
          {faqs.map((faq) => (
            <details key={faq.question} className="group px-5 py-4 sm:px-7 sm:py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-semibold text-pine-950">
                {faq.question}
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-pine-100 text-pine-800 transition-transform group-open:rotate-45">
                  <svg
                    viewBox="0 0 24 24"
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="container-page pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-pine-950 px-6 py-12 text-center text-cream-50 sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -left-10 -top-10 size-48 rounded-full bg-gold-400/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 right-0 size-64 rounded-full bg-holly-600/20 blur-3xl" />
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-gold-400">
            Ready when you are
          </p>
          <h2 className="mx-auto mt-4 max-w-xl font-display text-4xl leading-tight sm:text-5xl">
            Your best Christmas exchange starts with one link.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-cream-200/80">
            Create an event in under a minute. Everyone else just signs in,
            joins, and starts dreaming up gift ideas.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/login" className="btn btn-primary px-6 py-3 text-base">
              Create your exchange
            </Link>
            <Link
              href="/join"
              className="btn px-6 py-3 text-base text-cream-50 ring-1 ring-inset ring-cream-50/30 hover:bg-white/10"
            >
              Join with a code
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

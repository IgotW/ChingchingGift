import type { Metadata } from "next";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";

export const metadata: Metadata = {
  title: "Setup",
};

const envVars = `NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key

# Optional: enables wishlist notification emails
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=hello@your-domain.com
BREVO_SENDER_NAME=ChingChingGift

# Used in email links
NEXT_PUBLIC_SITE_URL=http://localhost:3000`;

export default function SetupPage() {
  return (
    <div className="container-page max-w-3xl py-14 lg:py-20">
      <span className="chip bg-gold-100 text-gold-500 shadow-none">
        <span className="size-1.5 rounded-full bg-gold-500" />
        Connect your own backend
      </span>
      <h1 className="mt-5 font-display text-4xl text-pine-950 sm:text-5xl">
        Three steps to a working exchange
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-muted">
        ChingChingGift runs on your own Supabase project. The app is fully
        built — it just needs a database, Google sign-in, and a couple of
        environment variables.
      </p>

      <ol className="mt-10 space-y-6">
        <li className="card p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-holly-600">
            Step 1
          </p>
          <h2 className="mt-1 text-xl font-semibold text-pine-950">
            Create a Supabase project
          </h2>
          <p className="prose-note mt-2">
            Create a free project at{" "}
            <a
              className="link"
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
            >
              supabase.com/dashboard
            </a>
            . Then open the SQL editor and run the contents of{" "}
            <code className="rounded bg-cream-100 px-1.5 py-0.5 font-mono text-[0.8em] text-pine-900">
              supabase/schema.sql
            </code>
            . It creates every table, the private-access rules, and the
            transactional draw function.
          </p>
        </li>

        <li className="card p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-holly-600">
            Step 2
          </p>
          <h2 className="mt-1 text-xl font-semibold text-pine-950">
            Turn on Google sign-in
          </h2>
          <p className="prose-note mt-2">
            In Supabase, go to Authentication → Providers → Google, add your
            Google OAuth client ID and secret, and enable the provider. In
            Google Cloud Console, add the Supabase callback as an authorized
            redirect URI:
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-cream-100 px-3 py-2">
            <code className="flex-1 break-all font-mono text-xs text-pine-900">
              https://&lt;project-ref&gt;.supabase.co/auth/v1/callback
            </code>
          </div>
          <p className="prose-note mt-3">
            Then, under Supabase → Authentication → URL Configuration, add this
            redirect URL for the app itself:
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-cream-100 px-3 py-2">
            <code className="flex-1 break-all font-mono text-xs text-pine-900">
              http://localhost:3000/auth/callback
            </code>
            <CopyButton value="http://localhost:3000/auth/callback" />
          </div>
          <p className="prose-note mt-2">
            Add your production URL&apos;s <code>/auth/callback</code> as well.
          </p>
        </li>

        <li className="card p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-holly-600">
            Step 3
          </p>
          <h2 className="mt-1 text-xl font-semibold text-pine-950">
            Add the environment variables
          </h2>
          <p className="prose-note mt-2">
            Copy the URL and publishable key from Supabase → Project Settings →
            API Keys into <code>.env.local</code>. Restart the dev server.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-pine-950 p-4 text-xs leading-relaxed text-cream-100">
            <code>{envVars}</code>
          </pre>
          <p className="prose-note mt-3">
            Email notifications are optional. They light up automatically once
            the service-role and Brevo keys are present; in-app notifications
            work either way.
          </p>
        </li>
      </ol>

      <div className="mt-10 rounded-2xl border border-pine-600/20 bg-pine-100/60 p-5 text-sm leading-relaxed text-pine-900">
        <strong className="font-semibold">Security note:</strong> the
        service-role key is only read on the server, never sent to the browser.
        Without it, the app still works — only wishlist notification emails are
        skipped.
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="btn btn-secondary">
          Back to home
        </Link>
        <Link href="/login" className="btn btn-primary">
          Try signing in
        </Link>
      </div>
    </div>
  );
}

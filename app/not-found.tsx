import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex flex-1 items-center justify-center py-20">
      <div className="card w-full max-w-lg p-8 text-center">
        <p className="font-display text-6xl text-gold-500">404</p>
        <h1 className="mt-3 font-display text-3xl text-pine-950">
          This page went caroling
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          We could not find what you were looking for. It may have been removed,
          or you might not have access to it.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/dashboard" className="btn btn-primary">
            Go to dashboard
          </Link>
          <Link href="/" className="btn btn-secondary">
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}

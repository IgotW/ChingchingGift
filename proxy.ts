import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/events",
  "/notifications",
  "/profile",
];

const PRIVATE_PATHS = [
  "/dashboard",
  "/events",
  "/notifications",
  "/profile",
  "/login",
  "/setup",
  "/auth",
  "/join",
  "/claim",
];

const TOKEN_PATHS = ["/join/", "/claim/"];

const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX_JOIN = 120;
const RATE_MAX_CLAIM = 120;

const buckets = new Map<string, { count: number; resetAt: number }>();

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

function isPrivate(pathname: string) {
  return (
    PRIVATE_PATHS.includes(pathname) ||
    PRIVATE_PATHS.some((prefix) => pathname.startsWith(`${prefix}/`))
  );
}

function isTokenPath(pathname: string) {
  return TOKEN_PATHS.some(
    (prefix) => pathname === prefix.slice(0, -1) || pathname.startsWith(prefix),
  );
}

function clientKey(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return ip;
}

function rateLimit(key: string, max: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  if (bucket.count >= max) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true, retryAfter: 0 };
}

function applyPrivateHeaders(response: NextResponse, pathname: string) {
  if (!isPrivate(pathname)) return response;

  response.headers.set(
    "Cache-Control",
    "private, no-store, max-age=0, must-revalidate",
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set(
    "X-Robots-Tag",
    "noindex, nofollow, noarchive, nosnippet",
  );

  if (isTokenPath(pathname)) {
    response.headers.set("Referrer-Policy", "no-referrer");
  }

  return response;
}

/**
 * Refreshes the Supabase session on every navigation and keeps signed-out
 * visitors away from private pages. Authorization itself still lives in the
 * data layer and row-level security — this is only the first gate.
 *
 * Private, invite, and token responses are marked no-store and noindex so a
 * shared browser, CDN, or search crawler cannot retain them.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const limiter = pathname.startsWith("/join")
    ? rateLimit(`join:${clientKey(request)}`, RATE_MAX_JOIN)
    : pathname.startsWith("/claim")
      ? rateLimit(`claim:${clientKey(request)}`, RATE_MAX_CLAIM)
      : null;

  if (limiter && !limiter.allowed) {
    return applyPrivateHeaders(
      new NextResponse("Too many requests. Please try again later.", {
        status: 429,
        headers: {
          "Retry-After": String(limiter.retryAfter),
          "Content-Type": "text/plain; charset=utf-8",
        },
      }),
      pathname,
    );
  }

  const config = getSupabaseConfig();
  if (!config) {
    return applyPrivateHeaders(NextResponse.next(), pathname);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase being unreachable should not hard-fail the page; the page-level
    // guard will redirect to sign-in if needed.
  }

  if (!user && isProtected(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", `${pathname}${search}`);
    return applyPrivateHeaders(NextResponse.redirect(url), pathname);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return applyPrivateHeaders(NextResponse.redirect(url), pathname);
  }

  return applyPrivateHeaders(response, pathname);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};

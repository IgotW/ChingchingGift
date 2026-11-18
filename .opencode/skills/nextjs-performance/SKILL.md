---
name: Next.js Performance
description: Use when optimizing Next.js 16 App Router performance in this project, including Server Components, client boundaries, caching, streaming, images, fonts, bundle size, route rendering, and Core Web Vitals.
---

# Next.js Performance (App Router)

Apply these practices when investigating or improving performance in this ChingChingGift codebase.

## Stack context
- Next.js 16 (App Router, Turbopack, Cache Components/PPR-capable setup) with React 19
- Server-first by default; prefer Server Components and push `"use client"` to the smallest leaf components
- Supabase accessed via server helpers/actions; avoid leaking secrets to the client

## Workflow
1. **Measure first**: identify slow routes/actions (dev server output, React/Next diagnostics, `next build` output, browser network/waterfall, Web Vitals). Fix the biggest bottleneck.
2. **Reduce client JS**: keep components server-rendered unless they need state, effects, browser APIs, or event handlers. Split large client islands; avoid making layouts/pages client components.
3. **Avoid waterfalls**: fetch independent data in parallel (`Promise.all`), move data access close to where it's used, and use Suspense boundaries to stream slow sections without blocking the whole page.
4. **Caching & revalidation**: use Next.js data/cache primitives appropriately. Prefer stable, cacheable reads for shared/public data; revalidate or avoid caching for per-user/private data. Call `revalidatePath`/tag revalidation after mutations in server actions.
5. **Rendering strategy**: choose static/dynamic per route intentionally. Don't mark routes dynamic unnecessarily; don't cache user-specific responses.
6. **Assets**: use `next/image` with correct `sizes` for responsive images, optimize formats, and lazy-load below-the-fold media. Use `next/font` to avoid layout shift and extra requests.
7. **Bundles**: avoid heavy client dependencies, import only what's needed, prefer server-side processing, and lazy-load rarely used client features with dynamic import when appropriate.
8. **Lists & UI**: render only what's needed, avoid expensive recalculations in render, memoize carefully (not by default), and keep props stable for hot client trees.

## Checks for this repo
- `app/**/page.tsx` and layouts: confirm they stay server components unless required; wrap async sections in `<Suspense>` with lightweight fallbacks where it improves TTFB/LCP.
- `lib/data.ts` / server actions: batch queries, avoid N+1 patterns, select only needed columns, and ensure auth/permission checks don't add redundant round trips.
- Verify no unnecessary client-side fetching for data that can be rendered on the server.
- Run `npm run lint` and `npm run build` to catch regressions and inspect route/output sizes.

## Output expectations
When proposing changes, explain the expected impact (less JS, fewer requests, faster LCP/TTFB/INP), note tradeoffs, and keep behavior and privacy guarantees intact.

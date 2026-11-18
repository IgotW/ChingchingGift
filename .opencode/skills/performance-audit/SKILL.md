---
name: Performance Audit
description: Use when asked to audit or profile end-to-end performance of this ChingChingGift app, find bottlenecks across UI, Next.js server/client rendering, and Supabase data access, and propose prioritized fixes.
---

# Performance Audit (ChingChingGift)

Perform a focused, evidence-based audit of this repository's performance.

## Audit checklist

### 1. Frontend / Next.js
- Identify routes with heavy client bundles or unnecessary `"use client"` boundaries.
- Check for render waterfalls, missing/overused Suspense, and blocking data fetches in layouts/pages.
- Look for large images, missing `next/image` optimization, font/layout shift issues, and expensive list rendering.
- Confirm per-user/private pages are not accidentally statically cached; confirm cacheable content benefits from caching/revalidation.

### 2. Data & server layer
- Inspect `lib/data.ts` and `lib/actions/**` for N+1 queries, duplicate fetches per request, over-wide `select` clauses, and avoidable sequential awaits.
- Review server actions for unnecessary `revalidatePath` breadth or repeated work.
- Check API/RPC usage patterns: payload size, frequency, and error/retry behavior.

### 3. Database (Supabase/Postgres)
- Review `supabase/schema.sql` for missing indexes on foreign keys and common predicates (event/member/token/assignment lookups), expensive RLS policies, and function/query shapes.
- Validate transactional functions (draw, claim/reveal, wishlist updates) are atomic and race-safe without excessive locking.
- Ensure privacy constraints hold: optimizations must not expose assignments/recipients.

### 4. Build & runtime signals
- Use `npm run lint` and `npm run build` (from `chingchinggift/`) to gather warnings, type issues, and route/build output.
- Note largest routes/chunks and obvious dependency weight contributors.

## Reporting format
Provide:
1. **Top bottlenecks** (highest impact first) with file/line or function references.
2. **Recommended fixes** with rationale, expected impact, risk, and effort.
3. **Quick wins** vs **larger refactors**.
4. **Verification steps** to confirm improvement and no behavior/regression (especially draw fairness and privacy).

Be specific to this codebase; avoid generic advice without tying it to observed code paths.

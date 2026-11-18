---
name: Supabase Performance
description: Use when optimizing Supabase/Postgres performance in this project, including query efficiency, indexes, RLS policy cost, RPC/function design, transactions, pagination, and avoiding N+1 database access.
---

# Supabase & Postgres Performance

Use this when changing `supabase/schema.sql`, `lib/data.ts`, server actions, or any Supabase query/RPC in ChingChingGift.

## Principles
- **Measure the query path**: identify slow RPCs/queries, high row counts, and repeated round trips before changing schema.
- **Select only needed columns**: avoid `select("*")` in hot paths when a narrow projection is enough.
- **Avoid N+1**: batch related reads with `in (...)` filters, joins/views/RPCs, or `Promise.all` for independent queries; don't loop per-row queries from the app when one query can do it.
- **Keep RLS efficient**: RLS runs per query. Prefer simple predicates, index columns used in policies, and `security definer` helper functions (with fixed `search_path`) for checks that would otherwise recurse or repeat expensive logic.
- **Index for real access patterns**: add indexes that match filters/joins/ordering (`event_id`, foreign keys, token/member lookups, `(event_id, user_id)` style predicates). Avoid redundant or unused indexes.
- **Make mutations atomic**: use transactions/`FOR UPDATE` locks in SQL functions for draw/claim/reveal flows to prevent races without extra app round trips.
- **Return exactly what's needed**: RPCs should return minimal, shaped results; avoid fetching secrets or data the caller must not see (important for one-time reveal/privacy flows).
- **Pagination and limits**: cap unbounded lists (`limit`, cursor/offset where appropriate) and avoid loading full histories in UI-critical requests.

## Project-specific notes
- Draw/reveal operations must be race-safe and fair: preserve uniqueness constraints and transactional locking; optimize without weakening guarantees.
- Privacy-sensitive reads (assignments/recipients) must never become visible to organizers or other members via "faster" broad queries.
- Token/code/member lookups should be index-backed and constant-time relative to roster size where possible.

## Validation
- Review `EXPLAIN`/query plans for new or changed hot queries when possible.
- Re-run relevant flows and ensure constraints/RLS still enforce correctness.
- Keep schema changes idempotent where the project expects rerunnable SQL (`if exists/not exists`, guarded migrations).

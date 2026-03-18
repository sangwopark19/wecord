---
phase: 01-foundation
plan: 02
subsystem: database
tags: [drizzle-orm, supabase, postgresql, rls, migrations, schema]

# Dependency graph
requires:
  - phase: 01-01
    provides: monorepo scaffold with packages/db, packages/supabase stubs, pnpm workspace
provides:
  - Drizzle ORM schema for all 14 MVP tables with complete RLS policies
  - posts_with_nickname view (ARCHITECTURE.md §4.3)
  - Drizzle migration file with RLS + indexes
  - Supabase migration file (applied to local Docker environment)
  - All indexes from ARCHITECTURE.md §4.4
  - packages/db/drizzle.config.ts with Supabase provider
affects: [01-03, 01-04, all feature phases]

# Tech tracking
tech-stack:
  added:
    - drizzle-orm (pgTable, pgPolicy, pgView, authenticatedRole, anonRole from drizzle-orm/supabase)
    - drizzle-kit (migration generation)
    - Supabase CLI (local Docker environment)
  patterns:
    - "(select auth.uid()) wrapper in all RLS policies — no bare auth.uid()"
    - "pgPolicy() as table-level RLS definition in Drizzle schema"
    - "Domain-scoped schema files (auth.ts, community.ts, content.ts, etc.)"

key-files:
  created:
    - packages/db/src/schema/auth.ts
    - packages/db/src/schema/community.ts
    - packages/db/src/schema/artist-member.ts
    - packages/db/src/schema/follow.ts
    - packages/db/src/schema/content.ts
    - packages/db/src/schema/notification.ts
    - packages/db/src/schema/moderation.ts
    - packages/db/src/schema/translation.ts
    - packages/db/src/schema/index.ts
    - packages/db/drizzle.config.ts
    - packages/db/migrations/0000_fantastic_surge.sql
    - packages/supabase/config.toml
    - packages/supabase/migrations/20260318141420_initial_schema.sql
  modified:
    - packages/db/src/index.ts

key-decisions:
  - "postsWithNickname view defined as raw SQL constant (postsWithNicknameViewSql) rather than Drizzle pgView — pgView.as() does not accept raw SQL<unknown> type, only TypedQueryBuilder"
  - "Supabase migration created separately from Drizzle migration — Drizzle migration used for schema reference, Supabase migration used for actual DB push with view + indexes appended"
  - "Ran supabase db reset to handle pre-existing tables from previous local Supabase runs"

patterns-established:
  - "Pattern 1: All RLS policies use (select auth.uid()) not bare auth.uid() — enforced in every schema file"
  - "Pattern 2: anon role blocked on all tables via FOR ALL USING (false)"
  - "Pattern 3: One schema file per domain (auth, community, artist-member, follow, content, notification, moderation, translation)"
  - "Pattern 4: pgPolicy() defined inline in pgTable() third argument array"

requirements-completed: [FOUN-02, FOUN-03, FOUN-04]

# Metrics
duration: 6min
completed: 2026-03-18
---

# Phase 1 Plan 02: Supabase + Drizzle Schema Summary

**14 MVP tables with complete RLS policies using (select auth.uid()) wrapper, posts_with_nickname view, and all ARCHITECTURE.md §4.4 indexes applied to local Supabase Docker**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-18T05:10:15Z
- **Completed:** 2026-03-18T05:16:00Z
- **Tasks:** 2/3 complete (Task 3 blocked at human-action checkpoint for Supabase Cloud link)
- **Files modified:** 14

## Accomplishments
- 14 MVP tables defined in Drizzle ORM with full column types, FK references, unique constraints, and RLS policies
- All RLS policies use `(select auth.uid())` wrapper — zero bare `auth.uid()` calls verified by grep
- `posts_with_nickname` view created matching ARCHITECTURE.md §4.3 exactly
- All indexes from ARCHITECTURE.md §4.4 created (feed pagination, translation cache, unread notifications, pending reports, community members, follows, artist members)
- `pnpm --filter @wecord/db typecheck` passes with zero errors
- Local Supabase running with all 14 tables, view, and indexes verified via pg_tables/pg_views/pg_indexes

## Task Commits

1. **Task 1: Define complete Drizzle schema for all 14 MVP tables** - `402d852` (feat)
2. **Task 2: Generate migration, apply to local Supabase, add indexes** - `8d8600a` (feat)
3. **Task 3: Link Supabase Cloud project** - PENDING (checkpoint:human-action)

## Files Created/Modified
- `packages/db/src/schema/auth.ts` - profiles table (user_id PK, global_nickname, language, date_of_birth, onboarding_completed, RLS)
- `packages/db/src/schema/community.ts` - communities (slug unique, type, category, member_count) and community_members (community_nickname, role, follower/following counts, UNIQUE constraints)
- `packages/db/src/schema/artist-member.ts` - artist_members (display_name, sort_order, community-scoped RLS)
- `packages/db/src/schema/follow.ts` - community_follows (UNIQUE(follower_cm_id, following_cm_id), same-community INSERT enforcement via JOIN)
- `packages/db/src/schema/content.ts` - posts (content_rating, author_role, media_urls, post_type), comments (parent_comment_id, is_creator_reply), likes (composite PK), posts_with_nickname view SQL
- `packages/db/src/schema/notification.ts` - notices, notifications (type enum), notification_preferences (composite PK)
- `packages/db/src/schema/moderation.ts` - reports (UNIQUE reporter+target), user_sanctions (warning/ban types)
- `packages/db/src/schema/translation.ts` - post_translations (UNIQUE target+lang)
- `packages/db/src/schema/index.ts` - barrel export for all 8 schema modules
- `packages/db/drizzle.config.ts` - Drizzle config with Supabase provider
- `packages/db/src/index.ts` - updated to export from schema
- `packages/db/migrations/0000_fantastic_surge.sql` - Drizzle-generated migration
- `packages/supabase/config.toml` - Supabase project config (project_id=wecord)
- `packages/supabase/migrations/20260318141420_initial_schema.sql` - Complete migration with all tables, RLS policies, view, and indexes

## Decisions Made
- Used raw SQL constant `postsWithNicknameViewSql` instead of Drizzle `pgView().as()` because Drizzle's `pgView.as()` only accepts a `TypedQueryBuilder`, not a raw `sql` template tag — this is a type limitation in drizzle-orm/pg-core
- Supabase migration created manually by combining Drizzle-generated SQL + view + indexes, then applied via `supabase db reset` (the local DB had pre-existing tables from prior Supabase Docker state requiring a clean reset)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] pgView raw SQL type incompatibility**
- **Found during:** Task 1 (typecheck verification)
- **Issue:** `pgView('posts_with_nickname').as(sql\`...\`)` fails with TypeScript error — `SQL<unknown>` is not assignable to `TypedQueryBuilder`
- **Fix:** Replaced with `postsWithNicknameViewSql = sql\`CREATE OR REPLACE VIEW...\`` constant; the view is included in the Supabase migration SQL directly
- **Files modified:** packages/db/src/schema/content.ts
- **Verification:** `pnpm --filter @wecord/db typecheck` passes; view exists in local DB
- **Committed in:** 402d852 (Task 1 commit)

**2. [Rule 3 - Blocking] Pre-existing tables in local Supabase**
- **Found during:** Task 2 (migration application)
- **Issue:** Local Supabase Docker had pre-existing tables (banners, chat_messages, etc.) from prior migration history; `supabase db push --local` failed with "relation already exists"
- **Fix:** Ran `supabase db reset` to wipe and replay migrations cleanly
- **Files modified:** None (operational fix)
- **Verification:** All 14 tables, view, and indexes verified in local DB via Docker exec
- **Committed in:** 8d8600a (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 type bug, 1 blocking operational issue)
**Impact on plan:** Both fixes necessary for correctness and execution. No scope creep.

## Issues Encountered
- `supabase init` created nested `packages/supabase/supabase/` directory instead of `packages/supabase/` directly — manually moved config.toml and removed nested dir

## User Setup Required
**Task 3 (Cloud Link) blocked at human-action checkpoint.**

To complete Task 3, the user must:
1. Log in to Supabase CLI: `supabase login`
2. Get project reference ID from: [Supabase Dashboard](https://supabase.com/dashboard) > Project Settings > General > Reference ID
3. Run: `cd packages/supabase && supabase link --project-ref <PROJECT_REF>`
4. Verify: `supabase status` should show the linked cloud project URL

## Next Phase Readiness
- Complete Drizzle schema ready for use in all downstream packages
- Local Supabase environment operational for development
- Supabase Cloud link pending (Task 3 checkpoint)
- All types from `@wecord/db` can be used by apps/mobile and apps/admin

---
*Phase: 01-foundation*
*Completed: 2026-03-18*

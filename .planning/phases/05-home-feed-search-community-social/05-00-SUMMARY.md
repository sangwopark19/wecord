---
phase: 05-home-feed-search-community-social
plan: 00
subsystem: db-migrations, i18n, test-scaffolding
tags: [migration, drizzle, i18n, test-stubs, rls, triggers]
dependency_graph:
  requires: []
  provides:
    - promotion_banners table migration
    - follow count trigger migration
    - Drizzle promotionBanners schema
    - home i18n namespace (5 languages)
    - community.json postSearch/profile/follow keys (5 languages)
    - test stubs for useHomeFeed, usePromotionBanners, usePostSearch, useCommunityProfile
  affects:
    - packages/db/src/schema/index.ts
    - packages/shared/src/i18n/index.ts
tech_stack:
  added: []
  patterns:
    - pgPolicy with authenticatedRole/anonRole for RLS (same as follow.ts)
    - it.todo() stubs so vitest exits 0 (same as Phase 4 wave 0)
    - i18n namespace registration pattern (import + resources + ns array)
key_files:
  created:
    - packages/supabase/migrations/20260322000000_phase5_promotion_banners.sql
    - packages/supabase/migrations/20260322000001_phase5_follow_count_trigger.sql
    - packages/db/src/schema/promotion-banner.ts
    - apps/mobile/tests/useHomeFeed.test.ts
    - apps/mobile/tests/usePromotionBanners.test.ts
    - apps/mobile/tests/usePostSearch.test.ts
    - apps/mobile/tests/useCommunityProfile.test.ts
    - packages/shared/src/i18n/locales/ko/home.json
    - packages/shared/src/i18n/locales/en/home.json
    - packages/shared/src/i18n/locales/ja/home.json
    - packages/shared/src/i18n/locales/zh/home.json
    - packages/shared/src/i18n/locales/th/home.json
  modified:
    - packages/db/src/schema/index.ts
    - packages/shared/src/i18n/locales/ko/community.json
    - packages/shared/src/i18n/locales/en/community.json
    - packages/shared/src/i18n/locales/ja/community.json
    - packages/shared/src/i18n/locales/zh/community.json
    - packages/shared/src/i18n/locales/th/community.json
    - packages/shared/src/i18n/index.ts
decisions:
  - "community.json search key already existed — appended accessibilityLabel to existing object instead of creating duplicate top-level key"
metrics:
  duration: 3 min
  completed_date: "2026-03-22"
---

# Phase 5 Plan 00: DB Migrations, Test Stubs, and i18n Wave 0 Summary

**One-liner:** promotion_banners table + follow count trigger migrations with Drizzle schema, Phase 5 test stubs (it.todo), and home i18n namespace across 5 languages.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | DB migrations — promotion_banners table + follow count trigger | aa8961e | 4 files |
| 2 | Test stubs + i18n home/profile namespace | d969ae6 | 15 files |

## What Was Built

### Task 1: DB Migrations + Drizzle Schema

- `packages/supabase/migrations/20260322000000_phase5_promotion_banners.sql` — creates `promotion_banners` table with RLS: authenticated users can SELECT active banners; admin users (raw_user_meta_data.role = 'admin') can do ALL operations. Partial index `idx_banners_active_order` on `(is_active, sort_order) WHERE is_active = true`.
- `packages/supabase/migrations/20260322000001_phase5_follow_count_trigger.sql` — `update_follow_counts()` trigger function fires AFTER INSERT/DELETE on `community_follows`, updating `following_count` and `follower_count` on `community_members` with `GREATEST(..., 0)` protection against negative values.
- `packages/db/src/schema/promotion-banner.ts` — Drizzle `pgTable` definition for `promotion_banners` with authenticated select policy and anon block policy, matching existing follow.ts pattern.
- `packages/db/src/schema/index.ts` — Added `export * from './promotion-banner'`.

### Task 2: Test Stubs + i18n

- 4 test stub files with `it.todo()` entries covering HOME-01/02/03/05, SRCH-02/03, FLLW-02/03
- `home` i18n namespace created in all 5 languages (ko, en, ja, zh, th) with `recommendation.heading`, `empty.heading`, `empty.body`, and `error` keys
- `community.json` extended in all 5 languages with: `postSearch` (placeholder, empty, error), `profile` (follow, following, unfollowConfirm, tab, stat, followers, following), and `search.accessibilityLabel`
- `packages/shared/src/i18n/index.ts` — added home imports for all 5 languages, added `home` to resources objects and `ns` array

## Verification

- `pnpm --filter mobile run test -- --run` exits 0; 37 todo tests (all skipped), 33 passing
- Both SQL migration files contain required DDL
- Drizzle schema exports `promotionBanners` via barrel
- All 5 language files have home.json and updated community.json

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Duplicate `search` key in ko/community.json**
- **Found during:** Task 2 community.json editing
- **Issue:** Plan spec had `"search": { "accessibilityLabel": ... }` as a new top-level key, but `search` already existed in community.json with placeholder/empty keys. Adding a new top-level `search` key would create a duplicate (last one wins in JSON parsers).
- **Fix:** Added `accessibilityLabel` into the existing `search` object in all 5 language community.json files instead of duplicating the key.
- **Files modified:** All 5 community.json files (ko, en, ja, zh, th)
- **Commit:** d969ae6

## Known Stubs

None — this plan creates scaffolding only (test stubs + migrations). No UI stubs or placeholder data.

## Self-Check: PASSED

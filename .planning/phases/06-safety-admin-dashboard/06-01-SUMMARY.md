---
phase: 06-safety-admin-dashboard
plan: 01
subsystem: database, moderation, i18n
tags: [soft-delete, banned-words, reports, vitest, tdd, i18n, supabase, drizzle]

requires:
  - phase: 03-community-core-content
    provides: posts, comments, community_members tables and views
provides:
  - Soft delete infrastructure (deleted_at on posts/comments, filtered views)
  - banned_words table + contains_banned_word function
  - check_post_rate_limit function
  - Analytics functions (get_daily_active_users, get_daily_signups, get_community_stats)
  - useReport hook with duplicate detection and i18n toasts
  - report.json i18n namespace in 5 locales
affects: [06-02-report-ui, 06-04-admin-moderation, 06-05-admin-analytics]

tech-stack:
  added: []
  patterns: [exported mutationFn for unit testability, TDD red-green for hooks]

key-files:
  created:
    - packages/supabase/migrations/20260322100000_phase6_soft_delete_banned_words.sql
    - apps/mobile/hooks/report/useReport.ts
    - apps/mobile/tests/report.test.ts
    - packages/shared/src/i18n/locales/ko/report.json
    - packages/shared/src/i18n/locales/en/report.json
    - packages/shared/src/i18n/locales/th/report.json
    - packages/shared/src/i18n/locales/zh/report.json
    - packages/shared/src/i18n/locales/ja/report.json
  modified:
    - packages/db/src/schema/content.ts
    - packages/shared/src/i18n/index.ts

key-decisions:
  - "reportMutationFn exported separately from useReport for direct unit testing without React context"
  - "i18n locale uses 'zh' directory (not 'zh-CN') matching existing project convention"

patterns-established:
  - "Exported mutationFn pattern: extract async logic for unit testing without React hooks"

requirements-completed: [SAFE-01, SAFE-02, SAFE-03, SAFE-05]

duration: 3min
completed: 2026-03-22
---

# Phase 06 Plan 01: DB Migration + Report Hook Summary

**Soft delete columns, banned_words table, analytics DB functions, and TDD-tested useReport hook with i18n in 5 locales**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T07:34:00Z
- **Completed:** 2026-03-22T07:37:16Z
- **Tasks:** 1 (TDD: RED + GREEN)
- **Files modified:** 10

## Accomplishments
- DB migration with soft delete (deleted_at) on posts and comments, views updated to filter deleted rows
- banned_words table with RLS, contains_banned_word and check_post_rate_limit DB functions
- Analytics functions: get_daily_active_users, get_daily_signups, get_community_stats
- useReport hook with 23505 duplicate detection, i18n toasts, and 4 passing vitest tests
- report.json i18n namespace registered in all 5 locales (ko, en, th, zh, ja)

## Task Commits

Each task was committed atomically (TDD):

1. **Task 1 RED: Failing report tests** - `1a5e5f8` (test)
2. **Task 1 GREEN: DB migration + i18n + report hook** - `fc35e30` (feat)

## Files Created/Modified
- `packages/supabase/migrations/20260322100000_phase6_soft_delete_banned_words.sql` - Soft delete, banned_words, analytics functions
- `packages/db/src/schema/content.ts` - Added deletedAt to posts/comments, WHERE clause to view
- `packages/shared/src/i18n/index.ts` - Registered report namespace in all locales
- `packages/shared/src/i18n/locales/ko/report.json` - Korean report translations
- `packages/shared/src/i18n/locales/en/report.json` - English report translations
- `packages/shared/src/i18n/locales/th/report.json` - Thai report translations
- `packages/shared/src/i18n/locales/zh/report.json` - Chinese report translations
- `packages/shared/src/i18n/locales/ja/report.json` - Japanese report translations
- `apps/mobile/hooks/report/useReport.ts` - Report mutation hook with duplicate detection
- `apps/mobile/tests/report.test.ts` - 4 vitest tests for report hook

## Decisions Made
- Exported `reportMutationFn` separately from `useReport` hook for direct unit testing without React context
- Used `zh` directory (not `zh-CN`) matching existing project i18n convention
- Used `Record<string, string>` for insert payload to conditionally include reason_text only when provided

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Soft delete infrastructure ready for admin content removal (Plan 04)
- banned_words + contains_banned_word ready for moderate Edge Function (Plan 04)
- useReport hook ready for UI wiring in Plan 02
- Analytics functions ready for admin dashboard (Plan 05)

---
*Phase: 06-safety-admin-dashboard*
*Completed: 2026-03-22*

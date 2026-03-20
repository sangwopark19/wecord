---
phase: 04-highlights-notices-notifications-translation
plan: 02
subsystem: ui, database, api
tags: [supabase, next.js, shadcn, base-ui, react-native, pg_cron, pgmq, expo-router, tanstack-query]

# Dependency graph
requires:
  - phase: 04-01
    provides: highlight section + Edge Function stubs + supabase notices table schema

provides:
  - Admin notice CRUD (Next.js): list with status badges, create/edit form with image upload, delete with AlertDialog
  - Mobile notice list screen (pinned-first FlatList with teal border indicator)
  - Mobile notice detail screen (title, date, body, image gallery)
  - useNotices + useNoticeDetail hooks for mobile
  - NoticeRow component (56px min height, teal left border for pinned)
  - Supabase migration: pgmq notify_queue creation, pg_cron publish-scheduled-notices job, AFTER UPDATE/INSERT triggers using pgmq.send, pg_cron drain-notify-queue batch consumer

affects:
  - 04-03 (notifications — drain-notify-queue invokes notify Edge Function built in 04-03)
  - 04-04 (translation — notice i18n keys must be added to locale files)

# Tech tracking
tech-stack:
  added:
    - "@supabase/supabase-js ^2.99.2 (admin app)"
    - "@base-ui/react (shadcn base-nova style dependency)"
    - "shadcn components: table, badge, button, input, textarea, select, switch, alert-dialog"
  patterns:
    - "Admin app uses service role key client (supabaseAdmin) to bypass RLS for full notice CRUD"
    - "Mobile hooks use useQuery (not useInfiniteQuery) for notice list — bounded dataset"
    - "pgmq async fan-out: triggers enqueue to notify_queue (non-blocking), drain job invokes Edge Function via pg_net"
    - "pg_cron publish-scheduled-notices runs every minute; drain-notify-queue runs every 5 seconds"
    - "AFTER UPDATE trigger checks OLD.published_at IS NULL AND NEW.published_at IS NOT NULL for transition detection"
    - "AFTER INSERT trigger handles immediately-published notices (non-scheduled path)"

key-files:
  created:
    - apps/admin/lib/supabase.ts
    - apps/admin/lib/utils.ts
    - apps/admin/components/ui/table.tsx
    - apps/admin/components/ui/badge.tsx
    - apps/admin/components/ui/button.tsx
    - apps/admin/components/ui/input.tsx
    - apps/admin/components/ui/textarea.tsx
    - apps/admin/components/ui/select.tsx
    - apps/admin/components/ui/switch.tsx
    - apps/admin/components/ui/alert-dialog.tsx
    - apps/admin/app/notices/page.tsx
    - apps/admin/app/notices/new/page.tsx
    - apps/admin/app/notices/[id]/page.tsx
    - apps/mobile/hooks/notice/useNotices.ts
    - apps/mobile/hooks/notice/useNoticeDetail.ts
    - apps/mobile/components/notice/NoticeRow.tsx
    - apps/mobile/app/(community)/[id]/notices.tsx
    - apps/mobile/app/(community)/[id]/notice/[noticeId].tsx
    - packages/supabase/migrations/20260320200000_notice_publish_trigger.sql
  modified:
    - apps/admin/package.json (added @supabase/supabase-js, @base-ui/react)
    - pnpm-lock.yaml

key-decisions:
  - "shadcn base-nova style uses @base-ui/react (not Radix UI) — Select.onValueChange passes string | null, handled with ?? '' guard"
  - "Admin notice list page is 'use client' to handle delete state and AlertDialog open/close — server component would require Server Actions for delete"
  - "Notice detail screen renders images with expo-image full-width at 16:9 aspect ratio with borderRadius 12"
  - "pgmq drain job reads batches of 10 with 30s visibility timeout — prevents double-processing; pgmq.archive removes message after successful HTTP call"

patterns-established:
  - "Admin client pattern: createClient with service role key, auth: { autoRefreshToken: false, persistSession: false }"
  - "Mobile notice routing: /(community)/[id]/notices (list) and /(community)/[id]/notice/[noticeId] (detail)"
  - "pgmq trigger pattern: PERFORM pgmq.send() in SECURITY DEFINER function, no net.http_post in triggers"

requirements-completed: [NOTC-01, NOTC-02, NOTC-03, NOTC-04, NOTC-05]

# Metrics
duration: 6min
completed: 2026-03-20
---

# Phase 4 Plan 02: Notices System Summary

**Admin Next.js CRUD for notices (list/create/edit/delete) + mobile notice list + detail screens + pg_cron scheduled publishing with pgmq async fan-out via AFTER UPDATE/INSERT triggers**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-20T09:22:50Z
- **Completed:** 2026-03-20T09:28:47Z
- **Tasks:** 2
- **Files modified:** 19

## Accomplishments
- Admin can create, edit, delete, pin, and schedule notices via Next.js admin with shadcn components (base-nova style using @base-ui/react)
- Mobile users see notice list with pinned notices at top (teal 2px left border, teal dot), sorted pinned-first then latest-first
- Mobile notice detail shows title, date, body text, and image gallery
- pg_cron job publishes scheduled notices every minute; AFTER UPDATE/INSERT triggers enqueue to pgmq `notify_queue` (non-blocking); drain job reads batches of 10 every 5 seconds and invokes notify Edge Function via pg_net

## Task Commits

1. **Task 1: Admin notice CRUD** - `1cbf4df` (feat)
2. **Task 2: Mobile notice screens + migration** - `f2e9d8e` (feat)

## Files Created/Modified
- `apps/admin/lib/supabase.ts` - Service role Supabase client for admin CRUD bypassing RLS
- `apps/admin/lib/utils.ts` - cn() helper for shadcn components
- `apps/admin/components/ui/` - shadcn components: table, badge, button, input, textarea, select, switch, alert-dialog
- `apps/admin/app/notices/page.tsx` - Notice list with status badges and AlertDialog delete confirmation
- `apps/admin/app/notices/new/page.tsx` - Notice create form with community select, image upload, pin/schedule toggles
- `apps/admin/app/notices/[id]/page.tsx` - Notice edit form (pre-filled, existing image display)
- `apps/mobile/hooks/notice/useNotices.ts` - useQuery hook fetching published notices sorted pinned-first
- `apps/mobile/hooks/notice/useNoticeDetail.ts` - useQuery hook for single notice by id
- `apps/mobile/components/notice/NoticeRow.tsx` - Pinned teal border + dot, 56px min height
- `apps/mobile/app/(community)/[id]/notices.tsx` - FlatList notice list with empty/error states
- `apps/mobile/app/(community)/[id]/notice/[noticeId].tsx` - Scrollable detail with image gallery
- `packages/supabase/migrations/20260320200000_notice_publish_trigger.sql` - pgmq queue + pg_cron jobs + triggers

## Decisions Made
- `shadcn base-nova style uses @base-ui/react (not Radix UI)` — Select.onValueChange types `string | null`, fixed with `?? ''` guard in handlers
- Admin notice list rendered as `'use client'` to manage delete dialog state without Server Actions
- pgmq drain job uses `pgmq.archive()` (not `pgmq.delete()`) so processed messages are retained for audit
- `@base-ui/react` must be added explicitly — shadcn CLI created component files referencing it but did not add it to package.json

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added @base-ui/react explicit dependency**
- **Found during:** Task 1 (after shadcn CLI installed components)
- **Issue:** shadcn CLI generated components importing from `@base-ui/react/*` but did not add `@base-ui/react` to package.json — typecheck would fail at runtime
- **Fix:** Ran `pnpm --filter admin add @base-ui/react`
- **Files modified:** apps/admin/package.json, pnpm-lock.yaml
- **Verification:** Typecheck passes, components resolve
- **Committed in:** 1cbf4df (Task 1 commit)

**2. [Rule 2 - Missing Critical] Added lib/utils.ts for shadcn cn() helper**
- **Found during:** Task 1 (shadcn components import `@/lib/utils`)
- **Issue:** shadcn CLI did not generate `lib/utils.ts` — all components would fail to import cn()
- **Fix:** Created `apps/admin/lib/utils.ts` with clsx + twMerge cn() helper
- **Files modified:** apps/admin/lib/utils.ts
- **Verification:** Typecheck passes
- **Committed in:** 1cbf4df (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 2 - missing critical infrastructure for shadcn)
**Impact on plan:** Both fixes required by shadcn CLI's incomplete scaffolding. No scope creep.

## Issues Encountered
- shadcn base-nova style uses `@base-ui/react` instead of Radix UI — Select component `onValueChange` signature passes `string | null` (not `string`) requiring null coalescing in handlers

## User Setup Required
None — migration will be applied via `supabase db push` or `supabase db reset`. pgmq and pg_cron extensions must be enabled in Supabase dashboard (pre-phase blocker already documented in STATE.md).

## Next Phase Readiness
- 04-03 (notifications): `drain-notify-queue` pg_cron job is ready and will invoke the `/notify` Edge Function built in 04-03
- Notice i18n keys (`notice.title`, `notice.empty.heading`, `notice.empty.body`, `notice.error.load`, `notice.retry`) need to be added to locale files in 04-04

## Self-Check: PASSED

All created files verified on disk. Both task commits confirmed in git log.

---
*Phase: 04-highlights-notices-notifications-translation*
*Completed: 2026-03-20*

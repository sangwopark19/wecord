---
phase: 04-highlights-notices-notifications-translation
plan: "03"
subsystem: notifications
tags: [push-notifications, edge-function, pgmq, realtime, expo-notifications]
dependency_graph:
  requires: ["04-01", "04-02"]
  provides: ["notify-edge-function", "notification-list-screen", "notification-preferences", "bell-badge-realtime"]
  affects: ["community-main-screen"]
tech_stack:
  added:
    - expo-notifications@55.0.13
    - expo-device@55.0.10
  patterns:
    - pgmq async fan-out (non-blocking triggers)
    - Supabase Realtime postgres_changes for badge count
    - Expo Push API batching (100/batch)
    - Optimistic mutation cache updates
key_files:
  created:
    - packages/supabase/functions/notify/index.ts
    - packages/supabase/migrations/20260320300000_notification_triggers.sql
    - apps/mobile/hooks/notification/usePushTokenRegistration.ts
    - apps/mobile/hooks/notification/useNotifications.ts
    - apps/mobile/hooks/notification/useMarkNotificationRead.ts
    - apps/mobile/hooks/notification/useNotificationPreferences.ts
    - apps/mobile/hooks/notification/useUnreadNotificationCount.ts
    - apps/mobile/components/notification/NotificationRow.tsx
    - apps/mobile/components/notification/NotificationGroupHeader.tsx
    - apps/mobile/components/notification/NotificationBellBadge.tsx
    - apps/mobile/app/(community)/[id]/notifications.tsx
    - apps/mobile/app/(community)/[id]/notification-preferences.tsx
  modified:
    - apps/mobile/app/(community)/[id]/index.tsx
decisions:
  - "bell-outline is not a valid Ionicons name; replaced with notifications-outline (Ionicons uses notifications-* prefix)"
  - "useUnreadNotificationCount subscribes to both INSERT and UPDATE events — INSERT increments, UPDATE re-fetches for mark-read accuracy"
  - "NotificationPreferences upsert includes merged current prefs to avoid overwriting unchanged columns"
metrics:
  duration: "9 min"
  completed_date: "2026-03-20"
  tasks_completed: 2
  files_created: 12
  files_modified: 1
requirements:
  - NOTF-01
  - NOTF-02
  - NOTF-03
  - NOTF-04
  - NOTF-05
  - NOTF-06
  - NOTF-07
  - NOTF-08
  - MEMB-04
  - CREF-03
---

# Phase 04 Plan 03: Notifications Summary

**One-liner:** Push notifications via pgmq async DB triggers + Expo Push API fan-out with Supabase Realtime bell badge (NOTF-08).

## What Was Built

### Task 1: notify Edge Function + pgmq DB triggers + push token registration

- **`packages/supabase/functions/notify/index.ts`** — Deno Edge Function that accepts POST from pgmq drain job. Fetches community members, removes users with disabled preferences or who are the actor, bulk-inserts in-app notifications, then sends Expo Push API messages in batches of 100. For `member_post` events: further filters to `community_follows` followers only.
- **`packages/supabase/migrations/20260320300000_notification_triggers.sql`** — Three AFTER INSERT triggers using `pgmq.send('notify_queue', ...)` for async non-blocking fan-out:
  - `posts_creator_notify_trigger` → `trigger_notify_on_creator_post()` fires when `author_role = 'creator'`
  - `comments_notify_trigger` → `trigger_notify_on_comment()` notifies post author (excludes self-comments)
  - `likes_notify_trigger` → `trigger_notify_on_like()` notifies post author on `target_type = 'post'`
- **`apps/mobile/hooks/notification/usePushTokenRegistration.ts`** — Physical device check, permission request, Android notification channel setup, `getExpoPushTokenAsync` with EAS project ID, upserts to `push_tokens` table.

### Task 2: Notification list screen + preferences + bell badge with Realtime (NOTF-08)

- **`useNotifications`** — React Query hook querying notifications table for a community, ordered by `created_at` desc, limit 50.
- **`useMarkNotificationRead`** / **`useMarkAllRead`** — Mutations with optimistic cache updates that immediately update `is_read` in query cache, rollback on error.
- **`useNotificationPreferences`** — Query + mutation for `notification_preferences` table. Upsert merges existing prefs with the changed column to avoid clobbering unchanged values.
- **`useUnreadNotificationCount`** (NOTF-08) — Initial count via `count: 'exact', head: true` query. Realtime `postgres_changes` subscription on INSERT increments count; UPDATE re-fetches count. Channel cleaned up via `supabase.removeChannel(channel)` in useEffect return.
- **`NotificationRow`** — Unread: `bg-card`, teal `#00E5C3` icon, 8px teal dot. Read: `bg-background`, `#999999` icon. Relative time display. Min 44px height.
- **`NotificationGroupHeader`** — Sticky group header showing Today/Yesterday/This Week labels.
- **`NotificationBellBadge`** — `notifications-outline` 24px icon with `#FF3B30` 20px badge circle, offset `top: -8, right: -8`. Badge hidden when count is 0.
- **`NotificationsScreen`** — SectionList with time-grouped sections, empty/error/loading states, "모두 읽음" right action, tap navigates to post or notices.
- **`NotificationPreferencesScreen`** — 4 Switch rows (creator posts, comments, likes, notices) with teal track color `#00E5C3`.
- **`CommunityMainScreen`** — Added `NotificationBellBadge` before settings icon in header, calls `usePushTokenRegistration()`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] bell-outline not in Ionicons icon set**
- **Found during:** Task 2 typecheck
- **Issue:** Plan specified `Ionicons "bell-outline"` but Ionicons uses `notifications-*` prefix. No bell icons exist.
- **Fix:** Used `notifications-outline` for the bell badge icon (visually equivalent)
- **Files modified:** `apps/mobile/components/notification/NotificationBellBadge.tsx`
- **Commit:** 76c59fd

## Self-Check

### Files Created
- [x] `packages/supabase/functions/notify/index.ts` — EXISTS
- [x] `packages/supabase/migrations/20260320300000_notification_triggers.sql` — EXISTS
- [x] `apps/mobile/hooks/notification/usePushTokenRegistration.ts` — EXISTS
- [x] `apps/mobile/hooks/notification/useNotifications.ts` — EXISTS
- [x] `apps/mobile/hooks/notification/useMarkNotificationRead.ts` — EXISTS
- [x] `apps/mobile/hooks/notification/useNotificationPreferences.ts` — EXISTS
- [x] `apps/mobile/hooks/notification/useUnreadNotificationCount.ts` — EXISTS
- [x] `apps/mobile/components/notification/NotificationRow.tsx` — EXISTS
- [x] `apps/mobile/components/notification/NotificationGroupHeader.tsx` — EXISTS
- [x] `apps/mobile/components/notification/NotificationBellBadge.tsx` — EXISTS
- [x] `apps/mobile/app/(community)/[id]/notifications.tsx` — EXISTS
- [x] `apps/mobile/app/(community)/[id]/notification-preferences.tsx` — EXISTS

### Commits
- [x] 9d7bb7e — feat(04-03): notify Edge Function + pgmq DB triggers + push token registration
- [x] 76c59fd — feat(04-03): notification list screen + preferences + bell badge with Realtime unread (NOTF-08)

## Self-Check: PASSED

---
status: investigating
trigger: "Notification bell badge shows on home tab but NOT inside community screen"
created: 2026-03-23T00:00:00Z
updated: 2026-03-23T00:00:00Z
---

## Current Focus

hypothesis: The community screen DOES render the NotificationBellBadge component — code is present and correct. The issue is likely NOT a missing component but rather a data/query problem with community-scoped unread counts returning 0.
test: Compare the two hooks and verify notification data has community_id populated
expecting: If community_id is NULL on notification rows, the per-community count query would return 0 even when notifications exist
next_action: Verify whether community_id column was added AFTER initial notifications were created (migration ordering issue) or whether existing notifications have NULL community_id

## Symptoms

expected: Red badge (#FF3B30) with unread count appears on bell icon inside community screen header
actual: Bell icon appears inside community but badge (unread count) does NOT show — count is 0
errors: No error messages — the badge simply does not render because count <= 0
reproduction: Navigate into any community, observe the bell icon in the header — no red badge even when notifications exist
started: Likely since community_id column was added to notifications table

## Eliminated

- hypothesis: NotificationBellBadge component is missing from community screen
  evidence: Component IS rendered at line 334 of apps/mobile/app/(community)/[id]/index.tsx — `<NotificationBellBadge communityId={id!} onPress={...} />`
  timestamp: 2026-03-23

- hypothesis: The component itself is broken (render logic)
  evidence: NotificationBellBadge.tsx correctly shows badge when count > 0. Same visual pattern as HomeNotificationBell which works. Both use identical badge rendering code.
  timestamp: 2026-03-23

## Evidence

- timestamp: 2026-03-23
  checked: Home tab bell implementation (apps/mobile/app/(tabs)/index.tsx)
  found: Home uses `useAllUnreadNotificationCount` hook which queries ALL notifications for user (no community_id filter). This returns correct counts.
  implication: The "all notifications" query works fine because it does not filter by community_id.

- timestamp: 2026-03-23
  checked: Community screen bell implementation (apps/mobile/app/(community)/[id]/index.tsx)
  found: Community uses `NotificationBellBadge` component which uses `useUnreadNotificationCount(userId, communityId)` hook — this filters by `.eq('community_id', communityId)`
  implication: The per-community query filters on community_id, which must be populated on notification rows for this to work.

- timestamp: 2026-03-23
  checked: Initial schema (20260318141420_initial_schema.sql)
  found: Original `notifications` table does NOT have community_id column. It was added later via migration 20260320100000_phase4_push_tokens_community_id.sql as `ALTER TABLE notifications ADD COLUMN community_id uuid`
  implication: Any notifications created BEFORE this migration have NULL community_id. Also, community_id has no NOT NULL constraint — inserts can omit it.

- timestamp: 2026-03-23
  checked: Edge function notify/index.ts (the notification creation code)
  found: The edge function DOES populate community_id on insert (line 97: `community_id: community_id`). So new notifications created via the edge function will have community_id set.
  implication: If notifications are created via the edge function, community_id should be present. But other code paths inserting notifications may not set it.

- timestamp: 2026-03-23
  checked: Difference between the two hooks
  found: |
    - `useAllUnreadNotificationCount`: queries `.eq('user_id', userId).eq('is_read', false)` — NO community_id filter
    - `useUnreadNotificationCount`: queries `.eq('user_id', userId).eq('community_id', communityId).eq('is_read', false)` — WITH community_id filter
  implication: If community_id is NULL on notification rows, the per-community query returns 0 while the all-notifications query returns the correct total.

## Resolution

root_cause: |
  Two possible root causes (both may contribute):

  1. **NULL community_id on existing notifications**: The community_id column was added via ALTER TABLE without backfilling existing rows. Any notifications created before migration 20260320100000 have NULL community_id, so `useUnreadNotificationCount` (which filters `.eq('community_id', communityId)`) returns 0 for those.

  2. **Non-edge-function notification inserts**: If any code path creates notifications WITHOUT going through the `notify` edge function (e.g., direct database inserts, triggers, or other API routes), community_id may not be set.

  The most likely immediate cause: notifications in the database have NULL community_id values, making the per-community count query return 0. The home tab works because `useAllUnreadNotificationCount` does not filter by community_id at all.

fix: |
  Potential fixes:

  A. **Backfill existing notifications**: Write a migration to populate community_id on existing notification rows (if the community can be inferred from notification data/context).

  B. **Make community_id NOT NULL with default**: Ensure all notification creation paths set community_id.

  C. **Fallback in the hook**: If community_id is NULL, the per-community hook could fall back to matching via the notification's data payload (if it contains community context).

  D. **Quick fix — verify data**: Run a query to check how many notifications have NULL community_id:
     `SELECT count(*) FROM notifications WHERE community_id IS NULL;`
     `SELECT count(*) FROM notifications WHERE community_id IS NOT NULL;`

verification: Pending — need to check actual database data to confirm which root cause applies
files_changed: []

## Investigation Summary

### Architecture

| Location | Component | Hook | Query |
|----------|-----------|------|-------|
| Home tab | `HomeNotificationBell` (inline) | `useAllUnreadNotificationCount` | No community_id filter |
| Community screen | `NotificationBellBadge` | `useUnreadNotificationCount` | Filters by community_id |

### Key Files

- `apps/mobile/app/(tabs)/index.tsx` — Home screen with working bell (lines 17-60)
- `apps/mobile/app/(community)/[id]/index.tsx` — Community screen with non-working bell (line 334)
- `apps/mobile/components/notification/NotificationBellBadge.tsx` — Bell component (works correctly)
- `apps/mobile/hooks/notification/useAllUnreadNotificationCount.ts` — All-notifications count (works)
- `apps/mobile/hooks/notification/useUnreadNotificationCount.ts` — Per-community count (returns 0)
- `packages/supabase/functions/notify/index.ts` — Edge function that creates notifications WITH community_id
- `packages/supabase/migrations/20260320100000_phase4_push_tokens_community_id.sql` — Migration that added community_id column

### Next Steps to Confirm

1. Query the database: `SELECT community_id, count(*) FROM notifications GROUP BY community_id;`
2. If many rows have NULL community_id, write a backfill migration
3. If all rows have community_id set, investigate RLS policies or other query issues

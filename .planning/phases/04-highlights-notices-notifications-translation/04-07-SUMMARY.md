---
phase: 04-highlights-notices-notifications-translation
plan: 07
subsystem: notifications, translation
tags: [react-native, supabase, react-query, google-translate, edge-functions]

requires:
  - phase: 04-03
    provides: notification hooks and screens
  - phase: 04-04
    provides: translate edge function
provides:
  - "Working notification read/unread visual state with correct query cache invalidation"
  - "Mark all read with user feedback (Alert)"
  - "Settings gear icon navigating to notification-preferences"
  - "Google Translate API key configured in Supabase secrets"
affects: []

tech-stack:
  added: []
  patterns: ["query key must include userId for user-scoped notification cache"]

key-files:
  created: []
  modified:
    - apps/mobile/hooks/notification/useMarkNotificationRead.ts
    - apps/mobile/components/notification/NotificationRow.tsx
    - apps/mobile/app/(community)/[id]/notifications.tsx

key-decisions:
  - "Added userId param to useMarkNotificationRead/useMarkAllRead to match useNotifications query key pattern"
  - "Removed inline backgroundColor override letting NativeWind classes handle read/unread styling"
  - "Used Alert.alert for markAllRead feedback (simple, platform-native)"

patterns-established:
  - "Query key consistency: all notification hooks use ['notifications', userId, communityId]"

requirements-completed: [NOTF-03, NOTF-04, NOTF-05, NOTF-07, TRAN-01]

duration: 5min
completed: 2026-03-23
---

# Plan 07: Notification UX Bug Fixes & Translation API Key Summary

**Fixed notification read state query key mismatch, added markAll feedback and settings navigation, configured Google Translate API key**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-23
- **Completed:** 2026-03-23
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Fixed query key mismatch (2-segment vs 3-segment) causing read state not to visually update
- Removed inline backgroundColor override so NativeWind bg-card/bg-background classes work
- Added Alert feedback on "Mark all read" button press
- Added settings gear icon in notification header navigating to notification-preferences
- Set GOOGLE_TRANSLATE_API_KEY in Supabase production secrets

## Task Commits

1. **Task 1: Fix notification read state and UX** - `0bcc743` (fix)
2. **Task 2: Set GOOGLE_TRANSLATE_API_KEY** - human action (supabase secrets set)

## Files Created/Modified
- `apps/mobile/hooks/notification/useMarkNotificationRead.ts` - Added userId param, fixed all 6 query key references
- `apps/mobile/components/notification/NotificationRow.tsx` - Removed inline backgroundColor override
- `apps/mobile/app/(community)/[id]/notifications.tsx` - Added authStore, settings icon, markAll feedback

## Decisions Made
- Used Alert.alert for markAllRead feedback — simple, cross-platform, no extra dependency

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
Google Translate API key was set via `supabase secrets set` during execution.

## Next Phase Readiness
- All Phase 4 gap closure plans complete
- Ready for verification

---
*Phase: 04-highlights-notices-notifications-translation*
*Completed: 2026-03-23*

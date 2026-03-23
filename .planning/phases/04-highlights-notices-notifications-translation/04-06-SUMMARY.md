---
phase: 04-highlights-notices-notifications-translation
plan: 06
subsystem: notifications
tags: [expo-router, supabase, react-native, notifications, badge]

requires:
  - phase: 04-highlights-notices-notifications-translation
    provides: Notification hooks, components, and community notification screen
provides:
  - Global notifications screen accessible from home tab bell icon
  - Corrected unread badge count logic including NULL community_id
affects: [05-home-feed-search-community-social]

tech-stack:
  added: []
  patterns:
    - "Global notifications route as hidden tab screen with href: null"
    - "OR filter for community_id including NULL values in Supabase queries"

key-files:
  created:
    - apps/mobile/app/(tabs)/notifications.tsx
  modified:
    - apps/mobile/app/(tabs)/index.tsx
    - apps/mobile/app/(tabs)/_layout.tsx
    - apps/mobile/hooks/notification/useUnreadNotificationCount.ts

key-decisions:
  - "Global notifications screen placed in (tabs) group with href:null to avoid tab bar visibility while allowing direct navigation from home bell"
  - "Used .or() PostgREST filter for community_id to include NULL values in unread count"

patterns-established:
  - "Hidden tab routes: use href: null in Tabs.Screen options for routes navigable via push but not visible in tab bar"

requirements-completed: [NOTF-02, NOTF-08]

duration: 2min
completed: 2026-03-23
---

# Phase 04 Plan 06: Notification Infrastructure Gap Closure Summary

**Global notifications route for home bell icon and NULL-safe community badge count fix**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-23T04:59:56Z
- **Completed:** 2026-03-23T05:02:06Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created global notifications screen at `/(tabs)/notifications` that shows all user notifications without community filter
- Fixed home bell icon navigation from broken `/(community)/notifications` to working `/(tabs)/notifications`
- Fixed community unread badge to include notifications with NULL community_id via OR filter

## Task Commits

Each task was committed atomically:

1. **Task 1: Create global notifications route and fix home bell navigation** - `d8fc6e5` (feat)
2. **Task 2: Fix community unread badge count to handle NULL community_id notifications** - `940d098` (fix)

## Files Created/Modified
- `apps/mobile/app/(tabs)/notifications.tsx` - Global notifications screen with SectionList, grouped by time, mark-all-read, deep link navigation
- `apps/mobile/app/(tabs)/index.tsx` - Fixed HomeNotificationBell route from `/(community)/notifications` to `/(tabs)/notifications`
- `apps/mobile/app/(tabs)/_layout.tsx` - Added notifications tab with `href: null` to hide from tab bar
- `apps/mobile/hooks/notification/useUnreadNotificationCount.ts` - Changed `.eq('community_id')` to `.or()` filter including NULL values

## Decisions Made
- Global notifications screen placed in (tabs) group with href:null -- Expo Router requires a file in the route group for navigation to work; href:null hides it from tab bar
- Used `.or('community_id.eq.${id},community_id.is.null')` PostgREST syntax -- matches both specific community and NULL community_id notifications in a single query

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed i18n error key path**
- **Found during:** Task 1 (Global notifications screen)
- **Issue:** Plan used `t('error')` but notification.json has `error` as an object with `error.load` sub-key
- **Fix:** Changed to `t('error.load')` to match existing i18n structure
- **Files modified:** apps/mobile/app/(tabs)/notifications.tsx
- **Verification:** Typecheck passes
- **Committed in:** d8fc6e5 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor i18n key path correction. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Notification infrastructure gaps from UAT are now closed
- Home tab bell icon correctly navigates to a working notifications screen
- Community badge accurately reflects unread count

---
*Phase: 04-highlights-notices-notifications-translation*
*Completed: 2026-03-23*

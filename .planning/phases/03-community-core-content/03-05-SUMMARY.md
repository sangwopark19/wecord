---
phase: 03-community-core-content
plan: 05
subsystem: ui
tags: [expo-router, tabs, routing, react-native]

# Dependency graph
requires:
  - phase: 03-community-core-content
    provides: community screens at (community)/search
provides:
  - Community tab visible in bottom tab bar via proxy route file at (tabs)/community.tsx
affects: [UAT tests for community tab, 03-community-core-content]

# Tech tracking
tech-stack:
  added: []
  patterns: [Expo Router proxy route — (tabs)/community.tsx redirects to (community)/search to satisfy file-based tab resolution]

key-files:
  created:
    - apps/mobile/app/(tabs)/community.tsx
  modified:
    - apps/mobile/app/(tabs)/_layout.tsx

key-decisions:
  - "Community tab uses proxy route pattern: (tabs)/community.tsx exists solely for Expo Router file resolution, delegates navigation to (community)/search via Redirect"
  - "Removed href override from Tabs.Screen — href is not needed when a matching route file exists"

patterns-established:
  - "Proxy route pattern: create a thin (tabs)/X.tsx that redirects to a (group)/screen when the real screen lives outside the tabs directory"

requirements-completed: [COMM-01]

# Metrics
duration: 3min
completed: 2026-03-20
---

# Phase 3 Plan 05: Community Tab Proxy Route Summary

**Expo Router proxy file at (tabs)/community.tsx fixes the UAT blocker — community tab now appears in the bottom bar and redirects to (community)/search**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-20T09:28:36Z
- **Completed:** 2026-03-20T09:31:36Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Created `(tabs)/community.tsx` proxy route so Expo Router resolves `Tabs.Screen name="community"` to a real file
- Removed the `href: '/(community)/search' as never` override from `_layout.tsx` — no longer needed with a backing file
- TypeScript compiles cleanly with no errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create community tab proxy and fix tab layout** - `4bb2b07` (feat)

## Files Created/Modified
- `apps/mobile/app/(tabs)/community.tsx` - Proxy route that returns `<Redirect href="/(community)/search" />`
- `apps/mobile/app/(tabs)/_layout.tsx` - Removed `href` override from community Tabs.Screen

## Decisions Made
- Proxy route approach preserves the existing (community) route group architecture — no files moved
- Removing `href` is correct because Expo Router no longer needs the redirect hint once a file exists

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Community tab is now visible in the bottom tab bar
- All 16 UAT tests for the community feature are unblocked
- UAT can proceed: community tab navigation, search, feed, post detail, comments, likes

---
*Phase: 03-community-core-content*
*Completed: 2026-03-20*

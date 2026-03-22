---
phase: 05-home-feed-search-community-social
plan: "03"
subsystem: ui
tags: [react-native, tanstack-query, supabase, i18n, community-profile]

requires:
  - phase: 05-02
    provides: "community profile screen with follow/unfollow and posts tab"

provides:
  - "useMemberComments hook querying comments_with_nickname view by author_cm_id"
  - "Comments tab on community profile renders member comment history with FlatList"
  - "Empty state for comments tab with i18n support in 5 locales"
  - "Tap-to-navigate from comment item to post detail screen"

affects: [community-profile, FLLW-03]

tech-stack:
  added: []
  patterns:
    - "useMemberComments follows identical pattern to useMemberPosts — same enabled guard, limit 50, ordered by created_at desc"
    - "FlatList used for bounded comment list (limit 50), consistent with Phase 03 FlatList/FlashList split rule"
    - "router.push with as never cast for untyped community routes (same pattern as Phase 03)"

key-files:
  created: []
  modified:
    - apps/mobile/hooks/community/useCommunityProfile.ts
    - apps/mobile/app/(community)/[id]/profile/[memberId].tsx
    - packages/shared/src/i18n/locales/en/community.json
    - packages/shared/src/i18n/locales/ko/community.json
    - packages/shared/src/i18n/locales/ja/community.json
    - packages/shared/src/i18n/locales/zh/community.json
    - packages/shared/src/i18n/locales/th/community.json

key-decisions:
  - "useMemberComments filters by author_cm_id (community-member UUID), not author_id (user UUID) — matches the view column semantics"
  - "FlatList (not FlashList) for comments tab — bounded list of 50 items, same reasoning as Phase 03-03 ArtistMemberScroll"

patterns-established: []

requirements-completed: [FLLW-03]

duration: 8min
completed: "2026-03-22"
---

# Phase 05 Plan 03: Community Profile Comments Tab Summary

**FLLW-03 gap closed: community profile comments tab now queries member comment history from comments_with_nickname view with FlatList rendering, empty state, and post-detail navigation**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-22T06:23:00Z
- **Completed:** 2026-03-22T06:31:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Added `MemberComment` interface and `useMemberComments` hook to `useCommunityProfile.ts` — queries `comments_with_nickname` view filtered by `author_cm_id`, ordered newest-first, limit 50
- Replaced static label in comments tab with FlatList showing content preview (3 lines) + date; loading state uses ActivityIndicator; empty state uses i18n key
- Added `profile.comments.empty` key to all 5 locale files (en/ko/ja/zh/th)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add useMemberComments hook and i18n keys for comments tab empty state** - `c990ad5` (feat)
2. **Task 2: Wire comments tab in community profile screen to render member comments** - `4f907b8` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified
- `apps/mobile/hooks/community/useCommunityProfile.ts` - Added MemberComment interface and useMemberComments hook querying comments_with_nickname view
- `apps/mobile/app/(community)/[id]/profile/[memberId].tsx` - Replaced static comments label with real FlatList + empty/loading states
- `packages/shared/src/i18n/locales/en/community.json` - Added profile.comments.empty key
- `packages/shared/src/i18n/locales/ko/community.json` - Added profile.comments.empty key
- `packages/shared/src/i18n/locales/ja/community.json` - Added profile.comments.empty key
- `packages/shared/src/i18n/locales/zh/community.json` - Added profile.comments.empty key
- `packages/shared/src/i18n/locales/th/community.json` - Added profile.comments.empty key

## Decisions Made
- `useMemberComments` filters by `author_cm_id` (not `author_id`) — the memberId passed into the profile screen is a community_members.id UUID, which maps to author_cm_id in the view
- FlatList chosen over FlashList for the comments tab — bounded dataset (limit 50), consistent with existing project rule (FlashList 2.3.0 constraints documented in Phase 03-02)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- FLLW-03 requirement fully satisfied: community profile comments tab is functional with real data
- Phase 05 complete — all planned gap closures for home-feed-search-community-social delivered

---
*Phase: 05-home-feed-search-community-social*
*Completed: 2026-03-22*

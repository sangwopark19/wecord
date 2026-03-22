---
phase: 05-home-feed-search-community-social
plan: 01
subsystem: ui
tags: [home-feed, supabase-edge-function, infinite-scroll, flash-list, carousel, react-native, tanstack-query]

# Dependency graph
requires:
  - phase: 03-community-core-content
    provides: PostCard, useFanFeed (PostWithNickname interface), CommunityCard, FlashList pattern
  - phase: 04-highlights-notices-notifications-translation
    provides: NotificationBellBadge pattern, useUnreadNotificationCount pattern

provides:
  - home-feed Supabase Edge Function (cross-community merged query, compound cursor pagination)
  - useHomeFeed hook (useInfiniteQuery, isNewUser flag, memberships)
  - useMyMemberships hook (community membership list)
  - usePromotionBanners hook (active banners from promotion_banners table)
  - useAllUnreadNotificationCount hook (all-communities realtime unread count)
  - PromotionBannerCarousel component (auto-scroll 3s, pagingEnabled FlatList, dot indicator)
  - CommunityChip component (teal border pill for unified feed PostCard)
  - RecommendationSection component (2-column CommunityCard grid)
  - HomeSearchBar component (tappable affordance to community search screen)
  - Home tab screen (app/(tabs)/index.tsx) — conditional 0-community vs 1+-community view
  - PostCard extended with showCommunityChip prop

affects:
  - 05-02 (search, community social — depends on HomeSearchBar navigation pattern)
  - 05-03 (community profile/follow — depends on CommunityChip navigation)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - home-feed Edge Function: Deno.serve + community_members lookup + single in() query across all communities + compound cursor (created_at.lt / id.lt)
    - useHomeFeed: useInfiniteQuery with functions.invoke, isLiked batch fetch, isNewUser derived from memberships length
    - PromotionBannerCarousel: useEffect + setInterval auto-scroll with useWindowDimensions for FlatList item sizing
    - PostCard showCommunityChip: optional prop pattern for context-specific rendering without breaking existing usages

key-files:
  created:
    - packages/supabase/functions/home-feed/index.ts
    - apps/mobile/hooks/home/useHomeFeed.ts
    - apps/mobile/hooks/home/usePromotionBanners.ts
    - apps/mobile/hooks/notification/useAllUnreadNotificationCount.ts
    - apps/mobile/components/home/PromotionBannerCarousel.tsx
    - apps/mobile/components/home/CommunityChip.tsx
    - apps/mobile/components/home/RecommendationSection.tsx
    - apps/mobile/components/home/HomeSearchBar.tsx
  modified:
    - apps/mobile/app/(tabs)/index.tsx
    - apps/mobile/components/post/PostCard.tsx

key-decisions:
  - "FlashList 2.3.0 does not expose estimatedItemSize prop — removed from home tab FlashList (same pre-existing constraint as Phase 03-02)"
  - "home-feed Edge Function returns isEmpty:true for 0-community users instead of error — useHomeFeed uses isNewUser to switch views"
  - "RecommendationSection uses dedicated useQuery (not useCommunitySearch) — useCommunitySearch guards empty string query and would return nothing"
  - "useAllUnreadNotificationCount mirrors useUnreadNotificationCount pattern but removes community_id filter entirely"

patterns-established:
  - "Cross-community feed: single .in('community_id', communityIds) query instead of N+1 per community"
  - "Conditional home view: isNewUser derived from memberships.length === 0, not a separate API flag"

requirements-completed: [HOME-01, HOME-02, HOME-03, HOME-04, HOME-05]

# Metrics
duration: 3min
completed: 2026-03-22
---

# Phase 05 Plan 01: Home Feed Summary

**Home-feed Edge Function + unified cross-community FlashList feed + 0-community recommendation view with auto-scroll promotion banner carousel and community chip labeling on PostCard**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-22T05:57:30Z
- **Completed:** 2026-03-22T06:00:53Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Supabase Edge Function `home-feed` merges posts across all user-joined communities in a single query with compound cursor pagination — no N+1
- Home tab replaced: 0-community users see search bar + promotion banner carousel + 2-column recommendation grid; 1+-community users see unified FlashList feed with promotion banner header
- PromotionBannerCarousel auto-scrolls every 3s with pause-on-swipe pattern and active dot indicator; renders null when no banners
- PostCard extended with `showCommunityChip` prop that renders CommunityChip (teal border pill) above the header row for cross-community context
- useAllUnreadNotificationCount provides all-communities unread badge count for home header bell icon with realtime subscription

## Task Commits

1. **Task 1: home-feed Edge Function + useHomeFeed + usePromotionBanners + useAllUnreadNotificationCount** - `e3c4927` (feat)
2. **Task 2: Home tab screen + PromotionBannerCarousel + CommunityChip + RecommendationSection + HomeSearchBar + PostCard extension** - `2aa5815` (feat)

## Files Created/Modified
- `packages/supabase/functions/home-feed/index.ts` - Cross-community feed merge Edge Function; Deno.serve, community_members lookup, single in() query, compound cursor
- `apps/mobile/hooks/home/useHomeFeed.ts` - useInfiniteQuery hook calling home-feed function; exports useMyMemberships and useHomeFeed with isNewUser flag
- `apps/mobile/hooks/home/usePromotionBanners.ts` - Queries active promotion_banners ordered by sort_order
- `apps/mobile/hooks/notification/useAllUnreadNotificationCount.ts` - All-communities unread count with realtime subscription (no community_id filter)
- `apps/mobile/components/home/PromotionBannerCarousel.tsx` - Auto-scroll FlatList carousel with pagingEnabled, dot indicator, expo-image per item
- `apps/mobile/components/home/CommunityChip.tsx` - Teal border pill with community name + people-outline icon, taps to community route
- `apps/mobile/components/home/RecommendationSection.tsx` - Section header + numColumns=2 FlatList of CommunityCard for 0-community state
- `apps/mobile/components/home/HomeSearchBar.tsx` - Tappable search affordance navigating to /(community)/search
- `apps/mobile/app/(tabs)/index.tsx` - Home tab replaced: Wecord header, HomeNotificationBell, conditional 0 vs 1+ community body
- `apps/mobile/components/post/PostCard.tsx` - Added showCommunityChip prop and CommunityChip import

## Decisions Made
- FlashList 2.3.0 does not expose `estimatedItemSize` prop — omitted from home tab FlashList (pre-existing constraint from Phase 03-02)
- RecommendationSection uses a dedicated `useRecommendedCommunities` query (order by member_count DESC, limit 20) instead of `useCommunitySearch('')` — useCommunitySearch guards against empty string and returns nothing
- home-feed Edge Function returns `isEmpty: true` for 0-community callers; `useHomeFeed` derives `isNewUser` from memberships length (not from this flag) for resilience
- `useAllUnreadNotificationCount` is a copy of `useUnreadNotificationCount` with community_id filter removed entirely from both initial query and realtime subscription

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
- FlashList 2.3.0 `estimatedItemSize` TS error (known pre-existing constraint from Phase 03-02 STATE.md) — removed prop, TypeScript passes cleanly.

## User Setup Required
None - no external service configuration required. home-feed Edge Function requires `supabase functions deploy home-feed` before first use (same as existing Edge Functions).

## Next Phase Readiness
- Home tab fully functional, ready for Phase 05-02 (search, community social features)
- CommunityChip navigation and HomeSearchBar navigation patterns established for reuse
- promotion_banners table must exist in Supabase DB (standard migration — not created in this plan, assumed present)

## Self-Check: PASSED

All created files exist on disk. Both task commits (e3c4927, 2aa5815) verified in git log.

---
*Phase: 05-home-feed-search-community-social*
*Completed: 2026-03-22*

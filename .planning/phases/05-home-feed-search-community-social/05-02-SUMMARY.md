---
phase: 05-home-feed-search-community-social
plan: "02"
subsystem: community-social
tags: [search, follow, community-profile, social-graph]
dependency_graph:
  requires: [05-01]
  provides: [post-search, community-profile, follow-unfollow, follower-following-lists]
  affects: [fan-tab, artist-tab, post-card]
tech_stack:
  added: []
  patterns:
    - debounced textSearch query via useQuery + setTimeout (300ms)
    - useFollowMember with isFollowing toggle + Alert.alert confirmation
    - profile route at (community)/[id]/profile/[memberId] with nested followers/following
    - PostCard header row as separate Pressable for profile navigation
key_files:
  created:
    - apps/mobile/hooks/search/usePostSearch.ts
    - apps/mobile/components/search/HighlightedText.tsx
    - apps/mobile/app/(community)/[id]/post-search.tsx
    - apps/mobile/hooks/community/useCommunityProfile.ts
    - apps/mobile/hooks/community/useFollowerList.ts
    - apps/mobile/hooks/community/useFollowingList.ts
    - apps/mobile/components/community/FollowButton.tsx
    - apps/mobile/app/(community)/[id]/profile/[memberId].tsx
    - apps/mobile/app/(community)/[id]/profile/[memberId]/followers.tsx
    - apps/mobile/app/(community)/[id]/profile/[memberId]/following.tsx
  modified:
    - apps/mobile/hooks/community/useFollowMember.ts
    - apps/mobile/components/post/PostCard.tsx
    - apps/mobile/app/(community)/[id]/fan.tsx
    - apps/mobile/app/(community)/[id]/artist.tsx
decisions:
  - "PostCard header row extracted as separate Pressable from content area — avoids nested Pressable complexity; header navigates to profile, content navigates to post detail"
  - "HighlightedText uses part.toLowerCase() === query.toLowerCase() comparison (not regex.test) — regex with gi flag advances lastIndex causing alternating false/true pattern on split result"
  - "useFollowMember.ts extended to add useIsFollowing export and broader cache invalidation (communityProfile, isFollowing, followerList, followingList) — previous implementation only invalidated artistMembers"
  - "CommunityProfileScreen uses FlatList placeholder for comments tab — no comments_with_nickname view query built yet, stub acceptable as phase 5 goal is post display"
metrics:
  duration_seconds: 311
  completed_date: "2026-03-22"
  tasks_completed: 2
  files_changed: 14
---

# Phase 05 Plan 02: Community Search & Social Graph Summary

In-community post full-text search with teal keyword highlighting + follow/unfollow social graph with community profile, follower/following lists, and PostCard avatar navigation.

## What Was Built

### Task 1: Post Search + HighlightedText + Fan/Artist Search Icon + PostCard highlight prop

- **`usePostSearch`** — debounced (300ms setTimeout pattern) full-text search hook using Supabase `textSearch('content', query, { type: 'websearch', config: 'simple' })` on `posts_with_nickname` view; returns `{ query, setQuery, debouncedQuery, ...queryResult }`
- **`HighlightedText`** — renders text with matched keyword segments in Teal (#00E5C3); splits on case-insensitive regex, compares parts by `toLowerCase()` to avoid regex lastIndex alternation bug
- **`PostSearchScreen`** — SafeAreaView with autoFocused TextInput, FlashList results with `highlightQuery` prop on PostCard, empty/error states with i18n keys
- **Fan tab** — added `search-outline` icon button (top-right, 44x44 touch target) navigating to `/(community)/[id]/post-search`
- **Artist tab** — same search icon with same navigation pattern
- **PostCard** — added `highlightQuery?: string` prop; when provided, renders content via `HighlightedText` instead of plain `Text`

### Task 2: Follow Hooks + FollowButton + CommunityProfile + Follower/Following Lists + PostCard Navigation

- **`useFollowMember`** (extended) — added `useIsFollowing` query; expanded `onSuccess` to invalidate `communityProfile`, `isFollowing`, `followerList`, `followingList` caches
- **`useCommunityProfile`** — queries `community_members` for profile data; exports `useMemberPosts` and `useMemberPostCount` for profile content
- **`useFollowerList`** — queries `community_follows` with PostgREST join on `community_members!community_follows_follower_cm_id_fkey`
- **`useFollowingList`** — same pattern via `community_follows_following_cm_id_fkey`
- **`FollowButton`** — teal filled (not following) / outlined (following) toggle; `Alert.alert` unfollow confirmation with `profile.unfollowConfirm.*` i18n keys; `accessibilityState={{ selected }}`
- **`CommunityProfileScreen`** — back nav, avatar (expo-image or placeholder), community nickname, stats row (posts/followers/following with tappable follower/following counts), FollowButton, Posts/Comments tab bar with FlashList of posts
- **`FollowerListScreen`** — header + FlatList of followers with avatar, nickname (pressable → profile), FollowButton per row
- **`FollowingListScreen`** — same pattern for following list
- **PostCard** — header row (avatar + nickname) is now a separate `Pressable` that navigates to `/(community)/[cid]/profile/[author_cm_id]`; own posts skip navigation (`author_id === user?.id`)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Import paths] CommunityProfileScreen import paths needed 4 levels up not 3**
- **Found during:** Task 2 typecheck
- **Issue:** File at `app/(community)/[id]/profile/[memberId].tsx` requires 4 `../` levels to reach root hooks/components, not 3
- **Fix:** Changed all imports from `../../../` to `../../../../`
- **Commit:** 7370675

**2. [Rule 1 - Bug] PostCard nested Pressable restructured to avoid tap collision**
- **Found during:** Task 2 implementation
- **Issue:** Nesting a header Pressable inside the content Pressable would cause both to fire on header tap
- **Fix:** Split PostCard into two sequential Pressables: header row (profile nav) then content area (post detail nav)
- **Commit:** 7370675

## Known Stubs

- **CommunityProfileScreen comments tab** (`app/(community)/[id]/profile/[memberId].tsx`): Comments tab renders a static label only — no query for member's comments yet. The plan's primary goal (profile + follow + posts tab) is achieved. Comments tab query can be added when a `comments_with_nickname` view is available.

## Self-Check: PASSED

All 10 created files found on disk. Both task commits (645f2a3, 7370675) confirmed in git log.

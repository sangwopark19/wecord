---
phase: 03-community-core-content
plan: 02
subsystem: community-feed
tags: [fan-feed, post-creation, infinite-scroll, flashlist, media-upload, supabase-storage, i18n]
dependency_graph:
  requires:
    - 03-01 (communityStore, useCommunityMember, community i18n namespace, fan.tsx placeholder)
    - packages/db/schema/content.ts (posts_with_nickname view, posts table, likes table)
    - packages/db/schema/follow.ts (community_follows table)
    - expo-image-manipulator (installed in 03-01)
    - expo-image-picker (installed in 03-01)
    - @shopify/flash-list (installed in 03-01)
  provides:
    - useFanFeed: cursor-based infinite scroll hook with sort/filter/isLiked
    - useCreatePost: image compress + Supabase Storage upload + posts INSERT
    - useDeletePost: optimistic cache removal with rollback
    - PostCard: author_nickname display, MediaGrid, CreatorBadge, like/comment action bar
    - MediaGrid: 1/2/3/4+ image layouts + video overlay
    - CreatorBadge: teal "Creator" inline pill
    - SortFilterChipBar: sort (latest/popular) + filter (all/following/hot) chips
    - FAB: bottom-24 right-4, navigates to compose
    - DeleteConfirmDialog: imperative Alert.alert helper
    - fan.tsx: full fan feed screen with FlashList, sort/filter, pull-to-refresh, empty/error state
    - compose.tsx: full-screen post composer with text + image (10 max) + video (1, mutually exclusive)
    - [postId].tsx: post detail screen with full body, comment placeholder, delete for own posts
  affects:
    - apps/mobile/app/(community)/[id]/fan.tsx (replaced placeholder)
    - packages/shared/src/i18n/locales/*/community.json (merged feed/post/common keys)
tech_stack:
  added: []
  patterns:
    - useInfiniteQuery with cursor-based pagination (created_at + id composite cursor) for latest sort
    - Offset pagination capped at 3 pages (45 posts total) for popular sort
    - Optimistic cache update with onMutate/onError snapshot rollback in useDeletePost
    - expo-image-manipulator compress (1080px width, JPEG 0.7) before Supabase Storage upload
    - Batch likes query merged into feed result (isLiked boolean per post)
    - Imperative Alert.alert pattern for delete/confirm dialogs (same as LeaveConfirmDialog in 03-01)
    - as never cast for /(community)/compose route (not in expo-router typed registry)
key_files:
  created:
    - apps/mobile/hooks/post/useFanFeed.ts
    - apps/mobile/hooks/post/useCreatePost.ts
    - apps/mobile/hooks/post/useDeletePost.ts
    - apps/mobile/components/post/PostCard.tsx
    - apps/mobile/components/post/MediaGrid.tsx
    - apps/mobile/components/post/CreatorBadge.tsx
    - apps/mobile/components/post/SortFilterChipBar.tsx
    - apps/mobile/components/post/FAB.tsx
    - apps/mobile/components/post/DeleteConfirmDialog.tsx
    - apps/mobile/app/(community)/compose.tsx
    - apps/mobile/app/(community)/[id]/post/[postId].tsx
    - apps/mobile/tests/post.test.ts
    - apps/mobile/tests/feed.test.ts
  modified:
    - apps/mobile/app/(community)/[id]/fan.tsx (replaced placeholder with full FlashList screen)
    - packages/shared/src/i18n/locales/ko/community.json (merged feed/post/common keys)
    - packages/shared/src/i18n/locales/en/community.json
    - packages/shared/src/i18n/locales/ja/community.json
    - packages/shared/src/i18n/locales/th/community.json
    - packages/shared/src/i18n/locales/zh/community.json
decisions:
  - "(03-02): FlashList 2.3.0 (installed) does not expose estimatedItemSize prop — documented as comment in fan.tsx, addressable after upgrade to FlashList 2.7+"
  - "(03-02): useDeletePost uses onSettled invalidateQueries in addition to onMutate optimistic removal — ensures consistency after server delete"
  - "(03-02): DeleteConfirmDialog implemented as imperative showDeleteConfirmDialog() function — consistent with useLeaveConfirmDialog hook pattern from 03-01"
  - "(03-02): Popular sort uses offset pagination capped at page >= 2 (45 posts) — avoids unbounded scroll on score-based sort"
metrics:
  duration: 6 min
  completed_date: "2026-03-20T03:17:52Z"
  tasks_completed: 2
  files_created: 13
  files_modified: 5
---

# Phase 3 Plan 2: Fan Feed Summary

Fan feed with FlashList infinite scroll, post creation with image/video compression and Supabase Storage upload, sort/filter chips, post detail, and post deletion with optimistic cache updates — all using `posts_with_nickname` view for persona isolation.

## What Was Built

- **3 hooks**: `useFanFeed` (cursor-based infinite scroll, sort/filter/isLiked batch merge), `useCreatePost` (expo-image-manipulator compress + Storage upload + posts INSERT), `useDeletePost` (optimistic removal + snapshot rollback)
- **6 components**: `PostCard` (author_nickname, CreatorBadge, MediaGrid, like/comment bar), `MediaGrid` (1/2/3/4+ layouts + video overlay), `CreatorBadge` (teal pill), `SortFilterChipBar` (sort+filter chips), `FAB` (bottom-24 right-4), `DeleteConfirmDialog` (imperative Alert.alert)
- **3 screens**: `fan.tsx` (FlashList + sort/filter + pull-to-refresh + empty/error states + FAB), `compose.tsx` (text 2000 char + image 10 max + video 1, mutually exclusive, MediaThumbnailGrid), `[postId].tsx` (full post + comment placeholder + delete for own posts)
- **i18n**: Merged `feed.*`, `post.*`, `common.*` keys into all 5 locale community.json files
- **Tests**: `post.test.ts` (upload + insert + delete), `feed.test.ts` (posts_with_nickname, cursor, offset, hot filter, queryKey isolation)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] FlashList 2.3.0 does not support `estimatedItemSize` prop**
- **Found during:** Task 2 typecheck
- **Issue:** Plan specified `estimatedItemSize={120}` on FlashList component but FlashList@2.3.0's `FlashListProps` type does not include this prop (it was added in later versions). TypeScript error TS2322.
- **Fix:** Removed the prop and added a comment documenting the intent. The `overrideItemLayout` alternative in 2.3.0 only accepts `span` (column span), not size. Will be addressable after upgrading FlashList to 2.7+.
- **Files modified:** `apps/mobile/app/(community)/[id]/fan.tsx`
- **Commit:** 1a2ed2a

## Self-Check: PASSED

Files verified:
- apps/mobile/hooks/post/useFanFeed.ts: FOUND
- apps/mobile/hooks/post/useCreatePost.ts: FOUND
- apps/mobile/hooks/post/useDeletePost.ts: FOUND
- apps/mobile/components/post/PostCard.tsx: FOUND
- apps/mobile/components/post/MediaGrid.tsx: FOUND
- apps/mobile/components/post/CreatorBadge.tsx: FOUND
- apps/mobile/components/post/SortFilterChipBar.tsx: FOUND
- apps/mobile/components/post/FAB.tsx: FOUND
- apps/mobile/components/post/DeleteConfirmDialog.tsx: FOUND
- apps/mobile/app/(community)/compose.tsx: FOUND
- apps/mobile/app/(community)/[id]/post/[postId].tsx: FOUND

Commits verified:
- 491b599: feat(03-02): post hooks and reusable post components
- 1a2ed2a: feat(03-02): fan feed screen, post composer modal, and post detail screen

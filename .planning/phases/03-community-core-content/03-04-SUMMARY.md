---
phase: 03-community-core-content
plan: "04"
subsystem: community-interactions
tags: [comments, likes, optimistic-updates, react-native-reanimated, spring-animation, i18n]
dependency_graph:
  requires: ["03-02"]
  provides: ["comment-thread", "like-toggle", "post-detail-full"]
  affects: ["apps/mobile/app/(community)/[id]/post/[postId].tsx"]
tech_stack:
  added: ["react-native-reanimated withSpring/withSequence", "useMutation optimistic updates"]
  patterns: ["comment thread grouping (root+replies)", "1-depth reply guard", "creator reply highlight"]
key_files:
  created:
    - apps/mobile/hooks/post/useLike.ts
    - apps/mobile/hooks/comment/useComments.ts
    - apps/mobile/hooks/comment/useCreateComment.ts
    - apps/mobile/hooks/comment/useDeleteComment.ts
    - apps/mobile/components/post/LikeButton.tsx
    - apps/mobile/components/comment/CommentRow.tsx
    - apps/mobile/components/comment/ReplyRow.tsx
    - apps/mobile/tests/likes.test.ts
    - apps/mobile/tests/comment.test.ts
  modified:
    - apps/mobile/app/(community)/[id]/post/[postId].tsx
    - packages/shared/src/i18n/locales/ko/community.json
    - packages/shared/src/i18n/locales/en/community.json
    - packages/shared/src/i18n/locales/ja/community.json
    - packages/shared/src/i18n/locales/th/community.json
    - packages/shared/src/i18n/locales/zh/community.json
decisions:
  - "LikeButton uses withSequence(withSpring(1.2), withSpring(1.0)) for scale animation — matches tension 200 / friction 7 spec"
  - "CommentRow delete uses inline Alert.alert (not reusable dialog) to keep component self-contained"
  - "useCreateComment fetches member role via supabase query inside mutationFn — avoids stale hook data in reply flows"
  - "PostDetailScreen renders both PostCard and a separate LikeButton row — PostCard contains its own inline pressable for visual, but the wired useLike is on the LikeButton component"
metrics:
  duration_seconds: 435
  completed_at: "2026-03-20T03:27:53Z"
  tasks_completed: 2
  files_created: 9
  files_modified: 7
---

# Phase 3 Plan 4: Comments, Likes, and Post Detail Summary

**One-liner:** Comment thread with 1-depth replies, creator reply teal highlight, and optimistic like toggle with reanimated spring scale on posts and comments.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Like hook + comment hooks + LikeButton | 13e5d9a | useLike.ts, useComments.ts, useCreateComment.ts, useDeleteComment.ts, LikeButton.tsx, tests |
| 2 | CommentRow + ReplyRow + PostDetail integration + i18n | 122327c | CommentRow.tsx, ReplyRow.tsx, [postId].tsx, 5x community.json |

## What Was Built

### Like System
- `useLike('post' | 'comment')` — optimistic mutation that toggles like_count and isLiked in TanStack Query cache. Restores snapshot on error. Handles 23505 duplicate-key gracefully (already liked, ignore). Invalidates feed query on settle.
- `LikeButton` — Ionicons heart, teal fill when liked, reanimated spring scale 1.0→1.2→1.0 (damping:10, stiffness:200). Minimum 44×44px touch target. Full accessibility labels.

### Comment System
- `useComments(postId)` — fetches flat list with `community_members!inner(community_nickname, id, role)` join, structures into `{ rootComments: CommentWithReplies[] }` (roots with replies array). Batch-fetches comment isLiked for current user.
- `useCreateComment()` — validates 500-char limit, enforces 1-depth guard (fetches parent to check if it's already a reply), detects creator role, sets `is_creator_reply` correctly.
- `useDeleteComment()` — simple delete mutation with comment and post query invalidation.

### UI Components
- `CommentRow` — avatar + community_nickname (teal if creator) + CreatorBadge + relative time + body + LikeButton (sm) + reply button + conditional delete (own comment with Alert.alert confirmation).
- `ReplyRow` — identical to CommentRow but ml-12 (48px indent), 28px avatar, no reply button, creator highlight driven by `is_creator_reply` field.

### Post Detail Screen
- Replaced "Comments coming soon" placeholder with full comment thread rendering.
- Post like wired to `useLike('post')` with feedQueryKey.
- Comment likes wired to `useLike('comment')` with comments queryKey.
- Reply mode state: tap "답글" → sets replyTarget, shows "@nickname에게 답글 중" indicator with X cancel. Clears on send success.
- Character counter appears when > 450 chars.
- KeyboardAvoidingView for iOS/Android input bar behavior.

### i18n
- Added `comment` namespace to all 5 locales (ko/en/ja/th/zh) with placeholder, send, reply, replyTo, empty heading/body, header count, delete confirm message.

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- `npm run typecheck` — PASS (4/4 packages clean)
- `pnpm test` — PASS (33/33 tests across 11 test files)
- `grep community_nickname apps/mobile/components/comment/` — matches in CommentRow.tsx
- `grep is_creator_reply apps/mobile/components/comment/` — matches in ReplyRow.tsx
- `grep withSpring apps/mobile/components/post/LikeButton.tsx` — matches
- `grep useLike apps/mobile/app/(community)/` — matches in [postId].tsx

## Self-Check: PASSED

All key files verified present. Both task commits (13e5d9a, 122327c) confirmed in git log.

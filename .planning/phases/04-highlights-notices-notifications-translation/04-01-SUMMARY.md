---
phase: 04-highlights-notices-notifications-translation
plan: 01
subsystem: highlight-ui, i18n, db-schema
tags: [highlight, i18n, supabase, edge-function, react-native, drizzle]
dependency_graph:
  requires: []
  provides:
    - highlight Edge Function (packages/supabase/functions/highlight/index.ts)
    - push_tokens DB table + notifications.community_id migration
    - 4 i18n namespaces (highlight, notification, notice, translation) x 5 languages
    - 7 Highlight tab UI components + useHighlight hook
  affects:
    - apps/mobile/app/(community)/[id]/index.tsx (HighlightPlaceholder replaced)
    - packages/shared/src/i18n/index.ts (4 new namespaces registered)
tech_stack:
  added:
    - Supabase Edge Function (Deno) for aggregated highlight data
    - pgmq, pg_cron, pg_net extensions enabled
    - push_tokens table for Expo push notification tokens
  patterns:
    - Promise.all for parallel Supabase queries in Edge Function
    - TanStack Query useQuery with staleTime for highlight data
    - Animated.loop skeleton shimmer for loading state
    - expo-image with conditional render guard (no undefined uri)
key_files:
  created:
    - packages/supabase/migrations/20260320100000_phase4_push_tokens_community_id.sql
    - packages/supabase/functions/highlight/index.ts
    - apps/mobile/hooks/highlight/useHighlight.ts
    - apps/mobile/components/highlight/HighlightSectionHeader.tsx
    - apps/mobile/components/highlight/HorizontalCardScroll.tsx
    - apps/mobile/components/highlight/CompactPostCard.tsx
    - apps/mobile/components/highlight/CalendarPlaceholderCard.tsx
    - apps/mobile/components/highlight/NoticeListCard.tsx
    - apps/mobile/components/highlight/ArtistMemberCard.tsx
    - packages/shared/src/i18n/locales/ko/highlight.json
    - packages/shared/src/i18n/locales/ko/notification.json
    - packages/shared/src/i18n/locales/ko/notice.json
    - packages/shared/src/i18n/locales/ko/translation.json
    - packages/shared/src/i18n/locales/en/highlight.json
    - packages/shared/src/i18n/locales/en/notification.json
    - packages/shared/src/i18n/locales/en/notice.json
    - packages/shared/src/i18n/locales/en/translation.json
    - packages/shared/src/i18n/locales/ja/highlight.json
    - packages/shared/src/i18n/locales/ja/notification.json
    - packages/shared/src/i18n/locales/ja/notice.json
    - packages/shared/src/i18n/locales/ja/translation.json
    - packages/shared/src/i18n/locales/th/highlight.json
    - packages/shared/src/i18n/locales/th/notification.json
    - packages/shared/src/i18n/locales/th/notice.json
    - packages/shared/src/i18n/locales/th/translation.json
    - packages/shared/src/i18n/locales/zh/highlight.json
    - packages/shared/src/i18n/locales/zh/notification.json
    - packages/shared/src/i18n/locales/zh/notice.json
    - packages/shared/src/i18n/locales/zh/translation.json
  modified:
    - packages/db/src/schema/notification.ts
    - packages/supabase/config.toml
    - packages/shared/src/i18n/index.ts
    - apps/mobile/app/(community)/[id]/index.tsx
decisions:
  - "[04-01]: highlight Edge Function accepts POST with {community_id} in body — supabase.functions.invoke does not support GET query params"
  - "[04-01]: HorizontalCardScroll renderItem typed as () => ReactElement (not ReactNode) — FlatList ListRenderItem requires non-undefined return"
  - "[04-01]: SkeletonBar width typed as number only — Animated.View does not accept string width in style prop"
  - "[04-01]: pgmq/pg_cron/pg_net extensions added to config.toml using schema name string format per Supabase TOML spec"
metrics:
  duration_seconds: 286
  completed_date: "2026-03-20"
  tasks_completed: 2
  files_created: 29
  files_modified: 4
---

# Phase 04 Plan 01: DB Migration, i18n Infrastructure, and Highlight Tab Summary

**One-liner:** push_tokens table + notifications.community_id migration, 4 i18n namespaces x 5 languages, and Highlight tab with 5 sections powered by a single Edge Function using parallel DB queries.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | DB migration, Drizzle schema, Supabase extensions, 20 i18n files | 1f019ba |
| 2 | highlight Edge Function, 7 Highlight UI components, replace HighlightPlaceholder | ab05fbb |

## What Was Built

### Task 1: Infrastructure

- **SQL Migration** (`20260320100000_phase4_push_tokens_community_id.sql`): Creates `push_tokens` table with RLS policies, adds `community_id` column to `notifications` with composite indexes, enables pgmq/pg_cron/pg_net extensions.
- **Drizzle schema**: Added `communityId` field and `member_post` to the type union in `notification.ts`.
- **config.toml**: Added `[db.extensions]` block with pgmq, pg_cron, pg_net using Supabase TOML schema name format.
- **i18n**: 20 JSON files (4 namespaces x 5 languages) with Korean canonical text, English translations, and English placeholders for JA/TH/ZH. All registered in `i18n/index.ts`.

### Task 2: Highlight Tab

- **highlight Edge Function**: POST-based, accepts `{community_id}` in body, uses user-context Supabase client (RLS enforced), runs 4 parallel queries via `Promise.all`, returns `{notices, creatorPosts, fanPosts, artistMembers}`.
- **useHighlight hook**: TanStack Query hook with 2-minute staleTime.
- **7 UI components**: HighlightSectionHeader (44px touch target, teal see-more), HorizontalCardScroll (generic FlatList), CompactPostCard (120x160 fixed, thumbnail guard), CalendarPlaceholderCard (calendar-outline), NoticeListCard (teal pinned dot), ArtistMemberCard (56px circular avatar).
- **CommunityMainScreen**: HighlightPlaceholder fully removed, replaced with inline HighlightScreen supporting loading skeleton (animated shimmer), error+retry, empty state, and 5 ordered sections.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] FlatList renderItem type required ReactElement not ReactNode**
- **Found during:** Task 2 typecheck
- **Issue:** `HorizontalCardScroll` renderItem prop typed as `() => ReactNode` but FlatList's `ListRenderItem<T>` requires `ReactElement | null` (not undefined)
- **Fix:** Changed return type to `() => ReactElement`
- **Files modified:** `apps/mobile/components/highlight/HorizontalCardScroll.tsx`
- **Commit:** ab05fbb

**2. [Rule 1 - Bug] Animated.View width prop rejected string values**
- **Found during:** Task 2 typecheck
- **Issue:** `SkeletonBar` width typed as `number | string` but `Animated.View` style only accepts numeric width
- **Fix:** Changed SkeletonBar width prop to `number` only; all usages already used numeric values
- **Files modified:** `apps/mobile/app/(community)/[id]/index.tsx`
- **Commit:** ab05fbb

## Self-Check: PASSED

Files verified:
- packages/supabase/migrations/20260320100000_phase4_push_tokens_community_id.sql: EXISTS
- packages/supabase/functions/highlight/index.ts: EXISTS (contains Deno.serve, Promise.all, notices, creatorPosts, fanPosts, artistMembers)
- apps/mobile/hooks/highlight/useHighlight.ts: EXISTS (contains useQuery, highlight)
- apps/mobile/components/highlight/CompactPostCard.tsx: EXISTS (contains width: 120, height: 160)
- apps/mobile/components/highlight/CalendarPlaceholderCard.tsx: EXISTS (contains calendar-outline, calendarComingSoon)
- apps/mobile/components/highlight/HighlightSectionHeader.tsx: EXISTS (contains seeMore, #00E5C3)
- apps/mobile/components/highlight/HorizontalCardScroll.tsx: EXISTS (contains FlatList, horizontal)
- apps/mobile/components/highlight/NoticeListCard.tsx: EXISTS (contains is_pinned)
- apps/mobile/components/highlight/ArtistMemberCard.tsx: EXISTS (contains borderRadius: 28)
- All 20 i18n files: CREATED
- apps/mobile/app/(community)/[id]/index.tsx: DOES NOT contain HighlightPlaceholder, DOES contain useHighlight
- Commits 1f019ba and ab05fbb: EXIST

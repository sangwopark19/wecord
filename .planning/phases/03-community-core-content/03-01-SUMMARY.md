---
phase: 03-community-core-content
plan: 01
subsystem: community
tags: [community, search, join, navigation, i18n, supabase, storage]
dependency_graph:
  requires:
    - 02-auth-onboarding (authStore, supabase client, generate-nickname edge function)
    - packages/db/schema/community.ts (communities, community_members tables)
    - packages/db/schema/artist-member.ts (artist_members table)
  provides:
    - Community search screen (2-column grid, textSearch)
    - Community preview with member count, recent posts, artist thumbnails
    - Join flow with auto-generated User#XXXX nickname
    - Community main screen with Fan/Artist/Highlight 3-tab shell
    - Nickname edit screen
    - Leave community with confirmation dialog
    - communityStore (activeCommunityId, selectedArtistMemberId)
  affects:
    - apps/mobile/app/(tabs)/_layout.tsx (added Community tab)
    - packages/shared/src/i18n/index.ts (added community namespace)
tech_stack:
  added:
    - "@shopify/flash-list@2.3.0"
    - "expo-image@~55.0.6"
    - "expo-image-picker@~55.0.13"
    - "expo-image-manipulator@~55.0.11"
    - "react-native-reanimated@~4.2.2"
  patterns:
    - Zustand store for community context (activeCommunityId, selectedArtistMemberId)
    - useQuery for community data, useMutation for join/leave/update
    - textSearch('name', query, { type: 'websearch', config: 'simple' }) for community search
    - posts_with_nickname view for post queries (persona isolation)
    - as never cast for (community) routes not in expo-router typed registry
key_files:
  created:
    - packages/supabase/migrations/20260320000001_phase3_triggers_storage.sql
    - packages/shared/src/i18n/locales/ko/community.json
    - packages/shared/src/i18n/locales/en/community.json
    - packages/shared/src/i18n/locales/ja/community.json
    - packages/shared/src/i18n/locales/th/community.json
    - packages/shared/src/i18n/locales/zh/community.json
    - apps/mobile/stores/communityStore.ts
    - apps/mobile/hooks/community/useCommunitySearch.ts
    - apps/mobile/hooks/community/useJoinCommunity.ts
    - apps/mobile/hooks/community/useCommunityMember.ts
    - apps/mobile/hooks/community/useLeaveCommunity.ts
    - apps/mobile/components/community/CommunityCard.tsx
    - apps/mobile/components/community/CommunityPreviewSheet.tsx
    - apps/mobile/components/community/CommunityNicknameInput.tsx
    - apps/mobile/components/community/CommunityTabBar.tsx
    - apps/mobile/components/community/HighlightPlaceholder.tsx
    - apps/mobile/components/community/LeaveConfirmDialog.tsx
    - apps/mobile/app/(community)/_layout.tsx
    - apps/mobile/app/(community)/search.tsx
    - apps/mobile/app/(community)/[id]/_layout.tsx
    - apps/mobile/app/(community)/[id]/preview.tsx
    - apps/mobile/app/(community)/[id]/join.tsx
    - apps/mobile/app/(community)/[id]/index.tsx
    - apps/mobile/app/(community)/[id]/fan.tsx
    - apps/mobile/app/(community)/[id]/artist.tsx
    - apps/mobile/app/(community)/[id]/highlight.tsx
    - apps/mobile/app/(community)/[id]/settings/nickname.tsx
    - apps/mobile/tests/community.test.ts
  modified:
    - apps/mobile/package.json (added 5 new dependencies)
    - apps/mobile/babel.config.js (added reanimated plugin)
    - apps/mobile/app.json (added expo-image-picker plugin)
    - packages/shared/src/i18n/index.ts (registered community namespace)
    - apps/mobile/app/(tabs)/_layout.tsx (added Community tab)
decisions:
  - "(03-01): useTranslation imported from @wecord/shared/i18n (not @wecord/shared) — matches existing onboarding pattern"
  - "(03-01): as never cast for /(community)/* routes — not yet in expo-router typed registry"
  - "(03-01): useLeaveCommunity uses router.replace('/(community)/search' as never) after leave — navigates back to search"
  - "(03-01): LeaveConfirmDialog implemented as useLeaveConfirmDialog hook (imperative Alert.alert) — React Native pattern"
  - "(03-01): Community tab in (tabs)/_layout uses href: '/(community)/search' as never — community screens live outside tabs group"
metrics:
  duration: 7 min
  completed_date: "2026-03-20T03:09:19Z"
  tasks_completed: 3
  files_created: 27
  files_modified: 5
---

# Phase 3 Plan 1: Community Foundation Summary

Community search, join, preview, 3-tab main shell, nickname edit, and leave implemented using Supabase textSearch + community_members mutations with Zustand store for community context.

## What Was Built

- **DB Migration**: `20260320000001_phase3_triggers_storage.sql` — like/comment/member count triggers and post-media storage bucket
- **i18n**: Community namespace (5 languages: ko, en, ja, th, zh) registered in shared i18n
- **communityStore**: Zustand store tracking `activeCommunityId`, `activeCommunityType`, `selectedArtistMemberId`
- **4 hooks**: `useCommunitySearch` (textSearch), `useJoinCommunity` (insert + 23505 retry), `useCommunityMember` (membership gate), `useLeaveCommunity` (delete + navigate)
- **6 components**: `CommunityCard`, `CommunityPreviewSheet`, `CommunityNicknameInput`, `CommunityTabBar`, `HighlightPlaceholder`, `LeaveConfirmDialog`
- **10 screens**: community search, preview, join, main (Fan/Artist/Highlight tabs), fan/artist/highlight stubs, nickname settings

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `@wecord/shared` does not export `useTranslation` directly**
- **Found during:** Task 2a typecheck
- **Issue:** Plan specified `import { useTranslation } from '@wecord/shared'` but shared/src/index.ts only exports `initI18n`, `SUPPORTED_LANGUAGES`, `SupportedLanguage`. The existing app pattern uses `@wecord/shared/i18n`.
- **Fix:** Changed all community components/screens to `import { useTranslation } from '@wecord/shared/i18n'`
- **Files modified:** All 6 community components + screens using useTranslation
- **Commit:** b053708

**2. [Rule 1 - Bug] `useLeaveCommunity` router.replace route type error**
- **Found during:** Task 2a typecheck
- **Issue:** `'/(community)/search'` not in expo-router typed route registry (community group not yet registered)
- **Fix:** Added `as never` cast — consistent with existing onboarding route pattern
- **Commit:** b053708

**3. [Rule 1 - Bug] Community tab in (tabs)/_layout cannot navigate to external group**
- **Found during:** Task 2b implementation
- **Issue:** Community screens live in `(community)` group outside `(tabs)`, so `href` needed `as never` cast
- **Fix:** Used `href: '/(community)/search' as never` in tab options
- **Commit:** 26c3dcc

## Self-Check: PASSED

Files verified:
- apps/mobile/app/(community)/search.tsx: FOUND
- apps/mobile/app/(community)/[id]/preview.tsx: FOUND
- apps/mobile/app/(community)/[id]/join.tsx: FOUND
- apps/mobile/app/(community)/[id]/index.tsx: FOUND
- apps/mobile/hooks/community/useCommunitySearch.ts: FOUND
- apps/mobile/stores/communityStore.ts: FOUND

Commits verified:
- 55bfe78: chore(03-01): install Phase 3 deps, DB triggers migration, community i18n
- b053708: feat(03-01): community store, hooks, and reusable components
- 26c3dcc: feat(03-01): community screens - search, preview, join, main shell, nickname settings

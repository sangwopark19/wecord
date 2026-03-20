---
phase: 04-highlights-notices-notifications-translation
plan: "04"
subsystem: translation
tags: [translation, edge-function, google-translate, cache-first, i18n]
one-liner: "Cache-first translate Edge Function (DB -> Google Translate API -> DB) with teal TranslateButton/TranslatedTextBlock wired into PostCard, CommentRow, and ReplyRow"

dependency-graph:
  requires:
    - "04-03 (notifications infrastructure)"
    - "packages/db/src/schema/translation.ts (post_translations table)"
    - "packages/shared/src/i18n/locales/*/translation.json (i18n keys)"
  provides:
    - "packages/supabase/functions/translate/index.ts (translate Edge Function)"
    - "apps/mobile/hooks/post/useTranslate.ts (translation hook)"
    - "apps/mobile/components/post/TranslateButton.tsx"
    - "apps/mobile/components/post/TranslatedTextBlock.tsx"
  affects:
    - "apps/mobile/components/post/PostCard.tsx"
    - "apps/mobile/components/comment/CommentRow.tsx"
    - "apps/mobile/components/comment/ReplyRow.tsx"

tech-stack:
  added: []
  patterns:
    - "Cache-first: DB check -> Google Translate API -> DB upsert"
    - "In-memory toggle: fetch once, hide/re-show without re-fetch"
    - "Service role key for post_translations INSERT (authenticated users blocked by RLS)"
    - "upsert with onConflict for race-condition-safe cache writes"

key-files:
  created:
    - packages/supabase/functions/translate/index.ts
    - apps/mobile/hooks/post/useTranslate.ts
    - apps/mobile/components/post/TranslateButton.tsx
    - apps/mobile/components/post/TranslatedTextBlock.tsx
  modified:
    - apps/mobile/components/post/PostCard.tsx
    - apps/mobile/components/comment/CommentRow.tsx
    - apps/mobile/components/comment/ReplyRow.tsx

decisions:
  - "[04-04]: useTranslate uses profile.language (not preferred_language) — Profile interface field is 'language', plan had a typo"
  - "[04-04]: PostDetail screen inherits translation automatically via PostCard reuse — no separate integration needed"
  - "[04-04]: Replies use target_type='comment' — replies are stored in the comments table"

metrics:
  duration: "3 min"
  completed_date: "2026-03-20"
  tasks_completed: 2
  files_created: 4
  files_modified: 3
---

# Phase 4 Plan 4: Translation System Summary

## What Was Built

Cache-first translation system: a `translate` Supabase Edge Function backed by Google Translate API with DB caching, plus UI components integrated into all content views.

## Tasks Completed

### Task 1: translate Edge Function + useTranslate hook
- **Commit:** `9f6d8a8`
- **Files:** `packages/supabase/functions/translate/index.ts`, `apps/mobile/hooks/post/useTranslate.ts`
- Edge Function: DB cache check first -> Google Translate API call -> DB upsert with `onConflict` for race safety
- Uses `SUPABASE_SERVICE_ROLE_KEY` because `post_translations` INSERT RLS blocks authenticated users
- Hook manages toggle state: first tap fetches, second tap hides (in memory), third tap re-shows instantly
- Uses `profile.language` (not `preferred_language` as in plan — deviation corrected)

### Task 2: TranslateButton + TranslatedTextBlock + wiring
- **Commit:** `e0c1fa6`
- **Files:** `TranslateButton.tsx`, `TranslatedTextBlock.tsx`, `PostCard.tsx`, `CommentRow.tsx`, `ReplyRow.tsx`
- TranslateButton: teal (#00E5C3) language-outline Ionicon, 44px touch target, ActivityIndicator when loading, toggles between "번역하기" / "원문 보기"
- TranslatedTextBlock: border-t separator, 14px text with lineHeight 21, "번역됨 · Google Translate" credit
- Wired into PostCard (between content and action bar), CommentRow, and ReplyRow
- PostDetail screen inherits translation via PostCard reuse

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed profile field name mismatch**
- **Found during:** Task 1
- **Issue:** Plan used `profile?.preferred_language` but the `Profile` interface in `authStore.ts` defines the field as `language`
- **Fix:** Changed to `profile?.language ?? 'en'` in `useTranslate.ts`
- **Files modified:** `apps/mobile/hooks/post/useTranslate.ts`
- **Commit:** `9f6d8a8`

## Self-Check: PASSED

Files exist:
- FOUND: packages/supabase/functions/translate/index.ts
- FOUND: apps/mobile/hooks/post/useTranslate.ts
- FOUND: apps/mobile/components/post/TranslateButton.tsx
- FOUND: apps/mobile/components/post/TranslatedTextBlock.tsx

Commits exist:
- FOUND: 9f6d8a8 (Task 1)
- FOUND: e0c1fa6 (Task 2)

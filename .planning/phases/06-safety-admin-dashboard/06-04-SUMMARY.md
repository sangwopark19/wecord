---
phase: 06-safety-admin-dashboard
plan: 04
subsystem: api
tags: [edge-function, moderation, openai, banned-words, rate-limit, deno]

requires:
  - phase: 06-01
    provides: "reports table, user_sanctions table, contains_banned_word RPC, check_post_rate_limit RPC"
provides:
  - "moderate Edge Function with 3-layer content screening (banned words, rate limit, OpenAI)"
  - "Fire-and-forget moderation wiring in post and comment creation hooks"
affects: [06-05, 06-06]

tech-stack:
  added: [openai-moderation-api]
  patterns: [fire-and-forget-edge-function, async-content-moderation]

key-files:
  created:
    - packages/supabase/functions/moderate/index.ts
  modified:
    - packages/supabase/config.toml
    - apps/mobile/hooks/post/useCreatePost.ts
    - apps/mobile/hooks/comment/useCreateComment.ts

key-decisions:
  - "useCreateComment modified to return comment id (.select('id').single()) for moderation target_id"
  - "upsert with onConflict for OpenAI auto-reports handles UNIQUE constraint on re-checks"

patterns-established:
  - "Fire-and-forget Edge Function: call in onSuccess with .catch(() => {}) to never block UX"
  - "SYSTEM_REPORTER_ID (nil UUID) for automated reports distinct from user reports"

requirements-completed: [SAFE-04, SAFE-06]

duration: 1min
completed: 2026-03-22
---

# Phase 06 Plan 04: Content Moderation Edge Function Summary

**Async moderate Edge Function with banned word soft-delete, OpenAI moderation auto-reports, and spam rate limiting via fire-and-forget hooks**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-22T07:39:34Z
- **Completed:** 2026-03-22T07:41:01Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Created moderate Edge Function with 3 moderation layers: banned words, spam rate limit, OpenAI Moderation API
- Wired fire-and-forget moderation calls into useCreatePost and useCreateComment hooks
- Banned word content is soft-deleted immediately with actioned auto-report
- OpenAI-flagged content creates pending report for admin review without auto-deleting
- Spam rate limit (5+ posts/min) creates 1-hour warning sanction and soft-deletes excess post

## Task Commits

Each task was committed atomically:

1. **Task 1: moderate Edge Function** - `f0e33d5` (feat)
2. **Task 2: Wire moderate into hooks** - `d026e96` (feat)

## Files Created/Modified
- `packages/supabase/functions/moderate/index.ts` - Edge Function with banned word check, rate limit, and OpenAI moderation
- `packages/supabase/config.toml` - Registered moderate function with verify_jwt
- `apps/mobile/hooks/post/useCreatePost.ts` - Added fire-and-forget moderate call in onSuccess
- `apps/mobile/hooks/comment/useCreateComment.ts` - Added .select('id').single() return and fire-and-forget moderate call

## Decisions Made
- Modified useCreateComment to return comment data (`.select('id').single()`) so onSuccess can access the id for moderation -- previously returned void
- Used upsert with onConflict for OpenAI auto-reports to handle the UNIQUE constraint when system re-checks same content
- SYSTEM_REPORTER_ID uses nil UUID (00000000-0000-0000-0000-000000000000) to distinguish system reports from user reports

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] useCreateComment insert returns void -- cannot pass target_id to moderate**
- **Found during:** Task 2 (Wire moderate into hooks)
- **Issue:** useCreateComment's mutationFn returned void, so onSuccess had no comment id to pass to moderate
- **Fix:** Added `.select('id').single()` to the insert query and returned the data
- **Files modified:** apps/mobile/hooks/comment/useCreateComment.ts
- **Verification:** typecheck passes
- **Committed in:** d026e96 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix to enable moderation on comments. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. OPENAI_API_KEY env var is already referenced in config.toml for Supabase Studio; the moderate function gracefully skips OpenAI moderation if the key is not set.

## Next Phase Readiness
- Moderate Edge Function ready for deployment via `supabase functions deploy moderate`
- Admin dashboard (Plan 05/06) can review pending auto-reports created by OpenAI moderation
- Rate limiting and banned word pipeline fully operational

---
*Phase: 06-safety-admin-dashboard*
*Completed: 2026-03-22*

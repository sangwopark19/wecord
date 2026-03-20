---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: completed
stopped_at: "Completed 03-07-PLAN.md: Community join flow fix"
last_updated: "2026-03-20T05:58:00.534Z"
last_activity: "2026-03-18 — 02-01 complete: Supabase OAuth auth + SecureStore session + authStore + generate-nickname + vitest infrastructure"
progress:
  total_phases: 7
  completed_phases: 3
  total_plans: 13
  completed_plans: 13
  percent: 30
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-18)

**Core value:** BL/GL 크리에이터와 팬이 언어 장벽 없이 소통할 수 있는 전용 커뮤니티 공간 (커뮤니티별 페르소나 분리 + 자동번역)
**Current focus:** Phase 2 — Auth & Onboarding

## Current Position

Phase: 2 of 7 (Auth & Onboarding) — IN PROGRESS
Plan: 1 of 5 in current phase (02-01 complete)
Status: Plan 02-01 complete, ready for 02-02 (Onboarding screens)
Last activity: 2026-03-18 — 02-01 complete: Supabase OAuth auth + SecureStore session + authStore + generate-nickname + vitest infrastructure

Progress: [███░░░░░░░] ~30% (5/9 total plans across all phases complete — Phase 1: 4/4, Phase 2: 1/5)

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: ~7 min
- Total execution time: ~0.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 4 | 23 min | 6 min |
| 02-auth-onboarding | 1 | 12 min | 12 min |

**Recent Trend:**
- Last 5 plans: 01-01 (10 min), 01-02 (4 min), 01-03 (4 min), 01-04 (5 min), 02-01 (12 min)
- Trend: stable

*Updated after each plan completion*
| Phase 01-foundation P01-02 | 6 | 2 tasks | 14 files |
| Phase 02-auth-onboarding P02-01 | 12 | 3 tasks | 20 files |
| Phase 02-auth-onboarding P02-02 | 20 | 2 tasks | 9 files |
| Phase 03-community-core-content P03-01 | 7 | 3 tasks | 32 files |
| Phase 03-community-core-content P03-02 | 6 | 2 tasks | 18 files |
| Phase 03 P03 | 5 | 2 tasks | 14 files |
| Phase 03 P04 | 435 | 2 tasks | 16 files |
| Phase 03 P05 | 3 | 1 tasks | 2 files |
| Phase 03-community-core-content P07 | 103 | 2 tasks | 3 files |
| Phase 03 P06 | 3 | 2 tasks | 3 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Phase 1]: Use `(select auth.uid())` wrapper in all RLS policies — NOT bare `auth.uid()` — to avoid per-row evaluation at scale
- [Phase 1]: Validate OpenNext + Cloudflare Workers deploy in Phase 1 before building any admin features (deprecated `next-on-pages` is a high-risk mistake)
- [Phase 1]: Pin Nativewind v4 to specific patch; validate with `npx expo export` before completing Phase 1 (SDK 55 compatibility not officially confirmed)
- [Phase 3]: Use `posts_with_nickname` view exclusively in all content queries — persona isolation leak is trust-destroying and expensive to fix post-launch
- [01-01]: Named tooling/typescript package @wecord/typescript-config to match workspace:* references in db/shared devDependencies
- [01-01]: packages/supabase kept minimal (no build scripts) — Supabase CLI manages the environment, not pnpm
- [Phase 01-foundation]: initI18n() function pattern (not auto-init) keeps @wecord/shared platform-agnostic — apps call it with their locale at startup
- [Phase 01-foundation]: Nativewind v4.2.3 on Expo SDK 55: typecheck passes; expo export smoke test deferred to manual validation before first EAS build
- [01-04]: Use defineCloudflareConfig (not defineConfig) in open-next.config.ts — @opennextjs/cloudflare v1.17.1 exports this name
- [01-04]: EAS Build only triggers on refs/tags/v* in CI — saves build costs during active development
- [Phase 01]: postsWithNicknameViewSql defined as raw SQL constant because pgView.as() does not accept SQL<unknown> — Drizzle type limitation
- [Phase 01]: Supabase migration applied via db:reset to handle pre-existing tables from prior Docker state
- [02-01]: ExpoSecureStoreAdapter passed to createClient storage — detectSessionInUrl: false is mandatory in React Native
- [02-01]: Profile interface exported from authStore.ts to resolve TS4058 (return type visibility in external module)
- [02-01]: react-i18next installed as direct mobile dep — useTranslation must resolve in mobile's TS compilation context
- [02-01]: /(onboarding)/tos route cast to any until Plan 02-02 creates the route — prevents hard typecheck failure
- [02-01]: generate-nickname uses Deno.serve() (not deprecated serve from std/http) per current Supabase Edge Function pattern
- [Phase 02-auth-onboarding]: i18n.changeLanguage imported from i18next directly (not @wecord/shared default export)
- [Phase 02-auth-onboarding]: onboardingData stored in authStore for dateOfBirth cross-screen persistence (not expo-router params)
- [Phase 02-auth-onboarding]: as never cast for dynamic onboarding routes not yet in expo-router type registry
- [Phase 03-community-core-content]: useTranslation imported from @wecord/shared/i18n in community components — matches existing onboarding pattern
- [Phase 03-community-core-content]: as never cast for /(community)/* routes — community group not yet in expo-router typed registry
- [Phase 03-community-core-content]: LeaveConfirmDialog uses imperative Alert.alert via useLeaveConfirmDialog hook — React Native pattern
- [Phase 03-02]: (03-02): FlashList 2.3.0 does not expose estimatedItemSize prop — documented as comment, addressable after upgrade to FlashList 2.7+
- [Phase 03-02]: (03-02): DeleteConfirmDialog implemented as imperative showDeleteConfirmDialog() function — consistent with useLeaveConfirmDialog hook pattern from 03-01
- [Phase 03-02]: (03-02): Popular sort uses offset pagination capped at 3 pages (45 posts) — avoids unbounded scroll on score-based sort
- [Phase 03-03]: FlatList used for ArtistMemberScroll (not FlashList) — small dataset horizontal list
- [Phase 03-03]: useCreatePost accepts optional authorRole param; compose.tsx reads membership.role for creator detection (CREF-01)
- [Phase 03]: LikeButton uses withSequence(withSpring) for spring scale animation matching tension 200/friction 7 spec
- [Phase 03]: useCreateComment fetches member role inside mutationFn to avoid stale hook data in reply flows
- [Phase 03-05]: Community tab uses proxy route pattern: (tabs)/community.tsx exists solely for Expo Router file resolution, delegates navigation to (community)/search via Redirect
- [Phase 03-05]: Removed href override from Tabs.Screen — href is not needed when a matching route file exists
- [Phase 03-07]: generateNickname wraps entire supabase.functions.invoke in try/catch to handle network-level errors not covered by supabase-js error return
- [Phase 03-07]: CommunityCard membership routing uses same queryKey as join mutation invalidation for automatic cache coherence

### Pending Todos

None yet.

### Blockers/Concerns

- [Pre-Phase 1]: Nativewind v4 on Expo SDK 55 not officially verified — monitor nativewind/nativewind#1604
- [Pre-Phase 4]: Verify pgmq + pg_cron extensions are enabled in Supabase dashboard before starting notifications
- [Pre-Phase 4]: DeepL vs. Google Translate quality for KO/JA not yet benchmarked — decide early in Phase 4
- [Pre-Phase 7]: Apple OAuth requires live privacy policy URL before first TestFlight — plan URL hosting alongside Phase 7 App Store checklist
- [02-01]: generate-nickname Edge Function needs manual deploy: `supabase functions deploy generate-nickname`
- [02-01]: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY env vars needed in .env.local for dev

## Session Continuity

Last session: 2026-03-20T05:57:49.266Z
Stopped at: Completed 03-07-PLAN.md: Community join flow fix
Resume file: None

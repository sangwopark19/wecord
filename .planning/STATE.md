---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: milestone_complete
stopped_at: Phase 7 UI-SPEC approved
last_updated: "2026-04-22T03:03:40.856Z"
progress:
  total_phases: 7
  completed_phases: 7
  total_plans: 35
  completed_plans: 32
  percent: 100
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-18)

**Core value:** BL/GL 크리에이터와 팬이 언어 장벽 없이 소통할 수 있는 전용 커뮤니티 공간 (커뮤니티별 페르소나 분리 + 자동번역)
**Current focus:** Phase 07 — launch-polish

## Current Position

Phase: 07
Plan: Not started

## Performance Metrics

**Velocity:**

- Total plans completed: 8
- Average duration: ~7 min
- Total execution time: ~0.5 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation | 4 | 23 min | 6 min |
| 02-auth-onboarding | 1 | 12 min | 12 min |
| 07 | 3 | - | - |

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
| Phase 04-highlights-notices-notifications-translation P00 | 1 | 1 tasks | 5 files |
| Phase 04-highlights-notices-notifications-translation P01 | 286 | 2 tasks | 33 files |
| Phase 04-highlights-notices-notifications-translation P02 | 6 | 2 tasks | 19 files |
| Phase 04-highlights-notices-notifications-translation P03 | 9 | 2 tasks | 13 files |
| Phase 04-highlights-notices-notifications-translation P04 | 3 | 2 tasks | 7 files |
| Phase 04-highlights-notices-notifications-translation P05 | 1 | 2 tasks | 3 files |
| Phase 05-home-feed-search-community-social P00 | 3 | 2 tasks | 19 files |
| Phase 05-home-feed-search-community-social P01 | 3 | 2 tasks | 10 files |
| Phase 05 P02 | 311 | 2 tasks | 14 files |
| Phase 05-home-feed-search-community-social P03 | 8 | 2 tasks | 7 files |
| Phase 06 P02 | 3 | 1 tasks | 5 files |
| Phase 06 P01 | 3 | 1 tasks | 10 files |
| Phase 06 P03 | 3 | 2 tasks | 9 files |
| Phase 06 P04 | 1 | 2 tasks | 4 files |
| Phase 06 P05 | 2 | 1 tasks | 2 files |
| Phase 06 P06 | 4 | 2 tasks | 6 files |
| Phase 06 P07 | 2 | 1 tasks | 3 files |
| Phase 04-highlights-notices-notifications-translation P06 | 2 | 2 tasks | 4 files |

## Accumulated Context

### Roadmap Evolution

- Phase 8 added: Fetch design file from Anthropic and implement wecord.html (https://api.anthropic.com/v1/design/h/l00PLmrunZZdTLsxQ8ZYPw?open_file=wecord.html)

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
- [Phase 03]: expo-image must never receive { uri: undefined } — always guard with ternary and render placeholder View instead
- [Phase 03]: FlatList numColumns=2 requires style={{ width: '50%' }} on renderItem wrapper — className flex-1 does not work for grid width in React Native
- [Phase 03]: useEffect debounce with clearTimeout cleanup is the correct React pattern — setTimeout in event handlers leaks timers
- [Phase 04]: Wave 0 stubs use it.todo() so vitest reports them as skipped (not failing), ensuring test run exits 0
- [Phase 04-highlights-notices-notifications-translation]: highlight Edge Function uses POST body for community_id — supabase.functions.invoke does not support GET query params
- [Phase 04-highlights-notices-notifications-translation]: HorizontalCardScroll renderItem typed as ReactElement (not ReactNode) — FlatList ListRenderItem requires non-undefined return
- [Phase 04-02]: shadcn base-nova style uses @base-ui/react (not Radix UI) — Select onValueChange passes string | null, requires ?? '' guard
- [Phase 04-02]: pgmq drain job uses pgmq.archive() (not pgmq.delete()) for processed message audit retention
- [Phase 04-02]: @base-ui/react must be added explicitly — shadcn CLI does not auto-add it to package.json with base-nova style
- [Phase 04-03]: bell-outline not in Ionicons — replaced with notifications-outline (Ionicons uses notifications-* prefix)
- [Phase 04-03]: useUnreadNotificationCount subscribes to both INSERT and UPDATE events — INSERT increments, UPDATE re-fetches for mark-read accuracy
- [Phase 04-04]: useTranslate uses profile.language (not preferred_language) — Profile interface field is 'language', plan had a typo
- [Phase 04-04]: PostDetail screen inherits translation automatically via PostCard reuse — no separate integration needed
- [Phase 04-04]: Replies use target_type='comment' — replies are stored in the comments table not a separate replies table
- [Phase 04-highlights-notices-notifications-translation]: HighlightScreen extracted to components/highlight/HighlightScreen.tsx — uses useRouter() internally, accepts only communityId prop; setActiveTab not needed for standalone Stack route
- [Phase 04-highlights-notices-notifications-translation]: Gap closure creates new migration files — never modify existing migrations to preserve applied state
- [Phase 05-home-feed-search-community-social]: community.json search key already existed — appended accessibilityLabel to existing object instead of creating duplicate top-level key
- [Phase 05-home-feed-search-community-social]: FlashList 2.3.0 does not expose estimatedItemSize prop — removed from home tab FlashList (same pre-existing constraint as Phase 03-02)
- [Phase 05-home-feed-search-community-social]: RecommendationSection uses dedicated useRecommendedCommunities query (order by member_count DESC) — useCommunitySearch guards empty string and would return nothing
- [Phase 05-home-feed-search-community-social]: useAllUnreadNotificationCount mirrors useUnreadNotificationCount but removes community_id filter from both initial query and realtime subscription
- [Phase 05]: PostCard header row extracted as separate Pressable — avoids nested Pressable tap collision; header navigates to profile, content navigates to post detail
- [Phase 05]: HighlightedText uses toLowerCase comparison (not regex.test) — regex with gi flag advances lastIndex causing alternating match pattern on split result
- [Phase 05-home-feed-search-community-social]: useMemberComments filters by author_cm_id (not author_id) — community_members UUID maps to view column semantics
- [Phase 05-home-feed-search-community-social]: FlatList used for profile comments tab (bounded limit 50) — consistent with Phase 03-03 ArtistMemberScroll pattern
- [Phase 06]: ReportBottomSheet uses React Native Modal (no external dependency) with handleMorePress conditional logic for D-05 compliance
- [Phase 06-01]: reportMutationFn exported separately from useReport for direct unit testing without React context
- [Phase 06-01]: i18n locale uses 'zh' directory (not 'zh-CN') matching existing project convention
- [Phase 06-03]: Deleted app/page.tsx to avoid route conflict with (dashboard)/page.tsx route group
- [Phase 06-03]: supabaseBrowser (anon key) for auth; supabaseAdmin (service_role) for data per Research pitfall 1
- [Phase 06-04]: useCreateComment modified to return comment id for moderation target_id
- [Phase 06-05]: Client-side report aggregation by (target_type, target_id) — simpler than DB view with supabaseAdmin service_role
- [Phase 06-05]: SidePanel built as standalone component with hardcoded dark theme colors per UI-SPEC (not shadcn Sheet)
- [Phase 06]: Supabase profiles join returns array; normalize with profilesArr?.[0] pattern
- [Phase 06]: promotion_banners uses sort_order (not display_order), no title column; adapted UI accordingly
- [Phase 06]: WAU/MAU computed as sum of daily active user counts (approximation acceptable for admin dashboard)
- [Phase 04-06]: Global notifications screen placed in (tabs) group with href:null for hidden tab navigation
- [Phase 04-06]: Used .or() PostgREST filter for community_id to include NULL values in unread badge count

### Pending Todos

None yet.

### Blockers/Concerns

- [Pre-Phase 1]: Nativewind v4 on Expo SDK 55 not officially verified — monitor nativewind/nativewind#1604
- [Pre-Phase 4]: Verify pgmq + pg_cron extensions are enabled in Supabase dashboard before starting notifications
- [Pre-Phase 4]: DeepL vs. Google Translate quality for KO/JA not yet benchmarked — decide early in Phase 4
- [Pre-Phase 7]: Apple OAuth requires live privacy policy URL before first TestFlight — plan URL hosting alongside Phase 7 App Store checklist
- [02-01]: generate-nickname Edge Function needs manual deploy: `supabase functions deploy generate-nickname`
- [02-01]: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY env vars needed in .env.local for dev

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260422-m4b | fix PR CI pnpm version conflict | 2026-04-22 | 51a42f5 | [260422-m4b-fix-pr-ci-pnpm-version-conflict](./quick/260422-m4b-fix-pr-ci-pnpm-version-conflict/) |
| 260422-naz | redesign login screen to match splash mock | 2026-04-22 | f70ef9e | [20260422-login-splash-redesign](./quick/20260422-login-splash-redesign/) |
| 260422-nir | fix mobile logout in expo --web (Alert→confirm) + admin sidebar sign-out (incidental) | 2026-04-22 | c1828d6 | [260422-nir-logout](./quick/260422-nir-logout/) |

Last activity: 2026-04-22 - Completed quick task 260422-nir: fix mobile logout in expo --web (RN Web Alert.alert multi-button polyfill bug) + admin sidebar sign-out button (incidental)

## Session Continuity

Last session: --stopped-at
Stopped at: Phase 7 UI-SPEC approved
Resume file: --resume-file

**Planned Phase:** 07 (launch-polish) — 3 plans — 2026-04-22T03:00:01.270Z

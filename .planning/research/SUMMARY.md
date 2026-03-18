# Project Research Summary

**Project:** Wecord — BL/GL Fan Community Platform
**Domain:** Niche creator-fan social app (Weverse-like, multi-language, dual-account identity)
**Researched:** 2026-03-18
**Confidence:** HIGH

## Executive Summary

Wecord is a BL/GL-focused creator-fan community platform directly benchmarked against Weverse (12M MAU). Research confirms the product can be built solo using a tightly integrated stack centered on Expo SDK 55 (iOS/Android/Web from a single codebase), Supabase (Auth + PostgREST + Realtime + Storage + Edge Functions), and PostgreSQL 17 as the single operational database. The monorepo is structured with Turborepo + pnpm workspaces, with a Next.js 15 admin dashboard deployed to Cloudflare Workers. This "platform consolidation" strategy — replacing Auth0 + custom API + WebSocket server + S3 + message queue with Supabase — is the correct approach for a solo developer targeting a cross-platform product in 5 languages.

The platform's core differentiator is per-community persona separation (dual-account model): users maintain a different identity in each fandom community. This feature has no direct equivalent in Weverse, Bubble, or V LIVE and must be treated as a first-class architectural primitive, not a feature. The `community_members.community_nickname` is the display identity in all community-scoped contexts; the global `profiles` record is internal only. Every content query, notification copy, and API response must enforce this boundary from day one. A persona isolation leak is a trust-destroying bug that is expensive to recover from after users have joined.

The top risks are infrastructure risks, not product risks: RLS performance regressions at scale (fixable if caught early in schema design), notification fan-out timeouts on large communities (fixed by async pgmq queue), and translation API cost explosion without caching (fixed by a `post_translations` table baked in from the start). None of these risks are blockers — they are well-understood patterns with known solutions. All three must be addressed in the foundation and core content phases before any feature is built on top of them.

## Key Findings

### Recommended Stack

The stack is monorepo-first: `apps/mobile` (Expo SDK 55, Expo Router v7), `apps/admin` (Next.js 15 on Cloudflare Workers via OpenNext), `packages/db` (Drizzle ORM schema + migrations), `packages/supabase` (Edge Functions in Deno), `packages/shared` (zero-dependency types, validators, i18n). Nativewind v4 (not v5, which is pre-release) provides Tailwind CSS styling on mobile. TanStack Query v5 manages server state; Zustand v5 manages client UI state. FlashList replaces FlatList in every feed screen for the 5–10x Android performance difference.

Two version-critical decisions were flagged: Nativewind v4 compatibility with Expo SDK 55 has not been officially verified by the Nativewind team (only SDK 54 is confirmed) — monitor nativewind/nativewind#1604 and pin to a specific v4 patch. The `@cloudflare/next-on-pages` adapter was deprecated in December 2025; `@opennextjs/cloudflare` on Cloudflare Workers is the only supported path for Next.js 15 admin deployment.

**Core technologies:**
- **Expo SDK 55:** Universal iOS/Android/Web runtime — New Architecture only, no opt-out; solo dev's only path to three platforms from one codebase
- **Supabase (Postgres 17):** Replaces 5 separate services; RLS enforces security at the DB layer; generous free tier suitable for MVP validation
- **Drizzle ORM ^0.45:** Type-safe, SQL-close, zero dependencies, the only ORM that works in Deno Edge Functions
- **Expo Router v7:** File-based routing, deep links, web SEO — bundled with SDK 55, do not install separately
- **TanStack Query v5 + Zustand v5:** Server state + client UI state separation; TanStack Query's `useInfiniteQuery` + FlashList is the required pattern for feed screens
- **Nativewind v4:** Tailwind CSS for React Native (stable); v5 is pre-release and not production-ready
- **Next.js 15 + OpenNext + Cloudflare Workers:** Admin dashboard — NOT Cloudflare Pages (deprecated adapter)
- **i18next + react-i18next + expo-localization:** Full i18n for KO/EN/TH/ZH-CN/JA

### Expected Features

All 16 MVP features (F-01 through F-16) are required for launch. The dependency chain is strict: Auth (F-01) gates everything; dual account / community join (F-02) gates all content features; the admin dashboard (F-11) is a prerequisite for creator onboarding since creator accounts and communities are admin-managed. These three must be in the earliest phases.

**Must have (table stakes):**
- F-01 Social OAuth login (Google + Apple) — identity baseline
- F-02 Community discovery + dual-account join — gates all community content
- F-03 Fan post feed with media + infinite scroll — fans need somewhere to post
- F-04 Creator post feed + member system — primary reason users download
- F-05 Comments + replies + likes — engagement loop
- F-06 In-app translation + 5-language UI localization — non-negotiable for BL/GL's cross-border market
- F-07 Push notifications (creator posts, comments) — without this, creator posts go unnoticed
- F-10 Home feed (curated if 0 communities; merged if 1+) — empty home = users bounce
- F-11 Admin moderation dashboard — required to onboard creators and process reports
- F-12 Content reporting — required for App Store approval

**Should have (differentiators):**
- F-02 Per-community persona (community nickname) — no competitor has this; core retention driver for BL/GL persona culture
- F-04 Creator member system (group/solo, per-member follow) — BL/GL creators are often duos or casts
- F-09 Announcements with scheduling — creator/admin authoritative channel
- F-16 Community-scoped following + profiles — social graph within community
- F-10 Promotion banner carousel (admin-managed) — keeps home fresh without app updates

**Defer (v1.1+):**
- F-17 Real-time DM — requires presence system, payment gating (Jelly), and abuse prevention; builds on validated engagement
- F-18 Jelly in-app currency — requires IAP approval from Apple/Google (30% take), adds 8+ weeks
- F-20 VOD media content — storage/streaming cost only justified after creator volume
- F-24 LIVE streaming — separate streaming infrastructure, only viable at scale

**Anti-features (do not build in MVP):**
- Real-time like/comment counts via WebSocket (polling sufficient; Realtime adds connection pressure)
- Community-specific theme colors (design system work; deferred to v1.1)
- Cross-community global feed (breaks persona isolation model — never build without design resolution)

### Architecture Approach

The architecture follows five key patterns: (1) RLS-First Security — all authorization lives in PostgreSQL RLS policies, not application code; (2) PostgREST for CRUD, Edge Functions for orchestration — simple reads/writes use auto-generated PostgREST endpoints; fan-out, multi-step workflows, and external API calls use Edge Functions; (3) Dual Account Structure — the `posts_with_nickname` view abstracts the JOIN between `posts` and `community_members` so all consumers always get community persona, never global profile; (4) Cursor-based pagination on all feed queries using `(created_at DESC, id DESC)` composite index; (5) pgmq fan-out for notifications — any broadcast to a community decouples from the HTTP request path via message queue.

**Major components:**
1. `apps/mobile` — All user-facing screens across iOS/Android/Web; Expo Router file-based routes under `(auth)/`, `(tabs)/`, `community/[slug]/`
2. `apps/admin` — Next.js 15 operator dashboard; community CRUD, moderation queue, notice management; uses service_role key server-side only
3. `packages/db` — Drizzle schema is the canonical data contract; both apps and Edge Functions import types from here
4. `packages/supabase/functions` — Edge Functions: `translate`, `moderate`, `notify`, `highlight`, `home-feed`, `generate-nickname`
5. `packages/shared` — Zero-dependency types, Zod validators, i18n strings; no outbound deps — safe to import from everywhere

### Critical Pitfalls

1. **RLS `auth.uid()` called per-row instead of once per query** — Always wrap: `(select auth.uid())` and `(select auth.role())`. Difference is invisible in dev, catastrophic at 100k+ rows. Must be correct from the first migration. Verify with `EXPLAIN ANALYZE` on 10k row seed data.

2. **Persona isolation leak (global profile bleeds into community context)** — Any query serving community content must pull display identity from `community_members`, never from `profiles`. Use the `posts_with_nickname` view exclusively. Add integration tests: community API response must never contain `profiles.display_name`. Architect the data model correctly before any content feature.

3. **Synchronous push notification fan-out blocks the post-create request** — With 10k+ community members, synchronous fan-out causes Edge Function timeouts (150s limit). Decouple via pgmq: post INSERT completes immediately, `notify` Edge Function drains queue in batches of 100 via pg_cron. Design async-first before any creator posts go live.

4. **Translation API cost explosion without caching** — Every on-demand translate call without a cache multiplies costs at scale. The `post_translations` table (cache layer) must be in the schema from Phase 1, even before translation is implemented. Batch all 5 target languages in a single Google Translate API call. Set budget alerts at $50/month.

5. **Age-gating treated as an afterthought** — BL/GL content scope triggers App Store reviewer scrutiny. App must be submitted with a 17+ content rating and a live privacy policy URL before the first TestFlight. Add `profiles.date_of_birth` and `posts.content_rating` columns in the foundation schema. Define the content policy before submission.

## Implications for Roadmap

Based on the combined research — particularly the hard dependency chain from FEATURES.md, the 10-phase build order from ARCHITECTURE.md, and the pitfall-to-phase mapping from PITFALLS.md — the following phase structure is recommended:

### Phase 1: Foundation and Data Model
**Rationale:** Everything else depends on this being correct. RLS policies, the dual-account schema, and the `post_translations` cache table must be established now because they are expensive to retrofit later. Monorepo tooling must work before any app code is written.
**Delivers:** Turborepo + pnpm monorepo; Drizzle schema for all core tables (auth, community, content, notification, translation, moderation); Supabase project config + RLS policies; `packages/shared` types and Zod validators; i18n scaffold for all 5 locales
**Addresses:** F-06 (i18n scaffold), F-12 (reports table)
**Avoids:** RLS per-row performance trap; persona isolation leak; translation caching gap; age-gate data model missing; monorepo bundle contamination; hardcoded i18n strings

### Phase 2: Auth, Identity, and Onboarding
**Rationale:** No user-facing feature can function without a resolved identity. The dual-account model (global profile + community_members) must be fully working before any community content is built. The onboarding creator-selection flow shapes the first impression and drives community_members seeding.
**Delivers:** Supabase Auth with Google + Apple OAuth; `profiles` table; Zustand authStore; TanStack Query client setup; Onboarding creator-selection flow (Spotify-style); `generate-nickname` Edge Function
**Addresses:** F-01, F-02 (identity side)
**Avoids:** Persona isolation leak; JWT trust of user_metadata for roles; signup ending at blank home feed

### Phase 3: Community Discovery and Join
**Rationale:** The community_members record is the identity token for all community-scoped actions. Without it, no content feature can work. Search is the discovery entry point for new community joins.
**Delivers:** Communities table; pg_textsearch search endpoint (BM25 + GIN index); community listing, search, and join screens; community_members INSERT with RLS policies enforcing member-gated content
**Addresses:** F-02 (community join side), F-13
**Avoids:** Missing index on community_id; cross-community global feed (not built)

### Phase 4: Core Content Loop
**Rationale:** This is the product's reason to exist. Fan feed, creator feed, comments, and likes are the primary retention mechanics. FlashList + TanStack Query `useInfiniteQuery` must be used from the start — retrofitting FlatList to FlashList is disruptive. The `posts_with_nickname` view must be used exclusively to prevent persona leaks.
**Delivers:** posts, comments, likes tables (with RLS); Fan feed (cursor-paginated FlashList); Creator feed; Post creation with image upload to Supabase Storage; Comment thread (1-depth); Like toggle; `posts_with_nickname` view; Creator reply highlight UI
**Addresses:** F-03, F-04, F-05
**Avoids:** FlatList memory growth (FlashList from day one); OFFSET pagination (cursor-based from day one); N+1 like/following queries; persona isolation leak in feed query; synchronous search_vector tsvector trigger

### Phase 5: Highlight Tab, Notices, and Artist Members
**Rationale:** The Highlight tab is the community homepage and a key differentiator. It depends on notices and artist_members existing. The `highlight` Edge Function provides a single aggregated payload, avoiding 5 client round trips.
**Delivers:** notices table + admin CRUD + pg_cron scheduling; artist_members table; `highlight` Edge Function; Highlight tab screen (pinned notices → artist posts → fan posts → artist profiles)
**Addresses:** F-04 (member system side), F-09, F-10 (Highlight section)
**Avoids:** Multiple round trips from client for Highlight tab data

### Phase 6: Notification System
**Rationale:** Without notifications, creator posts go unnoticed and retention collapses. Must be designed async-first (pgmq) before any large community is onboarded. Realtime is used only for narrow notification badge signals, not full feed streaming.
**Delivers:** notifications + notification_preferences tables; `notify` Edge Function with pgmq fan-out; Supabase Realtime channels for new-post badge and unread count (signal only, not payload); Push notification permission flow + EAS token storage + receipt polling
**Addresses:** F-07
**Avoids:** Synchronous fan-out blocking post creation; Realtime over-subscription (limited to notification signal, not full feed); dead push token accumulation

### Phase 7: Translation and Full i18n
**Rationale:** Translation is the #1 retention factor for Weverse's international users. BL/GL market is inherently cross-border. The `post_translations` cache table is already in the schema (Phase 1); this phase implements the Edge Function and UI.
**Delivers:** `translate` Edge Function (cache-first: DB → Google Translate → DB); Translate button on post/comment UI with inline loading state; source language badge; batch translation for all 5 target languages in one API call; translation cost monitoring + budget alerts
**Addresses:** F-06 (translation side)
**Avoids:** Translation cost explosion; duplicate API calls on re-render; no user feedback during translation loading

### Phase 8: Home Feed, Search, and Discovery
**Rationale:** The home feed surfaces value for returning users across all joined communities. Search connects new users to communities. Both depend on Phase 4 content existing.
**Delivers:** `home-feed` Edge Function (cross-community merge, cursor-paginated); Home tab (0 communities: curated recommendations; 1+: merged feed); Search screen (community + post full-text via pg_textsearch); `banners` table + admin CRUD + carousel
**Addresses:** F-10, F-13
**Avoids:** N+1 query for cross-community feed (single SQL via Edge Function)

### Phase 9: Moderation, Safety, and App Store Readiness
**Rationale:** Moderation must be complete before any public user acquisition begins. App Store submission requires 17+ content rating, privacy policy URL, and working report flow. This phase also completes the admin dashboard operational features.
**Delivers:** reports table + report flow in app; user_sanctions table; `moderate` Edge Function (keyword filter + OpenAI Moderation, async/fire-and-forget); Admin moderation queue (Next.js); Rate limiting in Edge Functions; Content rating = 17+; Privacy policy URL live; App Store/Play Store submission prep
**Addresses:** F-11, F-12
**Avoids:** App Store rejection for content rating; admin dashboard using anon key (service_role server-side only); OpenAI moderation blocking post creation synchronously

### Phase 10: Admin Dashboard Completion and Launch Polish
**Rationale:** Operations infrastructure enables ongoing creator onboarding and community management. DM placeholder and Shop tab are low-effort features that signal product roadmap to early users.
**Delivers:** Full admin community / creator / member management; Notice scheduling UI; Analytics views; F-08 More tab (language, notification prefs, profile edit, logout); F-14 Shop tab (WebView to x-square.kr); F-15 DM placeholder screen with waitlist opt-in; F-16 Community following + profiles
**Addresses:** F-08, F-14, F-15, F-16
**Avoids:** Missing per-community notification granularity (must be accessible from community screen, not just global settings)

### Phase Ordering Rationale

- **Hard dependency chain:** Phase 1 → 2 → 3 → 4 cannot be reordered. Each gate is architectural. Schema + RLS (1) → Identity (2) → Community membership (3) → Content (4) is the only valid order.
- **Phases 5–8 partially overlap:** Once Phase 4 is stable, Highlight/Notices (5), Notifications (6), Translation (7), and Home/Search (8) can proceed with limited cross-phase dependency.
- **Phase 9 is a hard gate before public launch:** No user acquisition campaign should start before moderation, content rating, and App Store submission are complete.
- **Admin dashboard (Phase 10)** consolidates and completes admin functionality but individual admin capabilities (notices CRUD, moderation queue) are built in earlier phases as needed.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 6 (Notification System):** pgmq consumer pattern with pg_cron in Supabase is documented but complex; receipt polling flow for Expo Push needs careful implementation. Recommend `/gsd:research-phase` before implementation.
- **Phase 9 (Moderation / App Store):** App Store content rating specifics for BL/GL content and Japanese market CERO requirements need verification closer to submission. Apple OAuth requirements (privacy policy URL, button styling) need pre-submission audit.
- **Phase 7 (Translation):** DeepL vs. Google Translate quality for KO/JA language pair not yet benchmarked. Recommend a quick quality test early in Phase 7 before committing to one provider.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Drizzle + Supabase schema and RLS are well-documented with official guides.
- **Phase 2 (Auth):** Supabase Google + Apple OAuth is fully documented; Expo Router auth redirect pattern is standard.
- **Phase 4 (Core Content):** FlashList + TanStack Query `useInfiniteQuery` + cursor pagination is a documented production pattern.
- **Phase 8 (Home Feed / Search):** pg_textsearch BM25 and GIN index usage is well-established.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Core stack verified against official changelogs and docs. One gap: Nativewind v4 on Expo SDK 55 not officially verified by Nativewind team — community reports show issues on SDK 54; pin specific patch and monitor GitHub discussion #1604. |
| Features | HIGH | MVP scope defined from existing PRD.md + competitor analysis of Weverse (12M MAU documented). Feature dependency chain verified against architecture. |
| Architecture | HIGH | Primary source is the project's own `docs/ARCHITECTURE.md` v2.0 (2026-03-12), which is a Weverse-benchmarked architecture document. Supabase and pgmq patterns verified against official platform documentation. |
| Pitfalls | HIGH (Supabase/RLS) / MEDIUM (fan platform scale, age-gating) | RLS and Supabase pitfalls backed by official docs and community high-confidence sources. Fan platform scale patterns and age-gating are MEDIUM confidence; apply as principles and validate during implementation. |

**Overall confidence:** HIGH

### Gaps to Address

- **Nativewind v4 on SDK 55:** Pin to a specific v4 patch release; validate with `npx expo export` before completing Phase 1. Monitor nativewind/nativewind#1604. Fallback: use StyleSheet-based styling for Phase 1 if Nativewind has unresolved issues.
- **DeepL vs. Google Translate for KO/JA:** Conduct a quick A/B quality test in Phase 7 before committing. Same Edge Function, different API key — the decision is low-risk to defer but should be made early in Phase 7.
- **pgmq + pg_cron availability on Supabase project:** Verify both extensions are enabled in Supabase dashboard before starting Phase 6. Manual enable may be required.
- **Apple OAuth requirements:** Privacy policy URL must be live before first TestFlight submission. Plan this URL alongside the Phase 9 App Store submission checklist.
- **OpenNext + Cloudflare Workers for Next.js 15 admin:** Deprecated `next-on-pages` pattern is a high-risk mistake. Validate OpenNext deploy in Phase 1 tooling before building any admin features.

## Sources

### Primary (HIGH confidence)
- `docs/ARCHITECTURE.md` v2.0 (2026-03-12) — system architecture, component responsibilities, build order
- `docs/PRD.md` v1.1 (2026-03-12) — feature requirements F-01 through F-28
- [Expo SDK 55 Changelog](https://expo.dev/changelog/sdk-55) — RN 0.83, React 19.2, New Architecture only, Expo Router v7
- [Supabase official docs](https://supabase.com/docs) — PostgREST, Realtime, Edge Functions, RLS, pgmq, pg_cron
- [OpenNext Cloudflare adapter](https://opennext.js.org/cloudflare) — replaces deprecated next-on-pages
- [Supabase RLS Performance](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices) — `(select auth.uid())` wrapper pattern
- [TanStack Query React Native docs](https://tanstack.com/query/latest/docs/framework/react/react-native) — official RN integration
- [Drizzle + Supabase official tutorial](https://orm.drizzle.team/docs/tutorials/drizzle-with-supabase) — integration pattern

### Secondary (MEDIUM confidence)
- [Nativewind GitHub Discussion #1604](https://github.com/nativewind/nativewind/discussions/1604) — SDK 55 compatibility tracking
- [Expo Push Notifications FAQ](https://docs.expo.dev/push-notifications/faq/) — receipt polling, token cleanup
- [Weverse 2025 Fandom Trend Report](https://kpoppost.com/weverses-2025-fandom-trend-report/) — 12M MAU, 263 min/month, translation as retention factor
- [Turborepo + Expo monorepo 2025 guide](https://medium.com/better-dev-nextjs-react/setting-up-turborepo-with-react-native-and-next-js-the-2025-production-guide-690478ad75af) — pnpm hoisted workaround
- [i18next + expo-localization pattern](https://medium.com/@kgkrool/implementing-internationalization-in-expo-react-native-i18next-expo-localization-8ed810ad4455) — February 2026

### Tertiary (LOW confidence)
- BL/GL age-gating App Store requirements — inferred from general App Store guideline 4.2/17.2 + CERO; needs validation during Phase 9 pre-submission review

---
*Research completed: 2026-03-18*
*Ready for roadmap: yes*

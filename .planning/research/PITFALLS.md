# Pitfalls Research

**Domain:** BL/GL Fan Community Platform (Weverse-like, multi-language, dual-account, push notification fan-out)
**Researched:** 2026-03-18
**Confidence:** HIGH (RLS/Supabase), MEDIUM (fan platform patterns, Expo cross-platform), MEDIUM (age-gating/moderation)

---

## Critical Pitfalls

### Pitfall 1: RLS Policies Without Performance Guards Bring Feed Queries to a Crawl

**What goes wrong:**
RLS policies are written correctly for security but without performance optimizations. Every `posts` or `comments` query evaluates `auth.uid()` per row instead of once per query. On a feed with hundreds of rows, this results in the PostgreSQL planner scanning the full table even when indexes exist, producing feeds that take 3-10 seconds to load instead of the target `<1s`.

**Why it happens:**
Developers write `auth.uid() = user_id` thinking it's equivalent to `(select auth.uid()) = user_id`. The first form calls the function for every row. The second lets the query planner cache the result as an initPlan, executing once per query. The difference is invisible in development with few rows and catastrophic at 100k+ posts.

**How to avoid:**
- Always wrap stable auth functions: `(select auth.uid())`, `(select auth.role())`.
- Index every column used in RLS policy filters (`user_id`, `community_id`, `created_by`).
- Use the "wrong direction" check: policies that do `auth.uid() IN (SELECT user_id FROM community_members WHERE ...)` are slower than `community_id IN (SELECT community_id FROM community_members WHERE user_id = (select auth.uid()))`.
- Test with `EXPLAIN ANALYZE` on realistic data volumes (10k+ rows) before shipping each table's policies.

**Warning signs:**
- Feed queries exceed 200ms in staging with 1k rows.
- `EXPLAIN ANALYZE` shows `Seq Scan` on posts/comments where an index should be used.
- Supabase Performance Advisor flags RLS policy lint warnings.

**Phase to address:** Foundation phase (before any feature builds on top of the data model). Wrong RLS policies are expensive to fix after the schema is stable.

---

### Pitfall 2: Persona Isolation Leak — Global Profile Data Bleeds Into Community Context

**What goes wrong:**
The dual-account system (`profiles` global account + `community_members` per-community profile) is the core differentiator of Wecord. If a single query accidentally joins or returns `profiles.display_name` instead of `community_members.community_nickname`, a user's real identity is exposed to a community where they wanted to be pseudonymous. This is a trust-destroying bug that, if discovered by users, causes immediate churn in a community built on identity privacy.

**Why it happens:**
In a shared-schema multi-tenant system, a single missing `WHERE community_id = ?` clause — or a JOIN that pulls from `profiles` when it should pull from `community_members` — silently leaks real names. The bug is invisible in unit tests that don't test cross-community isolation.

**How to avoid:**
- Define a strict rule: any query serving community-scoped content must pull display identity from `community_members`, never from `profiles`. Enforce this in a code review checklist and a DB view layer.
- Create an integration test that verifies: User A (community_nickname "FanAlpha" in community 1) is never returned with their `profiles.display_name` in any community 1 API response.
- Write RLS policies on `community_members` that only expose rows where `community_id` matches the request context.
- Use a typed query helper (Drizzle) that forces the join path so callers cannot accidentally use the global table.

**Warning signs:**
- Any API endpoint returns both `nickname` and `username` in the same response object without explicit reason.
- Test accounts created in two communities show the same display name in both — nickname system is not working.

**Phase to address:** Data model / auth phase. The join path must be correct before any content feature is built.

---

### Pitfall 3: Push Notification Fan-Out Blocks the Request Lifecycle

**What goes wrong:**
When a creator posts, the Edge Function handling the POST request synchronously iterates all community members, calls Expo Push Service per batch, and only returns 200 after all notifications are dispatched. With a community of 10k+ fans, this request takes minutes and times out (Supabase Edge Functions have a 150s timeout on free tier). Creator posts appear to "hang" or fail silently.

**Why it happens:**
The naive implementation is: insert post → get all subscribers → send push → return success. This works in development with 5 test users. It silently breaks in staging or production with real community sizes.

**How to avoid:**
- Decouple fan-out from the HTTP request. On post insert, write a message to `pgmq`. A separate `pg_cron` job (every 10-30s) or a dedicated Edge Function consumer reads from the queue and dispatches batches of 100 to Expo Push Service.
- Use Expo's batch push endpoint (up to 100 tokens per request) and implement receipt polling to handle `DeviceNotRegistered` token cleanup.
- Store push tokens in `user_push_tokens` table with soft-delete on `DeviceNotRegistered` receipts to avoid accumulating dead tokens that inflate fan-out cost.

**Warning signs:**
- Post creation API response time increases proportionally to community member count.
- Push token table has no `last_active_at` or `is_valid` column.
- No receipt polling job exists in `pg_cron`.

**Phase to address:** Notification system phase. Must be designed async-first before any creator posts go live.

---

### Pitfall 4: Auto-Translation Cost Explosion From Unthrottled On-Demand Calls

**What goes wrong:**
Translation is implemented as: user taps "translate" → Edge Function calls Google Translate API → returns translated text. With 5 languages and a feed of 50 posts, a single "translate all" action makes 250 API calls. At scale, with many concurrent users, costs spiral. There is also no caching, so the same popular creator post is translated repeatedly.

**Why it happens:**
Translation is perceived as a simple API call. Caching is deferred to "later." Rate limiting is not added because "users won't abuse it." Both assumptions fail once real users arrive.

**How to avoid:**
- Cache translations at the DB level: a `post_translations` table (`post_id`, `target_lang`, `translated_content`, `translated_at`). On first translate request, call Google Translate and persist. On subsequent requests, return cached row.
- Batch translation: translate all 5 languages in a single Google Translate batch call (it supports multi-target), not 5 sequential calls.
- Rate limit per user: max N translation requests per minute per `user_id` using a simple counter in Supabase or a `pg_ratelimit`-style approach.
- Set a budget alert on Google Cloud at $50/month and a hard quota at $100/month during MVP.

**Warning signs:**
- No `post_translations` table in the schema.
- Google Translate API calls are made from the client-side SDK directly.
- No caching TTL defined for translations.

**Phase to address:** i18n/translation phase, but the DB schema for caching must be laid out in the foundation phase.

---

### Pitfall 5: Age-Gating for BL/GL Content Treated as an Afterthought

**What goes wrong:**
BL/GL content can include mature or explicit material. Without a clear age-gating strategy from day one, the platform ships with no mechanism to restrict 18+ content to verified adults. App Store and Google Play may reject the app. More critically, App Store guidelines (4.2, 17.2) require explicit content to be behind a working age gate. A rejection or removal after launch is far more costly than building it early.

**Why it happens:**
The age gate feels like a "later" problem — "we'll add it when we have adult content." But review teams check the platform's stated scope and the type of content it clearly is designed for. The BL/GL niche raises the bar for reviewers.

**How to avoid:**
- Define the content policy before submission: is 18+ content allowed at all in MVP, or deferred to v1.1? If deferred, include this explicitly in the App Store description and content rating.
- If 18+ content is allowed: implement a mandatory date-of-birth field on signup, stored in `profiles.date_of_birth`. Gate explicit content behind a `profiles.age_verified = true` flag. On web, a checkbox self-declaration is legally sufficient in most markets; native apps need a more robust check.
- Rate content at submission as "17+" or "18+" depending on the strictest market (Japan's CERO, Google Play's content rating). Use Apple's content rating system (select "Frequent/Intense" for sexual content if applicable).
- For China market: explicit BL/GL content may be entirely restricted. Have a market-specific content filter or simply exclude explicit content from the ZH-CN locale feed.

**Warning signs:**
- `profiles` table has no `date_of_birth` or `age_verified` column.
- The App Store submission uses the default "4+" rating while the platform hosts BL content.
- No content type flag (`is_mature`, `content_rating`) on the `posts` table.

**Phase to address:** Foundation/auth phase for the data model; App Store submission phase for ratings configuration.

---

### Pitfall 6: Realtime Subscriptions for Feed Updates Are Used Where Polling Is Correct

**What goes wrong:**
Supabase Realtime is used to live-update every feed (home feed, community feed). Each user holds multiple open WebSocket channel subscriptions. At 1,000 concurrent users each subscribing to 3+ channels, the project hits Supabase Realtime's concurrent connection limits on the free/pro tier and starts dropping connections silently. Feed updates stop arriving. Users see stale feeds with no error indicator.

**Why it happens:**
Realtime feels like the "Supabase way" to build live features. It is correct for live notification badges and DM typing indicators. It is overkill for a social feed where pull-to-refresh is the industry-standard UX pattern.

**How to avoid:**
- Use Realtime only for: notification badge counts, real-time comment activity on an open post, presence indicators (future DM). These have a narrow, controllable subscription scope.
- Use TanStack Query's `refetchOnWindowFocus` + pull-to-refresh for the home/community feed. Weverse itself uses pull-to-refresh, not live streaming, for its main feed.
- If live new-post indicators are required, use a single lightweight channel per community (just a signal, not the full payload), and on signal receipt, invalidate TanStack Query cache to trigger a normal fetch.
- Monitor Supabase Realtime connection count in the dashboard from the first staging deploy.

**Warning signs:**
- Every feed screen has a `useRealtimeSubscription` hook that subscribes to a full table broadcast.
- The number of Realtime channels opened per session grows with the number of communities a user has joined.

**Phase to address:** Feed implementation phase.

---

### Pitfall 7: Turborepo Monorepo Shared Package Drift Breaks EAS Build

**What goes wrong:**
The monorepo has `packages/shared` and `packages/db` consumed by both `apps/mobile` (Expo) and `apps/admin` (Next.js). As the project evolves, a type or utility is added that uses a Node.js-only API (e.g., `fs`, `path`, `crypto` from Node). It works in `apps/admin` but silently fails or crashes at runtime in `apps/mobile` (Hermes JS engine, no Node globals). EAS Build completes successfully — the error only surfaces at runtime on device.

**Why it happens:**
`packages/shared` starts as pure TypeScript utilities. Over time, conveniences creep in. A helper imports from a Drizzle ORM module that brings in a PostgreSQL driver with Node dependencies. The mobile app bundles it without error (Metro bundler does not fail on unused imports) until that code path is actually executed.

**How to avoid:**
- Strictly partition shared packages: `packages/shared` = zero Node-only APIs, universal types and utilities only. `packages/db` = server-only, explicitly not imported by the mobile app.
- Add a lint rule (`eslint-plugin-node`) in `packages/shared` that bans Node-specific globals.
- Verify `apps/mobile`'s full dependency tree has no server-only modules in its bundle: run `npx expo export` and inspect the bundle output for `pg`, `fs`, `path` references.

**Warning signs:**
- `packages/shared` imports from `packages/db` or from `drizzle-orm/pg-core`.
- EAS build passes but the app crashes on a specific screen in production.
- No bundler analysis step in CI.

**Phase to address:** Monorepo foundation phase; validate bundle cleanliness before adding more shared packages.

---

### Pitfall 8: Infinite Feed Memory Growth Without Virtualization

**What goes wrong:**
Infinite scroll on the home feed works correctly for the first 50-100 posts. After 30 minutes of scrolling, the app holds thousands of React Native view nodes in memory. On mid-range Android devices (the majority of the target market in Thailand/Korea), the app crashes with out-of-memory errors or becomes jittery enough to feel broken.

**Why it happens:**
`FlatList` with `useInfiniteQuery` renders all fetched items into the DOM as users scroll. TanStack Query by default keeps all pages in cache. The combination is correct for a desktop web app but problematic for mobile.

**How to avoid:**
- Use `FlashList` (Shopify) instead of `FlatList` for feed rendering — it recycles cells and is significantly more performant on long lists.
- Use TanStack Query's `maxPages` option to keep only the last N pages in memory (e.g., `maxPages: 5`). When the user scrolls back up past page 1, earlier pages are dropped and re-fetched on demand.
- Set `removeClippedSubviews={true}` and `windowSize={5}` on FlatList/FlashList.

**Warning signs:**
- `<FlatList data={allPages.flatMap(p => p.posts)} />` pattern (all pages flattened into one array).
- No `maxPages` configuration in `useInfiniteQuery` calls.
- Memory profiler shows monotonically increasing usage during extended scrolling sessions.

**Phase to address:** Feed implementation phase, before the first performance testing pass.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skipping `post_translations` caching table, calling Google Translate per request | Faster to implement | Cost explosion, slow UX at scale | Never — implement cache from day one |
| Using `profiles.display_name` everywhere instead of building `community_members` identity layer | Simpler queries | Identity privacy is broken, core value prop lost | Never |
| Synchronous push notification fan-out in the request handler | No queue infrastructure needed | Timeouts on large communities, silent delivery failures | Only for <50-user test communities |
| Using `auth.uid()` directly in RLS instead of `(select auth.uid())` | Marginally shorter code | Order-of-magnitude query slowdowns at scale | Never — always use select wrapper |
| Skipping `maxPages` on TanStack Query infinite scroll | Simpler state management | OOM crashes on mid-range Android after extended sessions | Acceptable in Phase 1 if communities are small, must fix before launch |
| Single `anon` role for all API access, deferring service_role to admin | Faster initial setup | Cannot implement server-side admin operations safely | Only if admin panel accesses DB via separate server-side connection |
| Hard-coding content to one language during MVP | Faster iteration | i18n retro-fit is a full rewrite of string extraction | Never — use i18n-expo from day one even if only KO is supported initially |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Expo Push Notifications | Store push tokens without validating receipts; dead tokens accumulate | Poll Expo Push Receipts API within 24h; delete tokens with `DeviceNotRegistered` status |
| Expo Push Notifications | Calling push API synchronously in request handler | Enqueue to `pgmq`, process via `pg_cron` worker in batches of 100 |
| Google Translate API | Calling per-user, per-request, without caching | Cache in `post_translations` table; batch all 5 target languages in one API call |
| Supabase Storage | Storing original uploaded images without resizing; 10MB images in the feed | Use Supabase Image Transformations (`?width=800&quality=75`) or transform on upload via Edge Function |
| Supabase Auth (Apple OAuth) | Only testing Google OAuth; Apple OAuth has stricter requirements | Apple requires a privacy policy URL at submission time and "Sign in with Apple" button styling compliance |
| Supabase Realtime | Subscribing to entire tables via broadcast without filtering | Use Postgres Changes with filters (`filter: community_id=eq.${id}`) to prevent over-delivery |
| Drizzle ORM + Supabase | Running raw migrations manually alongside Drizzle migrations | Use Drizzle Kit exclusively for schema migrations; do not mix with Supabase dashboard DDL edits |
| EAS Build (iOS) | Missing entitlements for push notifications | Add `aps-environment` entitlement in `app.json` under `ios.entitlements`; missing this causes silent push failures |
| OpenAI Moderation API | Calling synchronously on every post submit | Enqueue for async moderation; show post optimistically and flag/remove if moderation fails |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| RLS `auth.uid()` called per-row | Feed queries 2-10s even with indexes present | Always wrap: `(select auth.uid())` | ~10k rows in table |
| Missing index on `community_id` in `posts` | Community feed full table scans | `CREATE INDEX idx_posts_community_id ON posts(community_id)` | ~50k total posts |
| No cursor-based pagination (using `OFFSET`) | Page 10+ loads slower than page 1 | Use `cursor` (created_at + id composite) instead of `OFFSET` | ~5k posts per community |
| FlatList rendering all infinite scroll pages | App memory grows unboundedly, OOM crashes | FlashList + TanStack Query `maxPages: 5` | After 5+ page loads on mid-range Android |
| Synchronous fan-out per post | Creator post times out on large communities | pgmq async queue + pg_cron consumer | Communities > 200 members |
| Translation on every feed load (no cache) | Google Translate costs spike, feed slow | `post_translations` DB cache | >100 daily active translating users |
| Supabase Realtime subscription per community joined | WebSocket connections multiply, exceed tier limits | Use pull-to-refresh for feed; Realtime only for narrow notification signals | >3 communities joined per user, >300 concurrent users |
| N+1 query for "is liked / is following" per post | Feed endpoint makes 1 + N queries per page | Batch with array aggregation: `LEFT JOIN likes ON ...` in the feed query | Any feed with > 20 posts |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Trusting `user_metadata` JWT claims for role/permission checks | Users can modify their own metadata; admin role self-grant | Store roles in a server-side `user_roles` table with RLS; never read from `user_metadata` for authorization |
| Missing RLS on `community_members` | User can read all members of communities they haven't joined | Explicit RLS: SELECT only if `user_id = (select auth.uid())` or if requester is a member of the same community |
| Exposing global `profiles` data to community feeds | Breaks persona isolation, privacy violation | RLS on profiles: only return own profile via API; community display identity comes from `community_members` only |
| Admin dashboard using `anon` key | Anon key is public; admin operations get no elevated privileges | Admin Next.js app must use `service_role` key server-side only (via Next.js server actions / API routes, never exposed to browser) |
| Allowing post/comment content with no input sanitization | XSS in web view; markdown injection | Sanitize on input at Edge Function level; store raw text, render escaped |
| Not validating `community_id` on post creation | User posts to a community they have not joined | RLS INSERT policy on `posts`: `community_id IN (SELECT community_id FROM community_members WHERE user_id = (select auth.uid()))` |
| Image URLs from Storage with no expiry | Deleted content images still accessible indefinitely | Use signed URLs with short TTL for private content; rely on public bucket only for explicitly public assets |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No empty state on home feed for new users with 0 communities joined | User sees a blank screen, feels lost or broken | Show curated "Discover" recommendations when `community_memberships.count = 0` (already in spec — must be implemented first, not deferred) |
| Showing global username instead of community nickname in notifications | Breaks persona privacy in push notification preview | Notification copy must use `community_members.community_nickname`, not `profiles.display_name` |
| All 5 languages mixed in a single feed with no indication of source language | Reader cannot tell if a post is in their language or was auto-translated | Show source language badge on each post; show "Translated from KO" label when translation is active |
| Translation button disappearing during loading with no skeleton | User taps "Translate", nothing visible happens, taps again causing duplicate requests | Show inline loading state on translate button; disable on first tap |
| Push notification settings buried in app settings | Users opt out of all notifications because granularity is too coarse | Per-community, per-category notification toggles must be accessible from the community screen directly (not only from global settings) |
| Creator reply highlight not visually distinct from regular comments | Fans miss the creator interaction — the highest-value content signal | Creator replies need visual treatment (border, avatar ring, label) distinct from fan replies |
| Signup flow ending at blank home feed | User has no context about what to do next | After OAuth signup, route directly into the creator selection onboarding flow (Spotify-style) before showing the feed |

---

## "Looks Done But Isn't" Checklist

- [ ] **Push Notifications:** Token registration is working — verify receipt polling is ALSO implemented; tokens are deleted on `DeviceNotRegistered` receipts.
- [ ] **Translation:** Translate button works on demand — verify translations are cached in `post_translations` and not re-called on re-renders or page revisits.
- [ ] **Dual Account System:** Community nickname displays in feed — verify global `display_name` from `profiles` does NOT appear in any community-scoped API response. Test by creating a user with different global name vs. community nickname.
- [ ] **RLS Policies:** All policies written — verify with `EXPLAIN ANALYZE` that queries use index scans, not sequential scans, on tables with 10k+ rows.
- [ ] **Age Gate / Content Rating:** App is submittable — verify App Store content rating is set to 17+ and privacy policy URL is live before first TestFlight submission.
- [ ] **Notification Fan-Out:** Notifications are sent — verify they are sent asynchronously via queue, not blocking the post creation request. Test with a community of 500+ test subscribers.
- [ ] **i18n Strings:** UI displays in Korean — verify all 5 locales are loaded and no hardcoded Korean/English strings remain in components. Run `npx expo export` and check for untranslated strings.
- [ ] **Admin Dashboard Auth:** Admin panel loads — verify it uses `service_role` key only in server-side code, never exposed in client-side bundle.
- [ ] **Feed Pagination:** Infinite scroll loads more posts — verify it uses cursor-based pagination (`created_at` + `id`), not `OFFSET`, and `maxPages` is configured.
- [ ] **Image Storage:** Images upload and display — verify large images are served with transformation params (`?width=800`) and not at original resolution in the feed.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| RLS without `(select auth.uid())` wrapper discovered at scale | MEDIUM | Update all policies in a single migration; no data changes needed; deploy during low-traffic window |
| Persona isolation leak (real name exposed in community) | HIGH | Immediate hotfix required; audit all API responses for `display_name` field leakage; notify affected users |
| Push notification fan-out timeout causing silent failures | MEDIUM | Add pgmq queue and pg_cron consumer; re-send missed notifications for recent posts retroactively |
| Translation cost explosion | MEDIUM | Add `post_translations` cache table + migration; costs stop immediately after deploy; no data loss |
| App Store rejection for content rating | HIGH (if delayed) | Update rating to 17+; add or update privacy policy URL; re-submit; 1-5 day review cycle |
| Monorepo shared package with Node.js dep in mobile bundle | MEDIUM | Audit `packages/shared` imports; extract server-only code to `packages/server`; rebuild and retest |
| Realtime connection limit exceeded in production | MEDIUM | Remove per-feed Realtime subscriptions; replace with polling + single notification-signal channel; requires deploy but no data migration |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| RLS without `(select auth.uid())` + missing indexes | Phase 1 (Data Model & Auth) | `EXPLAIN ANALYZE` on all policy-protected tables with 10k rows of seed data |
| Persona isolation leak (global profile bleeds into community) | Phase 1 (Data Model & Auth) | Integration test: community API response never contains `profiles.display_name` |
| Age-gate data model missing | Phase 1 (Data Model & Auth) | `profiles` table has `date_of_birth` column; `posts` table has `content_rating` column |
| i18n hardcoded strings | Phase 2 (Core UI / Navigation) | All text goes through `i18n-expo` translation keys; CI lint check for literal Korean/English strings in JSX |
| Monorepo bundle contamination | Phase 2 (Monorepo Foundation) | `expo export` bundle analysis; no `pg` or `fs` in mobile bundle |
| Feed N+1 queries | Phase 3 (Feed Implementation) | `pg_stat_statements` query count per feed request <= 3 |
| Feed memory growth (no virtualization) | Phase 3 (Feed Implementation) | Memory profiler on 10-page scroll session on mid-range Android shows stable memory |
| Synchronous push fan-out | Phase 4 (Notification System) | Post creation API response time is constant regardless of community size; queue consumer processes independently |
| Translation cost explosion | Phase 4 (i18n / Translation) | `post_translations` cache table populated; Google Translate API not called on cache hit |
| Realtime over-subscription | Phase 3 (Feed Implementation) | Realtime dashboard shows < 2 channels per active user session |
| Admin dashboard using anon key | Phase 5 (Admin Dashboard) | Network tab in browser shows no `anon` key in admin API calls; only server-side service_role used |
| App Store content rating | Phase 6 (App Store Submission) | Content rating set to 17+; privacy policy URL live; TestFlight build passes review |

---

## Sources

- [Supabase RLS Performance and Best Practices](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices) — HIGH confidence
- [Supabase RLS Performance Discussion](https://github.com/orgs/supabase/discussions/14576) — HIGH confidence
- [Supabase Realtime Limits](https://supabase.com/docs/guides/realtime/limits) — HIGH confidence
- [Expo Push Notifications FAQ](https://docs.expo.dev/push-notifications/faq/) — HIGH confidence
- [Expo Push Notifications: 5 Critical Setup Mistakes](https://www.sashido.io/en/blog/expo-push-notifications-setup-caveats-troubleshooting) — MEDIUM confidence
- [TanStack Query Infinite Queries](https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries) — HIGH confidence
- [Tenant Isolation in Multi-Tenant Systems](https://securityboulevard.com/2025/12/tenant-isolation-in-multi-tenant-systems-architecture-identity-and-security/) — MEDIUM confidence
- [Data Isolation in Multi-Tenant SaaS](https://redis.io/blog/data-isolation-multi-tenant-saas/) — MEDIUM confidence
- [Age Verification on Social Media in 2025](https://sumsub.com/blog/age-verification-on-social-media/) — MEDIUM confidence
- [Supabase Queues / pgmq](https://supabase.com/docs/guides/queues/pgmq) — HIGH confidence
- [Build Queue Worker using Supabase Cron and Queue](https://dev.to/suciptoid/build-queue-worker-using-supabase-cron-queue-and-edge-function-19di) — MEDIUM confidence
- [i18n Technical Challenges](https://activeloc.com/blog/i18n-technical-challenges/) — MEDIUM confidence
- [Scope Creep: The Silent Killer of Solo Development](https://www.wayline.io/blog/scope-creep-solo-indie-game-development) — MEDIUM confidence (general principle applies)

---
*Pitfalls research for: Wecord — BL/GL Fan Community Platform*
*Researched: 2026-03-18*

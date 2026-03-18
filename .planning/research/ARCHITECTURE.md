# Architecture Research

**Domain:** Fan community platform (BL/GL creator-fan engagement)
**Researched:** 2026-03-18
**Confidence:** HIGH — based on existing project architecture docs (docs/ARCHITECTURE.md v2.0) plus domain analysis

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │  iOS App     │  │ Android App  │  │  Web App (CF Pages)      │   │
│  │  (Expo)      │  │  (Expo)      │  │  (Expo Universal)        │   │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬─────────────┘   │
│         └────────────────┬┘                        │                 │
│                          │  ┌──────────────────────┘                 │
│                          │  │                                        │
│               ┌──────────┴──┴───────────┐                           │
│               │   Admin Dashboard        │                           │
│               │   (Next.js / CF Pages)   │                           │
│               └──────────────┬──────────┘                           │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                         Supabase Layer                               │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │  Auth    │  │ PostgREST  │  │ Realtime │  │    Storage       │   │
│  │ (OAuth)  │  │ (REST API) │  │ (WS)     │  │ (S3/CDN)         │   │
│  └──────────┘  └─────┬──────┘  └────┬─────┘  └──────────────────┘   │
│                      │              │                                 │
│  ┌───────────────────▼──────────────▼─────────────────────────────┐  │
│  │                  Edge Functions (Deno)                          │  │
│  │  translate │ moderate │ notify │ highlight │ home-feed          │  │
│  └───────────────────────────────┬─────────────────────────────────┘  │
└──────────────────────────────────┼──────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────┐
│                      PostgreSQL 17 Layer                             │
│  ┌───────────┐ ┌────────────┐ ┌────────┐ ┌────────┐ ┌────────────┐  │
│  │  Core     │ │pg_textsearch│ │  pgmq  │ │pg_cron │ │    JSONB   │  │
│  │  Tables   │ │ (BM25)     │ │  (Q)   │ │(sched) │ │(meta/cache)│  │
│  └───────────┘ └────────────┘ └────────┘ └────────┘ └────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼──────────────────────────────────┐
│                      External Services                               │
│  Google Translate │ OpenAI Moderation │ Expo Push │ Resend │ Sentry  │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `apps/mobile` | All user-facing screens (iOS/Android/Web). Expo Universal with expo-router file-based routes. | Supabase Auth, PostgREST, Realtime, Storage, Edge Functions |
| `apps/admin` | Operator dashboard — community CRUD, moderation queue, notice management, analytics, banner management. | PostgREST (admin RLS), Edge Functions |
| `packages/db` | Drizzle ORM schema definitions, migration files, seed data. Single source of truth for table shapes. | PostgreSQL (build-time); consumed by apps at runtime via Supabase client |
| `packages/supabase` | Edge Functions (Deno) + Supabase config.toml. Business logic that can't be expressed as PostgREST CRUD. | PostgreSQL, external APIs |
| `packages/shared` | TypeScript types, Zod validators, i18n strings (KO/EN/TH/ZH/JA), constants. | Consumed by all other packages — no outbound deps |
| `packages/ui` | Shared Nativewind components reused across mobile and admin. | packages/shared |
| Supabase Auth | Google / Apple OAuth → JWT issuance. Integrates with RLS via `auth.uid()`. | PostgreSQL (via RLS), mobile/admin apps |
| PostgREST | Auto-generated REST API for every table/view exposed in the public schema. RLS enforced at DB level. | PostgreSQL |
| Supabase Realtime | WebSocket subscriptions for Postgres Changes + Broadcast. Powers new-post badges and unread notification counters. | PostgreSQL pg_notify |
| Supabase Storage | S3-compatible file store for images and video uploads. Transform API for on-the-fly resizing. | CDN (Cloudflare) |
| Edge Function: `translate` | Cache-first translation: check `post_translations` → Google Translate → store result. | PostgreSQL, Google Translate API |
| Edge Function: `moderate` | Content safety gate on post/comment creation. Keywords filter (Postgres) → OpenAI Moderation API. | PostgreSQL, OpenAI API |
| Edge Function: `notify` | Fan-out push notifications. Queries `notification_preferences`, batches tokens via pgmq, bulk-inserts in-app notifications. | PostgreSQL (pgmq), Expo Push |
| Edge Function: `highlight` | Aggregates Highlight tab data: pinned notices + calendar + artist posts + fan posts + artist profiles. | PostgreSQL |
| Edge Function: `home-feed` | Merged feed across all joined communities, cursor-paginated. Used on home tab when user has 1+ communities. | PostgreSQL |
| pgmq | Message queue for async fan-out. Decouples `notify` Edge Function from synchronous request path. | PostgreSQL |
| pg_cron | Scheduled jobs: publish scheduled notices, VACUUM, future subscription billing (v1.1). | PostgreSQL |
| pg_textsearch (BM25) | Full-text search over posts and communities. GIN-indexed tsvector column on posts. | PostgreSQL |
| `post_translations` table | Translation cache. Unique index on `(target_id, target_type, target_lang)` for O(1) cache hits. | PostgreSQL |

## Recommended Project Structure

```
wecord/
├── apps/
│   ├── mobile/                     # Expo Universal (iOS/Android/Web)
│   │   └── app/
│   │       ├── (auth)/             # login, register, onboarding
│   │       ├── (tabs)/             # home, shop, dm, more
│   │       ├── community/[slug]/   # highlight, fan, creator, notice, members, join
│   │       ├── member/[memberId]   # artist profile
│   │       └── profile/[cmId]      # community profile
│   │
│   └── admin/                      # Next.js (Cloudflare Pages)
│       └── app/
│           ├── dashboard/
│           ├── communities/
│           ├── users/
│           ├── moderation/
│           ├── notices/
│           └── settings/
│
├── packages/
│   ├── db/                         # Drizzle schema + migrations
│   │   └── schema/
│   │       ├── auth.ts             # users, profiles
│   │       ├── community.ts        # communities, community_members
│   │       ├── artist-member.ts    # artist_members
│   │       ├── follow.ts           # community_follows
│   │       ├── content.ts          # posts, comments, likes
│   │       ├── notification.ts     # notifications, notification_preferences
│   │       ├── moderation.ts       # reports, user_sanctions
│   │       └── translation.ts      # post_translations
│   │
│   ├── supabase/
│   │   └── functions/              # Edge Functions (Deno)
│   │       ├── translate/
│   │       ├── moderate/
│   │       ├── notify/
│   │       ├── highlight/
│   │       ├── home-feed/
│   │       ├── generate-nickname/
│   │       └── email/
│   │
│   ├── shared/                     # Zero-dependency shared code
│   │   ├── types/
│   │   ├── constants/
│   │   ├── validators/             # Zod schemas
│   │   └── i18n/                  # ko/en/th/zh/ja JSON
│   │
│   └── ui/                         # Shared Nativewind components
│
└── tooling/                        # eslint, tsconfig, prettier presets
```

### Structure Rationale

- **packages/db:** Drizzle schema is the canonical data contract. Both apps and Edge Functions import from here, eliminating drift between schema and types.
- **packages/supabase/functions:** Co-located with Supabase config so `supabase deploy` covers both migrations and functions in one command.
- **packages/shared:** No outbound dependencies — safe to import from every package without creating cycles.
- **apps/mobile app/:** expo-router file convention means route boundaries are explicit in directory structure; community-scoped screens are grouped under `community/[slug]/`.

## Architectural Patterns

### Pattern 1: RLS-First Security

**What:** All data access rules live in PostgreSQL Row Level Security policies. The application layer never manually filters by owner/membership — the database enforces it.

**When to use:** Every table that stores user-generated content or personal data.

**Trade-offs:** Eliminates an entire class of authorization bugs; policies can be complex to write and test initially; requires `auth.uid()` to be set (JWT must be passed to every DB call).

**Example:**
```sql
-- Posts visible only to community members
CREATE POLICY "posts_select_member" ON posts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM community_members
    WHERE community_members.community_id = posts.community_id
      AND community_members.user_id = auth.uid()
  )
);
```

### Pattern 2: PostgREST for CRUD, Edge Functions for Orchestration

**What:** Use PostgREST auto-generated endpoints for simple reads and writes. Write Edge Functions only when orchestration across multiple tables or external API calls is needed.

**When to use:** PostgREST for: post list, like toggle, comment write, notification mark-read. Edge Functions for: translation (cache + external API), fan-out notify (multi-step), highlight aggregate (complex multi-query).

**Trade-offs:** Reduces server code surface area drastically; Edge Functions cold-start adds ~150–400ms latency on first request; Deno runtime limits available NPM packages.

**Example:**
```typescript
// Client — simple CRUD goes directly to PostgREST
const { data } = await supabase
  .from('posts_with_nickname')
  .select('*')
  .eq('community_id', communityId)
  .order('created_at', { ascending: false })
  .limit(20);

// Complex orchestration calls Edge Function
const { data } = await supabase.functions.invoke('highlight', {
  body: { community_id: communityId, cursor }
});
```

### Pattern 3: Dual Account Structure (Global + Community Profile)

**What:** One `users`/`profiles` record per person (global identity), plus one `community_members` record per community they join (community persona). The community nickname exists only within a community scope.

**When to use:** Always — this is the core identity model. The `posts_with_nickname` view abstracts the JOIN so consumers don't have to think about it.

**Trade-offs:** Every post/comment query requires a JOIN through `community_members` to resolve the display nickname. The view and GIN indexes handle this at acceptable query cost.

**Example:**
```sql
-- Abstracts the JOIN for all consumers
CREATE VIEW posts_with_nickname AS
SELECT p.*,
       cm.community_nickname AS author_nickname,
       cm.id AS author_cm_id,
       am.display_name AS artist_member_name,
       c.name AS community_name,
       c.slug AS community_slug
FROM posts p
JOIN community_members cm
  ON cm.user_id = p.author_id AND cm.community_id = p.community_id
LEFT JOIN artist_members am ON am.id = p.artist_member_id
JOIN communities c ON c.id = p.community_id;
```

### Pattern 4: Cursor-Based Pagination

**What:** All feed queries use `(created_at DESC, id DESC)` cursor pairs instead of OFFSET. Composite index on posts makes this efficient.

**When to use:** Every infinite-scroll list: fan feed, creator feed, home feed, notifications, search results.

**Trade-offs:** Cannot jump to arbitrary page; correct for feeds where sequential navigation is the only UX need; requires stable unique secondary sort key (id) to handle same-second timestamps.

### Pattern 5: pgmq Fan-Out for Notifications

**What:** When a creator posts, the `notify` Edge Function queries notification-opted-in members, splits them into batches of 1000, enqueues each batch in pgmq, and bulk-inserts in-app notification rows. A separate worker drains the queue and calls Expo Push.

**When to use:** Any broadcast that could touch thousands of rows synchronously — creator posts, notices, system announcements.

**Trade-offs:** Decouples notification delivery from content creation latency; adds eventual-consistency delay (~seconds); requires pgmq consumer to be running or triggered (pg_cron or Edge Function polling).

## Data Flow

### Request Flow — Reading a Community Feed

```
User scrolls fan feed
    ↓
[mobile app] useInfiniteQuery (TanStack Query)
    ↓ cursor param
[PostgREST] GET /rest/v1/posts_with_nickname
    ↓ RLS check
[PostgreSQL] idx_posts_feed (community_id, created_at DESC, id DESC)
    ↓
[PostgREST] JSON response with 20 rows
    ↓
[TanStack Query] cache merge, append to list
    ↓
[FlashList] virtualized render
```

### Request Flow — Posting Content

```
User taps "Post"
    ↓
[mobile app] Zod validate input
    ↓ (if media) upload to Supabase Storage → get URL
    ↓
[PostgREST] POST /rest/v1/posts  (RLS enforces membership + nickname + no sanctions)
    ↓
[PostgreSQL] INSERT + tsvector trigger updates search_vector
    ↓
[pg_notify → Supabase Realtime] broadcasts INSERT event to community channel
    ↓ (async, separate path)
[Edge Function: moderate] checks keywords + OpenAI Moderation
    ↓ (async, separate path)
[Edge Function: notify] fan-out via pgmq → Expo Push
```

### Request Flow — Translation

```
User taps translate button on a post
    ↓
[mobile app] invoke('translate', { target_id, target_type, target_lang })
    ↓
[Edge Function: translate]
    1. SELECT from post_translations WHERE (target_id, target_type, target_lang) → cache hit? return
    2. SELECT content from posts WHERE id = target_id
    3. POST Google Translate API
    4. INSERT into post_translations (cache for all future requests)
    5. Return translated_text
    ↓
[mobile app] swap displayed text, cache in TanStack Query
```

### State Management

```
[Supabase Auth] → Zustand authStore (userId, session, role)
                       ↓ (read by)
               [All TanStack Query fetchers inject JWT]

[TanStack Query] → server state cache (feeds, posts, profiles, notifications)
                   auto-invalidated on mutation
                   stale-while-revalidate for feed freshness

[Zustand uiStore] → local UI state (selected community, new-post badge count,
                    active tab, unread notification count)
                    updated by Supabase Realtime channel events
```

### Key Data Flows

1. **Auth flow:** OAuth → Supabase Auth JWT → Zustand authStore → all PostgREST calls include `Authorization: Bearer` → RLS resolves `auth.uid()`.
2. **Onboarding fan-out:** First login → show creator selection → bulk INSERT `community_members` with generated nicknames → redirect to home feed.
3. **Highlight tab aggregation:** Single Edge Function call returns notices + calendar + artist posts + fan posts + artist profiles in one response, avoiding 5 separate round trips from the client.
4. **Home feed merge:** Edge Function queries `community_members` for all joined communities, unions posts across them sorted by `created_at DESC`, returns cursor-paginated result.
5. **Realtime badges:** Supabase Realtime `postgres_changes` on `posts` table (filter by `community_id`) increments a Zustand counter shown as a badge on the Feed tab.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–10K users (MVP) | Default Supabase Pro. Single DB instance. pgmq for async notifications. Materialized views for Highlight aggregation. No caching infra needed. |
| 10K–100K users | Add Supabase Read Replica; route read-heavy queries (feeds, search) to replica. Tune Supavisor connection pool. Pre-translate popular posts with pg_cron job. |
| 100K–1M users | Supabase Enterprise or dedicated instance. Partition `posts` and `notifications` tables by time. Consider Redis for hot-path counters (like_count, follower_count) if DB write contention emerges. Evaluate separating Search into dedicated service. |

### Scaling Priorities

1. **First bottleneck — DB connections:** At ~1K concurrent users, connection pool exhaustion is the first failure mode. Supavisor (Supabase's built-in pooler) at transaction mode resolves this without code changes.
2. **Second bottleneck — Notification fan-out:** Communities with 10K+ members will saturate a single Edge Function invocation. pgmq batch processing with pg_cron polling distributes the load asynchronously.
3. **Third bottleneck — Translation API cost:** At 10K+ daily translations, aggressive cache-first strategy (already designed in) and pre-translation of high-view posts via pg_cron keeps costs linear with unique content, not total requests.

## Anti-Patterns

### Anti-Pattern 1: Bypassing RLS with Service Role Key on the Client

**What people do:** Use the Supabase `service_role` key in mobile app to avoid writing RLS policies.

**Why it's wrong:** Exposes unrestricted DB access to every device. Any decompiled app reveals the key, allowing arbitrary data reads/writes/deletes.

**Do this instead:** Service role key is used only in Edge Functions (server-side, environment variable). Client always uses the `anon` key; RLS policies enforce all access rules.

### Anti-Pattern 2: OFFSET Pagination on Feeds

**What people do:** `SELECT * FROM posts LIMIT 20 OFFSET 200` for infinite scroll.

**Why it's wrong:** PostgreSQL must scan and discard 200 rows on every page request. Performance degrades linearly with page depth. Inserts during scrolling cause duplicate/skipped items.

**Do this instead:** Cursor-based pagination with `(created_at, id)` composite key. `WHERE (created_at, id) < ($cursor_ts, $cursor_id) ORDER BY created_at DESC, id DESC LIMIT 20`. Index `idx_posts_feed ON posts(community_id, created_at DESC, id DESC)` makes this O(log n).

### Anti-Pattern 3: Client-Side Follow-Based Feed Construction

**What people do:** Fetch the list of followed creators, then issue N separate feed requests — one per followed creator.

**Why it's wrong:** N+1 query pattern. 50 followed creators = 50 API round trips per feed refresh. Latency multiplies.

**Do this instead:** `home-feed` Edge Function performs a single SQL query with `IN (community_ids)` or a JOIN through `community_members`, returns a unified cursor-paginated feed.

### Anti-Pattern 4: Storing Per-Community Identity in the Global Profile

**What people do:** Add a `nickname` field to `profiles` and reuse it across all communities.

**Why it's wrong:** Destroys persona isolation — the core differentiator. Fans can't maintain separate identities per fandom.

**Do this instead:** `community_members.community_nickname` is the only display name shown within a community. The `profiles.global_nickname` is used only for the "More" (settings) tab and admin purposes.

### Anti-Pattern 5: Synchronous Fan-Out in the Post-Create Request

**What people do:** Send push notifications to all community members synchronously before returning the post-create response.

**Why it's wrong:** A community with 50K members would hold the create request open for 10+ seconds or time out. The creator sees a slow "Post" button.

**Do this instead:** Post INSERT returns immediately. A Postgres trigger (or post-response Edge Function call) enqueues the fan-out job in pgmq. pg_cron or a polling function drains the queue asynchronously.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Google Translate API | Called from `translate` Edge Function only. Never from client. | Cache every result in `post_translations` to minimize API cost. ~$20/1M chars. |
| OpenAI Moderation API | Called from `moderate` Edge Function on post/comment create. | Free moderation endpoint. Fire-and-forget; don't block post creation on response (unless content scores as clearly dangerous). |
| Expo Push Notifications | Called from `notify` Edge Function after pgmq dequeue. | Batch up to 100 tokens per Expo Push API call. Store push tokens in `profiles.push_token`. |
| Resend (email) | Called from `email` Edge Function. | Welcome emails, moderation result notifications. Free tier: 3K/month. |
| Sentry | Initialized in mobile app (React Native SDK) and Edge Functions. | Error boundary + performance tracing. Free tier: 5K events/month. |
| x-square.kr (Shop) | React Native WebView in the Shop tab. | No API integration; pure WebView passthrough with session cookie handling. |

### Internal Package Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `apps/mobile` ↔ `packages/db` | Import Drizzle schema types for TypeScript autocomplete; runtime queries go through Supabase JS client (PostgREST), not Drizzle directly | Drizzle is used for migrations and type inference, not as a query builder in the mobile app |
| `apps/admin` ↔ `packages/db` | Same as mobile — types from Drizzle, runtime via Supabase client | Admin uses service-role key server-side in Next.js Server Components |
| `packages/supabase/functions` ↔ `packages/db` | Edge Functions import Drizzle schema types for type-safe SQL | Deno runtime; import via `npm:` specifier |
| `apps/*` ↔ `packages/shared` | Direct import — types, validators (Zod), i18n strings | One-way dependency: shared has no app knowledge |
| Mobile ↔ Supabase Realtime | WebSocket subscription per community channel and per user notification channel | Subscribe on screen mount, unsubscribe on unmount to avoid channel leak |

## Suggested Build Order

Dependencies drive this order. Each phase can only begin when its prerequisite components exist.

```
Phase 1 — Foundation (nothing can work without this)
├── packages/shared  (types, validators, constants, i18n)
├── packages/db      (Drizzle schema: auth, community, content tables)
├── Supabase project (Auth config, RLS policies, core migrations)
└── Monorepo tooling (Turborepo, pnpm, ESLint, tsconfig)

Phase 2 — Auth & Identity (prerequisite for all user-facing features)
├── Supabase Auth (Google/Apple OAuth)
├── profiles table + global profile screen
├── Onboarding flow (creator selection → bulk community_members insert)
└── Zustand authStore + TanStack Query client setup

Phase 3 — Community Discovery & Join (prerequisite for all content)
├── communities table + search endpoint (pg_textsearch)
├── Community listing / search / join screens
├── community_members insert (nickname generation Edge Function)
└── RLS policies for member-gated content

Phase 4 — Core Content Loop (the product's reason to exist)
├── posts + comments + likes tables (with RLS)
├── Fan feed (cursor-paginated FlashList)
├── Creator feed (author_role = 'creator' filter)
├── Post creation (text/image, Storage upload)
├── Comment thread (1-depth replies)
├── Like toggle
└── posts_with_nickname view

Phase 5 — Highlight Tab & Notices (community homepage)
├── notices table + admin CRUD
├── artist_members table
├── highlight Edge Function (aggregation)
└── Highlight tab rendering (notices → artist posts → fan posts → artist profiles)

Phase 6 — Notifications (engagement retention)
├── notifications + notification_preferences tables
├── notify Edge Function (pgmq fan-out)
├── Supabase Realtime channels (new-post badge, unread count)
└── Push notification permission + token storage

Phase 7 — Translation (key differentiator for global market)
├── post_translations table + unique index
├── translate Edge Function (cache-first)
└── Translate button on post/comment UI

Phase 8 — Home Feed & Search (discovery surfaces)
├── home-feed Edge Function (cross-community merge)
├── Home tab (0 communities: recommendations; 1+: merged feed)
├── Search screen (community + post full-text via pg_textsearch)
└── Promotion banner table + admin CRUD + carousel

Phase 9 — Moderation & Safety (required before public launch)
├── reports table + report flow
├── user_sanctions table
├── moderate Edge Function (keyword filter + OpenAI)
├── Admin moderation queue (Next.js dashboard)
└── Rate limiting in Edge Functions

Phase 10 — Admin Dashboard (operations)
├── Community / creator / member management
├── Notice scheduling (pg_cron + scheduled_at)
├── Banner management
└── Basic analytics views
```

**Critical path:** Phase 1 → 2 → 3 → 4 is the hard dependency chain. Phases 5–8 can partially overlap once Phase 4 is stable. Phase 9 must complete before any public user acquisition.

## Sources

- `docs/ARCHITECTURE.md` v2.0 (2026-03-12) — primary source; Weverse-benchmarked architecture for this exact project
- `docs/PRD.md` v1.1 (2026-03-12) — feature requirements and persona definitions
- `.planning/PROJECT.md` (2026-03-18) — confirmed tech stack and key decisions
- Supabase documentation: PostgREST, Realtime, Edge Functions, RLS — HIGH confidence (official platform)
- pgmq, pg_cron, pg_textsearch behavior — HIGH confidence (PostgreSQL extension documentation)

---
*Architecture research for: Wecord — BL/GL fan community platform*
*Researched: 2026-03-18*

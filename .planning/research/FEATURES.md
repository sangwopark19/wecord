# Feature Research

**Domain:** BL/GL fan community platform (Weverse-style, niche creator-fan social app)
**Researched:** 2026-03-18
**Confidence:** HIGH (MVP scope defined in PRD.md; competitor Weverse well-documented; BL/GL market validated)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or broken. Derived from Weverse's core feature set (12M+ MAU benchmark) and standard fan-community expectations.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Social OAuth login (Google/Apple) | Every modern app; fans don't want another password | LOW | Supabase Auth handles this. Email/password not needed for MVP. |
| Global profile (nickname, avatar, bio) | Identity baseline — users need to exist | LOW | `profiles` table. Nickname uniqueness enforced. |
| Creator/community discovery & join | Useless platform if you can't find your creator | MEDIUM | pg_textsearch for search; community preview card (member count, recent activity). |
| Creator post feed (Artist tab) | Primary reason fans download — to see creator content | MEDIUM | Separate tab from fan feed. RLS enforces creator-only posting. |
| Fan post feed with media | Fans want to share reactions, art, fancams | MEDIUM | Text + up to 10 images + 1 video. Infinite scroll with cursor pagination. |
| Comments + replies (1 depth) | Dialogue is core to fandom engagement | LOW | `parent_comment_id` nullable. Creator replies visually highlighted. |
| Likes on posts/comments | Minimum reaction affordance; feels broken without it | LOW | `likes` table with UNIQUE constraint. Optimistic UI. |
| Push notifications (creator posts) | Fans installed the app to know when creator posts | MEDIUM | Expo Push Notifications + Edge Function fan-out. |
| In-app translation (post/comment) | 90%+ of Weverse users are international; language barrier = churn | MEDIUM | Google Translate API via Edge Function. Cache in `post_translations` table. |
| App UI localization (5 languages) | KO/EN/TH/ZH-CN/JA are the 4 BL/GL core markets + English | LOW | `expo-localization` + `i18next`. |
| Content reporting | Moderation baseline; required for app store approval | LOW | `reports` table. Category selector (hate/spam/violence/copyright/other). |
| Basic search (community + post) | Discovery entry point for new users | MEDIUM | pg_textsearch BM25, GIN index on tsvector. |
| Admin moderation dashboard | Platform dies without safety tools | HIGH | Next.js web app. Report queue, ban/warn/delete workflow. |
| Announcement/notice system | Creators need a pinned, authoritative channel separate from feed noise | LOW | `notices` table, `is_pinned`, `scheduled_at`. pg_cron for scheduling. |
| Home feed (personalized after join) | "Empty" home = users bounce; needs to show value immediately | MEDIUM | 0 communities → curated recommendations. 1+ → combined timeline feed. |
| Account settings / logout | Bare minimum user control | LOW | "More" tab. Language, notification prefs, profile edit, logout. |

### Differentiators (Competitive Advantage)

Features where Wecord competes on distinctiveness. Derived from BL/GL niche needs, Weverse gap analysis, and Wecord's stated core value.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Dual-account / per-community persona | BL/GL fans strongly maintain separate identities per fandom (ship names, pairing personas). No other platform supports this natively. Weverse has a single global identity. | MEDIUM | `community_members.community_nickname`. RLS enforces community scoping. Random code-nick default lowers friction. |
| BL/GL-only curation onboarding | First impression signals "this is your home." Spotify-style creator picker sets intent immediately. General platforms feel generic. | MEDIUM | Shown once on first sign-up only. Skippable. Seeded creator catalog needed pre-launch. |
| Community-scoped following (fan↔fan, fan↔artist) | Weverse has global follow; community-scoped follow preserves persona separation and reduces cross-fandom noise. | MEDIUM | `community_follows` table with community_id FK. RLS blocks cross-community follow. |
| Creator member system (group/solo) | BL/GL creators are often writing/art duos, drama casts, or voice actor groups — not just solo artists. Per-member follow + feed is natively modeled. | MEDIUM | `artist_members` table. Per-member post filtering and push notifications. |
| Creator reply highlight | Makes fans feel the creator "noticed" them — major retention driver. Weverse does this; most forum software doesn't. | LOW | Visual badge on comment when author_role='creator' replies. |
| Highlight tab (curated activity digest) | Consolidates: notices → calendar → artist posts → fan posts → artist profiles. One-stop "what's happening" view. Reduces navigation friction. | MEDIUM | Ordered section rendering. Same data as other tabs, assembled differently. |
| DM placeholder with waitlist capture | Signals DM is coming, builds anticipation, captures intent before v1.1. Competitor Bubble generates >$100M/yr from DM alone. | LOW | Static screen + `notification_preferences` opt-in. |
| Integrated shop via WebView | Immediate commerce touchpoint without building a storefront. x-square.kr is pre-existing BL/GL commerce. | LOW | `react-native-webview`. In-app navigation (back, refresh). |
| Promotion banner carousel (admin-managed) | Creator launch events, new community announcements — keeps home feed fresh. Admin CRUD without app updates. | LOW | `banners` table. Admin dashboard CRUD. Ordered carousel. |
| Multilingual auto-translation targeting BL/GL markets | Weverse's translation was the #1 retention factor for international fans. BL/GL market is cross-border by nature (KR manhwa, JP manga, TH drama all co-exist). | MEDIUM | Translation results cached to avoid repeat API costs. Toggle original/translated inline. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Moments / Stories (ephemeral content) | Users know it from Instagram/TikTok; feels modern | High implementation complexity (upload pipeline, 24hr expiry, story ring UI, viewer lists). PRD explicitly deferred. Creates user expectation that creator will "story" regularly — pressure with unclear payoff for BL/GL creators. | Artist posts with images serve the same "casual update" use case with less infrastructure. Defer to v1.1+. |
| Real-time DM (MVP) | Fans want to message creators | Requires presence system, read receipts, message storage at scale, abuse prevention, and payment gating. All of this is v1.1 scope. Building it without Jelly payment is unsustainable. | DM placeholder screen captures intent; real DM ships with Jelly in v1.1. |
| Jelly / in-app currency (MVP) | Digital currency makes monetization feel premium | Requires payment gateway (TossPayments IAP), accounting logic, refund flows, IAP review process (Apple/Google take 30%), legal compliance. Adds 8+ weeks to MVP. | Ship without monetization; validate community engagement first (stated MVP principle). |
| Live streaming (MVP) | V LIVE proved fans love live content | Requires separate streaming infrastructure (Mux or equivalent), chat realtime system, VOD conversion pipeline. High cost even at zero users. | VOD in v1.1; LIVE in v2.0. Use creator posts + push notifications to approximate "live moment" feel. |
| Twitter/Kakao/etc. OAuth (MVP) | More login options = more signups | Each OAuth provider adds integration maintenance and edge cases. Twitter's API policy is unstable. Kakao limits non-Korean app distribution. Apple/Google cover 95%+ of target market devices. | Google + Apple covers iOS and Android. Expand OAuth in v1.1 only if conversion data shows demand. |
| Cross-community feed / global discovery tab | Multi-fandom users want to see everything | Breaks the persona separation model — if you can see across communities, your community nickname is semi-public across all fandoms. Privacy risk and UX confusion. | Home feed aggregates only joined communities. Discovery entry via search or onboarding, not a global timeline. |
| Community-specific theme colors (MVP) | Makes each community feel unique | Requires design system work to support dynamic theming tokens at the community level, per-community branding storage, and testing every component in N color schemes. High QA cost for solo dev. | Fixed Teal accent for MVP. Community color theming in v1.1+ after design system is stable. |
| Real-time like/comment counts via WebSocket | Feels "live" and engaging | Supabase Realtime at scale adds connection pressure. Like/comment counts don't need sub-second freshness — polling on feed refresh is sufficient for MVP. | Optimistic UI for own actions + stale-while-revalidate refresh. Reserve Realtime for actual live features. |
| NFC / native device features | Fans want to tap phones at fan events | Out of scope for Expo Universal Web build. Very limited use case for digital-first BL/GL fandom. | Focus on digital touchpoints. Physical event features are v2.0+ if ever. |

---

## Feature Dependencies

```
[F-01 Onboarding / Auth]
    └──required by──> [F-02 Community Discovery & Dual Account]
    └──required by──> [F-08 More Tab / Account Hub]
    └──required by──> [F-10 Home Feed]
    └──required by──> ALL features (identity baseline)

[F-02 Community Discovery & Dual Account]
    └──required by──> [F-03 Fan Feed]
    └──required by──> [F-04 Creator Feed & Member System]
    └──required by──> [F-05 Comments & Likes]
    └──required by──> [F-09 Announcements]
    └──required by──> [F-16 Community Following & Profile]

[F-04 Creator Feed & Member System]
    └──required by──> [F-07 Notification System] (creator post triggers push)
    └──enhances──>    [F-16 Community Following] (per-member follow)

[F-03 Fan Feed] ──enhances──> [F-05 Comments & Likes]

[F-05 Comments & Likes]
    └──required by──> [F-06 Translation] (comments also translatable)
    └──required by──> [F-07 Notification System] (comment/like triggers)

[F-06 Translation]
    └──enhances──> [F-03 Fan Feed]
    └──enhances──> [F-04 Creator Feed]

[F-07 Notification System]
    └──required by──> [F-09 Announcements] (scheduled push fan-out)
    └──required by──> [F-15 DM Placeholder] (waitlist opt-in)

[F-09 Announcements]
    └──feeds into──> [Highlight Tab in F-10]

[F-11 Admin Dashboard]
    └──required by──> [F-12 Reports] (admin processes reports)
    └──required by──> [F-09 Announcements] (admin creates notices)
    └──required by──> [Promotion Banner in F-10] (admin CRUD banners)
    └──required by──> [F-04 Creator Feed] (admin creates creator accounts)

[F-12 Reports] ──feeds into──> [F-11 Admin Moderation Queue]

[F-13 Search]
    └──enhances──> [F-02 Community Discovery]

[F-16 Community Following & Profile]
    └──required by──> [F-07 Notification System] (following triggers alerts)
    └──enhances──> [F-04 Creator Feed] (per-member following)
```

### Dependency Notes

- **Auth (F-01) gates everything**: No other feature can function without a resolved user identity. Must be Phase 1.
- **Dual account (F-02) gates all community features**: The `community_members` record is the identity token for all community-scoped actions. Must be Phase 1 alongside Auth.
- **Admin dashboard (F-11) is a prerequisite for creator onboarding**: Creator accounts, communities, and artist members are created through admin, not self-service. Without admin, there is no content. Must be built in parallel or before public launch.
- **Creator Feed (F-04) must precede Notification System (F-07)**: Push fan-out is triggered by creator post events. The trigger and queue (pgmq + Edge Function) depend on post creation logic.
- **Highlight tab (in F-10) depends on F-09 Announcements, F-04 Creator Feed, F-16 Profiles**: All section data must exist before Highlight tab can render meaningfully.
- **Translation (F-06) is a soft dependency**: App works without it, but retention for non-KR users drops significantly. Should ship in same phase as feeds.

---

## MVP Definition

### Launch With (v1.0 — F-01 through F-16)

Minimum viable product to validate community engagement value.

- [ ] F-01 Onboarding & Auth — required identity baseline
- [ ] F-02 Community Discovery & Dual Account — core differentiation, needed to enter any community
- [ ] F-03 Fan Feed — fans need somewhere to post
- [ ] F-04 Creator Feed & Member System — primary pull factor for users to download
- [ ] F-05 Comments & Likes — engagement loop
- [ ] F-06 Translation + i18n — non-negotiable for global BL/GL market (KR/JP/TH/ZH/EN)
- [ ] F-07 Notification System — without this, creator posts go unnoticed
- [ ] F-08 More Tab / Account Hub — basic user control
- [ ] F-09 Announcements — creator/admin comms channel
- [ ] F-10 Home Feed (conditional) — value proposition surface for new and returning users
- [ ] F-11 Admin Dashboard — operator must be able to create communities and moderate
- [ ] F-12 Reports — required for App Store approval and community safety
- [ ] F-13 Search — discovery entry point for new community joins
- [ ] F-14 Shop Tab (WebView) — low-effort commerce touchpoint, x-square.kr already exists
- [ ] F-15 DM Placeholder — captures intent for v1.1 DM, signals roadmap to early users
- [ ] F-16 Community Following & Profile — social graph within community, retention mechanic

### Add After Validation (v1.1)

Add when community engagement is proven and monetization can be justified.

- [ ] F-17 DM (Creator ↔ Fan messaging) — trigger: DAU stable, Jelly system ready
- [ ] F-18 Jelly digital currency — trigger: payment gateway approved by Apple/Google
- [ ] F-19 Membership tiers — trigger: creator demand + Jelly in place
- [ ] F-20 VOD media content — trigger: creator content volume justifies storage/streaming cost
- [ ] F-21 Fan letters — trigger: engagement data shows demand
- [ ] F-22 Calendar (event schedule) — trigger: creators have regular event cadence
- [ ] F-23 Collection & Badges — trigger: core retention loop validated

### Future Consideration (v2.0+)

Defer until product-market fit is established.

- [ ] F-24 LIVE streaming — infrastructure cost only justified at scale
- [ ] F-25 Full commerce (merch shop) — requires logistics, inventory, fulfillment stack
- [ ] F-26 Listening Party — nice-to-have for music creators; not core to BL/GL
- [ ] F-27 Online concerts / events — high ops overhead, v2.0
- [ ] F-28 Subculture expansion (webtoon, cosplay, etc.) — after BL/GL market fit proven

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| F-01 Auth / Onboarding | HIGH | LOW | P1 |
| F-02 Dual Account / Community Join | HIGH | MEDIUM | P1 |
| F-03 Fan Feed | HIGH | MEDIUM | P1 |
| F-04 Creator Feed & Member System | HIGH | MEDIUM | P1 |
| F-05 Comments & Likes | HIGH | LOW | P1 |
| F-06 Translation + i18n | HIGH | MEDIUM | P1 |
| F-07 Notification System | HIGH | MEDIUM | P1 |
| F-10 Home Feed | HIGH | MEDIUM | P1 |
| F-11 Admin Dashboard | HIGH | HIGH | P1 |
| F-09 Announcements | MEDIUM | LOW | P1 |
| F-12 Reports | MEDIUM | LOW | P1 |
| F-13 Search | MEDIUM | MEDIUM | P1 |
| F-16 Community Following & Profile | MEDIUM | MEDIUM | P1 |
| F-08 More Tab | MEDIUM | LOW | P1 |
| F-14 Shop Tab (WebView) | MEDIUM | LOW | P1 |
| F-15 DM Placeholder | LOW | LOW | P1 |
| F-17 DM (real) | HIGH | HIGH | P2 |
| F-18 Jelly | HIGH | HIGH | P2 |
| F-19 Membership | HIGH | HIGH | P2 |
| F-20 VOD | MEDIUM | HIGH | P2 |
| F-23 Badges / Collection | MEDIUM | MEDIUM | P2 |
| F-22 Calendar | LOW | MEDIUM | P2 |
| F-21 Fan Letters | LOW | MEDIUM | P2 |
| F-24 LIVE Streaming | HIGH | HIGH | P3 |
| F-25 Commerce | HIGH | HIGH | P3 |
| F-27 Online Events | MEDIUM | HIGH | P3 |
| F-26 Listening Party | LOW | MEDIUM | P3 |
| F-28 Subculture Expansion | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch (MVP)
- P2: Should have — add when core is validated (v1.1)
- P3: Nice to have — future consideration (v2.0+)

---

## Competitor Feature Analysis

| Feature | Weverse | Bubble (DM app) | V LIVE (defunct) | Wecord MVP Approach |
|---------|---------|-----------------|-----------------|---------------------|
| Auth | Email + social OAuth | Phone/social | Naver + social | Google + Apple only (MVP); expand later |
| User identity | Single global profile | Single profile | Single profile | Global account + per-community persona (differentiator) |
| Creator feed | Yes (Artist tab) | No (DM only) | Live-first | Yes — Artist tab with member system |
| Fan feed | Yes | No | No | Yes — community fan board |
| Comments | Yes (1 depth) | No | Yes (live chat) | Yes (1 depth, creator reply highlight) |
| Translation | Yes (auto) | No | No | Yes (on-demand button + cached) |
| Notifications | Granular per community/category | Push for DMs | Push for live | Granular per community + category |
| Live streaming | Yes (Weverse LIVE) | No | Yes (core feature) | v2.0 only |
| DM | Yes (paid, Jelly) | Yes (core, paid) | No | v1.1 (placeholder in MVP) |
| Currency | Jelly | Separate subscription | Star coins | Jelly in v1.1 |
| Shop | Weverse Shop (deep integration) | No | No | WebView to x-square.kr (MVP bridge) |
| Community following | Global (not community-scoped) | N/A | N/A | Community-scoped only (persona protection) |
| Persona separation | No | No | No | Yes — per-community nickname (unique differentiator) |
| Member system (group) | Yes | No | Yes | Yes — group/solo with per-member follow |
| Admin/moderation | Enterprise-grade | Creator-only tools | Basic | Next.js admin dashboard with moderation queue |
| Onboarding curation | Artist recommendation on signup | None | None | Spotify-style creator picker (first-time only) |
| Highlight tab | Notice + Highlights tabs | N/A | N/A | Combined digest: notice → calendar → artist posts → fan posts → profiles |

---

## Sources

- [Weverse 2025 Fandom Trend Report (KPOPPOST)](https://kpoppost.com/weverses-2025-fandom-trend-report/) — 12M MAU, 263 min/month avg session, translation as retention factor
- [Music Business Worldwide — Weverse 12M MAU](https://www.musicbusinessworldwide.com/hybe-says-weverse-hit-12m-monthly-users-last-year-and-that-its-turning-casual-fans-into-superfans/) — Superfan conversion mechanics
- [Weverse Livestream 1B views (Music Ally)](https://musically.com/2026/02/06/weverse-livestreams-generated-more-than-1bn-views-in-2025/) — LIVE feature scale context
- [Hollywood Reporter — Bubble DM app](https://www.hollywoodreporter.com/business/digital/kpop-fan-communication-texting-app-1236389307/) — DM as core revenue driver
- [V LIVE Wikipedia](https://en.wikipedia.org/wiki/V_Live) — Feature set and shutdown context
- [BL Industry Growth 2024-25 (DramaLlama)](https://www.dramallama.app/post/bl-industry-growth-how-the-fandom-exploded-in-2024-25) — BL market size and growth
- [Thai GL Rise (Kevin's Digital Basement)](https://kevinsdigitalbasement.wordpress.com/2025/11/02/the-rise-of-thai-gl-from-niche-fandom-to-global-phenomenon/) — GL market context
- [Weverse New Feature: Following Tab (May 2025)](https://weverse.io/notice/27012) — Following tab update
- [Platform Fandom: Weverse (SAGE Journals)](https://journals.sagepub.com/doi/10.1177/20563051251326689) — Academic analysis of Weverse platform mechanics
- Wecord PRD.md (F-01 through F-28 specifications, competitive analysis references)
- Wecord PROJECT.md (target markets, personas, constraints, out-of-scope decisions)

---
*Feature research for: BL/GL fan community platform (Wecord)*
*Researched: 2026-03-18*

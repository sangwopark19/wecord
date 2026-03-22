# Roadmap: Wecord

## Overview

Wecord is built in 7 phases following a strict dependency chain: the foundation and data model must be correct before any user-facing code is written, because RLS policies and the dual-account persona schema are expensive to retrofit. Auth and onboarding follow, then community join (the identity token for all content), then the core content loop (the product's reason to exist), then engagement features (highlights, notices, notifications, translation), then discovery and social features (home feed, search, community following), then safety infrastructure and the admin dashboard, and finally launch polish (more tab, shop, DM placeholder). The admin dashboard is ready before any public user acquisition begins.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Monorepo, Supabase project, full schema with RLS, i18n scaffold, and CI/CD (completed 2026-03-18)
- [x] **Phase 2: Auth & Onboarding** - Google/Apple OAuth, global profile, dual-account identity, and creator curation flow (completed 2026-03-18)
- [x] **Phase 3: Community & Core Content** - Community join with per-community persona, fan/creator feeds, comments, and likes (completed 2026-03-20)
- [x] **Phase 4: Highlights, Notices, Notifications & Translation** - Highlight tab, notice system, async push notifications, and in-app translation (completed 2026-03-20)
- [x] **Phase 5: Home Feed, Search & Community Social** - Cross-community home feed, full-text search, community following, and community profiles (completed 2026-03-22)
- [ ] **Phase 6: Safety & Admin Dashboard** - Content moderation, reporting, sanctions, and full admin operations dashboard
- [ ] **Phase 7: Launch Polish** - More/account hub tab, Shop WebView, DM placeholder, App Store readiness

## Phase Details

### Phase 1: Foundation
**Goal**: The project infrastructure is fully operational — monorepo builds, database schema is complete with RLS, and both apps initialize without errors
**Depends on**: Nothing (first phase)
**Requirements**: FOUN-01, FOUN-02, FOUN-03, FOUN-04, FOUN-05, FOUN-06, FOUN-07, FOUN-08, FOUN-09
**Success Criteria** (what must be TRUE):
  1. `pnpm dev` starts both mobile and admin apps without errors from the monorepo root
  2. Drizzle schema covers all core tables (profiles, communities, community_members, posts, comments, likes, notifications, post_translations, reports) and migrations apply cleanly to Supabase
  3. RLS policies use the `(select auth.uid())` pattern on all tables and block unauthenticated access
  4. Both apps display correctly with the dark theme (background #000000, Teal #00E5C3 accent) and i18n strings load in all 5 languages
  5. EAS Build project is registered and a CI pipeline runs on push
**Plans:** 4/4 plans complete

Plans:
- [x] 01-01-PLAN.md — Turborepo + pnpm monorepo scaffolding with workspace packages, shared tooling, and test infrastructure
- [ ] 01-02-PLAN.md — Supabase local init, Drizzle schema for all 14 MVP tables with RLS, migration
- [ ] 01-03-PLAN.md — Expo SDK 55 + Nativewind v4 dark theme, i18n scaffold (5 languages, 2 namespaces)
- [ ] 01-04-PLAN.md — Next.js admin + @opennextjs/cloudflare, shadcn/ui dark theme, EAS Build, GitHub Actions CI

### Phase 2: Auth & Onboarding
**Goal**: Users can create an account, set their global identity, and arrive at the app with context — not a blank screen
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, AUTH-09
**Success Criteria** (what must be TRUE):
  1. User can sign up and log in via Google OAuth on iOS, Android, and Web
  2. User can sign up and log in via Apple OAuth on iOS
  3. After signing up, user completes the onboarding flow: ToS acceptance, date of birth, language preference, and Spotify-style creator curation (skippable)
  4. User's session persists across app restarts (SecureStore token) and the global profile (nickname, avatar, bio) is editable
  5. Post and comment schema has content_rating column; profiles schema has date_of_birth column
**Plans:** 2/2 plans complete

Plans:
- [x] 02-01-PLAN.md — Supabase client + SecureStore adapter, authStore (Zustand), TanStack Query setup, Google/Apple OAuth login screen, generate-nickname Edge Function, auth guard routing
- [ ] 02-02-PLAN.md — Onboarding flow: ToS acceptance, date of birth with age gate, language picker, Spotify-style creator curation with auto-join, onboarding completion

### Phase 3: Community & Core Content
**Goal**: Users can discover and join communities with a per-community persona, then post, react, and engage within those communities
**Depends on**: Phase 2
**Requirements**: COMM-01, COMM-02, COMM-03, COMM-04, COMM-05, COMM-06, COMM-07, MEMB-01, MEMB-02, MEMB-03, MEMB-04, FANF-01, FANF-02, FANF-03, FANF-04, FANF-05, FANF-06, FANF-07, FANF-08, CREF-01, CREF-02, CREF-03, CREF-04, INTC-01, INTC-02, INTC-03, INTC-04, INTC-05, INTC-06
**Success Criteria** (what must be TRUE):
  1. User can search communities by keyword, preview a community, and join it — their display name in that community is their community nickname (never their global profile name)
  2. User can create a text + image/video post in a joined community using the FAB button; the post appears in the fan feed with their community nickname
  3. Fan feed renders with FlashList infinite scroll (cursor-based pagination), sortable by latest/popular and filterable by all/following/hot
  4. Creator posts appear in the Creator tab visually distinct from fan posts; group communities display an artist member list with per-member post filtering
  5. Users can comment (1-depth replies), like posts and comments with real-time toggle counts; creator replies are visually highlighted
**Plans:** 5/5 plans complete

Plans:
- [ ] 03-01-PLAN.md — Package installs, DB triggers + storage bucket, i18n, community discovery (search, preview, join, leave, nickname), 3-tab community main shell
- [ ] 03-02-PLAN.md — Fan feed (FlashList + useInfiniteQuery + cursor pagination), post creation with image/video upload to Supabase Storage, FAB, sort/filter, post detail
- [ ] 03-03-PLAN.md — Creator feed (RLS-enforced creator posts, visual distinction), artist member system (member list, per-member post filter, member follow)
- [ ] 03-04-PLAN.md — Comments (1-depth replies, community nickname display), likes (optimistic toggle, spring animation), creator reply highlight, delete own comments

### Phase 4: Highlights, Notices, Notifications & Translation
**Goal**: Users stay informed through the Highlight tab, admin-published notices, push notifications, and can read content in their preferred language
**Depends on**: Phase 3
**Requirements**: HIGH-01, HIGH-02, HIGH-03, HIGH-04, HIGH-05, NOTC-01, NOTC-02, NOTC-03, NOTC-04, NOTC-05, NOTF-01, NOTF-02, NOTF-03, NOTF-04, NOTF-05, NOTF-06, NOTF-07, NOTF-08, TRAN-01, TRAN-02, TRAN-03, TRAN-04, TRAN-05
**Success Criteria** (what must be TRUE):
  1. Highlight tab displays 5 sections in order: pinned notices, calendar placeholder, recent creator posts, recent fan posts, artist member profiles — loaded in a single Edge Function call
  2. Admin can create, pin, and schedule a notice per community; notice publication sends a push notification to community members
  3. User receives push notification for creator posts, comments on own posts, liked posts, followed member posts, and notices — all via async pgmq fan-out (post creation is not blocked)
  4. Unread notification badge on the bell icon updates in real-time via Supabase Realtime
  5. User can tap a translate button on any post or comment to see the translated text in their preferred language; results are cached (post_translations table) and the user can toggle between original and translated
**Plans:** 6/6 plans complete

Plans:
- [x] 04-00-PLAN.md — Wave 0: test stub files for Phase 4 hooks (Nyquist compliance) (completed 2026-03-21)
- [ ] 04-01-PLAN.md — DB migration (push_tokens, notifications.community_id), Supabase extensions (pgmq/pg_cron/pg_net), highlight Edge Function, Highlight tab UI (5 sections), i18n namespaces (highlight/notification/notice/translation)
- [ ] 04-02-PLAN.md — Admin notice CRUD (Next.js + shadcn), mobile notice list/detail screens, pg_cron scheduled publishing, pgmq async fan-out notice-publish trigger
- [ ] 04-03-PLAN.md — notify Edge Function (Expo Push API fan-out), pgmq-based DB triggers (creator post/comment/like), push token registration, notification list/preferences screens, bell badge with Realtime (NOTF-08)
- [ ] 04-04-PLAN.md — translate Edge Function (cache-first: DB -> Google Translate API -> DB), TranslateButton/TranslatedTextBlock components, wire into PostCard/CommentRow/ReplyRow

### Phase 5: Home Feed, Search & Community Social
**Goal**: Returning users see a unified cross-community feed; new users see curated recommendations; users can find content and connect with other members within communities
**Depends on**: Phase 4
**Requirements**: HOME-01, HOME-02, HOME-03, HOME-04, HOME-05, SRCH-01, SRCH-02, SRCH-03, FLLW-01, FLLW-02, FLLW-03, FLLW-04
**Success Criteria** (what must be TRUE):
  1. User with 0 joined communities sees a creator recommendation section on the home screen; user with 1+ communities sees a unified infinite-scroll feed of posts from all joined communities
  2. Each post in the unified home feed shows a community shortcut link; the home header shows the Wecord logo and notification bell with badge
  3. Home screen shows an admin-managed promotion banner carousel
  4. User can search for communities/creators from the home discovery entry point, and search for posts within a community using full-text search with keyword highlighting
  5. User can follow/unfollow other members within the same community (RLS-enforced), view follower/following lists, and visit a community profile page showing nickname, post count, and follower count
**Plans:** 4 plans (3 complete + 1 gap closure)

Plans:
- [x] 05-00-PLAN.md — Wave 0: DB migrations (promotion_banners + follow count trigger), test stubs, i18n home namespace
- [x] 05-01-PLAN.md — home-feed Edge Function (cross-community cursor-paginated merge); Home tab (0-community recommendation view + 1+-community unified feed, notification bell badge, promotion banner carousel)
- [x] 05-02-PLAN.md — Search screens (in-community post full-text search with keyword highlighting); community following (follow/unfollow RLS-enforced, follower/following lists, community profile page)
- [x] 05-03-PLAN.md — Gap closure: community profile comments tab (query comments_with_nickname, render member comment list)

### Phase 6: Safety & Admin Dashboard
**Goal**: The platform has working content moderation before any public launch, and the admin has a complete operational dashboard to manage communities, creators, reports, and notices
**Depends on**: Phase 5
**Requirements**: SAFE-01, SAFE-02, SAFE-03, SAFE-04, SAFE-05, SAFE-06, ADMN-01, ADMN-02, ADMN-03, ADMN-04, ADMN-05, ADMN-06, ADMN-07, ADMN-08, ADMN-09, ADMN-10, ADMN-11
**Success Criteria** (what must be TRUE):
  1. User can report a post or comment with a reason (hate/spam/violence/copyright/other); duplicate reports are prevented; user receives confirmation feedback
  2. New posts and comments are screened asynchronously by the `moderate` Edge Function (banned word filter + OpenAI Moderation API) without blocking post creation
  3. Spam rate limiting is enforced: more than 5 posts per minute results in a 1-hour temporary block
  4. Admin can view the report queue sorted by report count, preview reported content, and apply graduated sanctions (warning → 7d ban → 30d ban → permanent ban) with full sanction history
  5. Admin can create/edit/delete communities and creator accounts, register artist members, view member statistics, manage promotion banners, manage notices, and view the analytics dashboard (DAU/WAU/MAU, posts/comments per community, new signups)
**Plans:** 5/7 plans executed

Plans:
- [x] 06-01-PLAN.md — DB migration (soft delete, banned_words, analytics functions), i18n report namespace, mobile report hook (TDD)
- [x] 06-02-PLAN.md — Report bottom sheet UI + wire into PostCard/CommentRow/ReplyRow/PostDetailScreen
- [x] 06-03-PLAN.md — Admin login page (Google OAuth + role check), sidebar layout (8 menus), dashboard home (stat cards), notices migration into sidebar layout
- [x] 06-04-PLAN.md — moderate Edge Function (banned words + OpenAI Moderation API + spam rate limit), wire into post/comment creation hooks (async fire-and-forget)
- [x] 06-05-PLAN.md — Admin moderation page (report queue table + side panel with content preview, graduated sanctions, sanction history, content soft-delete)
- [x] 06-06-PLAN.md — Admin CRUD pages: communities, creators, members (with artist member registration), promotion banners
- [x] 06-07-PLAN.md — Analytics dashboard (recharts line charts, stat cards, 7d/30d/90d presets, top 10 communities table)

### Phase 7: Launch Polish
**Goal**: All remaining user-facing surfaces are complete and the app is ready for App Store and Play Store submission
**Depends on**: Phase 6
**Requirements**: SHOP-01, SHOP-02, DMPL-01, DMPL-02, MORE-01, MORE-02, MORE-03, MORE-04, MORE-05
**Success Criteria** (what must be TRUE):
  1. User can navigate the More tab to edit their global profile (nickname, avatar, bio), change language setting, view joined communities list, access app settings (language, notifications), and log out
  2. Shop tab loads x-square.kr in an in-app WebView with working back and refresh navigation controls
  3. DM tab shows a "Coming Soon" placeholder with a "Notify Me" button that saves the user's notification preference
  4. App is submitted to App Store and Play Store with 17+ content rating, live privacy policy URL, and Apple OAuth requirements met
**Plans**: TBD

Plans:
- [ ] 07-01: More tab (global profile edit, language setting, joined communities list, notification prefs, logout)
- [ ] 07-02: Shop tab WebView (x-square.kr, back/refresh), DM placeholder screen (coming soon + notify me), App Store/Play Store submission checklist (17+ rating, privacy policy URL, Apple OAuth audit)

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 4/4 | Complete   | 2026-03-18 |
| 2. Auth & Onboarding | 2/2 | Complete   | 2026-03-18 |
| 3. Community & Core Content | 5/5 | Complete   | 2026-03-20 |
| 4. Highlights, Notices, Notifications & Translation | 6/6 | Complete   | 2026-03-21 |
| 5. Home Feed, Search & Community Social | 3/4 | Gap closure | 2026-03-22 |
| 6. Safety & Admin Dashboard | 5/7 | In Progress|  |
| 7. Launch Polish | 0/2 | Not started | - |

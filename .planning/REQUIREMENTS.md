# Requirements: Wecord

**Defined:** 2026-03-18
**Core Value:** BL·GL 크리에이터와 팬이 언어 장벽 없이 소통할 수 있는 전용 커뮤니티 공간 (커뮤니티별 페르소나 분리 + 자동번역)

## v1 Requirements

Requirements for MVP release. Each maps to roadmap phases.

### Foundation

- [x] **FOUN-01**: Turborepo 모노레포 구조 셋업 (apps/mobile, apps/admin, packages/db, packages/supabase, packages/shared)
- [x] **FOUN-02**: Supabase 프로젝트 초기화 (Auth, Storage, Realtime, Edge Functions)
- [x] **FOUN-03**: Drizzle ORM 스키마 정의 및 초기 마이그레이션 (핵심 테이블 전체)
- [x] **FOUN-04**: RLS 정책 기본 구조 설정 (`(select auth.uid())` 패턴 적용)
- [x] **FOUN-05**: Expo SDK 55 프로젝트 초기화 (New Architecture, expo-router v7)
- [x] **FOUN-06**: Nativewind v4 + 다크 테마 디자인 시스템 설정
- [x] **FOUN-07**: Next.js 관리자 앱 초기화 (@opennextjs/cloudflare 배포 설정)
- [x] **FOUN-08**: i18n 인프라 설정 (expo-localization + i18next, 5개 언어 KO/EN/TH/ZH-CN/JA)
- [x] **FOUN-09**: EAS Build/Update 프로젝트 등록 및 CI/CD 기본 설정

### Authentication & Onboarding

- [x] **AUTH-01**: User can sign up/login via Google OAuth
- [x] **AUTH-02**: User can sign up/login via Apple OAuth
- [x] **AUTH-03**: User can set global profile (nickname, avatar, bio, language)
- [x] **AUTH-04**: User session persists across app restart (SecureStore token)
- [x] **AUTH-05**: User sees Terms of Service / Privacy Policy agreement flow on first signup
- [x] **AUTH-06**: User sees Spotify-style creator curation on first signup (random, skippable)
- [x] **AUTH-07**: User can set preferred language (KO/EN/TH/ZH-CN/JA) during onboarding
- [x] **AUTH-08**: User provides date of birth for age verification (앱스토어 심사 대비)
- [x] **AUTH-09**: Content rating field on posts (content_rating column for age-gated content)

### Community

- [ ] **COMM-01**: User can search communities by creator name/keyword (pg_textsearch)
- [ ] **COMM-02**: User can view community preview (description, member count, recent activity)
- [ ] **COMM-03**: User can join community with per-community nickname (random code-nick auto-fill)
- [ ] **COMM-04**: User can modify community nickname after joining
- [ ] **COMM-05**: User can join multiple communities simultaneously
- [ ] **COMM-06**: User can leave a community
- [ ] **COMM-07**: Community supports solo and group types

### Artist Members

- [ ] **MEMB-01**: Group community displays artist member list with profiles
- [ ] **MEMB-02**: User can view individual artist member's posts (filtered view)
- [ ] **MEMB-03**: User can follow specific artist members within a community
- [ ] **MEMB-04**: User receives push notification for followed member's posts

### Fan Feed

- [ ] **FANF-01**: User can create text post in joined community (displayed with community nickname)
- [ ] **FANF-02**: User can attach up to 10 images to a post
- [ ] **FANF-03**: User can attach 1 video to a post
- [ ] **FANF-04**: User can view fan feed with infinite scroll (cursor-based pagination)
- [ ] **FANF-05**: User can sort fan feed by latest/popular
- [ ] **FANF-06**: User can filter fan feed by "all", "following", "hot"
- [ ] **FANF-07**: User can delete own posts
- [ ] **FANF-08**: Post creation via floating "+" FAB button on community page

### Creator Feed

- [ ] **CREF-01**: Creator can post text/image/video in Creator tab (RLS enforced)
- [ ] **CREF-02**: User can view Creator tab with creator-only posts
- [ ] **CREF-03**: Creator post triggers push notification to all community members
- [ ] **CREF-04**: Creator posts are visually distinguished from fan posts

### Comments & Likes

- [ ] **INTC-01**: User can comment on posts (displayed with community nickname)
- [ ] **INTC-02**: User can reply to comments (1 depth nested)
- [ ] **INTC-03**: Creator replies are visually highlighted
- [ ] **INTC-04**: User can like posts (toggle, real-time count)
- [ ] **INTC-05**: User can like comments (toggle, real-time count)
- [ ] **INTC-06**: User can delete own comments

### Translation

- [ ] **TRAN-01**: User can tap translate button on any post to see translation in preferred language
- [ ] **TRAN-02**: User can tap translate button on any comment to see translation
- [ ] **TRAN-03**: User can toggle between original and translated text
- [ ] **TRAN-04**: Translation results are cached in DB (post_translations table)
- [ ] **TRAN-05**: App UI displays in user's preferred language (5 languages)

### Notifications

- [ ] **NOTF-01**: User receives push notification for creator posts (async fan-out via pgmq)
- [ ] **NOTF-02**: User receives push notification for comments on own posts
- [ ] **NOTF-03**: User receives push notification for likes on own posts
- [ ] **NOTF-04**: User receives push notification for notice/announcements
- [ ] **NOTF-05**: User receives push notification for followed member posts
- [ ] **NOTF-06**: User can configure notification preferences per community
- [ ] **NOTF-07**: User can configure notification preferences per category (creator post/comment/notice)
- [ ] **NOTF-08**: Unread notification badge updates in real-time (Supabase Realtime)

### Home Feed

- [ ] **HOME-01**: User with 0 communities sees creator recommendation section (random, with profiles and members)
- [ ] **HOME-02**: User with 1+ communities sees unified feed (Instagram-style infinite scroll)
- [ ] **HOME-03**: Each post in unified feed shows community shortcut link
- [ ] **HOME-04**: Home header shows Wecord logo + notification bell with badge
- [ ] **HOME-05**: Home shows promotion banner carousel (admin-managed)

### Highlight Tab

- [ ] **HIGH-01**: Highlight tab shows notices section at top
- [ ] **HIGH-02**: Highlight tab shows calendar section below notices
- [ ] **HIGH-03**: Highlight tab shows recent creator posts section
- [ ] **HIGH-04**: Highlight tab shows recent fan posts section
- [ ] **HIGH-05**: Highlight tab shows artist member profiles section at bottom

### Notices

- [ ] **NOTC-01**: Admin can create notice (title, body, images) per community
- [ ] **NOTC-02**: Admin can pin notices
- [ ] **NOTC-03**: Admin can schedule notice publication (pg_cron)
- [ ] **NOTC-04**: Notice publication triggers push notification to community members
- [ ] **NOTC-05**: User can view notice list and detail within community

### Search

- [ ] **SRCH-01**: User can search communities/creators from home [+] banner
- [ ] **SRCH-02**: User can search posts within a community (full-text search)
- [ ] **SRCH-03**: Search results display with keyword highlighting

### Community Following & Profile

- [ ] **FLLW-01**: User can follow/unfollow other members within same community
- [ ] **FLLW-02**: User can view follower/following list
- [ ] **FLLW-03**: User can view community profile page (nickname, posts, comments, follower count)
- [ ] **FLLW-04**: Following is restricted to same community members only (RLS enforced)

### Reporting & Safety

- [ ] **SAFE-01**: User can report posts/comments (reason: hate/spam/violence/copyright/other)
- [ ] **SAFE-02**: Duplicate report prevention (UNIQUE constraint)
- [ ] **SAFE-03**: Report confirmation feedback to user
- [ ] **SAFE-04**: Content auto-moderation via OpenAI Moderation API on post/comment creation
- [ ] **SAFE-05**: Banned word filter (PostgreSQL matching)
- [ ] **SAFE-06**: Spam prevention (5 posts/min rate limit → 1hr temp block)

### Shop & DM Placeholder

- [ ] **SHOP-01**: Shop tab displays x-square.kr in WebView
- [ ] **SHOP-02**: In-app WebView navigation (back, refresh)
- [ ] **DMPL-01**: DM tab shows "Coming Soon" placeholder screen
- [ ] **DMPL-02**: DM tab has "Notify Me" button (saves to notification_preferences)

### More Tab (Account Hub)

- [ ] **MORE-01**: User can edit global profile (nickname, avatar, bio)
- [ ] **MORE-02**: User can change language setting
- [ ] **MORE-03**: User can view list of joined communities
- [ ] **MORE-04**: User can access app settings (language, notifications)
- [ ] **MORE-05**: User can log out

### Admin Dashboard

- [ ] **ADMN-01**: Admin can create/edit/delete communities (solo/group type)
- [ ] **ADMN-02**: Admin can create/manage creator accounts
- [ ] **ADMN-03**: Admin can register/manage artist members per community
- [ ] **ADMN-04**: Admin can view community member list and statistics
- [ ] **ADMN-05**: Admin can view report queue (sorted by count)
- [ ] **ADMN-06**: Admin can preview reported content and take action (delete/warn/ban)
- [ ] **ADMN-07**: Admin can apply graduated sanctions (warning → 7d ban → 30d ban → permanent)
- [ ] **ADMN-08**: Admin can view sanction history and handle appeals
- [ ] **ADMN-09**: Admin can view basic analytics dashboard (DAU/WAU/MAU, posts/comments per community, new signups)
- [ ] **ADMN-10**: Admin can create/edit/delete promotion banners for home carousel
- [ ] **ADMN-11**: Admin can create/manage notices per community

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Monetization (v1.1)

- **DM-01**: Creator-fan 1:1 private messaging (1:N broadcast)
- **JELLY-01**: Jelly digital currency system (charge, spend, balance)
- **MBRS-01**: Creator membership (official/digital, Jelly subscription)
- **MEDIA-01**: VOD content (free/premium/membership, HLS streaming)
- **FNLT-01**: Fan letter with templates/stickers
- **CLDR-01**: Creator event calendar
- **COLL-01**: Collection & badge system (missions, achievements)

### Ecosystem (v2.0)

- **LIVE-01**: Live streaming with real-time chat and hearts
- **SHPC-01**: Full commerce (product browsing, cart, payment, order tracking)
- **LSTN-01**: Listening party (streaming service integration)
- **EVNT-01**: Online concerts/fan meetings
- **EXTN-01**: Sub-culture expansion (web novel, webtoon, cosplay categories)

### Deferred Features

- **MOME-01**: Moments (Instagram Stories-like feature)
- **THME-01**: Per-community custom theme color
- **OAUT-01**: Additional OAuth providers (Kakao, Twitter)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time chat (1:1 or group) | High complexity, requires Jelly payment system (v1.1) |
| Video transcoding/HLS | Requires Mux integration, v1.1 VOD scope |
| In-app purchase / payment | No monetization in MVP — community value validation first |
| Moments / Stories | Implementation complexity too high for MVP |
| Per-community theme colors | MVP uses fixed Teal accent — reduces design complexity |
| Email/password authentication | Social OAuth sufficient for target demographic |
| Native-only features (NFC, etc.) | Expo Universal covers all needed capabilities |
| Recommendation algorithm | Simple random/latest sufficient for MVP scale |
| Real-time typing indicators | Not needed for feed-based community |
| Direct image editing/filters | Rely on device camera app for editing |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUN-01~09 | Phase 1: Foundation | Pending |
| AUTH-01~09 | Phase 2: Auth & Onboarding | Pending |
| COMM-01~07 | Phase 3: Community & Core Content | Pending |
| MEMB-01~04 | Phase 3: Community & Core Content | Pending |
| FANF-01~08 | Phase 3: Community & Core Content | Pending |
| CREF-01~04 | Phase 3: Community & Core Content | Pending |
| INTC-01~06 | Phase 3: Community & Core Content | Pending |
| HIGH-01~05 | Phase 4: Highlights, Notices, Notifications & Translation | Pending |
| NOTC-01~05 | Phase 4: Highlights, Notices, Notifications & Translation | Pending |
| NOTF-01~08 | Phase 4: Highlights, Notices, Notifications & Translation | Pending |
| TRAN-01~05 | Phase 4: Highlights, Notices, Notifications & Translation | Pending |
| HOME-01~05 | Phase 5: Home Feed, Search & Community Social | Pending |
| SRCH-01~03 | Phase 5: Home Feed, Search & Community Social | Pending |
| FLLW-01~04 | Phase 5: Home Feed, Search & Community Social | Pending |
| SAFE-01~06 | Phase 6: Safety & Admin Dashboard | Pending |
| ADMN-01~11 | Phase 6: Safety & Admin Dashboard | Pending |
| SHOP-01~02 | Phase 7: Launch Polish | Pending |
| DMPL-01~02 | Phase 7: Launch Polish | Pending |
| MORE-01~05 | Phase 7: Launch Polish | Pending |

**Coverage:**
- v1 requirements: 95 total
- Mapped to phases: 95
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 — traceability updated to 7-phase roadmap*

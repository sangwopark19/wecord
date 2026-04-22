---
phase: 05-home-feed-search-community-social
verified: 2026-03-22T06:45:00Z
status: passed
score: 12/12 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 11/12
  gaps_closed:
    - "FLLW-03: Community profile comments tab now queries member comment history from comments_with_nickname view, renders FlatList with content + date, shows empty state with i18n key, and navigates to post detail on tap"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Open a community with posts, tap a user avatar/nickname on a PostCard"
    expected: "Navigates to community profile screen showing that member's avatar, nickname, post count, follower count, following count, and a list of their posts"
    why_human: "Cannot verify navigation trigger and screen render without running the app"
  - test: "From a community profile screen, tap the Comments tab"
    expected: "Shows a list of that member's comments (each with content preview up to 3 lines and date); tapping a comment navigates to the source post detail screen"
    why_human: "Requires live DB data with actual community_members rows and comments_with_nickname view populated"
  - test: "From a community profile screen, tap the follower count"
    expected: "Navigates to follower list screen with member rows and FollowButton per row"
    why_human: "Cannot verify nested screen navigation programmatically"
  - test: "From a community profile screen, tap Follow button, then tap it again (now shows Following)"
    expected: "Unfollow confirmation dialog appears with correct i18n text; confirming removes the follow; follower count updates"
    why_human: "Alert.alert dialog flow and count invalidation require live app"
  - test: "On the Home tab with 0 communities joined"
    expected: "Sees search bar at top, promotion banner carousel below, 2-column creator recommendation grid below banner"
    why_human: "Conditional view toggle (isNewUser) requires live user state"
  - test: "Tap search icon in fan/artist tab header"
    expected: "Post search screen opens with autofocused TextInput; typing a keyword shows matching posts with Teal keyword highlighting"
    why_human: "Full-text search and highlight rendering require running app and real DB data"
---

# Phase 5: Home Feed, Search & Community Social — Verification Report

**Phase Goal:** Returning users see a unified cross-community feed; new users see curated recommendations; users can find content and connect with other members within communities
**Verified:** 2026-03-22T06:45:00Z
**Status:** passed
**Re-verification:** Yes — after gap closure (Plan 05-03 closed FLLW-03 comments tab stub)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | promotion_banners table exists with RLS allowing authenticated reads | VERIFIED | `20260322000000_phase5_promotion_banners.sql` — CREATE TABLE + `banners_select_authenticated` policy + `idx_banners_active_order` index |
| 2 | Follow/unfollow auto-updates follower_count/following_count via DB trigger | VERIFIED | `20260322000001_phase5_follow_count_trigger.sql` — `update_follow_counts()` AFTER INSERT/DELETE on community_follows, GREATEST guard |
| 3 | Test stubs for Phase 5 hooks exist | VERIFIED | 4 test files found with `it.todo` counts: useHomeFeed(4), usePromotionBanners(2), usePostSearch(6), useCommunityProfile(4) |
| 4 | All Phase 5 i18n keys exist in all 5 languages | VERIFIED | home.json in ko/en/ja/zh/th with `recommendation.heading`; community.json has `postSearch`, `profile.*`, and `profile.comments.empty` keys in all 5 locales; `home` namespace registered in i18n/index.ts |
| 5 | User with 0 communities sees creator recommendation grid with search bar and promotion banner | VERIFIED | `(tabs)/index.tsx` — `isNewUser` branch renders HomeSearchBar + PromotionBannerCarousel + RecommendationSection (numColumns=2 CommunityCard grid) |
| 6 | User with 1+ communities sees unified cross-community feed with community chips on each post | VERIFIED | `(tabs)/index.tsx` — FlashList branch using `useHomeFeed()` with `showCommunityChip` on PostCard; Edge Function queries `posts_with_nickname` via `in('community_id', communityIds)` |
| 7 | Home header shows Wecord logo and notification bell with all-communities unread badge | VERIFIED | index.tsx: "Wecord" text; `useAllUnreadNotificationCount` imported and used; hook queries notifications without community_id filter |
| 8 | Promotion banner carousel auto-scrolls every 3 seconds with dot indicator | VERIFIED | `PromotionBannerCarousel.tsx` — `setInterval(3000)`, `clearInterval` on unmount, `pagingEnabled` FlatList, `onScrollBeginDrag` pauses, dot indicator behind `banners.length > 1` guard |
| 9 | User can search posts within a community by keyword using full-text search | VERIFIED | `usePostSearch.ts` — `textSearch('content', debouncedQuery, { type: 'websearch', config: 'simple' })` on `posts_with_nickname`, 300ms debounce |
| 10 | Search results show keyword highlighted in Teal (#00E5C3) | VERIFIED | `HighlightedText.tsx` — splits on regex, compares by `toLowerCase()`, applies `highlightColor = '#00E5C3'`; `PostCard` renders via `highlightQuery` prop; `post-search.tsx` passes `debouncedQuery` as `highlightQuery` |
| 11 | User can follow/unfollow another member; follow is restricted to same community (RLS) | VERIFIED | `useFollowMember.ts` — INSERT/DELETE on `community_follows`; `community_follows_insert_own` policy enforces `cm1.community_id = cm2.community_id` via JOIN; `FollowButton.tsx` calls mutation with `Alert.alert` confirmation |
| 12 | Community profile shows nickname, post count, follower/following counts, posts tab, and comments tab with real comment data | VERIFIED | Profile screen shows nickname, follower_count, following_count, post count, posts tab (FlashList of PostCard). Comments tab: `useMemberComments` hook queries `comments_with_nickname` filtered by `author_cm_id`, renders FlatList with content + date, empty state via `t('profile.comments.empty')`, tap navigates to post detail |

**Score:** 12/12 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/supabase/migrations/20260322000000_phase5_promotion_banners.sql` | promotion_banners table + RLS + index | VERIFIED | CREATE TABLE, banners_select_authenticated, idx_banners_active_order all present |
| `packages/supabase/migrations/20260322000001_phase5_follow_count_trigger.sql` | Trigger to auto-update follow counts | VERIFIED | update_follow_counts() AFTER INSERT OR DELETE, GREATEST guard |
| `apps/mobile/tests/useHomeFeed.test.ts` | Test stubs for HOME-01, HOME-02 | VERIFIED | 4 × it.todo entries |
| `packages/shared/src/i18n/locales/ko/home.json` | Korean i18n keys for home namespace | VERIFIED | Contains `recommendation.heading` |
| `packages/supabase/functions/home-feed/index.ts` | Cross-community feed merge Edge Function | VERIFIED | Deno.serve, posts_with_nickname, in('community_id', communityIds), compound cursor |
| `apps/mobile/app/(tabs)/index.tsx` | Home tab screen — conditional 0 vs 1+ community | VERIFIED | isNewUser branch and FlashList branch both present |
| `apps/mobile/components/home/PromotionBannerCarousel.tsx` | Auto-scroll banner carousel with dot indicator | VERIFIED | setInterval(3000), clearInterval, pagingEnabled, onScrollBeginDrag |
| `apps/mobile/components/home/CommunityChip.tsx` | Community source chip | VERIFIED | border-teal, communityName, router.push to /(community)/[id] |
| `apps/mobile/hooks/home/useHomeFeed.ts` | Cross-community feed with useInfiniteQuery | VERIFIED | useInfiniteQuery, functions.invoke('home-feed'), useMyMemberships export |
| `apps/mobile/app/(community)/[id]/post-search.tsx` | In-community post search screen | VERIFIED | usePostSearch, highlightQuery on PostCard, postSearch.placeholder, postSearch.empty |
| `apps/mobile/components/search/HighlightedText.tsx` | Keyword highlight component | VERIFIED | #00E5C3, split(regex), toLowerCase comparison |
| `apps/mobile/app/(community)/[id]/profile/[memberId].tsx` | Community profile screen | VERIFIED | useCommunityProfile, FollowButton, follower_count wired; comments tab now fully implemented with FlatList from useMemberComments — gap closed in Plan 05-03 |
| `apps/mobile/components/community/FollowButton.tsx` | Follow/Unfollow toggle button | VERIFIED | useFollowMember, bg-teal, Alert.alert, unfollowConfirm i18n keys, accessibilityState |
| `apps/mobile/hooks/community/useFollowMember.ts` | Follow/unfollow mutation | VERIFIED | community_follows INSERT/DELETE, useMutation, useIsFollowing export |
| `apps/mobile/hooks/search/usePostSearch.ts` | Debounced full-text search hook | VERIFIED | textSearch, websearch, debouncedQuery, setTimeout 300ms |
| `apps/mobile/hooks/community/useCommunityProfile.ts` | useMemberComments hook (gap closure) | VERIFIED | Exports MemberComment interface and useMemberComments querying comments_with_nickname filtered by author_cm_id, limit 50, ordered newest-first |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `(tabs)/index.tsx` | `hooks/home/useHomeFeed.ts` | useHomeFeed hook call | WIRED | import + usage at line 7, 75 |
| `hooks/home/useHomeFeed.ts` | `functions/home-feed/index.ts` | supabase.functions.invoke('home-feed') | WIRED | `functions.invoke('home-feed', ...)` |
| `(tabs)/index.tsx` | `components/home/PromotionBannerCarousel.tsx` | import and render | WIRED | import at line 10, render at lines 105, 128 |
| `components/post/PostCard.tsx` | `components/home/CommunityChip.tsx` | showCommunityChip conditional | WIRED | import at line 12, conditional render lines 59-63 |
| `app/(community)/[id]/post-search.tsx` | `hooks/search/usePostSearch.ts` | usePostSearch hook | WIRED | import at line 7, destructured at line 16 |
| `hooks/search/usePostSearch.ts` | `posts_with_nickname` | supabase textSearch query | WIRED | `.from('posts_with_nickname').textSearch('content', ...)` |
| `components/community/FollowButton.tsx` | `hooks/community/useFollowMember.ts` | useFollowMember hook | WIRED | import at line 3, usage at line 15 |
| `hooks/community/useFollowMember.ts` | `community_follows` | supabase insert/delete | WIRED | .from('community_follows') INSERT and DELETE |
| `components/post/PostCard.tsx` | `app/(community)/[id]/profile/[memberId].tsx` | router.push on avatar/nickname tap | WIRED | `router.push(\`/(community)/${cid}/profile/${post.author_cm_id}\`)` |
| `app/(community)/[id]/profile/[memberId].tsx` | `hooks/community/useCommunityProfile.ts` | useMemberComments import (gap closure) | WIRED | line 9: imports useMemberComments and MemberComment; line 43: `useMemberComments(memberId ?? '', id ?? '')` |
| `hooks/community/useCommunityProfile.ts` | `comments_with_nickname` | supabase .from('comments_with_nickname') (gap closure) | WIRED | line 89: `.from('comments_with_nickname').select(...).eq('author_cm_id', memberId)` |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| HOME-01 | 05-00, 05-01 | User with 0 communities sees creator recommendation section | SATISFIED | RecommendationSection with numColumns=2 CommunityCard grid, rendered when isNewUser |
| HOME-02 | 05-00, 05-01 | User with 1+ communities sees unified feed | SATISFIED | FlashList fed from useHomeFeed / home-feed Edge Function; compound cursor pagination |
| HOME-03 | 05-01 | Each post in unified feed shows community shortcut link | SATISFIED | showCommunityChip renders CommunityChip on each PostCard; onPress navigates to community |
| HOME-04 | 05-01 | Home header shows Wecord logo + notification bell with badge | SATISFIED | "Wecord" text + useAllUnreadNotificationCount (all-communities unread, no community_id filter) |
| HOME-05 | 05-00, 05-01 | Home shows promotion banner carousel (admin-managed) | SATISFIED | PromotionBannerCarousel auto-scrolls; usePromotionBanners queries promotion_banners table |
| SRCH-01 | 05-02 | User can search communities/creators from home banner | SATISFIED | HomeSearchBar navigates to /(community)/search (Phase 3 search screen) |
| SRCH-02 | 05-02 | User can search posts within a community (full-text search) | SATISFIED | usePostSearch uses textSearch websearch on posts_with_nickname; post-search.tsx screen |
| SRCH-03 | 05-02 | Search results display with keyword highlighting | SATISFIED | HighlightedText component renders Teal (#00E5C3) matched substrings; wired via highlightQuery prop |
| FLLW-01 | 05-02 | User can follow/unfollow other members within same community | SATISFIED | FollowButton + useFollowMember INSERT/DELETE on community_follows |
| FLLW-02 | 05-02 | User can view follower/following list | SATISFIED | followers.tsx + following.tsx screens using useFollowerList / useFollowingList |
| FLLW-03 | 05-02, 05-03 | User can view community profile (nickname, posts, comments, follower count) | SATISFIED | Nickname, follower_count, following_count, posts tab all present. Comments tab fully implemented: useMemberComments queries comments_with_nickname, FlatList renders content + date, empty state, tap navigates to post (gap closed in Plan 05-03, commits c990ad5 and 4f907b8) |
| FLLW-04 | 05-00, 05-02 | Following is restricted to same community members (RLS) | SATISFIED | community_follows_insert_own policy: JOIN on cm1.community_id = cm2.community_id |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `apps/mobile/components/home/PromotionBannerCarousel.tsx` | 24 | `return null` when no banners | Info | Intentional design — carousel hidden when no active banners. Not a stub |

No blocker or warning severity anti-patterns found. The previously flagged comments tab stub has been fully resolved.

### Human Verification Required

### 1. Home Screen Conditional View

**Test:** Sign in as a user with no community memberships, navigate to the Home tab
**Expected:** Search bar at top, promotion banner carousel, 2-column creator recommendation grid (ordered by member_count DESC)
**Why human:** isNewUser logic requires live user state and Supabase data

### 2. Unified Feed Navigation via CommunityChip

**Test:** As a user in 2+ communities, open the Home tab; tap a CommunityChip on a post
**Expected:** Navigates to the correct community screen
**Why human:** Router navigation with dynamic segment requires a running app

### 3. Promotion Banner Auto-Scroll

**Test:** Insert an active promotion banner in the DB; observe the home carousel
**Expected:** Banner auto-scrolls every 3 seconds; pauses on swipe; dot indicator tracks position
**Why human:** Timer behavior and scroll interaction require a live device/simulator

### 4. In-Community Post Search with Highlighting

**Test:** Open a community with posts; tap the search icon in the fan tab header; type a keyword that matches post content
**Expected:** Results appear within ~300ms after typing stops; matched keyword appears in Teal (#00E5C3) within post content
**Why human:** Full-text search requires real DB data with pg_tsvector; visual highlighting requires rendered UI

### 5. Community Profile Comments Tab

**Test:** Navigate to any community profile; tap the Comments tab
**Expected:** If member has comments — FlatList shows comment content (up to 3 lines) and date per item; tapping an item navigates to the source post detail. If member has no comments — shows localized "No comments yet" empty state
**Why human:** Requires live DB data with actual community_members rows and comments_with_nickname view populated

### 6. Follow Flow

**Test:** Open a community profile (tap avatar on a PostCard); tap Follow; verify count increments; tap Following and confirm unfollow dialog
**Expected:** follower_count increments; Alert dialog appears with "팔로우 취소" title and confirm/dismiss buttons; confirming decrements count
**Why human:** Alert.alert dialog, cache invalidation, and DB trigger require a running app connected to Supabase

## Re-verification Summary

**Gap closed: FLLW-03 comments tab stub**

Plan 05-03 (commits `c990ad5` and `4f907b8`) fully resolved the single gap from the initial verification:

- `apps/mobile/hooks/community/useCommunityProfile.ts` now exports `MemberComment` interface and `useMemberComments` hook querying `comments_with_nickname` filtered by `author_cm_id`, ordered newest-first, limit 50
- `apps/mobile/app/(community)/[id]/profile/[memberId].tsx` imports `useMemberComments` and `MemberComment` at line 9, calls the hook at line 43, and renders a full FlatList with loading/empty/data states in the comments tab (lines 176-207)
- All 5 locale community.json files contain `profile.comments.empty` key under the `profile` object
- `npm run typecheck` exits 0 (all 4 typecheck tasks passing)

No regressions detected in previously verified items.

**All 12 must-haves verified. Phase 05 goal fully achieved.**

---

*Verified: 2026-03-22T06:45:00Z*
*Verifier: Claude (gsd-verifier)*

# Phase 5: Home Feed, Search & Community Social — Research

**Researched:** 2026-03-22
**Domain:** React Native / Expo feed composition, Supabase Edge Functions, PostgreSQL full-text search, follow/unfollow social graph, promotion banners
**Confidence:** HIGH — all findings derived from existing codebase source files, established in-repo patterns, and confirmed architecture docs

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### 홈 피드 — 0-커뮤니티 (추천 화면)
- Weverse 스타일 2열 카드 그리드 — 커버 이미지 + 커뮤니티명 + 멤버 수
- Phase 3 커뮤니티 검색과 동일한 카드 패턴 재활용
- 상단에 검색 입력 필드 (탭하면 검색 화면 전환) — SRCH-01 진입점
- 검색바 아래에 프로모션 배너 캐러셀 표시
- 그 아래 '인기 크리에이터를 만나보세요!' 섹션 + 2열 카드 그리드

#### 홈 피드 — 1+-커뮤니티 (통합 피드)
- 모든 가입 커뮤니티의 포스트를 시간순(최신순)으로 통합 정렬 — 필터/정렬 옵션 없음 (MVP)
- 각 포스트 카드 상단에 커뮤니티 아이콘 + 이름 칩 표시 — 탭하면 해당 커뮤니티로 이동 (HOME-03)
- 기존 PostCard 컴포넌트를 확장하여 커뮤니티 칩 영역 추가
- FlashList + useInfiniteQuery + cursor-based pagination (Phase 3 패턴 재사용)
- 피드 상단에 프로모션 배너 캐러셀 표시
- `home-feed` Edge Function에서 크로스 커뮤니티 머지 쿼리 처리

#### 홈 헤더
- Wecord 로고 + 알림 벨(뱃지) — HOME-04 요구사항 그대로
- 추가 요소 없음 (검색은 0-커뮤니티 화면 본문에 검색바로 배치)

#### 프로모션 배너 캐러셀
- 피드 상단에 배치 (0-커뮤니티: 검색바 아래, 1+-커뮤니티: 피드 최상단)
- 3초 간격 자동 스크롤 + 수동 스와이프 가능
- 하단 도트 인디케이터
- 배너 탭 시 딥링크 — 커뮤니티 이동, 외부 링크, 또는 앱 내 화면으로 라우팅
- 관리자에서 배너 CRUD (이미지 URL + 딥링크 URL + 순서 + 활성/비활성)
- promotion_banners 테이블 필요 (DB 스키마에 아직 없음 — 마이그레이션 추가)

#### 검색 — 홈 커뮤니티/크리에이터 검색 (SRCH-01)
- 0-커뮤니티 추천 화면 상단 검색바에서 진입
- 1+-커뮤니티 통합 피드에서는 스크롤 시 헤더 숨김 + pull down으로 검색 노출
- Phase 3 커뮤니티 검색 화면 재활용 (pg_textsearch)
- 검색 결과: 2열 카드 그리드 (Phase 3과 동일)

#### 검색 — 커뮤니티 내 게시글 검색 (SRCH-02)
- Fan/Artist 탭 상단에 검색 아이콘 추가 — 탭하면 해당 탭 내 게시글 full-text 검색
- pg_textsearch로 게시글 본문 검색
- 검색 결과는 기존 PostCard 형태로 표시

#### 키워드 하이라이팅 (SRCH-03)
- 매칭된 키워드를 Teal(#00E5C3) 색상으로 강조 표시
- 앱 액센트 컬러와 일관성 유지

#### 커뮤니티 프로필 (FLLW-03)
- 진입점: 포스트/댓글의 닉네임/아바타 탭 → 해당 유저의 커뮤니티 프로필 화면으로 이동
- 상단: 아바타 + 커뮤니티 닉네임 + 게시글 수 / 팔로워 수 / 팔로잉 수 + 팔로우 버튼
- 하단: 게시글 / 댓글 탭으로 구분 — 게시글 탭은 해당 유저의 포스트 리스트 (FlashList), 댓글 탭은 해당 유저의 댓글 리스트
- 본인 프로필에서는 팔로우 버튼 대신 프로필 편집(또는 미표시)

#### 팔로우/언팔로우 (FLLW-01, FLLW-04)
- 커뮤니티 프로필 페이지의 '팔로우' 버튼으로 팔로우/언팔로우 토글
- 같은 커뮤니티 멤버만 팔로우 가능 (RLS 이미 구현 — community_follows 테이블)
- 포스트 카드에서는 팔로우 버튼 없음 — 프로필 진입 후 팔로우

#### 팔로워/팔로잉 리스트 (FLLW-02)
- 프로필 상단의 팔로워/팔로잉 수 탭하면 리스트 화면 이동
- 각 항목: 아바타 + 커뮤니티 닉네임 + 팔로우/언팔로우 버튼
- 닉네임 탭하면 해당 유저 프로필로 이동

### Claude's Discretion
- `home-feed` Edge Function 쿼리 최적화 (크로스 커뮤니티 머지 전략, N+1 방지)
- 프로모션 배너 캐러셀 자동 스크롤 구현 (FlatList vs ScrollView)
- 검색 디바운스 간격 및 최소 글자 수
- 빈 상태 UI (검색 결과 없음, 팔로워 없음 등)
- 에러 상태 핸들링
- pull-to-refresh 구현
- 커뮤니티 프로필 로딩 스켈레톤
- 통합 피드에서 검색 노출 시 헤더 애니메이션

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HOME-01 | User with 0 communities sees creator recommendation section (random, with profiles and members) | `home-feed` Edge Function returns community list when no memberships; CommunityCard component reusable as-is |
| HOME-02 | User with 1+ communities sees unified feed (Instagram-style infinite scroll) | `posts_with_nickname` view + `home-feed` Edge Function cross-community merge query; FlashList + useInfiniteQuery cursor pattern established in Phase 3 |
| HOME-03 | Each post in unified feed shows community shortcut link | PostCard extended with optional `communityChip` prop; CommunityChip new component with Teal border; community_name/community_slug already in `posts_with_nickname` view |
| HOME-04 | Home header shows Wecord logo + notification bell with badge | NotificationBellBadge component already exists; needs communityId-agnostic variant (or aggregate across all communities) |
| HOME-05 | Home shows promotion banner carousel (admin-managed) | promotion_banners table does not yet exist — migration required; FlatList pagingEnabled horizontal is the implementation pattern |
| SRCH-01 | User can search communities/creators from home discovery entry point | Existing `(community)/search.tsx` screen reused; HomeSearchBar taps to navigate there; pg_textsearch index already on communities table |
| SRCH-02 | User can search posts within a community (full-text search) | New PostSearchScreen; `posts` table has `search_vector` tsvector column + GIN index; PostgREST textSearch filter supported |
| SRCH-03 | Search results display with keyword highlighting | New HighlightedText component; case-insensitive substring match; Teal (#00E5C3) color for matched spans |
| FLLW-01 | User can follow/unfollow other members within same community | community_follows table fully implemented with RLS; useFollowMember hook needed; follow.test.ts stub exists |
| FLLW-02 | User can view follower/following list | FollowerListScreen + FollowingListScreen (new); query community_follows joining community_members for nickname/avatar |
| FLLW-03 | User can view community profile page (nickname, posts, comments, follower count) | New CommunityProfileScreen at `(community)/[id]/profile/[memberId]`; community_members has follower_count/following_count columns |
| FLLW-04 | Following is restricted to same community members only (RLS enforced) | RLS already enforced via `community_follows_insert_own` policy in follow.ts; no additional DB work needed |
</phase_requirements>

---

## Summary

Phase 5 builds three distinct feature clusters on top of a solid Phase 1–4 foundation: (1) a conditional home feed screen that switches between creator recommendation and unified cross-community feed, (2) full-text search for communities/creators (reusing Phase 3 screen) and for posts within a community (new screen), and (3) a community-scoped follow/unfollow social graph with profile and list screens.

The technical groundwork is unusually complete for a new phase. The `community_follows` table with full RLS is already implemented in `packages/db/src/schema/follow.ts`. The `posts_with_nickname` view already exposes `community_name` and `community_slug` — the two fields needed to render community chips in the unified feed. The `posts` table already has a `search_vector` tsvector column with a GIN index. The FlashList + useInfiniteQuery + cursor pagination pattern is battle-tested across four prior phases.

The two genuine new infrastructure items are: (1) the `promotion_banners` table (schema gap — migration must be added in Wave 0), and (2) the `home-feed` Edge Function (planned in ARCHITECTURE.md §5.3, not yet implemented). The `NotificationBellBadge` component exists but currently requires a `communityId` prop — the home header needs an all-communities unread count variant.

**Primary recommendation:** Implement in two plans — Plan 05-01 covers DB migration + Edge Function + Home tab screen; Plan 05-02 covers Search screens and the follow/profile social graph.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@shopify/flash-list` | 2.3.0 (in repo) | Virtualized feed lists | Established in Phase 3 for all feed screens; 5x FlatList perf |
| `@tanstack/react-query` | v5 (in repo) | Server state, infinite scroll | `useInfiniteQuery` cursor pattern used across all feeds |
| `expo-router` | v4+ (in repo) | File-based routing for new screens | All screens are file-based routes |
| `@supabase/supabase-js` | v2 (in repo) | PostgREST + Edge Function calls | Existing `supabase` client in `apps/mobile/lib/supabase.ts` |
| `expo-image` | latest (in repo) | Promotion banner images, avatars | Used in CommunityCard; handles { uri: undefined } guard pattern |
| `@expo/vector-icons` (Ionicons) | in repo | Search icon, chevron, bells | Ionicons set exclusively throughout the app |
| `nativewind` | v4.2.3 (pinned) | Tailwind CSS styling | Dark-mode design system with custom tokens |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `zustand` | v5 (in repo) | Auth store (user, communityMemberships) | Access `useAuthStore` for user.id, joined communities list |
| `react-native-safe-area-context` | in repo | SafeAreaView wrapping | Every top-level screen |
| `react-i18next` | in repo | i18n copy for new keys | All user-facing strings via `useTranslation` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| FlatList (for carousel) | ScrollView + manual offset | FlatList `pagingEnabled` provides snap-to-item for free; ScrollView requires manual calculation |
| Client-side cross-community merge | Edge Function | Client merge requires N queries (one per community) → Edge Function does single optimized JOIN |

**Installation:** No new packages needed — all dependencies already in repo.

---

## Architecture Patterns

### Recommended Project Structure for Phase 5

New files to create (confirmed from UI-SPEC and CONTEXT.md):

```
apps/mobile/
├── app/(tabs)/index.tsx                             # REPLACE placeholder → HomeFeedScreen
├── app/(community)/[id]/post-search.tsx             # In-community post full-text search
├── app/(community)/[id]/profile/[memberId].tsx      # Community profile screen
├── app/(community)/[id]/profile/[memberId]/followers.tsx
├── app/(community)/[id]/profile/[memberId]/following.tsx
│
├── components/home/
│   ├── PromotionBannerCarousel.tsx                  # Auto-scroll FlatList carousel
│   ├── CommunityChip.tsx                            # Teal-border community source chip
│   ├── RecommendationSection.tsx                    # "인기 크리에이터를 만나보세요!" + grid
│   └── HomeSearchBar.tsx                            # Tappable search bar → /(community)/search
│
├── components/search/
│   └── HighlightedText.tsx                          # Keyword highlight in Teal
│
├── components/community/
│   └── FollowButton.tsx                             # Follow/Unfollow toggle
│
├── hooks/home/
│   ├── useHomeFeed.ts                               # Edge Function caller, useInfiniteQuery
│   └── usePromotionBanners.ts                       # PostgREST query for promotion_banners
│
├── hooks/community/
│   ├── useFollowMember.ts                           # Follow/unfollow mutation
│   ├── useCommunityProfile.ts                       # Profile data (member + post/follower counts)
│   ├── useFollowerList.ts                           # Follower list query
│   └── useFollowingList.ts                          # Following list query
│
├── hooks/search/
│   └── usePostSearch.ts                             # In-community post full-text search
│
└── tests/
    ├── useHomeFeed.test.ts
    ├── usePostSearch.test.ts
    ├── useFollowMember.test.ts    # follow.test.ts stub already exists → extend
    └── useCommunityProfile.test.ts

packages/supabase/functions/home-feed/
└── index.ts                                          # NEW Edge Function

packages/supabase/migrations/
└── 20260322000000_phase5_promotion_banners.sql       # promotion_banners table + RLS
```

### Pattern 1: home-feed Edge Function — Cross-Community Merge

**What:** Single Edge Function query that JOINs `posts_with_nickname` across all communities a user belongs to, using cursor-based pagination.

**When to use:** Any time posts from multiple communities must be merged into a single time-ordered stream.

**Key design — avoid N+1:**
- Single query: `SELECT ... FROM posts_with_nickname WHERE community_id = ANY($communityIds) ORDER BY created_at DESC, id DESC`
- Pass `community_ids` as a PostgreSQL array parameter
- Cursor: `{ createdAt, id }` — same pattern as `useFanFeed` (Phase 3)

```typescript
// packages/supabase/functions/home-feed/index.ts
// Pattern mirrors highlight/index.ts — Deno.serve, user-context client, CORS headers
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader ?? '' } } }
  );

  const { cursor, limit = 15 } = await req.json();

  // Step 1: Get caller's community_ids
  const { data: { user } } = await supabase.auth.getUser();
  const { data: memberships } = await supabase
    .from('community_members')
    .select('community_id')
    .eq('user_id', user.id);

  const communityIds = memberships?.map(m => m.community_id) ?? [];
  if (communityIds.length === 0) {
    return new Response(JSON.stringify({ posts: [], nextCursor: null, isEmpty: true }), ...);
  }

  // Step 2: Single merged query with cursor
  let query = supabase
    .from('posts_with_nickname')
    .select('*')
    .in('community_id', communityIds)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`);
  }

  const { data: posts, error } = await query;
  // ...
});
```

**Confidence:** HIGH — pattern is direct extension of `highlight/index.ts` and `useFanFeed.ts`.

### Pattern 2: Promotion Banner Carousel

**What:** `FlatList` with `horizontal pagingEnabled` + `setInterval` auto-scroll at 3s. Active index tracked via `onViewableItemsChanged`. Auto-scroll pauses on user swipe via `onScrollBeginDrag` / `onScrollEndDrag`.

**When to use:** Any horizontally-paginated auto-advancing carousel.

```typescript
// components/home/PromotionBannerCarousel.tsx
const intervalRef = useRef<NodeJS.Timeout | null>(null);
const flatListRef = useRef<FlatList>(null);

const startAutoScroll = () => {
  intervalRef.current = setInterval(() => {
    setCurrentIndex(prev => {
      const next = (prev + 1) % banners.length;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      return next;
    });
  }, 3000);
};

// Pause on user swipe
const handleScrollBeginDrag = () => {
  if (intervalRef.current) clearInterval(intervalRef.current);
};
const handleScrollEndDrag = () => startAutoScroll();

// If 1 banner: no auto-scroll, no dot indicator
if (banners.length === 1) { /* render single image, no interval */ }
// If 0 banners: return null
if (!banners || banners.length === 0) return null;
```

**Confidence:** HIGH — standard React Native FlatList pattern; aligns with UI-SPEC carousel spec.

### Pattern 3: PostCard Community Chip Extension

**What:** Add optional `showCommunityChip?: boolean` prop to existing `PostCard`. When `true`, render `CommunityChip` above the header row.

**CommunityChip layout:** `flex-row items-center gap-1, border border-teal rounded-full px-8 py-2 mb-8`

The `posts_with_nickname` view already provides `community_name` and `community_slug` fields on every `PostWithNickname` record — no schema change needed.

**Confidence:** HIGH — `community_name` and `community_slug` confirmed in `useFanFeed.ts` `PostWithNickname` interface.

### Pattern 4: In-Community Post Full-Text Search

**What:** PostgREST `textSearch` filter on `posts_with_nickname` using the `search_vector` tsvector column.

```typescript
// hooks/search/usePostSearch.ts
const { data } = await supabase
  .from('posts_with_nickname')
  .select('*')
  .eq('community_id', communityId)
  .textSearch('content', query, { type: 'websearch', config: 'simple' })
  .order('created_at', { ascending: false })
  .limit(20);
```

The `search_vector` GIN index (`idx_posts_search`) already exists from the initial schema migration. The `'simple'` config is multilingual-safe (no language-specific stemming).

**Confidence:** HIGH — confirmed in ARCHITECTURE.md §4.4 index definitions and initial_schema.sql.

### Pattern 5: Follow/Unfollow Mutation

**What:** `useMutation` that inserts or deletes from `community_follows`. Uses the caller's `community_members.id` (cm_id) as `follower_cm_id`.

```typescript
// hooks/community/useFollowMember.ts
const toggle = useMutation({
  mutationFn: async ({ followerCmId, followingCmId, isFollowing }) => {
    if (isFollowing) {
      // DELETE
      const { error } = await supabase
        .from('community_follows')
        .delete()
        .eq('follower_cm_id', followerCmId)
        .eq('following_cm_id', followingCmId);
      if (error) throw error;
    } else {
      // INSERT — RLS enforces same-community check
      const { error } = await supabase
        .from('community_follows')
        .insert({ follower_cm_id: followerCmId, following_cm_id: followingCmId });
      if (error) throw error;
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['communityProfile', followingCmId] });
    queryClient.invalidateQueries({ queryKey: ['isFollowing', followerCmId, followingCmId] });
  },
});
```

**Confidence:** HIGH — `community_follows` table and RLS confirmed in `follow.ts`; `follow.test.ts` stub already tests these exact patterns.

### Pattern 6: Community Profile Data Queries

**What:** Three coordinated queries for the CommunityProfileScreen:
1. `community_members` — get nickname, avatar, follower_count, following_count for the target `memberId`
2. `posts_with_nickname` — get that member's posts (filter by `author_cm_id`)
3. `comments` — get that member's comments (filter by `author_id` after resolving `user_id` from cm)

**Key field:** `community_members` has `follower_count` and `following_count` as denormalized integer columns — these are already maintained by existing DB triggers or should be kept in sync by the follow/unfollow mutation (invalidate query).

**Check needed at Wave 0:** Verify whether a DB trigger updates `follower_count`/`following_count` in `community_members` on `community_follows` INSERT/DELETE, or whether the follow mutation must increment/decrement manually via `.rpc('increment_follower_count')`. The initial schema shows these columns exist but the Phase 3 trigger migration should be reviewed.

### Anti-Patterns to Avoid

- **N+1 community queries in home feed:** Never query each community's posts separately on the client. The Edge Function must use `.in('community_id', communityIds)` — single query.
- **Bare `auth.uid()` in RLS:** All RLS policies use `(select auth.uid())` wrapper pattern — never bare `auth.uid()`.
- **`{ uri: undefined }` in expo-image:** Guard every image source with a ternary; render placeholder `View` when URL is null/undefined. Established in Phase 3.
- **Modifying existing migrations:** Never edit existing `.sql` migration files. Add new numbered migration files for Phase 5 changes.
- **posts_with_nickname view bypass:** Never query `posts` directly for content display — always use `posts_with_nickname` to preserve persona isolation.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-community feed merge | Custom client-side array merge | `home-feed` Edge Function with `.in()` | N+1 queries, race conditions, cursor sync breaks |
| Full-text search | Custom `ILIKE` substring search | `textSearch()` PostgREST filter on `search_vector` | `search_vector` GIN index already exists; BM25 ranking built-in |
| Keyword highlight | Custom regex text splitter | `HighlightedText` component (new, simple) | React Native `Text` nesting with colored spans is 15-line pattern; no library needed |
| Follow RLS enforcement | Custom server-side membership check | `community_follows` RLS policies (already live) | Same-community enforcement is already encoded in DB; client just calls insert |
| Carousel pagination | Custom scroll math | `FlatList pagingEnabled` | Snap-to-item, velocity physics, accessibility for free |
| Debounced search | Custom `setTimeout` wrapper | `useEffect` + `clearTimeout` pattern (established in Phase 3) | Memory-safe, matches existing `(community)/search.tsx` 300ms pattern |

---

## DB Schema Gap: promotion_banners Table

The `promotion_banners` table does not exist in any migration file. This is a Wave 0 blocker for HOME-05. The migration must create:

```sql
-- packages/supabase/migrations/20260322000000_phase5_promotion_banners.sql
CREATE TABLE promotion_banners (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url   text NOT NULL,
  link_url    text NOT NULL,        -- deeplink: community UUID, app route, or external URL
  sort_order  integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

-- RLS: authenticated users can read active banners
ALTER TABLE promotion_banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "banners_select_authenticated" ON promotion_banners
  FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "banners_admin_all" ON promotion_banners
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = (select auth.uid())
    AND raw_user_meta_data->>'role' = 'admin'
  ));
```

**Index:** `CREATE INDEX idx_banners_active_order ON promotion_banners(is_active, sort_order) WHERE is_active = true;`

**Confidence:** HIGH — CONTEXT.md explicitly names this as a missing table. Admin CRUD is Phase 6 scope (ADMN-10). Phase 5 only reads banners.

---

## NotificationBellBadge: communityId-Agnostic Variant

The existing `NotificationBellBadge` component requires a `communityId` prop and calls `useUnreadNotificationCount(userId, communityId)`. The Home header needs a cross-community unread count.

**Options (Claude's discretion):**
1. Pass `communityId=""` (empty string) and modify `useUnreadNotificationCount` to return a total count when communityId is empty — **recommended** (minimal change, backward-compatible)
2. Create a new `useUnreadNotificationCountAll` hook that omits the community filter
3. Create a wrapper `HomeNotificationBell` component with its own hook

The recommended approach: add a separate hook `useAllUnreadNotificationCount(userId)` that queries `notifications` with only `user_id` filter (no `community_id`), used exclusively by the Home header.

---

## Common Pitfalls

### Pitfall 1: cursor pagination breaks when Edge Function returns joined posts
**What goes wrong:** `posts_with_nickname` view JOIN may produce records where `created_at` ties across communities; cursor `or(created_at.lt.X, ...)` handles this correctly only with a secondary `id` sort.
**Why it happens:** Two posts from different communities can share the same `created_at` timestamp (down to millisecond).
**How to avoid:** Always use compound cursor `(created_at DESC, id DESC)` — same as Phase 3 `useFanFeed`. Never use `created_at` alone.
**Warning signs:** Duplicate posts appearing after load-more; some posts disappearing between pages.

### Pitfall 2: follower_count / following_count staleness
**What goes wrong:** Community profile screen shows wrong counts after follow/unfollow.
**Why it happens:** `community_members.follower_count` and `following_count` are denormalized integers. If no DB trigger increments them on `community_follows` INSERT/DELETE, they stay stale.
**How to avoid:** Check whether a trigger exists in the Phase 3 migrations. If not, the follow mutation must call a Postgres function or manually update the count. Invalidate the `communityProfile` TanStack Query key immediately after mutation.
**Warning signs:** Count shown in profile header doesn't match actual follower list length.

### Pitfall 3: FlatList numColumns=2 width constraint
**What goes wrong:** `flex-1` does not work for grid item width in React Native — items either collapse or overflow.
**Why it happens:** React Native FlatList grid items need explicit `style={{ width: '50%' }}` on the renderItem wrapper, not className.
**How to avoid:** Wrap each `CommunityCard` in `<View style={{ width: '50%' }}>` in the recommendation grid — identical to Phase 3 community search grid pattern.
**Warning signs:** Grid items all render in a single column, or cards overflow the screen.

### Pitfall 4: `as never` cast for new routes not yet in expo-router registry
**What goes wrong:** TypeScript errors on `router.push('/(community)/[id]/profile/[memberId]')` because the route file doesn't exist yet.
**Why it happens:** expo-router generates typed routes from the file system; new files added mid-phase cause incremental TS errors.
**How to avoid:** Add `as never` casts for routes that are created in the same plan. Remove casts once all route files exist at typecheck time.
**Warning signs:** TS4058 or typed route inference errors during incremental plan execution.

### Pitfall 5: Promotion banner carousel auto-scroll memory leak
**What goes wrong:** `setInterval` keeps firing after component unmounts.
**Why it happens:** Missing cleanup in `useEffect` return function.
**How to avoid:** Always return `() => clearInterval(intervalRef.current)` from the auto-scroll `useEffect`. Use `useRef` for the interval ID, not `useState`.
**Warning signs:** Console warnings about state update on unmounted component; animation running after navigation away from Home tab.

### Pitfall 6: `community_follows` RLS — follower_cm_id must be caller's cm_id
**What goes wrong:** RLS INSERT policy rejects the operation with `42501` even when the user is a community member.
**Why it happens:** The `community_follows_insert_own` policy checks `cm1.user_id = (select auth.uid())` where `cm1.id = follower_cm_id`. If the client passes the wrong `follower_cm_id` (e.g. the target's cm_id), RLS blocks it.
**How to avoid:** The follow mutation must first fetch `myCmId` via `useCommunityMember(communityId)` and pass `membership.id` as `follower_cm_id`.
**Warning signs:** 403 error on follow insert; error message contains `community_follows_insert_own`.

---

## Code Examples

### Edge Function: home-feed response shape
```typescript
// Response type for useHomeFeed.ts to consume
interface HomeFeedResponse {
  posts: PostWithNickname[];        // same interface as useFanFeed — community_name/slug included
  nextCursor: { createdAt: string; id: string } | null;
  isEmpty: boolean;                 // true when user has 0 community memberships
}
```

### HighlightedText component
```typescript
// components/search/HighlightedText.tsx
// Source: React Native Text nesting pattern
interface HighlightedTextProps {
  text: string;
  query: string;
  style?: TextStyle;
}

export function HighlightedText({ text, query, style }: HighlightedTextProps) {
  if (!query.trim()) return <Text style={style}>{text}</Text>;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return (
    <Text style={style}>
      {parts.map((part, i) =>
        regex.test(part)
          ? <Text key={i} style={{ color: '#00E5C3' }}>{part}</Text>
          : part
      )}
    </Text>
  );
}
```

### useHomeFeed: membership guard
```typescript
// hooks/home/useHomeFeed.ts
// Guard: if memberships.length === 0, skip Edge Function call; switch to recommendation view
const { data: membershipList } = useQuery({
  queryKey: ['myMemberships', user?.id],
  queryFn: async () => {
    const { data } = await supabase
      .from('community_members')
      .select('community_id')
      .eq('user_id', user!.id);
    return data ?? [];
  },
  enabled: !!user,
});

const isNewUser = membershipList?.length === 0;
```

### usePostSearch: debounced textSearch
```typescript
// hooks/search/usePostSearch.ts
const [debouncedQuery, setDebouncedQuery] = useState('');
useEffect(() => {
  const timer = setTimeout(() => setDebouncedQuery(rawQuery), 300);
  return () => clearTimeout(timer);
}, [rawQuery]);

const { data } = useQuery({
  queryKey: ['postSearch', communityId, debouncedQuery],
  queryFn: async () => {
    if (!debouncedQuery.trim()) return [];
    const { data, error } = await supabase
      .from('posts_with_nickname')
      .select('*')
      .eq('community_id', communityId)
      .textSearch('content', debouncedQuery, { type: 'websearch', config: 'simple' })
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    return data ?? [];
  },
  enabled: !!debouncedQuery.trim(),
});
```

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (already configured in repo) |
| Config file | `apps/mobile/vitest.config.ts` |
| Quick run command | `pnpm --filter mobile test --run` |
| Full suite command | `pnpm --filter mobile test --run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HOME-01 | home-feed Edge Function returns `isEmpty: true` when no memberships | unit | `pnpm --filter mobile test --run tests/useHomeFeed.test.ts` | ❌ Wave 0 |
| HOME-02 | useHomeFeed fetches posts_with_nickname with cursor pagination | unit | `pnpm --filter mobile test --run tests/useHomeFeed.test.ts` | ❌ Wave 0 |
| HOME-03 | PostWithNickname has community_name and community_slug fields | unit | `pnpm --filter mobile test --run tests/feed.test.ts` | ✅ (existing) |
| HOME-04 | NotificationBellBadge renders badge count (existing component) | unit | `pnpm --filter mobile test --run` | ✅ (Phase 4 tests) |
| HOME-05 | usePromotionBanners returns active banners sorted by sort_order | unit | `pnpm --filter mobile test --run tests/usePromotionBanners.test.ts` | ❌ Wave 0 |
| SRCH-01 | HomeSearchBar tap navigates to /(community)/search | manual | manual | n/a |
| SRCH-02 | usePostSearch calls textSearch with debounced query | unit | `pnpm --filter mobile test --run tests/usePostSearch.test.ts` | ❌ Wave 0 |
| SRCH-03 | HighlightedText splits text on keyword, wraps matched spans in Teal | unit | `pnpm --filter mobile test --run tests/usePostSearch.test.ts` | ❌ Wave 0 |
| FLLW-01 | useFollowMember insert calls community_follows with correct cm_ids | unit | `pnpm --filter mobile test --run tests/follow.test.ts` | ✅ (stub exists) |
| FLLW-02 | useFollowerList fetches community_follows joined to community_members | unit | `pnpm --filter mobile test --run tests/useCommunityProfile.test.ts` | ❌ Wave 0 |
| FLLW-03 | useCommunityProfile returns nickname, follower_count, following_count | unit | `pnpm --filter mobile test --run tests/useCommunityProfile.test.ts` | ❌ Wave 0 |
| FLLW-04 | follow.test.ts verifies RLS fields (follower_cm_id = own cm_id) | unit | `pnpm --filter mobile test --run tests/follow.test.ts` | ✅ (stub exists) |

### Sampling Rate
- **Per task commit:** `pnpm --filter mobile test --run`
- **Per wave merge:** `pnpm --filter mobile test --run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/mobile/tests/useHomeFeed.test.ts` — covers HOME-01, HOME-02
- [ ] `apps/mobile/tests/usePromotionBanners.test.ts` — covers HOME-05
- [ ] `apps/mobile/tests/usePostSearch.test.ts` — covers SRCH-02, SRCH-03 (HighlightedText logic)
- [ ] `apps/mobile/tests/useCommunityProfile.test.ts` — covers FLLW-02, FLLW-03
- [ ] `packages/supabase/migrations/20260322000000_phase5_promotion_banners.sql` — required before any banner query can succeed

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `serve()` from `std/http` in Edge Functions | `Deno.serve()` directly | Phase 2 (02-01 decision) | All new Edge Functions must use `Deno.serve()` |
| `FlatList` for all lists | `FlashList` for paginated feeds | Phase 3 | Home unified feed uses FlashList; recommendation grid and banner carousel use FlatList |
| Importing `useTranslation` from `react-i18next` | Importing from `@wecord/shared/i18n` | Phase 3 | All community components use `@wecord/shared/i18n` import |
| `notifications-bell-outline` (wrong) | `notifications-outline` (Ionicons correct name) | Phase 4-03 decision | Bell icon must use `notifications-outline` not `bell-outline` |

**Deprecated/outdated:**
- Direct `posts` table queries for display: replaced by `posts_with_nickname` view — never bypass
- `pgView.as()` with SQL: use raw `sql` tag constant — Drizzle type limitation documented in STATE.md

---

## Integration Points

| Touch Point | File | Change Required |
|-------------|------|-----------------|
| Home tab placeholder | `apps/mobile/app/(tabs)/index.tsx` | Replace entirely with HomeFeedScreen |
| Fan tab header | `apps/mobile/app/(community)/[id]/fan.tsx` | Add search icon button (top-right) → navigate to post-search |
| Artist tab header | `apps/mobile/app/(community)/[id]/artist.tsx` | Same search icon addition as Fan tab |
| PostCard | `apps/mobile/components/post/PostCard.tsx` | Add optional `showCommunityChip` prop + CommunityChip render |
| NotificationBellBadge | `apps/mobile/components/notification/NotificationBellBadge.tsx` | Home uses all-communities count; use new `useAllUnreadNotificationCount` hook |
| Drizzle schema | `packages/db/src/schema/` | Add `promotionBanners` table definition (new file or add to existing) |
| DB migrations | `packages/supabase/migrations/` | Add `20260322000000_phase5_promotion_banners.sql` |
| Edge Functions | `packages/supabase/functions/home-feed/index.ts` | New function; deploy via `supabase functions deploy home-feed` |
| i18n files | `packages/shared/i18n/*.json` | Add all Phase 5 keys from UI-SPEC copywriting contract (5 languages) |

---

## Open Questions

1. **follower_count / following_count trigger existence**
   - What we know: `community_members` table has these denormalized columns; `community_follows` table has triggers mentioned in Phase 3 migrations.
   - What's unclear: Whether `20260320000001_phase3_triggers_storage.sql` includes a trigger that increments/decrements these counts on `community_follows` INSERT/DELETE, or whether the Phase 5 follow mutation must handle it manually.
   - Recommendation: Read `20260320000001_phase3_triggers_storage.sql` at Wave 0 start. If no trigger exists, add a `20260322000001_phase5_follow_count_trigger.sql` migration.

2. **artist tab file path**
   - What we know: ARCHITECTURE.md §3.1 shows `creator.tsx` for Creator Feed tab. CONTEXT.md mentions "Fan/Artist 탭 상단에 검색 아이콘 추가."
   - What's unclear: The actual file may be `artist.tsx`, `creator.tsx`, or within the `[id]` group.
   - Recommendation: Run `ls apps/mobile/app/(community)/[id]/` at plan time to confirm exact filenames.

3. **Home header search (1+-community view)**
   - What we know: CONTEXT.md says "스크롤 시 헤더 숨김 + pull down으로 검색 노출" for the 1+-community view. UI-SPEC does not specify an animation.
   - What's unclear: Whether the pull-down-to-reveal-search should use an Animated.Value or simply re-render with a visible search bar based on scroll position.
   - Recommendation: Claude's discretion per CONTEXT.md. The simplest MVP approach is to show the search bar only in the 0-community recommendation view and skip the pull-down animation in 1+-community view for Phase 5. This matches the UI-SPEC which only shows HomeSearchBar in the 0-community layout tree.

---

## Sources

### Primary (HIGH confidence)
- `packages/db/src/schema/follow.ts` — community_follows table, all RLS policies, exact field names
- `packages/db/src/schema/content.ts` — posts table, postsWithNicknameViewSql, search_vector field
- `packages/db/src/schema/community.ts` — communities, community_members table structures
- `docs/ARCHITECTURE.md` — ERD §4, Edge Function specs §5.3/5.4, index strategy §4.4
- `apps/mobile/hooks/post/useFanFeed.ts` — PostWithNickname interface, cursor pattern, fetchLikedPostIds
- `apps/mobile/hooks/post/useCreatePost.ts` — mutation pattern reference
- `apps/mobile/components/post/PostCard.tsx` — extension point, existing props
- `apps/mobile/components/community/CommunityCard.tsx` — reuse pattern, FlatList numColumns=2 caveat
- `apps/mobile/components/notification/NotificationBellBadge.tsx` — communityId requirement
- `apps/mobile/app/(community)/[id]/fan.tsx` — FlashList pattern, ListHeaderComponent, RefreshControl
- `packages/supabase/functions/highlight/index.ts` — Edge Function boilerplate (Deno.serve, CORS, user-context client)
- `apps/mobile/tests/follow.test.ts` — existing follow test stub
- `.planning/phases/05-home-feed-search-community-social/05-CONTEXT.md` — locked decisions
- `.planning/phases/05-home-feed-search-community-social/05-UI-SPEC.md` — component inventory, layout contracts, copywriting
- `.planning/STATE.md` — accumulated decisions, Nativewind v4 caveat

### Secondary (MEDIUM confidence)
- ARCHITECTURE.md §5.3 `home-feed` Edge Function spec — documented but not yet implemented; implementation extrapolated from `highlight` function pattern
- `community_members.follower_count` / `following_count` trigger status — columns confirmed in ERD, trigger existence requires reading migration file

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages confirmed in existing repo
- Architecture: HIGH — patterns directly derived from implemented Phase 3–4 code
- DB schema gap (promotion_banners): HIGH — confirmed absent from all migration files
- Edge Function design: HIGH — direct extension of highlight/index.ts pattern
- follower_count trigger: MEDIUM — column exists, trigger status unverified

**Research date:** 2026-03-22
**Valid until:** 2026-04-22 (stable stack, 30-day horizon)

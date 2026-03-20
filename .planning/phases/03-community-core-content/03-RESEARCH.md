# Phase 3: Community & Core Content - Research

**Researched:** 2026-03-20
**Domain:** React Native (Expo SDK 55) — community UX, FlashList infinite scroll, Supabase Storage media upload, pg_textsearch, optimistic mutations, RLS-enforced feeds
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**커뮤니티 탐색/검색**
- 검색 결과: 카드 그리드 (2열) — 커버 이미지 + 이름 + 멤버 수
- pg_textsearch로 커뮤니티 이름/키워드 검색
- 커뮤니티 프리뷰(가입 전): 커버 + 이름 + 설명, 멤버 수 + 카테고리(BL/GL 등), 최근 게시글 미리보기 2-3개, 그룹 커뮤니티는 아티스트 멤버 프로필 썸네일 표시

**커뮤니티 가입 & 닉네임**
- 가입 시 닉네임: User#XXXX 형태 자동생성 후 가입 화면에서 바로 수정 가능
- 온보딩 큐레이션 자동가입과 동일한 자동생성 패턴 유지 (Phase 2 결정)
- 가입 후 설정에서 닉네임 변경 가능 (COMM-04)
- 탈퇴: 확인 대화상자 후 처리

**커뮤니티 메인 화면 (가입 후)**
- 탭 구성: Fan / Artist / Highlight 3탭
- Highlight 탭은 Phase 3에서 placeholder (Phase 4에서 콘텐츠 구현)
- 솔로 커뮤니티: Artist 탭에 아티스트 멤버 리스트 없이 크리에이터 게시글만 표시
- 그룹 커뮤니티: Artist 탭 상단에 가로 스크롤 멤버 프로필 (원형 아이콘), 탭하면 해당 멤버 게시글 필터링

**팬 피드 레이아웃**
- 포스트 카드: 아바타 + 커뮤니티 닉네임 + 상대시간 + 본문 텍스트 + 미디어 프리뷰 + 좋아요/댓글 카운트
- 이미지 다중 표시: 그리드 레이아웃 (1장: 풀사이즈, 2장: 1:1 좌우, 3장: 1+2 그리드, 4장+: 2x2 그리드 + 나머지 수 표시)
- 정렬/필터: Fan/Artist/Highlight 탭 바로 아래에 칩 바 — 정렬(최신/인기) + 필터(전체/팔로잉/핫)
- FlashList + useInfiniteQuery + cursor-based pagination (ROADMAP 지정)

**크리에이터 포스트 구분**
- 닉네임 옆 'Creator' 뱃지만으로 구분 (배경색 차별화 없음, 카드 디자인 동일)
- Artist 탭에서는 크리에이터 게시글만 표시 (RLS + author_role='creator' 필터)

**포스트 작성**
- FAB(+) 버튼 탭 → 풀스크린 모달로 바로 작성 화면 이동 (액션 시트 없음)
- 작성 화면: 상단(X + "새 글 쓰기" + 발행 버튼), 커뮤니티 닉네임 표시, 텍스트 입력 영역, 하단 미디어 추가 버튼
- 이미지 최대 10장, 영상 최대 1개 (동시 불가 — 스키마 제약)
- 선택한 미디어: 작성창 내 썸네일 그리드로 미리보기, X 버튼으로 개별 삭제, 드래그로 순서 변경
- Supabase Storage에 업로드

**댓글 표시**
- 인라인 들여쓰기: 대댓글은 원댓글 아래 들여쓰기로 표시
- 각 댓글: 아바타 + 커뮤니티 닉네임 + 상대시간 + 내용 + 좋아요 수 + 답글 버튼
- 커뮤니티 닉네임으로만 표시 (posts_with_nickname 뷰 패턴과 동일하게 페르소나 격리)

**크리에이터 답글 하이라이트**
- 닉네임 Teal 색상 + 'Creator' 뱃지 (배경색 변경 없음)

**좋아요 인터랙션**
- 하트 아이콘 탭 → 색상 채움 + 살짝 커짐 (scale bounce) 애니메이션
- 낙관적 업데이트: UI 즉시 토글 후 서버 반영

**삭제 확인**
- 게시글/댓글 삭제 시 확인 대화상자

### Claude's Discretion
- FlashList 최적화 전략 (estimatedItemSize, getItemType 등)
- 이미지/영상 압축 전략 및 Supabase Storage 버킷 구성
- 커서 페이지네이션 구현 상세 (cursor 필드, 페이지 크기)
- 빈 상태(Empty State) 화면 디자인
- 에러 상태 UI (네트워크 오류, 업로드 실패 등)
- pull-to-refresh 구현
- 포스트/댓글 입력 시 글자 수 제한 정책
- FAB 위치 및 스타일 상세

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| COMM-01 | User can search communities by creator name/keyword (pg_textsearch) | pg_textsearch GIN index on communities.name+description; PostgREST `textSearch` filter via `fts` operator; Supabase client `.textSearch()` method |
| COMM-02 | User can view community preview (description, member count, recent activity) | PostgREST `.select()` with `limit` on posts_with_nickname; preview screen gated before membership INSERT |
| COMM-03 | User can join community with per-community nickname (random code-nick auto-fill) | generate-nickname Edge Function pattern from Phase 2; community_members INSERT with community_nickname; UNIQUE constraint on (community_id, community_nickname) enforces uniqueness |
| COMM-04 | User can modify community nickname after joining | community_members UPDATE RLS policy "own record only"; PATCH via supabase-js |
| COMM-05 | User can join multiple communities simultaneously | community_members table allows multiple rows per user_id (one per community_id); UNIQUE(user_id, community_id) prevents duplicate joins |
| COMM-06 | User can leave a community | community_members DELETE RLS policy "own record only"; Alert confirmation dialog |
| COMM-07 | Community supports solo and group types | communities.type 'solo' | 'group' column; conditional rendering in Artist tab (ArtistMemberScroll shown only when type='group') |
| MEMB-01 | Group community displays artist member list with profiles | artist_members table + SELECT RLS (community members only); horizontal FlatList with 56px circles |
| MEMB-02 | User can view individual artist member's posts (filtered view) | posts WHERE artist_member_id = selectedMemberId; URL param drives filter state in Artist tab |
| MEMB-03 | User can follow specific artist members within a community | community_follows INSERT with follower_cm_id + following_cm_id; artist_member linked to community_members.user_id |
| MEMB-04 | User receives push notification for followed member posts | Phase 4 — push notification fan-out (pgmq) deferred; stub only in Phase 3 |
| FANF-01 | User can create text post in joined community (displayed with community nickname) | posts INSERT + posts_with_nickname view JOIN; author_role='fan' enforced by RLS |
| FANF-02 | User can attach up to 10 images to a post | expo-image-picker multi-select (mediaTypes: Images, selectionLimit: 10); Supabase Storage upload loop; media_urls text[] column |
| FANF-03 | User can attach 1 video to a post | expo-image-picker mediaTypes: Videos; post_type='video'; images and video mutually exclusive (UI state guard) |
| FANF-04 | User can view fan feed with infinite scroll (cursor-based pagination) | useInfiniteQuery + FlashList; cursor = last post's created_at+id; PostgREST range filter |
| FANF-05 | User can sort fan feed by latest/popular | query param `sort=latest|popular`; latest = ORDER BY created_at DESC, popular = ORDER BY like_count DESC, created_at DESC |
| FANF-06 | User can filter fan feed by "all", "following", "hot" | all = no filter; following = subquery on community_follows; hot = like_count threshold (e.g. >10) |
| FANF-07 | User can delete own posts | posts DELETE RLS policy "own record"; optimistic removal from query cache |
| FANF-08 | Post creation via floating "+" FAB button on community page | FAB component + router.push('/(community)/compose') |
| CREF-01 | Creator can post in Creator tab (RLS enforced) | posts INSERT with author_role='creator' gated by community_members.role='creator' RLS |
| CREF-02 | User can view Creator tab with creator-only posts | posts WHERE author_role='creator' AND community_id = X; Artist tab RLS-filtered |
| CREF-03 | Creator post triggers push notification to all community members | Phase 4 scope — stub in Phase 3; architect hook point in post INSERT trigger |
| CREF-04 | Creator posts are visually distinguished from fan posts | CreatorBadge component (text-teal, "Creator" label) beside nickname; no card background change |
| INTC-01 | User can comment on posts (displayed with community nickname) | comments INSERT + JOIN to community_members for nickname display; inline nickname query |
| INTC-02 | User can reply to comments (1 depth nested) | comments.parent_comment_id FK; UI renders CommentRow + ReplyRow (ml-48 indent); depth guard: replies cannot reply further |
| INTC-03 | Creator replies are visually highlighted | comments.is_creator_reply boolean + comments.author_role='creator'; CreatorBadge + teal nickname text |
| INTC-04 | User can like posts (toggle, real-time count) | likes composite PK (user_id, target_type, target_id) enforces one-like; optimistic useMutation; posts.like_count increment via DB trigger or client-side Realtime |
| INTC-05 | User can like comments (toggle, real-time count) | same likes table, target_type='comment'; same optimistic pattern |
| INTC-06 | User can delete own comments | comments DELETE RLS policy "own record"; parent_comment_id preserved for reply orphan handling |
</phase_requirements>

---

## Summary

Phase 3 is the largest phase in the project — 26 requirements spanning community discovery, multi-tab content feeds, media upload, and social interactions. The project already has all database schema defined and RLS policies enforced from Phase 1. What remains is exclusively frontend screen implementation, query layer (TanStack Query v5 with infinite scroll), and Supabase Storage bucket configuration. There is no schema migration work needed for core Phase 3 functionality.

The critical architectural constraint is `posts_with_nickname` view exclusivity: every content query that displays a post or comment author MUST JOIN through this view, never through raw `posts`. This was locked in Phase 1 (STATE.md) and is trust-critical for persona isolation. The Drizzle schema already defines this view as a raw SQL constant (`postsWithNicknameViewSql` in `content.ts`).

FlashList (`@shopify/flash-list`) is not yet installed — it requires installation. react-native-reanimated (for like animation) and expo-image-picker / expo-image (for media) are also not in the current package.json and need to be added in Wave 0. The Expo SDK 55 versions of these packages are confirmed from npm registry.

**Primary recommendation:** Install FlashList + expo-image + expo-image-picker + react-native-reanimated in Wave 0, then build plans 03-01 through 03-04 in strict schema-fidelity, always reading from posts_with_nickname view, never raw posts.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@shopify/flash-list` | 2.3.0 | Virtualized infinite-scroll feed list (replaces FlatList) | ROADMAP-specified; 5x FlatList perf at 1000+ items; `getItemType` + `estimatedItemSize` critical for mixed media/text rows |
| `expo-image` | 55.0.6 | Optimized image display with caching, blurhash placeholder | Expo SDK 55 native module; built-in memory cache; faster than `<Image>` |
| `expo-image-picker` | 55.0.13 | Native media library picker + camera for post creation | Expo SDK 55; `selectionLimit:10`, `mediaTypes: ['images']` or `['videos']`; handles permissions |
| `expo-image-manipulator` | 55.0.11 | Compress images before Supabase Storage upload | Keeps upload size < 2MB; resize to max 1080px; quality 0.7 |
| `react-native-reanimated` | 4.2.2 | Like button scale spring animation | Required for `withSpring` / `useAnimatedStyle`; Expo SDK 55 compatible; must be listed in Babel plugin |
| `@tanstack/react-query` | 5.90.21 (installed) | Server state, useInfiniteQuery, optimistic mutations | Already in package.json; v5 uses `getNextPageParam` + `initialPageParam` pattern |
| `@supabase/supabase-js` | 2.99.2 (installed) | PostgREST CRUD, Realtime, Storage upload | Already in package.json |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@expo/vector-icons` / Ionicons | 15.1.1 (installed) | Heart, comment, add, chevron icons | Already installed; use `heart` / `heart-outline`, `add`, `chatbubble-outline`, `ellipsis-horizontal` |
| `expo-router` | ~55.0.6 (installed) | File-based routing for community screens | Already installed; `router.push`, `useLocalSearchParams` for `[id]` route |
| `react-native-safe-area-context` | 5.4.1 (installed) | Safe area insets for FAB positioning above tab bar | Already installed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| FlashList | FlatList | FlatList blanks out on fast scroll with 100+ posts; FlashList mandatory per ROADMAP |
| expo-image | react-native Image | expo-image has built-in blurhash, memory cache, disk cache; better UX for feed with many images |
| react-native-reanimated | Animated API | Animated.spring is synchronous on JS thread; Reanimated 3 runs on UI thread; no jank during like tap |
| PostgREST direct | Edge Function for feeds | PostgREST with RLS is sufficient for all Phase 3 queries; Edge Function overhead not needed until aggregation (Phase 4) |

### Installation

```bash
cd apps/mobile
pnpm add @shopify/flash-list@2.3.0 expo-image@~55.0.6 expo-image-picker@~55.0.13 expo-image-manipulator@~55.0.11 react-native-reanimated@~4.2.2
```

**Babel plugin update required for react-native-reanimated:**
```js
// babel.config.js — add to plugins array:
'react-native-reanimated/plugin'
```

**app.json plugin update required for expo-image-picker:**
```json
{
  "plugins": [
    ["expo-image-picker", {
      "photosPermission": "커뮤니티 포스트에 사진을 첨부하려면 사진 라이브러리 접근이 필요합니다.",
      "cameraPermission": "커뮤니티 포스트에 사진을 촬영하려면 카메라 접근이 필요합니다."
    }]
  ]
}
```

**Version verification (confirmed 2026-03-20 from npm registry):**
- `@shopify/flash-list` → 2.3.0
- `expo-image` → 55.0.6
- `expo-image-picker` → 55.0.13
- `expo-image-manipulator` → 55.0.11
- `react-native-reanimated` → 4.2.2

---

## Architecture Patterns

### Recommended Project Structure

```
apps/mobile/
├── app/
│   └── (community)/
│       ├── _layout.tsx          # Stack navigator for community screens
│       ├── search.tsx           # COMM-01: Community search (2-col grid)
│       ├── compose.tsx          # FANF-08: Full-screen post composer modal
│       └── [id]/
│           ├── index.tsx        # Community main (cover header + CommunityTabBar)
│           ├── _layout.tsx      # Nested tab layout: fan/artist/highlight
│           ├── fan.tsx          # FANF-04~06: Fan feed (FlashList + sort/filter)
│           ├── artist.tsx       # CREF-02: Creator feed (+ ArtistMemberScroll for group)
│           ├── highlight.tsx    # Placeholder (Phase 4)
│           ├── preview.tsx      # COMM-02: Pre-join preview
│           ├── join.tsx         # COMM-03: Nickname input + join CTA
│           ├── post/
│           │   └── [postId].tsx # Post detail + comment thread
│           └── settings/
│               └── nickname.tsx # COMM-04: Modify community nickname
├── components/
│   ├── community/
│   │   ├── CommunityCard.tsx       # 2-col search result card
│   │   ├── CommunityPreviewSheet.tsx
│   │   ├── CommunityNicknameInput.tsx
│   │   ├── CommunityTabBar.tsx
│   │   └── ArtistMemberScroll.tsx
│   ├── post/
│   │   ├── PostCard.tsx
│   │   ├── MediaGrid.tsx
│   │   ├── CreatorBadge.tsx
│   │   ├── LikeButton.tsx
│   │   ├── SortFilterChipBar.tsx
│   │   ├── FAB.tsx
│   │   └── PostComposerModal.tsx
│   └── comment/
│       ├── CommentRow.tsx
│       └── ReplyRow.tsx
├── hooks/
│   ├── community/
│   │   ├── useCommunitySearch.ts   # useInfiniteQuery for community search
│   │   ├── useCommunityMember.ts   # my membership record for a community
│   │   └── useJoinCommunity.ts     # useMutation for INSERT + cache invalidation
│   ├── post/
│   │   ├── useFanFeed.ts           # useInfiniteQuery for fan feed
│   │   ├── useCreatorFeed.ts       # useInfiniteQuery for creator feed
│   │   ├── useCreatePost.ts        # useMutation + optimistic insert
│   │   ├── useDeletePost.ts        # useMutation + optimistic remove
│   │   └── useLike.ts              # useMutation + optimistic toggle
│   └── comment/
│       ├── useComments.ts          # useQuery for post comments
│       ├── useCreateComment.ts
│       └── useDeleteComment.ts
└── stores/
    └── communityStore.ts            # Active community + selected artist member filter
```

### Pattern 1: Cursor-Based Infinite Scroll with useInfiniteQuery

**What:** TanStack Query v5 `useInfiniteQuery` + PostgREST range queries using `(created_at, id)` cursor tuple for stable ordering.

**When to use:** Fan feed, Creator feed, Community search results — any list that paginates.

**Cursor field:** Use `created_at DESC, id DESC` composite cursor. Store last item's `created_at` + `id` as cursor. This is stable (no position drift when new posts arrive).

```typescript
// Source: TanStack Query v5 docs + Supabase PostgREST pattern
const PAGE_SIZE = 15;

export function useFanFeed(communityId: string, sort: 'latest' | 'popular', filter: 'all' | 'following' | 'hot') {
  return useInfiniteQuery({
    queryKey: ['fanFeed', communityId, sort, filter],
    initialPageParam: null as { createdAt: string; id: string } | null,
    queryFn: async ({ pageParam }) => {
      let query = supabase
        .from('posts_with_nickname')   // ALWAYS use this view — never raw posts
        .select('*')
        .eq('community_id', communityId)
        .eq('author_role', 'fan')
        .limit(PAGE_SIZE);

      if (sort === 'latest') {
        query = query.order('created_at', { ascending: false }).order('id', { ascending: false });
      } else {
        query = query.order('like_count', { ascending: false }).order('created_at', { ascending: false });
      }

      // Cursor pagination
      if (pageParam) {
        query = query.lt('created_at', pageParam.createdAt)
          .or(`created_at.eq.${pageParam.createdAt},id.lt.${pageParam.id}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      const last = lastPage[lastPage.length - 1];
      return { createdAt: last.created_at, id: last.id };
    },
  });
}
```

### Pattern 2: Optimistic Like Toggle

**What:** Immediately update like state in UI, then sync to DB. Revert on error.

**When to use:** Post likes (INTC-04), Comment likes (INTC-05).

```typescript
// Source: TanStack Query v5 optimistic updates docs
export function useLike(targetType: 'post' | 'comment') {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetId, isLiked, userId }: LikeParams) => {
      if (isLiked) {
        // Remove like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', userId)
          .eq('target_type', targetType)
          .eq('target_id', targetId);
        if (error) throw error;
      } else {
        // Add like
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: userId, target_type: targetType, target_id: targetId });
        if (error) throw error;
      }
    },
    onMutate: async ({ targetId, isLiked, feedQueryKey }) => {
      await queryClient.cancelQueries({ queryKey: feedQueryKey });
      const snapshot = queryClient.getQueryData(feedQueryKey);

      // Optimistically update the infinite query pages
      queryClient.setQueryData(feedQueryKey, (old: InfiniteData<Post[]> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map(page =>
            page.map(post => post.id === targetId
              ? { ...post, like_count: post.like_count + (isLiked ? -1 : 1), isLiked: !isLiked }
              : post
            )
          ),
        };
      });
      return { snapshot };
    },
    onError: (_err, _vars, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(feedQueryKey, context.snapshot);
      }
    },
  });
}
```

### Pattern 3: Supabase Storage Media Upload

**What:** Compress image → upload to Supabase Storage → store public URL in `posts.media_urls`.

**When to use:** Post creation (FANF-02, FANF-03).

```typescript
// Source: Supabase Storage docs + expo-image-manipulator docs
async function uploadMedia(localUri: string, communityId: string, userId: string): Promise<string> {
  // 1. Compress image
  const compressed = await manipulateAsync(
    localUri,
    [{ resize: { width: 1080 } }],   // Max 1080px wide
    { compress: 0.7, format: SaveFormat.JPEG }
  );

  // 2. Read as blob
  const response = await fetch(compressed.uri);
  const blob = await response.blob();

  // 3. Upload to Supabase Storage
  const path = `communities/${communityId}/${userId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from('post-media')              // Bucket: post-media (to be created in Wave 0)
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false });

  if (error) throw error;

  // 4. Get public URL
  const { data } = supabase.storage.from('post-media').getPublicUrl(path);
  return data.publicUrl;
}
```

### Pattern 4: posts_with_nickname View — Always Use This

**What:** Every post/comment query that displays author information MUST use the `posts_with_nickname` view, never `posts` directly.

**Why:** Persona isolation. The view JOINs `community_members.community_nickname` as `author_nickname`. Raw `posts.author_id` is a uuid — showing it would expose global identity.

```typescript
// CORRECT — persona isolated:
supabase.from('posts_with_nickname').select('*').eq('community_id', id)

// WRONG — never do this for display:
supabase.from('posts').select('*, profiles(global_nickname)').eq('community_id', id)
```

For comments, replicate the JOIN pattern manually since there is no `comments_with_nickname` view. Join `community_members` on `author_id + community_id` in the query:

```typescript
supabase
  .from('comments')
  .select(`
    *,
    author:community_members!inner(community_nickname, id)
  `)
  .eq('post_id', postId)
  .order('created_at', { ascending: true })
```

**CRITICAL:** The `posts_with_nickname` view is defined in `packages/db/src/schema/content.ts` as raw SQL (`postsWithNicknameViewSql`). It is applied via migration. Verify the view exists in the local Supabase instance before implementing queries.

### Pattern 5: FlashList Optimization

**What:** Declare `estimatedItemSize` and `getItemType` for 60fps scroll performance.

```typescript
// Source: @shopify/flash-list README
<FlashList
  data={allPosts}
  estimatedItemSize={120}   // Average height of text-only post card
  getItemType={(item) => item.media_urls?.length ? 'media' : 'text'}
  renderItem={({ item }) => <PostCard post={item} />}
  onEndReached={fetchNextPage}
  onEndReachedThreshold={0.3}   // Load when 3 items from bottom
  refreshControl={
    <RefreshControl
      refreshing={isFetchingNextPage}
      onRefresh={refetch}
      tintColor="#00E5C3"
    />
  }
  ListFooterComponent={hasNextPage ? <FeedSkeletonRows count={3} /> : null}
/>
```

### Anti-Patterns to Avoid

- **Never query raw `posts` for display** — always `posts_with_nickname`. This is a locked architectural decision (STATE.md). Violating it exposes global identity.
- **Never use FlatList for feeds** — FlashList is specified. FlatList blanks on fast scroll at 100+ items.
- **Never fire a separate profile fetch per PostCard** — `author_nickname` is already in the view JOIN. No N+1 queries.
- **Never use `Animated` API for like bounce** — use `react-native-reanimated` `withSpring`. JS-thread animations jank during scroll.
- **Never store original uncompressed images** — always run through `expo-image-manipulator` before upload. 12MP iPhone photo is ~15MB; target < 2MB.
- **Never allow images AND video in the same post** — `post_type` is 'image' | 'video' | 'text'. Images and video are mutually exclusive. UI must enforce this before submit.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Infinite scroll virtualization | Custom VirtualizedList or RecyclerListView | `@shopify/flash-list` | Flash-recycled cells, bidirectional scroll, built-in `getItemType` — not worth rebuilding |
| Media compression | Canvas API / custom resize | `expo-image-manipulator` | Handles EXIF rotation, platform-specific codecs, proper resize algorithm |
| Media library picker | Custom file input | `expo-image-picker` | Handles iOS PHAsset / Android MediaStore APIs, multi-select, permissions gracefully |
| Optimistic like state | Local useState per card | TanStack Query `onMutate` rollback pattern | Cache-level optimism handles concurrent mutations correctly; useState creates stale state when query refetches |
| Scale spring animation | requestAnimationFrame loop | `react-native-reanimated` `withSpring` | UI thread execution, no jank |
| Cursor pagination math | Manual offset arithmetic | Composite `(created_at, id)` cursor in PostgREST | Offset pagination drifts when new posts arrive; cursor is stable |
| Text search | LIKE queries | `pg_textsearch` GIN index + PostgREST `.textSearch()` | LIKE doesn't use indexes; BM25 ranking is more relevant; already indexed in schema |

**Key insight:** Every "don't hand-roll" item here has edge cases that took library authors months to solve — EXIF orientation, Android vs iOS media selection semantics, concurrent mutation rollback. Build to the constraint, not around it.

---

## Common Pitfalls

### Pitfall 1: posts_with_nickname View Not Applied to Migrations

**What goes wrong:** Developer implements queries against `posts` directly. Works in development, but global nickname leaks to users. Persona isolation is broken silently — no runtime error.

**Why it happens:** View is defined as raw SQL (`postsWithNicknameViewSql`) in content.ts but must be explicitly run as a migration. If the local Supabase instance was reset without applying this migration, the view doesn't exist.

**How to avoid:** In Wave 0, verify `SELECT * FROM posts_with_nickname LIMIT 1` runs without error. If it fails, run `supabase db reset` or manually apply the view SQL.

**Warning signs:** Query returning `author_nickname: null` instead of a community nickname string.

### Pitfall 2: react-native-reanimated Babel Plugin Missing

**What goes wrong:** `useAnimatedStyle` or `withSpring` throws at runtime: "Reanimated: Worklet runtime not found." App crashes on like tap.

**Why it happens:** Reanimated requires its Babel plugin to transform worklet functions at compile time. Missing from `babel.config.js` plugins array.

**How to avoid:** Add `'react-native-reanimated/plugin'` as the LAST item in the Babel plugins array. Clear Metro cache after: `npx expo start --clear`.

**Warning signs:** Any Reanimated import compiles but throws at runtime.

### Pitfall 3: FlashList Not Installed / Metro Cannot Resolve

**What goes wrong:** FlashList is in the ROADMAP spec but NOT in the current `package.json`. Importing `@shopify/flash-list` will cause Metro bundler to fail.

**Why it happens:** Phase 1/2 did not need it. Must be installed in Wave 0 of Phase 3.

**How to avoid:** Wave 0 plan must install all new packages before any screen implementation plan starts.

### Pitfall 4: Image+Video Both Selected in Composer

**What goes wrong:** `post_type` is a single text column — 'text' | 'image' | 'video'. If both images and video are present, the insert will store a conflicting type. `media_urls` is a text array, so you could accidentally insert both.

**Why it happens:** `expo-image-picker` allows switching between media types if not guarded.

**How to avoid:** In composer state, once images are selected, disable video picker button (and vice versa). Validate before submit: if `mediaUrls.length > 0 && postType !== 'image'` → show error.

### Pitfall 5: Cursor Pagination Drift on Sort=Popular

**What goes wrong:** When sorting by `like_count DESC`, the cursor must include `like_count` not just `created_at+id`. Otherwise after page 1, posts that received new likes between requests can appear twice or be skipped.

**Why it happens:** `created_at` cursor only works stably for chronological sort. Popularity sort has a mutable sort key.

**How to avoid:** For `sort=popular`, use offset pagination capped at 3 pages (45 posts). "Popular" is a snapshot view — deep pagination of popular posts has no UX value. Document this in the hook's JSDoc.

### Pitfall 6: Community Membership RLS Recursion on community_members SELECT

**What goes wrong:** The `community_members_select` RLS policy checks `EXISTS (SELECT 1 FROM community_members cm WHERE cm.community_id = ...)` — it's self-referential. In Supabase, this can cause infinite recursion if not using the `(select auth.uid())` wrapper.

**Why it happens:** Standard `auth.uid()` triggers per-row re-evaluation, which causes recursion in self-referential policies.

**How to avoid:** The existing schema already uses `(select auth.uid())` wrapper in all policies (confirmed in `community.ts`). Do not change this pattern. Any new policies added in Phase 3 MUST use the same wrapper.

### Pitfall 7: Supabase Storage Bucket Not Created

**What goes wrong:** Post creation fails silently at the upload step. `supabase.storage.from('post-media').upload(...)` returns "Bucket not found" error.

**Why it happens:** Storage buckets are not auto-created from Drizzle schema. They must be created manually in Supabase Dashboard or via migration SQL.

**How to avoid:** Wave 0 must create the `post-media` bucket. Use the Supabase CLI: `supabase storage create post-media` or via SQL: `INSERT INTO storage.buckets (id, name, public) VALUES ('post-media', 'post-media', true)`.

---

## Code Examples

Verified patterns from the project's own schemas and established conventions:

### Community Search with pg_textsearch

```typescript
// Source: ARCHITECTURE.md §4.4 + Supabase PostgREST textSearch docs
const { data } = await supabase
  .from('communities')
  .select('id, slug, name, description, cover_image_url, type, category, member_count')
  .textSearch('name', searchQuery, { type: 'websearch', config: 'simple' })
  .limit(20);
```

**Note:** `config: 'simple'` is used because the communities index uses `to_tsvector('simple', ...)` (ARCHITECTURE.md §4.4). Using `english` config would fail on Korean/Japanese community names.

### Join Community (Nickname Insert)

```typescript
// Source: packages/db/src/schema/community.ts RLS pattern + generate-nickname pattern from Phase 2
async function joinCommunity(communityId: string, userId: string, nickname: string) {
  const { error } = await supabase
    .from('community_members')
    .insert({
      user_id: userId,
      community_id: communityId,
      community_nickname: nickname,    // UNIQUE(community_id, nickname) enforced by DB
      role: 'member',
    });
  if (error) {
    if (error.code === '23505') throw new Error('NICKNAME_TAKEN');  // Unique constraint violation
    throw error;
  }
}
```

### Like Toggle Supabase Calls

```typescript
// UPSERT approach — idempotent
async function toggleLike(userId: string, targetType: 'post' | 'comment', targetId: string, isLiked: boolean) {
  if (isLiked) {
    await supabase.from('likes').delete()
      .eq('user_id', userId).eq('target_type', targetType).eq('target_id', targetId);
  } else {
    await supabase.from('likes').insert({ user_id: userId, target_type: targetType, target_id: targetId });
  }
}
// Note: likes PK is (user_id, target_type, target_id) — INSERT on duplicate returns 23505 naturally.
// The delete branch handles un-like. No UPSERT needed.
```

### Comment Thread Query (with Nickname)

```typescript
// Source: ARCHITECTURE.md comments table + community_members join pattern
const { data: comments } = await supabase
  .from('comments')
  .select(`
    id, post_id, parent_comment_id, content, author_role, is_creator_reply,
    like_count, created_at, author_id,
    author:community_members!inner(community_nickname, id)
  `)
  .eq('post_id', postId)
  .is('parent_comment_id', null)    // Top-level comments only first
  .order('created_at', { ascending: true });

// Fetch replies separately per top-level comment, or in a single query:
const { data: replies } = await supabase
  .from('comments')
  .select(`
    id, post_id, parent_comment_id, content, author_role, is_creator_reply,
    like_count, created_at, author_id,
    author:community_members!inner(community_nickname, id)
  `)
  .eq('post_id', postId)
  .not('parent_comment_id', 'is', null)
  .order('created_at', { ascending: true });
```

### Supabase Storage Bucket Setup (Wave 0 SQL)

```sql
-- Run via supabase migration or dashboard SQL editor
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-media',
  'post-media',
  true,
  52428800,   -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can upload to their own folder
CREATE POLICY "post_media_upload_own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'post-media'
  AND auth.uid()::text = (storage.foldername(name))[3]  -- path: communities/{id}/{user_id}/file
);

-- RLS: public read (since bucket is public)
CREATE POLICY "post_media_public_read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'post-media');
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| FlatList for large lists | FlashList | React Native ~0.71 era, 2023 | FlashList recycles cells on UI thread; FlatList re-renders in JS thread; 5x measured throughput improvement |
| `initialData: undefined` in useInfiniteQuery v4 | `initialPageParam: null` required in v5 | TanStack Query v5 (2023) | v4's `getNextPageParam(lastPage, pages)` signature → v5's `getNextPageParam(lastPage, allPages, lastPageParam)`. `initialPageParam` is now required, not inferred |
| Animated API for interactions | react-native-reanimated v3+ | RN New Architecture (2024) | Worklets run on UI thread; no JS-thread bridge; mandatory for smooth 60fps interactions on New Architecture |
| offset pagination | cursor-based pagination | Best practice for real-time feeds | Offset drifts when new content arrives between page loads; cursor is stable |

**Deprecated/outdated:**
- `serve` from `https://deno.land/std/http/server.ts` in Edge Functions: Use `Deno.serve()` instead (confirmed in STATE.md: generate-nickname already uses this)
- TanStack Query v4 `useInfiniteQuery` `nextPageParam` shape: v5 uses `initialPageParam` + new signature

---

## Open Questions

1. **`posts_with_nickname` view — is it applied to the local Supabase instance?**
   - What we know: The view is defined as raw SQL in `content.ts` (`postsWithNicknameViewSql`) and must be applied via migration
   - What's unclear: Whether the current local Supabase instance has this view live (Phase 1 migrations may have applied it)
   - Recommendation: Wave 0 of Plan 03-01 must verify `SELECT * FROM posts_with_nickname LIMIT 1` runs. If not, apply via `supabase db push` or manual SQL.

2. **`like_count` increment — DB trigger or client-side?**
   - What we know: `posts.like_count` and `comments.like_count` are integer columns. When a like is inserted/deleted, this count needs updating.
   - What's unclear: A DB trigger on the `likes` table to atomically increment/decrement is not mentioned in the current schema. Without it, `like_count` stays 0 unless manually updated.
   - Recommendation: Plan 03-04 must create a PostgreSQL trigger: `AFTER INSERT OR DELETE ON likes FOR EACH ROW EXECUTE FUNCTION update_like_count()`. Add as a Supabase migration.

3. **Supabase Storage `post-media` bucket — public vs signed URLs?**
   - What we know: Architecture doc specifies Supabase Storage with Signed URL capability. Public bucket is simpler.
   - What's unclear: Content rating (`content_rating` column exists) may require private media for 19+ content. For Phase 3 MVP, all posts are assumed general-rated.
   - Recommendation: Create `post-media` as PUBLIC for Phase 3. Phase 6 (Safety) can migrate to private + signed URLs when content moderation is implemented.

4. **`comment_count` on posts — same trigger question as like_count**
   - What we know: `posts.comment_count` integer exists. When comments are inserted/deleted, it needs updating.
   - What's unclear: No trigger defined in current schema.
   - Recommendation: Wave 0 of Plan 03-04 creates a `AFTER INSERT OR DELETE ON comments FOR EACH ROW` trigger to atomically update `posts.comment_count`.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 3.1.0 |
| Config file | `apps/mobile/vitest.config.ts` |
| Quick run command | `cd apps/mobile && pnpm test` |
| Full suite command | `cd apps/mobile && pnpm test:ci` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| COMM-01 | pg_textsearch community search returns matching results | unit | `cd apps/mobile && pnpm test -- community.test` | ❌ Wave 0 |
| COMM-03 | Nickname generation + uniqueness constraint | unit | `cd apps/mobile && pnpm test -- community.test` | ❌ Wave 0 |
| COMM-06 | Community leave removes membership record | unit | `cd apps/mobile && pnpm test -- community.test` | ❌ Wave 0 |
| FANF-01 | Post creates with fan author_role, correct community_id | unit | `cd apps/mobile && pnpm test -- post.test` | ❌ Wave 0 |
| FANF-04 | Cursor pagination returns correct page, stops at last page | unit | `cd apps/mobile && pnpm test -- feed.test` | ❌ Wave 0 |
| FANF-07 | Delete own post removes from query cache | unit | `cd apps/mobile && pnpm test -- post.test` | ❌ Wave 0 |
| INTC-04 | Like toggle inserts/deletes likes row, optimistic count updates | unit | `cd apps/mobile && pnpm test -- likes.test` | ❌ Wave 0 |
| INTC-01 | Comment creates with correct post_id and community nickname | unit | `cd apps/mobile && pnpm test -- comment.test` | ❌ Wave 0 |
| INTC-02 | Reply has non-null parent_comment_id; depth guard prevents further nesting | unit | `cd apps/mobile && pnpm test -- comment.test` | ❌ Wave 0 |
| MEMB-03 | Follow inserts community_follows row with correct cm_ids | unit | `cd apps/mobile && pnpm test -- follow.test` | ❌ Wave 0 |
| CREF-01 | Creator post insert fails if user's role is not 'creator' (RLS check) | integration/manual | Manual Supabase SQL test | manual-only |
| CREF-04 | CreatorBadge renders when author_role='creator' | unit | `cd apps/mobile && pnpm test -- PostCard.test` | ❌ Wave 0 |

> **Note on manual-only tests:** CREF-01 RLS enforcement requires a real Supabase auth context. Vitest with jsdom cannot replicate PostgreSQL RLS. Test manually via Supabase Studio or `psql` after Plan 03-03 implementation.

### Sampling Rate

- **Per task commit:** `cd apps/mobile && pnpm test`
- **Per wave merge:** `cd apps/mobile && pnpm test:ci`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `apps/mobile/tests/community.test.ts` — covers COMM-01, COMM-03, COMM-06
- [ ] `apps/mobile/tests/post.test.ts` — covers FANF-01, FANF-07
- [ ] `apps/mobile/tests/feed.test.ts` — covers FANF-04 (cursor pagination logic)
- [ ] `apps/mobile/tests/likes.test.ts` — covers INTC-04, INTC-05
- [ ] `apps/mobile/tests/comment.test.ts` — covers INTC-01, INTC-02, INTC-03
- [ ] `apps/mobile/tests/follow.test.ts` — covers MEMB-03
- [ ] `apps/mobile/tests/PostCard.test.tsx` — covers CREF-04 (CreatorBadge rendering)
- [ ] Supabase Storage bucket `post-media`: `INSERT INTO storage.buckets ...` migration
- [ ] DB triggers: `update_like_count()` + `update_comment_count()` trigger functions
- [ ] `posts_with_nickname` view verification: `SELECT * FROM posts_with_nickname LIMIT 1`
- [ ] Package installs: `@shopify/flash-list`, `expo-image`, `expo-image-picker`, `expo-image-manipulator`, `react-native-reanimated`
- [ ] `babel.config.js` update: add `react-native-reanimated/plugin`
- [ ] `app.json` update: add `expo-image-picker` plugin with permissions

---

## Sources

### Primary (HIGH confidence)

- `packages/db/src/schema/content.ts` — posts, comments, likes table definitions + RLS policies + postsWithNicknameViewSql
- `packages/db/src/schema/community.ts` — communities, communityMembers table definitions + RLS policies
- `packages/db/src/schema/artist-member.ts` — artistMembers definitions
- `packages/db/src/schema/follow.ts` — communityFollows definitions
- `docs/ARCHITECTURE.md` — ERD (§4.1), posts_with_nickname view (§4.3), index strategy (§4.4), API endpoints (§5.2), RLS examples (§6.3)
- `docs/WEVERSE-UI-UX-GUIDE.md` — Fan tab (§12), Artist tab (§13), Community join modal (§9.3), filter bar (§12.1), post card (§12.2)
- `.planning/phases/03-community-core-content/03-CONTEXT.md` — All locked decisions
- `.planning/phases/03-community-core-content/03-UI-SPEC.md` — Component inventory, interaction contracts, screen layout map, copywriting contract
- `apps/mobile/package.json` — Confirmed installed packages and versions
- `apps/mobile/vitest.config.ts` — Test infrastructure
- npm registry (2026-03-20) — @shopify/flash-list@2.3.0, expo-image@55.0.6, expo-image-picker@55.0.13, expo-image-manipulator@55.0.11, react-native-reanimated@4.2.2

### Secondary (MEDIUM confidence)

- TanStack Query v5 `useInfiniteQuery` `initialPageParam` requirement — verified against current installed version (5.90.21) package.json
- Supabase PostgREST `.textSearch()` with `type: 'websearch'` — standard Supabase client pattern, confirmed in supabase-js 2.x docs

### Tertiary (LOW confidence)

- Cursor pagination with `(created_at, id)` composite for PostgREST — widely documented pattern; exact filter syntax `lt('created_at', cursor).or(...)` should be validated against actual PostgREST behavior in Wave 0
- Storage RLS policy path matching with `storage.foldername(name)[3]` — verify against Supabase Storage docs before finalizing bucket setup

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages confirmed from npm registry on 2026-03-20; installed packages from actual package.json
- Architecture: HIGH — all patterns derived from existing project schema + established Phase 1/2 patterns in STATE.md
- Pitfalls: HIGH — all based on actual code in the repo (self-referential RLS confirmed in community.ts; view defined as raw SQL confirmed in content.ts; missing packages confirmed from package.json inspection)
- Test infrastructure: HIGH — vitest.config.ts and existing tests read directly from filesystem

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable Expo SDK 55 + Supabase stack; 30-day validity)

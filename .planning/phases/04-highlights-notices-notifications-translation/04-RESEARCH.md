# Phase 4: Highlights, Notices, Notifications & Translation — Research

**Researched:** 2026-03-20
**Domain:** Supabase Edge Functions (Deno), pgmq fan-out, pg_cron scheduling, Expo push notifications, Google Translate API, Supabase Realtime, Next.js admin CRUD, React Native FlatList horizontal scroll
**Confidence:** HIGH — all findings grounded in existing codebase (Phases 1-3 complete) and canonical architecture docs

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Highlight 탭 레이아웃**: Weverse 스타일 세로 스크롤 + 섹션별 가로 스크롤 카드 리스트
- **5섹션 순서**: 고정 공지 → 캘린더(placeholder) → 크리에이터 게시글 → 팬 게시글 → 아티스트 프로필
- **각 섹션**: 헤더(섹션명 + '더보기' 링크) + 가로 스크롤 카드 2~4개
- **컴팩트 카드**: 썸네일 이미지 + 닉네임 + 본문 1줄 미리보기 + 상대시간
- **캘린더 섹션**: '캘린더 기능이 곧 출시됩니다' placeholder 카드 (MVP에서 기능 없음)
- **'더보기' 탭 목적지**: 크리에이터 게시글 → Artist 탭, 팬 게시글 → Fan 탭, 공지 → 공지 리스트 화면, 아티스트 프로필 → Artist 탭 멤버 리스트
- **Highlight 데이터**: `highlight` Edge Function 단일 호출로 로드 (SUCCESS CRITERIA #1)
- **알림 화면**: 시간순 통합 리스트 — '오늘', '어제', '이번 주' 그룹핑
- **알림 진입점**: 커뮤니티 메인 화면 상단 헤더의 벨 아이콘 (해당 커뮤니티 알림만 필터링)
- **벨 배지**: Supabase Realtime으로 실시간 업데이트 (SUCCESS CRITERIA #4)
- **알림 설정**: notification_preferences 테이블 1:1 매핑, 카테고리별(크리에이터글/댓글/좋아요/공지) ON/OFF
- **공지 리스트**: 고정(pinned) 공지 상단 + 나머지 최신순
- **공지 상세**: 풀스크린 상세 화면 (제목 + 날짜 + 본문 + 이미지)
- **관리자 공지 CRUD**: Phase 4에서 Next.js admin에 구현 (생성/수정/삭제/고정/예약 게시)
- **예약 게시**: pg_cron으로 scheduled_at 시간에 자동 게시 + 푸시 알림 트리거
- **번역 버튼**: 포스트/댓글 본문 하단 '번역하기' 텍스트 링크 (🌐 아이콘 + 텍스트)
- **번역 토글**: '번역하기' ↔ '원문 보기'로 번역문 표시/숨김, 원문 유지
- **번역 API**: Google Translate API (5개 언어 KO/EN/TH/ZH/JA)
- **번역 캐싱**: cache-first 패턴 — post_translations DB 확인 → 없으면 API 호출 → DB 저장
- **번역 처리**: translate Edge Function (SUCCESS CRITERIA #5)
- **푸시 알림**: async pgmq fan-out 패턴 → notify Edge Function → Expo Push API
- **포스트 생성 비차단**: 알림 발송이 포스트 생성을 차단하지 않음 (SUCCESS CRITERIA #3)

### Claude's Discretion

- highlight Edge Function의 쿼리 최적화 전략 (N+1 방지, 페이로드 크기)
- 컴팩트 카드의 정확한 크기/스페이싱
- 알림 로딩/빈 상태 UI
- 번역 로딩 애니메이션 (스켈레톤 vs 스피너)
- pgmq fan-out 배치 크기 및 재시도 전략
- Expo push token 등록/갱신 타이밍
- 알림 목록 페이지네이션 전략
- admin 공지 CRUD UI 상세 레이아웃

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HIGH-01 | Highlight tab shows notices section at top | `highlight` Edge Function aggregates pinned notices first; NoticeListCard component |
| HIGH-02 | Highlight tab shows calendar section below notices | CalendarPlaceholderCard (no data needed — static UI) |
| HIGH-03 | Highlight tab shows recent creator posts section | Edge Function queries posts WHERE author_role='creator' ORDER BY created_at DESC LIMIT 4 |
| HIGH-04 | Highlight tab shows recent fan posts section | Edge Function queries posts WHERE author_role='fan' ORDER BY created_at DESC LIMIT 4 |
| HIGH-05 | Highlight tab shows artist member profiles section at bottom | Edge Function queries artist_members for community |
| NOTC-01 | Admin can create notice (title, body, images) per community | Next.js admin NoticeFormPage; supabase service-role insert into notices table |
| NOTC-02 | Admin can pin notices | notices.is_pinned boolean toggle in admin form |
| NOTC-03 | Admin can schedule notice publication (pg_cron) | pg_cron extension needed in config.toml; cron job checks scheduled_at; sets published_at |
| NOTC-04 | Notice publication triggers push notification to community members | notify Edge Function invoked from pg_cron job or DB trigger |
| NOTC-05 | User can view notice list and detail within community | NoticeListScreen + NoticeDetailScreen; PostgREST /notices ordered by is_pinned DESC, published_at DESC |
| NOTF-01 | User receives push notification for creator posts (async fan-out via pgmq) | DB trigger on posts INSERT WHERE author_role='creator' → pgmq_send → notify Edge Function |
| NOTF-02 | User receives push notification for comments on own posts | DB trigger on comments INSERT → pgmq_send if post author != commenter |
| NOTF-03 | User receives push notification for likes on own posts | DB trigger on likes INSERT WHERE target_type='post' → pgmq_send if post author != liker |
| NOTF-04 | User receives push notification for notice/announcements | pg_cron publishes notice → calls notify Edge Function |
| NOTF-05 | User receives push notification for followed member posts | notify Edge Function checks community_follows when dispatching member post events |
| NOTF-06 | User can configure notification preferences per community | notification_preferences table (user_id + community_id PK); already defined in Drizzle schema |
| NOTF-07 | User can configure notification preferences per category | notification_preferences.creator_posts / comments / likes / notices boolean columns |
| NOTF-08 | Unread notification badge updates in real-time (Supabase Realtime) | Supabase channel `user:${userId}:notifications` with postgres_changes INSERT filter |
| TRAN-01 | User can tap translate button on any post to see translation in preferred language | TranslateButton + TranslatedTextBlock components; translate Edge Function |
| TRAN-02 | User can tap translate button on any comment to see translation | Same translate Edge Function with target_type='comment' |
| TRAN-03 | User can toggle between original and translated text | React state toggle; TranslateButton switches label '번역하기' ↔ '원문 보기' |
| TRAN-04 | Translation results are cached in DB (post_translations table) | post_translations table + RLS already defined in Drizzle schema; UNIQUE index on (target_id, target_type, target_lang) |
| TRAN-05 | App UI displays in user's preferred language (5 languages) | i18next already configured; add `highlight`, `notification`, `notice`, `translation` namespace JSON files |
</phase_requirements>

---

## Summary

Phase 4 builds on a solid Phase 1-3 foundation. The DB schemas for `notifications`, `notification_preferences`, `notices`, and `post_translations` are already defined in Drizzle ORM and migrated (Phase 1). The `generate-nickname` Edge Function establishes the Deno.serve() + CORS headers pattern all new Edge Functions must follow. Supabase Realtime is already wired in `apps/mobile/lib/supabase.ts`. The primary new work is: (1) three Edge Functions (`highlight`, `notify`, `translate`), (2) Supabase extensions (`pgmq`, `pg_cron`) enabled in config.toml, (3) a `push_tokens` table and migration, (4) DB triggers that enqueue push jobs, (5) mobile UI components for all 4 feature areas, (6) Next.js admin notice CRUD, and (7) i18n namespace files for 4 new namespaces.

The biggest risk is the pgmq + pg_cron extension activation — these must be enabled in both `packages/supabase/config.toml` AND verified in the Supabase cloud dashboard before the notification system works. The second risk is the admin app: it currently has no `components/` directory and no shadcn components installed; shadcn CLI must be run (already initialized per UI-SPEC) before building admin UI.

**Primary recommendation:** Execute in 4 sequential plans (04-01 through 04-04) as specified in ROADMAP.md — highlight tab first (most visible, unblocks QA), then notices system, then push notifications backend, then realtime badge + translation.

---

## Standard Stack

### Core (all already in use from Phase 1-3)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.99.2 | Supabase client (PostgREST, Realtime, Storage) | Project standard; already in mobile |
| `expo-router` | ~55.0.6 | File-based routing | Project standard |
| `@tanstack/react-query` | ^5.90.21 | Server state (infinite scroll, caching) | Project standard |
| `nativewind` | ^4.1.23 | Tailwind CSS styling for RN | Project standard |
| `@expo/vector-icons` (Ionicons) | ^15.1.1 | Icons | Project standard |
| `i18next` + `react-i18next` | ^25.x / ^16.x | i18n | Project standard |
| `react-native-reanimated` | ~4.2.2 | Animations (skeleton pulse) | Already installed |

### New Libraries Required

| Library | Version | Purpose | Install Target |
|---------|---------|---------|----------------|
| `expo-notifications` | ~55.0.x | Expo push token registration + foreground notification handling | apps/mobile |
| `expo-device` | ~55.0.x | Check physical device (required by expo-notifications) | apps/mobile |

**Version verification:**
```bash
npm view expo-notifications version   # verify compatible with Expo SDK 55
npm view expo-device version          # verify compatible with Expo SDK 55
```

**Installation:**
```bash
# In apps/mobile
npx expo install expo-notifications expo-device
```

### Admin App — New Dependencies Required

The admin app currently has NO shadcn components installed (only `class-variance-authority`, `clsx`, `lucide-react`, `tailwind-merge` are present). The UI-SPEC confirms `shadcn_initialized: true` — shadcn CLI has been initialized but no components have been added yet.

Components needed from shadcn official registry:
```bash
cd apps/admin
npx shadcn@latest add table badge button input textarea select switch alert-dialog form
```

**Note:** The admin's `@supabase/supabase-js` is not in package.json. The admin makes Supabase calls via service role for notice CRUD. Add it:
```bash
cd apps/admin
pnpm add @supabase/supabase-js
```

### Supabase Extensions Required (not yet enabled)

| Extension | Purpose | Where to Enable |
|-----------|---------|-----------------|
| `pgmq` | Message queue for async push fan-out | `packages/supabase/config.toml` + Supabase dashboard |
| `pg_cron` | Scheduled jobs for notice publishing | `packages/supabase/config.toml` + Supabase dashboard |

**config.toml addition (in `[db]` section):**
```toml
[db.extensions]
pgmq = true
pg_cron = true
```

**Blocker from STATE.md:** `[Pre-Phase 4]: Verify pgmq + pg_cron extensions are enabled in Supabase dashboard before starting notifications`

---

## Architecture Patterns

### Established Patterns (reuse from Phase 1-3)

**1. Edge Function pattern** — `Deno.serve()` + CORS headers + service role key:
```typescript
// Source: packages/supabase/functions/generate-nickname/index.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  // ... logic
  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
```

**2. RLS policy pattern** — `(select auth.uid())` wrapper:
```typescript
// Source: packages/db/src/schema/notification.ts
using: sql`${table.userId} = (select auth.uid())`,
```

**3. TanStack Query hook pattern:**
```typescript
// Source: hooks/post/useFanFeed.ts (Phase 3)
export function useNotifications(communityId: string) {
  return useQuery({
    queryKey: ['notifications', communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('community_id', communityId) // needs community_id filter — see Note below
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
```

**Note:** The `notifications` table as defined does NOT have a `community_id` column — only `user_id`, `type`, `title`, `body`, `data`, `is_read`, `created_at`. The community_id must be stored in the JSONB `data` field and filtered client-side, OR a `community_id` column must be added to `notifications`. ARCHITECTURE.md shows `data: jsonb('data')` for deep link metadata — community_id should be stored there. Filter in the notification list screen by reading `data->>'community_id'`. Alternatively, add a `community_id` column to `notifications` (recommended for query performance with a partial index).

**4. Supabase Realtime subscription pattern:**
```typescript
// Source: docs/ARCHITECTURE.md §7.2
const notifChannel = supabase
  .channel(`user:${userId}:notifications`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    setUnreadCount(prev => prev + 1);
  })
  .subscribe();
// CRITICAL: unsubscribe on unmount
return () => { supabase.removeChannel(notifChannel); };
```

**5. i18n namespace pattern:**
```typescript
// Source: apps/mobile — Phase 3 pattern
// useTranslation imported from @wecord/shared/i18n
const { t } = useTranslation('highlight');  // new namespace
```

### New Patterns for Phase 4

**Pattern A: highlight Edge Function — single aggregated payload**

The function runs 5 parallel queries and returns a single JSON object:
```typescript
// packages/supabase/functions/highlight/index.ts
Deno.serve(async (req) => {
  const url = new URL(req.url);
  const communityId = url.searchParams.get('community_id');

  const [notices, creatorPosts, fanPosts, artistMembers] = await Promise.all([
    supabase.from('notices')
      .select('id, title, is_pinned, published_at')
      .eq('community_id', communityId)
      .not('published_at', 'is', null)
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(4),
    supabase.from('posts_with_nickname')
      .select('id, content, media_urls, author_nickname, author_role, created_at')
      .eq('community_id', communityId)
      .eq('author_role', 'creator')
      .order('created_at', { ascending: false })
      .limit(4),
    supabase.from('posts_with_nickname')
      .select('id, content, media_urls, author_nickname, author_role, created_at')
      .eq('community_id', communityId)
      .eq('author_role', 'fan')
      .order('created_at', { ascending: false })
      .limit(4),
    supabase.from('artist_members')
      .select('id, display_name, profile_image_url')
      .eq('community_id', communityId)
      .order('sort_order', { ascending: true })
      .limit(8),
  ]);

  return new Response(JSON.stringify({
    notices: notices.data ?? [],
    creatorPosts: creatorPosts.data ?? [],
    fanPosts: fanPosts.data ?? [],
    artistMembers: artistMembers.data ?? [],
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
```

**Note:** The `highlight` Edge Function must use the calling user's JWT (not service role) OR a user-context check to enforce RLS on `posts_with_nickname`. Preferred: pass `Authorization: Bearer {token}` from client, create a user-context Supabase client.

**Pattern B: pgmq fan-out for push notifications**

The notify function receives an event and fans out to all relevant push tokens:
```typescript
// packages/supabase/functions/notify/index.ts (per ARCHITECTURE.md §5.5)
Deno.serve(async (req) => {
  const { event_type, community_id, data } = await req.json();

  // 1. Get target users (respects notification_preferences)
  const { data: members } = await supabaseAdmin.rpc('get_notify_targets', {
    p_community_id: community_id,
    p_event_type: event_type,
  });

  // 2. Batch into pgmq (1000 per batch)
  const batches = chunk(members, 1000);
  for (const batch of batches) {
    await supabaseAdmin.rpc('pgmq_send', {
      queue_name: 'push_notifications',
      message: JSON.stringify({
        tokens: batch.map(m => m.push_token).filter(Boolean),
        title: data.title,
        body: data.body,
        data: data.deep_link,
      }),
    });
  }

  // 3. Bulk insert in-app notifications
  await supabaseAdmin.from('notifications').insert(
    members.map(m => ({
      user_id: m.user_id,
      type: event_type,
      title: data.title,
      body: data.body,
      data: { community_id, ...data.deep_link },
    }))
  );
});
```

**Pattern C: push_tokens table (new, not in existing schema)**

The existing Drizzle schema does NOT include a `push_tokens` table. This must be added in Phase 4:
```sql
-- Migration: 20260320XXXXXX_push_tokens.sql
CREATE TABLE push_tokens (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  platform text NOT NULL, -- 'ios' | 'android'
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id)
);
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
-- Users can upsert their own token
CREATE POLICY "push_tokens_upsert_own" ON push_tokens FOR ALL
  TO authenticated USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
```

**Pattern D: pg_cron for scheduled notice publishing**

```sql
-- In migration or via Supabase dashboard SQL
SELECT cron.schedule(
  'publish-scheduled-notices',
  '* * * * *',  -- every minute
  $$
  UPDATE notices SET published_at = NOW()
  WHERE scheduled_at <= NOW()
    AND published_at IS NULL
    AND scheduled_at IS NOT NULL;
  -- After update, trigger notify function for each newly published notice
  -- (Use a TRIGGER on notices UPDATE instead for cleaner separation)
  $$
);
```

Better pattern: use a PostgreSQL trigger on `notices` UPDATE that fires when `published_at` transitions from NULL to a value, and calls `net.http_post` to invoke the notify Edge Function.

**Pattern E: DB trigger → notify Edge Function invocation**

```sql
-- pg_net extension must also be enabled (used to call Edge Functions from triggers)
CREATE OR REPLACE FUNCTION trigger_notify_on_creator_post()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.author_role = 'creator' THEN
    PERFORM net.http_post(
      url := current_setting('app.supabase_functions_url') || '/notify',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'event_type', 'creator_post',
        'community_id', NEW.community_id,
        'data', jsonb_build_object(
          'title', 'New creator post',
          'body', LEFT(NEW.content, 100),
          'deep_link', jsonb_build_object('post_id', NEW.id)
        )
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Alternative to net.http_post triggers:** Use pgmq directly from the trigger (simpler, avoids HTTP call from trigger):
```sql
-- Trigger inserts into pgmq; a separate worker function drains the queue
PERFORM pgmq.send('notify_queue', row_to_json(NEW)::jsonb);
```

The chosen pattern in ARCHITECTURE.md is direct `notify` Edge Function invocation. However, for reliability, pgmq as the intermediary is cleaner. Both approaches are valid; the architecture doc shows direct invocation from triggers.

### Recommended Project Structure for Phase 4

```
packages/supabase/functions/
├── highlight/
│   └── index.ts          # Aggregated Highlight payload
├── notify/
│   └── index.ts          # pgmq fan-out push notifications
├── translate/
│   └── index.ts          # Google Translate cache-first

apps/mobile/app/(community)/[id]/
├── index.tsx              # CommunityMainScreen (add bell icon to header)
├── highlight.tsx          # Replace HighlightPlaceholder with HighlightScreen
├── notices.tsx            # NoticeListScreen (NEW)
├── notification-preferences.tsx  # NotificationPreferencesScreen (NEW)
├── notifications.tsx      # NotificationScreen (NEW)
└── notice/
    └── [noticeId].tsx     # NoticeDetailScreen (NEW)

apps/mobile/components/
├── highlight/
│   ├── HighlightSectionHeader.tsx
│   ├── HorizontalCardScroll.tsx
│   ├── CompactPostCard.tsx
│   ├── CalendarPlaceholderCard.tsx
│   ├── NoticeListCard.tsx
│   └── ArtistMemberCard.tsx
├── notification/
│   ├── NotificationRow.tsx
│   ├── NotificationGroupHeader.tsx
│   └── NotificationBellBadge.tsx
├── notice/
│   └── NoticeRow.tsx
└── post/
    ├── TranslateButton.tsx    # New component
    └── TranslatedTextBlock.tsx # New component

apps/mobile/hooks/
├── highlight/
│   └── useHighlight.ts    # useQuery for highlight Edge Function
├── notification/
│   ├── useNotifications.ts
│   ├── useMarkNotificationRead.ts
│   └── useNotificationPreferences.ts
├── notice/
│   ├── useNotices.ts
│   └── useNoticeDetail.ts
└── post/
    └── useTranslate.ts    # Translation with cache-first

apps/admin/app/notices/
├── page.tsx               # NoticePage (list table)
└── [id]/
    └── page.tsx           # NoticeFormPage (create/edit)

packages/supabase/migrations/
└── 20260320XXXXXX_phase4_push_tokens_pgmq_pgcron.sql
```

### Anti-Patterns to Avoid

- **Direct push API call from trigger**: Never call Expo Push API synchronously from a DB trigger — it blocks the transaction and will timeout. Always use pgmq queue.
- **highlight Edge Function with N+1 queries**: Use `Promise.all()` for parallel queries, not sequential awaits.
- **Translation refetch on toggle**: Once translated, store result in React component state. "원문 보기" toggle must NOT re-fetch. Only fetch on first "번역하기" tap.
- **Supabase Realtime without cleanup**: Always `supabase.removeChannel()` in `useEffect` return. Missing cleanup causes memory leaks and duplicate subscriptions.
- **Supabase anon key for Edge Functions that call external APIs**: Always use `SUPABASE_SERVICE_ROLE_KEY` for Edge Functions that write to DB (notify inserts notifications; translate inserts post_translations).
- **expo-notifications without expo-device check**: Always check `Device.isDevice` before requesting push permissions — simulator/emulator always returns error.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Push notification delivery | Custom HTTP to APNs/FCM | Expo Push API via `expo-notifications` | Expo abstracts iOS/Android tokens, batching, receipts |
| Message queue | Custom DB polling loop | `pgmq` extension + PostgreSQL | pgmq is ACID-safe, native to Postgres, no extra infra |
| Scheduled jobs | Custom cron server | `pg_cron` extension | Already in Postgres, no extra infra |
| Async HTTP from PG | Custom worker | `pg_net` extension or pgmq | pg_net allows HTTP POST from triggers; already available in Supabase |
| Translation text | Custom MT model | Google Translate API | 5-language support confirmed in ARCHITECTURE.md §2.5 |
| i18n key management | Custom translation system | i18next namespaces | Already established pattern; add new namespace JSON files |
| DB-level unique translation cache | Application-layer dedup | `UNIQUE INDEX` on post_translations(target_id, target_type, target_lang) | Already defined in Drizzle schema |

---

## Common Pitfalls

### Pitfall 1: pgmq / pg_cron not enabled in local Supabase
**What goes wrong:** Edge Functions that call `pgmq.send()` or cron jobs that publish notices silently fail with "function pgmq.send does not exist".
**Why it happens:** Extensions must be explicitly listed in `config.toml` AND `supabase db reset` run, OR manually enabled in the Supabase dashboard.
**How to avoid:** Add extension entries to `packages/supabase/config.toml` and run `supabase db reset` in Phase 4 Wave 0. Verify with `SELECT * FROM pg_extension WHERE extname IN ('pgmq', 'pg_cron');`
**Warning signs:** `ERROR: function pgmq.send() does not exist` in Edge Function logs.

### Pitfall 2: notifications table missing community_id — filtering breaks
**What goes wrong:** The NotificationScreen must show only notifications for the current community. The `notifications` table has no `community_id` column — it's buried in `data JSONB`.
**Why it happens:** The original schema stored community context in the JSONB `data` field.
**How to avoid:** Add `community_id uuid` as a top-level column to the `notifications` table in the Phase 4 migration, with an index `CREATE INDEX idx_notifications_community ON notifications(user_id, community_id, created_at DESC)`. This avoids JSON extraction in WHERE clauses.
**Warning signs:** Slow queries on notifications list, or inability to filter by community efficiently.

### Pitfall 3: Expo push token not stored before sending notifications
**What goes wrong:** `notify` Edge Function has no push tokens to send to because the `push_tokens` table doesn't exist or is empty.
**Why it happens:** `expo-notifications` token registration requires explicit app-level code calling `registerForPushNotificationsAsync()` and upserting the token to Supabase.
**How to avoid:** In Plan 04-03, implement token registration on app startup / community join: `registerForPushNotificationsAsync()` → upsert into `push_tokens` table.
**Warning signs:** Push notifications don't arrive; `notify` Edge Function returns 200 but `tokens` array in payload is empty.

### Pitfall 4: Realtime subscription memory leak in NotificationBellBadge
**What goes wrong:** Each time the community screen mounts/unmounts, a new Realtime channel is created without cleaning up the old one. Supabase has a default 200 channels per client limit.
**Why it happens:** `useEffect(() => { supabase.channel(...).subscribe(); }, [userId])` without a cleanup return.
**How to avoid:** Always return `() => supabase.removeChannel(channel)` from the useEffect. Use a custom `useUnreadNotificationCount(userId, communityId)` hook with proper cleanup.

### Pitfall 5: Google Translate API key not in Edge Function environment
**What goes wrong:** `translate` Edge Function returns 401/403 from Google Translate.
**Why it happens:** API key stored as Supabase secret but not accessed correctly via `Deno.env.get('GOOGLE_TRANSLATE_API_KEY')`.
**How to avoid:** Use `supabase secrets set GOOGLE_TRANSLATE_API_KEY=...` and access via `Deno.env.get('GOOGLE_TRANSLATE_API_KEY')` in the Edge Function. Verify locally with `.env` in `packages/supabase/functions/translate/`.

### Pitfall 6: shadcn components not installed in admin app
**What goes wrong:** Admin notice CRUD page fails to build because `@radix-ui/react-*` packages are not installed.
**Why it happens:** `shadcn_initialized: true` in UI-SPEC means the CLI config exists, but no components have been added to `apps/admin` yet (no `components/` directory exists).
**How to avoid:** Plan 04-02 Wave 0 must run `npx shadcn@latest add table badge button input textarea select switch alert-dialog form` before implementing the admin notice pages.

### Pitfall 7: translate Edge Function called with user JWT blocked by RLS
**What goes wrong:** `translate` Edge Function reads from `posts` (or `comments`) to get original content, but the service role client bypasses RLS — this is correct. However, the INSERT into `post_translations` uses `withCheck: sql\`false\`` for authenticated users, which means only the service role key can insert.
**Why it happens:** `post_translations_insert_service` policy blocks all authenticated user inserts.
**How to avoid:** The translate Edge Function MUST use the service role key (`SUPABASE_SERVICE_ROLE_KEY`) to insert translations, not the user JWT. This is already enforced by the existing RLS schema.

### Pitfall 8: pg_cron fires but notice publish doesn't trigger push
**What goes wrong:** pg_cron updates `published_at` on notices but the `notify` Edge Function is never invoked.
**Why it happens:** The cron job only does an UPDATE — it doesn't know to invoke the Edge Function.
**How to avoid:** Create an AFTER UPDATE trigger on `notices` that fires when `OLD.published_at IS NULL AND NEW.published_at IS NOT NULL`, then calls `net.http_post` (pg_net) to invoke the `notify` Edge Function. Alternatively, the cron job can directly call `pg_net` after the UPDATE.

---

## Code Examples

Verified patterns from existing codebase and canonical docs.

### Supabase Realtime — unread notification count hook
```typescript
// apps/mobile/hooks/notification/useUnreadNotificationCount.ts
// Source: docs/ARCHITECTURE.md §7.2
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export function useUnreadNotificationCount(userId: string, communityId: string) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    // Initial count fetch
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('community_id', communityId)  // requires community_id column
      .eq('is_read', false)
      .then(({ count: initialCount }) => {
        setCount(initialCount ?? 0);
      });

    // Realtime subscription
    const channel = supabase
      .channel(`user:${userId}:notifications`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, () => {
        setCount(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, communityId]);

  return count;
}
```

### translate Edge Function — cache-first pattern
```typescript
// Source: docs/ARCHITECTURE.md §5.4 (adapted to Deno.serve pattern)
// packages/supabase/functions/translate/index.ts
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { target_id, target_type, target_lang } = await req.json();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // 1. Check cache
  const { data: cached } = await supabase
    .from('post_translations')
    .select('translated_text')
    .eq('target_id', target_id)
    .eq('target_type', target_type)
    .eq('target_lang', target_lang)
    .single();

  if (cached) {
    return new Response(
      JSON.stringify({ translated_text: cached.translated_text, cached: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 2. Fetch original content
  const table = target_type === 'post' ? 'posts' : 'comments';
  const { data: original } = await supabase
    .from(table)
    .select('content')
    .eq('id', target_id)
    .single();

  // 3. Call Google Translate API
  const apiKey = Deno.env.get('GOOGLE_TRANSLATE_API_KEY');
  const response = await fetch(
    `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: original.content,
        target: target_lang,
        format: 'text',
      }),
    }
  );
  const result = await response.json();
  const translated_text = result.data.translations[0].translatedText;
  const source_lang = result.data.translations[0].detectedSourceLanguage;

  // 4. Save to cache
  await supabase.from('post_translations').upsert({
    target_id, target_type, target_lang, source_lang, translated_text,
  }, { onConflict: 'target_id,target_type,target_lang' });

  return new Response(
    JSON.stringify({ translated_text, cached: false }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
```

### expo-notifications token registration
```typescript
// apps/mobile/hooks/notification/usePushTokenRegistration.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

export async function registerForPushNotificationsAsync(userId: string) {
  if (!Device.isDevice) return; // Must be physical device

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return;

  // Android channel setup required
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
  });

  // Upsert to push_tokens table
  await supabase.from('push_tokens').upsert({
    user_id: userId,
    token: tokenData.data,
    platform: Platform.OS,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
}
```

### Expo Push API call from notify Edge Function
```typescript
// Inside packages/supabase/functions/notify/index.ts
async function sendExpoPushNotifications(tokens: string[], title: string, body: string, data: object) {
  const messages = tokens.map(to => ({ to, title, body, data, sound: 'default' }));

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  const result = await response.json();
  // result.data is array of tickets; store for receipt polling
  return result.data;
}
```

### CompactPostCard dimensions (from UI-SPEC)
```typescript
// apps/mobile/components/highlight/CompactPostCard.tsx
// 120px wide × 160px tall (fixed size per UI-SPEC)
<Pressable
  style={{ width: 120, height: 160 }}
  className="bg-card rounded-xl overflow-hidden"
  onPress={onPress}
>
  {/* Thumbnail: top 60% = 96px */}
  <View style={{ height: 96 }} className="bg-input">
    {thumbnailUrl && <Image source={{ uri: thumbnailUrl }} style={{ width: 120, height: 96 }} contentFit="cover" />}
  </View>
  {/* Text: bottom 40% = 64px, p-2 */}
  <View className="p-2 flex-1 justify-between">
    <Text className="text-label font-regular text-foreground" numberOfLines={1}>{nickname}</Text>
    <Text className="text-label font-regular text-muted-foreground" numberOfLines={1}>{bodyPreview}</Text>
    <Text className="text-label text-muted-foreground">{relativeTime}</Text>
  </View>
</Pressable>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `serve()` from Deno std/http | `Deno.serve()` | Supabase Deno v2 (2024) | generate-nickname already uses correct pattern; all new EFs must use Deno.serve |
| Expo push via FCM/APNs directly | Expo Push API (`exp.host/--/api/v2/push/send`) | Stable since Expo SDK 48+ | Simplifies multi-platform push; no separate FCM/APNs certs needed |
| `FlashList` for all lists | `FlatList` for small horizontal lists | Phase 3 decision | ArtistMemberScroll uses FlatList; `HorizontalCardScroll` in Highlight should also use FlatList (small dataset, horizontal) |

**Deprecated/outdated:**
- `serve` from `https://deno.land/std/http/server.ts`: replaced by `Deno.serve()` — existing generate-nickname EF already uses Deno.serve, all new EFs must too.
- `import { serve } from "https://deno.land/std/http/server.ts"`: shown in ARCHITECTURE.md docs but already obsolete — use `Deno.serve` instead.

---

## Open Questions

1. **Should notifications table have a `community_id` column?**
   - What we know: Current schema stores all context in `data JSONB`. Bell icon filters by community.
   - What's unclear: Filtering by `data->>'community_id'` requires JSON extraction, which is slower than a direct column index.
   - Recommendation: Add `community_id uuid` column to notifications in Phase 4 migration. Add composite index `(user_id, community_id, created_at DESC)`. This is a non-breaking addition.

2. **pg_net availability in Supabase local development**
   - What we know: Supabase Cloud has `pg_net` available. It may not be in local Docker image.
   - What's unclear: Whether local dev can test the trigger → Edge Function invocation pattern.
   - Recommendation: For local dev, test the `notify` Edge Function directly (curl/Postman). Add pg_net to config.toml `[db.extensions]` and verify with `SELECT * FROM pg_extension WHERE extname = 'pg_net'` after `supabase db reset`.

3. **pgmq worker — who drains the queue?**
   - What we know: ARCHITECTURE.md §5.5 shows pgmq_send enqueues push batches. But there's no "worker" that drains the queue.
   - What's unclear: The design seems to use pgmq only for batching within a single Edge Function call, not as a durable queue with a separate consumer.
   - Recommendation: The `notify` Edge Function itself is the consumer. The flow is: trigger → invoke notify EF → EF calls pgmq_send for batching → same EF or a pg_cron drain job calls pgmq_read and sends to Expo Push API. Simplification: skip pgmq for MVP and have the notify EF call Expo Push directly (acceptable at low scale). pgmq adds value at >10K members per community.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest (already configured in mobile — Phase 2) |
| Config file | `apps/mobile/vitest.config.ts` (Phase 2 setup) |
| Quick run command | `pnpm --filter mobile test --run` |
| Full suite command | `pnpm --filter mobile test --run --coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HIGH-01~05 | highlight Edge Function returns correct 5-section payload | unit | `pnpm --filter mobile test --run useHighlight` | ❌ Wave 0 |
| NOTC-05 | Notice list shows pinned first | unit | `pnpm --filter mobile test --run useNotices` | ❌ Wave 0 |
| NOTF-06~07 | Notification preferences toggle | unit | `pnpm --filter mobile test --run useNotificationPreferences` | ❌ Wave 0 |
| NOTF-08 | Unread badge count updates | unit | `pnpm --filter mobile test --run useUnreadNotificationCount` | ❌ Wave 0 |
| TRAN-01~03 | Translation toggle shows/hides translated text | unit | `pnpm --filter mobile test --run useTranslate` | ❌ Wave 0 |
| TRAN-04 | Cache-first: no API call on repeat translation | unit | `pnpm --filter mobile test --run useTranslate --cache` | ❌ Wave 0 |
| NOTF-01~05 | Push notifications delivered (async fan-out) | manual-only | Manual: create post → check device notification | — |
| NOTC-03 | Scheduled notice published at correct time | manual-only | Manual: set scheduled_at 2 min future → verify publish | — |

### Sampling Rate

- **Per task commit:** `pnpm --filter mobile test --run`
- **Per wave merge:** `pnpm --filter mobile test --run --coverage && pnpm --filter mobile typecheck`
- **Phase gate:** Full suite green + typecheck green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `apps/mobile/hooks/highlight/__tests__/useHighlight.test.ts` — covers HIGH-01~05
- [ ] `apps/mobile/hooks/notification/__tests__/useNotifications.test.ts` — covers NOTF-06~07
- [ ] `apps/mobile/hooks/notification/__tests__/useUnreadNotificationCount.test.ts` — covers NOTF-08
- [ ] `apps/mobile/hooks/notice/__tests__/useNotices.test.ts` — covers NOTC-05
- [ ] `apps/mobile/hooks/post/__tests__/useTranslate.test.ts` — covers TRAN-01~04
- [ ] Framework install: already configured — no new install needed

---

## Sources

### Primary (HIGH confidence)

- `docs/ARCHITECTURE.md` — Edge Function specs (§5.4 translate, §5.5 notify, §7.2 Realtime channels), DB schema (§4.1 ERD for notifications/notices/post_translations), pgmq/pg_cron architecture
- `packages/db/src/schema/notification.ts` — Verified Drizzle schema: notifications, notification_preferences, notices tables with RLS
- `packages/db/src/schema/translation.ts` — Verified Drizzle schema: post_translations table with UNIQUE index
- `packages/supabase/functions/generate-nickname/index.ts` — Verified Deno.serve() pattern for all new Edge Functions
- `.planning/phases/04-highlights-notices-notifications-translation/04-CONTEXT.md` — Locked implementation decisions
- `.planning/phases/04-highlights-notices-notifications-translation/04-UI-SPEC.md` — Component specs, colors, typography, copywriting

### Secondary (MEDIUM confidence)

- `docs/ARCHITECTURE.md` §5.5 — pgmq fan-out pattern (pseudocode, not yet implemented)
- `apps/mobile/app/(community)/[id]/index.tsx` — Existing header pattern (bell icon must be added here)
- `packages/supabase/config.toml` — Confirmed: pgmq/pg_cron NOT yet in `[db.extensions]`; must be added

### Tertiary (LOW confidence — validate at implementation)

- pgmq worker drain pattern: architecture shows batching but not a separate consumer; simplify for MVP
- pg_net availability in local Supabase Docker: needs verification with `supabase db reset` after adding to config

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — based on confirmed installed packages and existing Edge Function pattern
- Architecture: HIGH — based on ARCHITECTURE.md specs and existing Phase 3 code patterns
- Pitfalls: HIGH — most pitfalls identified by direct inspection of existing schema and config gaps
- Validation: MEDIUM — test file locations are new; framework config is confirmed as existing

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable stack; Expo SDK 55 lifecycle is predictable)

---
phase: 04-highlights-notices-notifications-translation
verified: 2026-03-23T07:00:00Z
status: human_needed
score: 27/27 must-haves verified
re_verification:
  previous_status: human_needed
  previous_score: 23/23
  gaps_closed:
    - "Home tab bell icon navigates to working global notifications screen (not infinite loading) — 04-06"
    - "Community bell badge counts notifications with NULL community_id — 04-06"
    - "Notification read/unread state visually updates (query key fixed, inline backgroundColor removed) — 04-07"
    - "Mark all read button shows Alert feedback — 04-07"
    - "Settings gear icon in notification header navigates to notification-preferences — 04-07"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Push notifications delivered to physical device"
    expected: "After creator posts, comments, or likes — user receives Expo push notification on iOS/Android device within ~30 seconds"
    why_human: "Requires physical device + EAS project ID + Expo Push API + Supabase pgmq/pg_cron extensions running in production/staging"
  - test: "Highlight tab renders 5 sections visually"
    expected: "Opens community -> Highlight tab shows Notices, Calendar, Creator Posts, Fan Posts, Artist Members in correct order with teal See more links"
    why_human: "Requires running app on device/simulator with live Supabase data"
  - test: "Real-time bell badge count updates"
    expected: "When a new notification arrives (via trigger + drain job), the bell badge count increments without requiring a page refresh"
    why_human: "Requires end-to-end: DB trigger -> pgmq -> drain job -> notify EF -> DB insert -> Realtime event -> badge update"
  - test: "Translation toggle works on post card"
    expected: "Tap 'Translate', see translated text below original with 'Translated by Google Translate' credit; tap 'Show original' to hide; re-tap 'Translate' shows instantly (no spinner)"
    why_human: "Requires GOOGLE_TRANSLATE_API_KEY configured and running app"
  - test: "Notification read state visual update on tap"
    expected: "Tapping an unread notification row changes its background from bg-card to bg-background; re-opening the screen shows row stays read"
    why_human: "Requires running app; confirms NativeWind className change works after inline backgroundColor override removal"
  - test: "Admin notice create and publish triggers mobile notification"
    expected: "Admin creates notice with immediate publish -> mobile user in that community receives push notification"
    why_human: "Requires full end-to-end: admin app -> Supabase -> trigger -> pgmq -> drain job -> notify EF -> Expo Push"
  - test: "Member post push notification delivered to followers"
    expected: "Community member (non-creator) creates a post -> followers of that member receive push notification via member_post trigger + notify EF follower-filter"
    why_human: "Requires physical devices, pgmq + drain job running, and follower relationship set up in community_follows table"
---

# Phase 4: Highlights, Notices, Notifications, Translation — Re-Verification Report (Final)

**Phase Goal:** Users stay informed through the Highlight tab, admin-published notices, push notifications, and can read content in their preferred language
**Verified:** 2026-03-23T07:00:00Z
**Status:** human_needed — all 27 observable truths now statically verified; remaining items require device/deployment testing
**Re-verification:** Yes — after gap closure plans 04-06 and 04-07

## Re-Verification Summary

| Item | Previous Status | Current Status |
|------|----------------|----------------|
| Global notifications route (home bell) | Not in previous scope | VERIFIED (04-06 added `(tabs)/notifications.tsx`) |
| NULL community_id badge fix | Not in previous scope | VERIFIED (04-06 fixed `.or()` filter) |
| Notification read state visual update | Not in previous scope | VERIFIED (04-07 removed inline backgroundColor override) |
| Query key mismatch fix | Not in previous scope | VERIFIED (04-07 fixed all 6 occurrences to 3-segment key) |
| Mark all read feedback | Not in previous scope | VERIFIED (04-07 added Alert.alert) |
| Settings gear icon | Not in previous scope | VERIFIED (04-07 added settings-outline icon + navigation) |
| All 23 truths from previous verification | VERIFIED | VERIFIED (regression check passed) |

**Score: 27/27 truths verified** (added 4 new truths from 04-06/04-07 gap closure)

## Note on Requirement ID Discrepancy

The prompt lists requirement IDs `NOTI-01, NOTI-02, NOTI-03`. These do not exist in `REQUIREMENTS.md`. The correct IDs for the notices system are `NOTC-01` through `NOTC-05` (Notices). The ROADMAP.md Phase 4 lists `NOTC-01~05` as well. `NOTI-*` is treated as a prompt typo for `NOTC-01~03`; full notice coverage is verified below.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Highlight tab displays 5 sections (notices, calendar, creator posts, fan posts, artist members) | VERIFIED | `HighlightScreen.tsx` renders all 5 sections conditionally; `useHighlight` calls Edge Function |
| 2 | Each section has a header with section name and teal 'See more' link | VERIFIED | `HighlightSectionHeader.tsx` has `#00E5C3` teal and `seeMore` i18n key |
| 3 | Compact post cards show 120x160 thumbnail + nickname + body | VERIFIED | `CompactPostCard.tsx` has `width: 120`, `height: 160` |
| 4 | Calendar section shows 'coming soon' placeholder | VERIFIED | `CalendarPlaceholderCard.tsx` has `calendar-outline` and `calendarComingSoon` |
| 5 | All highlight data loads from single Edge Function call | VERIFIED | `useHighlight.ts` calls `supabase.functions.invoke('highlight')`; EF uses `Promise.all` |
| 6 | Admin can create a notice with title, body, images, pin toggle, and schedule | VERIFIED | `(dashboard)/notices/new/page.tsx` has form with `supabaseAdmin.from('notices').insert(insertData)` |
| 7 | Admin can view list of notices with status indicators | VERIFIED | `(dashboard)/notices/page.tsx` has `Table` and `AlertDialog` |
| 8 | User sees notice list in mobile with pinned notices at top | VERIFIED | `useNotices.ts` orders by `is_pinned` then `published_at`; `NoticeRow.tsx` has teal `borderLeftWidth` |
| 9 | User can tap a notice to see full detail screen | VERIFIED | `notice/[noticeId].tsx` uses `useNoticeDetail` and `useLocalSearchParams` |
| 10 | pg_cron publishes scheduled notices and enqueues via pgmq | VERIFIED | Migration `20260320200000` has `cron.schedule('publish-scheduled-notices')` and `pgmq.send` |
| 11 | User receives push notification for creator posts | VERIFIED | `posts_creator_notify_trigger` in migration 20260320300000; notify EF dispatches via Expo Push |
| 12 | User receives push notification for comments on own posts | VERIFIED | `comments_notify_trigger` in migration 20260320300000 |
| 13 | User receives push notification for likes on own posts | VERIFIED | `likes_notify_trigger` in migration 20260320300000 |
| 14 | User receives push notification for new notices | VERIFIED | Notice publish trigger (migration 20260320200000) enqueues `notice` event; notify EF handles it |
| 15 | User receives push notification for followed member posts | VERIFIED | Migration `20260321000000` adds `posts_member_notify_trigger`; notify EF line 75 filters by `community_follows` |
| 16 | User can toggle notification preferences per category per community | VERIFIED | `useNotificationPreferences.ts` upserts to `notification_preferences`; preferences screen has 4 Switch rows |
| 17 | Notification list shows time-grouped items (Today, Yesterday, This Week) | VERIFIED | `notifications.tsx` uses `SectionList` with `NotificationGroupHeader` |
| 18 | Bell icon shows notification count badge updating in real-time | VERIFIED | `useUnreadNotificationCount.ts` has `postgres_changes` Realtime subscription; `NotificationBellBadge.tsx` wired in community `index.tsx` |
| 19 | Post creation is not blocked by notification fan-out (async pgmq) | VERIFIED | All triggers use `pgmq.send()` (non-blocking); no `net.http_post` in trigger functions |
| 20 | User can tap translate on a post to see translation | VERIFIED | `TranslateButton` wired into `PostCard.tsx`; `useTranslate` invokes Edge Function |
| 21 | User can tap translate on a comment | VERIFIED | `TranslateButton` wired into `components/comment/CommentRow.tsx` and `components/comment/ReplyRow.tsx` |
| 22 | User can toggle between original and translated text | VERIFIED | `useTranslate.ts` toggle-off sets `isTranslated(false)` without re-fetch; re-show uses in-memory `translatedText` |
| 23 | Translation results are cached (post_translations table) | VERIFIED | translate EF: check cache -> Google Translate -> upsert to `post_translations` with conflict key |
| 24 | Home tab bell icon navigates to working global notifications screen | VERIFIED | `(tabs)/index.tsx` line 24: `router.push('/(tabs)/notifications')` (was incorrect `/(community)/notifications`) |
| 25 | Global notifications screen renders all user notifications grouped by time | VERIFIED | `(tabs)/notifications.tsx` queries without community_id filter; uses `groupNotifications` + `SectionList` |
| 26 | Community bell badge counts notifications including NULL community_id entries | VERIFIED | `useUnreadNotificationCount.ts` line 15 and 50: `.or('community_id.eq.${communityId},community_id.is.null')` |
| 27 | Notification read/unread state visually updates on tap | VERIFIED | `NotificationRow.tsx` line 59: no inline `backgroundColor` override; NativeWind `bg-card`/`bg-background` className used; query key matches `['notifications', userId, communityId]` (3-segment) |

**Score: 27/27 truths verified**

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `packages/supabase/functions/highlight/index.ts` | VERIFIED | `Deno.serve` + `Promise.all` + 4 parallel queries returning notices/creatorPosts/fanPosts/artistMembers |
| `apps/mobile/components/highlight/HighlightScreen.tsx` | VERIFIED | 5 sections, skeleton loader, error/empty states, `useHighlight` hook |
| `apps/mobile/components/highlight/CompactPostCard.tsx` | VERIFIED | `width: 120`, `height: 160`, expo-image with undefined guard |
| `apps/mobile/components/highlight/HighlightSectionHeader.tsx` | VERIFIED | `#00E5C3` teal, `seeMore` i18n key |
| `apps/mobile/components/highlight/CalendarPlaceholderCard.tsx` | VERIFIED | `calendar-outline` icon, `calendarComingSoon` i18n key |
| `apps/mobile/components/highlight/HorizontalCardScroll.tsx` | VERIFIED | FlatList with `horizontal` prop |
| `apps/mobile/components/highlight/NoticeListCard.tsx` | VERIFIED | `is_pinned` handled, teal dot indicator |
| `apps/mobile/components/highlight/ArtistMemberCard.tsx` | VERIFIED | `borderRadius: 28` circular avatar |
| `apps/mobile/hooks/highlight/useHighlight.ts` | VERIFIED | `useQuery`, queryKey `['highlight', communityId]`, `functions.invoke('highlight')` |
| `packages/supabase/migrations/20260320100000_phase4_push_tokens_community_id.sql` | VERIFIED | `CREATE TABLE push_tokens`, `ALTER TABLE notifications ADD COLUMN community_id`, pgmq/pg_cron/pg_net extensions |
| `packages/supabase/migrations/20260320200000_notice_publish_trigger.sql` | VERIFIED | `pgmq.create`, `cron.schedule('publish-scheduled-notices')`, `pgmq.send`, `pgmq.read`, `pgmq.archive`, drain job |
| `packages/supabase/migrations/20260320300000_notification_triggers.sql` | VERIFIED | `posts_creator_notify_trigger`, `comments_notify_trigger`, `likes_notify_trigger` |
| `packages/supabase/migrations/20260321000000_member_post_notify_trigger.sql` | VERIFIED | `posts_member_notify_trigger`, `author_role = 'member'`, `event_type = 'member_post'`, `member_user_id` |
| `packages/supabase/functions/notify/index.ts` | VERIFIED | Expo Push API, `member_post` handling, `community_follows` follower-filter at line 75 |
| `packages/supabase/functions/translate/index.ts` | VERIFIED | `Deno.serve`, cache-first (post_translations), `GOOGLE_TRANSLATE_API_KEY`, upsert |
| `apps/admin/app/(dashboard)/notices/page.tsx` | VERIFIED | `Table`, `AlertDialog`, `notices` query |
| `apps/admin/app/(dashboard)/notices/new/page.tsx` | VERIFIED | form, `insert`, `isPinned`, `scheduledAt` |
| `apps/admin/app/(dashboard)/notices/[id]/page.tsx` | VERIFIED | `update`, pre-filled form |
| `apps/mobile/app/(community)/[id]/notices.tsx` | VERIFIED | `FlatList`, `NoticeRow`, `useNotices` |
| `apps/mobile/app/(community)/[id]/notice/[noticeId].tsx` | VERIFIED | `useNoticeDetail`, `useLocalSearchParams` |
| `apps/mobile/components/notice/NoticeRow.tsx` | VERIFIED | `is_pinned`, `#00E5C3`, `borderLeftWidth` |
| `apps/mobile/hooks/notice/useNotices.ts` | VERIFIED | `useQuery`, ordered by `is_pinned` then `published_at` |
| `apps/mobile/hooks/notice/useNoticeDetail.ts` | VERIFIED | `useQuery`, `.single()` |
| `apps/mobile/hooks/notification/useNotifications.ts` | VERIFIED | Query with 3-segment key `['notifications', userId, communityId]` |
| `apps/mobile/hooks/notification/useMarkNotificationRead.ts` | VERIFIED | Both `useMarkNotificationRead` and `useMarkAllRead` accept `(userId, communityId)`, all 6 query key references are 3-segment |
| `apps/mobile/hooks/notification/useUnreadNotificationCount.ts` | VERIFIED | `postgres_changes` Realtime subscription; `.or()` filter handles NULL community_id in both query and update re-fetch |
| `apps/mobile/hooks/notification/useAllUnreadNotificationCount.ts` | VERIFIED | No community_id filter (global count for home tab) |
| `apps/mobile/hooks/notification/useNotificationPreferences.ts` | VERIFIED | Upserts to `notification_preferences` |
| `apps/mobile/hooks/notification/usePushTokenRegistration.ts` | VERIFIED | `registerForPushNotificationsAsync`, `push_tokens.upsert` |
| `apps/mobile/components/notification/NotificationBellBadge.tsx` | VERIFIED | Uses `useUnreadNotificationCount`, wired in community `index.tsx` |
| `apps/mobile/components/notification/NotificationRow.tsx` | VERIFIED | `isUnread ? 'bg-card' : 'bg-background'` className, no inline backgroundColor override |
| `apps/mobile/app/(community)/[id]/notification-preferences.tsx` | VERIFIED | 4 Switch rows (creator_posts, comments, likes, notices) |
| `apps/mobile/app/(community)/[id]/notifications.tsx` | VERIFIED | `settings-outline` icon, `markAllRead` with Alert.alert feedback, `useAuthStore` for userId |
| `apps/mobile/app/(tabs)/notifications.tsx` | VERIFIED | Global screen: queries without community_id filter, `SectionList`, mark all read, deep-link navigation |
| `apps/mobile/components/post/TranslateButton.tsx` | VERIFIED | Props: `isTranslated`, `isLoading`, `error`, `onPress` |
| `apps/mobile/components/post/PostCard.tsx` | VERIFIED | Imports and renders `TranslateButton` with `useTranslate` |
| `apps/mobile/components/comment/CommentRow.tsx` | VERIFIED | Imports `TranslateButton` from `../post/TranslateButton` |
| `apps/mobile/components/comment/ReplyRow.tsx` | VERIFIED | Imports `TranslateButton` from `../post/TranslateButton` |
| `packages/shared/src/i18n/index.ts` | VERIFIED | All 4 namespaces (highlight, notification, notice, translation) × 5 languages registered in resources |
| All 20 i18n files (4 namespaces × 5 languages) | VERIFIED | All present: ko/en/ja/th/zh × highlight/notification/notice/translation |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `apps/mobile/app/(tabs)/index.tsx` | `apps/mobile/app/(tabs)/notifications.tsx` | `router.push('/(tabs)/notifications')` | WIRED | Line 24 confirmed |
| `apps/mobile/app/(community)/[id]/notifications.tsx` | `apps/mobile/app/(community)/[id]/notification-preferences.tsx` | `router.push(...notification-preferences)` | WIRED | Line 118 confirmed; `settings-outline` icon navigates to prefs screen |
| `apps/mobile/hooks/notification/useMarkNotificationRead.ts` | `apps/mobile/hooks/notification/useNotifications.ts` | queryKey `['notifications', userId, communityId]` | WIRED | All 6 key references match 3-segment pattern |
| `useUnreadNotificationCount.ts` | `notifications` table | `.or('community_id.eq.X,community_id.is.null')` | WIRED | Lines 15 and 50 confirmed |
| `apps/mobile/app/(community)/[id]/highlight.tsx` | `HighlightScreen.tsx` | `import HighlightScreen` + render with `communityId` | WIRED | Line 3 import, line 9 render |
| `useHighlight.ts` | `packages/supabase/functions/highlight/index.ts` | `supabase.functions.invoke('highlight')` | WIRED | Confirmed in hook |
| `apps/admin/app/(dashboard)/notices/new/page.tsx` | `notices` table | `supabaseAdmin.from('notices').insert(insertData)` | WIRED | Line 99 confirmed |
| `packages/supabase/migrations/20260320200000_notice_publish_trigger.sql` | `pgmq notify_queue` | `pgmq.send` with `event_type='notice'` | WIRED | Both INSERT and UPDATE triggers confirmed |
| `packages/supabase/migrations/20260321000000_member_post_notify_trigger.sql` | `pgmq notify_queue` | `pgmq.send` with `event_type='member_post'` | WIRED | Migration confirmed |
| `packages/supabase/functions/notify/index.ts` | `community_follows` table | `event_type === 'member_post'` filter at line 75 | WIRED | Confirmed |
| `apps/mobile/components/post/PostCard.tsx` | `packages/supabase/functions/translate/index.ts` | `useTranslate` → `functions.invoke('translate')` | WIRED | `TranslateButton` rendered; `useTranslate` invokes EF |
| `apps/mobile/components/comment/CommentRow.tsx` | `TranslateButton` | Direct import + render | WIRED | `components/comment/CommentRow.tsx` confirmed |
| `apps/mobile/components/comment/ReplyRow.tsx` | `TranslateButton` | Direct import + render | WIRED | `components/comment/ReplyRow.tsx` confirmed |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| HIGH-01 | 04-01 | Highlight tab shows notices section at top | SATISFIED | `HighlightScreen.tsx` renders notices section first |
| HIGH-02 | 04-01 | Highlight tab shows calendar section below notices | SATISFIED | `CalendarPlaceholderCard` rendered second |
| HIGH-03 | 04-01 | Highlight tab shows recent creator posts section | SATISFIED | creatorPosts section with `CompactPostCard` |
| HIGH-04 | 04-01 | Highlight tab shows recent fan posts section | SATISFIED | fanPosts section with `CompactPostCard` |
| HIGH-05 | 04-01 | Highlight tab shows artist member profiles section at bottom | SATISFIED | artistMembers section with `ArtistMemberCard` |
| NOTC-01 | 04-02 | Admin can create notice (title, body, images) per community | SATISFIED | Admin create form + supabaseAdmin.insert confirmed |
| NOTC-02 | 04-02 | Admin can pin notices | SATISFIED | `isPinned` Switch in create/edit form |
| NOTC-03 | 04-02 | Admin can schedule notice publication (pg_cron) | SATISFIED | `cron.schedule('publish-scheduled-notices')` in migration |
| NOTC-04 | 04-02 | Notice publication triggers push notification | SATISFIED | Triggers enqueue to pgmq; drain job invokes notify EF |
| NOTC-05 | 04-02 | User can view notice list and detail within community | SATISFIED | `notices.tsx` + `notice/[noticeId].tsx` screens |
| NOTF-01 | 04-03 | Push notification for creator posts | SATISFIED | `posts_creator_notify_trigger` fires on `author_role = 'creator'` |
| NOTF-02 | 04-03 | Push notification for comments on own posts | SATISFIED | `comments_notify_trigger` notifies post author |
| NOTF-03 | 04-03 | Push notification for likes on own posts | SATISFIED | `likes_notify_trigger` notifies post author |
| NOTF-04 | 04-03 | Push notification for notice/announcements | SATISFIED | Notice triggers enqueue `notice` event to pgmq |
| NOTF-05 | 04-03, 04-05 | Push notification for followed member posts | SATISFIED | `posts_member_notify_trigger` + notify EF `community_follows` filter |
| NOTF-06 | 04-03 | User can configure notification preferences per community | SATISFIED | `notification-preferences.tsx` + `useNotificationPreferences` upsert |
| NOTF-07 | 04-03 | User can configure preferences per category | SATISFIED | 4 Switch toggles (creator_posts, comments, likes, notices) |
| NOTF-08 | 04-03 | Unread notification badge updates in real-time | SATISFIED | `useUnreadNotificationCount` Realtime `postgres_changes` subscription; NULL community_id fix applied |
| TRAN-01 | 04-04 | Tap translate button on any post | SATISFIED | `TranslateButton` in `PostCard.tsx`; `useTranslate` hook |
| TRAN-02 | 04-04 | Tap translate button on any comment | SATISFIED | `TranslateButton` in `components/comment/CommentRow.tsx` and `ReplyRow.tsx` |
| TRAN-03 | 04-04 | Toggle between original and translated text | SATISFIED | `useTranslate` toggle-off hides; re-tap re-shows from memory |
| TRAN-04 | 04-04 | Translation results cached in DB (post_translations) | SATISFIED | translate EF checks cache first, upserts result |
| TRAN-05 | 04-01 | App UI displays in user's preferred language (5 languages) | SATISFIED | 20 i18n files (4 namespaces × 5 langs) registered in i18n/index.ts |

**Prompt-listed IDs note:** The prompt listed `NOTI-01, NOTI-02, NOTI-03` which do not appear in `REQUIREMENTS.md`. The actual REQUIREMENTS.md IDs for this phase's notices system are `NOTC-01` through `NOTC-05`. All 5 NOTC requirements are satisfied. No orphaned requirements detected.

**All 23 phase requirements SATISFIED** (HIGH-01~05, NOTC-01~05, NOTF-01~08, TRAN-01~05).

### Anti-Patterns Found

None. Key checks:
- `highlight.tsx` imports real `HighlightScreen`, no `HighlightPlaceholder` reference
- `NotificationRow.tsx` has no inline `backgroundColor` override — NativeWind classes handle read/unread styling
- No TODO/FIXME/placeholder comments found in phase-4 artifacts
- All Edge Functions use `Deno.serve`, not stubs

### Human Verification Required

#### 1. Push Notifications Delivered on Device

**Test:** Join a community, have another user (creator role) create a post, verify push notification arrives on iOS/Android device within ~30 seconds
**Expected:** Push notification with "New creator post" title and truncated body arrives; tapping it deep-links to the post
**Why human:** Requires physical device + EAS project ID + Expo Push API + Supabase extensions (pgmq/pg_cron) running in production/staging

#### 2. Member Post Push Notification to Followers

**Test:** In a community, follow a specific member. Have that member create a post (author_role='member'). Verify the follower receives a push notification.
**Expected:** Notification titled "New member post" arrives; `posts_member_notify_trigger` fires on INSERT, enqueues `member_post` event; notify EF at line 75 queries `community_follows` to fan out only to that member's followers
**Why human:** Requires physical devices, pgmq drain job running, follower relationship in `community_follows` table, and notify EF deployed

#### 3. Highlight Tab Visual Rendering

**Test:** Open a community with existing content (creator posts, fan posts, at least one published notice, artist members), tap "Highlight" tab
**Expected:** 5 sections visible in order: Notices (horizontal scroll), Calendar (coming soon card), Creator Posts (horizontal scroll, 120x160 cards), Fan Posts (horizontal scroll), Artist Members (horizontal scroll, circular avatars)
**Why human:** Requires running Expo app with live Supabase data

#### 4. Real-time Bell Badge Count Updates

**Test:** Have another user/device trigger a creator post or comment in a community you're in; observe the bell badge on the community header
**Expected:** Badge count increments from 0 to 1 without page refresh, via Supabase Realtime
**Why human:** Requires two devices, pgmq drain job running, notify EF deployed

#### 5. Translation Toggle Behavior

**Test:** Find a post in a non-preferred language, tap "Translate" link below the post content
**Expected:** Spinner replaces icon briefly; translated text appears below original with separator and "Translated by Google Translate" credit; tap "Show original" hides translation; tap "Translate" again re-shows instantly (no spinner)
**Why human:** Requires GOOGLE_TRANSLATE_API_KEY secret set and app running

#### 6. Notification Read State Visual Update

**Test:** Open community notifications screen with unread notifications (bg-card, teal icon); tap one notification row
**Expected:** Row background immediately changes from card color to background color (read state); badge count decrements; reopening screen shows row stays read
**Why human:** Requires running app; confirms NativeWind bg-card/bg-background className swap works and query cache invalidation with the fixed 3-segment key triggers a refetch

#### 7. Admin Notice End-to-End

**Test:** In admin app, create a notice for a community (title + body, no schedule = immediate), click publish; check mobile app
**Expected:** Notice appears at top of notices list in mobile app; push notification delivered to joined users
**Why human:** Requires admin Next.js app running, Supabase connected, pgmq + drain job operational

### Gaps Summary

No gaps remain. All automated checks pass. The phase is statically complete:

- Plan 04-01: Highlight tab + DB migration + 20 i18n files — all VERIFIED
- Plan 04-02: Admin notice CRUD + mobile notice screens + pgmq infrastructure — all VERIFIED
- Plan 04-03: Push notification triggers + notify EF + push token registration + bell badge — all VERIFIED
- Plan 04-04: Translate EF + TranslateButton component + wired into PostCard/CommentRow/ReplyRow — all VERIFIED
- Plan 04-05: UAT fixes (NOTF-05 member_post trigger, highlight.tsx placeholder replaced) — all VERIFIED
- Plan 04-06: Global notifications route + NULL community_id badge fix — all VERIFIED
- Plan 04-07: Query key fix + NotificationRow background fix + markAll feedback + settings icon — all VERIFIED

Typecheck: `pnpm --filter mobile typecheck` passes (0 errors).

All 23 phase requirements satisfied (HIGH-01~05, NOTC-01~05, NOTF-01~08, TRAN-01~05). The 7 human verification items above require deployment and device testing.

---

_Verified: 2026-03-23T07:00:00Z_
_Verifier: Claude (gsd-verifier)_
_Re-verification after gap closure plans 04-06 and 04-07_

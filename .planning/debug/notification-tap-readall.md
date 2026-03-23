---
status: investigating
trigger: "Tapping notification does nothing; Read all has no visual feedback"
created: 2026-03-23T00:00:00Z
updated: 2026-03-23T00:00:00Z
---

## Current Focus

hypothesis: Two independent bugs — (1) query key mismatch prevents optimistic update from being visible, (2) no toast/feedback after mark-all-read
test: Code review of query keys and UI feedback mechanisms
expecting: Mismatched keys cause stale cache; no feedback component exists
next_action: Document root causes and propose fixes

## Symptoms

expected: (1) Tapping a notification navigates to the related post/notice. (2) "Read all" button gives visual confirmation.
actual: (1) Tap does nothing visible. (2) Button works (data updates) but no user feedback.
errors: No error messages reported.
reproduction: Open notifications screen, tap any notification row; tap "Read all" button.
started: Since feature was implemented.

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-03-23T00:01
  checked: useNotifications.ts query key
  found: queryKey is `['notifications', user?.id, communityId]` (3-segment key)
  implication: Any cache operation must use the same 3-segment key to match

- timestamp: 2026-03-23T00:02
  checked: useMarkNotificationRead.ts query keys
  found: All cancelQueries/setQueryData/invalidateQueries use `['notifications', communityId]` (2-segment key, missing user?.id)
  implication: CRITICAL BUG — Optimistic updates write to a non-existent cache key. The real cache at `['notifications', userId, communityId]` is never updated. Mark-read mutations fire to Supabase correctly, but the UI cache is stale until a full refetch.

- timestamp: 2026-03-23T00:03
  checked: NotificationRow.tsx onPress prop
  found: onPress is wired correctly from parent — calls `handleNotificationPress(item)` which calls `markRead.mutate()` then `router.push()`
  implication: Navigation code IS present and looks correct. The handler fires, but the optimistic update goes to the wrong cache key so the UI does not visually reflect the read state change. Navigation itself (router.push) should still work independently of the cache bug. Need to verify route exists.

- timestamp: 2026-03-23T00:04
  checked: Expo Router file structure for post route
  found: `apps/mobile/app/(community)/[id]/post/[postId].tsx` EXISTS. Route is valid.
  implication: Navigation path `/(community)/${communityId}/post/${postId}` should resolve. The navigation may actually work but the lack of visual feedback (read state not changing) makes it seem like "nothing happens". OR there could be a subtle issue with the route path format.

- timestamp: 2026-03-23T00:05
  checked: notifications.tsx handleNotificationPress
  found: Checks `notification.data?.post_id` and `notification.data?.notice_id`
  implication: The edge function stores `data: { ...data.deep_link }` which includes `post_id` and `community_id` for posts, or `notice_id` and `community_id` for notices. This should work IF the `data` column is populated.

- timestamp: 2026-03-23T00:06
  checked: Edge function notify/index.ts line 101
  found: `data: { ...data.deep_link }` — spreads the deep_link object as the notification's `data` field
  implication: For a creator_post, `data` will be `{ post_id: "...", community_id: "..." }`. For a notice, `{ notice_id: "...", community_id: "..." }`. The mobile code checks `notification.data?.post_id` which matches. Data flow appears correct.

- timestamp: 2026-03-23T00:07
  checked: NotificationRow style — inline style vs className conflict
  found: Line 58: `backgroundColor: isUnread ? 'transparent' : 'transparent'` AND line 60: `className={isUnread ? 'bg-card' : 'bg-background'}`. Inline style always sets transparent, overriding the NativeWind className.
  implication: BUG — The background color distinction between read/unread is invisible because inline `backgroundColor: 'transparent'` overrides NativeWind's `bg-card` / `bg-background`. Even if optimistic update worked, the visual difference would still be masked.

- timestamp: 2026-03-23T00:08
  checked: "Read all" button handler and feedback
  found: `onPress={() => markAllRead.mutate()}` with no `.then()`, no toast, no alert, no animation. No toast/snackbar library installed in the project.
  implication: BUG — Mark-all-read fires silently. Even when the optimistic update takes effect (which it currently doesn't due to the key mismatch), there is no explicit success feedback like a toast or brief animation.

## Resolution

root_cause: |
  THREE root causes identified:

  1. **Query key mismatch (CRITICAL)**: `useNotifications` uses queryKey `['notifications', user?.id, communityId]` but `useMarkNotificationRead` and `useMarkAllRead` use `['notifications', communityId]`. The optimistic updates, cache cancellation, and invalidation all target a non-existent 2-segment key. The real data lives under the 3-segment key with `user?.id`. This means:
     - Optimistic updates are written to a phantom cache entry (never rendered)
     - `invalidateQueries` with the wrong key does NOT trigger a refetch
     - The UI stays stale after marking read — notifications keep showing as unread
     - After mark-all-read, all items still appear unread until manual screen re-entry

  2. **Inline backgroundColor overrides NativeWind class (VISUAL)**: `NotificationRow` line 58 sets `backgroundColor: 'transparent'` for both read and unread states via inline style. This overrides NativeWind's `bg-card` / `bg-background` className on line 60. Even if the cache were correct, the visual distinction between read/unread rows would be invisible.

  3. **No feedback for mark-all-read (UX)**: The "Read all" button calls `markAllRead.mutate()` with no success callback, no toast, no animation. The user has no way to know it worked.

fix: |
  1. Fix query keys in `useMarkNotificationRead.ts`: pass `userId` and use `['notifications', userId, communityId]` in all cache operations.
  2. Remove inline `backgroundColor` from `NotificationRow` so NativeWind classes take effect.
  3. Add visual feedback after mark-all-read (e.g., brief "Done" text swap or a lightweight toast).

verification:
files_changed: []

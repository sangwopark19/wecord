---
status: investigating
trigger: "Clicking notification bell from home tab causes infinite loading"
created: 2026-03-23T00:00:00Z
updated: 2026-03-23T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - Wrong navigation route causes community index screen to render with bogus ID, showing infinite spinner
test: Traced full route resolution and component rendering logic
expecting: N/A - root cause confirmed
next_action: Propose fix options to user

## Symptoms

expected: Notification list screen shows 8 notification records from DB
actual: Infinite loading spinner on notification list screen
errors: None reported (silent infinite load)
reproduction: Tap bell icon on home tab
started: Unknown

## Eliminated

- hypothesis: RLS policy blocks the notification query
  evidence: notifications RLS only checks user_id = auth.uid(), no community filter. Query would succeed for any valid auth session.
  timestamp: 2026-03-23T00:04:00Z

- hypothesis: useNotifications query has enabled=false due to empty communityId
  evidence: Route resolves id="notifications" (truthy string), so enabled would be true. But the notifications screen never renders anyway -- see root cause.
  timestamp: 2026-03-23T00:05:00Z

## Evidence

- timestamp: 2026-03-23T00:01:00Z
  checked: HomeNotificationBell in app/(tabs)/index.tsx line 24
  found: Bell navigates to `/(community)/notifications` -- a single segment path under (community)
  implication: This route does NOT reach [id]/notifications.tsx which needs two segments

- timestamp: 2026-03-23T00:02:00Z
  checked: Route file structure in app/(community)/
  found: Only files at (community)/ root are [id]/, _layout.tsx, compose.tsx, search.tsx. No top-level notifications.tsx.
  implication: Expo Router matches [id] catch-all, setting id="notifications"

- timestamp: 2026-03-23T00:03:00Z
  checked: Expo Router resolution logic for `/(community)/notifications`
  found: With file structure (community)/[id]/notifications.tsx, the path /(community)/notifications matches [id] with id="notifications" and renders index.tsx (not notifications.tsx)
  implication: The WRONG screen renders entirely

- timestamp: 2026-03-23T00:04:00Z
  checked: CommunityMainScreen ([id]/index.tsx) lines 251-263 and 284-289
  found: |
    Queries communities table: .eq('id', "notifications") -- invalid UUID
    Supabase returns error (malformed UUID) or null
    Guard condition: `if (isLoading || !community)` shows ActivityIndicator indefinitely
    After query fails, isLoading=false but community=null, so `!community` is true forever
  implication: This is the DIRECT cause of the infinite loading spinner

- timestamp: 2026-03-23T00:05:00Z
  checked: Community [id]/index.tsx line 336 (bell within community screen)
  found: The bell INSIDE a community correctly navigates to `/(community)/${id}/notifications` with the real community ID
  implication: Confirms the pattern -- the home tab bell is the only one with the wrong route

- timestamp: 2026-03-23T00:06:00Z
  checked: useNotifications hook query
  found: Does NOT filter by community_id in Supabase query, only by user_id. The communityId param is only used for queryKey and enabled check.
  implication: Secondary issue -- even when working, this returns ALL notifications, not community-scoped ones. Fine for a global view but inconsistent with being nested under [id].

## Resolution

root_cause: |
  The HomeNotificationBell in app/(tabs)/index.tsx navigates to the WRONG route.

  Line 24: `router.push('/(community)/notifications' as never)`

  This is a single-segment path that Expo Router resolves to [id]/index.tsx with id="notifications"
  (not [id]/notifications.tsx). The community index screen then queries for a community with
  id="notifications" (not a valid UUID), gets null, and shows an ActivityIndicator forever
  due to the guard: `if (isLoading || !community) return <ActivityIndicator />`.

  The correct two-segment path would be `/(community)/SOME_ID/notifications`, but since the
  home tab is cross-community (not scoped to one community), there is no single community ID
  to use.

  FIX OPTIONS:
  1. Create a new global notifications screen at app/(community)/notifications.tsx (or app/notifications.tsx)
     that shows all notifications without community scoping
  2. Create app/(tabs)/notifications.tsx as a top-level tab-accessible screen
  3. Reuse [id]/notifications.tsx but create a redirect that picks the user's first/active community

  RECOMMENDED: Option 1 -- create app/notifications.tsx as a standalone screen outside (community),
  since the home bell is conceptually "all notifications". Update the hook call to not require
  communityId (it already doesn't filter by it in the query).

fix:
verification:
files_changed: []

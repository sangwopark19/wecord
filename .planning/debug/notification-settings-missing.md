---
status: investigating
trigger: "Investigate why the notification settings screen is not visible/accessible"
created: 2026-03-23T00:00:00Z
updated: 2026-03-23T00:00:00Z
---

## Current Focus

hypothesis: The notification-preferences screen component exists but is unreachable because no navigation link/button points to it from anywhere in the app
test: Search entire codebase for any router.push or Link referencing notification-preferences
expecting: Zero references confirms the screen is orphaned
next_action: Add a settings icon button in the notifications screen header that navigates to notification-preferences

## Symptoms

expected: User should see a notification settings screen with 4 toggles (creator posts, comments, likes, notices) accessible from the notifications screen
actual: The notification settings screen is not visible or accessible at all
errors: None (no crash, just missing navigation path)
reproduction: Open the notifications screen inside any community - there is no way to reach the preferences screen
started: Likely since the notification-preferences screen was created - navigation was never wired up

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-03-23T00:01:00Z
  checked: File existence of notification-preferences screen
  found: File exists at apps/mobile/app/(community)/[id]/notification-preferences.tsx with all 4 toggles (creator_posts, comments, likes, notices) properly implemented
  implication: The screen component itself is complete and correct

- timestamp: 2026-03-23T00:02:00Z
  checked: Expo Router layout at apps/mobile/app/(community)/[id]/_layout.tsx
  found: Uses generic <Stack /> with no explicit screen list, which auto-registers all files in the directory
  implication: The route /(community)/[id]/notification-preferences IS registered in the router - it would work if navigated to

- timestamp: 2026-03-23T00:03:00Z
  checked: All .tsx/.ts files in apps/mobile for any reference to "notification-preferences" as a route target
  found: ZERO references to this route anywhere in the codebase (only references are the file itself and the hook's query key strings "notification_preferences" which are Supabase table names, not routes)
  implication: ROOT CAUSE CONFIRMED - the screen is an orphan; no button, link, or programmatic navigation ever directs the user to this screen

- timestamp: 2026-03-23T00:04:00Z
  checked: The notifications list screen (notifications.tsx) header for any settings/gear icon
  found: Header contains only a back button (left) and "mark all read" button (right) - no settings/gear icon
  implication: The natural place to add navigation (a gear icon in the notifications header) was never implemented

## Resolution

root_cause: The notification-preferences screen component is fully implemented but completely orphaned - no navigation link, button, or programmatic route.push anywhere in the app points to the /(community)/[id]/notification-preferences route. The notifications list screen header (the logical place for a settings icon) only has a back button and "mark all read" button.
fix: Add a settings gear icon in the notifications screen header that navigates to /(community)/[id]/notification-preferences
verification:
files_changed: []

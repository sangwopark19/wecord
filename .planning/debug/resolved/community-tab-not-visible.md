---
status: resolved
trigger: "Community tab is not visible in the app's tab bar"
created: 2026-03-20T00:00:00Z
updated: 2026-03-20T06:00:00Z
---

## Current Focus

hypothesis: Tabs.Screen name="community" has no matching route file inside (tabs)/ directory, so Expo Router silently drops it
test: Check filesystem for app/(tabs)/community.tsx or app/(tabs)/community/ — neither exists
expecting: Absence confirms the tab cannot render because Expo Router file-based routing requires a matching file
next_action: Confirm root cause and document fix direction

## Symptoms

expected: A "Community" tab should appear in the bottom tab bar alongside "Home"
actual: Only the "Home" tab is visible; Community tab does not render at all
errors: No crash or error message — the tab is silently absent
reproduction: Open the app after login; observe the tab bar has only one tab
started: Since commit 26c3dcc added the community tab configuration

## Eliminated

- hypothesis: Tab is conditionally hidden via some runtime logic
  evidence: No conditional rendering, no `tabBarButton` override, no `display: none` style — the Tabs.Screen is always rendered in JSX
  timestamp: 2026-03-20

- hypothesis: href prop is hiding the tab
  evidence: In Expo Router, `href` on a Tabs.Screen controls navigation target but does NOT control visibility. Setting href to null hides a tab, but here href is set to a string path, which should not hide it.
  timestamp: 2026-03-20

## Evidence

- timestamp: 2026-03-20
  checked: app/(tabs)/ directory contents
  found: Only two files exist — `_layout.tsx` and `index.tsx`. There is NO `community.tsx`, `community/index.tsx`, or `community/` directory inside (tabs).
  implication: Expo Router requires each Tabs.Screen name to match a file-based route in the same directory. "community" matches nothing.

- timestamp: 2026-03-20
  checked: app/(community)/ directory structure
  found: The (community) group exists as a SIBLING route group at `app/(community)/` (same level as `app/(tabs)/`), containing `_layout.tsx`, `search.tsx`, `compose.tsx`, and `[id]/`.
  implication: (community) is a separate route group in the root Stack navigator, not nested inside (tabs). A Tabs.Screen cannot reference a route outside its own directory.

- timestamp: 2026-03-20
  checked: app/(tabs)/_layout.tsx line 28-35
  found: `<Tabs.Screen name="community" ... href={'/(community)/search' as never} />` — the name "community" does not correspond to any file, and href points outside the tabs group.
  implication: This is the misconfiguration. The tab is defined in JSX but has no backing route file, so Expo Router cannot render it.

- timestamp: 2026-03-20
  checked: Root _layout.tsx (app/_layout.tsx)
  found: Root layout uses a Stack navigator with route groups (auth), (onboarding), (tabs), (community) as sibling segments. AuthGuard redirects to `/(tabs)` after login.
  implication: (community) is a top-level stack screen, completely separate from the tab navigator. You cannot make it appear as a tab by just adding a Tabs.Screen entry.

## Resolution

root_cause: |
  The community tab is defined in `app/(tabs)/_layout.tsx` as `<Tabs.Screen name="community">`,
  but there is NO corresponding route file at `app/(tabs)/community.tsx` or `app/(tabs)/community/index.tsx`.

  In Expo Router's file-based routing, every `Tabs.Screen` name must match an actual file or directory
  in the same `(tabs)/` folder. The `(community)` route group lives at `app/(community)/` — a sibling
  of `(tabs)` in the root Stack, not a child. The `href: '/(community)/search' as never` attempted
  to cross route group boundaries, which does not work for tab visibility.

  Expo Router silently ignores or drops tabs whose name doesn't resolve to a real route file,
  which is why there is no error — the tab simply never appears.

fix: |
  Two viable approaches:

  **Option A (recommended): Create a proxy file inside (tabs)**
  Create `app/(tabs)/community.tsx` that either:
  - Contains the community search screen directly, OR
  - Uses `<Redirect href="/(community)/search" />` to redirect

  Then update the Tabs.Screen: `name="community"` (no href override needed if using inline screen,
  or keep href if using redirect approach).

  **Option B: Move community screens into (tabs)**
  Restructure to `app/(tabs)/community/search.tsx`, `app/(tabs)/community/[id]/`, etc.
  This keeps everything within the tab navigator but changes URL structure.

  Option A is simpler and preserves the existing (community) route group for non-tab navigation.

verification:
files_changed: []

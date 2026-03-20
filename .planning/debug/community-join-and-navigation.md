---
status: investigating
trigger: "Community join button broken on all platforms; no navigation to community main for already-joined communities"
created: 2026-03-20T00:00:00Z
updated: 2026-03-20T00:00:00Z
---

## Current Focus

hypothesis: Multiple bugs across the join/navigation flow — missing error handling, broken debounce, unique constraint mishandling, and missing direct-entry path for existing members
test: Static code analysis of all files in the flow
expecting: Identify each specific bug and its platform-specific manifestation
next_action: Fix all identified issues

## Symptoms

expected: |
  1. Tapping join on preview shows join screen with auto-generated nickname (User#XXXX).
  2. After joining, navigates to community main screen.
  3. For already-joined communities, tapping should navigate directly to community main.
actual: |
  1. iOS: Error/crash when tapping join button.
  2. Web: No response when tapping join button.
  3. Android: No response when tapping join button.
  4. No way to navigate from community preview/search into community main even for already-joined communities.
errors: "Error/crash on iOS; no response on Web/Android"
reproduction: Tap any community card -> tap Join or Enter button
started: Unknown — possibly since initial implementation

## Eliminated

- hypothesis: Route files don't exist for join/preview/index
  evidence: All files confirmed present at app/(community)/[id]/join.tsx, preview.tsx, index.tsx
  timestamp: 2026-03-20T00:01:00Z

- hypothesis: PrimaryCTAButton component is broken
  evidence: Component correctly passes onPress to Pressable, no conditional disabling unless explicitly set
  timestamp: 2026-03-20T00:02:00Z

- hypothesis: Translation keys missing causing render failure
  evidence: All keys (join.cta, join.confirmNickname, enter, nickname.edit, nickname.charLimit) exist in en/community.json
  timestamp: 2026-03-20T00:03:00Z

- hypothesis: RLS blocks community SELECT for authenticated users
  evidence: communities_select_authenticated policy uses USING(true) — open to all authenticated users
  timestamp: 2026-03-20T00:04:00Z

- hypothesis: community_members INSERT blocked by RLS
  evidence: community_members_insert_own policy allows INSERT when user_id matches auth.uid() — correct
  timestamp: 2026-03-20T00:04:00Z

- hypothesis: Table column mismatch in insert
  evidence: community_members table has columns user_id, community_id, community_nickname, role — all match the insert object in useJoinCommunity.ts
  timestamp: 2026-03-20T00:05:00Z

- hypothesis: `as never` cast breaks expo-router at runtime
  evidence: Pattern used consistently across the app including working flows (onboarding). Runtime string matching is unaffected by TypeScript casts.
  timestamp: 2026-03-20T00:05:00Z

## Evidence

- timestamp: 2026-03-20T00:01:00Z
  checked: Edge Function existence
  found: |
    The `generate-nickname` Edge Function referenced in useJoinCommunity.ts does NOT exist.
    There are ZERO Supabase Edge Functions in the project (no files under supabase/functions/).
    The code at line 11 calls `supabase.functions.invoke('generate-nickname')`.
  implication: |
    With supabase-js v2.99+, `functions.invoke` returns `{ data: null, error: FunctionsHttpError }`
    for non-existent functions (HTTP 404). The fallback at lines 12-15 should trigger and generate
    a local `User#XXXX` nickname. However, platform-specific network behavior could cause exceptions
    instead of clean error returns.

- timestamp: 2026-03-20T00:02:00Z
  checked: join.tsx loadNickname error handling (lines 33-44)
  found: |
    ```tsx
    useEffect(() => {
      async function loadNickname() {
        setIsGenerating(true);
        try {
          const generated = await generateNickname();
          setNickname(generated);
        } finally {
          setIsGenerating(false);
        }
      }
      void loadNickname();
    }, []);
    ```
    No `catch` block. If `generateNickname()` throws (which it shouldn't with supabase-js v2, but
    could with platform-specific network errors), the error becomes an unhandled promise rejection.
  implication: |
    iOS: Unhandled promise rejections can crash the app via the global error handler.
    Web/Android: The `finally` block still runs, `isGenerating` becomes false, but `nickname` stays
    as empty string `''`. The join button is disabled by `!nickname.trim()` (line 96), so user sees
    the form but cannot submit — appears as "no response."

- timestamp: 2026-03-20T00:03:00Z
  checked: useJoinCommunity.ts 23505 error handling (lines 39-55)
  found: |
    The mutation catches error code `23505` (unique violation) and assumes it's a nickname collision.
    However, the table has TWO unique constraints:
    1. `cm_community_nickname_unique(community_id, community_nickname)`
    2. `cm_user_community_unique(user_id, community_id)` + index `idx_cm_user_community`
    If a user tries to join a community they're already in, the `(user_id, community_id)` constraint
    fires with code 23505. The code treats this as a nickname collision and retries with a new nickname,
    which will fail again with the same 23505 on `(user_id, community_id)`. The retry then throws,
    causing the join screen's catch block to show a generic error alert.
  implication: |
    Not the primary cause of "no response" (this would show an error alert), but it's a logic bug
    that causes confusing behavior for double-join attempts.

- timestamp: 2026-03-20T00:04:00Z
  checked: search.tsx debounce implementation (lines 17-28, 36-43)
  found: |
    The `useDebounce` hook uses `useCallback` instead of `useEffect` (line 20). `useCallback` returns
    a memoized function but never executes it. The debounced value NEVER updates.
    The hook is defined but NOT actually used — the component uses a manual setTimeout in
    `handleQueryChange` (line 39). This manual debounce has a bug: the cleanup function (line 43)
    is returned from the event handler, not from a useEffect, so previous timeouts are never cleared.
    Functionally, the search still works because each setTimeout still fires after 300ms, but it
    doesn't actually debounce (all keystrokes queue separate timeouts).
  implication: |
    Not blocking the join flow, but the broken useDebounce hook is dead code and the manual debounce
    doesn't clean up properly. Search still functionally works.

- timestamp: 2026-03-20T00:05:00Z
  checked: CommunityCard.tsx navigation (line 17)
  found: |
    `onPress={() => router.push(\`/(community)/${community.id}/preview\` as never)}`
    CommunityCard ALWAYS navigates to the preview screen, regardless of whether the user is already
    a member. There is no membership check in CommunityCard.
    The preview screen does check membership and shows "Enter" vs "Join" button, but the membership
    query (`useCommunityMember`) is async and may not resolve immediately. If the user taps the CTA
    before membership resolves, they see "Join" even though they're already a member.
  implication: |
    For already-joined members: they must go through preview, wait for membership to resolve, then
    tap "Enter." If membership hasn't loaded yet, they see "Join" and may attempt to re-join
    (triggering the 23505 bug above). There is no direct path from search to community main for
    existing members.

- timestamp: 2026-03-20T00:06:00Z
  checked: Visual feedback on loading states
  found: |
    Both join.tsx and index.tsx show `<ActivityIndicator color="#FFFFFF" />` on
    `bg-background` (black, #000000). The default ActivityIndicator size is "small" (20px).
    A small white spinner on a black background during screen transitions could be nearly invisible,
    especially if the screen transition animation is fast or overlaps.
  implication: |
    Users may perceive "no response" when the navigation actually succeeds but the destination screen
    shows a subtle loading state that blends with the black background.

## Resolution

root_cause: |
  **Combined root causes for "join button broken":**

  1. **Missing Edge Function `generate-nickname`** (CONFIRMED: does not exist in project)
     - `supabase.functions.invoke('generate-nickname')` hits a non-existent endpoint
     - supabase-js v2.99+ should return `{ data: null, error }` (not throw), triggering the local fallback
     - HOWEVER: if the Supabase project's Edge Functions runtime isn't configured/enabled, the HTTP
       request may fail at the network level (e.g., connection refused on local dev, or DNS failure),
       causing `functions.invoke` to throw instead of returning cleanly

  2. **No catch block in join.tsx loadNickname** (lines 33-44)
     - If `generateNickname()` throws, the unhandled rejection crashes iOS
     - On Web/Android, `finally` runs but nickname stays empty, disabling the join button

  3. **No direct navigation for already-joined members**
     - CommunityCard always goes to preview, never directly to community main
     - Membership query is async; user may see "Join" instead of "Enter" before it resolves

  4. **23505 unique constraint misidentification**
     - Re-join attempts hit `(user_id, community_id)` unique constraint
     - Code mistakes this for nickname collision and retries, which fails again

  5. **Poor loading state visibility**
     - Small white spinner on black background during screen transitions appears as "no response"

fix: |
  1. **join.tsx**: Add catch block in loadNickname useEffect — on error, generate nickname locally
  2. **useJoinCommunity.ts**: Wrap entire `generateNickname()` in try/catch as defense-in-depth
  3. **useJoinCommunity.ts**: Distinguish between nickname collision (cm_community_nickname_unique)
     and duplicate membership (cm_user_community_unique) in 23505 handler
  4. **CommunityCard.tsx**: Add membership check; navigate members directly to community main
  5. **search.tsx**: Fix useDebounce hook (useCallback -> useEffect) or remove dead code
  6. **join.tsx / index.tsx**: Improve loading states with visible feedback

verification: ""
files_changed: []

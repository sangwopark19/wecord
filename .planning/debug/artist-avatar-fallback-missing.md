---
status: investigating
trigger: "artist avatar fallback missing when profile_image_url is null in CommunityPreviewSheet"
created: 2026-03-20T00:00:00Z
updated: 2026-03-20T00:00:00Z
---

## Current Focus

hypothesis: CommunityPreviewSheet renders expo-image with undefined URI when profile_image_url is null, with no fallback view — resulting in an invisible/empty avatar area
test: Compare avatar rendering logic in CommunityPreviewSheet vs ArtistMemberScroll
expecting: ArtistMemberScroll has fallback; CommunityPreviewSheet does not
next_action: Confirmed root cause. Ready to fix.

## Symptoms

expected: A default placeholder avatar (initials, generic icon, or colored circle) when profile_image_url is null
actual: Avatar area is empty/invisible — no image, no icon, nothing rendered
errors: N/A (no runtime error, purely visual bug)
reproduction: Open community preview sheet for a group community where an artist_member has profile_image_url = null
started: Since initial implementation — no fallback was ever added

## Eliminated

(none)

## Evidence

- timestamp: 2026-03-20T00:00:00Z
  checked: CommunityPreviewSheet.tsx lines 107-117 — artist avatar rendering
  found: |
    The Image component receives `source={{ uri: artist.profile_image_url ?? undefined }}`.
    When profile_image_url is null, uri becomes undefined. expo-image renders nothing visible.
    There is NO conditional check and NO fallback view (no icon, no initials, no placeholder).
  implication: This is the root cause. The avatar is invisible because expo-image with uri=undefined renders an empty box.

- timestamp: 2026-03-20T00:00:00Z
  checked: ArtistMemberScroll.tsx lines 193-206 — same type of avatar rendering
  found: |
    This file DOES have proper fallback logic:
    ```
    {item.profile_image_url ? (
      <Image ... />
    ) : (
      <View className="bg-card items-center justify-center">
        <Ionicons name="person-outline" size={24} color="#999999" />
      </View>
    )}
    ```
  implication: The correct pattern already exists in the codebase. CommunityPreviewSheet simply omitted it.

## Resolution

root_cause: |
  CommunityPreviewSheet.tsx line 109-112 renders an expo-image `<Image>` with
  `source={{ uri: artist.profile_image_url ?? undefined }}` unconditionally.
  When profile_image_url is null, the uri is undefined and expo-image renders
  an empty/invisible area. There is no conditional fallback (unlike
  ArtistMemberScroll.tsx which properly shows a person icon).

fix: |
  Add conditional rendering in CommunityPreviewSheet.tsx artist avatar section
  (lines 108-117). Use the same pattern as ArtistMemberScroll.tsx:
  - If profile_image_url exists: render <Image> with the URL
  - If null: render a <View> with bg-card + Ionicons person-outline icon
  Will need to add Ionicons import.

verification:
files_changed: []

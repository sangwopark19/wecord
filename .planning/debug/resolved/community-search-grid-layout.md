---
status: resolved
trigger: "Community search results display incorrectly: web shows black rectangles, mobile shows 1-column instead of 2-column"
created: 2026-03-20T00:00:00Z
updated: 2026-03-20T16:00:00Z
---

## Current Focus

hypothesis: Two separate root causes - (1) Web black rectangles caused by CommunityCard's flex-1 + missing explicit width combined with expo-image rendering a null/undefined source as a black box, (2) Mobile 1-column caused by renderItem wrapper View using flex-1 without width constraint, preventing FlatList numColumns=2 from distributing items across columns
test: Code analysis confirms both issues
expecting: See evidence below
next_action: Report root causes to user

## Symptoms

expected: 2-column grid of CommunityCard components with name and member count visible
actual: Web shows large black rectangles instead of community cards; Mobile (iOS) shows 1-column grid instead of 2-column
errors: No runtime errors reported
reproduction: Search for communities on the search screen
started: Unknown - possibly since initial implementation

## Eliminated

(none yet)

## Evidence

- timestamp: 2026-03-20T00:00:00Z
  checked: apps/mobile/app/(community)/search.tsx - FlatList configuration
  found: FlatList has numColumns={2} set correctly. The renderItem wraps CommunityCard in `<View className="flex-1">`. The FlatList uses contentContainerStyle with paddingHorizontal but no columnWrapperStyle.
  implication: numColumns={2} is set, so FlatList should create 2-column layout. However, the wrapper View with flex-1 alone may not constrain width properly. FlatList with numColumns requires items to have explicit width (typically 50% for 2 columns) or a columnWrapperStyle to distribute space.

- timestamp: 2026-03-20T00:00:00Z
  checked: apps/mobile/components/community/CommunityCard.tsx - Card styling and Image
  found: The Pressable root has `className="flex-1 m-2 bg-card rounded-xl overflow-hidden"`. The Image uses `style={{ width: '100%', aspectRatio: 1 }}` with `source={{ uri: community.cover_image_url ?? undefined }}`. When cover_image_url is null, source becomes `{ uri: undefined }`.
  implication: (1) WEB BLACK RECTANGLES - expo-image with `{ uri: undefined }` renders as a black rectangle on web because it creates an img element with no src that fills its container. Combined with bg-card (#1A1A1A, dark gray) and aspectRatio: 1, each card becomes a large dark/black rectangle. The text exists below but is barely visible or pushed off-screen depending on card height. (2) MOBILE 1-COLUMN - The Pressable uses flex-1 but the parent View from renderItem also uses flex-1. Without explicit width: '50%' on either the wrapper or the card, flex-1 causes each item to try to fill the full row width, making FlatList stack them in a single column.

- timestamp: 2026-03-20T00:00:00Z
  checked: apps/mobile/tailwind.config.js - Theme colors
  found: bg-card resolves to #1A1A1A (very dark gray), background is #000000 (black), foreground is #FFFFFF
  implication: On web, the dark card background combined with a failed/empty image creates what appears as a "black rectangle"

## Resolution

root_cause: |
  **Bug 1 - Web black rectangles:** Two contributing factors:
  (a) `expo-image` `Image` component receives `{ uri: undefined }` when `cover_image_url` is null. On web, this renders as a black/empty rectangle that fills the available space (width: 100%, aspectRatio: 1).
  (b) The card background is `bg-card` (#1A1A1A), which is near-black. Combined with the black empty image, the entire card appears as a "large black rectangle." The text below the image may be present but the visual is dominated by the large empty image.

  **Bug 2 - Mobile 1-column:** The `renderItem` in search.tsx wraps each `CommunityCard` in `<View className="flex-1">` and the `CommunityCard` Pressable also uses `className="flex-1 ..."`. When using `FlatList` with `numColumns={2}`, each column item needs an explicit width constraint (e.g., `width: '50%'` or `flex: 1` on a row wrapper). The current setup lacks a `columnWrapperStyle` on the FlatList and does not set explicit width on items. On iOS, `flex-1` without a width constraint in a FlatList multi-column layout causes items to take full width, collapsing the grid to 1 column.

fix: |
  **For Bug 1 (web black rectangles):**
  - In CommunityCard.tsx, add a fallback/placeholder when `cover_image_url` is null instead of passing `{ uri: undefined }` to expo-image. Either conditionally render the Image or provide a placeholder image URI.

  **For Bug 2 (mobile 1-column):**
  - In search.tsx renderItem, change the wrapper View to use explicit width: `style={{ width: '50%' }}` instead of (or in addition to) `className="flex-1"`.
  - Alternatively, add `columnWrapperStyle={{ }}` on the FlatList to control row layout.

  Minimal fix for both:
  ```tsx
  // search.tsx - renderItem
  const renderItem = ({ item }: { item: CommunitySearchResult }) => (
    <View style={{ width: '50%' }}>
      <CommunityCard community={item} />
    </View>
  );
  ```

  ```tsx
  // CommunityCard.tsx - conditional image rendering
  {community.cover_image_url ? (
    <Image
      source={{ uri: community.cover_image_url }}
      style={{ width: '100%', aspectRatio: 1 }}
      contentFit="cover"
      transition={200}
    />
  ) : (
    <View style={{ width: '100%', aspectRatio: 1, backgroundColor: '#2A2A2A' }}>
      {/* placeholder icon or empty state */}
    </View>
  )}
  ```

verification:
files_changed: []

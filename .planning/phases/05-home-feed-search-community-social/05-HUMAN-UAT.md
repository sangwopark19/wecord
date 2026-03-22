---
status: partial
phase: 05-home-feed-search-community-social
source: [05-VERIFICATION.md]
started: 2026-03-22T06:50:00Z
updated: 2026-03-22T06:50:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Community profile screen navigation
expected: Open a community with posts, tap a user avatar/nickname on a PostCard → navigates to community profile screen showing that member's avatar, nickname, post count, follower count, following count, and a list of their posts
result: [pending]

### 2. Community profile comments tab
expected: From a community profile screen, tap the Comments tab → shows a list of that member's comments (each with content preview up to 3 lines and date); tapping a comment navigates to the source post detail screen
result: [pending]

### 3. Follower list navigation
expected: From a community profile screen, tap the follower count → navigates to follower list screen with member rows and FollowButton per row
result: [pending]

### 4. Follow/unfollow flow
expected: From a community profile screen, tap Follow button, then tap it again (now shows Following) → unfollow confirmation dialog appears with correct i18n text; confirming removes the follow; follower count updates
result: [pending]

### 5. Home tab zero-community view
expected: On the Home tab with 0 communities joined → sees search bar at top, promotion banner carousel below, 2-column creator recommendation grid below banner
result: [pending]

### 6. In-community post search
expected: Tap search icon in fan/artist tab header → post search screen opens with autofocused TextInput; typing a keyword shows matching posts with Teal keyword highlighting
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps

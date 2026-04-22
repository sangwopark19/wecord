import { describe, it } from 'vitest';

// Component-level render assertions for <ShopWebView> require renderHook /
// render() from @testing-library/react-native, which fails in this worktree
// because RNTR pins react-test-renderer@19.2.3 while the resolved version is
// 19.2.4 (07-01 deviation #5 — same root cause). The contract is exercised
// indirectly:
//
//   - URL allowlist (the only T-7-01 mitigation that matters):
//       tests/shop/external-link-block.test.ts (12 cases)
//       tests/shop/navigation-state.test.ts    (4 cases)
//   - Static prop wiring (sharedCookiesEnabled=false, source uri,
//     onShouldStartLoadWithRequest hook present): grep gates in the plan's
//     <verify> block (`grep -n "sharedCookiesEnabled={false}" ShopWebView.tsx`).
//
// When the RNTR peer pin is resolved (Plan 07-03 or a follow-up), promote the
// it.todo entries below to real render assertions using the WebView mock's
// `lastProps` capture.
describe('ShopWebView (component render)', () => {
  it.todo('renders WebView with source { uri: https://x-square.kr } — RNTR pin blocked');
  it.todo('passes sharedCookiesEnabled=false per D-24 — RNTR pin blocked');
  it.todo('renders ShopHeader above WebView — RNTR pin blocked');
  it.todo('falls back to ShopErrorFallback when onError fires — RNTR pin blocked');
});

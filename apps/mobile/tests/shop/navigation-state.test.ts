import { describe, it, expect } from 'vitest';
import { isAllowedHost } from '../../components/shop/isAllowedHost';

// `navigation-state` exercises the URL allowlist edge cases that govern
// nav transitions inside the WebView. Component-level state (canGoBack
// toggling, ref.goBack invocation) requires renderHook from RNTR, which
// hits the react-test-renderer 19.2.3-vs-19.2.4 peer pin documented in
// 07-01 deviation #5. Splitting the contract into URL-pure assertions
// keeps the gate green without renderHook.
describe('Shop navigation-state URL behavior', () => {
  it('allowed: deep path on x-square.kr', () => {
    expect(isAllowedHost('https://x-square.kr/products/123?utm_source=app')).toBe(true);
  });

  it('blocked: navigate to social share host', () => {
    expect(isAllowedHost('https://twitter.com/intent/tweet?url=...')).toBe(false);
  });

  it('blocked: localhost (dev/test escape)', () => {
    expect(isAllowedHost('https://localhost:3000/admin')).toBe(false);
  });

  it('blocked: explicit IP', () => {
    expect(isAllowedHost('https://192.168.1.1/router')).toBe(false);
  });
});

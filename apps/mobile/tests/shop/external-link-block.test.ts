import { describe, it, expect } from 'vitest';
import { isAllowedHost } from '../../components/shop/isAllowedHost';

// T-7-01 mitigation: hostname allowlist + protocol allowlist for the Shop
// WebView. The component wraps this predicate with expo-web-browser handoff
// for blocked URLs. Tests import from the pure module (not ShopWebView.tsx)
// to avoid pulling in @expo/vector-icons via ShopHeader — vector-icons fails
// to resolve inside the worktree's symlinked node_modules.
describe('Shop external-link allowlist (T-7-01)', () => {
  it('returns true for https://x-square.kr', () => {
    expect(isAllowedHost('https://x-square.kr/shop')).toBe(true);
  });

  it('returns true for subdomain foo.x-square.kr', () => {
    expect(isAllowedHost('https://foo.x-square.kr/path')).toBe(true);
  });

  it('returns false for evil.example with x-square.kr in path', () => {
    expect(isAllowedHost('https://evil.example/x-square.kr')).toBe(false);
  });

  it('returns false for malformed URL', () => {
    expect(isAllowedHost('not-a-url')).toBe(false);
  });

  // [REVIEW UPDATE — Codex MEDIUM: protocol allowlist] Reject every non-https
  // scheme even when the hostname matches.
  it('returns false for http:// even on allowed host', () => {
    expect(isAllowedHost('http://x-square.kr/')).toBe(false);
  });

  it('returns false for javascript:', () => {
    expect(isAllowedHost('javascript:alert(1)')).toBe(false);
  });

  it('returns false for data:', () => {
    expect(isAllowedHost('data:text/html,<script>1</script>')).toBe(false);
  });

  it('returns false for file://', () => {
    expect(isAllowedHost('file:///etc/passwd')).toBe(false);
  });

  it('returns false for about:blank', () => {
    expect(isAllowedHost('about:blank')).toBe(false);
  });

  it('returns false for intent:// scheme (Android deep link)', () => {
    expect(isAllowedHost('intent://x-square.kr#Intent;scheme=https;end')).toBe(false);
  });

  it('returns true for x-square.kr with query string', () => {
    expect(isAllowedHost('https://x-square.kr/shop?ref=fan')).toBe(true);
  });

  it('returns false for hostname that just ends with x-square.kr (no dot boundary)', () => {
    // Prevents `notx-square.kr` (no dot before x-square.kr) from matching.
    expect(isAllowedHost('https://notx-square.kr/path')).toBe(false);
  });
});

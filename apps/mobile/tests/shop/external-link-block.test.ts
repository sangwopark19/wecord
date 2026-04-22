import { describe, it } from 'vitest';

describe('Shop external-link allowlist (T-7-01)', () => {
  it.todo('returns true for https://x-square.kr/* URLs');
  it.todo('returns true for https://sub.x-square.kr/* URLs (subdomain allowed)');
  it.todo('returns false and calls WebBrowser.openBrowserAsync for https://evil.example/*');
  it.todo('returns false for malformed URLs without crashing');
  // REVIEW MEDIUM — protocol allowlist
  it.todo('returns false for http:// even on allowed host');
  it.todo('returns false for javascript:');
  it.todo('returns false for data:');
  it.todo('returns false for file://');
  it.todo('returns false for about:blank');
  it.todo('returns false for intent:// scheme (Android deep link)');
});

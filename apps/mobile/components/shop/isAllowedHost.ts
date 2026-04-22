// Pure URL allowlist predicate for the Shop WebView (T-7-01).
//
// Extracted to a dependency-free module so tests can exercise the contract
// without dragging in @expo/vector-icons / react-native (the icon module's
// build/createIconSet path is missing inside the worktree's symlinked
// node_modules, so any test that transitively imports ShopHeader fails to
// resolve). Same separation pattern as 07-01's pure helpers (shallowDirty,
// reconcilePushToggle).

const ALLOWED_HOST = 'x-square.kr';

// [REVIEW UPDATE — Codex MEDIUM: WebView protocol allowlist] Reject every
// non-https scheme even when the hostname matches. Rejects javascript:, data:,
// file:, about:, intent:, http: (Android intent: handler hijacking + JS XSS).
//
// Hostname match: exact `x-square.kr` OR `*.x-square.kr` subdomain. The
// `'.' + ALLOWED_HOST` boundary check prevents `notx-square.kr` from passing
// `endsWith('x-square.kr')`.
export function isAllowedHost(rawUrl: string): boolean {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;
  return url.hostname === ALLOWED_HOST || url.hostname.endsWith('.' + ALLOWED_HOST);
}

export const SHOP_ALLOWED_HOST = ALLOWED_HOST;

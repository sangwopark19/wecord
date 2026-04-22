---
status: resolved
trigger: "android-google-oauth-localhost-redirect"
created: 2026-03-20T00:00:00Z
updated: 2026-03-20T00:05:00Z
---

## Current Focus

hypothesis: CONFIRMED - Two-part root cause verified via source code analysis
test: Completed — source code reading + fix applied
expecting: Android development build (not Expo Go) + wecord:// in Supabase allowlist = OAuth works
next_action: Human verification — test Google OAuth on Android emulator with development build

## Symptoms

expected: 구글 로그인 후 앱으로 정상 복귀
actual: 브라우저가 localhost:8081로 리다이렉트되며 "This site can't be reached - localhost refused to connect" 에러 표시
errors: ERR_CONNECTION_REFUSED on localhost:8081
reproduction: 안드로이드 에뮬레이터에서 구글 로그인 버튼 클릭
started: 현재 발생 중 (iOS에서는 이전에 수정됨 - commit 8959b59)

## Eliminated

- hypothesis: Android emulator network differences (10.0.2.2 vs localhost) cause the issue
  evidence: The actual problem is that Supabase's redirect URL allowlist does not include the deep link URL (wecord://auth/callback), so Supabase falls back to site_url (http://127.0.0.1:3000) after OAuth. The browser then tries to reach that URL.
  timestamp: 2026-03-20T00:00:00Z

## Evidence

- timestamp: 2026-03-20T00:00:00Z
  checked: makeRedirectUri source (AuthSession.js line 70-91)
  found: In Expo Go / development, makeRedirectUri({ scheme: 'wecord', path: 'auth/callback' }) calls Linking.createURL which generates exp://127.0.0.1:8081/--/auth/callback (not wecord://auth/callback). The scheme parameter is only used in standalone/bare builds.
  implication: The redirectTo passed to Supabase signInWithOAuth is exp://127.0.0.1:8081/--/auth/callback in Expo Go dev, not the wecord:// custom scheme URL.

- timestamp: 2026-03-20T00:00:00Z
  checked: config.toml additional_redirect_urls
  found: Only "https://127.0.0.1:3000" is in the allowlist. The exp://127.0.0.1:8081/--/auth/callback URL is NOT in the allowlist.
  implication: Supabase rejects the redirectTo URL and falls back to site_url (http://127.0.0.1:3000) after Google OAuth. The browser then tries to open http://127.0.0.1:3000 which doesn't work on Android emulator. But the error says localhost:8081 — this means the browser is somehow opening localhost:8081, which suggests Expo Go's dev server is the target being confused.

- timestamp: 2026-03-20T00:00:00Z
  checked: WebBrowser.openAuthSessionAsync behavior on Android
  found: On Android, WebBrowser.openAuthSessionAsync uses a Chrome Custom Tab. Unlike iOS SFAuthenticationSession which automatically intercepts deep links matching the redirectUrl parameter, Android Custom Tabs do NOT automatically intercept deep links. The redirectUrl parameter is used for URL monitoring — when the URL matches, it's captured. But if Supabase sends the browser to a URL that doesn't match (because redirectTo was rejected), the Custom Tab just navigates there instead of returning to the app.
  implication: Two-part fix needed: (1) add exp://127.0.0.1:8081/--/auth/callback to Supabase redirect allowlist, (2) optionally use intentFilters for Android deep linking OR rely on the URL-monitoring approach in Custom Tabs.

- timestamp: 2026-03-20T00:00:00Z
  checked: Android app.json config
  found: scheme is "wecord" but no intentFilters defined for Android. In development (Expo Go), the scheme is exp:// not wecord://.
  implication: The redirectUrl used in WebBrowser.openAuthSessionAsync must match what Supabase will redirect back to. The fix must ensure the Supabase allowlist accepts the generated redirectTo URI.

## Resolution

root_cause: Two-part cause: (1) Supabase additional_redirect_urls did not include wecord://auth/callback (needed for development builds) or exp:// URLs (needed for Expo Go — though Expo Go is unsupported for OAuth). (2) Android WebBrowser polyfill has an AppState/Linking race: AppState fires 'active' before Linking fires the URL event, causing result.type='dismiss' and the OAuth code being silently lost. This is the primary reason OAuth never completes on Android even if the redirect URL is in the allowlist.

fix: (1) Added wecord://auth/callback, exp://127.0.0.1:8081/--/auth/callback, and exp://10.0.2.2:8081/--/auth/callback to config.toml additional_redirect_urls. (2) Refactored login.tsx signInWithGoogle and signInWithAppleWeb to independently listen for Linking URL events on Android — the Linking listener is set up BEFORE openAuthSessionAsync, ensuring the callback URL is caught even when AppState fires first. Falls back to getInitialURL() if the URL was delivered as a cold-start intent.

verification: confirmed by user (2026-03-20). Development build에서 정상 동작. Expo Go에서는 AsyncStorage 세션이 앱 재시작 시 초기화되는 것은 정상 동작(Expo Go 한정 이슈).
files_changed:
  - packages/supabase/config.toml
  - apps/mobile/app/(auth)/login.tsx

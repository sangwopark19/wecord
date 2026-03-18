# Phase 2: Auth & Onboarding - Research

**Researched:** 2026-03-18
**Domain:** Expo + Supabase Auth (Google/Apple OAuth), SecureStore, Zustand, TanStack Query, Onboarding UI
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### 온보딩 플로우
- 단계 순서: ToS 동의 → 생년월일 → 언어 선택 → 크리에이터 큐레이션
- 스킵 가능: 큐레이션만 skip 가능 (ToS/생년월일/언어는 필수)
- 진행 표시: 화면 상단 dot indicator (Weverse 스타일)
- 완료 후 이동: 홈 탭으로 이동 (커뮤니티 0개이므로 추천 화면 표시)

#### 크리에이터 큐레이션
- 표시 방식: 카드 그리드 (Spotify 스타일) — 프로필 이미지 + 이름, 탭하면 선택/해제 토글
- 선별 로직: DB에 등록된 크리에이터(커뮤니티 기준) 중 랜덤 표시. MVP에서는 추천 알고리즘 없음
- 선택 결과: 선택한 크리에이터의 커뮤니티에 자동 가입 (커뮤니티 닉네임은 자동생성)
- 선택 제한: 없음 — 0개부터 원하는 만큼 선택 가능 (skip이므로 0개도 OK)

#### 프로필 설정
- 온보딩과 분리: 온보딩에서는 프로필 설정 없음. 더보기 탭에서 별도 편집
- 닉네임 자동생성: UUID 기반 코드 (User#4821 형태). `generate-nickname` Edge Function으로 구현
- 아바타: 기본 아바타 이미지 제공 (Teal 배경 이니셜), 원하면 사진 업로드 가능 (Supabase Storage)
- bio: 온보딩에서 제외. 더보기 탭 프로필 편집에서만 입력 가능

#### 로그인 화면
- 구성: Wecord 로고/브랜딩 + OAuth 버튼들. 미니멀 디자인, 다크 배경
- Apple OAuth: 모든 플랫폼(iOS, Android, Web)에서 표시 (Supabase Auth로 구현)
- Google OAuth: 모든 플랫폼에서 표시
- 비로그인 상태: 앱 실행 시 즉시 로그인 화면으로 이동. 다른 화면 접근 불가

#### 세션 관리
- 토큰 저장: SecureStore (Expo) — access token + refresh token
- 자동 갱신: Supabase refresh token으로 자동 갱신. 갱신 실패 시 로그인 화면으로 이동
- 앱 재시작: SecureStore에서 토큰 복원, 유효하면 자동 로그인

### Claude's Discretion
- OAuth 콜백 처리 방식 (deep link vs redirect)
- Zustand authStore 구조 상세
- TanStack Query 클라이언트 설정 상세
- 온보딩 애니메이션/전환 효과
- SecureStore 키 네이밍
- 에러 상태 UI (네트워크 오류, OAuth 실패 등)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | User can sign up/login via Google OAuth | Supabase + expo-auth-session + expo-web-browser OAuth flow; deep link callback via `wecord://` scheme |
| AUTH-02 | User can sign up/login via Apple OAuth | expo-apple-authentication (iOS native) + Supabase signInWithIdToken; web/Android use Supabase web OAuth |
| AUTH-03 | User can set global profile (nickname, avatar, bio, language) | profiles table already exists with all columns; More tab profile edit screen + Supabase Storage avatar upload |
| AUTH-04 | User session persists across app restart (SecureStore token) | Custom Supabase storage adapter using expo-secure-store; authStore restores on mount |
| AUTH-05 | User sees ToS / Privacy Policy agreement flow on first signup | Onboarding step 1; `onboarding_completed` flag in profiles table gates routing |
| AUTH-06 | User sees Spotify-style creator curation on first signup (random, skippable) | Onboarding step 4; communities table query (random); bulk community_members INSERT |
| AUTH-07 | User can set preferred language during onboarding | Onboarding step 3; profiles.language column update; i18next language change |
| AUTH-08 | User provides date of birth for age verification | Onboarding step 2; profiles.date_of_birth column; @react-native-community/datetimepicker; age ≥ 14 gate |
| AUTH-09 | Content rating field on posts (content_rating column for age-gated content) | Already exists in posts schema (content_rating TEXT DEFAULT 'general'); comments schema too; migration needed to confirm applied |
</phase_requirements>

---

## Summary

Phase 2 implements the full auth and onboarding loop: OAuth sign-in → profile creation → 4-step onboarding → home. The foundation (Supabase project, DB schema, i18n, Expo app) is complete from Phase 1. What's missing is: the Supabase JS client initialization, SecureStore-backed session persistence, authStore (Zustand), TanStack Query setup, and all the screen/navigation code.

The critical architectural insight is that Supabase Auth requires a **custom storage adapter** for Expo — the default `localStorage` adapter doesn't work in React Native. The adapter must use `expo-secure-store` and be passed to `createClient()`. This is a known requirement; skipping it means tokens are lost on app restart.

For OAuth, the recommended Expo pattern differs by platform: iOS uses deep link redirect via `expo-auth-session` + `makeRedirectUri()`, while Apple Sign In on iOS should use `expo-apple-authentication` (native Apple UI) + `supabase.auth.signInWithIdToken()`. Both flows must handle the `wecord://` deep link scheme already configured in `app.json`.

**Primary recommendation:** Initialize Supabase client with SecureStore adapter in Plan 02-01 as the first task; every other auth feature depends on it.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | 2.99.2 | Supabase client (Auth, PostgREST, Realtime, Storage) | Official SDK; already decided in Phase 1 |
| expo-secure-store | 55.0.9 | Encrypted token storage | Required for SecureStore session persistence (AUTH-04) |
| expo-auth-session | 55.0.8 | OAuth PKCE flow + redirect URI builder | Official Expo OAuth helper; handles web redirect + deep link callback |
| expo-web-browser | 55.0.10 | Opens OAuth consent page in system browser | Required by expo-auth-session for in-app browser flow |
| expo-crypto | 55.0.10 | PKCE code verifier generation | Required by expo-auth-session PKCE flow |
| expo-apple-authentication | 55.0.9 | Native Apple Sign In button (iOS only) | App Store requirement: if any social login is present on iOS, Apple Sign In must also be present as native |
| zustand | 5.0.12 | authStore client state | Already decided (PROJECT.md constraint) |
| @tanstack/react-query | 5.90.21 | Server state, onboarding data fetching | Already decided (PROJECT.md constraint) |
| @react-native-community/datetimepicker | 9.1.0 | Native date picker for DoB input | Platform-native UX for date selection; recommended in UI-SPEC |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @react-native-async-storage/async-storage | 2.1.0 | Already installed; do NOT use for tokens | Non-sensitive storage only (if needed); tokens must use SecureStore |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-auth-session | react-native-app-auth | expo-auth-session is Expo-native, simpler SDK 55 integration |
| expo-apple-authentication (native) | Supabase web OAuth for Apple on iOS | Native gives correct "Sign in with Apple" button UI required by App Store guidelines |
| @react-native-community/datetimepicker | Custom date wheel | Don't hand-roll date pickers; platform native handles locale, accessibility, keyboard avoidance |

**Installation (new packages to add to apps/mobile):**
```bash
npx expo install expo-secure-store expo-auth-session expo-web-browser expo-crypto expo-apple-authentication @react-native-community/datetimepicker @supabase/supabase-js @tanstack/react-query zustand
```

**Version verification (confirmed 2026-03-18 via npm registry):**
- expo-secure-store: 55.0.9
- expo-auth-session: 55.0.8
- expo-web-browser: 55.0.10
- expo-crypto: 55.0.10
- expo-apple-authentication: 55.0.9
- @supabase/supabase-js: 2.99.2
- zustand: 5.0.12
- @tanstack/react-query: 5.90.21
- @react-native-community/datetimepicker: 9.1.0

---

## Architecture Patterns

### Recommended Project Structure

```
apps/mobile/
├── app/
│   ├── (auth)/
│   │   └── login.tsx            # Google + Apple OAuth buttons
│   ├── (onboarding)/
│   │   ├── _layout.tsx          # Onboarding stack with dot indicator
│   │   ├── tos.tsx              # Step 1: Terms of Service
│   │   ├── dob.tsx              # Step 2: Date of Birth
│   │   ├── language.tsx         # Step 3: Language picker
│   │   ├── curate.tsx           # Step 4: Creator curation (skippable)
│   │   └── complete.tsx         # Transition → Home
│   ├── (tabs)/                  # Already exists from Phase 1
│   │   └── more.tsx             # Profile edit lives here (Phase 2 adds profile screen)
│   └── _layout.tsx              # Auth guard: redirect to (auth)/login if no session
├── stores/
│   └── authStore.ts             # Zustand: user, session, loading, error
├── lib/
│   ├── supabase.ts              # createClient() with SecureStore adapter
│   └── queryClient.ts           # TanStack QueryClient config
└── hooks/
    └── useAuth.ts               # Thin hook wrapping authStore + supabase auth
```

```
packages/supabase/functions/
└── generate-nickname/
    └── index.ts                 # Deno Edge Function: returns User#XXXX code
```

### Pattern 1: Supabase Client with SecureStore Adapter

**What:** Pass a custom storage adapter to `createClient()` so tokens survive app restarts.
**When to use:** Always — without this, sessions are lost on every cold start.

```typescript
// apps/mobile/lib/supabase.ts
// Source: Supabase docs — "React Native Storage Adapter"
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Must be false in React Native
    },
  }
);
```

**SecureStore key naming convention:**
- `sb-{project_ref}-auth-token` (Supabase uses this key internally when `persistSession: true`)
- No manual key management needed; the adapter handles it.

### Pattern 2: Google OAuth Flow (expo-auth-session)

**What:** PKCE-based OAuth flow using system browser redirect.
**When to use:** Google Sign In on all platforms (iOS, Android, Web).

```typescript
// apps/mobile/app/(auth)/login.tsx
// Source: Supabase docs — "Login with Google using Expo"
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import { supabase } from '../../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri({ scheme: 'wecord', path: 'auth/callback' });

async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (data.url) {
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'success') {
      const { url } = result;
      await supabase.auth.exchangeCodeForSession(url);
    }
  }
}
```

**Deep link setup required in app.json:**
```json
{
  "expo": {
    "scheme": "wecord"
  }
}
```
This is already set. The OAuth redirect URL `wecord://auth/callback` must also be added to the Supabase dashboard under Authentication > URL Configuration > Redirect URLs.

### Pattern 3: Apple Sign In (expo-apple-authentication)

**What:** Native Apple Sign In on iOS using `expo-apple-authentication`; Supabase handles the token exchange.
**When to use:** iOS specifically for native Apple button (App Store requirement). Android/Web fall back to the Supabase web OAuth flow same as Google.

```typescript
// Source: Supabase docs — "Login with Apple using Expo"
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '../../lib/supabase';

async function signInWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (credential.identityToken) {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
  }
}
```

**Apple OAuth on Android/Web:** Use the same `signInWithOAuth` pattern as Google (web browser redirect). `expo-apple-authentication` is iOS-only — wrap the native button with `Platform.OS === 'ios'` check.

### Pattern 4: Auth Guard (expo-router)

**What:** Redirect unauthenticated users to login; redirect users with incomplete onboarding to the correct step.
**When to use:** Root `_layout.tsx` — runs on every navigation event.

```typescript
// apps/mobile/app/_layout.tsx
import { useEffect } from 'react';
import { router, useSegments } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

export default function RootLayout() {
  const { session, profile, loading } = useAuthStore();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';

    if (!session) {
      if (!inAuthGroup) router.replace('/(auth)/login');
    } else if (session && profile && !profile.onboardingCompleted) {
      if (!inOnboarding) router.replace('/(onboarding)/tos');
    } else if (session && profile?.onboardingCompleted) {
      if (inAuthGroup || inOnboarding) router.replace('/(tabs)');
    }
  }, [session, profile, loading, segments]);
}
```

### Pattern 5: authStore (Zustand)

**What:** Central client state for auth: user, session, profile, loading flags.
**When to use:** All screens that need auth state.

```typescript
// apps/mobile/stores/authStore.ts
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

type Profile = {
  userId: string;
  globalNickname: string;
  avatarUrl: string | null;
  language: 'ko' | 'en' | 'th' | 'zh' | 'ja';
  onboardingCompleted: boolean;
  dateOfBirth: string | null;
};

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),
  initialize: async () => {
    // Restore session from SecureStore
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null });

    // Subscribe to auth state changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null, loading: false });
    });
    set({ loading: false });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },
}));
```

### Pattern 6: Profile UPSERT After OAuth

**What:** After OAuth sign-in, upsert a profile row for new users.
**When to use:** In the `onAuthStateChange` callback or after `exchangeCodeForSession`.

```typescript
// Source: Supabase PostgREST docs — upsert with onConflict
const { data, error } = await supabase
  .from('profiles')
  .upsert({
    user_id: user.id,
    global_nickname: `User#${Math.floor(Math.random() * 9000) + 1000}`,
    language: deviceLanguage, // from expo-localization
    onboarding_completed: false,
  }, { onConflict: 'user_id' })
  .select()
  .single();
```

For Phase 2, the `generate-nickname` Edge Function handles the actual nickname generation. The client can call it directly after OAuth sign-in.

### Pattern 7: generate-nickname Edge Function

**What:** Deno Edge Function that returns a unique `User#XXXX` style nickname.
**When to use:** Called once after OAuth sign-in to set `global_nickname` in profiles.

```typescript
// packages/supabase/functions/generate-nickname/index.ts
// Source: Supabase Edge Functions Deno pattern
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Generate User#XXXX code, verify uniqueness in profiles
  let nickname: string;
  let attempts = 0;
  do {
    const code = Math.floor(Math.random() * 9000) + 1000;
    nickname = `User#${code}`;
    const { data } = await supabaseAdmin
      .from('profiles')
      .select('user_id')
      .eq('global_nickname', nickname)
      .maybeSingle();
    if (!data) break;
    attempts++;
  } while (attempts < 10);

  return new Response(JSON.stringify({ nickname }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### Anti-Patterns to Avoid

- **Using AsyncStorage for tokens:** Non-encrypted, exposes tokens if device is compromised. Always use SecureStore.
- **`detectSessionInUrl: true` in React Native:** Causes a crash. Must be `false`; handle URL parsing manually via `exchangeCodeForSession`.
- **Calling `supabase.auth.signInWithOAuth` without `skipBrowserRedirect: true`:** On native, this returns a URL — you must open it with `WebBrowser.openAuthSessionAsync`. Without `skipBrowserRedirect`, the SDK tries to navigate itself and fails.
- **Checking `onboarding_completed` only on login:** Must check on every app start in `_layout.tsx`. A user could close the app mid-onboarding.
- **Not adding redirect URL to Supabase dashboard:** OAuth will silently fail with "Invalid redirect_uri" if `wecord://auth/callback` isn't whitelisted.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Encrypted token storage | Custom KeyChain/KeyStore wrapper | `expo-secure-store` | Handles iOS Keychain, Android Keystore, Web localStorage; properly handles biometric lock |
| OAuth PKCE flow | Manual code_verifier/challenge generation | `expo-auth-session` + `expo-crypto` | PKCE has subtle crypto requirements; makeRedirectUri handles scheme differences across platforms |
| Apple Sign In | Custom Apple OAuth web redirect | `expo-apple-authentication` | App Store requires native "Sign in with Apple" button appearance; web flow violates HIG |
| Date picker | Custom wheel/calendar component | `@react-native-community/datetimepicker` | Platform locale, accessibility, keyboard avoidance, iOS spinner/Android calendar variants |
| Nickname uniqueness check | Full uniqueness algorithm | Edge Function with retry loop | DB has no UNIQUE constraint on global_nickname (by design); retry logic belongs server-side |
| Session refresh scheduling | Manual setInterval token refresh | Supabase client `autoRefreshToken: true` | Supabase handles proactive refresh before expiry; manual scheduling has race conditions |

**Key insight:** The Supabase JS client already contains correct session management logic. The only non-obvious requirement is swapping its storage backend from `localStorage` to `expo-secure-store`.

---

## Common Pitfalls

### Pitfall 1: Missing `react-native-url-polyfill`

**What goes wrong:** `supabase.auth.signInWithOAuth` crashes with "URL is not a constructor" or similar.
**Why it happens:** Supabase JS client uses the web `URL` API internally; React Native does not include it.
**How to avoid:** Import `react-native-url-polyfill/auto` at the very top of `apps/mobile/lib/supabase.ts` (before any other imports).
**Warning signs:** Crash on first auth call; error stack shows `URL` constructor.

### Pitfall 2: Redirect URL Not Whitelisted in Supabase Dashboard

**What goes wrong:** OAuth redirect returns an error instead of the callback.
**Why it happens:** Supabase validates `redirect_to` against an allowlist. `wecord://auth/callback` is not added by default.
**How to avoid:** Add `wecord://auth/callback` (and `exp://localhost:8081` for Expo Go local dev) to Supabase Auth > URL Configuration > Redirect URLs before testing.
**Warning signs:** OAuth completes in browser but never calls back to app; Supabase logs show "redirect_uri not allowed".

### Pitfall 3: `onAuthStateChange` Fires Multiple Times

**What goes wrong:** Profile UPSERT or navigation logic runs multiple times, causing flickering or double-writes.
**Why it happens:** Supabase fires `SIGNED_IN` on both initial session restore AND new sign-ins. `TOKEN_REFRESHED` also fires periodically.
**How to avoid:** In `onAuthStateChange`, only run "new user" logic on `SIGNED_IN` event AND when profile does not yet exist. Gate with `if (event === 'SIGNED_IN' && !profile)`.
**Warning signs:** Multiple concurrent profile UPSERT requests in Supabase logs.

### Pitfall 4: `detectSessionInUrl` Default Behavior

**What goes wrong:** Supabase client tries to parse `window.location` (undefined in RN) and throws.
**Why it happens:** The default value is `true` for web; must be explicitly set to `false` for React Native.
**How to avoid:** Always set `detectSessionInUrl: false` in `createClient()` options.

### Pitfall 5: Apple Privacy Policy URL Required for App Store

**What goes wrong:** App rejected during App Store review when Apple OAuth is present.
**Why it happens:** Apple requires a live privacy policy URL in the app's App Store metadata when using Sign In with Apple.
**How to avoid:** Document in STATE.md (already noted). The URL doesn't need to be live for local development, but must exist before TestFlight submission.
**Warning signs:** App Store Connect shows "Your app uses Sign in with Apple but doesn't include a Privacy Policy URL."

### Pitfall 6: `profiles` Row Not Created Immediately After OAuth

**What goes wrong:** Auth guard redirects to onboarding, but `profiles` query returns null because the row was not inserted yet.
**Why it happens:** Supabase Auth creates the `auth.users` row, but the `profiles` row in `public.profiles` must be created by the app (or a database trigger). There's no trigger defined in Phase 1 schema.
**How to avoid:** After `exchangeCodeForSession` / `signInWithIdToken` succeeds, explicitly call the `generate-nickname` Edge Function and upsert the profile row before navigating.

### Pitfall 7: iOS Requires `expo-apple-authentication` Plugin in app.json

**What goes wrong:** Native Apple Sign In button crashes or the entitlement is missing.
**Why it happens:** The `Sign In with Apple` capability must be listed in the Xcode entitlements; EAS Build adds it via the `expo-apple-authentication` config plugin.
**How to avoid:** Add `"expo-apple-authentication"` to `expo.plugins` array in `app.json`.

---

## Code Examples

### Verified: TanStack Query Client Setup

```typescript
// apps/mobile/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,    // 5 min — profile/communities data
      gcTime: 1000 * 60 * 10,      // 10 min garbage collection
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    },
    mutations: {
      retry: 0,
    },
  },
});
```

### Verified: Creator Curation Query

```typescript
// Fetch random communities for curation screen
const { data: creators } = useQuery({
  queryKey: ['curate-communities'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('communities')
      .select('id, name, cover_image_url, slug')
      .order('created_at', { ascending: false }) // MVP: no random algo; most recent
      .limit(20);
    if (error) throw error;
    return data;
  },
  staleTime: Infinity, // Curation list doesn't change during onboarding session
});
```

### Verified: Bulk community_members INSERT for Curation

```typescript
// After user taps "가입하기" on curation screen
// Source: ARCHITECTURE.md §6.1 — community_members BULK INSERT
async function joinSelectedCommunities(communityIds: string[], userId: string) {
  const rows = await Promise.all(
    communityIds.map(async (communityId) => {
      // Generate unique nickname per community
      const res = await supabase.functions.invoke('generate-nickname');
      return {
        user_id: userId,
        community_id: communityId,
        community_nickname: res.data.nickname,
        role: 'member' as const,
      };
    })
  );
  const { error } = await supabase.from('community_members').insert(rows);
  if (error) throw error;
}
```

---

## Schema Changes Required

### AUTH-09: content_rating Column

**Status: ALREADY EXISTS in Drizzle schema** (confirmed in `packages/db/src/schema/content.ts`):
- `posts.content_rating TEXT DEFAULT 'general'` — line 42
- `comments.content_rating TEXT DEFAULT 'general'` — line 129 (confirmed via grep)

The schema definition exists. The migration needs to be verified as applied. Run `supabase db diff` to confirm the column exists in the running database.

### profiles.date_of_birth Column

**Status: ALREADY EXISTS in Drizzle schema** (confirmed in `packages/db/src/schema/auth.ts`):
- `profiles.date_of_birth TEXT` — nullable, stores YYYY-MM-DD format

No new Drizzle schema changes needed for Phase 2. Only ensure migrations are applied.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `expo-app-auth` (deprecated) | `expo-auth-session` | Expo SDK 44+ | expo-app-auth was removed; all projects must use expo-auth-session |
| Manually managing JWT refresh | Supabase `autoRefreshToken: true` | @supabase/supabase-js v2 | Client handles proactive refresh; no setInterval needed |
| `AsyncStorage` for Supabase tokens in RN | Custom SecureStore adapter | Supabase v2 docs | Security requirement; AsyncStorage is unencrypted |
| `@tanstack/react-query` v4 API | v5 API (`gcTime` not `cacheTime`) | @tanstack/react-query v5 | `cacheTime` renamed to `gcTime`; using old name is a silent no-op in v5 |
| expo-router v2 auth pattern | expo-router v4+ `useSegments` + `useEffect` redirect | expo-router v3+ | Slot-based layouts with `useSegments` is the current pattern |

**Deprecated/outdated:**
- `expo-app-auth`: removed, replaced by `expo-auth-session`
- `supabase-js` v1 `auth.session()`: removed in v2; use `auth.getSession()` (async)
- `react-query` `cacheTime`: renamed to `gcTime` in v5; old name is ignored silently

---

## Open Questions

1. **Google OAuth Client ID for iOS/Android**
   - What we know: Google OAuth requires a project in Google Cloud Console and separate OAuth client IDs for iOS (bundle ID), Android (package name + SHA-1), and web.
   - What's unclear: The iOS bundle identifier and Android package name are not set in `app.json` (`NOT SET` per grep). These must be configured before EAS Build can produce working OAuth.
   - Recommendation: Set `expo.ios.bundleIdentifier` and `expo.android.package` in `app.json` as part of Plan 02-01. Use `com.wecord.app` as the canonical identifier.

2. **Apple OAuth on Android/Web — Supabase Dashboard Configuration**
   - What we know: `expo-apple-authentication` is iOS-only. For Android/Web, Apple OAuth uses a web-based flow requiring a "Services ID" in Apple Developer Portal.
   - What's unclear: Whether the user wants Apple Sign In available on Android/Web or iOS-only. CONTEXT.md says "모든 플랫폼에서 표시" but Apple's native SDK only works on iOS.
   - Recommendation: Show Apple OAuth button on all platforms; on iOS use `expo-apple-authentication`, on Android/Web use `supabase.auth.signInWithOAuth({ provider: 'apple' })`. Configure Apple Services ID in Apple Developer Portal for the web flow.

3. **privacy_policy URL for Apple Sign In App Store Submission**
   - What we know: STATE.md warns "Apple OAuth requires live privacy policy URL before first TestFlight."
   - Recommendation: This is a Phase 7 concern per STATE.md. Document it as a known pre-TestFlight blocker. No action needed in Phase 2.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no test config found in apps/mobile or workspace root |
| Config file | Wave 0 gap — needs vitest.config.ts or jest.config.js |
| Quick run command | `pnpm --filter mobile test` (after Wave 0 setup) |
| Full suite command | `pnpm --filter mobile test:ci` (after Wave 0 setup) |

Note: `nyquist_validation: true` is set in config.json. Test infrastructure must be established in Wave 0 of Plan 02-01.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Google OAuth triggers Supabase signInWithOAuth and opens WebBrowser | manual-only | Manual: iOS/Android simulator | N/A |
| AUTH-02 | Apple OAuth triggers signInWithIdToken with valid token | manual-only | Manual: physical iOS device required | N/A |
| AUTH-03 | Profile UPSERT writes correct fields to Supabase | integration | `pnpm --filter mobile test tests/profile.test.ts -x` | ❌ Wave 0 |
| AUTH-04 | SecureStore adapter persists and restores session | unit | `pnpm --filter mobile test tests/supabase.test.ts -x` | ❌ Wave 0 |
| AUTH-05 | ToS screen blocks navigation until checkbox checked | unit | `pnpm --filter mobile test tests/onboarding.test.ts -x` | ❌ Wave 0 |
| AUTH-06 | Curation bulk INSERT creates community_members rows | integration | `pnpm --filter mobile test tests/curate.test.ts -x` | ❌ Wave 0 |
| AUTH-07 | Language selection updates profiles.language | unit | `pnpm --filter mobile test tests/onboarding.test.ts -x` | ❌ Wave 0 |
| AUTH-08 | DoB < 14 years shows age gate error | unit | `pnpm --filter mobile test tests/onboarding.test.ts -x` | ❌ Wave 0 |
| AUTH-09 | posts and comments tables have content_rating column | db smoke | Verify via `supabase db diff` — not a Jest test | ❌ Wave 0 |

**AUTH-01 and AUTH-02 are manual-only:** OAuth flows require real browser redirects and (for Apple) a physical device. These cannot be unit tested meaningfully.

### Sampling Rate
- **Per task commit:** Run `pnpm --filter mobile typecheck` (typecheck is the available gate; test suite is Wave 0 gap)
- **Per wave merge:** `pnpm --filter mobile test` (after Wave 0 setup)
- **Phase gate:** Full suite green + manual OAuth smoke test on device before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/mobile/tests/setup.ts` — test environment + Supabase mock
- [ ] `apps/mobile/tests/onboarding.test.ts` — covers AUTH-05, AUTH-07, AUTH-08
- [ ] `apps/mobile/tests/profile.test.ts` — covers AUTH-03
- [ ] `apps/mobile/tests/supabase.test.ts` — covers AUTH-04 (SecureStore adapter)
- [ ] `apps/mobile/tests/curate.test.ts` — covers AUTH-06
- [ ] Test framework install: `pnpm --filter mobile add -D vitest @testing-library/react-native`
- [ ] `apps/mobile/vitest.config.ts` — configure jsdom + RN preset

---

## Sources

### Primary (HIGH confidence)
- Supabase docs "React Native" — SecureStore adapter, detectSessionInUrl pattern, signInWithOAuth + skipBrowserRedirect
- expo-auth-session SDK 55 — makeRedirectUri, WebBrowser.openAuthSessionAsync
- expo-apple-authentication SDK 55 — signInAsync, signInWithIdToken pattern
- `packages/db/src/schema/auth.ts` — profiles table schema (verified in codebase)
- `packages/db/src/schema/content.ts` — content_rating column (verified in codebase)
- `apps/mobile/app.json` — scheme: "wecord" (verified in codebase)
- `apps/mobile/package.json` — existing installed packages (verified in codebase)
- npm registry (verified 2026-03-18) — all package versions confirmed

### Secondary (MEDIUM confidence)
- STATE.md note — "Apple OAuth requires live privacy policy URL before first TestFlight"
- ARCHITECTURE.md §6.1 — Auth sequence diagram, profiles UPSERT pattern, community_members BULK INSERT

### Tertiary (LOW confidence)
- Apple Developer Program docs — Services ID requirement for Apple OAuth on web/Android (not directly verified against current Apple docs; based on known developer requirement)

---

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — versions verified via npm registry on 2026-03-18
- Architecture: HIGH — patterns from Supabase official docs + verified codebase context
- Pitfalls: HIGH — Supabase RN pitfalls are documented in official guides and are well-known (URL polyfill, detectSessionInUrl, SecureStore)
- Schema changes: HIGH — directly inspected Drizzle schema files; both columns confirmed present

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (Supabase SDK stable; Expo SDK 55 patch versions may update within range)

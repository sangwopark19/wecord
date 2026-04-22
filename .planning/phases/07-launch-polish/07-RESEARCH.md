# Phase 7: Launch Polish — Research

**Researched:** 2026-04-22
**Domain:** React Native (Expo SDK 55) tab expansion, WebView embedding, i18n, App Store/Play Store 제출, Supabase production cutover, in-app account deletion, Next.js public routes on Cloudflare Pages
**Confidence:** HIGH (Most decisions locked in CONTEXT.md D-01..D-37; this research makes them executable)

## Summary

Phase 7는 (1) 5탭 네비게이션 + More/Shop/DM 유저 표면 구현, (2) `delete-user` Edge Function, (3) production Supabase 분리, (4) App Store·Play Store 제출 게이트를 한 Phase에 모두 처리한다. CONTEXT.md가 이미 37개 결정을 잠갔으므로 본 리서치는 "어떻게 실행할지"에 집중한다.

가장 중요한 발견 5가지:
1. **`profiles.user_id`에 `auth.users` FK가 없다** — `auth.admin.deleteUser()`만으로는 profile 레코드가 고아(orphan)로 남는다. delete-user Edge Function은 명시적 삭제 순서를 관리해야 한다.
2. **react-native-webview 13.16.0**이 Expo SDK 55 권장 버전 — `npm view`로 확인 완료. 단 `onShouldStartLoadWithRequest`는 iOS/Android에서 동작이 다르며 Android는 `navigationType` 필드가 없다.
3. **Apple Guideline 4.8는 2024년 업데이트** — "Sign in with Apple" 고정이 아니라 3가지 조건(이름/이메일만 수집, 이메일 숨김 옵션, 추적 미수집)을 충족하는 login 서비스면 OK. 현재 구조(Apple + Google)는 여전히 Apple Sign-In 필수.
4. **Google Play 2023년 12월부터 앱 내 계정 삭제 필수** + Data Safety form의 Deletion URL 필드 필수 — CONTEXT D-37(앱 내 즉시 삭제)로 이미 커버되나 Data Safety form과 Privacy Policy 내 deletion 섹션도 작성해야 한다.
5. **Expo Router tabs의 5탭 + `href:null` 숨김 탭 구조는 안정적**이지만 커스텀 tabBar를 쓸 경우 `href:null`이 동작하지 않아 코드 레벨 필터링이 필요하다. 현재 `(tabs)/_layout.tsx`는 기본 Tabs를 쓰므로 문제 없음.

**Primary recommendation:** Plan을 2개로 나눈다. Plan 07-01 = More 탭 + Shop + DM + i18n + 5탭 확장 (순수 클라이언트). Plan 07-02 = delete-user Edge Function + privacy/terms public routes on admin + 프로덕션 Supabase 컷오버 + App Store/Play Store 제출 체크리스트 (인프라/컴플라이언스).

## User Constraints (from CONTEXT.md)

### Locked Decisions (D-01 ~ D-37)
**Tab structure (D-01 ~ D-04):**
- D-01: Home / Community / Shop / DM / More 5탭
- D-02: Highlight은 커뮤니티 내부 3탭 유지
- D-03: 알림 벨은 Home 헤더만
- D-04: `(tabs)/notifications.tsx` + `href:null` 기존 구조 유지

**More tab layout (D-05 ~ D-09):**
- D-05: 프로필 카드(아바타+닉네임+bio preview) + 우측 '프로필 편집'
- D-06: 순서 — 프로필 카드 → 가입 커뮤니티 → 설정 → 앱 정보 → 로그아웃
- D-07: 가입 커뮤니티 행 = 아이콘+이름+내 닉네임, 탭 시 해당 커뮤니티로
- D-08: 설정 단일 페이지(언어/알림/약관/개인정보/버전)
- D-09: 앱 정보 = 버전/약관/개인정보 별도 섹션

**Profile edit (D-10 ~ D-14):**
- D-10: 단일 화면 일괄 저장 + '저장' 버튼
- D-11: 아바타 ActionSheet (카메라/갤러리/기본/삭제)
- D-12: Phase 3 post upload 패턴 재사용 (expo-image-picker + Supabase Storage)
- D-13: 글로벌 닉네임 2~20자, 중복 허용, User#XXXX 코드가 식별자
- D-14: bio 최대 150자 평문 + 줄바꿈

**Language (D-15 ~ D-16):**
- D-15: `(onboarding)/language.tsx` 라디오 패턴을 `LanguagePicker` 공통 컴포넌트로 추출
- D-16: 즉시 `i18n.changeLanguage()` + `profiles.language` 업데이트, 앱 재시작 없음

**Notifications (D-17 ~ D-19):**
- D-17: 설정에 '푸시 알림 수신' 글로벌 스위치 (OS 권한 반영/변경)
- D-18: '커뮤니티별 설정' 행 → 가입 커뮤니티 리스트 → 기존 `(community)/[id]/notification-preferences` 재사용
- D-19: DM·Shop 카테고리 스위치 없음

**Logout (D-20 ~ D-21):**
- D-20: 확인 다이얼로그 → `signOut()` → SecureStore 토큰 제거 → `/(auth)/login` replace
- D-21: 기존 `authStore.signOut()` + TanStack Query cache invalidate

**Shop (D-22 ~ D-26):**
- D-22: `react-native-webview` 도입, 전체 화면 embed
- D-23: 상단 헤더(뒤로/ Shop / 새로고침)
- D-24: 인증 전달 없음, 무명 방문, SSO는 v1.1
- D-25: 에러/오프라인 전용 Fallback(자동 재시도 없음)
- D-26: 외부 링크 차단 → `expo-web-browser` 오픈

**DM placeholder (D-27 ~ D-29):**
- D-27: 중앙 정렬 + chatbubbles-outline + 'Notify Me' CTA
- D-28: `profiles.dm_launch_notify` boolean 컬럼 신규, 재탭 시 'Notified' 상태
- D-29: 런칭 fan-out은 v1.1

**Submission compliance (D-30 ~ D-37):**
- D-30: 17+ 연령 등급, content gate UI는 v1.1
- D-31: `apps/admin`의 public `/privacy`, `/terms` — KO + EN, Cloudflare Pages 기본 도메인
- D-32: Apple OAuth 감사 (Hide My Email / 등가 표시 / 삭제 경로 / Privacy URL)
- D-33: Production Supabase 프로젝트 신규 생성 + EAS build secrets 분리
- D-34: 스크린샷·메타데이터 체크리스트 문서(촬영은 디자인 범위 밖)
- D-35: app icon/splash 재점검
- D-36: `expo-tracking-transparency` 설치하나 사용 없음 선언, ATT prompt 안 띄움
- D-37: 앱 내 즉시 삭제 — Edge Function `delete-user` 신설 + 3단계 UI(warning → DELETE 타이핑 → processing)

### Claude's Discretion
- WebView 뒤로가기 활성/비활성 표현
- 5탭 아이콘(Ionicons: home / people / bag / chatbubbles / person)
- 프로필 편집 dirty-state 감지 로직
- 아바타 크롭/리사이즈 방식 (expo-image-manipulator)
- 설정 행 세부 스타일
- DM 일러스트 (Ionicons vs custom SVG)
- `/privacy`, `/terms` MDX vs TSX
- delete-user 내부 트랜잭션 처리 (pg_function vs 순차 호출)
- ATT Info.plist 처리(설치 안 하는 경우 포함)
- EAS production build profile runtime version 정책

### Deferred Ideas (OUT OF SCOPE)
- 실제 DM 메시징 (v1.1 Jelly와 함께)
- Shop SSO 연동
- content_rating 기반 UI 게이트
- 커스텀 도메인 (wecord.app)
- TH/ZH/JA 약관 번역 (v1.0.1)
- 인앱 고객지원 폼

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SHOP-01 | Shop tab에 x-square.kr WebView 노출 | react-native-webview 13.16.0, D-22~D-24 |
| SHOP-02 | WebView 앱 내 navigation (back, refresh) | goBack / reload / canGoBack API, D-23 |
| DMPL-01 | DM tab "Coming Soon" placeholder | `(tabs)/dm.tsx` 신규 + PrimaryCTAButton 재사용, D-27 |
| DMPL-02 | Notify Me 버튼 저장 | `profiles.dm_launch_notify` 컬럼 신규, D-28 |
| MORE-01 | 글로벌 프로필 편집 (닉네임/아바타/bio) | Phase 3 업로드 패턴, ActionSheet, dirty-state, D-10~14 |
| MORE-02 | 언어 설정 변경 | `(onboarding)/language.tsx` → LanguagePicker 추출 + `i18n.changeLanguage`, D-15~16 |
| MORE-03 | 가입 커뮤니티 리스트 | communityMembers 조인 쿼리, D-07 |
| MORE-04 | 앱 설정 (언어/알림) | 설정 단일 페이지 + 기존 notification-preferences 재사용, D-17~18 |
| MORE-05 | 로그아웃 | authStore.signOut 재사용 + cache invalidate, D-20~21 |

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| 5탭 렌더 + 라우팅 | Mobile client (Expo Router) | — | Client-side navigation only |
| 프로필 편집 UI + 상태 관리 | Mobile client | API (Supabase RLS update) | UI local + supabase.from('profiles').update |
| 아바타 업로드 | Mobile client | Storage (Supabase Storage bucket) | expo-image-picker → manipulateAsync → supabase.storage |
| 언어 설정 즉시 반영 | Mobile client | API (profiles.language) | i18n.changeLanguage + single row update |
| 가입 커뮤니티 리스트 쿼리 | Mobile client (TanStack Query) | API (Supabase RLS select) | community_members 조인, RLS가 본인만 반환 |
| 커뮤니티별 알림 설정 진입 | Mobile client | — | 기존 화면 재사용, 라우팅만 |
| 로그아웃 | Mobile client | Auth | authStore.signOut + SecureStore clear |
| Shop WebView 렌더 | Mobile client | CDN (x-square.kr 외부) | WebView 컴포넌트, 인증 전달 없음 |
| Shop 외부 링크 차단 | Mobile client | Browser (expo-web-browser) | onShouldStartLoadWithRequest → openBrowserAsync |
| DM Notify Me 저장 | Mobile client | API (profiles.dm_launch_notify) | boolean update, 단일 컬럼 |
| 계정 삭제 orchestration | Edge Function (delete-user) | Database (service_role) + Auth | 순서화된 삭제 필요(FK가 불완전하므로) |
| Privacy/Terms 호스팅 | Next.js (admin app, public route group) | CDN (Cloudflare Pages) | 인증 없는 정적 페이지 |
| App Store/Play Store 메타 | 외부(App Store Connect, Play Console) | — | 제출 체크리스트 문서화만 |
| Production Supabase cutover | Infrastructure (Supabase CLI) | Edge Functions + Storage + Auth config | CLI 스크립트와 secrets |

## Standard Stack

### Core (Already installed — reuse)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo | ~55.0.7 | Framework | [VERIFIED: package.json] 현재 버전 |
| expo-router | ~55.0.6 | File-based routing | [VERIFIED: package.json] 5탭 Tabs 지원 |
| @expo/vector-icons | ^15.1.1 | Ionicons | [VERIFIED: package.json] outline/filled variants |
| expo-image-picker | ~55.0.13 | Avatar picker | [VERIFIED: package.json] Phase 3에서 사용 중 |
| expo-image-manipulator | ~55.0.11 | Avatar resize/compress | [VERIFIED: package.json] Phase 3에서 사용 중 |
| expo-notifications | ~55.0.13 | getPermissionsAsync | [VERIFIED: package.json] 설정 스위치 reconcile |
| expo-web-browser | ~55.0.10 | 외부 링크 오픈 | [VERIFIED: package.json] D-26에서 사용 |
| expo-linking | ~55.0.7 | openSettings | [VERIFIED: package.json] OS 설정 딥링크 |
| expo-secure-store | ~55.0.9 | 로그아웃 시 토큰 제거 | [VERIFIED: package.json] 기존 사용 |
| @supabase/supabase-js | ^2.99.2 | Auth + Storage + DB | [VERIFIED: package.json] |
| @tanstack/react-query | ^5.90.21 | 서버 상태 | [VERIFIED: package.json] |
| i18next / react-i18next | ^25 / ^16 | 즉시 언어 변경 | [VERIFIED: package.json] `changeLanguage()` |
| zustand | ^5.0.12 | authStore | [VERIFIED: package.json] |
| nativewind | ^4.1.23 | Dark theme | [VERIFIED: package.json] |

### Supporting (New — needs install)
| Library | Version | Purpose | Install |
|---------|---------|---------|---------|
| react-native-webview | **13.16.0** | Shop 탭 embed | [VERIFIED: npm view] Expo SDK 55 bundled version |
| @expo/react-native-action-sheet | **4.1.1** | 아바타 ActionSheet | [VERIFIED: npm view] iOS native + Android fallback |
| expo-tracking-transparency | **~55.0.x** (SDK 55 line available: 55.0.0~55.0.13) | ATT 설치만, prompt 없음 | [VERIFIED: npm view versions] 실제 call 없이 설치만 — D-36 |

**Installation:**
```bash
cd apps/mobile
npx expo install react-native-webview @expo/react-native-action-sheet expo-tracking-transparency
```

`npx expo install` 사용이 필수 — 버전을 SDK 55에 맞게 자동 pin.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@expo/react-native-action-sheet` | Native `ActionSheetIOS` + custom Android modal | iOS-only API, Android 분기가 필요 → 공용 라이브러리가 훨씬 간결 |
| MDX for /privacy | 정적 TSX 컴포넌트 | MDX는 추가 loader 설정 필요 (Next.js 16) — 초기엔 TSX가 안전. 내용 업데이트 잦아지면 v1.1에서 MDX 전환 |
| `expo-tracking-transparency` 미설치 | 플러그인 설치하지 않고 Info.plist key 없음 | Apple 심사에서 자동 "No tracking" 인식 — 설치 안 해도 무방하나, 향후 analytics 추가를 위해 미리 설치하는 것이 안전 |

**Version verification:**
```
react-native-webview: 13.16.0 (npm latest) — Expo SDK 55 recommended
@expo/react-native-action-sheet: 4.1.1 (npm latest) — 대부분의 RN 버전 호환
expo-tracking-transparency: 55.0.13 (latest stable on SDK 55 line)
```

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Mobile App (Expo SDK 55)                     │
│                                                                 │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │          (tabs)/_layout.tsx  — 5 Tabs + hidden           │  │
│   │  Home | Community | Shop | DM | More   (notif: href:null)│  │
│   └──┬──────┬──────┬──────┬──────┬────────────────────────────┘  │
│      │      │      │      │      │                              │
│      ▼      ▼      ▼      ▼      ▼                              │
│    Home  Comm  Shop   DM   More ────────────────────────┐       │
│    (P5)  (P3) ┌──┐ ┌──┐  ┌─────────────────────────┐   │       │
│              │WV│ │CS│  │ Profile card + list      │   │       │
│              └┬─┘ └┬─┘  │ Joined comms / settings  │   │       │
│               │    │    │ About / Logout           │   │       │
│               │    │    └──────────┬───────────────┘   │       │
│               │    │               ▼                   │       │
│               │    │    (more)/ group routes           │       │
│               │    │    ├─ profile-edit               │       │
│               │    │    ├─ settings                   │       │
│               │    │    ├─ joined-communities         │       │
│               │    │    ├─ language                   │       │
│               │    │    └─ delete-account/             │       │
│               │    │         ├─ warning                │       │
│               │    │         ├─ confirm (type DELETE)  │       │
│               │    │         └─ processing             │       │
└───────────────│────│────────────────────────────────────│──────┘
                │    │                                    │
   ┌────────────▼──┐ │                                    │
   │ x-square.kr   │ │ supabase.auth.signOut +            │
   │ (external CDN)│ │ SecureStore clear                  │
   └───────────────┘ │                                    │
                     │                                    │
              ┌──────▼──────┐                  ┌──────────▼──────────┐
              │ Notify Me   │                  │ Edge: delete-user    │
              │ profiles.   │                  │ (service_role)       │
              │ dm_launch_  │                  │  1. validate auth    │
              │ notify=true │                  │  2. DELETE profile   │
              └─────────────┘                  │  3. DELETE cm, pref  │
                                               │  4. DELETE push_tok  │
                                               │  5. SOFT-DELETE posts│
                                               │     /comments        │
                                               │  6. auth.admin       │
                                               │     .deleteUser()    │
                                               └──────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│        apps/admin (Next.js 16 on Cloudflare Pages)              │
│                                                                 │
│   app/(dashboard)/*    ← auth required (existing)               │
│   app/(public)/        ← NEW: no auth                           │
│   ├─ privacy/page.tsx  (KO+EN with ?lang= param)                │
│   └─ terms/page.tsx                                             │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure Additions

```
apps/mobile/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx        # MODIFY: 5 tabs + 1 hidden
│   │   ├── index.tsx          # (Home, unchanged)
│   │   ├── community.tsx      # (unchanged)
│   │   ├── notifications.tsx  # (unchanged, href:null)
│   │   ├── shop.tsx           # NEW: WebView
│   │   ├── dm.tsx             # NEW: Coming Soon
│   │   └── more.tsx           # NEW: account hub
│   ├── (more)/                # NEW group
│   │   ├── _layout.tsx
│   │   ├── profile-edit.tsx
│   │   ├── settings.tsx
│   │   ├── joined-communities.tsx
│   │   ├── language.tsx       # uses shared LanguagePicker
│   │   └── delete-account/
│   │       ├── _layout.tsx
│   │       ├── warning.tsx
│   │       ├── confirm.tsx
│   │       └── processing.tsx
│   └── _layout.tsx            # wrap with ActionSheetProvider
├── components/
│   ├── settings/
│   │   ├── LanguagePicker.tsx      # extracted from onboarding
│   │   ├── SettingsRow.tsx         # iOS-style list row primitive
│   │   └── ProfileEditForm.tsx
│   ├── more/
│   │   ├── ProfileCard.tsx
│   │   ├── JoinedCommunityRow.tsx
│   │   └── AvatarActionSheet.tsx   # thin wrapper over useActionSheet
│   └── shop/
│       ├── ShopWebView.tsx
│       ├── ShopHeader.tsx
│       └── ShopErrorFallback.tsx
└── hooks/
    ├── profile/
    │   ├── useUpdateProfile.ts
    │   └── useUploadAvatar.ts       # reuses Phase 3 upload pattern
    ├── community/
    │   └── useMyCommunities.ts      # joined communities list
    └── account/
        └── useDeleteAccount.ts      # calls Edge Function

packages/supabase/
├── migrations/
│   ├── 20260422000001_phase7_dm_launch_notify.sql       # NEW
│   ├── 20260422000002_phase7_avatars_bucket.sql         # NEW if avatars bucket absent
│   └── 20260422000003_phase7_delete_user_function.sql   # NEW: plpgsql delete_account()
└── functions/
    └── delete-user/
        └── index.ts                                      # NEW

apps/admin/
└── app/
    └── (public)/                                         # NEW route group
        ├── layout.tsx
        ├── privacy/page.tsx
        └── terms/page.tsx
```

### Pattern 1: Expo Router 5-Tab with Hidden Tabs

[CITED: https://docs.expo.dev/router/advanced/tabs/]

```tsx
// apps/mobile/app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, ... }}>
      {/* Order in file === display order in bottom bar */}
      <Tabs.Screen name="index"    options={{ tabBarIcon: ({focused, color, size}) =>
        <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} /> }} />
      <Tabs.Screen name="community" options={{ tabBarIcon: ({focused, color, size}) =>
        <Ionicons name={focused ? 'people' : 'people-outline'} size={size} color={color} /> }} />
      <Tabs.Screen name="shop"     options={{ tabBarIcon: ({focused, color, size}) =>
        <Ionicons name={focused ? 'bag' : 'bag-outline'} size={size} color={color} /> }} />
      <Tabs.Screen name="dm"       options={{ tabBarIcon: ({focused, color, size}) =>
        <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={size} color={color} /> }} />
      <Tabs.Screen name="more"     options={{ tabBarIcon: ({focused, color, size}) =>
        <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} /> }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
```

**Gotcha:** 현재 코드는 `tabBarIcon: ({ color, size }) => ...`로 `focused`를 사용하지 않음. filled/outline 토글 위해 `focused` 인자를 추가하는 작은 변경이 반드시 필요.

### Pattern 2: WebView with External Link Blocking

[CITED: https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md]

```tsx
// apps/mobile/components/shop/ShopWebView.tsx
import { useRef, useState } from 'react';
import { WebView, WebViewNavigation } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';

const ALLOWED_HOST = 'x-square.kr';

export function ShopWebView() {
  const ref = useRef<WebView>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [error, setError] = useState(false);

  const handleShouldStart = (req: any) => {
    // iOS provides navigationType="click"; Android does not.
    // Instead check URL origin - if not x-square.kr host, open externally.
    try {
      const url = new URL(req.url);
      if (!url.hostname.endsWith(ALLOWED_HOST)) {
        WebBrowser.openBrowserAsync(req.url);
        return false;
      }
    } catch { return false; }
    return true;
  };

  if (error) return <ShopErrorFallback onRetry={() => { setError(false); ref.current?.reload(); }} />;

  return (
    <WebView
      ref={ref}
      source={{ uri: 'https://x-square.kr' }}
      onNavigationStateChange={(nav: WebViewNavigation) => setCanGoBack(nav.canGoBack)}
      onShouldStartLoadWithRequest={handleShouldStart}
      onError={() => setError(true)}
      onHttpError={({ nativeEvent }) => {
        if (nativeEvent.statusCode >= 500) setError(true);
      }}
      allowsBackForwardNavigationGestures
      startInLoadingState
    />
  );
}
```

**CRITICAL iOS/Android difference:** `onShouldStartLoadWithRequest`의 `navigationType` 필드는 iOS에만 존재. Android는 없다. URL hostname 기준 필터링으로 통일하는 방식이 교차 플랫폼 표준. [CITED: react-native-webview/react-native-webview#3321]

### Pattern 3: Delete-User Edge Function (Orchestrated)

[CITED: https://supabase.com/docs/reference/javascript/auth-admin-deleteuser + https://supabase.com/docs/guides/database/postgres/cascade-deletes]

**CRITICAL finding:** 현재 스키마에서 `profiles.user_id`에 `REFERENCES auth.users(id) ON DELETE CASCADE`가 **없다**. `push_tokens`만 cascade. 따라서 단순 `auth.admin.deleteUser()` 호출로는 profile/community_members/notification_preferences가 고아로 남는다.

**전략 선택:**
- **Option A (권장):** 신규 마이그레이션으로 모든 user_id FK에 `ON DELETE CASCADE` 추가 + Edge Function은 `auth.admin.deleteUser()` 한 번만 호출 + posts/comments의 soft-delete만 별도 처리.
- **Option B:** plpgsql SECURITY DEFINER 함수 `delete_account(p_user_id UUID)`에서 순서대로 삭제 (atomic transaction).
- **Option C:** Edge Function 안에서 supabase-js로 순차 호출 (non-atomic, 실패 시 고아 가능).

**권장: Option B** — atomic + 한 곳에서 삭제 순서 관리, Edge Function은 인증만 담당.

```sql
-- packages/supabase/migrations/20260422000003_phase7_delete_user_function.sql
CREATE OR REPLACE FUNCTION delete_account(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Soft-delete posts and comments (preserve thread integrity)
  UPDATE posts   SET deleted_at = now() WHERE author_id = p_user_id AND deleted_at IS NULL;
  UPDATE comments SET deleted_at = now() WHERE author_id = p_user_id AND deleted_at IS NULL;

  -- Hard delete user-owned rows (no content preservation needed)
  DELETE FROM notification_preferences WHERE user_id = p_user_id;
  DELETE FROM community_follows        WHERE follower_cm_id IN (SELECT id FROM community_members WHERE user_id = p_user_id);
  DELETE FROM community_follows        WHERE following_cm_id IN (SELECT id FROM community_members WHERE user_id = p_user_id);
  DELETE FROM community_members        WHERE user_id = p_user_id;
  DELETE FROM notifications            WHERE user_id = p_user_id;
  DELETE FROM likes                    WHERE user_id = p_user_id;
  DELETE FROM reports                  WHERE reporter_id = p_user_id;
  -- push_tokens cascades via existing FK
  DELETE FROM profiles                 WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
REVOKE ALL ON FUNCTION delete_account(UUID) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_account(UUID) TO service_role;
```

```ts
// packages/supabase/functions/delete-user/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace('Bearer ', '');
  const supabaseUserClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user } } = await supabaseUserClient.auth.getUser(token);
  if (!user) return new Response('unauthorized', { status: 401 });

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Orchestrated delete (atomic via RPC)
  const { error: rpcError } = await admin.rpc('delete_account', { p_user_id: user.id });
  if (rpcError) return new Response(JSON.stringify({ error: rpcError.message }), { status: 500 });

  // Finally, delete auth.users row — MUST be last
  const { error: authError } = await admin.auth.admin.deleteUser(user.id);
  if (authError) return new Response(JSON.stringify({ error: authError.message }), { status: 500 });

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});
```

**Verification steps:**
1. Test on dev project with a throwaway user: post 3 posts, 2 comments, 2 likes, follow 1 member, enable notifications → delete → verify posts/comments have `deleted_at`, other rows gone, auth.users gone.
2. Confirm app state after successful 200: immediate `authStore.signOut()` (local clear, no server call since session is invalid now), `router.replace('/(auth)/login')`.

### Pattern 4: LanguagePicker Extraction (D-15)

```tsx
// apps/mobile/components/settings/LanguagePicker.tsx
interface LanguagePickerProps {
  value: SupportedLanguage;
  onChange: (lang: SupportedLanguage) => void;
  /** onboarding mode keeps a CTA below; settings mode auto-commits on change */
  mode: 'onboarding' | 'settings';
}
```

기존 `(onboarding)/language.tsx`의 FlatList + 라디오 UI 부분을 그대로 이동. onboarding은 `useState`로 선택만 쌓고 '계속' 버튼에서 commit. settings는 `onChange`에서 즉시 `i18n.changeLanguage()` + profile update.

### Pattern 5: Profile Edit Dirty-State Detection

useState + 단일 스냅샷 비교 방식 (React Hook Form 미도입 상태 — 기존 onboarding도 useState 기반).

```tsx
const [initial] = useState({ nickname: profile.globalNickname, bio: profile.bio ?? '', avatarUrl: profile.avatarUrl });
const [current, setCurrent] = useState(initial);
const isDirty = current.nickname !== initial.nickname
              || current.bio !== initial.bio
              || current.avatarUrl !== initial.avatarUrl;
// 저장 버튼 disabled = !isDirty || loading
```

아바타는 expo-image-picker 선택 후 로컬 URI를 `current.avatarUrl`에 세팅 → 저장 시 업로드 → 성공 시 public URL로 profile update.

### Pattern 6: Avatar Upload (D-12 Phase 3 재사용)

[VERIFIED: `apps/mobile/hooks/post/useCreatePost.ts`]

**주의 — avatars 버킷이 없다.** 현재 `post-media` 버킷만 존재. 두 가지 옵션:
- **A)** 신규 `avatars` 버킷 생성 — 파일 경로 `avatars/<user_id>/avatar.jpg`, RLS는 first folder === auth.uid()
- **B)** `post-media` 버킷 재사용 — `profiles/<user_id>/avatar.jpg` 경로

**권장: Option A** — bucket 단위 분리가 청소/할당량 관리에 유리.

```sql
-- New migration: phase7_avatars_bucket.sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid())::text);
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid())::text);
CREATE POLICY "avatars_select_public" ON storage.objects FOR SELECT TO authenticated, anon
  USING (bucket_id = 'avatars');
CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (select auth.uid())::text);
```

Hook:
```ts
// hooks/profile/useUploadAvatar.ts
export async function uploadAvatar(userId: string, uri: string): Promise<string> {
  const compressed = await manipulateAsync(uri, [{ resize: { width: 512, height: 512 } }], { compress: 0.8, format: SaveFormat.JPEG });
  const base64 = await readAsStringAsync(compressed.uri, { encoding: 'base64' });
  const data = decode(base64);
  const path = `${userId}/avatar-${Date.now()}.jpg`; // timestamp to bust CDN cache
  const { error } = await supabase.storage.from('avatars').upload(path, data, { contentType: 'image/jpeg', upsert: true });
  if (error) throw error;
  const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
  return pub.publicUrl;
}
```

### Pattern 7: Push Permission Reconcile (D-17)

[CITED: https://docs.expo.dev/versions/latest/sdk/notifications/]

```ts
// Toggling push switch
const togglePush = async (desired: boolean) => {
  if (desired) {
    const { status, canAskAgain } = await Notifications.getPermissionsAsync();
    if (status === 'granted') { setLocal(true); return; }
    if (canAskAgain) {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      setLocal(newStatus === 'granted');
    } else {
      // User denied twice — OS will not re-prompt
      Alert.alert('알림 설정', '시스템 설정에서 알림을 켜주세요.', [
        { text: '취소', style: 'cancel' },
        { text: '설정 열기', onPress: () => Linking.openSettings() },
      ]);
    }
  } else {
    // Can't turn OS notifications off from an app — only clear local pref
    setLocal(false);
  }
};
```

**Reconcile pattern:** Screen focus 시 `getPermissionsAsync()`를 호출해 로컬 스위치 상태를 OS 상태와 sync. `useFocusEffect`로 처리. 이는 CONTEXT D-17 명시 요구사항.

### Pattern 8: i18n.changeLanguage + TanStack Query

언어 변경 후에도 translated post/comment 내용이 번역된 대로 유지됨 (Phase 4 TranslateButton은 사용자 탭 시에만 호출되므로 자동 재번역 안 함). 그러나 **notification copy** (미리 저장된 `notifications.title/body`)는 이미 텍스트가 저장되어 있어 언어 변경해도 바뀌지 않음. 이는 기존 동작이며 Phase 7 범위 밖.

UI 문자열(`t('...')`)은 react-i18next가 `i18n.on('languageChanged', ...)`로 자동 rerender. 추가 invalidation 불필요.

**Exception:** `profile.language`가 업데이트될 때 `['profile']` TanStack Query key는 invalidate해야 일관성 유지 (다른 화면이 캐시된 profile을 읽을 수 있으므로).

### Anti-Patterns to Avoid

- **하드코드 i18n 문자열 in More tab** — 반드시 namespace `more.json` / `settings.json` / `shop.json` / `dm.json` / `legal.json` 생성, KO + EN 동시 입력 (기존 5 언어 중 TH/ZH/JA는 D-31 deferred).
- **`Alert.alert` 대신 modal dialog 컴포넌트 신규 작성** — D-20은 기존 `LeaveConfirmDialog`/`DeleteConfirmDialog` 패턴(useLeaveConfirmDialog 훅) 재사용. 새 컴포넌트 금지.
- **profile edit 화면에서 각 필드 별 저장 버튼** — D-10 위반. 상단 단일 '저장' 버튼만.
- **Shop WebView에 사용자 토큰/세션 전달** — D-24 위반. 무명 방문.
- **ATT prompt 요청** — D-36 위반. 플러그인 설치만, `requestTrackingPermissionsAsync()` 호출 금지.
- **`navigationType === 'click'` 기반 링크 필터** — Android에서 `navigationType`이 없어 무시됨. hostname 기준으로 통일할 것.
- **Auth 로그아웃 후 stale TanStack Query 캐시** — D-21은 cache invalidate 명시. `queryClient.clear()` 또는 targeted invalidate 필수.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-platform ActionSheet | 커스텀 modal + 플랫폼 분기 | `@expo/react-native-action-sheet` | iOS native sheet + Android Material fallback이 이미 구현됨 |
| WebView 네비게이션 상태 추적 | 자체 history 스택 | `canGoBack` + `onNavigationStateChange` | 라이브러리가 이미 제공 |
| 외부 브라우저 오픈 | `Linking.openURL` | `expo-web-browser.openBrowserAsync` | in-app browser가 UX 우수 (dismiss 가능), 이미 설치됨 |
| ATT 권한 요청 | 네이티브 modu 작성 | `expo-tracking-transparency` | iOS 14+ ATT API wrapper. 단 D-36은 설치만 |
| 이미지 리사이즈 | Canvas 직접 처리 | `expo-image-manipulator` (이미 사용 중) | Phase 3 패턴 재사용 |
| 언어 감지 | navigator.language 직접 파싱 | `expo-localization.getLocales()` + i18next | 이미 사용 중 |
| Confirm dialog | 신규 modal 컴포넌트 | `Alert.alert` (imperative) | 코드베이스에 이미 4개 dialog가 이 패턴 사용 중 |
| User 삭제 SQL | 앱에서 `DELETE FROM profiles` 등 | Edge Function + plpgsql function | RLS, 순서, auth.users 접근이 service_role 필요 |
| Privacy policy i18n | 별도 번역 파이프라인 | URL query param `?lang=ko/en` + 단순 switch | MVP는 2 언어 + 정적 텍스트 |

**Key insight:** Phase 7은 기능보다 "제출 게이트 + 글루 코드" 성격이 강하다. 새로 만드는 것보다 기존 패턴을 재사용/추출하는 작업이 압도적으로 많음. 모든 MORE 탭 feature는 Phase 2/3/4에서 유래된 패턴의 재조합.

## Common Pitfalls

### Pitfall 1: `profiles.user_id`에 CASCADE가 없어 delete-user 실패 혹은 고아 레코드
**What goes wrong:** `supabase.auth.admin.deleteUser(user.id)` 호출 후 auth.users 레코드는 사라지지만 `profiles`, `community_members`, `notification_preferences` 등은 그대로 남는다. 재가입 시 unique constraint 충돌 가능.
**Why it happens:** Phase 1 마이그레이션이 `profiles.user_id`에 FK REFERENCES auth.users를 선언하지 않았음. `push_tokens`만 cascade.
**How to avoid:** Option B(plpgsql `delete_account()` RPC)로 순서화 삭제 + service_role EXECUTE 권한 + 마지막에 `auth.admin.deleteUser()` 호출.
**Warning signs:** 로그에서 `duplicate key value violates unique constraint "cm_user_community_unique"` 또는 profile이 보이지만 auth session이 invalid인 상태.

### Pitfall 2: react-native-webview의 `onShouldStartLoadWithRequest`가 Android에서 동작 차이
**What goes wrong:** iOS에서 외부 링크 차단이 정상 동작하나 Android에서 링크가 WebView 안에 로드되거나, 역으로 iOS에서 intent:// 스킴이 차단되지 않고 iOS 에러.
**Why it happens:** `navigationType` 필드는 iOS에만 존재. Android는 main frame/iframe 구분이 다름.
**How to avoid:** URL hostname으로 필터링 (pattern 2 참조). 추가로 `originWhitelist={[ 'https://x-square.kr' ]}`를 설정하되 중복 안전장치로만 사용 (main issue는 hostname 필터).
**Warning signs:** Android 기기에서 외부 링크 탭 시 WebView 안에 로드됨 / iOS에서 `tel:`, `mailto:` 스킴 크래시.

### Pitfall 3: Expo Router `href:null` 커스텀 tabBar에서 무효
**What goes wrong:** 만약 tabBar 커스터마이즈가 추가되면 `href:null`이 무시되어 숨김 탭이 나타남.
**Why it happens:** 커스텀 tabBar 구현이 `children` 배열을 직접 돌면서 rendering하기 때문.
**How to avoid:** 현재 `(tabs)/_layout.tsx`는 기본 `Tabs`를 쓰므로 안전. 향후 커스텀화 시 Screen filter로 처리.
**Warning signs:** 5개 탭 + 1개 빈 탭이 함께 표시됨.

### Pitfall 4: Apple Sign-In 버튼 표기 규칙 위반으로 심사 리젝트
**What goes wrong:** Google 버튼이 Apple보다 위에 있거나, 크기가 다르거나, 스타일(White on dark / Black on light) 위반으로 Guideline 4.8 reject.
**Why it happens:** Apple HIG는 Apple 버튼과 다른 소셜 버튼이 "equivalent" 표시될 것을 요구 — 동일 크기, 동등 prominence.
**How to avoid:** 기존 `(auth)/login.tsx`에서 두 버튼이 같은 스타일/크기/순서인지 재검토. Apple 버튼은 상단 또는 최소한 동등 위치. 대조비 충족되도록 white-on-dark variant 사용.
**Warning signs:** App Review "Guideline 4.8 - Design - Login Services" 이유 리젝트.

### Pitfall 5: 계정 삭제 후 stale session으로 Supabase 호출이 하지만 데이터가 사라짐
**What goes wrong:** delete-user Edge Function 성공 후 client가 즉시 signOut()을 안 하면 stale JWT로 호출 → 401 retry 루프.
**Why it happens:** signOut()이 먼저 호출되면 Edge Function에 JWT 전달 불가. Edge Function이 먼저 호출되어 auth.users가 삭제되면 client의 JWT는 유효하지만 DB row는 없음.
**How to avoid:** 순서 고정 — (1) 클라이언트가 Edge Function 호출 (JWT 유효, 서버가 user.id 추출) → (2) 서버 delete_account + auth.admin.deleteUser → (3) 서버 200 응답 → (4) 클라이언트 즉시 `authStore.signOut()` (로컬 토큰 제거) → (5) `router.replace('/(auth)/login')`.
**Warning signs:** 삭제 후 다음 화면에서 `{ error: "User not found" }` 또는 무한 로딩.

### Pitfall 6: i18n.changeLanguage 후 `profiles.language` 업데이트 미실행으로 재시작 시 원복
**What goes wrong:** 설정 화면에서 언어 변경해도 앱 종료/재시작 시 이전 언어로 돌아감.
**Why it happens:** i18n은 메모리 상태, profile.language가 DB 상태. `authStore.initialize()` 시 `profile.language`를 기반으로 `i18n.changeLanguage`를 호출.
**How to avoid:** 설정 화면에서 둘 다 즉시 업데이트 (onboarding/language.tsx 패턴 그대로).
**Warning signs:** 앱 재시작 시 언어가 원복.

### Pitfall 7: Cloudflare Pages 기본 도메인(`*.pages.dev`)이 Apple 심사에서 의심
**What goes wrong:** Apple reviewer가 privacy URL을 확인했을 때 `xyz-abc.pages.dev` 형태를 "임시 URL"로 보고 거부.
**Why it happens:** 일반적으로 도메인 없는 privacy URL은 일관성 우려가 있음. 단, pages.dev는 정식 hosting이므로 실제 거부 사례는 드물다.
**How to avoid:** **Project name을 `wecord-docs` 또는 `wecord`처럼 식별 가능한 이름으로** + pages.dev URL은 영구 고정됨을 확인. 가능하면 v1.1에서 custom domain 연결(CONTEXT deferred에 이미 명시).
**Warning signs:** App Review "Guideline 5.1.1 - Legal" 리젝트 사유 중 "Privacy URL not functional/specific enough".

### Pitfall 8: 프로덕션 Supabase 프로젝트의 OAuth redirect URI 누락
**What goes wrong:** 프로덕션 빌드에서 Google/Apple 로그인 시 redirect_uri_mismatch 에러.
**Why it happens:** Google Cloud Console과 Apple Developer Portal에 새 프로덕션 Supabase 프로젝트의 `https://<prod-ref>.supabase.co/auth/v1/callback` URL을 등록 안 함. Supabase Dashboard Auth provider 설정도 분리되어야 함.
**How to avoid:** 프로덕션 cutover runbook의 필수 스텝 (아래 참조).
**Warning signs:** 로그인 시도 시 OAuth provider가 error 페이지로 리다이렉트.

### Pitfall 9: EAS production 빌드 이후 Supabase anon key 노출
**What goes wrong:** EAS build 시 `EXPO_PUBLIC_SUPABASE_ANON_KEY`를 plain text로 설정 → 번들에 포함 → 공개됨.
**Why it happens:** anon key는 실제로 공개해도 되는 키(RLS로 보호)이나 **service role key는 절대 `EXPO_PUBLIC_`로 노출 금지**.
**How to avoid:** EAS env variables visibility: plain text (anon) vs secret (service role). Service role은 Edge Function secrets로만 설정 (`supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...`).
**Warning signs:** `supabase.auth.admin.*` API가 클라이언트에서 성공 (= 엄청난 보안 사고).

### Pitfall 10: DM "Notify Me" 중복 탭 시 에러 (이미 true인데 다시 update)
**What goes wrong:** 탭 할 때마다 `.update({ dm_launch_notify: true })` → 성공하지만 사용자에게 "이미 등록됨" 피드백 없음.
**Why it happens:** 로컬 상태와 DB 상태 sync 누락.
**How to avoid:** 쿼리 훅에서 `dm_launch_notify` 초기값 로드 → true이면 버튼 상태를 'Notified'로 표시 + 재탭 시 토스트 '이미 알림이 등록되어 있어요' (UI-SPEC에 카피 locked).
**Warning signs:** 버튼 상태가 영구적으로 'Notify Me'로 표시됨.

## Runtime State Inventory

이 Phase는 **migration + infra cutover를 포함**한 정식 migration phase. 아래 카테고리 전부 응답.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | (1) `profiles`에 `dm_launch_notify boolean default false` 컬럼 신규; (2) `avatars` Storage 버킷 신규 (없는 경우); (3) `delete_account(UUID)` plpgsql 함수 신규; (4) 모든 기존 DB row는 그대로 유지; (5) 기존 `post-media` 버킷은 건드리지 않음 | New migration files, bucket create if absent |
| Live service config | (1) 프로덕션 Supabase 프로젝트 신규 생성(D-33); (2) Google Cloud Console OAuth redirect URI에 프로덕션 supabase 콜백 추가; (3) Apple Developer Portal Sign in with Apple Service ID에 프로덕션 redirect 추가; (4) Supabase Auth dashboard의 OAuth provider 설정(Google/Apple) 새 프로젝트에 복제 | 수동 dashboard 작업(runbook 아래 참조) |
| OS-registered state | 없음 — iOS/Android는 EAS build 산출물로만 배포, Info.plist 변경사항은 app.json → plugin config로 반영 | ATT: `expo-tracking-transparency` plugin 추가 시 iOS Info.plist `NSUserTrackingUsageDescription`를 **의도적으로 비움** (D-36) |
| Secrets/env vars | EAS production profile에 `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY` 신규 값 등록; Supabase Edge Function secrets: `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `EXPO_ACCESS_TOKEN`, `GOOGLE_TRANSLATE_API_KEY` (Phase 4) 프로덕션 프로젝트에 다시 `supabase secrets set` | EAS + Supabase CLI secrets 작업 |
| Build artifacts / installed packages | (1) EAS production 빌드에서 app.json의 bundle id `com.wecord.app`가 그대로 사용됨; (2) `expo-tracking-transparency` 신규 설치 시 네이티브 모듈 포함되므로 **development client 재빌드 필요**; (3) react-native-webview 신규 설치도 native code 포함 — 마찬가지로 dev client 재빌드 | `eas build --profile development`을 Plan 07-01 초반에 실행해 새 네이티브 모듈 반영 |

**The canonical question:** 모든 코드 변경이 끝난 후에도 (a) 프로덕션 Supabase OAuth 등록, (b) EAS secrets, (c) Edge Function secrets, (d) Cloudflare Pages 배포, 이 4개의 외부 상태가 남는다. 각각 Plan 07-02의 별도 태스크로.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| npm/pnpm | All builds | ✓ (assumed) | — | — |
| Expo CLI | `npx expo install` | ✓ (assumed, project uses Expo) | 55 line | — |
| EAS CLI | production build | ✓ (project has eas.json) | >= 18 | — |
| Supabase CLI | migration push, functions deploy, secrets set | ✓ (assumed) | — | — |
| Cloudflare Wrangler | admin `/privacy` `/terms` 배포 | ✓ (`apps/admin/package.json` lists wrangler) | ^4.75.0 | — |
| Apple Developer account | App Store 제출 | ⚠ (prerequisite — confirm with user) | — | 없으면 iOS 제출 불가 |
| Google Play Console account | Play Store 제출 | ⚠ (prerequisite — confirm with user) | — | 없으면 Android 제출 불가 |
| Xcode + provisioning profile | EAS iOS build | ⚠ (EAS remote handles) | — | EAS Build가 remote macOS runner 사용 |
| 새 Supabase 프로덕션 프로젝트 | D-33 | ✗ (must be created as part of plan) | — | 없이는 프로덕션 빌드 불가 |

**Missing dependencies with no fallback:**
- 새 프로덕션 Supabase 프로젝트 (Plan 07-02 첫 태스크로 생성)
- Apple Developer / Play Console 계정 활성 상태 — 계획 이전에 확인 필요

**Missing dependencies with fallback:**
- 스크린샷 에셋 — D-34에 의해 명시적으로 계획 스코프 밖 (문서만)

## App Store Review Guideline 4.8 Checklist (Actionable)

[CITED: https://developer.apple.com/app-store/review/guidelines/#4.8 + https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple]

| # | Check | How to verify | Pass/Fail |
|---|-------|---------------|-----------|
| 1 | Apps에 Google OAuth가 있으므로 Apple Sign-In도 반드시 제공 | `(auth)/login.tsx`에서 두 버튼 모두 존재 확인 | (pre-req: 이미 완료, Phase 2) |
| 2 | Sign in with Apple 버튼이 동일한 prominence (크기·위치)로 노출 | iOS 시뮬레이터에서 login 스크린 스크린샷 + 픽셀 비교 | 수동 검수 |
| 3 | Sign in with Apple 버튼 스타일이 HIG 준수 (White-on-dark in dark bg) | 현재 다크 테마이므로 white 또는 white-outlined 스타일 | 수동 검수 |
| 4 | Hide My Email relay 지원 (사용자 이메일 숨김 시에도 앱 기능 동작) | sign-in 플로우에서 relay 이메일 허용 + profile 생성 성공 | 수동 테스트 1회 |
| 5 | 앱 내 계정 삭제 경로 존재 | More → 앱 정보 → 계정 삭제 → 3-step 플로우 (D-37) | 구현 완료 후 검수 |
| 6 | Privacy Policy URL이 App Store Connect 'App Privacy' 메타데이터에 기입됨 | App Store Connect → App Information → Privacy Policy URL | 프로덕션 배포 후 |
| 7 | App Store Connect 'Account Deletion' 필드에 인앱 경로 명시 | App Store Connect → App Information → Account Deletion → "In-app, More tab > 앱 정보 > 계정 삭제" | 제출 전 |
| 8 | Apple Sign-In 사용자가 앱 내에서 로그아웃 가능 | More → 로그아웃 (D-20) | 구현 완료 후 검수 |
| 9 | OAuth provider(Google, Apple) 모두 ToS/Privacy agreement 통과 | 기존 Phase 2 플로우 (AUTH-05) | pre-req 완료 |
| 10 | 사용자 이름/이메일 외 추가 데이터 수집 시 명시적 동의 | 현재 dateOfBirth 추가 수집 — 이미 동의 플로우에 포함 (AUTH-08) | 검수 |

**Actionable plan tasks:** 체크 #2, #3, #4, #6, #7 은 Plan 07-02의 별도 태스크로 생성 필요. 나머지는 다른 Plan의 출력물.

## Google Play 2024+ In-App Account Deletion Checklist

[CITED: https://support.google.com/googleplay/android-developer/answer/13327111]

| # | Check | How to verify | Action |
|---|-------|---------------|--------|
| 1 | 앱 내 계정 삭제 경로 존재하며 쉽게 접근 가능 | 3 tap 이내 도달 (Home → More → 앱 정보 → 계정 삭제) | 구현 |
| 2 | 계정 삭제 시 관련 데이터도 삭제됨 | `delete_account()` 함수로 cascade 삭제 | 구현 |
| 3 | 앱 외부(웹)에서도 계정 삭제 요청 가능한 URL 존재 | `apps/admin/app/(public)/account-delete-request/page.tsx` 또는 mailto: 링크 + 지원 URL | 신규 생성 필요 |
| 4 | Data Safety form에 계정 삭제 정책 답변 완료 | Play Console → App content → Data safety → "Can users request that their data be deleted?" → "Yes, users can request their data be deleted" + deletion URL | 제출 전 |
| 5 | Data Safety form에 수집 데이터 선언 | 이름, 이메일, 사진(아바타), 디바이스 ID(푸시 토큰) | 제출 전 |
| 6 | deletion URL이 공개 접근 가능 (인증 불필요) | `apps/admin/(public)/account-delete-request` 또는 `/privacy#deletion` 섹션 | 배포 후 curl 테스트 |

**Actionable plan tasks:** 체크 #3와 #4는 Plan 07-02의 태스크. 체크 #1, #2는 Plan 07-01의 태스크 (delete-user 구현).

## Production Supabase Cutover Runbook

[CITED: https://supabase.com/docs/guides/deployment/managing-environments + https://supabase.com/docs/reference/cli/supabase-secrets]

**단계별 순서 (반드시 이 순서)**:

```bash
# 1) 새 Supabase 프로젝트 생성 (Dashboard UI) → <prod-ref> 획득
#    Region: 사용자 지역(KR) 기준 ap-northeast-2 Seoul 권장

# 2) CLI로 link (로컬에서)
cd packages/supabase
supabase link --project-ref <prod-ref>

# 3) 전체 마이그레이션 push
supabase db push

# 4) Edge Functions 배포
supabase functions deploy highlight
supabase functions deploy home-feed
supabase functions deploy moderate
supabase functions deploy notify
supabase functions deploy translate
supabase functions deploy generate-nickname
supabase functions deploy delete-user   # Plan 07-02 신규

# 5) Function secrets 설정 (.env.prod 임시 파일 작성 후)
supabase secrets set --env-file ./.env.prod
#   OPENAI_API_KEY=...
#   GOOGLE_TRANSLATE_API_KEY=...
#   EXPO_ACCESS_TOKEN=...
#   SERVICE_ROLE_KEY는 기본 제공 (secrets set 불필요)

# 6) Storage buckets 생성 (migration이 `post-media`, `avatars`를 처리하므로 자동)
#    확인: supabase storage buckets list

# 7) Supabase Dashboard → Auth → Providers
#    Google: Client ID / Secret 입력
#    Apple: Client ID / Team ID / Key ID / Private Key 입력

# 8) Google Cloud Console → Credentials → Authorized redirect URIs에 추가
#    https://<prod-ref>.supabase.co/auth/v1/callback

# 9) Apple Developer Portal → Identifiers → Service ID (Sign in with Apple) → Return URLs에 추가
#    https://<prod-ref>.supabase.co/auth/v1/callback

# 10) pg_cron 잡 확인 (auto-provisioned via migration)
#     supabase db remote list cron.job

# 11) EAS env variables 생성
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value https://<prod-ref>.supabase.co --visibility plain
eas env:create --environment production --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <anon-key> --visibility plain

# 12) EAS production build
eas build --platform all --profile production

# 13) TestFlight internal testing → 실기기 검증
#     - 로그인 Google/Apple
#     - 프로필 편집
#     - 커뮤니티 생성(admin) + 가입 + 포스트 작성
#     - Push 알림 수신 (Phase 4 잔여 검증)
#     - 계정 삭제 → 재가입

# 14) App Store Connect 메타데이터 + 스크린샷 업로드
# 15) Google Play Console 메타데이터 + Data safety form + 스크린샷 업로드
```

**환경 변수 매트릭스:**

| Name | Visibility | Dev | Prod | Location |
|------|-----------|-----|------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | plain | <dev-ref>.supabase.co | <prod-ref>.supabase.co | EAS env |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | plain | dev-anon | prod-anon | EAS env |
| `SUPABASE_SERVICE_ROLE_KEY` | — | — | — | Auto in Edge Functions (never in mobile) |
| `OPENAI_API_KEY` | secret | dev-key | prod-key | Supabase Function secrets |
| `GOOGLE_TRANSLATE_API_KEY` | secret | dev-key | prod-key | Supabase Function secrets |
| `EXPO_ACCESS_TOKEN` | secret | dev-token | prod-token | Supabase Function secrets |

## App Store Connect Metadata Checklist

[CITED: https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/ + https://developer.apple.com/app-store/review/guidelines/]

### App Information
- [ ] App name (≤30 chars): **Wecord**
- [ ] Subtitle (≤30 chars): [마케팅 문구 — 담당자 제공]
- [ ] Primary category: **Social Networking**
- [ ] Secondary category: **Entertainment**
- [ ] Content rights: (third-party content 포함 여부) — Yes (user posts)
- [ ] Age rating: **17+** (담당자 설문 완료 필요, D-30)
- [ ] Privacy Policy URL: `https://<cf-pages>.pages.dev/privacy`
- [ ] Support URL: `mailto:support@wecord.app` 또는 admin `/support` (MVP: mailto)
- [ ] Marketing URL: optional
- [ ] EULA: Apple 표준 EULA 사용 또는 자체 Terms URL

### Version Info
- [ ] Version number: `1.0.0`
- [ ] Copyright: `© 2026 Wecord`
- [ ] App Review contact: 이름/전화/이메일/비밀번호 (테스트 계정)
- [ ] Demo account: (Google/Apple login 특성상 demo 계정 준비 필요 — Apple OAuth는 reviewer가 쓸 수 있도록 실제 계정 권장)

### Metadata (per localization — KO, EN 권장)
- [ ] Promotional text (≤170 chars)
- [ ] Description (≤4000 chars)
- [ ] Keywords (≤100 chars, comma-separated)
- [ ] Support URL
- [ ] What's New (≤4000 chars) — 초기 배포 시 "Initial release"

### Screenshots (per localization)
- [ ] iPhone 6.9-inch (1290 x 2796 px): 최소 1장, 최대 10장 — **primary 요구사항**
- [ ] iPhone 6.5-inch (1242 x 2688): 2025년 primary에서 optional로 변경
- [ ] iPad 13-inch (2064 x 2752): 담당자 app 지원 범위 결정 — `supportsTablet: true`이므로 필수
- [ ] Preview videos (optional)

### App Privacy
- [ ] Data Types Collected: Name, Email, Photos/Videos (avatar/posts), User Content (posts/comments), Device ID (push token), Usage Data
- [ ] Data linked to user: Yes (posts, comments, profile)
- [ ] Data NOT used for tracking: **All** (D-36 — ATT "No")

### Pricing & Availability
- [ ] Price: Free
- [ ] Availability: Worldwide (or limit to KR/EN regions)

## Google Play Console Metadata Checklist

[CITED: https://support.google.com/googleplay/android-developer/answer/13327111]

### Store listing
- [ ] App name (≤50 chars)
- [ ] Short description (≤80 chars)
- [ ] Full description (≤4000 chars)
- [ ] App icon (512x512 PNG)
- [ ] Feature graphic (1024x500 PNG/JPG)
- [ ] Phone screenshots: 1080x1920 or higher, 2~8 images
- [ ] Tablet screenshots: optional unless targeting tablets

### Content rating
- [ ] IARC questionnaire → 17+ equivalent

### Target audience
- [ ] Ages 18+ 선택 (17+ content)
- [ ] Ads: No ads declaration

### Data safety
- [ ] Data types collected (same as Apple)
- [ ] Account deletion: "Yes, users can request their data be deleted"
- [ ] Deletion URL: `https://<cf-pages>.pages.dev/account-delete-request` 또는 `/privacy#deletion`
- [ ] Data encryption in transit: Yes (HTTPS)
- [ ] Secure data storage: Yes (Supabase)

### App access
- [ ] Login credentials or instructions for reviewer

## Per-Decision Technical Notes

| Dec | Note |
|-----|------|
| D-01 | `(tabs)/_layout.tsx`에 Tabs.Screen 순서가 곧 디스플레이 순서. 기존 index, community 뒤에 shop, dm, more 추가. notifications는 그대로 href:null 유지 |
| D-02 | 변경 없음 — Phase 4 highlight 탭 구조 유지 |
| D-03 | 변경 없음 — Phase 5 Home 헤더 벨 유지 |
| D-04 | `notifications.tsx`가 이미 `(tabs)` 디렉토리에 존재, 그대로 유지 |
| D-05 | ProfileCard 컴포넌트에서 `useAuth()` 훅으로 profile 구독 — 반응형 (글로벌 언어 변경 즉시 반영) |
| D-06, D-07 | JoinedCommunityRow는 `communityMembers` 테이블 쿼리 + `communities` 조인. 기존 RLS `community_members_select`가 본인 row만 반환 |
| D-08, D-09 | 단일 Settings 화면 — 섹션 그룹핑 UI만 다름, 라우팅은 단일 |
| D-10 | dirty state는 useState snapshot 비교(react-hook-form 미도입, onboarding도 useState 기반이므로 일관성 유지) |
| D-11 | `@expo/react-native-action-sheet` 설치 + `_layout.tsx`에서 `<ActionSheetProvider>` wrap |
| D-12 | `useUploadAvatar` 훅 신규 — Phase 3 `compressAndUploadImage` 패턴 재사용. 단 버킷은 `avatars` |
| D-13 | zod 등 validator 없음 (기존 스타일) — `trim().length` 체크로 충분 |
| D-14 | bio 150자 제한은 TextInput `maxLength={150}`으로 강제 |
| D-15 | LanguagePicker 컴포넌트로 추출, onboarding/settings 두 모드 분기 |
| D-16 | 즉시 커밋 — onChange → i18n.changeLanguage + profile update + query invalidate(`['profile']`) |
| D-17 | Notifications.getPermissionsAsync 호출, OFF→ON 시 requestPermissions, deny 시 `Linking.openSettings()` |
| D-18 | 'Community 선택 리스트' 화면 하나 신설 → 선택 시 기존 `(community)/[id]/notification-preferences` 재사용 |
| D-19 | MVP 스코프 확정 — 카테고리 스위치 UI 없음 |
| D-20 | `Alert.alert('로그아웃하시겠어요?', '', [{text:'취소', style:'cancel'}, {text:'로그아웃', style:'destructive', onPress: confirm}])` 패턴 |
| D-21 | 로그아웃 흐름: `signOut()` → `queryClient.clear()` 또는 타겟 invalidate → `router.replace('/(auth)/login')` |
| D-22 | `react-native-webview` 설치, Shop 전용 컴포넌트로 wrap |
| D-23 | 헤더는 커스텀 `ShopHeader` — canGoBack state로 뒤로가기 버튼 disabled/enabled 제어 |
| D-24 | WebView props에 cookies/credentials 전달 안 함, sharedCookiesEnabled=false |
| D-25 | onError + onHttpError(>= 500) → `setError(true)` → Fallback 렌더 |
| D-26 | hostname 체크로 x-square.kr이 아니면 `WebBrowser.openBrowserAsync` 후 return false (pattern 2) |
| D-27 | `(tabs)/dm.tsx` 전체 화면 중앙 정렬 |
| D-28 | 컬럼: `ALTER TABLE profiles ADD COLUMN dm_launch_notify boolean NOT NULL DEFAULT false;` — 기존 RLS `profiles_update_own`이 self-update 허용 |
| D-29 | Phase 7에서는 컬럼 + UI만. fan-out은 v1.1 |
| D-30 | 앱 코드 변경 없음, 메타데이터 설정만 |
| D-31 | `apps/admin/app/(public)/layout.tsx`가 인증 체크 없음, `(dashboard)` layout과 분리. Cloudflare Pages 기본 도메인 `wecord-docs.pages.dev` (Project name 제안) |
| D-32 | 위 Apple Guideline 4.8 checklist로 태스크화 |
| D-33 | 위 Production Supabase Cutover Runbook 참조 |
| D-34 | 위 App Store Connect + Play Console metadata 체크리스트 문서화. 스크린샷 촬영은 별도 디자인 작업 |
| D-35 | `assets/icon.png`, `splash-icon.png`, `android-icon-foreground.png` 이미 존재. 1024x1024 마스크 테스트 1회 + 그라데이션/라운딩 검토 |
| D-36 | `app.json` plugins에 `expo-tracking-transparency` 추가, 단 `userTrackingPermission`을 설정하지 않거나 빈 문자열 — 가장 안전한 방법은 **설치하지 않는 것**. 기본 설치 유지시 Info.plist에 key 자동 주입 여부 체크 필요 ⚠ |
| D-37 | 위 Pattern 3 delete-user Edge Function + 3-screen UI 참조 |

**D-36 주의 사항 (ambiguity):** `expo-tracking-transparency` plugin 추가 자체가 Info.plist에 `NSUserTrackingUsageDescription`을 주입하는지 확인되지 않음. 현재 공식 문서는 "이 key가 없으면 앱 reject"라고만 명시. Apple은 **추적 안 할 경우 key가 없어도 OK** (App Store 자동 "Not tracking" 인식). 따라서 가장 안전: **이 패키지를 설치하지 않고 app.json도 건드리지 않는다**. CONTEXT D-36가 "설치하여 사용 없음"이라 되어 있는데, 이는 컴플라이언스 선언과 실제 코드 간에 혼동 가능. **Plan 단계에서 재확인 필요** — 설치하지 않는 것이 더 안전할 수 있다. 이를 Open Question으로 남긴다.

## Code Examples

### Example 1: Joined Communities Hook

```ts
// apps/mobile/hooks/community/useMyCommunities.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

interface JoinedCommunity {
  communityId: string;
  communityName: string;
  communitySlug: string;
  coverImageUrl: string | null;
  myCommunityNickname: string;
  joinedAt: string;
}

export function useMyCommunities() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ['myCommunities', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_members')
        .select('community_nickname, joined_at, communities!inner(id, name, slug, cover_image_url)')
        .eq('user_id', userId!)
        .order('joined_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        communityId: row.communities.id,
        communityName: row.communities.name,
        communitySlug: row.communities.slug,
        coverImageUrl: row.communities.cover_image_url,
        myCommunityNickname: row.community_nickname,
        joinedAt: row.joined_at,
      })) as JoinedCommunity[];
    },
  });
}
```

### Example 2: DM Notify Me Mutation

```ts
// apps/mobile/hooks/dm/useDmLaunchNotify.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';

export function useDmLaunchNotify() {
  const userId = useAuthStore((s) => s.user?.id);
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('unauthenticated');
      const { error } = await supabase
        .from('profiles')
        .update({ dm_launch_notify: true })
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      if (profile) setProfile({ ...profile, /* add dm_launch_notify to Profile type */ });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
  });
}
```

### Example 3: /privacy admin route with ?lang switching

```tsx
// apps/admin/app/(public)/layout.tsx
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="max-w-3xl mx-auto p-6 bg-background text-foreground min-h-screen">{children}</div>;
}

// apps/admin/app/(public)/privacy/page.tsx
import { PRIVACY_KO, PRIVACY_EN } from '@/lib/legal-content';
import Link from 'next/link';

export default function PrivacyPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang } = await searchParams;
  const isEn = lang === 'en';
  const body = isEn ? PRIVACY_EN : PRIVACY_KO;
  return (
    <article>
      <nav className="flex justify-end gap-2 text-sm">
        <Link href="?lang=ko" className={!isEn ? 'font-bold' : ''}>KO</Link>
        <Link href="?lang=en" className={isEn ? 'font-bold' : ''}>EN</Link>
      </nav>
      <h1 className="text-2xl font-semibold mt-4">{isEn ? 'Privacy Policy' : '개인정보처리방침'}</h1>
      <p className="text-sm text-muted-foreground">
        {isEn ? 'Last updated: ' : '최종 개정일: '}2026-04-22
      </p>
      <div className="prose prose-invert mt-6" dangerouslySetInnerHTML={{ __html: body }} />
    </article>
  );
}
```

(`dangerouslySetInnerHTML`은 신뢰되는 정적 콘텐츠이므로 안전. MDX 도입은 v1.1.)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| iPhone 6.5" + 5.5" screenshots as primary | iPhone 6.9" (iPhone 16 Pro Max) primary | 2024-09 Apple update | MVP 제출 시 6.9" 기준 10장 작성 권장 |
| ATT prompt required for all apps | ATT only for apps that actually track | 2024+ (Apple guideline clarification) | D-36 (설치 + "No" 선언) 가능 |
| Google Play 계정 삭제 옵션 | 2023-12-07부터 앱 내 + 웹 둘 다 필수 | 2024-05-31 extension deadline | D-37 + Plan 07-02 task |
| Next.js middleware.ts | Next.js 16에서 proxy.ts로 이름 변경 | Next.js 16 | admin은 현재 middleware 없음, 영향 없음 |
| `sign in with Apple` obligatory | Guideline 4.8 broadened — 3 조건 충족 OAuth면 OK | 2024-01 | 현재 Apple Sign-In 포함이므로 safe |

**Deprecated/outdated:**
- iPhone 5.5" screenshots: 2025+ optional
- iPad 12.9" as primary: 2025+ 13" primary

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `reports` 테이블에 `reporter_id` 컬럼 존재 (Phase 6 산출물) | Pattern 3 delete_account SQL | 컬럼명 다르면 함수 실패 — Plan 단계에서 `packages/db/src/schema/report.ts` 확인 필요 |
| A2 | `likes.user_id` 필드 존재 | Pattern 3 delete_account SQL | 마찬가지 확인 필요 |
| A3 | Cloudflare Pages `*.pages.dev` 도메인이 Apple 심사에서 통과 | Pitfall 7 | 만약 거부되면 custom 도메인 긴급 구매 필요 (1~2일 delay) |
| A4 | Expo SDK 55의 번들된 react-native-webview 권장 버전이 13.16.0 | Standard Stack | 1 마이너 버전 이슈 시 `npx expo install`로 자동 교정됨 |
| A5 | `expo-tracking-transparency` plugin 설치가 Info.plist `NSUserTrackingUsageDescription` 주입 여부 | D-36 note | Plan 단계에서 실험으로 확인 (app.json plugins에 추가 후 `npx expo prebuild --platform ios`로 Info.plist 생성해보기) |
| A6 | `community_follows` 테이블이 `follower_cm_id`/`following_cm_id` 컬럼 사용 (community_members.id 참조) | Pattern 3 delete_account SQL | Phase 5 스키마에서 확인 — 초기 schema의 FK로 명시됨 [VERIFIED] |
| A7 | `notification_preferences` 테이블에 `user_id` 컬럼이 있고 RLS가 service_role DELETE 허용 | Pattern 3 | service_role은 RLS bypass [VERIFIED via Supabase docs] |
| A8 | Apple Sign-In 버튼이 현재 `(auth)/login.tsx`에 존재 | Apple Guideline checklist | Phase 2 `02-01-PLAN.md`에 명시 — verified |

## Open Questions

1. **`expo-tracking-transparency` 플러그인의 Info.plist 주입 동작** (A5)
   - What we know: 공식 문서는 plugin이 key를 자동 주입한다고 명시. CONTEXT D-36은 "설치하나 사용 없음 선언"을 요구.
   - What's unclear: plugin을 설치하고 `userTrackingPermission`을 설정하지 않으면 Info.plist에 key가 들어가는지, 빈 문자열이 들어가는지, 아예 key가 없는지.
   - Recommendation: **Plan 07-02 초반에 실험 task 추가** — `npx expo prebuild --platform ios --no-install`로 Info.plist 생성 후 key 존재 여부 확인. 만약 빈 문자열이 들어간다면 Apple이 ATT 사용 선언으로 오인할 가능성 있어 **plugin 자체를 설치하지 않는** 것이 더 안전.

2. **Apple 심사용 demo 계정 전략**
   - What we know: Apple reviewer가 Google/Apple OAuth를 직접 쓰기 곤란. 통상 이메일/패스워드 로그인이 있거나 "bypass code" 제공.
   - What's unclear: Wecord는 OAuth only. Reviewer는 실제 Apple ID로 Sign-In해야 함.
   - Recommendation: App Store Connect "App Review Information" 필드에 "This app uses Google/Apple OAuth only. Please sign in with your own Apple ID or use the pre-provisioned test account at apple-reviewer@wecord.app / [pw]. Hide My Email is fully supported." 메모 필수. Plan 07-02 submission task에 명시.

3. **프로덕션 Supabase OAuth client secret 회전**
   - What we know: 현재 dev 프로젝트의 Google/Apple OAuth client ID는 아마 localhost + dev supabase URL로 등록.
   - What's unclear: 프로덕션용 OAuth client를 새로 발급할지, 기존 client에 URI만 추가할지.
   - Recommendation: **별도 OAuth client 발급** — 키 compromise 리스크 격리. Plan 07-02 Google Cloud Console / Apple Developer Portal task에 명시.

4. **Custom domain 타이밍**
   - What we know: D-31은 `*.pages.dev` 기본 도메인 사용. 커스텀 도메인은 CONTEXT deferred.
   - What's unclear: 만약 Apple이 pages.dev URL로 reject하면 v1.0 출시 delay. 미리 wecord.app 같은 도메인을 구매해 두는 것이 안전할지.
   - Recommendation: **Plan 07-02에 optional task로 "커스텀 도메인 대비 확보"** — 도메인 구매만 선행, Cloudflare 연결은 거부 시 실행. 8,000원 정도 비용 대비 리스크가 큼.

## Validation Architecture

> Nyquist Dimension 8 — for every major piece of work, automated test(s) prove it works.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest ^3.1.0 (mobile) — already established |
| Config file | `apps/mobile/vitest.config.ts` (or inherited) — Phase 4에서 사용 |
| Quick run command | `cd apps/mobile && pnpm test` |
| Full suite command | `cd apps/mobile && pnpm test:ci` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MORE-01 | `useUpdateProfile` mutation calls supabase with correct fields | unit | `pnpm test tests/profile/useUpdateProfile.test.ts` | ❌ Wave 0 |
| MORE-01 | `uploadAvatar` hook resizes, uploads to `avatars` bucket with correct path | unit | `pnpm test tests/profile/useUploadAvatar.test.ts` | ❌ Wave 0 |
| MORE-01 | dirty state detection returns false when fields unchanged | unit | `pnpm test tests/profile/dirty-state.test.ts` | ❌ Wave 0 |
| MORE-02 | `i18n.changeLanguage` fires + supabase update + query invalidate | unit | `pnpm test tests/settings/language-change.test.ts` | ❌ Wave 0 |
| MORE-03 | `useMyCommunities` queries community_members with correct joins | unit | `pnpm test tests/community/useMyCommunities.test.ts` | ❌ Wave 0 |
| MORE-04 | Push switch ON when permission denied → `Linking.openSettings` call | unit | `pnpm test tests/settings/push-switch.test.ts` | ❌ Wave 0 |
| MORE-05 | `signOut` → queryClient.clear + router.replace('/(auth)/login') | unit | `pnpm test tests/auth/signOut.test.ts` | ❌ Wave 0 |
| SHOP-01 | ShopWebView renders with source `https://x-square.kr` | unit (render) | `pnpm test tests/shop/ShopWebView.test.tsx` | ❌ Wave 0 |
| SHOP-02 | `onShouldStartLoadWithRequest` blocks non-x-square hostname | unit | `pnpm test tests/shop/external-link-block.test.ts` | ❌ Wave 0 |
| SHOP-02 | `canGoBack` state updates from `onNavigationStateChange` | unit | `pnpm test tests/shop/navigation-state.test.ts` | ❌ Wave 0 |
| DMPL-01 | DM tab renders placeholder elements (heading/body/CTA) | unit (render) | `pnpm test tests/dm/DmTab.test.tsx` | ❌ Wave 0 |
| DMPL-02 | `useDmLaunchNotify` updates `profiles.dm_launch_notify=true` | unit | `pnpm test tests/dm/useDmLaunchNotify.test.ts` | ❌ Wave 0 |
| D-37 | `useDeleteAccount` calls Edge Function, clears auth on 200 | unit | `pnpm test tests/account/useDeleteAccount.test.ts` | ❌ Wave 0 |
| D-37 | delete-user Edge Function returns 401 for missing JWT | integration (deno test) | `cd packages/supabase && deno test functions/delete-user/index.test.ts` | ❌ Wave 0 |
| D-37 | `delete_account(UUID)` RPC deletes rows in correct order (integration) | SQL integration | `psql -c "SELECT test_delete_account();"` | ❌ Wave 0 |
| D-31 | `/privacy` page returns 200 without auth | integration (curl) | `curl -sf https://<pages-dev>.pages.dev/privacy` | Manual — post-deploy |
| D-33 | Production EAS build completes with correct `EXPO_PUBLIC_SUPABASE_URL` | manual (EAS logs) | Check EAS build artifact env | Manual |
| D-32 | Apple Sign-In visible in login.tsx renders (equivalent prominence) | unit (render snapshot) | `pnpm test tests/auth/login-snapshot.test.tsx` | ❌ Wave 0 (update existing) |

### Sampling Rate
- **Per task commit:** `pnpm test <targeted>` — 변경된 파일 related tests
- **Per wave merge:** `cd apps/mobile && pnpm test:ci` 전체 통과
- **Phase gate:** 풀 스위트 + manual E2E (실기기): TestFlight 설치 → 로그인 → 5탭 전환 → 프로필 편집 → 계정 삭제 → 재가입

### Wave 0 Gaps

- [ ] `apps/mobile/tests/profile/useUpdateProfile.test.ts`
- [ ] `apps/mobile/tests/profile/useUploadAvatar.test.ts`
- [ ] `apps/mobile/tests/profile/dirty-state.test.ts`
- [ ] `apps/mobile/tests/settings/language-change.test.ts`
- [ ] `apps/mobile/tests/settings/push-switch.test.ts`
- [ ] `apps/mobile/tests/community/useMyCommunities.test.ts`
- [ ] `apps/mobile/tests/auth/signOut.test.ts`
- [ ] `apps/mobile/tests/auth/login-snapshot.test.tsx` (update)
- [ ] `apps/mobile/tests/shop/ShopWebView.test.tsx`
- [ ] `apps/mobile/tests/shop/external-link-block.test.ts`
- [ ] `apps/mobile/tests/shop/navigation-state.test.ts`
- [ ] `apps/mobile/tests/dm/DmTab.test.tsx`
- [ ] `apps/mobile/tests/dm/useDmLaunchNotify.test.ts`
- [ ] `apps/mobile/tests/account/useDeleteAccount.test.ts`
- [ ] `packages/supabase/functions/delete-user/index.test.ts` (Deno test)
- [ ] Shared vitest config update: ensure `@expo/react-native-action-sheet` mock, `react-native-webview` mock

**Manual verification tasks (Phase gate):**
- Real device push notification delivery (Phase 4 잔여)
- Apple Sign-In with Hide My Email relay → 성공 가입
- iOS TestFlight install → 5탭 navigation smoke
- Delete account end-to-end on real device
- `curl -sf https://<pages>.pages.dev/privacy` and `/terms` 200 OK

## Security Domain

(security_enforcement: 명시적으로 false 설정 없음 → enabled)

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase OAuth (Google, Apple) — already implemented. No new auth surface |
| V3 Session Management | yes | SecureStore tokens — already implemented. Logout clears tokens (D-20) |
| V4 Access Control | yes | RLS policies — `profiles`, `community_members`, etc. Service role only in Edge Functions |
| V5 Input Validation | yes | Profile edit: nickname 2~20, bio ≤150 chars, avatar MIME allowlist. WebView URL validation. |
| V6 Cryptography | yes | No new crypto surface. Supabase handles JWT + TLS |
| V7 Error Handling | yes | Edge Function returns generic error messages. No stack trace leakage |
| V8 Data Protection | yes | Delete account permanently removes PII (D-37). Privacy policy documents retention |
| V13 API Security | yes | Edge Functions validate JWT + service role separation |

### Known Threat Patterns for Expo/Supabase/WebView stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SSRF via WebView to internal URLs | Spoofing/Tampering | hostname allowlist (Pattern 2) — only x-square.kr |
| Stored XSS via bio / nickname | Tampering | React Native의 `<Text>`는 자동 이스케이프 — 안전 |
| Avatar upload with malicious content | Tampering | MIME type allowlist (`image/*` only), size limit 2MB, `upsert:true` only to own folder RLS |
| Service role key exposure in mobile bundle | Information Disclosure | service role은 절대 `EXPO_PUBLIC_` prefix로 미사용. Edge Functions에만 존재 |
| Account deletion abuse (mass deletion) | Repudiation/DoS | delete-user Edge Function에 rate limit 1/day per user 추가 고려 (optional). JWT 검증으로 self-delete만 가능 |
| Privacy policy bypass via dashboard route | Information Disclosure | admin `/(public)/*`는 auth 없음 (의도적), `/(dashboard)/*`는 auth 있음 (기존). 격리 확인 필수 |
| Stale session after delete (infinite loop) | DoS | client 측 signOut을 서버 delete 성공 직후에 강제 (Pitfall 5) |

## Sources

### Primary (HIGH confidence)
- [Expo SDK 55 Changelog](https://expo.dev/changelog/sdk-55) — React Native 0.83, New Architecture only
- [react-native-webview Reference](https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md) — API details
- [Supabase Cascade Deletes](https://supabase.com/docs/guides/database/postgres/cascade-deletes) — FK cascade patterns
- [Supabase auth.admin.deleteUser (JS)](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser) — method signature
- [Supabase CLI db push](https://supabase.com/docs/reference/cli/supabase-db-push) — migration deployment
- [Supabase CLI secrets](https://supabase.com/docs/reference/cli/supabase-secrets) — Edge Function secrets
- [Expo Environment Variables](https://docs.expo.dev/eas/environment-variables/) — EAS env management
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) — 4.8 login services
- [Apple Sign in with Apple HIG](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple) — button rules
- [Apple Screenshot Specifications](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications/) — 6.9" primary
- [Google Play Account Deletion](https://support.google.com/googleplay/android-developer/answer/13327111) — 2023 requirement
- [Expo Router Tabs](https://docs.expo.dev/router/advanced/tabs/) — `href:null` pattern
- [expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/) — permission API
- Project files (VERIFIED): `apps/mobile/package.json`, `apps/mobile/app.json`, `apps/mobile/eas.json`, `apps/mobile/app/(tabs)/_layout.tsx`, `apps/mobile/app/(onboarding)/language.tsx`, `apps/mobile/stores/authStore.ts`, `packages/db/src/schema/*.ts`, `packages/supabase/migrations/20260318141420_initial_schema.sql`, `packages/supabase/migrations/20260320000001_phase3_triggers_storage.sql`, `apps/admin/app/(dashboard)/layout.tsx`

### Secondary (MEDIUM confidence)
- [SplitMetrics 2025 Screenshot Guide](https://splitmetrics.com/blog/app-store-screenshots-aso-guide/) — 6.9" primary confirmation
- [NextNative App Store Review 2025](https://nextnative.dev/blog/app-store-review-guidelines) — common rejection reasons
- [Mansueli's Supabase Self-Deletion](https://blog.mansueli.com/supabase-user-self-deletion-empower-users-with-edge-functions) — Edge Function pattern
- [TermsFeed Google Data Safety](https://www.termsfeed.com/blog/google-data-safety-form-delete-account-url/) — deletion URL format

### Tertiary (LOW confidence)
- Flag: "pages.dev domain Apple acceptance" — 명확한 reject 사례 찾지 못함. Pitfall 7 + Open Question #4로 관리.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified via `npm view` or Expo docs
- Architecture: HIGH — follows existing Phase 2/3/4 patterns verbatim
- Pitfalls: HIGH — each pitfall traced to either codebase inspection or documented issue
- Compliance (Apple/Google checklists): MEDIUM — guidelines change, 재확인 시점: 제출 직전
- Supabase cutover runbook: HIGH — standard CLI commands
- ATT / D-36 interpretation: MEDIUM — Open Question #1로 마킹

**Research date:** 2026-04-22
**Valid until:** 2026-05-22 (30 days for stable areas; Apple/Google guidelines와 Expo SDK 55 패치 업데이트 모니터 필요)

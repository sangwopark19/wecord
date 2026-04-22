---
quick_id: 260422-nir
slug: logout
description: "Expo 모바일 앱을 'expo --web'으로 켰을 때 logout 버튼이 안 먹는 문제 (+ admin 웹 logout 버튼 부재 incidental fix)"
date: 2026-04-22
mode: quick
status: complete
---

# Quick Task 260422-nir: Logout 버튼 안 먹는 문제

## 문제 보고

> "logout 버튼이 웹에서 작동하지않음, 앱은 모르겠음 앱도 확인"

원래 의도: **"웹"** = `expo … --web`(또는 dev server에서 `w` 키)으로 켠 React Native Web 빌드. Next.js admin이 아님.

## Root Cause (Phase 1 — systematic-debugging)

### Primary (사용자 요청)

`apps/mobile/app/(tabs)/more.tsx:45-64` `handleLogoutPress`:

```ts
Alert.alert(
  t('logout.dialogTitle'),
  undefined,
  [
    { text: t('logout.dialogCancel'), style: 'cancel' },
    { text: t('logout.dialogConfirm'), style: 'destructive',
      onPress: async () => { await signOut(); router.replace('/(auth)/login'); } },
  ],
  { cancelable: true }
);
```

- **React Native Web의 `Alert.alert` 폴리필은 멀티버튼/콜백을 지원하지 않음** — 보통 `window.alert(title)`로 메시지만 표시하고 buttons[].onPress는 절대 호출되지 않음.
- 결과: 웹에서 Sign out 행을 눌러도 destructive Confirm 콜백이 fire되지 않아 `signOut()` 자체가 트리거되지 않음.
- iOS/Android 네이티브에서는 진짜 네이티브 다이얼로그라 정상 동작.

### Incidental (조사 중 발견된 별개 누락)

`apps/admin` Sidebar에 logout 버튼이 코드 어디에도 없었음. 사용자 요청과 무관한 별도 누락이었지만 이미 fix를 적용함 (commit `b0c6424`, 유지).

## Fix Scope

**파일 (2개, 별개 commit):**
- `apps/mobile/app/(tabs)/more.tsx` — primary fix
- `apps/admin/components/Sidebar.tsx` — incidental fix (이미 적용됨)

## Tasks

### Task 1 (primary): Mobile logout에 web 분기 추가

**File:** `apps/mobile/app/(tabs)/more.tsx`

**Action:**
1. `react-native` import에 `Platform` 추가
2. `handleLogoutPress` 본문에서 confirm + signOut을 `performLogout` 클로저로 추출 (web/native 두 분기가 공유)
3. `Platform.OS === 'web'` 분기에서 `window.confirm(t('logout.dialogTitle'))`로 우회. SSR 안전을 위해 `typeof window !== 'undefined'` 가드
4. 네이티브 분기는 기존 `Alert.alert` 흐름과 i18n 문구 그대로 유지

**Verify:**
- `pnpm --filter mobile typecheck` 통과
- `pnpm --filter mobile lint` 통과
- `pnpm vitest run tests/auth/signOut.test.ts tests/auth/signOut-queryclient-integration.test.ts` 통과

**Done:**
- `expo … --web`에서 More → Sign out 누르면 브라우저 confirm 뜨고 OK 시 `signOut()` + `/(auth)/login` redirect
- 네이티브 동작 변화 없음
- T-7-05의 onSignOut 콜백(queryClient.clear) 체인 보존

### Task 2 (incidental): Admin Sidebar에 Sign out 버튼 추가

**File:** `apps/admin/components/Sidebar.tsx`

**Action:**
- `<aside>`를 flex column으로 전환, `<nav>`에 `flex-1` 추가
- nav 하단에 `LogOut` 아이콘 + "Sign out" 라벨 button 추가
- `supabaseBrowser.auth.signOut()` → `router.replace('/login')`, `isSigningOut` 가드, `finally`에서 redirect 보장

**Verify:**
- `pnpm --filter admin typecheck` ✓ / `pnpm --filter admin lint` ✓

**Done:**
- admin 웹에서 logout이 클릭 가능

## must_haves

**Truths:**
- `expo --web`에서 More → Sign out → 실제 로그아웃 + 로그인 화면 이동
- 네이티브 iOS/Android 동작은 변경 없음
- T-7-05 contract (onSignOut 콜백 → queryClient.clear) 그대로 동작
- Admin 웹에서도 logout 가능

**Artifacts:**
- `apps/mobile/app/(tabs)/more.tsx` — primary fix
- `apps/admin/components/Sidebar.tsx` — incidental

**Key links:**
- `apps/mobile/stores/authStore.ts:184-204` (signOut 구현 — 변경 없음)
- `apps/mobile/app/_layout.tsx:30-35` (registerOnSignOut → queryClient.clear)
- `apps/mobile/tests/auth/signOut.test.ts` + `signOut-queryclient-integration.test.ts`
- `apps/admin/lib/supabase-browser.ts`

## Out of scope

같은 RN Web Alert.alert 멀티버튼 한계의 영향을 받을 수 있는 다른 위치들 (수정 안 함):

- `apps/mobile/components/post/DeleteConfirmDialog.tsx`
- `apps/mobile/components/community/LeaveConfirmDialog.tsx`
- `apps/mobile/components/community/FollowButton.tsx`
- `apps/mobile/hooks/account/useDeleteAccount.ts`(호출 경로 확인 필요)

웹 타깃 정식 지원 시 동일 패턴(`Platform.OS==='web'` + `window.confirm`)으로 일괄 정리하거나 공용 `confirmDialog` 헬퍼 추출 권장.

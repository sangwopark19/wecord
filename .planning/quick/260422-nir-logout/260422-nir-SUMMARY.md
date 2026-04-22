---
quick_id: 260422-nir
slug: logout
description: "Expo 모바일 앱을 'expo --web'으로 켰을 때 logout 버튼이 안 먹는 문제"
date: 2026-04-22
mode: quick
status: complete
commits:
  - c1828d6  # fix(mobile): make logout work in expo --web — primary fix
  - b0c6424  # feat(admin): add sign-out button to sidebar — separate, incidental gap
---

# Quick Task 260422-nir — Summary (corrected)

## What changed

### Primary fix (사용자 요청)

| File | Change |
|------|--------|
| `apps/mobile/app/(tabs)/more.tsx` | `handleLogoutPress`에 `Platform.OS === 'web'` 분기 추가. 웹에서는 `window.confirm(t('logout.dialogTitle'))` 후 즉시 `performLogout()`. 네이티브 분기는 기존 `Alert.alert` 멀티버튼 흐름 유지. `performLogout`은 둘 다 공유 (`signOut()` → `router.replace('/(auth)/login')`) |

### Incidental fix (별개로 발견된 누락 — 보존)

| File | Change |
|------|--------|
| `apps/admin/components/Sidebar.tsx` | flex column 구조로 전환 후 nav 하단에 Sign-out 버튼 추가. 웹 admin에는 logout UI가 아예 존재하지 않았던 별개 누락 (사용자 요청과 무관하지만 동일 도메인이라 함께 처리) |

## Why (root cause)

사용자 보고: "logout 버튼이 웹에서 작동하지 않음, 앱은 모르겠음 앱도 확인" — 여기서 "웹"은 `expo … --web`(또는 dev server에서 `w` 키)으로 켠 React Native Web 빌드를 의미.

**1차 조사 → 잘못된 결론(admin):**
초기에 "웹 = Next.js admin"으로 오해 → admin Sidebar에 logout 버튼이 없는 별도 누락을 발견하여 fix 적용 (`b0c6424`). admin 자체에는 진짜 누락이었으나 사용자가 의도한 문제는 아님.

**2차 조사 → 진짜 root cause:**

- `apps/mobile/app/(tabs)/more.tsx:45-64` `handleLogoutPress`는 `Alert.alert(title, undefined, [Cancel, Confirm{onPress: signOut}])` 호출.
- React Native Web의 `Alert` 폴리필은 `window.alert(title)`과 유사하게 단일 메시지만 표시하고 멀티 버튼/콜백을 지원하지 않음. 따라서 destructive `Confirm`의 `onPress`가 절대 호출되지 않아 `signOut()` 자체가 트리거되지 않음.
- 사용자 증상: 웹에서 Sign out 행을 눌러도 (다이얼로그가 잠깐 보이거나 안 보이거나) 로그아웃이 일어나지 않음.

**왜 모바일 네이티브는 정상이었는가:** iOS/Android의 `Alert.alert`은 진짜 네이티브 다이얼로그라 `onPress` 콜백이 정상 fire됨.

## Phase 1 evidence (systematic-debugging)

| 컴포넌트 | 입력 | 출력 |
|----------|------|------|
| `more.tsx` Sign out 행 onPress | tap | `Alert.alert(...)` 호출 ✓ |
| RN Web `Alert.alert` | (title, undefined, [...buttons]) | title만 `window.alert`로 표시 — buttons[].onPress **불호출** ✗ |
| `useAuthStore.signOut` | (없음, 호출되지 않음) | **트리거 안 됨** |

→ 끊긴 지점: RN Web의 Alert 폴리필 ↔ Confirm 버튼 콜백.

## Verification

- `pnpm --filter mobile typecheck` ✓
- `pnpm --filter mobile lint` ✓ (0 errors, 23 pre-existing warnings — 변경 무관)
- `pnpm vitest run tests/auth/signOut.test.ts tests/auth/signOut-queryclient-integration.test.ts` ✓ (7/7 pass)
- `pnpm --filter admin typecheck` ✓
- `pnpm --filter admin lint` ✓

코드 리뷰 노트:
- `signOut()` → `onSignOut` 콜백 (queryClient.clear) → state clear 체인은 그대로 보존 (T-7-05 계약).
- `performLogout`을 closure에 추출해서 web/native 두 분기가 동일 동작.
- `typeof window !== 'undefined'` 가드로 SSR/모듈 평가 시 안전.

## Out of scope (후속 검토)

다음 위치들도 동일한 RN Web Alert.alert 멀티버튼 한계의 영향을 받을 가능성이 있음. 사용자 요청 범위 밖이라 미수정:

- `apps/mobile/components/post/DeleteConfirmDialog.tsx`
- `apps/mobile/components/community/LeaveConfirmDialog.tsx`
- `apps/mobile/components/community/FollowButton.tsx`
- `apps/mobile/hooks/account/useDeleteAccount.ts`(가 있다면 — 호출 경로 확인 필요)

웹 타깃을 정식 지원하려면 위들도 동일 패턴으로 web 분기 또는 공용 `confirmDialog` 헬퍼로 추출하는 것이 권장됨.

## Manual UAT 체크리스트

### Mobile on web (`expo … --web` 또는 dev server에서 `w`)

1. 로그인 후 More 탭 진입
2. Sign out 행 탭 → 브라우저 confirm 다이얼로그가 뜨는지
3. OK → `/(auth)/login`으로 이동, 세션 종료 확인 (다른 탭 fresh 로드 시 다시 로그인 화면)
4. Cancel → 로그인 상태 유지

### Mobile native (iOS/Android)

1. More → Sign out → 기존 Alert.alert 다이얼로그(Cancel/Confirm destructive)가 그대로 뜨는지
2. Confirm → 로그아웃, Cancel → 유지

### Admin web (`pnpm --filter admin dev`)

1. 로그인 후 Sidebar 하단의 Sign out 행 확인
2. 클릭 → "Signing out…" 라벨, /login으로 이동

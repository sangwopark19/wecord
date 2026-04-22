---
quick_id: 260422-nir
slug: logout
description: "Logout 버튼이 웹(admin)에서 작동하지 않음 — 앱 동작 확인 포함"
date: 2026-04-22
mode: quick
status: complete
commit: b0c6424
---

# Quick Task 260422-nir — Summary

## What changed

| File | Change |
|------|--------|
| `apps/admin/components/Sidebar.tsx` | flex column 구조로 전환 후 nav 하단에 Sign-out 버튼 추가. `supabaseBrowser.auth.signOut()` → `router.replace('/login')` 흐름. `isSigningOut` state로 더블클릭 가드, finally에서 redirect 보장 |

## Why

사용자 보고: "logout 버튼이 웹에서 작동하지 않음, 앱은 모르겠음 앱도 확인"

조사 결과(systematic-debugging Phase 1):

- **웹(admin):** logout 버튼이 코드 어디에도 존재하지 않았음. Sidebar는 8개 nav 메뉴만, dashboard layout은 sidebar + main만 렌더. 사용자가 "작동하지 않음"이라고 표현한 이유는 클릭할 대상이 없었기 때문.
- **모바일:** `(tabs)/more.tsx:45-58` `handleLogoutPress` → `Alert` 확인 → `useAuthStore.getState().signOut()` → `supabase.auth.signOut()` + `onSignOut` 콜백(queryClient.clear) + 로컬 state 클리어. 통합 테스트(`signOut.test.ts`, `signOut-queryclient-integration.test.ts`)도 존재. **변경 불필요**.

## Verification

- `pnpm --filter admin typecheck` ✓
- `pnpm --filter admin lint` ✓
- 코드 리뷰: `signOut()` 실패해도 finally에서 `/login` redirect, `(dashboard)/layout.tsx`의 `getUser()` 가드가 추가로 보호 — 이중 안전망

## Out of scope (후속 검토 가능)

- 확인 다이얼로그 (현재는 즉시 signOut). 데스크탑은 fat-finger 위험이 낮아 1차 fix는 즉시 처리 선택
- 토스트/에러 표시 UI
- 모바일은 변경 없음

## Manual UAT 체크리스트

브라우저에서 admin 로그인 후:

1. Sidebar 하단에 "Sign out" 행이 보이는지 확인
2. 클릭 → 라벨이 "Signing out…"으로 변하고 disabled 되는지
3. 짧은 시간 후 `/login`으로 리다이렉트되는지
4. 다시 `/admin` URL로 접근 시 OAuth 로그인 화면이 뜨는지 (세션 종료 확인)

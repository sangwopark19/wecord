---
quick_id: 260422-nir
slug: logout
description: "Logout 버튼이 웹(admin)에서 작동하지 않음 — 앱 동작 확인 포함"
date: 2026-04-22
mode: quick
status: planned
---

# Quick Task 260422-nir: Web admin logout 버튼

## 문제 보고

> "logout 버튼이 웹에서 작동하지 않음, 앱은 모르겠음 앱도 확인"

## Root Cause (Phase 1 조사)

| 영역 | 상태 | 근거 |
|------|------|------|
| `apps/admin` (Next.js 웹) | **logout 버튼 없음** | `components/Sidebar.tsx`에는 8개 nav 메뉴만 존재. `(dashboard)/layout.tsx`는 Sidebar + main만 렌더, 헤더/유저 메뉴 없음. `signOut()`은 `login/page.tsx`의 OAuth 거부 분기에서만 호출됨 |
| `apps/mobile` | **정상 동작** | `(tabs)/more.tsx:45-58` `handleLogoutPress` → `Alert.alert` 확인 → `useAuthStore.getState().signOut()`. `stores/authStore.ts:184` `supabase.auth.signOut()` + `onSignOut` 콜백 호출 + 로컬 state 클리어. `_layout.tsx:31`이 `registerOnSignOut`으로 queryClient.clear 등록. `tests/auth/signOut.test.ts` + `signOut-queryclient-integration.test.ts` 존재 |

→ 사용자가 "작동하지 않음"이라고 보고한 이유: **버튼 자체가 존재하지 않아 클릭 불가**. 모바일은 추가 작업 불필요.

## Fix Scope

**범위:** `apps/admin`에만 한정. mobile 변경 없음.

**파일 (1개):**
- `apps/admin/components/Sidebar.tsx` — sidebar 하단에 sign-out 버튼 추가

## Tasks

### Task 1: Sidebar 하단 sign-out 버튼 추가

**File:** `apps/admin/components/Sidebar.tsx`

**Action:**
1. `'use client'` 유지. import에 `LogOut` (lucide-react), `useRouter` (next/navigation), `useState` 추가, `supabaseBrowser` import 추가
2. `<aside>`를 flex column으로 변경: `flex h-full ... flex-col`
3. `<nav>`에 `flex-1` 추가 (logout이 하단으로 밀리도록)
4. `</nav>` 다음에 logout 영역 추가:
   ```tsx
   <div className="px-3 pb-6">
     <button
       onClick={handleSignOut}
       disabled={isSigningOut}
       className="flex w-full items-center gap-3 rounded-md border-l-[3px] border-transparent px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-[#2B2B2B] disabled:cursor-not-allowed disabled:opacity-50"
     >
       <LogOut size={20} />
       <span>{isSigningOut ? 'Signing out…' : 'Sign out'}</span>
     </button>
   </div>
   ```
5. 핸들러:
   ```tsx
   async function handleSignOut() {
     if (isSigningOut) return;
     setIsSigningOut(true);
     try {
       await supabaseBrowser.auth.signOut();
     } catch (err) {
       console.warn('[Auth] signOut threw — redirecting anyway', err);
     } finally {
       router.replace('/login');
     }
   }
   ```

**Verify:**
- `pnpm --filter admin typecheck` 통과
- `pnpm --filter admin lint` 통과

**Done:**
- Sidebar 하단에 sign-out 버튼이 보이고
- 클릭 시 supabase 세션이 종료되며 `/login`으로 이동
- 더블클릭 가드(`isSigningOut`)로 중복 호출 방지
- signOut 실패해도 finally에서 redirect 처리

## must_haves

**Truths:**
- admin sidebar에서 logout 가능
- mobile logout은 변경되지 않음 (이미 정상)

**Artifacts:**
- `apps/admin/components/Sidebar.tsx` (수정)

**Key links:**
- 모바일 reference: `apps/mobile/app/(tabs)/more.tsx:45-58`
- 모바일 store: `apps/mobile/stores/authStore.ts:184-209`
- supabase 클라이언트: `apps/admin/lib/supabase-browser.ts`

## Out of scope

- 확인 다이얼로그 (mobile은 Alert로 확인 받지만 데스크탑 admin은 클릭 정확도가 높아 1차 fix는 즉시 signOut으로 진행)
- 토스트/에러 표시 UI (실패해도 redirect는 보장됨; 후속 개선 가능)
- mobile 코드 변경 (이미 동작)

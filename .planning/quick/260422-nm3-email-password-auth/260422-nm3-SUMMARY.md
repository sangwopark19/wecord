---
id: 260422-nm3
title: 일반 로그인 (이메일/비밀번호) 추가
slug: email-password-auth
mode: quick
date: 2026-04-22
status: complete
commits:
  - 18233a9
  - a89fa67
  - f990e64
  - 36ae0c3
files_modified:
  - packages/shared/src/i18n/locales/ko/auth.json
  - packages/shared/src/i18n/locales/en/auth.json
  - packages/shared/src/i18n/locales/th/auth.json
  - packages/shared/src/i18n/locales/zh/auth.json
  - packages/shared/src/i18n/locales/ja/auth.json
  - apps/mobile/app/(auth)/login.tsx
files_created:
  - apps/mobile/app/(auth)/email-login.tsx
  - apps/mobile/app/(auth)/email-signup.tsx
  - apps/mobile/app/(auth)/forgot-password.tsx
task_count: 4
tasks_completed: 4
---

# Quick Task 260422-nm3: 일반 로그인 (이메일/비밀번호) 추가 — Summary

One-liner: 기존 Apple/Google OAuth 화면에 **이메일 로그인 / 가입 / 비밀번호 재설정 요청** 화면 3개를 추가, supabase-js의 `signInWithPassword` / `signUp` / `resetPasswordForEmail` 직접 호출 + AuthGuard 자동 라우팅 재활용.

## What Was Built (per task)

### Task 1 — i18n keys across 5 locales (`18233a9`)

- 5개 로케일 (`ko/en/th/zh/ja`) `auth.json`에 아래 키 추가:
  - `login.email_cta` — login 화면 진입 버튼 라벨
  - `email_login.*` (7 keys) — title, placeholders, submit, forgot, signup prompt/cta
  - `email_signup.*` (8 keys) — check_email 상태 포함
  - `forgot_password.*` (7 keys) — sent 상태 포함
  - `error.invalid_email`, `error.weak_password`, `error.email_in_use`, `error.invalid_credentials`, `error.reset_failed` (5 keys)
- 기존 키 (`login.google_cta`, `login.apple_cta`, `error.auth_failed` 등) **한 글자도 변경 없음**.
- th/zh/ja는 plan 허용대로 en mirror 가능하나, 자연스러운 번역으로 직접 로컬라이즈함 (검토/교정 필요).

### Task 2 — email-login 화면 + login.tsx 진입 버튼 (`a89fa67`)

- `login.tsx`:
  - `useRouter` import 1줄 추가
  - `const router = useRouter()` 훅 1줄 추가
  - Google 버튼 아래 (`gap-y-3 mb-2` View 내부) `testID="email-signin-button"` TouchableOpacity 1개 추가
  - OAuth 함수/상태/스타일 **변경 없음** (regression-safe)
- `app/(auth)/email-login.tsx` 신규:
  - useState 기반 email/password/loading/error 상태 (react-hook-form 미사용)
  - `/.+@.+\..+/` 간단 regex + Supabase 서버 검증 조합
  - `supabase.auth.signInWithPassword` 호출 → Supabase가 wrong email/password 둘 다 `Invalid login credentials`로 회신하므로 인라인 `error.invalid_credentials`로 표시
  - 성공 시 `onAuthStateChange` → AuthGuard 자동 라우팅 (manual nav 없음)
  - 하단에 "forgot password?" 링크 + "계정이 없으신가요? 가입하기" 링크
  - `Alert.alert` 미사용 — `showError` 4초 자동 클리어 inline 패턴

### Task 3 — email-signup 화면 (`f990e64`)

- `app/(auth)/email-signup.tsx` 신규:
  - `supabase.auth.signUp` 호출 후 `data.session` 분기:
    - `!data.session` (confirmation ON): `check_email_title/body` 렌더링 분기로 전환
    - `data.session` (confirmation OFF): `onAuthStateChange` → `fetchOrCreateProfile` UPSERT (`onboarding_completed: false`) → AuthGuard가 `/(onboarding)/tos`로
  - 에러 메시지 LOWER-CASE 매칭:
    - `already` / `registered` → `error.email_in_use`
    - `password` → `error.weak_password`
    - 기타 → `error.auth_failed`
  - **DB 마이그레이션 없음** — profile row는 authStore가 첫 SIGNED_IN에서 자동 UPSERT
- 부차: `email-login.tsx`에서 미사용 `err` catch binding 제거 (lint 경고 정리)

### Task 4 — forgot-password 화면 + wiring 검증 (`36ae0c3`)

- `app/(auth)/forgot-password.tsx` 신규:
  - `supabase.auth.resetPasswordForEmail(email)` 호출 (`redirectTo` 미전달 — Supabase 프로젝트 기본 reset URL 사용)
  - 성공 시 `sent` 상태로 전환, `sent_title/body` 렌더링 분기
  - "back to login" 링크로 email-login 복귀
- AuthGuard (`apps/mobile/app/_layout.tsx`) / `fetchOrCreateProfile` (`apps/mobile/stores/authStore.ts`) 코드 **변경 없음** — 검증만 수행:
  - `!session && !inAuthGroup` → `(auth)/login`
  - `session && profile && !onboardingCompleted && !inOnboardingGroup` → `(onboarding)/tos`
  - `fetchOrCreateProfile`가 새 auth.users에 대해 `profiles` upsert(`onboarding_completed: false`)
  - 따라서 email signup 유저도 Apple/Google OAuth 유저와 동일 경로로 온보딩 진입

## Deviations from Plan

플랜대로 실행. 작은 사항 2건:

1. **[lint cleanup]** Task 3 commit에 `email-login.tsx`의 unused `err` catch binding 제거 포함 (`catch (err)` → `catch`). 플랜엔 명시되지 않았지만 ESLint 경고가 내가 추가한 코드에서 발생하므로 CLAUDE.md 규칙 "Fix lint errors always; fix warnings only in code you changed"에 따라 정리. `email-signup.tsx`, `forgot-password.tsx`는 처음부터 bare `catch`로 작성.
2. **[translation quality]** 플랜은 th/zh/ja를 en mirror로 허용했으나, 해당 로케일의 기존 톤이 정확한 로컬라이제이션을 갖고 있어서 동일 수준으로 실제 번역을 시도함 (기계 번역 품질 — 네이티브 검토 권장, Follow-up 참조).

## Quality Gates

| Gate | Result |
|------|--------|
| `pnpm --filter @wecord/shared typecheck` | PASS |
| `pnpm --filter mobile typecheck` | PASS |
| `pnpm --filter mobile lint` | PASS (0 errors, 23 pre-existing warnings in unrelated files) |
| 5 locale 키 검증 script | PASS (`i18n ok`) |

신규 파일 (`email-login.tsx`, `email-signup.tsx`, `forgot-password.tsx`) 및 수정 파일 (`login.tsx`)에 lint warning 0건.

## Follow-ups (Deferred)

- **Deep-link 비밀번호 재설정 화면** — `/(auth)/reset-password` 화면 생성 + `PASSWORD_RECOVERY` 이벤트 수신 핸들러 + Supabase Email Template의 reset URL을 `wecord://auth/reset` 커스텀 스킴으로 교체. 현재는 Supabase 호스팅 페이지 사용.
- **"Resend verification email"** 액션 — `email_signup` check-email 화면에 추가 가능 (UX 컴플레인 발생 시).
- **RFC 5322 엄격 이메일 검증** — 현재 `/.+@.+\..+/` regex + Supabase 서버 검증으로 충분하다고 판단. 필요 시 별도 유효성 라이브러리 도입.
- **번역 네이티브 검토** — th/zh/ja `auth.json`의 `email_login.*`, `email_signup.*`, `forgot_password.*`, `error.*` 문자열은 기계 번역 품질. 네이티브 카피라이터 검토 필요 (UX 폴리시 단계에서).
- **비밀번호 가시성 토글** (show/hide eye icon) — 현재는 단순 `secureTextEntry`. 접근성 강화를 위해 eye toggle 추가 가능.
- **Email input focus ring / 에러 시 입력창 강조** — 현재는 에러 문구만 인라인. 포커스 테두리 색상 변경 등 상세 UX 개선.

## Manual Smoke-test (한국어)

Expo dev build (iOS sim 권장):

1. **Apple 로그인 (regression)** — 로그인 화면에서 "Apple로 시작하기" → 정상 로그인 → `/(tabs)` 도달 확인.
2. **Google 로그인 (regression)** — "Google로 시작하기" → 정상 OAuth → `/(tabs)` 도달.
3. **Email 가입 (confirmation ON, Supabase 기본)**:
   - 로그인 화면 최하단 "이메일로 계속하기" 탭
   - email-login 화면에서 하단 "가입하기" 링크 탭 → email-signup 화면 전환
   - 미사용 이메일 + 8자 이상 비밀번호 입력 후 "가입하기" → "이메일을 확인해 주세요" 화면 표시
   - 받은 확인 메일 링크 탭 → 앱 재진입 → AuthGuard가 자동으로 `/(onboarding)/tos`로 이동 확인
4. **Email 가입 (confirmation OFF)** — Supabase 대시보드에서 confirmation 끄고 재테스트: 즉시 세션 생성 → `/(onboarding)/tos` 자동 이동.
5. **Email 로그인 (기존 계정)** — email-login 화면에서 가입된 email/password 입력 → AuthGuard가 onboardingCompleted 상태 따라 `/(tabs)` 또는 `/(onboarding)/tos`로 라우팅.
6. **잘못된 로그인 정보** — 잘못된 비밀번호 → "이메일 또는 비밀번호가 일치하지 않아요" 인라인 표시 (4초 후 자동 사라짐). `Alert.alert` 안 뜸 확인.
7. **약한 비밀번호 (8자 미만)** — "비밀번호는 8자 이상이어야 해요" 클라이언트 측 인라인 에러.
8. **이미 가입된 이메일로 재가입** — "이미 가입된 이메일이에요. 로그인해 주세요" 인라인 표시.
9. **비밀번호 재설정 요청**:
   - email-login 화면에서 "비밀번호를 잊으셨나요?" 탭 → forgot-password 화면
   - 이메일 입력 후 "재설정 링크 보내기" → "메일을 보냈어요" 화면
   - 받은 메일 링크 → Supabase 호스팅 reset 페이지에서 비밀번호 변경 (앱 내 재설정 화면은 deferred)

## Self-Check: PASSED

Files verified:
- `packages/shared/src/i18n/locales/ko/auth.json` — FOUND (email_login, email_signup, forgot_password, login.email_cta 키 존재)
- `packages/shared/src/i18n/locales/en/auth.json` — FOUND
- `packages/shared/src/i18n/locales/th/auth.json` — FOUND
- `packages/shared/src/i18n/locales/zh/auth.json` — FOUND
- `packages/shared/src/i18n/locales/ja/auth.json` — FOUND
- `apps/mobile/app/(auth)/login.tsx` — FOUND (email-signin-button testID 추가 확인)
- `apps/mobile/app/(auth)/email-login.tsx` — FOUND (신규)
- `apps/mobile/app/(auth)/email-signup.tsx` — FOUND (신규)
- `apps/mobile/app/(auth)/forgot-password.tsx` — FOUND (신규)

Commits verified in `git log`:
- `18233a9` — FOUND (i18n keys)
- `a89fa67` — FOUND (email-login + entry button)
- `f990e64` — FOUND (email-signup)
- `36ae0c3` — FOUND (forgot-password)

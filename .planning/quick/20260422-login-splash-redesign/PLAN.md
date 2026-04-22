---
type: quick_plan
slug: login-splash-redesign
date: 2026-04-22
status: in-progress
---

# Quick Plan — Login Splash Redesign

## Description

레퍼런스 이미지(Login — Splash)의 디자인 시스템과 감각에 맞춰 현재 로그인 화면의 레이아웃/타이포/톤을 전면 재설계한다. OAuth(Apple/Google) 기능과 Apple Guideline 4.8 순서 제약은 유지한다.

## Scope

- **대상 파일:** `apps/mobile/app/(auth)/login.tsx`
- **i18n:** `packages/shared/src/i18n/locales/{ko,en,ja,zh,th}/auth.json`에 `login.fandom_label`, `login.tagline`, `login.live_teaser` 키 추가

## Visual Requirements (레퍼런스 이미지 기준)

1. 상단 보라색 방사형 글로우 (`LinearGradient`)
2. "FOR THE FANDOM" 마이크로 라벨 (10px, tracked, uppercase, dim)
3. 히어로 워드마크 `wecord` + 보라색(`#8B5CF6`) 포인트 도트
4. 서브 태그라인 ("Live stages, private DMs, fan letters — one home for every artist you love.")
5. LIVE 티저 카드 (LIVE 뱃지 + MAUV 활동 문구)
6. Apple 버튼: 흰 배경 primary (filled, `#FFFFFF`)
7. Google 버튼: 어두운 outlined secondary (`bg-surface` + `border-border`)
8. 하단 약관/개인정보 안내 라인

## Constraints (반드시 유지)

- `testID="apple-signin-button"`이 `testID="google-signin-button"`보다 JSX 소스상 먼저 등장 (login-snapshot.test.ts)
- Apple 버튼에 `accessibilityLabel` 유지
- 기존 OAuth 로직(`signInWithGoogle`, `signInWithApple`, `signInWithAppleWeb`, `handleOAuthCallbackUrl`) 그대로 유지
- i18n 키 기반 텍스트 사용 (literal 하드코딩 금지)

## Tasks

1. i18n 키 추가 (ko/en/ja/zh/th 5개 로케일)
2. `login.tsx` 재설계 — 레이아웃/타이포/LIVE 카드/버튼 hierarchy 교체
3. `pnpm typecheck` 통과 확인
4. `pnpm test` (login-snapshot) 통과 확인
5. Atomic commit

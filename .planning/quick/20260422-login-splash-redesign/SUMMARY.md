---
type: quick_summary
slug: login-splash-redesign
date: 2026-04-22
status: complete
---

# Summary — Login Splash Redesign

## Outcome

레퍼런스 이미지(Login — Splash)의 디자인 시스템에 맞춰 `apps/mobile/app/(auth)/login.tsx` 전면 재설계 완료. OAuth 기능과 Apple Guideline 4.8 순서 제약 그대로 유지.

## Changes

- **`apps/mobile/app/(auth)/login.tsx`** — 레이아웃 재설계
  - 상단 보라색 방사형 글로우 (`LinearGradient` 45%→18%→0%)
  - `FOR THE FANDOM` 마이크로 라벨 (mono, uppercase, muted)
  - 히어로 워드마크 `wecord` + 보라색(`#8B5CF6`) 포인트 도트 (68px, weight black, tight tracking)
  - 태그라인 (body, muted-foreground)
  - LIVE 티저 카드 (`bg-live` 뱃지 + dot + artist activity)
  - Apple 버튼 → 흰색 primary filled (`bg-foreground`, 54px)
  - Google 버튼 → 어두운 outlined secondary (`bg-surface/60 + border`)
  - 하단 legal note (`text-dim`)
  - testID / accessibilityLabel / Apple-above-Google 순서 유지
- **i18n**: 5개 로케일 (ko/en/ja/zh/th)에 새 키 추가 — `login.fandom_label`, `login.tagline`, `login.live_teaser`

## Verification

- `pnpm typecheck` (mobile) — ✅ 통과
- `pnpm test tests/auth/login-snapshot.test.ts` — ✅ 4/4 통과 (Apple 위 Google 순서 확인)
- `pnpm lint` (mobile) — ✅ 0 errors (수정한 `login.tsx`에 경고 없음)
- 모든 5개 로케일 새 키 JSON 파싱 확인

## Out of Scope / Follow-ups

- Email 인증 플로우 및 Browse-as-guest는 백엔드/라우팅 미구현이므로 이번 재설계에서 제외 (레퍼런스의 Email / Artist Picker 화면도 동일 이유로 보류)
- LIVE 티저의 "MAUV dropped 'Mirror'"는 현재 하드코딩 (추후 실시간 artist drop 피드로 교체 가능)
- 스플래시 배경의 별/점 파티클 패턴은 미구현 (LinearGradient만으로 충분한 톤 확보)

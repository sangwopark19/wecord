---
status: resolved
trigger: "언어 선택 시 앱 언어가 즉시 변경되지 않음 (Test 8 & 12)"
created: 2026-03-19T00:00:00Z
updated: 2026-03-19T00:00:00Z
---

## Current Focus

hypothesis: Two independent root causes prevent immediate language switching
test: Code analysis of language.tsx flow + react-i18next dual instance from prior session
expecting: Confirmed both issues
next_action: Report root cause

## Symptoms

expected: 언어 선택 시 화면 텍스트가 선택 언어로 즉시 변경됨
actual: 라디오 버튼은 변경되지만 화면 텍스트는 변경되지 않음
errors: No runtime errors
reproduction: 온보딩 Language 화면에서 언어 선택
started: Since onboarding implementation

## Eliminated

(none)

## Evidence

- timestamp: 2026-03-19
  checked: language.tsx line 36 — when i18n.changeLanguage is called
  found: changeLanguage is called ONLY inside handleContinue (button press), NOT on language item selection (setSelectedLanguage on line 67)
  implication: ROOT CAUSE 1 — selecting a language only updates local state; i18n.changeLanguage is never called until user presses "Continue"

- timestamp: 2026-03-19
  checked: react-i18next dual instance (from prior debug session i18n-keys-not-translated.md)
  found: pnpm resolves two separate react-i18next instances (react@19.2.3 vs 19.2.4 peer dep)
  implication: ROOT CAUSE 2 — even if changeLanguage were called on selection, useTranslation from the shared package's react-i18next instance may not trigger re-render in mobile components if they resolve a different react-i18next

- timestamp: 2026-03-19
  checked: language.tsx line 6 — i18n default import
  found: "import i18n from '@wecord/shared/i18n'" — this re-exports the i18next core singleton, which IS shared (single instance)
  implication: i18n.changeLanguage() call targets the correct instance; the problem is timing (not called on selection) and react binding (dual react-i18next)

- timestamp: 2026-03-19
  checked: LANGUAGES array (lines 13-19) — uses hardcoded labels
  found: Labels like '한국어', 'English' are static strings, not t() calls
  implication: Language option labels are correctly hardcoded (native language names); the issue is the title/CTA text not updating

## Resolution

root_cause: |
  Two independent issues prevent immediate language switching:

  1. **changeLanguage timing (Primary):** `i18n.changeLanguage(selectedLanguage)` is called
     only inside `handleContinue` (line 36), which runs when the user presses the CTA button.
     Selecting a language item (line 67) only calls `setSelectedLanguage()` — a local React
     state update that changes the radio button visual but does NOT call i18n.changeLanguage().
     Therefore the screen title `t('language.title')` and CTA `t('language.cta')` never update
     until the user leaves the screen.

  2. **Dual react-i18next instances (Secondary, from prior session):** pnpm resolves
     react-i18next to two physical copies due to differing React peer deps (19.2.3 vs 19.2.4).
     `initI18n()` registers `initReactI18next` on the shared package's copy, but `useTranslation`
     in mobile components may resolve to the mobile's uninitialized copy. Even if changeLanguage
     were called on selection, the React re-render subscription might not fire correctly.

fix: Applied in commit 6cda689 — changeLanguage를 선택 시점에 호출하도록 수정
verification: UAT 통과 (commit a1aa0df)
files_changed:
  - apps/mobile/app/(onboarding)/language.tsx
resolved: 2026-03-19

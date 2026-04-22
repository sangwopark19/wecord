---
status: resolved
trigger: "i18n 번역 키가 번역되지 않고 그대로 노출됨"
created: 2026-03-19T00:00:00Z
updated: 2026-03-19T00:00:00Z
---

## Current Focus

hypothesis: Dual react-i18next instances due to pnpm peer dependency resolution mismatch
test: Compare real paths of react-i18next in mobile vs shared
expecting: Different paths = different module singletons = mobile's useTranslation reads uninitialized instance
next_action: Report root cause

## Symptoms

expected: t('login.google_cta') returns "Google로 시작하기"
actual: t('login.google_cta') returns raw key "login.google_cta"
errors: No runtime errors -- keys silently returned as-is
reproduction: Open login screen in Expo app
started: Since auth screen implementation

## Eliminated

(none)

## Evidence

- timestamp: 2026-03-19
  checked: i18n init code (packages/shared/src/i18n/index.ts)
  found: initI18n() correctly configures i18next with resources, ns=['common','auth'], uses initReactI18next plugin
  implication: Init code itself is correct

- timestamp: 2026-03-19
  checked: Translation JSON files (ko/auth.json, en/auth.json)
  found: All keys (login.google_cta, login.apple_cta, login.legal_note) exist with correct values
  implication: Translation data is correct

- timestamp: 2026-03-19
  checked: _layout.tsx imports and calls
  found: `import { initI18n } from '@wecord/shared'` then `initI18n()` at module scope
  implication: Init runs before components render -- correct timing

- timestamp: 2026-03-19
  checked: react-i18next symlink real paths in node_modules
  found: |
    mobile: .pnpm/react-i18next@16.5.8_..._react@19.2.3_.../node_modules/react-i18next
    shared: .pnpm/react-i18next@16.5.8_..._react@19.2.4_.../node_modules/react-i18next
    These are DIFFERENT physical directories (different peer dep resolution due to react 19.2.3 vs 19.2.4)
  implication: ROOT CAUSE -- two separate react-i18next singletons exist

- timestamp: 2026-03-19
  checked: i18next symlink real paths
  found: Both mobile and shared resolve i18next to the SAME path (.pnpm/i18next@25.8.18_typescript@5.9.3)
  implication: The i18next core instance IS shared, but react-i18next is NOT

## Resolution

root_cause: |
  pnpm resolves react-i18next to two different physical instances because
  @wecord/shared depends on react@19.2.4 (transitive/peer) while apps/mobile
  depends on react@19.2.3. Since react-i18next has react as a peer dependency,
  pnpm creates separate copies for each react version.

  initI18n() calls i18n.use(initReactI18next) using the SHARED package's
  react-i18next instance. But useTranslation('auth') in login.tsx resolves
  to the MOBILE app's react-i18next instance, which was never initialized
  with initReactI18next. Result: useTranslation returns raw keys.

fix: Applied in commit f289d41 — dual react-i18next instance 해결
verification: UAT 통과 (commit a1aa0df)
files_changed:
  - packages/shared/package.json (react peer dep alignment)
resolved: 2026-03-19

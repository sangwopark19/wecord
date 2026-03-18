---
status: complete
phase: 01-foundation
source: 01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md, 01-04-SUMMARY.md
started: 2026-03-18T06:00:00Z
updated: 2026-03-18T06:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: 프로젝트 루트에서 `pnpm install` 후 에러 없이 완료. `pnpm turbo build` 모든 패키지 빌드 성공. `pnpm turbo typecheck` 에러 없이 통과.
result: issue
reported: "pnpm turbo build 실패 - withNativewind is not a function, react-native-css-interop 누락, expo-router 버전 불일치(4.0.22→55.0.6), react-native-screens 버전 불일치(4.10→4.24), react/react-dom 버전 불일치"
severity: blocker

### 2. Local Supabase 데이터베이스
expected: supabase start 후 14개 테이블과 posts_with_nickname 뷰 확인
result: pass

### 3. Mobile App 실행
expected: Expo 개발 서버 시작, 검정 배경 다크 테마, 하단 탭 바
result: pass

### 4. Admin App 실행
expected: Next.js 개발 서버 시작, 다크 테마 페이지, teal 액센트
result: pass

### 5. i18n 번역 로드
expected: 5개 언어 폴더에 common.json, auth.json 존재, ko는 한국어 번역
result: issue
reported: "ko(한국어) 번역 파일이 영어로만 작성되어 있음. th/zh/ja는 placeholder로 의도된 것이나 ko는 한국어여야 함"
severity: minor

### 6. CI 파이프라인 파일 존재
expected: .github/workflows/ci.yml에 5개 job 정의
result: pass

## Summary

total: 6
passed: 4
issues: 2
pending: 0
skipped: 0

## Gaps

- truth: "pnpm turbo build가 에러 없이 모든 패키지를 빌드해야 한다"
  status: failed
  reason: "User reported: pnpm turbo build 실패 - withNativewind is not a function, react-native-css-interop 누락, expo-router/react-native-screens/react 버전 불일치"
  severity: blocker
  test: 1
  root_cause: "metro.config.js에서 withNativewind(소문자 w) 사용했으나 실제 export는 withNativeWind(대문자 W). react-native-css-interop 미설치. expo-router 4.0.22는 SDK 55와 호환 불가(55.0.x 필요). react-native-screens 4.10은 featureFlags.experiment 미지원. react 19.2.0 vs react-dom 19.2.3 불일치."
  artifacts:
    - path: "apps/mobile/metro.config.js"
      issue: "withNativewind → withNativeWind 대소문자 오류"
    - path: "apps/mobile/package.json"
      issue: "expo-router, react-native-screens, react, react-dom 버전 불일치"
  missing:
    - "react-native-css-interop 의존성"
    - "react-native-web 의존성"
  debug_session: ""

- truth: "ko(한국어) 번역 파일에 한국어 번역이 포함되어야 한다"
  status: failed
  reason: "User reported: ko(한국어) 번역 파일이 영어로만 작성되어 있음"
  severity: minor
  test: 5
  root_cause: "packages/shared/src/i18n/locales/ko/common.json과 auth.json이 en과 동일한 영어 텍스트로 작성됨"
  artifacts:
    - path: "packages/shared/src/i18n/locales/ko/common.json"
      issue: "영어로만 작성됨, 한국어 번역 필요"
    - path: "packages/shared/src/i18n/locales/ko/auth.json"
      issue: "영어로만 작성됨, 한국어 번역 필요"
  missing:
    - "ko locale 파일에 한국어 번역 적용"
  debug_session: ""

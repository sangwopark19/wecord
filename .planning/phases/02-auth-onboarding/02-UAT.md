---
status: complete
phase: 02-auth-onboarding
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md]
started: 2026-03-19T00:00:00Z
updated: 2026-03-19T00:05:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Login Screen UI
expected: 로그인 화면에 Google과 Apple OAuth 버튼이 pill 형태로 표시됨. 다크 배경에 법적 고지 텍스트가 하단에 표시됨.
result: issue
reported: "i18n 번역 키가 그대로 노출됨 - login.google_cta, login.legal_note 등 키 텍스트가 번역되지 않고 표시됨"
severity: major

### 2. Google OAuth 로그인
expected: Google 버튼 탭 시 브라우저가 열리고 Google 로그인 화면이 표시됨. 로그인 완료 후 앱으로 돌아옴.
result: issue
reported: "구글로그인 시 400 validation_failed - Unsupported provider: provider is not enabled"
severity: blocker

### 3. Apple OAuth 로그인
expected: Apple 버튼 탭 시 iOS에서는 네이티브 Apple 로그인 시트가 표시됨. 로그인 완료 후 앱으로 돌아옴.
result: issue
reported: "구글과 동일 - Unsupported provider: provider is not enabled"
severity: blocker

### 4. Auth Guard 라우팅 - 미인증
expected: 세션이 없는 상태에서 앱 실행 시 자동으로 로그인 화면으로 이동됨.
result: pass

### 5. Auth Guard 라우팅 - 온보딩 미완료
expected: 로그인 후 온보딩을 완료하지 않은 사용자는 자동으로 온보딩(ToS) 화면으로 이동됨.
result: skipped
reason: 로그인 불가능하여 테스트 불가

### 6. ToS 약관 동의 화면
expected: 스크롤 가능한 약관 내용이 표시되고, 체크박스가 있음. 체크박스 선택 전에는 CTA 버튼이 비활성화. 체크 후 버튼 활성화되어 다음 단계로 진행 가능.
result: skipped
reason: 로그인 불가능하여 테스트 불가

### 7. DoB 생년월일 입력
expected: 네이티브 DateTimePicker가 표시됨. 날짜 선택 후 다음으로 진행 가능. 만 14세 미만 선택 시 에러 메시지가 표시되고 진행 차단됨.
result: skipped
reason: 로그인 불가능하여 테스트 불가

### 8. Language 언어 선택
expected: 5개 언어(한국어, English, ไทย, 中文, 日本語) 목록이 라디오 버튼 형태로 표시됨. 언어 선택 시 앱 언어가 즉시 변경됨.
result: skipped
reason: 로그인 불가능하여 테스트 불가

### 9. Creator Curation 화면
expected: 2열 그리드로 크리에이터/커뮤니티 카드가 표시됨. 멀티 선택 가능하며 탭 시 선택 애니메이션이 있음. Skip 가능.
result: skipped
reason: 로그인 불가능하여 테스트 불가

### 10. 온보딩 완료 후 홈 이동
expected: 온보딩 마지막 단계 완료 후 자동으로 메인 탭 화면으로 이동됨. 앱 재시작 시에도 온보딩이 다시 나타나지 않음.
result: skipped
reason: 로그인 불가능하여 테스트 불가

### 11. 온보딩 진행 표시 (Dot Indicator)
expected: 온보딩 각 단계에서 상단에 4개의 점 인디케이터가 표시되며, 현재 단계의 점이 활성화(teal 색상, 확대)됨.
result: skipped
reason: 로그인 불가능하여 테스트 불가

### 12. i18n 다국어 지원
expected: 로그인, 온보딩 전체 화면에서 선택된 언어에 맞는 텍스트가 표시됨. 언어 변경 시 즉시 반영됨.
result: skipped
reason: 로그인 불가능하여 테스트 불가

## Summary

total: 12
passed: 1
issues: 3
pending: 0
skipped: 8

## Gaps

- truth: "로그인 화면에서 i18n 번역 텍스트가 올바르게 표시됨"
  status: failed
  reason: "User reported: i18n 번역 키가 그대로 노출됨 - login.google_cta, login.legal_note 등 키 텍스트가 번역되지 않고 표시됨"
  severity: major
  test: 1
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Google OAuth 로그인이 정상 작동함"
  status: failed
  reason: "User reported: 400 validation_failed - Unsupported provider: provider is not enabled"
  severity: blocker
  test: 2
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Apple OAuth 로그인이 정상 작동함"
  status: failed
  reason: "User reported: 구글과 동일 - Unsupported provider: provider is not enabled"
  severity: blocker
  test: 3
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

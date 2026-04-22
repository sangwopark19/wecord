---
status: partial
phase: 07-launch-polish
source: [07-VERIFICATION.md]
started: "2026-04-22T05:13:36Z"
updated: "2026-04-22T05:13:36Z"
---

## Current Test

[awaiting human testing — manual cutover steps deferred per CODE+DOCS-ONLY mode for Wave 3]

## Tests

### 1. App Store 및 Play Store 실제 제출 완료 확인
expected: 07-03-MANUAL-FOLLOWUP.md §1-9의 모든 단계가 완료되어 TestFlight/Play 내부 테스트에 빌드가 올라가 있어야 함
result: [pending — deferred to dev runbook]

### 2. 법적 페이지(privacy / terms / account-delete-request / support) 실제 공개 접근 확인
expected: https://wecord-docs.pages.dev/privacy 등이 HTTP 200을 반환하고 KO/EN 토글이 정상 동작
result: [pending — Cloudflare Pages 배포 (07-03-MANUAL-FOLLOWUP.md §1) 후 검증]

### 3. WebView에서 x-square.kr 실제 로드 확인
expected: Shop 탭 탭 시 x-square.kr가 앱 내 WebView로 열리고, 외부 도메인 링크는 시스템 브라우저로 핸드오프됨
result: [pending — 실기기/시뮬레이터에서 EAS 빌드 후 검증]

### 4. DM 탭 Notify Me 플로우 실제 E2E 확인
expected: Notify Me 탭 시 profiles.dm_launch_notify가 true로 업데이트되고, 재탭 시 alreadyNotifiedToast Alert가 표시됨
result: [pending — 프로덕션 Supabase + 실제 유저 세션 필요]

### 5. 앱 삭제 계정 플로우 end-to-end 확인
expected: More → Settings → Delete Account 3탭 후 DELETE 입력, 처리 완료 시 login 화면으로 이동하고 data 삭제됨
result: [pending — 프로덕션 Supabase + service_role key + delete-user Edge Function 배포 필요]

### 6. Apple Sign-in이 Google 위에 렌더링되는지 실물 기기 확인
expected: iOS 기기에서 login.tsx 렌더링 시 Apple 버튼이 Google 버튼보다 위에 위치 (Guideline 4.8 준수)
result: [pending — 소스 오더 스냅샷 테스트는 통과; 실기기 시각 확인 필요]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps

---
status: complete
phase: 04-highlights-notices-notifications-translation
source: [04-00-SUMMARY.md, 04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md, 04-04-SUMMARY.md, 04-05-SUMMARY.md]
started: 2026-03-22T00:00:00Z
updated: 2026-03-23T03:25:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Highlight 탭 섹션 표시
expected: 커뮤니티 메인 화면에서 Highlight 탭을 열면, 5개 섹션이 순서대로 표시됩니다: 공지사항, 크리에이터 게시물, 팬 게시물, 캘린더, 아티스트 멤버. 각 섹션에 헤더와 "더보기" 링크가 있고, 카드들이 가로 스크롤됩니다.
result: pass

### 2. Highlight 탭 로딩 상태
expected: Highlight 탭이 데이터를 로드하는 동안 스켈레톤 shimmer 애니메이션이 표시됩니다. 데이터가 없으면 빈 상태 메시지가 표시됩니다.
result: pass

### 3. 공지 목록 (모바일)
expected: 커뮤니티 내 공지 목록 화면에서 핀된 공지가 상단에 표시되며, 틸(#00E5C3) 색상의 2px 좌측 보더와 핀 표시가 보입니다. 일반 공지는 그 아래에 최신순으로 정렬됩니다.
result: pass

### 4. 공지 상세 (모바일)
expected: 공지를 탭하면 상세 화면으로 이동합니다. 제목, 날짜, 본문 텍스트, 이미지 갤러리(있는 경우)가 표시됩니다.
result: pass

### 5. Admin 공지 CRUD
expected: Admin 웹(Next.js)에서 공지 목록이 상태 배지와 함께 표시됩니다. 새 공지 생성(커뮤니티 선택, 이미지 업로드, 핀/예약 토글), 기존 공지 수정, 공지 삭제(확인 다이얼로그)가 모두 동작합니다.
result: pass

### 6. 알림 벨 배지
expected: 커뮤니티 메인 화면 헤더에 벨 아이콘이 표시됩니다. 미읽은 알림이 있으면 빨간색(#FF3B30) 원형 배지에 숫자가 표시됩니다. 미읽은 알림이 없으면 배지가 숨겨집니다.
result: issue
reported: "미읽은 알림 빨간색 원형배지 알림이 앱 홈탭에선 뜨는데 커뮤니티 내부에선 안뜸"
severity: major

### 7. 알림 목록 화면
expected: 벨 아이콘을 탭하면 알림 목록 화면으로 이동합니다. 알림이 시간별(오늘/어제/이번 주)로 그룹화되어 표시됩니다. 미읽 알림은 카드 배경에 틸 아이콘과 틸 점으로 구분됩니다.
result: issue
reported: "앱 홈탭에서 알림을 클릭하면 무한로딩됨"
severity: blocker

### 8. 알림 읽음 처리
expected: 알림을 탭하면 해당 알림이 읽음 처리되고 관련 게시물/공지로 이동합니다. 우측 상단 "모두 읽음" 버튼을 누르면 모든 알림이 읽음 처리됩니다.
result: issue
reported: "알림 텍스트를 눌러도 아무반응 없음. 모두 읽음 버튼을 누르면 전부 읽음 처리는 되는거같은데 어떤 반응이 없어서 사용자가 헷갈림"
severity: major

### 9. 알림 설정 화면
expected: 알림 설정 화면에서 4개의 스위치(크리에이터 게시물, 댓글, 좋아요, 공지)가 틸(#00E5C3) 트랙 색상으로 표시됩니다. 토글 변경 시 설정이 저장됩니다.
result: issue
reported: "알림 설정화면이 보이지 않음"
severity: major

### 10. 번역 버튼 및 번역 텍스트
expected: PostCard, CommentRow, ReplyRow에 틸 색상의 번역 아이콘 버튼이 표시됩니다. 탭하면 번역된 텍스트가 원문 아래에 구분선과 함께 표시되고 "번역됨 · Google Translate" 크레딧이 보입니다. 다시 탭하면 "원문 보기"로 토글됩니다.
result: issue
reported: "Translation failed. Please try again. 에러 — Edge Function translate가 500 Internal Server Error 반환"
severity: blocker

### 11. Highlight 독립 라우트
expected: "더보기" 링크를 탭하면 /(community)/[id]/highlight 라우트로 이동하며 실제 Highlight 콘텐츠가 표시됩니다 (플레이스홀더가 아님).
result: pass

## Summary

total: 11
passed: 6
issues: 5
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "커뮤니티 메인 화면 헤더에 벨 아이콘 배지가 미읽은 알림 수를 표시"
  status: failed
  reason: "User reported: 미읽은 알림 빨간색 원형배지 알림이 앱 홈탭에선 뜨는데 커뮤니티 내부에선 안뜸"
  severity: major
  test: 6
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "벨 아이콘 탭 시 알림 목록 화면으로 이동하고 시간별 그룹화된 알림 표시"
  status: failed
  reason: "User reported: 앱 홈탭에서 알림을 클릭하면 무한로딩됨"
  severity: blocker
  test: 7
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "알림 탭 시 읽음 처리 및 관련 콘텐츠로 이동, 모두 읽음 버튼 피드백"
  status: failed
  reason: "User reported: 알림 텍스트를 눌러도 아무반응 없음. 모두 읽음 버튼을 누르면 전부 읽음 처리는 되는거같은데 어떤 반응이 없어서 사용자가 헷갈림"
  severity: major
  test: 8
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "알림 설정 화면에서 4개의 스위치로 알림 타입별 on/off 제어"
  status: failed
  reason: "User reported: 알림 설정화면이 보이지 않음"
  severity: major
  test: 9
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "번역 버튼 탭 시 번역된 텍스트가 원문 아래에 표시"
  status: failed
  reason: "User reported: Translation failed. Please try again. 에러 — Edge Function translate가 500 Internal Server Error 반환"
  severity: blocker
  test: 10
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

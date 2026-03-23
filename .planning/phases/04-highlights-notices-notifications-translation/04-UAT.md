---
status: diagnosed
phase: 04-highlights-notices-notifications-translation
source: [04-00-SUMMARY.md, 04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md, 04-04-SUMMARY.md, 04-05-SUMMARY.md]
started: 2026-03-22T00:00:00Z
updated: 2026-03-23T03:30:00Z
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
  root_cause: "useUnreadNotificationCount가 community_id로 필터하지만, 테스트 데이터의 community_id가 NULL이라 항상 0 반환"
  artifacts:
    - path: "apps/mobile/hooks/notification/useUnreadNotificationCount.ts"
      issue: "community_id 필터가 NULL 데이터와 불일치"
    - path: "packages/supabase/migrations/20260320100000_phase4_push_tokens_community_id.sql"
      issue: "nullable community_id 추가 시 backfill 누락"
  missing:
    - "기존 notifications 데이터의 community_id backfill"
  debug_session: ".planning/debug/notification-badge-community.md"

- truth: "벨 아이콘 탭 시 알림 목록 화면으로 이동하고 시간별 그룹화된 알림 표시"
  status: failed
  reason: "User reported: 앱 홈탭에서 알림을 클릭하면 무한로딩됨"
  severity: blocker
  test: 7
  root_cause: "HomeNotificationBell이 /(community)/notifications로 이동 → Expo Router가 [id]=notifications로 해석 → 존재하지 않는 커뮤니티 조회 → 무한 로딩"
  artifacts:
    - path: "apps/mobile/app/(tabs)/index.tsx"
      issue: "line 24: 잘못된 네비게이션 경로 '/(community)/notifications'"
  missing:
    - "글로벌 알림 화면 라우트 생성 또는 홈탭 벨 네비게이션 경로 수정"
  debug_session: ".planning/debug/notification-list-loading.md"

- truth: "알림 탭 시 읽음 처리 및 관련 콘텐츠로 이동, 모두 읽음 버튼 피드백"
  status: failed
  reason: "User reported: 알림 텍스트를 눌러도 아무반응 없음. 모두 읽음 버튼을 누르면 전부 읽음 처리는 되는거같은데 어떤 반응이 없어서 사용자가 헷갈림"
  severity: major
  test: 8
  root_cause: "3가지: (1) useMarkNotificationRead query key가 useNotifications와 불일치 → 캐시 무효화 실패, (2) NotificationRow inline backgroundColor가 NativeWind 클래스 오버라이드, (3) 모두 읽음 버튼에 피드백 UI 없음"
  artifacts:
    - path: "apps/mobile/hooks/notification/useMarkNotificationRead.ts"
      issue: "query key 2세그먼트 vs useNotifications 3세그먼트 불일치"
    - path: "apps/mobile/components/notification/NotificationRow.tsx"
      issue: "line 58: inline backgroundColor가 항상 transparent → NativeWind 클래스 무효화"
    - path: "apps/mobile/app/(community)/[id]/notifications.tsx"
      issue: "markAllRead에 onSuccess 콜백/피드백 없음"
  missing:
    - "query key 통일 (userId 포함)"
    - "inline backgroundColor 제거"
    - "모두 읽음 성공 피드백 추가"
  debug_session: ".planning/debug/notification-tap-readall.md"

- truth: "알림 설정 화면에서 4개의 스위치로 알림 타입별 on/off 제어"
  status: failed
  reason: "User reported: 알림 설정화면이 보이지 않음"
  severity: major
  test: 9
  root_cause: "notification-preferences.tsx 화면은 구현되어 있지만, 앱 어디서도 이 라우트로 이동하는 버튼/링크가 없음 (orphaned route)"
  artifacts:
    - path: "apps/mobile/app/(community)/[id]/notifications.tsx"
      issue: "헤더에 설정 아이콘/버튼 누락"
    - path: "apps/mobile/app/(community)/[id]/notification-preferences.tsx"
      issue: "완전히 구현되어 있지만 접근 불가"
  missing:
    - "알림 목록 헤더에 설정 아이콘 추가 → notification-preferences 라우트로 이동"
  debug_session: ".planning/debug/notification-settings-missing.md"

- truth: "번역 버튼 탭 시 번역된 텍스트가 원문 아래에 표시"
  status: failed
  reason: "User reported: Translation failed. Please try again. 에러 — Edge Function translate가 500 Internal Server Error 반환"
  severity: blocker
  test: 10
  root_cause: "GOOGLE_TRANSLATE_API_KEY Supabase secret이 원격 프로젝트에 설정되지 않음 — 코드 문제 아님, 배포 설정 누락"
  artifacts:
    - path: "packages/supabase/functions/translate/index.ts"
      issue: "line 57-63: API 키 없으면 500 반환 (의도된 동작)"
  missing:
    - "Google Cloud Translation API 키 생성 및 supabase secrets set으로 등록"
  debug_session: ".planning/debug/translate-edge-function-500.md"

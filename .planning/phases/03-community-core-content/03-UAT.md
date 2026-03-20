---
status: resolved
phase: 03-community-core-content
source: 03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md
started: 2026-03-20T04:00:00Z
updated: 2026-03-20T06:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Community Search
expected: 커뮤니티 탭을 탭하면 검색 화면이 표시된다. 검색어를 입력하면 커뮤니티가 2열 그리드 형태로 표시된다.
result: issue
reported: "커뮤니티 탭이 보이지 않음"
severity: major

### 2. Community Preview
expected: 검색 결과에서 커뮤니티 카드를 탭하면 미리보기 시트가 올라온다. 멤버 수, 최근 게시글, 아티스트 썸네일 등 정보가 표시된다.
result: skipped
reason: 커뮤니티 탭 진입 불가 (Test 1 blocker)

### 3. Join Community
expected: 미리보기에서 가입 버튼을 누르면 자동 생성된 닉네임(User#XXXX 형태)과 함께 가입 화면이 표시된다. 가입 완료 후 커뮤니티 메인 화면으로 이동한다.
result: skipped
reason: 커뮤니티 탭 진입 불가 (Test 1 blocker)

### 4. Community Main Screen (3-Tab Shell)
expected: 가입된 커뮤니티에 진입하면 Fan / Artist / Highlight 3개 탭이 상단에 표시된다. 각 탭을 탭하면 해당 화면으로 전환된다.
result: skipped
reason: 커뮤니티 탭 진입 불가 (Test 1 blocker)

### 5. Nickname Edit
expected: 커뮤니티 설정에서 닉네임 변경 화면에 진입할 수 있다. 새 닉네임을 입력하고 저장하면 변경된다.
result: skipped
reason: 커뮤니티 탭 진입 불가 (Test 1 blocker)

### 6. Fan Feed with Infinite Scroll
expected: Fan 탭에서 게시글 목록이 표시된다. 아래로 스크롤하면 추가 게시글이 로딩된다. 위로 당기면 새로고침된다. 게시글이 없으면 빈 상태 메시지가 표시된다.
result: skipped
reason: 커뮤니티 탭 진입 불가 (Test 1 blocker)

### 7. Sort & Filter Chips
expected: Fan 피드 상단에 정렬(최신/인기)과 필터(전체/팔로잉/핫) 칩이 표시된다. 칩을 탭하면 피드가 해당 조건으로 갱신된다.
result: skipped
reason: 커뮤니티 탭 진입 불가 (Test 1 blocker)

### 8. Create Post
expected: Fan 피드 하단 우측에 FAB(글쓰기) 버튼이 표시된다. 탭하면 글 작성 화면으로 이동한다. 텍스트를 입력하고 이미지를 첨부(최대 10장)한 후 게시하면 피드에 새 글이 나타난다.
result: skipped
reason: 커뮤니티 탭 진입 불가 (Test 1 blocker)

### 9. Post Detail & Delete
expected: 게시글을 탭하면 상세 화면이 표시된다(전체 본문, 미디어, 작성자 정보). 자신의 글이면 삭제 버튼이 표시되고, 삭제 확인 다이얼로그 후 삭제된다.
result: skipped
reason: 커뮤니티 탭 진입 불가 (Test 1 blocker)

### 10. Artist Tab & Creator Feed
expected: Artist 탭에서는 크리에이터(아티스트) 역할의 게시글만 표시된다. 일반 팬 게시글은 보이지 않는다.
result: skipped
reason: 커뮤니티 탭 진입 불가 (Test 1 blocker)

### 11. Artist Member Scroll
expected: 그룹 커뮤니티의 Artist 탭 상단에 아티스트 멤버 원형 아바타가 가로 스크롤로 표시된다. 멤버를 선택하면 해당 멤버의 게시글만 필터링된다. 선택된 멤버는 틸 컬러 테두리로 강조된다.
result: skipped
reason: 커뮤니티 탭 진입 불가 (Test 1 blocker)

### 12. Like Post
expected: 게시글의 하트 버튼을 탭하면 좋아요가 토글된다. 좋아요 시 하트가 틸 색으로 채워지고 스프링 스케일 애니메이션(커졌다 작아짐)이 재생된다. 좋아요 수가 즉시 반영된다.
result: skipped
reason: 커뮤니티 탭 진입 불가 (Test 1 blocker)

### 13. Comment on Post
expected: 게시글 상세 화면 하단에 댓글 입력 바가 있다. 댓글을 작성하고 전송하면 댓글 목록에 즉시 나타난다. 작성자 닉네임과 시간이 표시된다. 크리에이터 댓글은 틸 색으로 강조된다.
result: skipped
reason: 커뮤니티 탭 진입 불가 (Test 1 blocker)

### 14. Reply to Comment
expected: 댓글의 "답글" 버튼을 탭하면 "@닉네임에게 답글 중" 표시와 함께 답글 모드가 활성화된다. 답글을 작성하면 부모 댓글 아래에 들여쓰기되어 표시된다.
result: skipped
reason: 커뮤니티 탭 진입 불가 (Test 1 blocker)

### 15. Delete Own Comment
expected: 자신의 댓글에 삭제 버튼이 표시된다. 탭하면 확인 다이얼로그가 뜨고, 확인 시 댓글이 삭제된다.
result: skipped
reason: 커뮤니티 탭 진입 불가 (Test 1 blocker)

### 16. Leave Community
expected: 커뮤니티 설정에서 나가기를 선택하면 확인 다이얼로그가 표시된다. 확인하면 커뮤니티를 탈퇴하고 검색 화면으로 돌아간다.
result: skipped
reason: 커뮤니티 탭 진입 불가 (Test 1 blocker)

## Summary

total: 16
passed: 0
issues: 1
pending: 0
skipped: 15

## Gaps

- truth: "커뮤니티 탭을 탭하면 검색 화면이 표시된다"
  status: resolved
  reason: "User reported: 커뮤니티 탭이 보이지 않음"
  severity: major
  test: 1
  root_cause: "Tabs.Screen name='community'에 매칭되는 파일이 (tabs)/ 디렉토리에 없음. (community) 그룹은 루트 Stack의 별도 세그먼트로 존재하여 탭으로 참조 불가. Expo Router가 매칭 파일 없는 탭을 자동 제거함."
  artifacts:
    - path: "apps/mobile/app/(tabs)/_layout.tsx"
      issue: "Tabs.Screen name='community' 정의되어 있으나 매칭 파일 없음"
    - path: "apps/mobile/app/(community)/"
      issue: "탭 내부가 아닌 루트 레벨 별도 라우트 그룹"
  missing:
    - "apps/mobile/app/(tabs)/community.tsx 프록시 파일 생성 (Redirect to /(community)/search)"
  debug_session: ".planning/debug/community-tab-not-visible.md"

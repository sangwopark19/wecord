---
status: resolved
phase: 03-community-core-content
source: 03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md, 03-05-SUMMARY.md
started: 2026-03-20T10:00:00Z
updated: 2026-03-20T16:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Community Tab 진입
expected: 하단 탭 바에 Community 탭이 표시된다. 탭하면 커뮤니티 검색 화면으로 이동한다.
result: pass

### 2. Community 검색
expected: 검색 화면에서 검색어를 입력하면 커뮤니티가 2열 그리드 형태로 표시된다.
result: issue
reported: "웹에서는 검은색 큰 사각형으로밖에 안보인다. 모바일에서는 1열 그리드 형태로 보이는거 같다"
severity: major

### 3. Community 미리보기
expected: 검색 결과에서 커뮤니티 카드를 탭하면 미리보기 시트가 올라온다. 멤버 수, 최근 게시글, 아티스트 썸네일 등 정보가 표시된다.
result: issue
reported: "기본아바타가 보이지 않는다 (아티스트 이미지 없을 때 fallback 없음)"
severity: minor

### 4. Community 가입
expected: 미리보기에서 가입 버튼을 누르면 자동 생성된 닉네임(User#XXXX 형태)과 함께 가입 화면이 표시된다. 가입 완료 후 커뮤니티 메인 화면으로 이동한다.
result: issue
reported: "모바일에선 오류가 발생하고 웹, 안드로이드에선 가입눌러도 아무런 반응이 없음. 가입도 안되고 커뮤니티 메인 진입 경로도 안됨"
severity: blocker

### 5. Community 메인 화면 (3-Tab Shell)
expected: 가입된 커뮤니티에 진입하면 Fan / Artist / Highlight 3개 탭이 상단에 표시된다. 각 탭을 탭하면 해당 화면으로 전환된다.
result: skipped
reason: 커뮤니티 진입 불가 (Test 4 blocker)

### 6. 닉네임 변경
expected: 커뮤니티 설정에서 닉네임 변경 화면에 진입할 수 있다. 새 닉네임을 입력하고 저장하면 변경된다.
result: skipped
reason: 커뮤니티 진입 불가 (Test 4 blocker)

### 7. Fan Feed 무한 스크롤
expected: Fan 탭에서 게시글 목록이 FlashList로 표시된다. 아래로 스크롤하면 추가 게시글이 로딩된다. 위로 당기면 새로고침된다. 게시글이 없으면 빈 상태 메시지가 표시된다.
result: skipped
reason: 커뮤니티 진입 불가 (Test 4 blocker)

### 8. 정렬/필터 칩
expected: Fan 피드 상단에 정렬(최신/인기)과 필터(전체/팔로잉/핫) 칩이 표시된다. 칩을 탭하면 피드가 해당 조건으로 갱신된다.
result: skipped
reason: 커뮤니티 진입 불가 (Test 4 blocker)

### 9. 게시글 작성
expected: Fan 피드 하단 우측에 FAB(글쓰기) 버튼이 표시된다. 탭하면 글 작성 화면으로 이동한다. 텍스트를 입력하고 이미지를 첨부(최대 10장)한 후 게시하면 피드에 새 글이 나타난다.
result: skipped
reason: 커뮤니티 진입 불가 (Test 4 blocker)

### 10. 게시글 상세 & 삭제
expected: 게시글을 탭하면 상세 화면이 표시된다(전체 본문, 미디어, 작성자 정보). 자신의 글이면 삭제 버튼이 표시되고, 삭제 확인 다이얼로그 후 삭제된다.
result: skipped
reason: 커뮤니티 진입 불가 (Test 4 blocker)

### 11. Artist 탭 크리에이터 피드
expected: Artist 탭에서는 크리에이터(아티스트) 역할의 게시글만 표시된다. 일반 팬 게시글은 보이지 않는다.
result: skipped
reason: 커뮤니티 진입 불가 (Test 4 blocker)

### 12. Artist 멤버 스크롤
expected: 그룹 커뮤니티의 Artist 탭 상단에 아티스트 멤버 원형 아바타가 가로 스크롤로 표시된다. 멤버를 선택하면 해당 멤버의 게시글만 필터링된다. 선택된 멤버는 틸 컬러 테두리로 강조된다.
result: skipped
reason: 커뮤니티 진입 불가 (Test 4 blocker)

### 13. 좋아요
expected: 게시글의 하트 버튼을 탭하면 좋아요가 토글된다. 좋아요 시 하트가 틸 색으로 채워지고 스프링 스케일 애니메이션(커졌다 작아짐)이 재생된다. 좋아요 수가 즉시 반영된다.
result: skipped
reason: 커뮤니티 진입 불가 (Test 4 blocker)

### 14. 댓글 작성
expected: 게시글 상세 화면 하단에 댓글 입력 바가 있다. 댓글을 작성하고 전송하면 댓글 목록에 즉시 나타난다. 작성자 닉네임과 시간이 표시된다. 크리에이터 댓글은 틸 색으로 강조된다.
result: skipped
reason: 커뮤니티 진입 불가 (Test 4 blocker)

### 15. 답글
expected: 댓글의 "답글" 버튼을 탭하면 "@닉네임에게 답글 중" 표시와 함께 답글 모드가 활성화된다. 답글을 작성하면 부모 댓글 아래에 들여쓰기되어 표시된다.
result: skipped
reason: 커뮤니티 진입 불가 (Test 4 blocker)

### 16. 댓글 삭제
expected: 자신의 댓글에 삭제 버튼이 표시된다. 탭하면 확인 다이얼로그가 뜨고, 확인 시 댓글이 삭제된다.
result: skipped
reason: 커뮤니티 진입 불가 (Test 4 blocker)

### 17. 커뮤니티 탈퇴
expected: 커뮤니티 설정에서 나가기를 선택하면 확인 다이얼로그가 표시된다. 확인하면 커뮤니티를 탈퇴하고 검색 화면으로 돌아간다.
result: skipped
reason: 커뮤니티 진입 불가 (Test 4 blocker)

## Summary

total: 17
passed: 1
issues: 3
pending: 0
skipped: 13

## Gaps

- truth: "검색 화면에서 커뮤니티가 2열 그리드 형태로 표시된다"
  status: resolved
  reason: "User reported: 웹에서는 검은색 큰 사각형으로밖에 안보인다. 모바일에서는 1열 그리드 형태로 보이는거 같다"
  severity: major
  test: 2
  root_cause: "1) renderItem wrapper uses flex-1 without width constraint — FlatList numColumns=2 requires width:'50%'. 2) CommunityCard passes {uri: undefined} to expo-image when cover_image_url is null — renders black box on web."
  artifacts:
    - path: "apps/mobile/app/(community)/search.tsx"
      issue: "renderItem wrapper needs style={{ width: '50%' }} instead of className='flex-1'"
    - path: "apps/mobile/components/community/CommunityCard.tsx"
      issue: "Image source needs null-guard — shows black box when cover_image_url is null"
  missing:
    - "Add width:'50%' to renderItem wrapper in search.tsx"
    - "Add fallback placeholder view when cover_image_url is null in CommunityCard"
  debug_session: ".planning/debug/community-search-grid-layout.md"

- truth: "아티스트 이미지 없을 때 기본 아바타가 표시된다"
  status: resolved
  reason: "User reported: 기본아바타가 보이지 않는다 (아티스트 이미지 없을 때 fallback 없음)"
  severity: minor
  test: 3
  root_cause: "CommunityPreviewSheet.tsx passes {uri: undefined} to expo-image when profile_image_url is null. No conditional check, no fallback view. ArtistMemberScroll.tsx already has the correct pattern (person-outline Ionicons icon)."
  artifacts:
    - path: "apps/mobile/components/community/CommunityPreviewSheet.tsx"
      issue: "Lines 108-117: Missing fallback for null profile_image_url"
  missing:
    - "Add ternary conditional mirroring ArtistMemberScroll pattern — show Ionicons person-outline when URL is null"
  debug_session: ".planning/debug/artist-avatar-fallback-missing.md"

- truth: "가입 버튼을 누르면 가입 화면이 표시되고 가입 완료 후 커뮤니티 메인으로 이동한다"
  status: resolved
  reason: "User reported: 모바일에선 오류가 발생하고 웹, 안드로이드에선 가입눌러도 아무런 반응이 없음. 가입도 안되고 커뮤니티 메인 진입 경로도 안됨"
  severity: blocker
  test: 4
  root_cause: "1) generate-nickname Edge Function does not exist — supabase.functions.invoke throws network error. 2) join.tsx loadNickname has try/finally without catch — unhandled rejection crashes iOS, on web/android nickname stays empty disabling submit. 3) CommunityCard always navigates to preview regardless of membership — no direct path to community main for existing members. 4) 23505 handler treats all unique violations as nickname collisions, but re-join hits (user_id, community_id) constraint."
  artifacts:
    - path: "apps/mobile/hooks/community/useJoinCommunity.ts"
      issue: "Line 11: calls non-existent generate-nickname Edge Function"
    - path: "apps/mobile/app/(community)/[id]/join.tsx"
      issue: "Lines 33-44: try/finally without catch — unhandled promise rejection"
    - path: "apps/mobile/components/community/CommunityCard.tsx"
      issue: "Line 17: always navigates to preview, no membership-aware routing"
    - path: "apps/mobile/hooks/community/useJoinCommunity.ts"
      issue: "Lines 39-55: 23505 handler doesn't distinguish constraint sources"
  missing:
    - "Add catch block in join.tsx with local nickname fallback (User#XXXX)"
    - "Add membership-aware navigation in CommunityCard — go to main if already member"
    - "Distinguish 23505 constraint sources in useJoinCommunity"
    - "Create generate-nickname Edge Function or implement local fallback"
  debug_session: ".planning/debug/community-join-and-navigation.md"

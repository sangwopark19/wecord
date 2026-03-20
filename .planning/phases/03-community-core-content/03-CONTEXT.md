# Phase 3: Community & Core Content - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

커뮤니티 탐색/검색, 가입(커뮤니티별 페르소나), 팬/크리에이터 피드, 댓글(1-depth 대댓글), 좋아요를 구현한다. 커뮤니티 메인 화면에 Fan/Artist/Highlight 3탭 구조를 갖추되 Highlight는 Phase 4에서 콘텐츠 채움. 알림, 번역, 홈 피드, 검색은 이후 Phase 범위.

</domain>

<decisions>
## Implementation Decisions

### 커뮤니티 탐색/검색
- 검색 결과: 카드 그리드 (2열) — 커버 이미지 + 이름 + 멤버 수
- pg_textsearch로 커뮤니티 이름/키워드 검색
- 커뮤니티 프리뷰(가입 전): 커버 + 이름 + 설명, 멤버 수 + 카테고리(BL/GL 등), 최근 게시글 미리보기 2-3개, 그룹 커뮤니티는 아티스트 멤버 프로필 썸네일 표시

### 커뮤니티 가입 & 닉네임
- 가입 시 닉네임: User#XXXX 형태 자동생성 후 가입 화면에서 바로 수정 가능
- 온보딩 큐레이션 자동가입과 동일한 자동생성 패턴 유지 (Phase 2 결정)
- 가입 후 설정에서 닉네임 변경 가능 (COMM-04)
- 탈퇴: 확인 대화상자 후 처리

### 커뮤니티 메인 화면 (가입 후)
- 탭 구성: Fan / Artist / Highlight 3탭
- Highlight 탭은 Phase 3에서 placeholder (Phase 4에서 콘텐츠 구현)
- 솔로 커뮤니티: Artist 탭에 아티스트 멤버 리스트 없이 크리에이터 게시글만 표시
- 그룹 커뮤니티: Artist 탭 상단에 가로 스크롤 멤버 프로필 (원형 아이콘), 탭하면 해당 멤버 게시글 필터링

### 팬 피드 레이아웃
- 포스트 카드: 아바타 + 커뮤니티 닉네임 + 상대시간 + 본문 텍스트 + 미디어 프리뷰 + 좋아요/댓글 카운트
- 이미지 다중 표시: 그리드 레이아웃 (1장: 풀사이즈, 2장: 1:1 좌우, 3장: 1+2 그리드, 4장+: 2x2 그리드 + 나머지 수 표시)
- 정렬/필터: Fan/Artist/Highlight 탭 바로 아래에 칩 바 — 정렬(최신/인기) + 필터(전체/팔로잉/핫)
- FlashList + useInfiniteQuery + cursor-based pagination (ROADMAP 지정)

### 크리에이터 포스트 구분
- 닉네임 옆 'Creator' 뱃지만으로 구분 (배경색 차별화 없음, 카드 디자인 동일)
- Artist 탭에서는 크리에이터 게시글만 표시 (RLS + author_role='creator' 필터)

### 포스트 작성
- FAB(+) 버튼 탭 → 풀스크린 모달로 바로 작성 화면 이동 (액션 시트 없음)
- 작성 화면: 상단(X + "새 글 쓰기" + 발행 버튼), 커뮤니티 닉네임 표시, 텍스트 입력 영역, 하단 미디어 추가 버튼
- 이미지 최대 10장, 영상 최대 1개 (동시 불가 — 스키마 제약)
- 선택한 미디어: 작성창 내 썸네일 그리드로 미리보기, X 버튼으로 개별 삭제, 드래그로 순서 변경
- Supabase Storage에 업로드

### 댓글 표시
- 인라인 들여쓰기: 대댓글은 원댓글 아래 들여쓰기로 표시
- 각 댓글: 아바타 + 커뮤니티 닉네임 + 상대시간 + 내용 + 좋아요 수 + 답글 버튼
- 커뮤니티 닉네임으로만 표시 (posts_with_nickname 뷰 패턴과 동일하게 페르소나 격리)

### 크리에이터 답글 하이라이트
- 닉네임 Teal 색상 + 'Creator' 뱃지 (배경색 변경 없음)
- 팬 포스트의 크리에이터 구분과 동일한 뱃지 스타일 — 일관성 유지

### 좋아요 인터랙션
- 하트 아이콘 탭 → 색상 채움 + 살짝 커짐 (scale bounce) 애니메이션
- 낙관적 업데이트: UI 즉시 토글 후 서버 반영

### 삭제 확인
- 게시글/댓글 삭제 시 확인 대화상자 ("정말 삭제하시겠습니까? 삭제된 글은 복구할 수 없습니다.")
- 취소/삭제 버튼

### Claude's Discretion
- FlashList 최적화 전략 (estimatedItemSize, getItemType 등)
- 이미지/영상 압축 전략 및 Supabase Storage 버킷 구성
- 커서 페이지네이션 구현 상세 (cursor 필드, 페이지 크기)
- 빈 상태(Empty State) 화면 디자인
- 에러 상태 UI (네트워크 오류, 업로드 실패 등)
- pull-to-refresh 구현
- 포스트/댓글 입력 시 글자 수 제한 정책
- FAB 위치 및 스타일 상세

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 아키텍처 & 데이터 모델
- `docs/ARCHITECTURE.md` — ERD(§4), posts_with_nickname 뷰(§4.3), RLS 정책(§6), API 엔드포인트(§5), 인덱스 전략(§4.4)
- `docs/PRD.md` — 커뮤니티 기능 요구사항, 팬/크리에이터 피드 정의, 페르소나 구조

### UI/UX 가이드
- `docs/WEVERSE-UI-UX-GUIDE.md` — Weverse 기반 UI/UX 패턴, 커뮤니티 화면 구성, 다크 테마 가이드라인

### 프로젝트 계획
- `.planning/PROJECT.md` — 기술 스택, 제약조건, 핵심 결정사항
- `.planning/REQUIREMENTS.md` — COMM-01~07, MEMB-01~04, FANF-01~08, CREF-01~04, INTC-01~06 요구사항 상세
- `.planning/ROADMAP.md` — Phase 3 성공 기준, 플랜 구성(03-01~04)

### 이전 Phase 컨텍스트
- `.planning/phases/01-foundation/01-CONTEXT.md` — RLS 패턴, i18n 구조, 스키마 범위
- `.planning/phases/02-auth-onboarding/02-CONTEXT.md` — 닉네임 자동생성 패턴(User#XXXX), 세션 관리, Zustand authStore

### 주의사항
- `.planning/STATE.md` — posts_with_nickname 뷰 필수 사용 결정, Nativewind v4 호환성 경고

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/db/src/schema/community.ts` — communities, communityMembers 테이블 + RLS 정의 완료
- `packages/db/src/schema/content.ts` — posts, comments, likes 테이블 + postsWithNicknameViewSql 뷰 정의 완료
- `packages/db/src/schema/artist-member.ts` — artistMembers 테이블 + RLS 정의 완료
- `packages/db/src/schema/follow.ts` — community_follows 테이블 정의 완료
- `apps/mobile/lib/supabase.ts` — Supabase 클라이언트 (SSR-safe storage adapter)
- `apps/mobile/lib/queryClient.ts` — TanStack Query 클라이언트 설정 완료
- `apps/mobile/stores/authStore.ts` — Zustand authStore (세션, 프로필 관리)
- `apps/mobile/hooks/useAuth.ts` — 인증 훅
- `apps/mobile/components/PrimaryCTAButton.tsx` — 재사용 가능한 CTA 버튼 컴포넌트
- `packages/supabase/functions/generate-nickname/` — 닉네임 자동생성 Edge Function

### Established Patterns
- RLS: `(select auth.uid())` 래퍼 패턴 — 모든 테이블에 적용
- 스타일링: Nativewind v4 + Tailwind CSS 클래스
- 다크 테마: bg-background (#000000), 카드 #1A1A1A, 액센트 Teal #00E5C3
- 서버 상태: TanStack Query v5 (useQuery, useInfiniteQuery)
- 클라이언트 상태: Zustand v5
- i18n: `initI18n()` 함수 패턴 — 네임스페이스별 번역 키 추가
- 라우팅: expo-router v7 file-based routing ((auth), (onboarding), (tabs) 그룹)

### Integration Points
- `apps/mobile/app/(tabs)/_layout.tsx` — 현재 Home 탭만 존재. 커뮤니티 라우트 추가 필요
- `apps/mobile/app/(tabs)/index.tsx` — 홈 화면 (Phase 5에서 피드 구현, Phase 3에서는 커뮤니티 진입점)
- `packages/supabase/functions/` — Edge Function 디렉토리 (커뮤니티 관련 함수 추가 가능)
- Supabase Storage — 이미지/영상 업로드용 버킷 설정 필요

</code_context>

<specifics>
## Specific Ideas

- 커뮤니티 검색은 Weverse 스타일 2열 카드 그리드
- 커뮤니티 메인 화면은 Weverse Fan/Artist/Highlight 3탭 구조 그대로 따름
- 아티스트 멤버 리스트는 Weverse 스타일 상단 가로 스크롤 원형 프로필
- 이미지 다중 표시는 Instagram/Weverse 스타일 그리드 레이아웃
- 크리에이터 구분은 뱃지만으로 최소한 — 배경색 차별화 없이 깔끔하게
- 포스트 작성은 풀스크린 모달 — FAB 탭하면 바로 이동

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-community-core-content*
*Context gathered: 2026-03-20*

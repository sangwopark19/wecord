# Phase 5: Home Feed, Search & Community Social - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

가입 0개 유저에게 크리에이터 추천 화면, 가입 1+개 유저에게 크로스 커뮤니티 통합 피드, 프로모션 배너 캐러셀을 제공한다. 홈에서 커뮤니티/크리에이터 검색, 커뮤니티 내 게시글 full-text 검색을 구현한다. 커뮤니티 내 팔로잉/팔로워 시스템과 커뮤니티 프로필 페이지를 구현한다. 콘텐츠 모더레이션/신고는 Phase 6, 더보기 탭은 Phase 7 범위.

</domain>

<decisions>
## Implementation Decisions

### 홈 피드 — 0-커뮤니티 (추천 화면)
- Weverse 스타일 2열 카드 그리드 — 커버 이미지 + 커뮤니티명 + 멤버 수
- Phase 3 커뮤니티 검색과 동일한 카드 패턴 재활용
- 상단에 검색 입력 필드 (탭하면 검색 화면 전환) — SRCH-01 진입점
- 검색바 아래에 프로모션 배너 캐러셀 표시
- 그 아래 '인기 크리에이터를 만나보세요!' 섹션 + 2열 카드 그리드

### 홈 피드 — 1+-커뮤니티 (통합 피드)
- 모든 가입 커뮤니티의 포스트를 시간순(최신순)으로 통합 정렬 — 필터/정렬 옵션 없음 (MVP)
- 각 포스트 카드 상단에 커뮤니티 아이콘 + 이름 칩 표시 — 탭하면 해당 커뮤니티로 이동 (HOME-03)
- 기존 PostCard 컴포넌트를 확장하여 커뮤니티 칩 영역 추가
- FlashList + useInfiniteQuery + cursor-based pagination (Phase 3 패턴 재사용)
- 피드 상단에 프로모션 배너 캐러셀 표시
- `home-feed` Edge Function에서 크로스 커뮤니티 머지 쿼리 처리

### 홈 헤더
- Wecord 로고 + 알림 벨(뱃지) — HOME-04 요구사항 그대로
- 추가 요소 없음 (검색은 0-커뮤니티 화면 본문에 검색바로 배치)

### 프로모션 배너 캐러셀
- 피드 상단에 배치 (0-커뮤니티: 검색바 아래, 1+-커뮤니티: 피드 최상단)
- 3초 간격 자동 스크롤 + 수동 스와이프 가능
- 하단 도트 인디케이터
- 배너 탭 시 딥링크 — 커뮤니티 이동, 외부 링크, 또는 앱 내 화면으로 라우팅
- 관리자에서 배너 CRUD (이미지 URL + 딥링크 URL + 순서 + 활성/비활성)
- promotion_banners 테이블 필요 (DB 스키마에 아직 없음 — 마이그레이션 추가)

### 검색 — 홈 커뮤니티/크리에이터 검색 (SRCH-01)
- 0-커뮤니티 추천 화면 상단 검색바에서 진입
- 1+-커뮤니티 통합 피드에서는 스크롤 시 헤더 숨김 + pull down으로 검색 노출
- Phase 3 커뮤니티 검색 화면 재활용 (pg_textsearch)
- 검색 결과: 2열 카드 그리드 (Phase 3과 동일)

### 검색 — 커뮤니티 내 게시글 검색 (SRCH-02)
- Fan/Artist 탭 상단에 검색 아이콘 추가 — 탭하면 해당 탭 내 게시글 full-text 검색
- pg_textsearch로 게시글 본문 검색
- 검색 결과는 기존 PostCard 형태로 표시

### 키워드 하이라이팅 (SRCH-03)
- 매칭된 키워드를 Teal(#00E5C3) 색상으로 강조 표시
- 앱 액센트 컬러와 일관성 유지

### 커뮤니티 프로필 (FLLW-03)
- 진입점: 포스트/댓글의 닉네임/아바타 탭 → 해당 유저의 커뮤니티 프로필 화면으로 이동
- 상단: 아바타 + 커뮤니티 닉네임 + 게시글 수 / 팔로워 수 / 팔로잉 수 + 팔로우 버튼
- 하단: 게시글 / 댓글 탭으로 구분 — 게시글 탭은 해당 유저의 포스트 리스트 (FlashList), 댓글 탭은 해당 유저의 댓글 리스트
- 본인 프로필에서는 팔로우 버튼 대신 프로필 편집(또는 미표시)

### 팔로우/언팔로우 (FLLW-01, FLLW-04)
- 커뮤니티 프로필 페이지의 '팔로우' 버튼으로 팔로우/언팔로우 토글
- 같은 커뮤니티 멤버만 팔로우 가능 (RLS 이미 구현 — community_follows 테이블)
- 포스트 카드에서는 팔로우 버튼 없음 — 프로필 진입 후 팔로우

### 팔로워/팔로잉 리스트 (FLLW-02)
- 프로필 상단의 팔로워/팔로잉 수 탭하면 리스트 화면 이동
- 각 항목: 아바타 + 커뮤니티 닉네임 + 팔로우/언팔로우 버튼
- 닉네임 탭하면 해당 유저 프로필로 이동

### Claude's Discretion
- `home-feed` Edge Function 쿼리 최적화 (크로스 커뮤니티 머지 전략, N+1 방지)
- 프로모션 배너 캐러셀 자동 스크롤 구현 (FlatList vs ScrollView)
- 검색 디바운스 간격 및 최소 글자 수
- 빈 상태 UI (검색 결과 없음, 팔로워 없음 등)
- 에러 상태 핸들링
- pull-to-refresh 구현
- 커뮤니티 프로필 로딩 스켈레톤
- 통합 피드에서 검색 노출 시 헤더 애니메이션

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 아키텍처 & 데이터 모델
- `docs/ARCHITECTURE.md` — ERD(§4), Edge Function 스펙(§5: home-feed), pg_textsearch 설정, community_follows 테이블, posts_with_nickname 뷰(§4.3)
- `docs/PRD.md` — 홈 피드 요구사항, 검색 기능 정의, 커뮤니티 팔로잉 정의

### UI/UX 가이드
- `docs/WEVERSE-UI-UX-GUIDE.md` — Weverse 홈 화면 패턴, 검색 UI, 프로필 페이지 구성

### 스키마
- `packages/db/src/schema/follow.ts` — community_follows 테이블 + RLS 정의 완료
- `packages/db/src/schema/content.ts` — posts, postsWithNicknameViewSql 뷰
- `packages/db/src/schema/community.ts` — communities, communityMembers 테이블

### 프로젝트 계획
- `.planning/PROJECT.md` — 기술 스택, 제약조건, 핵심 결정사항
- `.planning/REQUIREMENTS.md` — HOME-01~05, SRCH-01~03, FLLW-01~04 요구사항 상세
- `.planning/ROADMAP.md` — Phase 5 성공 기준 5개, 플랜 구성(05-01~02)

### 이전 Phase 컨텍스트
- `.planning/phases/03-community-core-content/03-CONTEXT.md` — PostCard 패턴, 커뮤니티 검색 2열 카드 그리드, Fan/Artist/Highlight 3탭 구조, FlashList + cursor pagination 패턴
- `.planning/phases/04-highlights-notices-notifications-translation/04-CONTEXT.md` — 알림 벨 뱃지 구현, Highlight 탭 가로 스크롤 카드 패턴

### 주의사항
- `.planning/STATE.md` — posts_with_nickname 뷰 필수 사용, Nativewind v4 호환성

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/mobile/components/post/PostCard.tsx` — 기존 포스트 카드. 통합 피드용 커뮤니티 칩 영역 추가하여 확장
- `apps/mobile/components/community/CommunityCard.tsx` — 커뮤니티 카드 (2열 그리드용). 0-커뮤니티 추천에 재활용
- `apps/mobile/hooks/community/useJoinCommunity.ts` — 커뮤니티 가입 훅
- `apps/mobile/hooks/post/useCreatePost.ts` — 포스트 생성 훅 패턴 참조
- `apps/mobile/components/notification/` — 알림 관련 컴포넌트 (벨 아이콘 뱃지)
- `packages/db/src/schema/follow.ts` — community_follows 테이블 + RLS 완전 구현
- `packages/supabase/functions/` — Edge Function 패턴 참조 (highlight, notify, translate)
- `apps/mobile/lib/supabase.ts` — Supabase 클라이언트
- `apps/mobile/lib/queryClient.ts` — TanStack Query 클라이언트

### Established Patterns
- FlashList + useInfiniteQuery + cursor-based pagination — 피드 구현 표준 패턴
- posts_with_nickname 뷰 — 페르소나 격리 필수 (통합 피드에서도 적용)
- RLS: `(select auth.uid())` 래퍼 패턴
- 다크 테마: bg-background (#000000), 카드 #1A1A1A, 액센트 Teal #00E5C3
- Creator 뱃지 — 닉네임 옆 Teal 'Creator' 뱃지 (Phase 3 결정)
- pg_textsearch — 커뮤니티 검색에 이미 사용 중

### Integration Points
- `apps/mobile/app/(tabs)/index.tsx` — 현재 placeholder. 홈 피드 화면으로 교체
- `apps/mobile/app/(tabs)/_layout.tsx` — Home, Community 탭만 존재. 변경 불필요 (홈은 index.tsx)
- `apps/mobile/app/(community)/[id]/` — 커뮤니티 메인 화면. Fan/Artist 탭에 검색 아이콘 추가
- `packages/supabase/functions/` — home-feed Edge Function 추가
- promotion_banners 테이블 — DB 스키마에 아직 없음, 마이그레이션 추가 필요

</code_context>

<specifics>
## Specific Ideas

- 0-커뮤니티 추천 화면은 Phase 3 커뮤니티 검색의 2열 카드 그리드 패턴 그대로 재활용
- 통합 피드는 Instagram 스타일 — 시간순 스크롤 + 커뮤니티 칩으로 출처 표시
- 프로모션 배너는 Weverse/Instagram 스타일 자동 스크롤 캐러셀
- 커뮤니티 프로필은 Instagram 프로필 페이지 참조 — 상단 정보 + 하단 게시글/댓글 탭
- 검색 하이라이팅은 앱 액센트 컬러(Teal)로 통일

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-home-feed-search-community-social*
*Context gathered: 2026-03-21*

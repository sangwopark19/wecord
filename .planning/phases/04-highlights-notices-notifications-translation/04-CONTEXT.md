# Phase 4: Highlights, Notices, Notifications & Translation - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

유저가 Highlight 탭(5개 섹션 집합), 관리자 공지사항, 푸시 알림으로 커뮤니티 활동 정보를 받고, 게시글/댓글을 선호 언어로 번역해 읽을 수 있게 한다. 홈 피드, 검색, 커뮤니티 팔로잉은 Phase 5 범위. 콘텐츠 모더레이션/신고는 Phase 6 범위.

</domain>

<decisions>
## Implementation Decisions

### Highlight 탭 레이아웃
- Weverse 스타일 세로 스크롤 + 섹션별 가로 스크롤 카드 리스트
- 5개 섹션 순서: 고정 공지 → 캘린더(placeholder) → 크리에이터 게시글 → 팬 게시글 → 아티스트 프로필
- 각 섹션: 헤더(섹션명 + '더보기' 링크) + 가로 스크롤 카드 2~4개
- 포스트 카드: 컴팩트 카드 — 썸네일 이미지 + 닉네임 + 본문 1줄 미리보기 + 상대시간
- 캘린더 섹션: '캘린더 기능이 곧 출시됩니다' placeholder 카드 (MVP에서 기능 없음)
- '더보기' 탭 시: 크리에이터 게시글 → Artist 탭, 팬 게시글 → Fan 탭, 공지 → 공지 리스트 화면, 아티스트 프로필 → Artist 탭 멤버 리스트
- 전체 데이터는 `highlight` Edge Function 단일 호출로 로드 (SUCCESS CRITERIA #1)

### 알림 화면
- 시간순 통합 리스트 — '오늘', '어제', '이번 주' 그룹핑
- 진입점: 커뮤니티 메인 화면 상단 헤더의 벨 아이콘 (해당 커뮤니티 알림만 필터링)
- 벨 아이콘에 읽지 않은 알림 수 뱃지 — Supabase Realtime으로 실시간 업데이트 (SUCCESS CRITERIA #4)
- 알림 탭하면 해당 콘텐츠로 이동 + 자동 읽음 처리
- 알림 설정: 커뮤니티 선택 → 카테고리별(크리에이터글/댓글/좋아요/공지) ON/OFF 토글 — notification_preferences 테이블 1:1 매핑

### 공지사항 표시
- 공지 리스트: 고정(pinned) 공지 상단 고정 + 나머지 최신순 나열
- 공지 상세: 풀스크린 상세 화면 (제목 + 날짜 + 본문 + 이미지)
- 관리자 공지 CRUD: Phase 4에서 Next.js admin에 구현 (생성/수정/삭제/고정/예약 게시)
- 예약 게시: pg_cron으로 scheduled_at 시간에 자동 게시 + 푸시 알림 트리거
- 공지 게시 시 해당 커뮤니티 멤버 전체에게 푸시 알림 발송

### 번역 UX
- 번역 버튼: 포스트/댓글 본문 하단 '번역하기' 텍스트 링크 (🌐 아이콘 + 텍스트)
- 탭하면 본문 아래에 번역문 추가 표시 (원문 유지 + 번역문 아래 표시)
- 토글: '번역하기' ↔ '원문 보기' 텍스트 전환으로 번역문 표시/숨김
- 번역 API: Google Translate API (5개 언어 KO/EN/TH/ZH/JA 모두 지원, ARCHITECTURE.md 스펙과 일치)
- 캐싱: DB 캐시 우선 — 요청 시 post_translations 확인 → 없으면 API 호출 → DB 저장 (cache-first 패턴)
- translate Edge Function에서 처리 (SUCCESS CRITERIA #5)

### 푸시 알림 시스템 (백엔드)
- async pgmq fan-out 패턴: 포스트 작성/댓글/좋아요/공지 이벤트 → pgmq 큐 → notify Edge Function → Expo Push API
- 포스트 작성 시 알림 발송이 포스트 생성을 차단하지 않음 (SUCCESS CRITERIA #3)
- Expo push token 저장 및 관리
- receipt polling으로 전송 실패 감지

### Claude's Discretion
- highlight Edge Function의 쿼리 최적화 전략 (N+1 방지, 페이로드 크기)
- 컴팩트 카드의 정확한 크기/스페이싱
- 알림 로딩/빈 상태 UI
- 번역 로딩 애니메이션 (스켈레톤 vs 스피너)
- pgmq fan-out 배치 크기 및 재시도 전략
- Expo push token 등록/갱신 타이밍
- 알림 목록 페이지네이션 전략
- admin 공지 CRUD UI 상세 레이아웃

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 아키텍처 & 데이터 모델
- `docs/ARCHITECTURE.md` — Edge Function 스펙(§5: notify, highlight, translate), pgmq fan-out 패턴, Realtime 채널(`user:${userId}:notifications`), ERD(§4)
- `docs/PRD.md` — Highlight 탭 요구사항, 알림 카테고리, 번역 기능 정의

### UI/UX 가이드
- `docs/WEVERSE-UI-UX-GUIDE.md` — Weverse Highlight 탭 패턴, 알림 화면 구성, 공지사항 UI 가이드

### 스키마
- `packages/db/src/schema/notification.ts` — notifications, notification_preferences, notices 테이블 정의 + RLS
- `packages/db/src/schema/translation.ts` — post_translations 테이블 정의 + RLS

### 프로젝트 계획
- `.planning/PROJECT.md` — 기술 스택, 제약조건, Highlight 탭 5섹션 결정
- `.planning/REQUIREMENTS.md` — HIGH-01~05, NOTC-01~05, NOTF-01~08, TRAN-01~05 요구사항 상세
- `.planning/ROADMAP.md` — Phase 4 성공 기준 5개, 플랜 구성(04-01~04)

### 이전 Phase 컨텍스트
- `.planning/phases/03-community-core-content/03-CONTEXT.md` — Fan/Artist/Highlight 3탭 구조, PostCard 컴포넌트 패턴, 커뮤니티 닉네임 표시 규칙

### 주의사항
- `.planning/STATE.md` — pgmq + pg_cron 확장 활성화 필요, DeepL vs Google Translate 비교(→ Google Translate로 결정됨)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/mobile/components/community/HighlightPlaceholder.tsx` — 현재 placeholder. Phase 4에서 실제 Highlight 콘텐츠로 교체
- `apps/mobile/components/community/CommunityTabBar.tsx` — Fan/Artist/Highlight 3탭 바. Highlight 탭 연결점
- `apps/mobile/app/(community)/[id]/index.tsx` — 커뮤니티 메인 화면. activeTab 상태로 Highlight 탭 렌더링
- `apps/mobile/components/post/PostCard.tsx` — 기존 포스트 카드. 컴팩트 카드 변형 생성 시 참조
- `packages/supabase/functions/generate-nickname/` — Edge Function 패턴 참조 (Deno.serve 사용)
- `apps/mobile/lib/supabase.ts` — Supabase 클라이언트 (Realtime 구독 추가 시 사용)
- `packages/shared/src/i18n/locales/` — 5개 언어 번역 파일. `highlight`, `notification` 네임스페이스 추가 필요

### Established Patterns
- RLS: `(select auth.uid())` 래퍼 패턴 — notifications, notices 테이블에도 적용
- 서버 상태: TanStack Query v5 (useQuery, useInfiniteQuery) — 알림/공지 목록에 사용
- 다크 테마: bg-background (#000000), 카드 #1A1A1A, 액센트 Teal #00E5C3
- posts_with_nickname 뷰 — 페르소나 격리 패턴, Highlight 포스트 표시에도 적용
- Creator 뱃지 — 닉네임 옆 Teal 'Creator' 뱃지 (Phase 3 결정)

### Integration Points
- `apps/mobile/app/(community)/[id]/index.tsx` — Highlight 탭에 실제 컴포넌트 연결
- `packages/supabase/config.toml` — pgmq, pg_cron 확장 활성화 필요
- `packages/supabase/functions/` — notify, highlight, translate Edge Function 추가
- `apps/admin/` — Next.js admin에 공지 CRUD 페이지 추가
- Supabase Realtime — 알림 뱃지 실시간 업데이트 채널 구독

</code_context>

<specifics>
## Specific Ideas

- Highlight 탭은 Weverse Highlight 탭과 동일한 섹션별 가로 스크롤 패턴
- 알림 화면은 시간순 통합 리스트 (Weverse/Instagram 패턴)
- 번역은 원문 아래에 번역문 추가 표시 방식 (Weverse/Twitter 패턴)
- 공지는 고정 공지 상단 + 시간순 리스트 (Weverse 패턴)
- 모든 UI는 기존 다크 테마 (#000000 배경, Teal 액센트) 유지

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-highlights-notices-notifications-translation*
*Context gathered: 2026-03-20*

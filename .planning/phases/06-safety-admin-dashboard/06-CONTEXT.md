# Phase 6: Safety & Admin Dashboard - Context

**Gathered:** 2026-03-22
**Status:** Ready for planning

<domain>
## Phase Boundary

콘텐츠 모더레이션(신고, 자동 필터링, 스팸 방지)과 완전한 관리자 대시보드(커뮤니티/크리에이터/멤버 관리, 리포트 큐, 제재, 공지, 배너, 분석)를 구현한다. 더보기 탭, Shop, DM placeholder는 Phase 7 범위.

</domain>

<decisions>
## Implementation Decisions

### 모바일 신고 UX
- **D-01:** 진입점: 포스트/댓글의 `⋯` (더보기) 메뉴 안에 "신고" 옵션 — 기존 삭제 버튼과 같은 메뉴
- **D-02:** 신고 UI: 바텀시트 1단계 — 사유 5개 리스트(hate/spam/violence/copyright/other) 탭 → 바로 제출
- **D-03:** "기타(other)" 선택 시 텍스트 입력 필수 — 설명 없이 제출 불가
- **D-04:** 신고 완료 피드백: 토스트 메시지 ("신고가 접수되었습니다")
- **D-05:** 본인 콘텐츠에는 신고 옵션 미표시 (삭제만 표시)
- **D-06:** 중복 신고 시 토스트 에러 ("이미 신고한 콘텐츠입니다") — UNIQUE constraint 활용

### 관리자 대시보드 네비게이션/레이아웃
- **D-07:** 좌측 사이드바 고정 — 아이콘 + 텍스트 메뉴 (Weverse/Vercel 스타일)
- **D-08:** 사이드바 메뉴 8개 플랫 구성: Dashboard(홈) / Communities / Creators / Members / Moderation / Notices / Banners / Analytics
- **D-09:** Admin 인증: 별도 로그인 페이지 — Supabase Auth로 로그인 후 role=admin 체크, 아니면 접근 차단
- **D-10:** 기존 notices 페이지를 새 사이드바 레이아웃 안으로 마이그레이션

### 모더레이션 큐 & 제재 워크플로우
- **D-11:** 리포트 큐: 테이블 행 클릭 → 사이드 패널(drawer)에 콘텐츠 원문 + 신고 사유 목록 + 신고자 수 표시
- **D-12:** 제재 적용: 리포트 상세 사이드 패널에서 바로 "조치 취하기" → 드롭다운(warning/7d/30d/permanent) + 사유 입력 → 확인
- **D-13:** 이의제기: MVP 최소 — 제재 내역에 "이의제기 이메일" 안내 텍스트만 표시 (앱 내 appeal 기능 없음)
- **D-14:** 콘텐츠 삭제: 관리자가 리포트 큐에서 직접 콘텐츠 삭제 가능 (soft delete)

### 분석(Analytics) 대시보드
- **D-15:** 핵심 지표: DAU/WAU/MAU, 일별 신규 가입, 커뮤니티별 게시글/댓글 수 + 신고 수 추이, 인기 커뮤니티 TOP 10, 활성 유저 비율
- **D-16:** 차트: 라인 차트 (시간축 기반 추이 — DAU/가입/신고 수 등)
- **D-17:** 날짜 범위: 프리셋 버튼 — 7일 / 30일 / 90일
- **D-18:** 데이터 소스: Supabase에서 직접 쿼리 — SQL 뷰/함수로 집계 (실시간)

### 자동 모더레이션 (백엔드)
- **D-19:** `moderate` Edge Function: 게시글/댓글 작성 시 비동기 호출 — 작성 자체를 차단하지 않음
- **D-20:** 금칙어 필터: PostgreSQL 매칭 → 즉시 차단 (게시 불가 + 경고)
- **D-21:** OpenAI Moderation API: hate/violence/sexual 탐지 → 자동 신고 생성 (관리자 큐에 추가)
- **D-22:** 스팸 방지: 5 posts/min 초과 시 1시간 임시 차단

### Claude's Discretion
- 바텀시트 신고 UI의 정확한 높이/스페이싱
- 사이드바 아이콘 선택 (Lucide icons)
- 사이드 패널(drawer) 너비/애니메이션
- 차트 라이브러리 선택 (recharts 등)
- moderate Edge Function의 금칙어 리스트 구조
- 스팸 rate limit 구현 방식 (DB trigger vs Edge Function)
- soft delete 구현 (is_deleted 컬럼 vs deleted_at timestamp)
- Analytics SQL 뷰/함수 최적화

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 아키텍처 & 데이터 모델
- `docs/ARCHITECTURE.md` — moderate Edge Function 스펙(§5.3), OpenAI Moderation API 연동, 콘텐츠 모더레이션 플로우차트, reports/user_sanctions ERD(§4), admin 앱 디렉토리 구조(§3), RLS 제재 유저 차단 패턴
- `docs/PRD.md` — 신고 요구사항, 관리자 대시보드 기능 정의, 모더레이션 정책

### UI/UX 가이드
- `docs/WEVERSE-UI-UX-GUIDE.md` — Weverse 관리자 패턴 참조

### 스키마
- `packages/db/src/schema/moderation.ts` — reports 테이블 (5종 사유, UNIQUE, RLS), user_sanctions 테이블 (4단계 제재, admin only)
- `packages/db/src/schema/content.ts` — posts, comments 테이블 (soft delete 대상)
- `packages/db/src/schema/promotion-banner.ts` — promotion_banners 테이블 (admin CRUD)

### 프로젝트 계획
- `.planning/PROJECT.md` — 기술 스택, 제약조건
- `.planning/REQUIREMENTS.md` — SAFE-01~06, ADMN-01~11 요구사항 상세
- `.planning/ROADMAP.md` — Phase 6 성공 기준 5개, 플랜 구성(06-01~03)

### 이전 Phase 컨텍스트
- `.planning/phases/04-highlights-notices-notifications-translation/04-CONTEXT.md` — 공지사항 CRUD 패턴, admin 공지 페이지 구현 참조
- `.planning/phases/05-home-feed-search-community-social/05-CONTEXT.md` — 프로모션 배너 캐러셀, PostCard 패턴

### 주의사항
- `.planning/STATE.md` — admin role 인증 패턴 (`raw_user_meta_data->>'role' = 'admin'`)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/admin/app/notices/` — 공지 CRUD 페이지 (Table, Badge, Button, AlertDialog 패턴). 새 사이드바 레이아웃으로 마이그레이션 + 다른 관리 페이지의 참조 패턴
- `apps/admin/components/ui/` — shadcn/ui 컴포넌트 (table, badge, button, input, textarea, select, switch, alert-dialog)
- `apps/admin/lib/supabase.ts` — supabaseAdmin 클라이언트 (service_role key)
- `packages/db/src/schema/moderation.ts` — reports + user_sanctions 테이블 완전 정의 (RLS 포함)
- `apps/mobile/components/post/PostCard.tsx` — 포스트 카드. 더보기 메뉴에 신고 옵션 추가
- `apps/mobile/components/post/DeleteConfirmDialog.tsx` — 삭제 확인 다이얼로그. 신고 바텀시트 패턴 참조
- `packages/supabase/functions/` — Edge Function 패턴 (Deno.serve, highlight/notify/translate 참조)

### Established Patterns
- Admin RLS: `raw_user_meta_data->>'role' = 'admin'` — reports/sanctions에 이미 적용
- Admin CRUD: supabaseAdmin(service_role) + shadcn Table/AlertDialog — notices에서 확립
- 모바일 더보기 메뉴: 포스트/댓글에 `⋯` 메뉴 존재 (삭제 옵션)
- 다크 테마: bg-background (#000000), 카드 #1A1A1A, 액센트 Teal #00E5C3
- Edge Function: Deno.serve() + POST body 패턴

### Integration Points
- `apps/mobile/components/post/PostCard.tsx` — 더보기 메뉴에 "신고" 옵션 추가
- `apps/mobile/components/comment/` — 댓글 더보기 메뉴에 "신고" 옵션 추가
- `apps/admin/app/layout.tsx` — 사이드바 레이아웃 적용 (현재 bare layout)
- `apps/admin/app/` — dashboard, communities, creators, members, moderation, banners, analytics 페이지 추가
- `packages/supabase/functions/moderate/` — moderate Edge Function 신규 생성
- `packages/supabase/config.toml` — moderate function 등록

</code_context>

<specifics>
## Specific Ideas

- 신고 바텀시트는 1단계로 간결하게 — 사유 탭 → 바로 제출 (Weverse/Instagram 패턴)
- 관리자 사이드바는 Vercel Dashboard 스타일 — 좌측 고정, 아이콘+텍스트
- 모더레이션 큐는 테이블 + 사이드 패널 패턴 — Linear/GitHub Issues 스타일
- 분석은 라인 차트 중심 — Vercel Analytics 스타일 시간축 추이
- 모든 admin UI는 기존 다크 테마 유지

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-safety-admin-dashboard*
*Context gathered: 2026-03-22*

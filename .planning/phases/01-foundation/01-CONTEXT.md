# Phase 1: Foundation - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

프로젝트 인프라를 완전히 구축한다: Turborepo 모노레포 스캐폴딩, Supabase 프로젝트 초기화(로컬 + 클라우드), Drizzle ORM으로 MVP 전체 테이블 스키마 + RLS 정책, Nativewind v4 다크 테마, Next.js Admin 앱 + Cloudflare 배포 검증, i18n 스캐폴드, EAS Build 등록 및 CI/CD 파이프라인.

</domain>

<decisions>
## Implementation Decisions

### 스키마 범위
- MVP 테이블만 생성: profiles, communities, community_members, artist_members, posts, comments, likes, notices, notifications, notification_preferences, reports, user_sanctions, post_translations, community_follows
- v1.1 테이블(wallets, jelly_transactions, dm_subscriptions, dm_messages, memberships, media_contents)은 해당 phase에서 추가
- posts/comments 테이블에 content_rating 컬럼 미리 포함 (AUTH-09 대비)
- `posts_with_nickname` 뷰 포함 (ARCHITECTURE.md §4.3)

### Supabase 환경
- 로컬(Docker) + 클라우드 프로젝트 둘 다 셋업
- `supabase init`으로 로컬 개발 환경 구성 + Supabase Cloud 프로젝트 연결
- 마이그레이션을 로컬에서 테스트 후 클라우드에 적용

### RLS 정책
- ARCHITECTURE.md §6.3에 정의된 모든 RLS 정책 구현
- `(select auth.uid())` 래퍼 패턴 전체 적용 (STATE.md 결정사항)
- anon 차단, 멤버 검증, 크리에이터 역할 검증, 팔로잉 커뮤니티 제한 등 전체 구현

### Admin 앱 초기화
- Next.js 초기화 + @opennextjs/cloudflare 설정 + Cloudflare Pages 실제 배포 테스트
- "Hello World" 수준이지만 배포 파이프라인 검증 완료 상태
- UI 프레임워크: shadcn/ui (Tailwind 기반, 모바일 앱의 Nativewind와 디자인 언어 통일)

### CI/CD 파이프라인
- GitHub Actions: Lint + TypeCheck, Build 검증, Supabase 마이그레이션 테스트 (Docker), EAS Build 트리거
- EAS Build: release 태그(v*.*.*) push 시에만 트리거 (빌드 비용 절약)
- Cloudflare Pages: GitHub 연동으로 main push 시 자동 배포, PR은 Preview 배포

### i18n 구조
- 네임스페이스 분리: common.json, auth.json 등 기능별 파일 분리
- Phase 1에서는 common + auth 네임스페이스 스켈레톤만 생성 (5개 언어)
- 실제 번역 키는 해당 Phase에서 추가

### Claude's Discretion
- Turborepo 캐시 전략 및 turbo.json 파이프라인 구성
- ESLint/Prettier/TypeScript 공유 설정 상세
- Drizzle 마이그레이션 파일 구조
- Nativewind v4 호환성 검증 방법 (STATE.md 경고 대응)
- Supabase Edge Function 프로젝트 구조
- 테스트 프레임워크 선택 (Vitest 등)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 프로젝트 스펙
- `docs/ARCHITECTURE.md` — 전체 시스템 아키텍처, 모노레포 구조(§3), ERD(§4), API 설계(§5), RLS 정책(§6), 인덱스 전략(§4.4)
- `docs/PRD.md` — 제품 요구사항, 타겟 사용자, 페르소나 정의
- `docs/WEVERSE-UI-UX-GUIDE.md` — Weverse 기반 UI/UX 가이드라인

### 프로젝트 계획
- `.planning/PROJECT.md` — 핵심 결정사항, 제약조건, 기술 스택
- `.planning/REQUIREMENTS.md` — FOUN-01~09 요구사항 상세
- `.planning/ROADMAP.md` — Phase 1 성공 기준, 플랜 구성(01-01, 01-02, 01-03)

### 주의사항
- `.planning/STATE.md` — Nativewind v4/SDK 55 호환성 경고, OpenNext 검증 필요성, `(select auth.uid())` 패턴 결정

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- 프로젝트는 빈 상태 — 기존 코드 없음. 모든 것을 새로 생성

### Established Patterns
- 없음 (Phase 1이 패턴을 정립하는 단계)

### Integration Points
- Supabase Cloud 프로젝트 연결 필요
- Cloudflare Pages 프로젝트 연결 필요
- EAS 프로젝트 등록 필요
- GitHub Actions secrets 설정 필요

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-03-18*

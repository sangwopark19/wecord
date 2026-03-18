# Phase 2: Auth & Onboarding - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

사용자가 Google/Apple OAuth로 계정을 생성하고, 온보딩 플로우(ToS, 생년월일, 언어, 크리에이터 큐레이션)를 거쳐 앱에 진입하는 전체 흐름. 글로벌 프로필(닉네임, 아바타)은 온보딩과 분리되어 더보기 탭에서 설정. 세션 관리(SecureStore 토큰, 자동 갱신) 포함.

</domain>

<decisions>
## Implementation Decisions

### 온보딩 플로우
- 단계 순서: ToS 동의 → 생년월일 → 언어 선택 → 크리에이터 큐레이션
- 스킵 가능: 큐레이션만 skip 가능 (ToS/생년월일/언어는 필수)
- 진행 표시: 화면 상단 dot indicator (Weverse 스타일)
- 완료 후 이동: 홈 탭으로 이동 (커뮤니티 0개이므로 추천 화면 표시)

### 크리에이터 큐레이션
- 표시 방식: 카드 그리드 (Spotify 스타일) — 프로필 이미지 + 이름, 탭하면 선택/해제 토글
- 선별 로직: DB에 등록된 크리에이터(커뮤니티 기준) 중 랜덤 표시. MVP에서는 추천 알고리즘 없음
- 선택 결과: 선택한 크리에이터의 커뮤니티에 자동 가입 (커뮤니티 닉네임은 자동생성)
- 선택 제한: 없음 — 0개부터 원하는 만큼 선택 가능 (skip이므로 0개도 OK)

### 프로필 설정
- 온보딩과 분리: 온보딩에서는 프로필 설정 없음. 더보기 탭에서 별도 편집
- 닉네임 자동생성: UUID 기반 코드 (User#4821 형태). `generate-nickname` Edge Function으로 구현
- 아바타: 기본 아바타 이미지 제공 (Teal 배경 이니셜), 원하면 사진 업로드 가능 (Supabase Storage)
- bio: 온보딩에서 제외. 더보기 탭 프로필 편집에서만 입력 가능

### 로그인 화면
- 구성: Wecord 로고/브랜딩 + OAuth 버튼들. 미니멀 디자인, 다크 배경
- Apple OAuth: 모든 플랫폼(iOS, Android, Web)에서 표시 (Supabase Auth로 구현)
- Google OAuth: 모든 플랫폼에서 표시
- 비로그인 상태: 앱 실행 시 즉시 로그인 화면으로 이동. 다른 화면 접근 불가

### 세션 관리
- 토큰 저장: SecureStore (Expo) — access token + refresh token
- 자동 갱신: Supabase refresh token으로 자동 갱신. 갱신 실패 시 로그인 화면으로 이동
- 앱 재시작: SecureStore에서 토큰 복원, 유효하면 자동 로그인

### Claude's Discretion
- OAuth 콜백 처리 방식 (deep link vs redirect)
- Zustand authStore 구조 상세
- TanStack Query 클라이언트 설정 상세
- 온보딩 애니메이션/전환 효과
- SecureStore 키 네이밍
- 에러 상태 UI (네트워크 오류, OAuth 실패 등)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 아키텍처 & 인증
- `docs/ARCHITECTURE.md` — 인증 흐름(§7.1 시퀀스 다이어그램), RLS 역할 모델(§6), profiles 테이블 ERD(§4), API 엔드포인트(§5)
- `docs/PRD.md` — 타겟 사용자 정의, 페르소나 구조, 온보딩 요구사항

### UI/UX 가이드
- `docs/WEVERSE-UI-UX-GUIDE.md` — Weverse 기반 UI/UX 패턴, 다크 테마 가이드라인

### 프로젝트 계획
- `.planning/PROJECT.md` — 기술 스택, 제약조건, 핵심 결정사항
- `.planning/REQUIREMENTS.md` — AUTH-01~09 요구사항 상세
- `.planning/ROADMAP.md` — Phase 2 성공 기준, 플랜 구성(02-01, 02-02)

### Phase 1 컨텍스트
- `.planning/phases/01-foundation/01-CONTEXT.md` — Phase 1 결정사항 (RLS 패턴, i18n 구조, Supabase 환경)

### 주의사항
- `.planning/STATE.md` — Nativewind v4 호환성 경고, `(select auth.uid())` 패턴, Apple OAuth + privacy policy URL 필요

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/db/src/schema/auth.ts` — profiles 테이블 + RLS 정책 이미 정의됨 (userId, globalNickname, avatarUrl, bio, language, dateOfBirth, onboardingCompleted)
- `packages/shared/src/i18n/locales/*/auth.json` — auth 네임스페이스 i18n 스켈레톤 (5개 언어, 현재 logout 키만 존재)
- `apps/mobile/app/_layout.tsx` — Root layout에 i18n init + 다크 테마 적용 완료

### Established Patterns
- RLS: `(select auth.uid())` 래퍼 패턴 — 모든 테이블에 적용
- i18n: `initI18n()` 함수 패턴 — 앱 시작 시 호출
- 스타일링: Nativewind v4 + Tailwind CSS 클래스 사용
- 다크 테마: bg-background (#000000), 카드 #1A1A1A, 액센트 Teal #00E5C3

### Integration Points
- `packages/supabase/functions/` — Edge Function 디렉토리 존재 (generate-nickname 여기에 추가)
- `apps/mobile/app/(tabs)/` — 탭 라우트 구조 존재 (인증 라우트 그룹 추가 필요)
- Supabase Auth — 아직 클라이언트 설정 미완. @supabase/supabase-js 클라이언트 초기화 필요
- Zustand store — 미구현. authStore 새로 생성 필요
- TanStack Query — 미구현. QueryClient 설정 필요

</code_context>

<specifics>
## Specific Ideas

- 큐레이션 UI는 Spotify 스타일 카드 그리드 (탭하여 선택/해제)
- 로그인 화면은 미니멀하게 — 로고 + OAuth 버튼만
- 닉네임은 User#XXXX 형태의 코드 닉네임 (친근한 조합어 대신)
- 프로필 설정은 온보딩에서 완전히 분리 — 더보기 탭에서만 편집

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-auth-onboarding*
*Context gathered: 2026-03-18*

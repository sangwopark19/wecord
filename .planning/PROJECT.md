# Wecord

## What This Is

BL·GL 크리에이터와 팬을 위한 올인원 팬 커뮤니티 플랫폼. 트위터, 픽시브, 디스코드에 분산된 BL·GL 팬덤을 하나의 공간에 통합한다. 크리에이터(작가, 일러스트레이터, 성우)와 팬이 직접 소통하고, 콘텐츠를 공유하며, 커뮤니티별 독립 페르소나로 팬덤 활동을 기록하는 전용 플랫폼.

## Core Value

BL·GL 크리에이터와 팬이 언어 장벽 없이 소통할 수 있는 전용 커뮤니티 공간을 제공하는 것. 커뮤니티별 독립 닉네임(페르소나 분리)과 자동번역이 이를 가능하게 한다.

## Requirements

### Validated

- [x] 소셜 로그인(Google/Apple OAuth) 및 글로벌 프로필 설정 — Validated in Phase 2
- [x] 첫 가입 시 스포티파이 스타일 크리에이터 선택 큐레이션 — Validated in Phase 2
- [x] 이중 계정 구조 (글로벌 계정 + 커뮤니티별 프로필) — Validated in Phase 2
- [x] 커뮤니티 탐색/검색 및 가입 (커뮤니티별 전용 닉네임) — Validated in Phase 3
- [x] 팬 피드 (텍스트/이미지/영상 게시, 무한스크롤) — Validated in Phase 3
- [x] 크리에이터 피드 & 아티스트 멤버 시스템 (그룹/솔로) — Validated in Phase 3
- [x] 댓글(대댓글 1depth), 좋아요, 크리에이터 답글 하이라이트 — Validated in Phase 3/4
- [x] 게시글/댓글 번역 버튼 + 앱 UI 5개 언어 i18n — Validated in Phase 4
- [x] 알림 시스템 (푸시 알림, 커뮤니티/카테고리별 설정) — Validated in Phase 4
- [x] 공지사항 (고정, 예약 게시, 푸시 알림) — Validated in Phase 4
- [x] Highlight 탭 (공지사항 → 캘린더 → 아티스트 게시글 → 팬 게시글 → 아티스트 프로필 모아보기) — Validated in Phase 4
- [x] 홈 피드 (가입 0개: 추천 / 가입 1+: 통합 피드) — Validated in Phase 5
- [x] 홈 프로모션 배너 캐러셀 (관리자에서 CRUD) — Validated in Phase 5
- [x] 검색 (커뮤니티 검색 + 커뮤니티 내 게시글 검색) — Validated in Phase 5
- [x] 커뮤니티 내 팔로잉/팔로워 & 커뮤니티 프로필 — Validated in Phase 5

### Active

- [ ] 게시글/댓글 신고
- [ ] 더보기 탭 (글로벌 프로필 편집, 앱 설정, 로그아웃)
- [ ] Shop 탭 (인앱 WebView → x-square.kr)
- [ ] DM 탭 플레이스홀더 ("곧 출시" + 알림받기)
- [ ] 관리자 대시보드 (커뮤니티/크리에이터/멤버 관리, 모더레이션, 공지, 배너, 분석)

### Out of Scope

- Moments(스토리) 기능 — 구현 복잡도 높음, MVP 이후 구현 예정
- DM 실제 메시징 — v1.1에서 Jelly 결제와 함께 구현
- Jelly 디지털 화폐 / 멤버십 / 결제 — v1.1 수익화 단계
- VOD 미디어 콘텐츠 — v1.1
- 팬레터 / 캘린더 이벤트 관리 / Collection & 배지 — v1.1
- LIVE 스트리밍 / 커머스 / 온라인 이벤트 — v2.0
- 커뮤니티별 테마 컬러 — MVP는 고정 액센트 컬러(Teal), 이후 커스텀 지원
- OAuth 추가 프로바이더 (카카오, 트위터 등) — MVP는 Google/Apple만
- 모바일 앱 전용 네이티브 기능 (NFC 등) — Expo Universal로 충분

## Context

- **벤치마크**: Weverse (178+ 아티스트, 12M+ MAU). 동일한 팬 커뮤니티 구조를 BL·GL에 특화
- **타겟 시장**: 한국, 일본, 태국, 중국, 영어권 (BL·GL 4대 시장 + 영어권)
- **타겟 유저**: 일반 팬(15~35세, 여성 80%+), 프리미엄 팬, 크리에이터, 관리자
- **개발 체제**: 솔로 개발자 (기획/디자인/개발/운영)
- **페르소나 분리**: 팬들이 아티스트마다 다른 닉네임/정체성을 원함 → 이중 계정 구조
- **팬덤 퍼널**: Discovery → Exploration → Appreciation → Interaction → Amplification
- **기존 문서**: docs/PRD.md, docs/ARCHITECTURE.md, docs/WEVERSE-UI-UX-GUIDE.md에 상세 스펙 존재
- **Highlight 탭 구성**: 공지사항 → 캘린더 → 아티스트 게시글 → 팬 게시글 → 아티스트 프로필 모아보기 순서

## Constraints

- **Tech Stack**: Expo SDK 55 Universal (iOS/Android/Web) + Supabase + PostgreSQL 17 ("Just Use Postgres")
- **ORM**: Drizzle ORM (타입 안전 DB 접근)
- **모노레포**: Turborepo + pnpm workspace (apps/mobile, apps/admin, packages/db, packages/supabase, packages/shared)
- **관리자**: Next.js 웹앱 (Cloudflare Pages 배포)
- **스타일링**: Nativewind v4 (Tailwind CSS)
- **상태 관리**: TanStack Query v5 (서버 상태) + Zustand v5 (클라이언트 상태)
- **UI 테마**: 다크 모드 전용 (배경 #000000, 카드 #1A1A1A, 액센트 Teal #00E5C3)
- **플랫폼**: iOS 15+, Android 10+, Chrome 90+, Safari 15+
- **다국어**: 5개 언어 (KO/EN/TH/ZH-CN/JA)
- **성능**: 앱 초기 로딩 < 3초, 피드 로딩 < 1초, 번역 < 2초
- **MVP 원칙**: 수익/결제 시스템 없음. 커뮤니티 가치 검증에 집중
- **배포**: EAS Build (앱) + Cloudflare Pages (웹/관리자) + Supabase CLI (Edge Functions)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Just Use Postgres | 솔로 개발자 — 외부 서비스 최소화. pg_textsearch, pgmq, pg_cron 등으로 대체 | — Pending |
| Expo Universal | 솔로 개발자가 iOS+Android+Web 동시 지원 | — Pending |
| 이중 계정 구조 | 팬 페르소나 분리 요구. community_members.community_nickname으로 구현 | — Pending |
| Supabase 올인원 | Auth, API(PostgREST), Realtime, Storage, Edge Functions 단일 플랫폼 | — Pending |
| Drizzle ORM | TypeScript 네이티브, SQL에 가까운 API, Supabase PostgreSQL 호환 | — Pending |
| community_follows 단일 테이블 | 팬↔아티스트, 팬↔팬 팔로잉 통합. RLS로 커뮤니티 간 차단 | — Pending |
| 고정 액센트 컬러 (Teal) | MVP 복잡도 감소. 커뮤니티별 테마 컬러는 이후 지원 | — Pending |
| Moments MVP 제외 | 구현 복잡도 높음. Artist 탭은 포스트 리스트만 표시 | — Pending |
| 프로모션 배너 관리자 관리 | 관리자 대시보드에서 배너 CRUD 가능하도록 구현 | — Pending |
| Highlight 탭 5섹션 구성 | 공지 → 캘린더 → 아티스트글 → 팬글 → 아티스트 프로필 순서 | — Pending |

---
*Last updated: 2026-03-22 after Phase 5 completion*

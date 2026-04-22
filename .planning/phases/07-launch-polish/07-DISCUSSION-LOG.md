# Phase 7: Launch Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-22
**Phase:** 07-launch-polish
**Areas discussed:** 탭 네비게이션 & More 레이아웃, 프로필 편집 & 앱 설정 UX, Shop WebView 동작, DM 플레이스홀더 + 앱 제출

---

## Gray Area 선택

| Option | Description | Selected |
|--------|-------------|----------|
| 탭 네비게이션 & More 레이아웃 | 5탭 확장, Highlight 배치, More 탭 섹션 구성 | ✓ |
| 프로필 편집 & 앱 설정 UX | 글로벌 프로필 편집, 언어/알림 설정, 로그아웃 | ✓ |
| Shop WebView 동작 | react-native-webview 도입, 네비게이션/인증/에러 UX | ✓ |
| DM 플레이스홀더 + 앱 제출 | DM Coming Soon, 17+ 등급, privacy URL, Apple OAuth, Supabase prod | ✓ |

**사용자 선택:** 4개 영역 모두 논의.

---

## Area 1: 탭 네비게이션 & More 레이아웃

### Q1. 하단 탭 구성

| Option | Description | Selected |
|--------|-------------|----------|
| Weverse 같은 5탭 (추천) | Home/Community/Shop/DM/More — Weverse 벤치마크 패턴 | ✓ |
| 기존 Community + 신규 3탭 | Highlight는 계속 커뮤니티 내부 | |
| 4탭 구성 | Home/Community/Shop/More (DM은 서브메뉴) | |

**User's choice:** Weverse 같은 5탭
**Notes:** MVP에서 Weverse 벤치마크와 일치하는 5탭 유지.

### Q2. More 탭 상단

| Option | Description | Selected |
|--------|-------------|----------|
| 프로필 카드 + '프로필 편집' 버튼 (추천) | 아바타/닉네임/bio 미리보기 + 우측 편집 버튼 | ✓ |
| 카드 전체 Pressable | affordance 약함 | |
| 프로필 없이 메뉴 리스트 | iOS 설정 앱 스타일 | |

**User's choice:** 프로필 카드 + '프로필 편집' 버튼

### Q3. More 탭 중간 섹션

| Option | Description | Selected |
|--------|-------------|----------|
| 고정 순서: 가입 커뮤니티 → 설정 → 앱 정보 → 로그아웃 (추천) | 시각적 그룹화 | ✓ |
| Weverse 스타일 플랫 리스트 | 구분 없이 순차 | |
| 가입 커뮤니티 별도 상단 카드 | 가로 스크롤 | |

**User's choice:** 고정 순서: 가입 커뮤니티 → 설정 → 앱 정보 → 로그아웃

### Q4. 가입 커뮤니티 리스트 형태

| Option | Description | Selected |
|--------|-------------|----------|
| 리스트 행 (아이콘 + 이름 + 내 닉네임) (추천) | 정보량 적절 | ✓ |
| 컴팩트 칩 그리드 | 가로 스크롤 | |
| 2열 카드 그리드 | Phase 3 패턴 재사용 | |

**User's choice:** 리스트 행 (아이콘 + 이름 + 내 닉네임)

### Q5. Highlight 탭 위치

| Option | Description | Selected |
|--------|-------------|----------|
| 현재대로 커뮤니티 내부 탭으로 유지 (추천) | Phase 4 구조 보존 | ✓ |
| 전역 Highlight 탭 | Community 제거 필요 | |
| Home에 통합 | Phase 5 통합 피드 대체 | |

**User's choice:** 현재대로 커뮤니티 내부 탭으로 유지

### Q6. 알림 벨 배치

| Option | Description | Selected |
|--------|-------------|----------|
| Home 헤더 유지 (추천) | Phase 5 구조 보존 | ✓ |
| 모든 탭 공통 헤더 | 일관성 비용 높음 | |
| More 탭 별도 항목 | 플랫폼 이례적 | |

**User's choice:** Home 헤더 유지

### Q7. 설정 진입 방식

| Option | Description | Selected |
|--------|-------------|----------|
| 단일 '설정' 페이지에 모든 항목 나열 (추천) | iOS 설정 앱 스타일 | ✓ |
| 카테고리별 분리 | General/Notifications/Privacy/About | |
| More에 직접 펼쳐 노출 | 별도 진입 없음 | |

**User's choice:** 단일 '설정' 페이지에 모든 항목 나열

---

## Area 2: 프로필 편집 & 앱 설정 UX

### Q1. 글로벌 프로필 편집 화면 구조

| Option | Description | Selected |
|--------|-------------|----------|
| 단일 편집 화면에 모든 필드 (추천) | 저장 버튼으로 일괄 | ✓ |
| 필드별 개별 화면 | iOS 설정 앱 패턴 | |
| 인라인 편집 (More 카드 확장) | 아바타 업로드 어색 | |

**User's choice:** 단일 편집 화면에 모든 필드

### Q2. 아바타 업로드 흐름

| Option | Description | Selected |
|--------|-------------|----------|
| 아바타 탭 → 액션시트 (추천) | 카메라/갤러리/기본/삭제 4옵션 | ✓ |
| 바로 갤러리에서 선택 | 카메라 불가 | |
| 미구현 (기본 아바타만) | v1.1로 이연 | |

**User's choice:** 아바타 탭 → 액션시트

### Q3. 언어 변경 화면

| Option | Description | Selected |
|--------|-------------|----------|
| 온보딩 language.tsx 패턴 재활용 (추천) | 검증된 패턴 | ✓ |
| iOS 설정 앱 스타일 2단계 | 클릭 더 많음 | |
| 별도 디자인 시스템 UI | 과임 | |

**User's choice:** 온보딩 language.tsx 패턴 재활용

### Q4. 앱 전역 알림 설정

| Option | Description | Selected |
|--------|-------------|----------|
| 설정 탭에서 글로벌 스위치 + 커뮤니티별 링크 (추천) | 두 스코프 분리 | ✓ |
| 글로벌 카테고리별 스위치 | 기존 설정과 충돌 | |
| 앱 단위 설정 없음 | MORE-04 미충족 | |

**User's choice:** 설정 탭에서 글로벌 스위치 + 커뮤니티별 설정 링크

### Q5. 로그아웃 UX

| Option | Description | Selected |
|--------|-------------|----------|
| 확인 다이얼로그 후 로그인 화면으로 (추천) | 실수 방지 | ✓ |
| 확인 없이 즉시 로그아웃 | 실수 가능성 | |
| 로그아웃 + 계정 삭제 통합 | GDPR는 유리, 과임 | |

**User's choice:** 확인 다이얼로그 후 로그인 화면으로

### Q6. 글로벌 닉네임 변경 제약

| Option | Description | Selected |
|--------|-------------|----------|
| 자유롭게 변경 가능 (2~20자, 중복 허용) (추천) | MVP 단순 | ✓ |
| 닉네임 중복 불가 (UNIQUE) | 인기 닉네임 선점율 이슈 | |
| 30일 1회 제한 | 구현 복잡, MVP 과임 | |

**User's choice:** 자유롭게 변경 가능 (2~20자, 중복 허용)

### Q7. bio 제약

| Option | Description | Selected |
|--------|-------------|----------|
| 최대 150자, 평문 텍스트 (추천) | Twitter 스타일 | ✓ |
| 최대 500자 리치 텍스트 | 과임 | |
| 최대 80자 단일 줄 | Instagram 스타일, 부족 | |

**User's choice:** 최대 150자, 평문 텍스트

### Q8. 설정 페이지 기타 정적 항목

| Option | Description | Selected |
|--------|-------------|----------|
| 약관 / 개인정보처리방침 / 버전 정보 3개 (추천) | 심사 최소 충족 | ✓ |
| 3개 + 오픈소스 라이선스 + 고객지원 | MVP 과임 | |
| 약관/처리방침 1개 링크로 통합 | Apple 독립 URL 요구 | |

**User's choice:** 약관 / 개인정보처리방침 / 버전 정보 3개

---

## Area 3: Shop WebView 동작

### Q1. Shop 탭 구현 방식

| Option | Description | Selected |
|--------|-------------|----------|
| react-native-webview — embedded WebView (추천) | SHOP-01/02 완벽 충족 | ✓ |
| expo-web-browser (Safari VC/Chrome CT) | back/refresh 제어 제한 | |
| 외부 브라우저 리다이렉트 | SHOP-01 위반 | |

**User's choice:** react-native-webview — embedded WebView

### Q2. WebView 상단 네비게이션 컨트롤

| Option | Description | Selected |
|--------|-------------|----------|
| 상단에 민먼한 헤더 (뒤로가기 + 새로고침) (추천) | Weverse Shop 패턴 | ✓ |
| 하단 막대 (상단은 로고만) | 탭 바와 거리 문제 | |
| 컨트롤 없이 전체 WebView | SHOP-02 위반 | |

**User's choice:** 상단에 민먼한 헤더 (뒤로가기 + 새로고침)

### Q3. 인증/세션 전달

| Option | Description | Selected |
|--------|-------------|----------|
| 전달 없음 — 무명 방문 (추천) | MVP 간결 | ✓ |
| URL 쿼리 파라미터로 user_id | 보안 취약 | |
| JWT postMessage 이사 | 엔지니어링 중결 | |

**User's choice:** 전달 없음 — 무명 방문

### Q4. 에러·오프라인 UX

| Option | Description | Selected |
|--------|-------------|----------|
| 에러 화면에 '다시 시도' 버튼 + 이전 탭 안내 (추천) | 사용자 인지 가능 | ✓ |
| 스피너 + 자동 재시도 무한 루프 | 블로킹 위험 | |
| 기본 WebView 에러 화면 | 브랜딩 불명확 | |

**User's choice:** 에러 화면에 '다시 시도' 버튼 + 이전 탭 안내

---

## Area 4: DM 플레이스홀더 + 앱 제출

### Q1. DM Coming Soon 화면 디자인

| Option | Description | Selected |
|--------|-------------|----------|
| 중앙 일러스트/아이콘 + 안내 카피 + Teal 'Notify Me' (추천) | 완성감 | ✓ |
| 간단한 텍스트 + 버튼만 | 빈약 | |
| Shop WebView로 연결 | 비일관 UX | |

**User's choice:** 중앙 일러스트/아이콘 + 안내 카피 + Teal 'Notify Me'

### Q2. '알림 받기' 저장 위치

| Option | Description | Selected |
|--------|-------------|----------|
| profiles.dm_launch_notify boolean 컬럼 (추천) | 간결, 중복 자동 방지 | ✓ |
| 별도 launch_notifications 테이블 | 확장 가능하나 과임 | |
| notification_preferences 컬럼 추가 | 도메인 불일치 | |

**User's choice:** profiles.dm_launch_notify boolean 컬럼 추가

### Q3. 17+ 등급 메타데이터 처리

| Option | Description | Selected |
|--------|-------------|----------|
| App Store Connect 설문 + Google Play IARC 17+, 앱 내 필터 없음 (추천) | 심사용 메타만 | ✓ |
| 앱 내 연령 게이트 UI 동시 구현 | Phase 7 스코프 확장 | |
| 등급 12+로 하향 | BL/GL 특성상 위험 | |

**User's choice:** App Store Connect 설문 + Google Play IARC 17+, 앱 내 필터 없음

### Q4. 개인정보처리방침 URL 호스팅

| Option | Description | Selected |
|--------|-------------|----------|
| apps/admin Cloudflare Pages /privacy, /terms (추천) | 기존 인프라 활용 | ✓ |
| 교소내 업무용 위키 공개 링크 | 브랜드 도메인 아님 | |
| GitHub Pages 별도 레포지토리 | 운영 복잡 | |

**User's choice:** apps/admin Cloudflare Pages /privacy, /terms

### Q5. Apple OAuth 감사

| Option | Description | Selected |
|--------|-------------|----------|
| Apple 안내에 따라 필수항목 전량 점검 (추천) | 심사 거절 최소화 | ✓ |
| 시각 유스어빌리티만 확인 | 위험 | |
| Apple OAuth 제거하고 Google만 | AUTH-02 위반 | |

**User's choice:** Apple 안내에 따라 필수항목 전량 점검

### Q6. Supabase 프로덕션 환경 준비

| Option | Description | Selected |
|--------|-------------|----------|
| 프로덕션 Supabase 프로젝트 독립 생성 (추천) | 실 유저 환경 분리 | ✓ |
| 기존 Supabase 그대로 사용 | 개발 데이터 오염 | |
| 이후 별도 태스크로 이연 | 심사용 빌드에 필요 | |

**User's choice:** 프로덕션 Supabase 프로젝트 독립 생성

### Q7. 앱 제출 차단 기타 항목 (multiSelect)

| Option | Description | Selected |
|--------|-------------|----------|
| App Store 최소 메타 (스크린샷/설명/키워드/지원 URL) | 심사 필수 | ✓ |
| 앱 아이콘 + 스플래시 검증 | 일관성 점검 | ✓ |
| expo-tracking-transparency (iOS ATT) | 추적 없음 선언 | ✓ |
| 데이터 삭제 요청 흐름 | Google Play 2024+ 필수 | ✓ |

**User's choice:** 전부 선택 (4개)

### Q8. 계정 삭제 요청 흐름

| Option | Description | Selected |
|--------|-------------|----------|
| More 탭 '계정 삭제' → mailto 이메일 링크 (추천) | Phase 7 스코프 최소 | |
| 앱 내 즉시 삭제 (Edge Function 연쇄 삭제) | 스코프 확장, UX 완성 | ✓ |
| 외부 웹 폼으로 링크 | 인증 없는 폼 리스크 | |

**User's choice:** 앱 내 즉시 삭제 (profiles + 관련 데이터 자동 삭제 Edge Function)
**Notes:** 추천(mailto) 대신 스코프를 확장해 실사용자 UX를 완성하는 방향 선택. delete-user Edge Function 신설 결정.

### Q9. privacy/terms 호스팅 도메인

| Option | Description | Selected |
|--------|-------------|----------|
| apps/admin Cloudflare Pages 기본 도메인 /privacy, /terms (추천) | 별도 도메인 불필요 | ✓ |
| 전용 도메인(wecord.app) 통합 배포 | 도메인 구매 필요 | |
| admin 앱 승인 단계 안에 숙겨서 노출 | 심사자 접근 불가 | |

**User's choice:** apps/admin Cloudflare Pages 기본 도메인 /privacy, /terms

---

## Claude's Discretion

사용자가 '너 결정'으로 맡긴 상세 구현 항목은 CONTEXT.md의 `### Claude's Discretion` 섹션 참고.

## Deferred Ideas

사용자가 언급했거나 스코프 경계에서 거절된 항목은 CONTEXT.md `<deferred>` 섹션 참고. 주요 이연: 실제 DM 메시징(v1.1), Shop SSO(v1.1), content_rating 기반 필터 UI(v1.1), 3개 추가 언어 약관(v1.0.1), 인앱 고객지원 폼.

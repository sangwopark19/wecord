# Phase 7: Launch Polish - Context

**Gathered:** 2026-04-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Weverse 스타일 5탭 네비게이션(Home / Community / Shop / DM / More)으로 확장하고, More 탭에 글로벌 계정 허브(프로필 편집·가입 커뮤니티 리스트·앱 설정·로그아웃)를 구현한다. Shop 탭은 x-square.kr을 react-native-webview로 embed, DM 탭은 Coming Soon 플레이스홀더 + "알림 받기" 토글을 제공한다. App Store/Play Store 최초 제출에 필요한 17+ 등급 메타데이터, 개인정보처리방침/약관 URL 호스팅, Apple OAuth 최종 감사, 프로덕션 Supabase 환경 분리, 계정 삭제 흐름, ATT, 스크린샷/메타 체크리스트까지 포함한다. 실제 DM 메시징·Shop 커머스 연동·Jelly 결제는 v1.1 이후.

</domain>

<decisions>
## Implementation Decisions

### 탭 네비게이션 구조
- **D-01:** 하단 탭을 5개로 확장 — Home / Community / Shop / DM / More (Weverse 5탭 패턴)
- **D-02:** Highlight는 현재대로 각 커뮤니티 내부 3탭(Fan/Artist/Highlight) 중 하나로 유지 — Phase 4 구조 변경 없음
- **D-03:** 알림 벨은 Home 헤더에만 배치 (Phase 5 구조 유지) — 모든 탭 공통 헤더 아님
- **D-04:** notifications 라우트는 기존대로 `(tabs)/notifications.tsx` + `href:null` 숨김 탭 패턴 유지

### More 탭 레이아웃
- **D-05:** More 탭 상단: 프로필 카드(아바타 + 글로벌 닉네임 + bio 한 줄 미리보기) + 우측 '프로필 편집' 버튼
- **D-06:** More 탭 섹션 순서 (위에서 아래): 프로필 카드 → 가입 커뮤니티 리스트 → 설정 → 앱 정보 → 로그아웃
- **D-07:** 가입 커뮤니티는 리스트 행(아이콘 + 커뮤니티명 + 내 커뮤니티 닉네임) — 탭 시 해당 커뮤니티로 이동
- **D-08:** 설정 진입은 단일 '설정' 페이지 — 언어/알림/약관/개인정보처리방침/버전 정보를 한 페이지에 세로 나열 (iOS 설정 앱 스타일)
- **D-09:** '앱 정보'는 별도 섹션 — 버전(읽기 전용), 약관, 개인정보처리방침. 로그아웃과는 구분되는 그룹

### 프로필 편집 UX (MORE-01)
- **D-10:** 단일 편집 화면에 모든 필드(아바타 / 글로벌 닉네임 / bio) 동시 편집, 상단 '저장' 버튼으로 일괄 저장
- **D-11:** 아바타 탭 시 ActionSheet — 카메라 / 갤러리 / 기본 아바타로 / (선택적) 삭제 4개 옵션
- **D-12:** 아바타 업로드는 Phase 3 post 이미지 업로드 패턴 재사용 (expo-image-picker + Supabase Storage)
- **D-13:** 글로벌 닉네임: 길이 2~20자, 중복 허용 — User#XXXX 코드 닉네임이 고유 식별자 역할 유지
- **D-14:** bio: 최대 150자, 평문 텍스트 (Twitter 스타일), 줄바꿈 허용

### 언어 설정 (MORE-02)
- **D-15:** 온보딩 `(onboarding)/language.tsx`의 선택 라디오 리스트 패턴 그대로 재활용 — 별도 컴포넌트로 추출해 양쪽에서 공유
- **D-16:** 언어 선택 즉시 `i18n.changeLanguage()` + `profiles.language` 업데이트 — 앱 재시작 없이 실시간 반영

### 앱 설정 — 알림 (MORE-04)
- **D-17:** 설정 페이지에 '푸시 알림 수신' 글로벌 스위치 — device-level ON/OFF (OS 권한 상태 반영/변경)
- **D-18:** 설정 페이지에 '커뮤니티별 설정' 행 → 가입한 커뮤니티 리스트 → 기존 `(community)/[id]/notification-preferences` 화면 재사용
- **D-19:** DM·Shop 관련 카테고리 스위치 미추가 (MVP 범위 밖)

### 로그아웃 (MORE-05)
- **D-20:** 확인 다이얼로그 ('로그아웃하시겠어요?' Cancel/Confirm) → signOut() → SecureStore 토큰 제거 → `/(auth)/login`으로 대체 (replace, 스택 초기화)
- **D-21:** 기존 `authStore.signOut()` 재사용, 커뮤니티/프로필 관련 TanStack Query cache invalidate

### Shop WebView (SHOP-01, SHOP-02)
- **D-22:** `react-native-webview` 도입 — Shop 탭 화면 전체를 embedded WebView로 구성 (x-square.kr 로드)
- **D-23:** 상단에 자체 컨트롤 헤더(48~56px, safe area 아래): 좌측 '뒤로가기'(WebView 히스토리 기반 disabled/enabled), 중앙 'Shop' 라벨, 우측 '새로고침'
- **D-24:** 인증/세션 전달 없음 — x-square.kr은 별도 상점으로 무명 방문 (MVP). SSO 연동은 v1.1
- **D-25:** 에러/오프라인: WebView `onError`/`onHttpError` → 전용 Fallback View ('Shop을 불러올 수 없어요' + 재시도 버튼 + 이전 탭 안내). 자동 재시도 없음
- **D-26:** 외부 링크(x-square.kr 외부 호스트): onShouldStartLoadWithRequest로 차단 후 expo-web-browser로 별도 오픈 — 앱 WebView가 외부 도메인으로 벗어나지 않게

### DM 플레이스홀더 (DMPL-01, DMPL-02)
- **D-27:** DM 탭 디자인 — 중앙 일러스트/Ionicons(chatbubbles-outline) + '곧 보이게 될 고유한 공간입니다' 카피 + Teal 'Notify Me' 버튼 (프라이머리 CTA 스타일)
- **D-28:** 'Notify Me' 저장 위치 — `profiles.dm_launch_notify` boolean 컬럼 추가 (마이그레이션 신규). 이미 ON이면 버튼 상태 'Notified'로 표시, 재탭 시 토스트 '이미 등록되었어요'
- **D-29:** DM 런칭 시점에 Edge Function으로 `dm_launch_notify=true` 유저에게 push fan-out (v1.1 구현 스코프, Phase 7은 컬럼과 UI만)

### App Store/Play Store 제출 준비
- **D-30:** 17+ 연령 등급 — App Store Connect 설문에서 성인 테마로 응답, Google Play는 IARC 설문으로 17+ 자동 산정. 앱 내 content_rating 필터/게이트 UI는 Phase 7 미구현(스키마만 존재, v1.1로 이연)
- **D-31:** 개인정보처리방침/약관 호스팅 — `apps/admin` Next.js(Cloudflare Pages)에 public `/privacy`, `/terms` 라우트 추가. admin 인증 경로와 분리된 public 라우트로 구현. 다국어 대응은 MVP에서 KO 우선 + EN. 별도 도메인 구매 없이 Cloudflare Pages 배정 도메인 사용
- **D-32:** Apple OAuth 감사 — Apple 심사 공식 체크리스트 전량 점검: 타 OAuth(Google) 제공 시 Apple OAuth 동등 표시, Hide My Email 지원 확인, 계정 삭제 경로 명시, Privacy URL 반영, 계정 삭제 경로 App Store Connect 제출 필드 기입
- **D-33:** 프로덕션 Supabase 프로젝트 독립 생성 — 현재 local/dev와 별도. supabase link → 전체 마이그레이션 push → Edge Functions 배포 → secrets(OpenAI, Expo Push, Google Translate) 설정. EAS build secrets도 프로덕션 값으로 분리
- **D-34:** 스크린샷 + 메타데이터 체크리스트 문서 (Phase 7 스코프) — iPhone 6.5"/6.7" + iPad 필수 스크린샷 사이즈, 앱 설명(KO/EN), 키워드, 지원 URL(admin 도메인 내 /support 또는 mailto). 스크린샷 촬영은 디자인 차원이라 코드 구현 없음, 체크리스트 문서와 제출 플로우만 Phase 7에 포함
- **D-35:** 앱 아이콘 + 스플래시 검증 — `app.json`에 이미 설정, 심사 일관성 재점검(그라디언트/라운딩/사이즈 1024x1024 마스크 포함). 에셋 변경 최소화
- **D-36:** iOS ATT (expo-tracking-transparency) — 설치하여 사용 없음 선언(현재 Analytics 미사용). App Store Connect 'Data Used to Track You' 섹션 'No' 일관 체크. Info.plist에 `NSUserTrackingUsageDescription` 미포함 (추적 미사용 시 권장)
- **D-37:** 계정 삭제 흐름 — **앱 내 즉시 삭제** 방식 채택. Edge Function `delete-user` 신설: auth.users + profiles + community_members + posts/comments(soft delete 표시 유지) + push_tokens + notification_preferences + follows 전부 정리. More → '계정 삭제' → 경고 화면(돌이킬 수 없음) → 타이핑 확인 'DELETE' → 최종 확인 → Edge Function 호출 → 즉시 로그아웃. Google Play DMA 요구사항 충족

### Claude's Discretion
- WebView 뒤로가기 버튼의 activated/disabled 표현 (투명도 vs 아이콘 스왑)
- 5탭 아이콘 선택 (Ionicons 계열 통일 — home / people / bag / chatbubbles / person)
- 프로필 편집 화면 저장 버튼 활성화 조건 (dirty state 감지 로직)
- 아바타 업로드 시 이미지 크롭/리사이즈 (expo-image-manipulator 사용 여부)
- 설정 화면 내 각 행의 세부 스타일 (구분선, 아이콘, chevron)
- DM 일러스트 소스 선택 (Ionicons vs 커스텀 SVG)
- `/privacy`, `/terms` MDX vs 정적 TSX 렌더링 방식
- delete-user Edge Function 내부 트랜잭션 처리 전략 (pg_function vs 순차 Supabase 호출)
- ATT 권한 요청 타이밍 (설치 안 하는 경우 Info.plist 처리)
- EAS 프로덕션 build profile 설정 (app.json runtime version 정책)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### 아키텍처 & 데이터 모델
- `docs/ARCHITECTURE.md` — profiles 테이블 ERD(§4), Edge Function 패턴(§5), RLS 역할 모델(§6), 인증 흐름(§7.1)
- `docs/PRD.md` — More 탭 요구사항, Shop 연동 범위, DM 기능의 v1.1 이연 근거

### UI/UX 가이드
- `docs/WEVERSE-UI-UX-GUIDE.md` — Weverse 5탭 하단 네비게이션, More/Profile 허브 패턴, Shop WebView 헤더 구성

### 스키마
- `packages/db/src/schema/auth.ts` — profiles 테이블 (globalNickname, avatarUrl, bio, language, dateOfBirth). `dm_launch_notify` 컬럼 마이그레이션 필요
- `packages/db/src/schema/notification.ts` — notification_preferences 테이블 (커뮤니티별 설정 재사용)
- `packages/db/src/schema/community.ts` — communities, communityMembers 테이블 (가입 커뮤니티 리스트 쿼리 소스)

### 프로젝트 계획
- `.planning/PROJECT.md` — 기술 스택, 제약, MVP 원칙, 다크 테마 토큰
- `.planning/REQUIREMENTS.md` — MORE-01~05, SHOP-01~02, DMPL-01~02 요구사항 상세
- `.planning/ROADMAP.md` — Phase 7 성공 기준 4개, 플랜 구성(07-01~02)

### 이전 Phase 컨텍스트 (계승 결정)
- `.planning/phases/02-auth-onboarding/02-CONTEXT.md` — 글로벌 프로필과 온보딩 분리 원칙, 닉네임 User#XXXX 자동생성, 세션 관리(SecureStore + signOut), 온보딩 language.tsx 선택 라디오 리스트
- `.planning/phases/03-community-core-content/03-CONTEXT.md` — expo-image-picker + Supabase Storage 업로드 패턴(아바타 업로드 재사용), PostCard 더보기 메뉴 패턴
- `.planning/phases/04-highlights-notices-notifications-translation/04-CONTEXT.md` — 알림 벨 뱃지 구현, notification_preferences 커뮤니티별 설정 화면
- `.planning/phases/05-home-feed-search-community-social/05-CONTEXT.md` — Home 헤더의 벨 배치, 탭 라우트 구조

### 앱 설정 & 제출
- `apps/mobile/app.json` — Expo 앱 아이콘/스플래시/bundleIdentifier/plugins 설정 (검증 대상)
- `apps/mobile/eas.json` — EAS build profile (production 프로필 보강 필요)
- `apps/mobile/stores/authStore.ts` — signOut 로직 (로그아웃 D-20에서 재사용)
- `apps/mobile/app/(onboarding)/language.tsx` — 언어 선택 패턴 (D-15에서 추출해 공유)
- `apps/mobile/app/(community)/[id]/notification-preferences.tsx` — 커뮤니티별 알림 설정 재사용 (D-18)

### 주의사항
- `.planning/STATE.md` — Pre-Phase 7 Blocker: Apple OAuth에 live privacy policy URL 필수 (D-31/D-32로 해소 예정)
- `.planning/STATE.md` — Phase 4 기준 push 알림 실기기 테스트 잔여 — Phase 7 EAS 프로덕션 빌드 단계에서 자연스럽게 병행 검증
- App Store / Google Play 2024 이후 요구사항: 앱 내 계정 삭제 경로 필수 (D-37)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/mobile/stores/authStore.ts` — `signOut()` 완전 구현, `profile` 상태. More 탭·설정 모든 곳에서 재사용
- `apps/mobile/hooks/useAuth.ts` — session/user/profile/signOut 조합 훅
- `apps/mobile/app/(onboarding)/language.tsx` — 언어 선택 라디오 리스트(50-60줄, 라벨·플래그·선택 스타일 포함) — 공통 LanguagePicker 컴포넌트로 추출 후 양쪽 재사용
- `apps/mobile/app/(community)/[id]/notification-preferences.tsx` — Switch 기반 설정 행 UI + useNotificationPreferences 훅. 재사용 대상
- `apps/mobile/hooks/notification/useNotificationPreferences.ts` — 커뮤니티별 알림 설정 CRUD
- `apps/mobile/components/post/DeleteConfirmDialog.tsx` — 확인 다이얼로그 패턴 (로그아웃/계정 삭제 확인에 참조)
- `apps/mobile/components/PrimaryCTAButton.tsx` — Teal 프라이머리 CTA (Notify Me 버튼에 재사용)
- `apps/mobile/components/community/LeaveConfirmDialog.tsx` — Alert 기반 확인 다이얼로그 패턴 (로그아웃 D-20에서 참조)
- `apps/mobile/hooks/community/useJoinCommunity.ts` (및 주변) — membership 데이터 접근 패턴 → 가입 커뮤니티 리스트 훅 신규 작성 시 참조
- `apps/admin/app/notices/` — Next.js Cloudflare Pages 페이지 패턴 → /privacy, /terms public 라우트 신규 작성 시 스캐폴딩 참조
- `packages/shared/src/i18n/locales/*/common.json` — 기존 i18n 네임스페이스 구조. Phase 7용 `more/settings/shop/dm/legal` 네임스페이스 신규 추가

### Established Patterns
- Expo Router 그룹 라우트: `(tabs)` / `(auth)` / `(community)` / `(onboarding)` — Phase 7은 `(tabs)/more.tsx`, `(tabs)/shop.tsx`, `(tabs)/dm.tsx` 추가 + `(more)` 또는 `(settings)` 그룹 추가 검토
- href:null 숨김 탭 — notifications 탭에서 이미 사용, Phase 7에서 settings 등 서브 화면 라우팅에도 적용 가능
- 다크 테마 토큰: bg-background (#000000), 카드 #1A1A1A, 액센트 Teal #00E5C3, muted #1C1C1E
- Nativewind v4 + `tailwind.config.js` 토큰 기반 스타일링
- Supabase Storage 이미지 업로드: Phase 3 post image upload 패턴 (avatars 버킷 신규 or reuse 여부 결정 필요)
- Edge Function: Deno.serve() + POST body (generate-nickname, notify, moderate 등 참조 패턴)

### Integration Points
- `apps/mobile/app/(tabs)/_layout.tsx` — 현재 Home/Community 2개 가시 탭 + notifications 숨김. 5탭으로 확장 (more, shop, dm 추가 + 순서 조정)
- `apps/mobile/app/(tabs)/more.tsx` (신규) — More 탭 엔트리 포인트
- `apps/mobile/app/(tabs)/shop.tsx` (신규) — Shop WebView 엔트리 포인트
- `apps/mobile/app/(tabs)/dm.tsx` (신규) — DM Coming Soon 플레이스홀더
- `apps/mobile/app/(more)/` (신규 그룹) — settings / profile-edit / joined-communities / about 등 More 하위 라우트
- `apps/mobile/app/(auth)/login.tsx` — 로그아웃 후 라우팅 타겟 (replace)
- `packages/db/src/schema/auth.ts` — `dm_launch_notify boolean default false` 추가 마이그레이션
- `packages/supabase/functions/delete-user/` (신규) — 계정 삭제 Edge Function
- `apps/admin/app/(public)/privacy/page.tsx`, `apps/admin/app/(public)/terms/page.tsx` (신규) — admin 앱의 public 라우트 그룹 추가
- `apps/mobile/package.json` — `react-native-webview`, `expo-tracking-transparency`, `expo-image-manipulator` 신규 의존성 추가 (Expo SDK 55 호환 버전 확인 필수)

</code_context>

<specifics>
## Specific Ideas

- 5탭 아이콘 — Weverse/Instagram 스타일: home / people / bag / chatbubbles / person (Ionicons outline / filled 상태)
- More 탭 프로필 카드 — Instagram 계정 허브 상단 카드 레퍼런스, 우측 상단 작은 '편집' 텍스트 버튼(아이콘 아님)
- 가입 커뮤니티 리스트 — 카카오톡 '오픈채팅 참여' 리스트 같이 커뮤니티 아이콘(원형, 40dp) + 이름 + 내 닉네임 서브타이틀
- Shop WebView 헤더 — 심플한 상단 바 (뒤로가기 / 중앙 'Shop' 얇게 / 새로고침) — Weverse Shop 레퍼런스
- DM Coming Soon — Notion의 '곧 출시' 페이지처럼 중앙 정렬, 여백 많음, 아이콘 크게, Teal CTA 버튼 하나
- 계정 삭제 경고 화면 — 'DELETE' 타이핑 확인 (GitHub 리포 삭제 스타일) — 실수 방지 강화
- 약관/개인정보처리방침 — admin Cloudflare Pages 기본 도메인 `/privacy`, `/terms` 공개 라우트 (인증 불필요), KO + EN 동시 노출

</specifics>

<deferred>
## Deferred Ideas

- **실제 DM 메시징** — v1.1 Jelly 결제와 함께 구현 (요구사항에 이미 out-of-scope로 명시)
- **Shop SSO 연동(URL 파라미터/JWT postMessage)** — v1.1, Wecord 계정-x-square.kr 연동 시점에
- **앱 내 content_rating 기반 콘텐츠 게이트/필터 UI** — 스키마는 있음, UI는 v1.1
- **커스텀 도메인(wecord.app 등) 연결** — admin 도메인 운영 안정화 후
- **다국어 약관/개인정보처리방침 전체(TH/ZH-CN/JA)** — Phase 7은 KO + EN, 나머지 3개 언어는 v1.0.1 패치
- **고객지원 인앱 폼** — Phase 7은 mailto 또는 지원 URL, 인앱 폼은 이후 phase

</deferred>

---

*Phase: 07-launch-polish*
*Context gathered: 2026-04-22*

---
phase: 07-launch-polish
verified: 2026-04-22T00:00:00Z
status: human_needed
score: 9/9 must-haves verified (code-side)
overrides_applied: 0
gaps: []
human_verification:
  - test: "App Store 및 Play Store 실제 제출 완료 확인"
    expected: "07-03-MANUAL-FOLLOWUP.md §1–9의 모든 단계가 완료되어 TestFlight/Play 내부 테스트에 빌드가 올라가 있어야 함"
    why_human: "Cloudflare Pages 배포, Supabase 프로덕션 링크, EAS 빌드, Apple/Google 콘솔 클릭은 워크트리에서 실행 불가 — 자격증명 + 외부 서비스 필요"
  - test: "법적 페이지(privacy / terms / account-delete-request / support) 실제 공개 접근 확인"
    expected: "https://wecord-docs.pages.dev/privacy 등이 HTTP 200을 반환하고 KO/EN 토글이 정상 동작"
    why_human: "Cloudflare Pages 배포가 07-03-MANUAL-FOLLOWUP.md §1에서 수동으로 진행되어야 함 — 배포 전에는 URLs가 404"
  - test: "WebView에서 x-square.kr 실제 로드 확인"
    expected: "Shop 탭 탭 시 x-square.kr가 앱 내 WebView로 열리고, 외부 도메인 링크는 시스템 브라우저로 핸드오프됨"
    why_human: "실물 기기 또는 시뮬레이터에서의 WebView 렌더링 동작 — 자동화 불가"
  - test: "DM 탭 Notify Me 플로우 실제 E2E 확인"
    expected: "Notify Me 탭 시 profiles.dm_launch_notify가 true로 업데이트되고, 재탭 시 alreadyNotifiedToast Alert가 표시됨"
    why_human: "실물 DB 연결 + 실제 유저 세션 필요 — 로컬 vitest 유닛테스트로는 DB write 검증 불가"
  - test: "앱 삭제 계정 플로우 end-to-end 확인"
    expected: "More → Settings → Delete Account 3탭 후 DELETE 입력, 처리 완료 시 login 화면으로 이동하고 data 삭제됨"
    why_human: "delete-user Edge Function은 프로덕션 Supabase + service_role key 필요; 로컬 smoke는 LOCAL 환경 전용"
  - test: "Apple Sign-in이 Google 위에 렌더링되는지 실물 기기 확인"
    expected: "iOS 기기에서 login.tsx 렌더링 시 Apple 버튼이 Google 버튼보다 위에 위치 (Guideline 4.8 준수)"
    why_human: "소스 오더 스냅샷 테스트로 코드상 순서는 검증됨 — 실제 UI 렌더링은 기기/시뮬레이터 확인 필요"
---

# Phase 7: Launch Polish Verification Report

**Phase Goal:** All remaining user-facing surfaces are complete and the app is ready for App Store and Play Store submission
**Verified:** 2026-04-22
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can navigate the More tab to edit their global profile (nickname, avatar, bio), change language setting, view joined communities list, access app settings (language, notifications), and log out | VERIFIED | `apps/mobile/app/(tabs)/more.tsx` — ProfileCard + JoinedCommunityRow + SettingsRow + Logout Alert; `(more)/profile-edit.tsx` + `useUpdateProfile` + `useUploadAvatar`; `(more)/language.tsx` + LanguagePicker; `(more)/settings.tsx` + usePushPermission; authStore.signOut + onSignOut callback |
| 2 | Shop tab loads x-square.kr in an in-app WebView with working back and refresh navigation controls | VERIFIED | `apps/mobile/app/(tabs)/shop.tsx` → `ShopWebView.tsx`; WebView source `https://${SHOP_ALLOWED_HOST}` (= x-square.kr); ShopHeader with onBack/onRefresh; canGoBack state wired; onShouldStartLoadWithRequest uses `isAllowedHost`; HTTP 5xx → ShopErrorFallback |
| 3 | DM tab shows a "Coming Soon" placeholder with a "Notify Me" button that saves the user's notification preference | VERIFIED | `apps/mobile/app/(tabs)/dm.tsx` → `DmPlaceholder.tsx`; chatbubbles-outline 96px; `useDmLaunchNotify` hook writes `dm_launch_notify=true` to `profiles` table; Pitfall 10 double-tap guard implemented |
| 4 | App is submitted to App Store and Play Store with 17+ content rating, live privacy policy URL, and Apple OAuth requirements met | PARTIAL (human needed) | Code-side: `07-SUBMISSION-CHECKLIST.md` + `07-UGC-COMPLIANCE-EVIDENCE.md` authored; `apps/admin/(public)/` 4 legal pages created; `eas.json` production profile populated; `app.json` runtimeVersion/buildNumber/versionCode/infoPlist set; Apple Sign-in above Google (source-order snapshot test). Deferred: Cloudflare Pages deploy, EAS build, actual store submission — all captured in `07-03-MANUAL-FOLLOWUP.md` |

**Score:** 9/9 requirement IDs verified (code-side); SC4 has manual steps pending

---

### Deferred Items (SC4 manual steps — not code gaps)

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Cloudflare Pages 배포 (privacy/terms/support/account-delete-request 공개 URL) | 07-03-MANUAL-FOLLOWUP.md §1 | wrangler.toml + apps/admin/(public)/ 4페이지 코드 완료; 배포 명령 runbook에 기록 |
| 2 | Supabase 프로덕션 프로젝트 생성 + db push | 07-03-MANUAL-FOLLOWUP.md §2–4 | 마이그레이션 파일 3개 준비됨 (dm_launch_notify, avatars bucket, delete_account RPC) |
| 3 | EAS 빌드 + TestFlight/Play 제출 | 07-03-MANUAL-FOLLOWUP.md §7–8 | eas.json production 프로파일 + app.json production 필드 완료; ascAppId/serviceAccountKeyPath TBD 마커 남음 |
| 4 | OAuth 등록 (Google/Apple 콘솔 redirect URI) | 07-03-MANUAL-FOLLOWUP.md §5–6 | 코드-사이드 ready; 콘솔 클릭 필요 |

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|---------|--------|---------|
| `apps/mobile/app/(tabs)/_layout.tsx` | 5탭 네비게이션 (notifications hidden via href:null) | VERIFIED | 5 Tabs.Screen (index/community/shop/dm/more) + notifications href:null 확인 |
| `apps/mobile/app/(tabs)/more.tsx` | More 허브 (ProfileCard + 가입 커뮤니티 + Settings + About + Logout) | VERIFIED | ProfileCard, JoinedCommunityRow, SettingsRow, logout Alert.alert 모두 구현됨 |
| `apps/mobile/app/(more)/profile-edit.tsx` | 닉네임+바이오+아바타 프로필 편집 (dirty-state Save 버튼) | VERIFIED | useUpdateProfile + useUploadAvatar + useDirtyState 모두 import/사용; nicknameValid + isDirty 가드 |
| `apps/mobile/app/(more)/settings.tsx` | iOS-style 설정 (Language / Push / Terms / Privacy / Version / Delete Account) | VERIFIED | usePushPermission + Linking.openSettings 사용; reconcilePushToggle 호출; PROD_ADMIN_URL 상수 |
| `apps/mobile/app/(more)/joined-communities.tsx` | 가입 커뮤니티 목록 (useMyCommunities 기반) | VERIFIED | useMyCommunities + JoinedCommunityRow 사용 |
| `apps/mobile/components/settings/LanguagePicker.tsx` | 라디오 언어 피커 공유 컴포넌트 | VERIFIED | 존재 확인; language.tsx에서 import |
| `apps/mobile/components/settings/SettingsRow.tsx` | 설정 행 프리미티브 | VERIFIED | 존재 확인; more.tsx, settings.tsx에서 사용 |
| `apps/mobile/components/more/AvatarActionSheet.tsx` | useAvatarActionSheet 훅 (4 옵션) | VERIFIED | 존재 확인; profile-edit.tsx에서 useAvatarActionSheet import/사용 |
| `apps/mobile/hooks/profile/useUpdateProfile.ts` | 낙관적 프로필 변경 mutation | VERIFIED | 존재; supabase.from('profiles').update().eq('user_id', user.id) 실사용; onMutate/onError/onSettled 구현 |
| `apps/mobile/hooks/profile/useUploadAvatar.ts` | 아바타 업로드 훅 (512x512 resize + avatars bucket) | VERIFIED | 존재 확인 |
| `apps/mobile/hooks/community/useMyCommunities.ts` | 가입 커뮤니티 TanStack Query 훅 | VERIFIED | supabase.from('community_members').select('...communities!inner(...)') 실쿼리 |
| `packages/shared/src/i18n/locales/ko/more.json` | 한국어 More 탭 복사본 | VERIFIED | "프로필 편집" 포함 확인 |
| `packages/shared/src/i18n/locales/en/more.json` | 영어 More 탭 복사본 | VERIFIED | "Edit profile" 포함 확인 |
| `packages/shared/src/i18n/locales/ko/settings.json` | 한국어 Settings 복사본 | VERIFIED | "푸시 알림" 포함 확인 |
| `packages/shared/src/i18n/locales/en/settings.json` | 영어 Settings 복사본 | VERIFIED | "Push notifications" 포함 확인 |
| `apps/mobile/app/(tabs)/shop.tsx` | Shop WebView 탭 | VERIFIED | ShopWebView 컴포넌트 렌더링; x-square.kr 소스 |
| `apps/mobile/app/(tabs)/dm.tsx` | DM Coming Soon + Notify Me 탭 | VERIFIED | DmPlaceholder 렌더링 |
| `apps/mobile/components/shop/ShopWebView.tsx` | WebView + allowlist + error fallback | VERIFIED | isAllowedHost 사용; onShouldStartLoadWithRequest; onError/onHttpError → ShopErrorFallback |
| `apps/mobile/components/shop/isAllowedHost.ts` | URL 허용목록 헬퍼 (https + x-square.kr 전용) | VERIFIED | protocol=https: 체크 + hostname exact/subdomain 매칭; '.'+ALLOWED_HOST prefix 경계 가드 |
| `apps/mobile/components/dm/DmPlaceholder.tsx` | DM 플레이스홀더 UI | VERIFIED | chatbubbles-outline 96px; PrimaryCTAButton / 완료 상태 토글 |
| `apps/mobile/hooks/dm/useDmLaunchNotify.ts` | Notify Me mutation 훅 | VERIFIED | shouldSkipMutation (Pitfall 10); supabase 'profiles' update; onSuccess setProfile |
| `apps/mobile/app/(more)/delete-account/` | 3-화면 계정 삭제 플로우 | VERIFIED | _layout.tsx + warning.tsx + confirm.tsx + processing.tsx 존재 확인 |
| `packages/supabase/functions/delete-user/index.ts` | delete-user Edge Function | VERIFIED | JWT→user.id; Storage cleanup; Apple revoke; delete_account RPC; auth.admin.deleteUser 전체 플로우 |
| `packages/supabase/migrations/20260422000001_phase7_profile_dm_launch_notify.sql` | dm_launch_notify 컬럼 추가 | VERIFIED | ALTER TABLE profiles ADD COLUMN dm_launch_notify boolean NOT NULL DEFAULT false |
| `packages/supabase/migrations/20260422000006_phase7_avatars_bucket.sql` | avatars 버킷 + RLS 정책 | VERIFIED | 2MB cap, MIME 허용목록, avatars_insert_own/avatars_update_own/avatars_delete_own/avatars_select_own 정책 |
| `packages/supabase/migrations/20260422000007_phase7_delete_account_rpc.sql` | delete_account(uuid) RPC | VERIFIED | SECURITY DEFINER; posts/comments soft-delete+scrub; 사이드 테이블 하드 삭제; profiles 마지막 삭제 |
| `apps/admin/app/(public)/layout.tsx` | Admin 공개 route 레이아웃 (인증 가드 없음) | VERIFIED | 존재 확인 |
| `apps/admin/app/(public)/privacy/page.tsx` | 개인정보처리방침 페이지 | VERIFIED | PRIVACY_KO/EN 렌더링; ?lang= 토글 |
| `apps/admin/app/(public)/terms/page.tsx` | 서비스 이용약관 페이지 | VERIFIED | 존재 확인 |
| `apps/admin/app/(public)/account-delete-request/page.tsx` | 계정 삭제 요청 페이지 | VERIFIED | 존재 확인 |
| `apps/admin/app/(public)/support/page.tsx` | 지원 페이지 | VERIFIED | 존재 확인 |
| `apps/admin/lib/legal-content.ts` | 법적 콘텐츠 상수 8개 | VERIFIED | Supabase/Expo Push/Google Translate/OpenAI Moderation 4개 프로세서 모두 포함 |
| `apps/admin/wrangler.toml` | Cloudflare Pages 배포 템플릿 | VERIFIED | 존재 확인; project-name=wecord-docs; output dir .open-next/assets |
| `apps/mobile/eas.json` | EAS 프로덕션 빌드 프로파일 | VERIFIED | build.production (environment/autoIncrement/channel) + submit.production (ios.ascAppId TBD, android.serviceAccountKeyPath) |
| `apps/mobile/app.json` | 프로덕션 앱 메타데이터 | VERIFIED | runtimeVersion.policy=appVersion; ios.buildNumber=1; NSCameraUsageDescription/NSPhotoLibraryUsageDescription; android.versionCode=1 |
| `.planning/phases/07-launch-polish/07-SUBMISSION-CHECKLIST.md` | App Store + Play Console 제출 체크리스트 | VERIFIED | Apple 1.2 (6행) + Apple 4.8 (10행) + Google DMA (6행) + T-7-* 위협 감사 테이블 |
| `.planning/phases/07-launch-polish/07-UGC-COMPLIANCE-EVIDENCE.md` | UGC 준수 증거 | VERIFIED | 4개 메커니즘 모두 파일:라인 인용으로 감사됨 |
| `.planning/phases/07-launch-polish/07-03-MANUAL-FOLLOWUP.md` | 수동 후속 조치 런북 | VERIFIED | 9개 섹션; 상태 체크박스; 플랜 작업 번호 매핑 테이블 |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `(tabs)/_layout.tsx` | `(tabs)/more.tsx` | `Tabs.Screen name="more"` | WIRED | 확인됨 |
| `(tabs)/_layout.tsx` | notifications 숨김 | `href: null` | WIRED | notifications Tabs.Screen에서 href:null 확인 |
| `(tabs)/more.tsx` | `(more)/profile-edit.tsx` | `router.push('/(more)/profile-edit')` | WIRED | ProfileCard의 편집 버튼에서 push 호출 |
| `(more)/profile-edit.tsx` | useUpdateProfile + useUploadAvatar | hook 호출 on Save | WIRED | import 및 mutateAsync 사용 확인 |
| `(more)/language.tsx` | `LanguagePicker.tsx` | `import + mode="settings"` | WIRED | import + 렌더링 확인 |
| `(more)/settings.tsx` | expo-notifications.getPermissionsAsync + Linking.openSettings | reconcilePushToggle | WIRED | usePushPermission.ts line 37 getPermissionsAsync; line 34 openSettings |
| authStore.signOut | queryClient.clear + router.replace | registerOnSignOut callback | WIRED | _layout.tsx line 30-31: queryClient.clear 등록; more.tsx signOut 후 router.replace('/(auth)/login') |
| `ShopWebView.tsx` | isAllowedHost | onShouldStartLoadWithRequest | WIRED | isAllowedHost(req.url) 호출 확인 |
| `DmPlaceholder.tsx` | useDmLaunchNotify | notify() | WIRED | import + 사용 확인 |
| `useDmLaunchNotify.ts` | supabase profiles.dm_launch_notify | buildUpdatePayload() | WIRED | supabase.from('profiles').update(buildUpdatePayload()).eq(filterCol, filterVal) |
| `JoinedCommunityRow.tsx` | `/(community)/[id]` | router.push | WIRED | `/(community)/${community.communityId}` 확인 |
| `(more)/settings.tsx` | delete-account 화면 | router.push | WIRED | settings.tsx에서 delete-account 라우트로 연결 |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| `ProfileCard.tsx` | `profile` | `authStore.profile` (prop from more.tsx) | Yes — authStore는 Supabase profiles 테이블에서 fetch | FLOWING |
| `JoinedCommunityRow.tsx` | `community` | `useMyCommunities()` → supabase community_members !inner join | Yes — 실제 DB 쿼리 | FLOWING |
| `DmPlaceholder.tsx` | `isNotified` | `profile.dmLaunchNotify` (authStore) | Yes — profiles.dm_launch_notify 컬럼 | FLOWING |
| `ShopWebView.tsx` | WebView source | `SHOP_ALLOWED_HOST` 상수 (`x-square.kr`) | Yes — 외부 URL (WebView 렌더링) | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — 앱 진입점이 실물 기기/시뮬레이터 실행을 필요로 하며 서버 없이 단독 실행 불가. 핵심 순수 함수 유닛테스트(isAllowedHost, shouldSkipMutation, buildUpdateFilter 등)는 vitest 99개 테스트 통과로 문서화됨(07-02-SUMMARY.md).

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| MORE-01 | 07-01 | User can edit global profile (nickname, avatar, bio) | SATISFIED | `(more)/profile-edit.tsx` + useUpdateProfile + useUploadAvatar + useDirtyState |
| MORE-02 | 07-01 | User can change language setting | SATISFIED | `(more)/language.tsx` + LanguagePicker + i18n.changeLanguage + profiles.language 업데이트 |
| MORE-03 | 07-01 | User can view list of joined communities | SATISFIED | `(more)/joined-communities.tsx` + useMyCommunities + JoinedCommunityRow (커뮤니티 클릭 → 커뮤니티 이동) |
| MORE-04 | 07-01 | User can access app settings (language, notifications) | SATISFIED | `(more)/settings.tsx` + usePushPermission (OS 권한 조정) + 언어 피커 연결 |
| MORE-05 | 07-01 | User can log out | SATISFIED | Alert.alert Cancel+destructive; authStore.signOut (try/finally); queryClient.clear; router.replace('/(auth)/login') |
| SHOP-01 | 07-02 | Shop tab displays x-square.kr in WebView | SATISFIED | `(tabs)/shop.tsx` → ShopWebView; source=https://x-square.kr |
| SHOP-02 | 07-02 | In-app WebView navigation (back, refresh) | SATISFIED | ShopHeader.tsx; canGoBack 상태; onBack/onRefresh 핸들러 |
| DMPL-01 | 07-02 | DM tab shows "Coming Soon" placeholder screen | SATISFIED | `(tabs)/dm.tsx` → DmPlaceholder; chatbubbles-outline 96px; heading/body 텍스트 |
| DMPL-02 | 07-02 | DM tab has "Notify Me" button (saves to notification_preferences) | SATISFIED | useDmLaunchNotify; profiles.dm_launch_notify 업데이트; Pitfall 10 double-tap guard |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `apps/mobile/app/(tabs)/more.tsx` | 157-162 | About 섹션의 두 번째 `SettingsRow`가 `t('about.versionLabel')`을 label로 사용하며 주석에 "placeholder; legal rows live in settings" 표기 | Warning | UI 미완성 — About 섹션에 더미 행이 노출됨 (법적 링크는 Settings 화면에 있으므로 기능에는 영향 없으나 UX 이중 노출) |

**경감:** 법적 링크(Terms/Privacy)는 same screen 하단 Pressable과 Settings 화면 양쪽에 있어 접근 가능. About의 두 번째 행은 비어있는 placeholder로 사용자에게 노출되지만 기능 블로커는 아님.

---

### Human Verification Required

#### 1. App Store + Play Store 실제 제출

**Test:** `07-03-MANUAL-FOLLOWUP.md` §1–9 순서대로 실행 (Cloudflare Pages 배포 → Supabase 프로덕션 생성 → EAS 빌드 → TestFlight/Play Console 제출)
**Expected:** 각 단계 체크박스 완료; TestFlight 또는 Play 내부 테스트에서 빌드 접근 가능
**Why human:** 자격증명(SUPABASE_ACCESS_TOKEN, EXPO_ACCESS_TOKEN, Apple/Google 콘솔 계정) 필요; 브라우저 콘솔 클릭 필요; EAS CLI는 로컬 환경에서만 실행 가능

#### 2. 법적 페이지 공개 접근 확인

**Test:** `curl -sfI https://wecord-docs.pages.dev/privacy | head -1` — HTTP 200 확인; KO/EN 토글 동작 확인
**Expected:** 모든 4개 경로(/privacy, /terms, /account-delete-request, /support)가 200 반환
**Why human:** Cloudflare Pages 배포가 선행되어야 함

#### 3. Shop 탭 WebView 실제 동작 확인

**Test:** 실물 기기/시뮬레이터에서 Shop 탭 탭; x-square.kr 로드 후 외부 링크 탭
**Expected:** x-square.kr이 앱 내 WebView로 로드됨; 외부 도메인 링크는 시스템 브라우저로 열림; 뒤로가기/새로고침 버튼 동작 확인
**Why human:** WebView 렌더링 및 URL 인터셉트는 자동화 불가

#### 4. DM 탭 Notify Me E2E 확인

**Test:** 실물 기기에서 DM 탭 탭 → Notify Me 버튼 탭; Supabase 대시보드에서 profiles 테이블 dm_launch_notify 값 확인
**Expected:** dm_launch_notify=true로 업데이트됨; 재탭 시 Toast Alert 표시
**Why human:** 실제 DB 연결 및 유저 세션 필요

#### 5. Apple Sign-In 버튼 위치 실물 확인

**Test:** iOS 기기에서 login.tsx 실행; 버튼 순서 육안 확인
**Expected:** Apple Sign-In 버튼이 Google Sign-In 버튼보다 위에 위치 (Guideline 4.8)
**Why human:** 소스 오더 스냅샷 테스트로 코드 순서 보장됨; 실제 렌더링 시각적 확인 필요

#### 6. 계정 삭제 플로우 E2E 확인

**Test:** 테스트 계정으로 More → Settings → Delete Account → DELETE 입력 → 처리 완료
**Expected:** 계정이 삭제되고 login 화면으로 이동; DB에서 해당 사용자 데이터 제거 확인
**Why human:** delete-user Edge Function은 프로덕션 또는 로컬 Supabase 컨테이너 + service_role key 필요

---

### Gaps Summary

코드-사이드 갭 없음. 모든 9개 요구사항(MORE-01..05, SHOP-01, SHOP-02, DMPL-01, DMPL-02)이 실제 코드로 구현되어 있고, 아티팩트는 존재하며, 핵심 링크가 연결되어 있고, 데이터가 실제 소스에서 흐른다.

**미완료 항목은 모두 의도적으로 수동 단계로 위임됨:** Wave 3(07-03)은 CODE+DOCS-ONLY 모드로 실행되었으며, 크리덴셜 의존 단계(Cloudflare Pages 배포, EAS 빌드, 앱스토어/플레이 콘솔 제출, OAuth 등록)는 `07-03-MANUAL-FOLLOWUP.md`에 구체적인 명령어와 함께 문서화됨.

**경미한 경고 1건:** more.tsx의 About 섹션 두 번째 SettingsRow가 placeholder 라벨을 사용하고 있으나, 법적 링크는 Settings 화면 및 하단 Pressable 양쪽에서 접근 가능하므로 기능 블로커 아님.

---

_Verified: 2026-04-22_
_Verifier: Claude (gsd-verifier)_

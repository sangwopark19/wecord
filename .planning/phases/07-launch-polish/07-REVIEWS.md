---
phase: 7
reviewers: [codex]
reviewed_at: 2026-04-22T02:31:41Z
plans_reviewed:
  - 07-01-PLAN.md
  - 07-02-PLAN.md
  - 07-03-PLAN.md
skipped:
  - claude — running inside Claude Code CLI (self-skip for independence)
  - cursor — CLI present but not authenticated (run `cursor agent login` or set CURSOR_API_KEY)
  - gemini/opencode/qwen/coderabbit — not installed
---

# Cross-AI Plan Review — Phase 7 (Launch Polish)

## Codex Review

**전체 판단**

계획은 기능 구현 관점에서는 상당히 촘촘합니다. More / Shop / DM / account deletion / production cutover까지 요구사항을 넓게 커버하고, 테스트·threat model·manual checkpoint도 잘 잡혀 있습니다. 다만 "스토어 제출 가능"을 목표로 보면 아직 HIGH 리스크입니다. 특히 UGC moderation/report/block, Sign in with Apple token revocation, legal/support URL, production Supabase cutover 안전장치가 제출 전 blocker입니다.

### Plan 07-01 — More Hub

**Summary:** More 탭과 profile/settings 흐름은 기존 Phase 패턴을 잘 재사용합니다. 다만 07-01 단독 실행 시 `shop`/`dm` route가 없는 상태로 5-tab을 선언하는 점, app UI 5개 언어 요구와 ko/en only 리소스가 충돌하는 점이 큽니다.

**Strengths:**
- 기존 `authStore`, onboarding language picker, notification preferences 패턴 재사용이 좋습니다.
- `queryClient.clear()`를 logout에 포함하려는 방향은 맞습니다.
- Profile update / avatar upload / joined communities 훅을 분리한 점은 테스트와 유지보수에 유리합니다.
- Apple Sign-In prominence snapshot을 Phase 7 gate로 묶은 점은 좋습니다.

**Concerns:**
- **HIGH** — 07-01에서 `shop`/`dm` Tabs.Screen을 추가하지만 route 파일은 07-02에 생성됩니다. Expo Router에서 "없는 route" 경고/오류가 날 수 있습니다.
- **MEDIUM** — `expo-tracking-transparency`를 07-01에서 설치하고 07-03에서는 plugin을 넣지 않겠다고 합니다. 추적 미사용이면 패키지 자체도 빼는 쪽이 더 깔끔합니다.
- **MEDIUM** — app UI는 5개 언어가 기존 constraint인데 More/Settings는 ko/en만 추가하고 th/zh/ja는 ko fallback입니다.
- **MEDIUM** — `authStore`가 `queryClient`를 직접 import하면 dependency cycle 가능성이 있습니다.
- **LOW** — Push "OFF" UX가 실제 OS permission을 끌 수 없는데 switch 상태가 다시 ON으로 복귀할 수 있습니다.

**Suggestions:**
- 07-01 Task 3에서 `shop.tsx`, `dm.tsx` minimal placeholder를 먼저 생성하세요.
- More/Settings/Shop/DM의 th/zh/ja JSON도 최소 번역으로 추가하세요.
- `expo-tracking-transparency`는 실제 ATT 요청 전까지 dependency에서도 제거하는 편이 낫습니다.
- `queryClient.clear()`는 `authStore` 직접 import 대신 `signOutAndRedirect` hook 또는 injected cleanup으로 분리하는 방식을 검토하세요.

**Risk Assessment:** MEDIUM. 기능 설계는 좋지만 route ordering, i18n, native dependency 정리가 필요합니다.

### Plan 07-02 — Shop / DM / Account Deletion

**Summary:** Shop WebView와 DM placeholder는 적절한 범위입니다. 그러나 account deletion은 데이터·인증·스토어 심사 모두와 연결된 고위험 작업인데, 현재 계획은 삭제 대상 inventory와 Apple token revocation이 부족합니다.

**Strengths:**
- WebView hostname allowlist, `sharedCookiesEnabled={false}`, external browser escape는 방향이 좋습니다.
- `delete-user` Edge Function이 JWT에서 user id를 추출하고 request body를 신뢰하지 않는 점은 맞습니다.
- `delete_account()` RPC를 service_role 전용으로 잠그는 설계는 Supabase/RLS 관점에서 안전합니다.
- DM Notify Me의 double-tap guard는 작은 UX 리스크를 잘 잡았습니다.

**Concerns:**
- **HIGH** — Apple Sign in with Apple 사용자의 account deletion 시 token revocation 흐름이 없습니다. Apple은 Sign in with Apple token revocation을 권장/요구 수준으로 안내합니다.
- **HIGH** — 삭제 대상 테이블이 추정 기반입니다. posts/comments/likes/reports 외에도 media storage, avatars, translations, reports target data, notifications, community-created data 등 user-owned data 전체 inventory가 필요합니다.
- **HIGH** — posts/comments를 `deleted_at`만 설정하면 개인정보/UGC가 실제로 남습니다. privacy policy에 retention 근거를 명시하거나 body/media/avatar를 scrub/delete해야 합니다.
- **HIGH** — `wv_test_delete_account_smoke()`를 migration으로 production에 배포하는 것은 좋지 않습니다. test helper는 prod schema에 남기지 않는 편이 안전합니다.
- **MEDIUM** — WebView allowlist가 protocol을 제한하지 않습니다. `https:`만 허용해야 합니다.
- **MEDIUM** — Storage `UPDATE` policy에는 `WITH CHECK`도 넣어야 object 이동/rename 계열 우회 여지를 줄일 수 있습니다.
- **MEDIUM** — Edge Function test mocking 전략이 계획 안에서 흔들립니다. 처음부터 `handler(req, deps)` 형태로 설계하세요.

**Suggestions:**
- `rg "user_id|userId|author_id|authorId|profile_id|created_by"` 기반 deletion inventory task를 Task 2 앞에 추가하세요.
- Account deletion에 Apple token revocation 또는 "manual revoke 안내 + 서버 data delete" fallback을 명시하세요.
- 삭제 시 `profiles`, `avatars` bucket object, post/comment media까지 cleanup하거나 scrub 정책을 문서화하세요.
- `wv_test_delete_account_smoke`는 migration이 아니라 `tests/sql/` 또는 local-only seed script로 이동하세요.
- WebView `isAllowedHost`는 `url.protocol === 'https:'`까지 확인하세요.

**Risk Assessment:** HIGH. 가장 중요한 보안/컴플라이언스 작업이며, 현재는 삭제 완전성과 Apple OAuth 삭제 요건이 미흡합니다.

### Plan 07-03 — Public Legal / Production / Submission

**Summary:** 제출 runbook과 checkpoint는 실용적입니다. 하지만 legal 문서, support URL, OAuth production 설정, Supabase prod link 절차에 심사/운영 리스크가 남아 있습니다.

**Strengths:**
- human checkpoint를 명확히 둔 점이 좋습니다.
- Cloudflare public route group을 admin auth와 분리하는 방향은 맞습니다.
- Supabase secrets에서 service_role을 mobile/EAS에 넣지 않는 점은 중요합니다.
- submission checklist를 artifact로 남기는 방식은 솔로 개발자 운영에 적합합니다.

**Concerns:**
- **HIGH** — Apple UGC 요구사항이 빠져 있습니다. 이 앱은 UGC/social app이므로 objectionable content filtering, report mechanism, abusive user blocking, published contact가 제출 blocker입니다.
- **HIGH** — `mailto:`를 Support URL로 쓰는 계획은 위험합니다. App Store Connect는 support website URL을 요구합니다.
- **HIGH** — `user_setup`에는 production OAuth client를 새로 만들겠다고 하면서도 "copy client IDs + secrets from dev"라고 되어 있어 모순됩니다.
- **HIGH** — Supabase production `link` 후 `db push/functions deploy`가 linked project에 의존합니다. 실수로 dev/prod를 오갈 수 있으므로 `--project-ref $PROD_REF`와 `supabase migration list` 확인을 강제해야 합니다.
- **MEDIUM** — Privacy/Terms placeholder가 너무 얇습니다. Supabase, Expo Push, Google Translate/OpenAI, UGC moderation, data retention, deletion, international transfer가 반영되어야 합니다.
- **MEDIUM** — App Review demo account 전략이 문서 내에서 "dedicated demo account"와 "reviewer own Apple ID"로 섞여 있습니다.
- **MEDIUM** — `pages.dev` 자체는 가능성이 있지만, support/privacy/legal 신뢰도를 위해 `/support` route와 branded domain을 최소한 준비하는 편이 낫습니다.

**Suggestions:**
- `/support` public route를 추가하고 App Store / Play Console Support URL은 `https://<domain>/support`로 쓰세요.
- 07-03 전에 "UGC compliance mini-plan"을 넣으세요: 신고, 차단, 필터링, 운영자 contact, moderation SLA.
- Production Supabase 작업은 가능하면 separate worktree/CI에서 실행하고, 모든 CLI 명령에 `--project-ref`를 붙이세요.
- OAuth는 production Google OAuth client + Apple Services ID를 새로 만들고, Supabase Auth redirect URL뿐 아니라 app deep link redirect allowlist도 확인하세요.
- Legal text는 placeholder가 아니라 실제 data map 기반으로 작성해야 합니다.

**Risk Assessment:** HIGH. 코드보다 외부 상태와 심사 정책 리스크가 큽니다.

### 최종 권고

Phase 7은 "기능 polish"라기보다 "launch gate"입니다. 현재 3개 plan은 기능 구현은 달성할 수 있지만, 제출 성공 확률을 높이려면 다음을 blocker로 올려야 합니다:

- UGC 신고/차단/필터링/contact 구현 또는 기존 구현 검증
- Sign in with Apple account deletion token revocation 대응
- Account deletion data inventory + storage/media cleanup
- Web support URL 추가
- Production Supabase cutover 안전장치 강화
- 5-language UI copy 완성

**참고 문서:** Apple UGC guideline 1.2, Login Services 4.8, Privacy/account deletion 5.1.1, Apple account deletion guidance, Google Play account deletion requirements, Supabase production/secrets docs, App Store screenshot/support URL docs.

**Sources:** [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), [Apple account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app/), [Google Play account deletion](https://support.google.com/googleplay/android-developer/answer/13327111), [Google Data safety](https://support.google.com/googleplay/android-developer/answer/10787469), [Supabase secrets](https://supabase.com/docs/guides/functions/secrets), [App Store Connect screenshot/support specs](https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications).

---

## Consensus Summary

> 단일 리뷰어(codex)만 응답했으므로 일반적인 cross-AI consensus는 생성되지 않았습니다. 아래는 codex 리뷰 내부에서 여러 plan에 걸쳐 반복적으로 나타난 항목을 정리한 것입니다. 두 번째 리뷰어를 원하시면 `cursor agent login` 또는 `gemini` 설치 후 `/gsd-review --phase 7 --cursor` 또는 `--gemini`로 재실행하세요.

### Agreed Strengths (반복 언급)
- 기존 Phase 2~5 자산 재사용(authStore, onboarding language picker, notification preferences, post image upload 패턴).
- service_role 노출 없는 Edge Function + RPC 분리 설계.
- Human checkpoint와 submission checklist artifact 중심 운영.

### Agreed Concerns (가장 높은 우선순위)
1. **Apple/Google 심사 blocker가 plan에서 누락** — UGC report/block/filter/contact (Guideline 1.2), Apple Sign in with Apple token revocation (Guideline 4.8 + account deletion), support website URL (mailto 불가).
2. **Account deletion 완전성 부족** — 삭제 대상 테이블/스토리지 객체 inventory 없음, posts/comments `deleted_at`만으로는 개인정보 실제 잔존, avatars/post media 정리 미명시.
3. **Production Supabase cutover 안전장치 부족** — `supabase link` 후 암묵적 project 사용, `--project-ref` 강제 없음, 실수로 dev/prod 혼동 가능.
4. **Plan 간 ordering 부정합** — 07-01의 5-tab 선언은 07-02의 route 파일에 의존 → 07-01 단독 실행 시 Expo Router 에러 가능.
5. **i18n scope 불일치** — 5개 언어가 제품 constraint인데 Phase 7은 ko/en만 추가, th/zh/ja는 ko fallback.
6. **Test helper를 prod migration으로 배포** — `wv_test_delete_account_smoke()`가 production schema에 남음.

### Divergent Views
해당 사항 없음(단일 리뷰어).

### Action Items to Feed Back into Planning

다음 단계로 `/gsd-plan-phase 7 --reviews`를 실행하면 위 피드백을 반영한 plan 갱신이 가능합니다. 특히 아래 항목은 blocker로 승격 권장:

- [ ] **07-01**: `shop.tsx`, `dm.tsx` placeholder를 Task 3에서 먼저 생성하도록 순서 조정
- [ ] **07-01**: th/zh/ja i18n 리소스를 Phase 7 완료 조건에 포함
- [ ] **07-01**: `authStore → queryClient` 직접 의존을 injected cleanup으로 분리
- [ ] **07-02**: deletion inventory 작업을 Task 2 앞에 추가(`user_id|author_id|created_by` grep 기반)
- [ ] **07-02**: Apple Sign in with Apple token revocation 흐름 명시
- [ ] **07-02**: avatar/post media storage cleanup을 `delete_account` RPC/Edge Function에 포함
- [ ] **07-02**: `wv_test_delete_account_smoke`를 migration에서 제거하고 `tests/sql/`로 이동
- [ ] **07-02**: WebView allowlist에 `url.protocol === 'https:'` 체크 추가
- [ ] **07-03**: `/support` public route 추가하고 Support URL을 `https://<domain>/support`로 지정
- [ ] **07-03**: UGC compliance mini-plan(신고/차단/필터/contact/SLA) 추가
- [ ] **07-03**: Supabase CLI 전 호출에 `--project-ref $PROD_REF` 강제
- [ ] **07-03**: production OAuth는 신규 Google Client + Apple Services ID 생성으로 일관화(dev 복사 금지)
- [ ] **07-03**: Privacy/Terms 문안을 data map(Supabase, Expo Push, Google Translate, OpenAI Moderation, 국외이전, retention, deletion) 기반으로 실작성

---
created: 2026-03-23T08:48:36.218Z
title: 실기기 Push 알림 수신 테스트
area: testing
files:
  - packages/supabase/functions/notify/index.ts
  - apps/mobile/hooks/notification/usePushTokenRegistration.ts
  - packages/supabase/migrations/20260320300000_notification_triggers.sql
  - packages/supabase/migrations/20260321000000_member_post_notify_trigger.sql
  - packages/supabase/migrations/20260320200000_notice_publish_trigger.sql
---

## Problem

Phase 04 human verification에서 Push 알림 수신 테스트가 남아 있으나, 현재 실제 디바이스에 앱 설치가 불가능하여 테스트를 진행할 수 없음. Push 알림은 시뮬레이터/Expo Go에서 토큰 발급이 안 되므로 반드시 EAS 빌드 후 실기기에서 테스트해야 함.

### 테스트 항목

1. 공지(Notice) 작성 시 해당 커뮤니티 전체 멤버 push 수신
2. 크리에이터 게시글 작성 시 커뮤니티 멤버 push 수신 (작성자 제외)
3. 댓글/좋아요 시 게시글 작성자에게 push 수신
4. 알림 설정(notification_preferences) off 시 해당 타입 push 미수신
5. 알림 탭 시 딥링크로 해당 게시글/공지로 이동

### 전제조건

- EAS 빌드 완료 후 실기기(iOS/Android) 설치
- 테스트 유저가 커뮤니티에 입장하여 `push_tokens` 테이블에 토큰 등록 확인
- Supabase Edge Function `notify`가 배포된 상태
- `pg_cron` drain job이 5초 간격으로 동작 중

### 출처

Phase 04 VERIFICATION.md의 `human_needed` 항목 중 push 관련 잔여 검증.

## Solution

1. `eas build --profile preview --platform ios` (또는 android)로 빌드
2. 실기기에 설치 후 테스트 계정으로 로그인
3. 커뮤니티 입장 → push_tokens 테이블에서 토큰 등록 확인
4. Admin 대시보드에서 공지 작성 → 5초 내 push 수신 확인
5. 다른 계정으로 게시글/댓글/좋아요 → push 수신 확인
6. notification-preferences에서 특정 타입 off → 해당 push 미수신 확인

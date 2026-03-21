# Supabase config.toml `[db.extensions]` 파싱 에러

**날짜:** 2026-03-21
**상태:** Resolved

## 증상

`supabase start` 실행 시 아래 에러 발생:

```
failed to parse config: decoding failed due to the following error(s):
'db' has invalid keys: extensions
```

## 원인

`packages/supabase/config.toml`에 `[db.extensions]` 섹션이 존재했으나, Supabase CLI v2.75.0에서는 해당 키를 지원하지 않음.

```toml
[db.extensions]
pgmq = "pgmq"
pg_cron = "pg_cron"
pg_net = "pg_net"
```

## 해결

`[db.extensions]` 블록 전체 삭제. pgmq, pg_cron, pg_net은 Supabase 로컬 Docker 이미지에 기본 내장되어 있으므로 config에 명시할 필요 없음.

## 영향

없음. 기존 기능에 변경 없음.

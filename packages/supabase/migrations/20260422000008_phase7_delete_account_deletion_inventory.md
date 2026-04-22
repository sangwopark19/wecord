# Phase 7 Account Deletion Inventory (D-37)

Generated: 2026-04-22 by /gsd-execute-phase plan 07-02 Task 1b.
Drives the `delete_account()` RPC body (migration `20260422000007_phase7_delete_account_rpc.sql`)
and the Storage cleanup branch in the `delete-user` Edge Function.

**Timestamp note:** Filename is `.md` — Supabase CLI ignores non-`.sql` files in
the migrations directory, so this document is NOT applied to any database. It
lives beside the migration SQL for visual pairing. The timestamp `00008` is
chosen to avoid colliding with Wave 1's `20260422000001` (already merged) while
keeping the deletion inventory alongside its peer migrations (`00006` avatars
bucket, `00007` delete_account RPC).

Disposition key:

| Tag | Meaning |
|-----|---------|
| `HARD_DELETE` | Row is physically removed via `DELETE FROM` in delete_account |
| `SOFT_DELETE_WITH_SCRUB` | Row stays for referential integrity (thread continuity) but PII fields are nulled |
| `HARD_DELETE_BY_JOIN` | Deleted via a subquery joining parent table (e.g. translations of deleted user's posts) |
| `CASCADE_FROM_AUTH_USERS` | FK `ON DELETE CASCADE` to `auth.users(id)`; handled automatically when `auth.admin.deleteUser` runs |
| `NOT_PERSONAL` | Column references user but row is not the user's data (e.g. admin reviewer id) |

## Tables referencing the deleted user

| Table | Column(s) | Disposition | Scrub fields | Notes |
|-------|-----------|-------------|--------------|-------|
| `profiles` | `user_id` | HARD_DELETE | — | Parent row; delete last |
| `community_members` | `user_id` | HARD_DELETE | — | Must delete BEFORE community_follows (FK dependency via cm_id) |
| `community_follows` | `follower_cm_id`, `following_cm_id` | HARD_DELETE | — | Two DELETE statements (one per side) — resolves FK dependency before community_members delete |
| `notification_preferences` | `user_id` | HARD_DELETE | — | (user_id, community_id) composite PK; user-scoped filter suffices |
| `notifications` | `user_id` | HARD_DELETE | — | User's inbox |
| `push_tokens` | `user_id` | CASCADE_FROM_AUTH_USERS | — | FK `REFERENCES auth.users(id) ON DELETE CASCADE` in migration `20260320100000` — handled automatically when Edge Function calls `auth.admin.deleteUser(user.id)` AFTER delete_account RPC. No explicit DELETE needed. |
| `likes` | `user_id` | HARD_DELETE | — | Likes cast by deleted user on any post/comment |
| `reports` (as reporter) | `reporter_id` | HARD_DELETE | — | Reports the deleted user filed |
| `reports` (as reviewer) | `reviewed_by` | NOT_PERSONAL | — | Nullable admin reviewer id; clearing would corrupt audit trail. Leave alone. |
| `posts` | `author_id` | SOFT_DELETE_WITH_SCRUB | `content`, `media_urls` | Keep row for comment threading; scrub PII. Schema has `content` (not `body`), `media_urls` (not `image_urls`), NO `title` column — SQL must match actual columns. |
| `comments` | `author_id` | SOFT_DELETE_WITH_SCRUB | `content` | Keep row for thread continuity; scrub body. Schema has `content` (not `body`). |
| `post_translations` | `post_id` (join) | HARD_DELETE_BY_JOIN | — | Translations of deleted-user posts — `DELETE FROM post_translations WHERE post_id IN (SELECT id FROM posts WHERE author_id = p_user_id)`. Deleted-user posts still exist (soft-deleted with NULL content) so translations of those posts have no independent value. |
| `user_sanctions` (as sanctioned) | `user_id` | HARD_DELETE | — | Sanctions issued AGAINST the deleted user — row no longer meaningful after deletion. Admin audit trail preserved via `reviewed_by`/`issued_by` on OTHER rows. |
| `user_sanctions` (as issuer) | `issued_by` | NOT_PERSONAL | — | If the deleted user was an admin who issued sanctions, leave those rows — they describe other users. |
| `community_members` (as community creator) | `community_id` side | NOT_PERSONAL | — | `community_id` is a FK to `communities`; the communities themselves are not owned by a user. |
| `artist_members` | `user_id` (nullable) | NOT_PERSONAL | — | `user_id` is nullable; represents creator linkage. Communities + artist members are curated content. Leave alone. |

## Storage buckets referencing the deleted user

| Bucket | Prefix pattern | Disposition | Notes |
|--------|----------------|-------------|-------|
| `avatars` | `{user_id}/*` | HARD_DELETE (all objects) | Bucket created by migration `20260422000006` (this plan); RLS scopes `(storage.foldername(name))[1] = auth.uid()`. Edge Function calls `admin.storage.from('avatars').list('{user_id}/')` → `.remove(objectPaths)`. |
| `post-media` | `{community_id}/{user_id}/*` (prefix `[3]` of path) | HARD_DELETE | Migration `20260320000001` policies use `(storage.foldername(name))[3] = auth.uid()::text` — the user id is the 3rd path segment (community/user/file.ext). Edge Function must recursively list all `{community_id}/{user.id}/*` objects across every community and remove them. Simpler: enumerate deleted user's posts before the soft-delete + collect all `media_urls` entries → parse object paths → batch remove from Storage before calling delete_account. |

## Gaps flagged during inventory

- `onboarding_data` is stored in the `profiles` row itself (no separate table) — covered by the `profiles` HARD_DELETE.
- `auth.users.id` is the authoritative user identity. `auth.admin.deleteUser(user.id)` removes it and cascades `push_tokens` automatically. Edge Function MUST call this AFTER `delete_account` RPC + AFTER Storage cleanup (so file lookups by user_id still succeed while Storage is being cleaned).
- No `promotion_banners.user_id` — promotion banners are admin-managed.
- No `artist_member` row is user-owned in a way that requires deletion (they represent curated artist roster, not fan accounts).

## Deletion order (Edge Function orchestration)

1. **Collect references** — query `posts.id` + `posts.media_urls` for `author_id = user.id`; collect Storage object paths.
2. **Storage cleanup** — `admin.storage.from('avatars').remove(avatarPaths)` + `admin.storage.from('post-media').remove(postMediaPaths)`. Non-fatal if partial; log warnings.
3. **Apple token revoke** (if `auth.identities` has `provider='apple'`) — best-effort before `auth.admin.deleteUser` invalidates the identity rows.
4. **`delete_account(user.id)` RPC** — atomic soft-delete of posts/comments + hard-delete of side tables (one transaction).
5. **`auth.admin.deleteUser(user.id)`** — removes `auth.users` row; `push_tokens` cascades automatically.

## Cross-check: delete_account() SQL body

Every `HARD_DELETE` row in this inventory MUST appear as a `DELETE FROM` statement in `20260422000007_phase7_delete_account_rpc.sql`.
Every `SOFT_DELETE_WITH_SCRUB` row MUST appear as an `UPDATE ... SET deleted_at = now(), <scrub_cols> = NULL` statement.
Every `HARD_DELETE_BY_JOIN` row MUST appear as a `DELETE FROM ... WHERE ... IN (SELECT ...)` statement.

The RPC SQL file references this inventory in its header comment so drift is caught in code review.

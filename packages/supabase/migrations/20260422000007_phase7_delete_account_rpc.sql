-- Phase 7 / D-37 / T-7-02: atomic account deletion
--
-- Called only by the `delete-user` Edge Function (service_role).
-- See packages/supabase/migrations/20260422000008_phase7_delete_account_deletion_inventory.md
-- for the full disposition catalog (HARD_DELETE / SOFT_DELETE_WITH_SCRUB / etc.).
-- The RPC body MUST stay in sync with that inventory — every HARD_DELETE row
-- in the inventory has a DELETE statement here; every SOFT_DELETE_WITH_SCRUB
-- row has an UPDATE that nulls the PII columns.
--
-- Schema notes (verified via grep on packages/db/src/schema/ in Task 2):
--   posts.author_id (uuid)         — soft delete + scrub `content` and `media_urls`
--                                     (no `title` column; no `image_urls` column;
--                                     `body` is `content` in this schema)
--   comments.author_id (uuid)      — soft delete + scrub `content`
--   reports.reporter_id (uuid)     — hard delete (reports filed BY deleted user)
--   reports.reviewed_by (uuid)     — leave alone (admin reviewer, not deleted user's data)
--   likes (composite PK userId/targetType/targetId) — hard delete by user_id
--   community_follows.follower_cm_id / .following_cm_id — both sides hard-deleted
--                                     BEFORE community_members (FK dependency)
--   community_members.user_id      — hard delete after follows resolved
--   notification_preferences (composite PK user_id/community_id) — hard delete
--   notifications.user_id          — hard delete (user's inbox)
--   user_sanctions.user_id         — hard delete (sanctions AGAINST deleted user)
--   push_tokens.user_id            — CASCADE_FROM_AUTH_USERS (FK ON DELETE CASCADE)
--   profiles.user_id               — delete LAST
--
-- [REVIEW UPDATE — Codex HIGH: Soft-delete PII scrub] Soft-deleted posts/comments
-- keep the row for thread integrity but scrub PII (`content`, `media_urls`) so the
-- deleted user's actual content is gone. Privacy Policy (Plan 07-03) describes
-- this exact behavior.

CREATE OR REPLACE FUNCTION public.delete_account(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Soft-delete user content + scrub PII fields (thread integrity + privacy)
  UPDATE public.posts
    SET deleted_at = now(),
        content = '',           -- NOT NULL in schema; empty string scrubs PII
        media_urls = NULL
    WHERE author_id = p_user_id AND deleted_at IS NULL;

  UPDATE public.comments
    SET deleted_at = now(),
        content = ''            -- NOT NULL in schema; empty string scrubs PII
    WHERE author_id = p_user_id AND deleted_at IS NULL;

  -- 2. Translations of deleted-user posts — hard delete by join (no independent value)
  DELETE FROM public.post_translations
    WHERE post_id IN (SELECT id FROM public.posts WHERE author_id = p_user_id);

  -- 3. Cascade user-owned side tables (column names verified against schema)
  DELETE FROM public.notification_preferences WHERE user_id = p_user_id;

  -- community_follows MUST be deleted BEFORE community_members because the FK
  -- references community_members.id via follower_cm_id / following_cm_id.
  DELETE FROM public.community_follows
    WHERE follower_cm_id IN (SELECT id FROM public.community_members WHERE user_id = p_user_id);
  DELETE FROM public.community_follows
    WHERE following_cm_id IN (SELECT id FROM public.community_members WHERE user_id = p_user_id);
  DELETE FROM public.community_members        WHERE user_id     = p_user_id;
  DELETE FROM public.notifications            WHERE user_id     = p_user_id;
  DELETE FROM public.likes                    WHERE user_id     = p_user_id;
  DELETE FROM public.reports                  WHERE reporter_id = p_user_id;
  DELETE FROM public.user_sanctions           WHERE user_id     = p_user_id;

  -- push_tokens cascades via existing FK to auth.users(id) — handled when the
  -- Edge Function calls auth.admin.deleteUser AFTER this RPC succeeds.
  --
  -- Storage objects (avatars/{user_id}/*, post-media/{community_id}/{user_id}/*)
  -- are deleted from the Edge Function BEFORE this RPC fires (see
  -- delete-user/index.ts) so file lookups still resolve when Storage is being
  -- cleaned. Once Storage is empty, this RPC runs the DB-level cleanup.

  -- 4. Profile row LAST (FK references from above tables would block earlier)
  DELETE FROM public.profiles WHERE user_id = p_user_id;
END;
$$;

-- Lock down: only service_role (Edge Function) may invoke
REVOKE ALL ON FUNCTION public.delete_account(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_account(uuid) TO service_role;

COMMENT ON FUNCTION public.delete_account(uuid) IS
  'D-37: atomic cascade deletion of user-owned rows. SECURITY DEFINER + service_role-only EXECUTE (T-7-02).';

-- Phase 7 / D-12 / T-7-04: avatars Storage bucket + per-user RLS
--
-- Filename note: 07-01 (Wave 1) shipped 20260422000001 (dm_launch_notify column).
-- This file is bumped to 20260422000006 to avoid collision while still grouping
-- with 07-02's other migrations (00007 delete_account_rpc, 00008 inventory MD).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,                                             -- 2 MB cap (T-7-04)
  ARRAY['image/jpeg','image/png','image/webp']         -- MIME allowlist (T-7-04)
)
ON CONFLICT (id) DO NOTHING;

-- Policies: path [1] must equal auth.uid() → users can only write to their own folder
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'avatars_insert_own'
  ) THEN
    CREATE POLICY "avatars_insert_own" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = (select auth.uid())::text
      );
  END IF;

  -- [REVIEW UPDATE — Codex MEDIUM: Storage UPDATE needs WITH CHECK]
  -- USING alone allows SELECT-filter for UPDATE, but an UPDATE that renames/moves
  -- the object can still land in a path that belongs to another user (pre-image
  -- passes, post-image does not). WITH CHECK enforces the destination path also
  -- belongs to auth.uid(), closing the rename/move bypass.
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'avatars_update_own'
  ) THEN
    CREATE POLICY "avatars_update_own" ON storage.objects
      FOR UPDATE TO authenticated
      USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = (select auth.uid())::text
      )
      WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = (select auth.uid())::text
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'avatars_select_public'
  ) THEN
    CREATE POLICY "avatars_select_public" ON storage.objects
      FOR SELECT TO authenticated, anon
      USING (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'avatars_delete_own'
  ) THEN
    CREATE POLICY "avatars_delete_own" ON storage.objects
      FOR DELETE TO authenticated
      USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = (select auth.uid())::text
      );
  END IF;
END $$;

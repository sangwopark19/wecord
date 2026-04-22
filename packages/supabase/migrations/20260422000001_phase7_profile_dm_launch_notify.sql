-- Phase 7 — More tab + DM launch notify (DMPL-01/02)
-- Adds dm_launch_notify boolean to profiles. Edge Function fan-out is v1.1 scope.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS dm_launch_notify boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.dm_launch_notify IS
  'Phase 7 — true when user opts in to "Notify Me" on DM placeholder tab. v1.1 Edge Function fans out launch push notifications to opted-in users.';

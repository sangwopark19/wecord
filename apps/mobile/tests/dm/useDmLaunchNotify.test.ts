import { describe, it } from 'vitest';

describe('useDmLaunchNotify (T-7-06)', () => {
  it.todo('updates profiles.dm_launch_notify=true with .eq(user_id, user.id)');
  it.todo('skips mutation when profile.dm_launch_notify is already true (Pitfall 10)');
  it.todo('shows toast 이미 알림이 등록되어 있어요 when already notified');
  it.todo('invalidates [profile, userId] query on success');
});

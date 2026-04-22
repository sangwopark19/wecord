import { describe, it, expect } from 'vitest';
import {
  shouldSkipMutation,
  buildUpdateFilter,
  buildUpdatePayload,
} from '../../hooks/dm/notifyHelpers';

// T-7-06 mitigation lives in the pure helpers (filter + payload), so unit
// tests don't need renderHook (blocked by RNTR peer pin — 07-01 deviation #5).
describe('useDmLaunchNotify (T-7-06) — pure contract', () => {
  it('updates profiles.dm_launch_notify=true with .eq(user_id, user.id)', () => {
    expect(buildUpdatePayload()).toEqual({ dm_launch_notify: true });
    expect(buildUpdateFilter('user-1')).toEqual(['user_id', 'user-1']);
  });

  it('skips mutation when profile.dm_launch_notify is already true (Pitfall 10)', () => {
    expect(shouldSkipMutation({ alreadyNotified: true })).toBe(true);
  });

  it('runs mutation when profile.dm_launch_notify is false', () => {
    expect(shouldSkipMutation({ alreadyNotified: false })).toBe(false);
  });

  it('T-7-06: filter MUST scope to caller user id (no cross-account writes)', () => {
    // Re-asserting filter shape with a different user id locks the contract:
    // a hand-edit that hardcoded a constant would fail this case.
    const [col, val] = buildUpdateFilter('aa-bb-cc');
    expect(col).toBe('user_id');
    expect(val).toBe('aa-bb-cc');
  });
});

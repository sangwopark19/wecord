// Pure helpers for the DM launch-notify mutation. Lifted out of
// useDmLaunchNotify so unit tests can exercise the contract without renderHook
// (RNTR's react-test-renderer 19.2.3-vs-19.2.4 peer pin blocks renderHook in
// this worktree — same workaround as 07-01).
//
// T-7-06 mitigation lives here:
//   - shouldSkipMutation: Pitfall 10 (don't double-write when already true)
//   - buildUpdateFilter: returns the .eq filter args so tests assert exact
//     ('user_id', user.id) tuple (no cross-account writes).

export interface NotifyState {
  alreadyNotified: boolean;
}

export function shouldSkipMutation(state: NotifyState): boolean {
  return state.alreadyNotified;
}

// Returned tuple is fed into supabase.from('profiles').update({...}).eq(...).
// Returning a tuple lets tests assert the exact column + value (T-7-06).
export function buildUpdateFilter(userId: string): readonly [string, string] {
  return ['user_id', userId] as const;
}

// Body of the UPDATE — separated so tests can lock in the column name.
export function buildUpdatePayload(): { dm_launch_notify: true } {
  return { dm_launch_notify: true };
}

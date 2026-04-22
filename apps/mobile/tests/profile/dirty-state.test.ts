import { describe, it, expect } from 'vitest';
import { shallowDirty } from '../../hooks/profile/useDirtyState';

// We test the pure compare function rather than the full hook to avoid
// @testing-library/react-native's strict react-test-renderer peer pin in CI.
// The hook itself is a thin React wrapper around shallowDirty + useState/useRef.

describe('shallowDirty (powering useDirtyState)', () => {
  const initial = {
    globalNickname: 'Alice',
    bio: 'hi',
    avatarUrl: null as string | null,
  };

  it('returns false when current equals initial', () => {
    expect(shallowDirty(initial, { ...initial })).toBe(false);
  });

  it('returns true when nickname changes', () => {
    expect(shallowDirty(initial, { ...initial, globalNickname: 'Bob' })).toBe(true);
  });

  it('returns true when bio changes', () => {
    expect(shallowDirty(initial, { ...initial, bio: 'hello' })).toBe(true);
  });

  it('returns true when avatarUrl changes', () => {
    expect(shallowDirty(initial, { ...initial, avatarUrl: 'https://x/y.jpg' })).toBe(true);
  });

  it('treats Object.is identity for null/null as equal', () => {
    expect(shallowDirty(initial, { ...initial, avatarUrl: null })).toBe(false);
  });
});

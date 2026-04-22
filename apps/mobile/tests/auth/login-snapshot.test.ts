import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// T-7-07 / Apple Guideline 4.8: Apple Sign-In MUST render at or above Google.
// We verify by reading login.tsx source and checking the order of testIDs.
// This avoids spinning up a React Native renderer (which has strict peers in CI),
// while still being a deterministic ordering gate that fails the build if the
// buttons are reordered. Plan 07-03 submission re-runs this snapshot.

const LOGIN_PATH = resolve(__dirname, '..', '..', 'app', '(auth)', 'login.tsx');

describe('Login screen — T-7-07 Apple Sign-In prominence', () => {
  const source = readFileSync(LOGIN_PATH, 'utf8');

  it('renders an Apple sign-in button (testID="apple-signin-button")', () => {
    expect(source).toMatch(/testID=['"]apple-signin-button['"]/);
  });

  it('renders a Google sign-in button (testID="google-signin-button")', () => {
    expect(source).toMatch(/testID=['"]google-signin-button['"]/);
  });

  it('Apple button source position is at or above Google (Apple Guideline 4.8)', () => {
    const appleIdx = source.indexOf('apple-signin-button');
    const googleIdx = source.indexOf('google-signin-button');
    expect(appleIdx).toBeGreaterThan(-1);
    expect(googleIdx).toBeGreaterThan(-1);
    // The first occurrence of apple-signin-button must come before the first
    // occurrence of google-signin-button — confirming visual order in JSX.
    expect(appleIdx).toBeLessThan(googleIdx);
  });

  it('Apple button has a visible accessibility label (no testID-only target)', () => {
    expect(source).toMatch(/testID=['"]apple-signin-button['"][\s\S]{0,200}accessibilityLabel/);
  });
});

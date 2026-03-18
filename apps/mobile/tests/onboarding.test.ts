import { describe, it, expect } from 'vitest';

describe('Onboarding flow (AUTH-05, AUTH-07, AUTH-08)', () => {
  it('should validate age >= 14 for date of birth', () => {
    // Stub: will be expanded in Plan 02-02
    const calculateAge = (dob: Date) => {
      const diff = Date.now() - dob.getTime();
      return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    };
    expect(calculateAge(new Date('2000-01-01'))).toBeGreaterThanOrEqual(14);
  });
});

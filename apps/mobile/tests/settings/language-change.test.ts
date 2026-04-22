import { describe, it } from 'vitest';

describe('language change settings flow', () => {
  it.todo('calls i18n.changeLanguage with new code');
  it.todo('updates profiles.language via supabase');
  it.todo('invalidates [profile, userId] query');
  it.todo('persists across app restart via profile.language reload');
});

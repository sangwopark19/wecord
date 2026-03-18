import { describe, it } from 'vitest';

describe('Schema structure (FOUN-03)', () => {
  it.todo('exports all 14 MVP tables from schema/index.ts');
  it.todo('profiles table has required columns');
  it.todo('posts table has content_rating column (AUTH-09)');
  it.todo('community_members has unique constraint on (user_id, community_id)');
});

describe('RLS policies (FOUN-04)', () => {
  it.todo('all schema files contain pgPolicy calls');
  it.todo('no schema file uses bare auth.uid() without select wrapper');
});

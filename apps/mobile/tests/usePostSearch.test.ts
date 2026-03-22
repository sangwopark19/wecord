import { describe, it } from 'vitest';

describe('usePostSearch', () => {
  it.todo('calls textSearch with debounced query on posts_with_nickname (SRCH-02)');
  it.todo('returns empty array when query is empty');
  it.todo('filters by community_id');
});

describe('HighlightedText', () => {
  it.todo('wraps matched substring in Teal color span (SRCH-03)');
  it.todo('handles case-insensitive matching');
  it.todo('returns plain text when query is empty');
});

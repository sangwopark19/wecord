import { describe, it } from 'vitest';

describe('useHomeFeed', () => {
  it.todo('returns isEmpty: true when user has 0 community memberships (HOME-01)');
  it.todo('returns posts from all joined communities sorted by created_at DESC (HOME-02)');
  it.todo('supports cursor-based pagination with compound cursor (createdAt, id)');
  it.todo('each post includes community_name and community_slug fields (HOME-03)');
});

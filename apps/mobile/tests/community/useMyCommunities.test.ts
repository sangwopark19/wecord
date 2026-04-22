import { describe, it } from 'vitest';

describe('useMyCommunities', () => {
  it.todo('selects community_members with !inner join to communities filtered by user_id');
  it.todo('orders by joined_at desc');
  it.todo(
    'maps to { communityId, communityName, coverImageUrl, myCommunityNickname, joinedAt } shape'
  );
  it.todo('returns empty array when user has no memberships');
});

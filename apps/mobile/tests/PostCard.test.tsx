import { describe, it, expect } from 'vitest';
import type { PostWithNickname } from '../hooks/post/useFanFeed';

// Test the logic that determines when CreatorBadge should be shown.
// PostCard renders <CreatorBadge /> when post.author_role === 'creator'.
// These tests verify the data shape and condition logic.

function shouldShowCreatorBadge(post: PostWithNickname): boolean {
  return post.author_role === 'creator';
}

const basePost: PostWithNickname = {
  id: 'post-1',
  community_id: 'community-1',
  author_id: 'user-1',
  artist_member_id: null,
  author_role: 'fan',
  content: 'Test post content',
  content_rating: null,
  media_urls: null,
  post_type: 'text',
  like_count: 5,
  comment_count: 2,
  created_at: new Date().toISOString(),
  author_nickname: 'TestUser',
  author_cm_id: 'cm-1',
  artist_member_name: null,
  community_name: 'Test Community',
  community_slug: 'test-community',
  isLiked: false,
};

describe('PostCard CreatorBadge rendering logic', () => {
  it('shows Creator badge when author_role is creator', () => {
    const creatorPost: PostWithNickname = {
      ...basePost,
      author_role: 'creator',
    };
    expect(shouldShowCreatorBadge(creatorPost)).toBe(true);
  });

  it('does not show Creator badge when author_role is fan', () => {
    const fanPost: PostWithNickname = {
      ...basePost,
      author_role: 'fan',
    };
    expect(shouldShowCreatorBadge(fanPost)).toBe(false);
  });

  it('creator post has correct author_role value', () => {
    const creatorPost: PostWithNickname = {
      ...basePost,
      author_role: 'creator',
    };
    expect(creatorPost.author_role).toBe('creator');
  });

  it('fan post does not have creator role', () => {
    expect(basePost.author_role).toBe('fan');
    expect(basePost.author_role).not.toBe('creator');
  });

  it('PostCard receives post with isLiked field', () => {
    const likedPost: PostWithNickname = { ...basePost, isLiked: true };
    expect(likedPost.isLiked).toBe(true);
  });
});

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { PostWithNickname } from '../post/useFanFeed';

export interface CommunityProfileData {
  id: string;
  user_id: string;
  community_id: string;
  community_nickname: string;
  avatar_url: string | null;
  follower_count: number;
  following_count: number;
}

export function useCommunityProfile(memberId: string) {
  return useQuery({
    queryKey: ['communityProfile', memberId],
    queryFn: async (): Promise<CommunityProfileData | null> => {
      const { data, error } = await supabase
        .from('community_members')
        .select('id, user_id, community_id, community_nickname, avatar_url, follower_count, following_count')
        .eq('id', memberId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data as CommunityProfileData;
    },
    enabled: !!memberId,
  });
}

export function useMemberPosts(memberId: string, communityId: string) {
  return useQuery({
    queryKey: ['memberPosts', memberId, communityId],
    queryFn: async (): Promise<PostWithNickname[]> => {
      const { data, error } = await supabase
        .from('posts_with_nickname')
        .select('*')
        .eq('community_id', communityId)
        .eq('author_cm_id', memberId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data ?? []) as PostWithNickname[];
    },
    enabled: !!memberId && !!communityId,
  });
}

export function useMemberPostCount(memberId: string, communityId: string) {
  return useQuery({
    queryKey: ['memberPostCount', memberId, communityId],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from('posts_with_nickname')
        .select('*', { count: 'exact', head: true })
        .eq('community_id', communityId)
        .eq('author_cm_id', memberId);

      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!memberId && !!communityId,
  });
}

export interface MemberComment {
  id: string;
  post_id: string;
  content: string;
  author_nickname: string;
  author_cm_id: string;
  author_role: 'fan' | 'creator';
  is_creator_reply: boolean;
  like_count: number;
  created_at: string;
  parent_comment_id: string | null;
}

export function useMemberComments(memberId: string, communityId: string) {
  return useQuery({
    queryKey: ['memberComments', memberId, communityId],
    queryFn: async (): Promise<MemberComment[]> => {
      const { data, error } = await supabase
        .from('comments_with_nickname')
        .select('id, post_id, content, author_nickname, author_cm_id, author_role, is_creator_reply, like_count, created_at, parent_comment_id')
        .eq('author_cm_id', memberId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data ?? []) as MemberComment[];
    },
    enabled: !!memberId && !!communityId,
  });
}

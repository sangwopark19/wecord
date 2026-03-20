import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export interface HighlightNotice {
  id: string;
  title: string;
  is_pinned: boolean;
  published_at: string;
}

export interface HighlightPost {
  id: string;
  content: string;
  media_urls: string[] | null;
  author_nickname: string;
  author_role: string;
  created_at: string;
}

export interface HighlightArtistMember {
  id: string;
  display_name: string;
  profile_image_url: string | null;
}

export interface HighlightData {
  notices: HighlightNotice[];
  creatorPosts: HighlightPost[];
  fanPosts: HighlightPost[];
  artistMembers: HighlightArtistMember[];
}

export function useHighlight(communityId: string) {
  return useQuery<HighlightData>({
    queryKey: ['highlight', communityId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('highlight', {
        body: { community_id: communityId },
        method: 'POST',
      });
      if (error) throw error;
      return data as HighlightData;
    },
    enabled: !!communityId,
    staleTime: 2 * 60 * 1000,
  });
}

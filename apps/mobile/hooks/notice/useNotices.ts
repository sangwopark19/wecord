import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export interface Notice {
  id: string;
  title: string;
  content: string;
  media_urls: string[] | null;
  is_pinned: boolean;
  published_at: string;
  created_at: string;
}

export function useNotices(communityId: string) {
  return useQuery<Notice[]>({
    queryKey: ['notices', communityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notices')
        .select('id, title, content, media_urls, is_pinned, published_at, created_at')
        .eq('community_id', communityId)
        .not('published_at', 'is', null)
        .order('is_pinned', { ascending: false })
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data as Notice[];
    },
    enabled: !!communityId,
  });
}

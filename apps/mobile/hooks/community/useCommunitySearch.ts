import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export interface CommunitySearchResult {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  type: 'solo' | 'group';
  category: 'bl' | 'gl' | 'voice_drama' | 'novel' | 'etc' | null;
  member_count: number;
}

export function useCommunitySearch(query: string) {
  return useQuery({
    queryKey: ['communitySearch', query],
    queryFn: async (): Promise<CommunitySearchResult[]> => {
      if (!query.trim()) {
        return [];
      }

      const { data, error } = await supabase
        .from('communities')
        .select('id, slug, name, description, cover_image_url, type, category, member_count')
        .textSearch('name', query, { type: 'websearch', config: 'simple' })
        .limit(20);

      if (error) throw error;
      return (data ?? []) as CommunitySearchResult[];
    },
    enabled: query.trim().length > 0,
  });
}

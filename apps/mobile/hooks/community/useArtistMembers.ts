import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export interface ArtistMember {
  id: string;
  community_id: string;
  user_id: string | null;
  display_name: string;
  profile_image_url: string | null;
  position: string | null;
  sort_order: number;
}

export function useArtistMembers(communityId: string) {
  return useQuery({
    queryKey: ['artistMembers', communityId],
    queryFn: async (): Promise<ArtistMember[]> => {
      const { data, error } = await supabase
        .from('artist_members')
        .select('id, display_name, profile_image_url, position, sort_order, user_id, community_id')
        .eq('community_id', communityId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data ?? []) as ArtistMember[];
    },
    enabled: !!communityId,
  });
}

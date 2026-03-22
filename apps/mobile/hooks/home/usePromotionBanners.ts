import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

export interface PromotionBanner {
  id: string;
  image_url: string;
  link_url: string;
  sort_order: number;
}

export function usePromotionBanners() {
  return useQuery({
    queryKey: ['promotionBanners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotion_banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return (data ?? []) as PromotionBanner[];
    },
  });
}

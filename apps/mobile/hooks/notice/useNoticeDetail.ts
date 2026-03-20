import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Notice } from './useNotices';

export function useNoticeDetail(noticeId: string) {
  return useQuery<Notice>({
    queryKey: ['notice', noticeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notices')
        .select('id, title, content, media_urls, is_pinned, published_at, created_at')
        .eq('id', noticeId)
        .single();
      if (error) throw error;
      return data as Notice;
    },
    enabled: !!noticeId,
  });
}

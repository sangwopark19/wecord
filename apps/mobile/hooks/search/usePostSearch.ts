import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { PostWithNickname } from '../post/useFanFeed';

export function usePostSearch(communityId: string) {
  const [rawQuery, setRawQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(rawQuery), 300);
    return () => clearTimeout(timer);
  }, [rawQuery]);

  const queryResult = useQuery({
    queryKey: ['postSearch', communityId, debouncedQuery],
    queryFn: async (): Promise<PostWithNickname[]> => {
      if (!debouncedQuery.trim()) return [];
      const { data, error } = await supabase
        .from('posts_with_nickname')
        .select('*')
        .eq('community_id', communityId)
        .textSearch('content', debouncedQuery, { type: 'websearch', config: 'simple' })
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as PostWithNickname[];
    },
    enabled: !!debouncedQuery.trim(),
  });

  return {
    query: rawQuery,
    setQuery: setRawQuery,
    debouncedQuery,
    ...queryResult,
  };
}

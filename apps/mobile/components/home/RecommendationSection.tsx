import { View, Text, FlatList } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@wecord/shared/i18n';
import { supabase } from '../../lib/supabase';
import { CommunityCard } from '../community/CommunityCard';
import type { CommunitySearchResult } from '../../hooks/community/useCommunitySearch';

function useRecommendedCommunities() {
  return useQuery({
    queryKey: ['recommendedCommunities'],
    queryFn: async (): Promise<CommunitySearchResult[]> => {
      const { data, error } = await supabase
        .from('communities')
        .select('id, slug, name, description, cover_image_url, type, category, member_count')
        .order('member_count', { ascending: false })
        .limit(20);

      if (error) throw error;
      return (data ?? []) as CommunitySearchResult[];
    },
  });
}

export function RecommendationSection() {
  const { t } = useTranslation('home');
  const { data: communities } = useRecommendedCommunities();

  return (
    <View>
      <Text className="text-heading font-semibold text-foreground px-4 mt-4 mb-2">
        {t('recommendation.heading')}
      </Text>
      <FlatList
        data={communities ?? []}
        numColumns={2}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={{ width: '50%' }}>
            <CommunityCard community={item} />
          </View>
        )}
      />
    </View>
  );
}

import { View, Text, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { CoverGrad, getSeedFromString } from '../common/CoverGrad';

interface MyCommunity {
  id: string;
  name: string;
  cover_image_url: string | null;
  member_count: number;
}

function useMyCommunities(userId: string | undefined) {
  return useQuery({
    queryKey: ['myCommunitiesRail', userId],
    enabled: !!userId,
    queryFn: async (): Promise<MyCommunity[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('community_members')
        .select('communities(id, name, cover_image_url, member_count)')
        .eq('user_id', userId)
        .limit(16);
      if (error) throw error;

      type Row = {
        communities:
          | { id: string; name: string; cover_image_url: string | null; member_count: number }
          | Array<{ id: string; name: string; cover_image_url: string | null; member_count: number }>
          | null;
      };

      return ((data ?? []) as Row[])
        .map((row) => {
          const c = Array.isArray(row.communities) ? row.communities[0] : row.communities;
          if (!c) return null;
          return {
            id: c.id,
            name: c.name,
            cover_image_url: c.cover_image_url,
            member_count: c.member_count ?? 0,
          };
        })
        .filter((v): v is MyCommunity => v !== null)
        .sort((a, b) => b.member_count - a.member_count);
    },
  });
}

function formatMemberCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${n}`;
}

interface MyCommunitiesRailProps {
  onSeeAll?: () => void;
}

export function MyCommunitiesRail({ onSeeAll }: MyCommunitiesRailProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data } = useMyCommunities(user?.id);
  const items = (data ?? []).slice(0, 12);

  if (items.length === 0) return null;

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 28,
          paddingBottom: 12,
        }}
      >
        <Text
          style={{
            color: '#FFFFFF',
            fontFamily: 'Pretendard-Bold',
            fontSize: 18,
            letterSpacing: -0.3,
          }}
        >
          My communities
        </Text>
        <Pressable onPress={onSeeAll} accessibilityRole="button" accessibilityLabel="See all">
          <Text style={{ color: 'rgba(235,235,245,0.38)', fontSize: 13 }}>See all</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
      >
        {items.map((c, i) => {
          const seed = getSeedFromString(c.id);
          return (
            <Pressable
              key={c.id}
              onPress={() => router.push(`/(community)/${c.id}` as never)}
              style={{ width: 100 }}
              accessibilityRole="button"
              accessibilityLabel={c.name}
            >
              <View
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: 12,
                  overflow: 'hidden',
                  marginBottom: 8,
                  backgroundColor: '#15151B',
                }}
              >
                {c.cover_image_url ? (
                  <Image
                    source={{ uri: c.cover_image_url }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                ) : (
                  <CoverGrad seed={seed} r={i + 1} style={{ width: '100%', height: '100%' }} />
                )}
              </View>
              <Text
                numberOfLines={1}
                style={{
                  color: '#FFFFFF',
                  fontFamily: 'Pretendard-SemiBold',
                  fontSize: 12,
                  textAlign: 'center',
                }}
              >
                {c.name}
              </Text>
              <Text
                style={{
                  color: 'rgba(235,235,245,0.38)',
                  fontFamily: 'Pretendard-Regular',
                  fontSize: 10,
                  marginTop: 2,
                  textAlign: 'center',
                }}
              >
                {formatMemberCount(c.member_count)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { Avatar, getSeedFromString } from '../common/CoverGrad';

interface JoinedCommunity {
  id: string;
  name: string;
  cover_image_url: string | null;
}

function useJoinedCommunities(userId: string | undefined) {
  return useQuery({
    queryKey: ['joinedCommunities', userId],
    enabled: !!userId,
    queryFn: async (): Promise<JoinedCommunity[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('community_members')
        .select('community_id, communities(id, name, cover_image_url, member_count)')
        .eq('user_id', userId)
        .limit(16);
      if (error) throw error;

      type Row = {
        community_id: string;
        communities:
          | { id: string; name: string; cover_image_url: string | null; member_count: number }
          | Array<{ id: string; name: string; cover_image_url: string | null; member_count: number }>
          | null;
      };

      const rows = (data ?? []) as Row[];
      const flat = rows
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
        .filter((v): v is NonNullable<typeof v> => v !== null)
        .sort((a, b) => b.member_count - a.member_count);
      return flat;
    },
  });
}

interface ArtistDMRailProps {
  onSeeAll?: () => void;
}

export function ArtistDMRail({ onSeeAll }: ArtistDMRailProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data } = useJoinedCommunities(user?.id);
  const joined = (data ?? []).slice(0, 8);

  if (joined.length === 0) return null;

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 24,
          paddingBottom: 12,
        }}
      >
        <View>
          <Text
            style={{
              color: '#FFFFFF',
              fontFamily: 'Pretendard-Bold',
              fontSize: 18,
              letterSpacing: -0.3,
            }}
          >
            DM with artists
          </Text>
          <Text style={{ color: 'rgba(235,235,245,0.38)', fontSize: 12, marginTop: 2 }}>
            Reply directly from your favorites
          </Text>
        </View>
        <Pressable onPress={onSeeAll} accessibilityRole="button" accessibilityLabel="refresh">
          <Text style={{ color: 'rgba(235,235,245,0.38)', fontSize: 13 }}>refresh</Text>
        </Pressable>
      </View>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          paddingHorizontal: 16,
          rowGap: 14,
        }}
      >
        {joined.map((c, i) => {
          const seed = getSeedFromString(c.id);
          return (
            <Pressable
              key={c.id}
              onPress={() => router.push(`/(community)/${c.id}` as never)}
              style={{ width: '25%', alignItems: 'center', gap: 6 }}
              accessibilityRole="button"
              accessibilityLabel={c.name}
            >
              <View style={{ position: 'relative' }}>
                {c.cover_image_url ? (
                  <View
                    style={{
                      width: 62,
                      height: 62,
                      borderRadius: 31,
                      overflow: 'hidden',
                      borderWidth: 2,
                      borderColor: '#0B0B0F',
                    }}
                  >
                    <Image
                      source={{ uri: c.cover_image_url }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  </View>
                ) : (
                  <Avatar name={c.name} seed={seed} size={62} ring ringColor="#0B0B0F" />
                )}
                {i < 3 && (
                  <View
                    style={{
                      position: 'absolute',
                      right: -2,
                      bottom: -2,
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: '#8B5CF6',
                      borderWidth: 2,
                      borderColor: '#0B0B0F',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: '#FFFFFF',
                        fontFamily: 'Pretendard-Bold',
                        fontSize: 9,
                      }}
                    >
                      {i + 1}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                numberOfLines={1}
                style={{
                  color: 'rgba(235,235,245,0.62)',
                  fontFamily: 'Pretendard-Regular',
                  fontSize: 11,
                  maxWidth: 68,
                }}
              >
                {c.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

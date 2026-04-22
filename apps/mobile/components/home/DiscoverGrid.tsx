import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { CoverGrad, getSeedFromString } from '../common/CoverGrad';

interface DiscoverItem {
  id: string;
  name: string;
  cover_image_url: string | null;
}

function useDiscoverCommunities(userId: string | undefined) {
  return useQuery({
    queryKey: ['discoverGrid', userId],
    queryFn: async (): Promise<DiscoverItem[]> => {
      const { data: all, error } = await supabase
        .from('communities')
        .select('id, name, cover_image_url')
        .order('member_count', { ascending: false })
        .limit(24);
      if (error) throw error;

      let joined: string[] = [];
      if (userId) {
        const { data: m } = await supabase
          .from('community_members')
          .select('community_id')
          .eq('user_id', userId);
        joined = (m ?? []).map((row: { community_id: string }) => row.community_id);
      }
      const joinedSet = new Set(joined);
      return (all ?? [])
        .filter((c) => !joinedSet.has(c.id as string))
        .slice(0, 9) as DiscoverItem[];
    },
  });
}

export function DiscoverGrid() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data } = useDiscoverCommunities(user?.id);
  const items = data ?? [];

  if (items.length === 0) return null;

  return (
    <View>
      <View style={{ paddingHorizontal: 16, paddingTop: 28, paddingBottom: 14 }}>
        <Text
          style={{
            color: '#FFFFFF',
            fontFamily: 'Pretendard-Bold',
            fontSize: 18,
            letterSpacing: -0.3,
          }}
        >
          Find new artists
        </Text>
        <Text
          style={{
            color: 'rgba(235,235,245,0.38)',
            fontFamily: 'Pretendard-Regular',
            fontSize: 12,
            marginTop: 4,
          }}
        >
          {items.length} added this week
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          paddingHorizontal: 16,
          gap: 10,
        }}
      >
        {items.map((c, i) => {
          const seed = getSeedFromString(c.id);
          return (
            <Pressable
              key={c.id}
              onPress={() => router.push(`/(community)/${c.id}` as never)}
              style={{ width: '31.5%', aspectRatio: 1 / 1.25, borderRadius: 10, overflow: 'hidden', position: 'relative' }}
              accessibilityRole="button"
              accessibilityLabel={c.name}
            >
              {c.cover_image_url ? (
                <Image
                  source={{ uri: c.cover_image_url }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
              ) : (
                <CoverGrad seed={seed} r={i} style={{ width: '100%', height: '100%' }} />
              )}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                locations={[0.5, 1]}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="팔로우"
                onPress={() => router.push(`/(community)/${c.id}/preview` as never)}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.3)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="add" size={14} color="#FFFFFF" />
              </Pressable>
              <View style={{ position: 'absolute', left: 8, right: 8, bottom: 8 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    color: '#FFFFFF',
                    fontFamily: 'Pretendard-Bold',
                    fontSize: 12,
                  }}
                >
                  {c.name}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

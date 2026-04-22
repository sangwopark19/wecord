import { View, Text, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { CoverGrad, getSeedFromString } from '../common/CoverGrad';

interface LiveArtist {
  id: string;
  name: string;
  cover_image_url: string | null;
  title: string;
}

const LIVE_TITLES: Record<string, string> = {
  halo8: '🔥 We on Fire Official Listening Party',
  yuna: 'yuna&you: 새벽 DM 라이브',
  verse: 'Pre-show countdown',
};

function useOnLiveArtists() {
  return useQuery({
    queryKey: ['onLiveArtists'],
    queryFn: async (): Promise<LiveArtist[]> => {
      const { data, error } = await supabase
        .from('communities')
        .select('id, slug, name, cover_image_url')
        .in('slug', ['halo8', 'yuna', 'verse'])
        .order('member_count', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((c) => ({
        id: c.id as string,
        name: c.name as string,
        cover_image_url: (c.cover_image_url as string | null) ?? null,
        title: LIVE_TITLES[(c.slug as string) ?? ''] ?? 'LIVE now',
      }));
    },
  });
}

export function OnLiveRail() {
  const router = useRouter();
  const { data } = useOnLiveArtists();
  const artists = data ?? [];

  if (artists.length === 0) return null;

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 }}>
        <Text
          style={{
            color: '#FFFFFF',
            fontFamily: 'Pretendard-Bold',
            fontSize: 18,
            letterSpacing: -0.3,
          }}
        >
          On LIVE
        </Text>
        <Text style={{ color: 'rgba(235,235,245,0.38)', fontSize: 13 }}>{artists.length}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingVertical: 8 }}
      >
        {artists.map((a, i) => {
          const seed = getSeedFromString(a.id);
          return (
            <Pressable
              key={a.id}
              onPress={() => router.push(`/(community)/${a.id}` as never)}
              style={{ width: 150 }}
            >
              <View
                style={{
                  width: '100%',
                  height: 190,
                  borderRadius: 14,
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundColor: '#15151B',
                }}
              >
                {a.cover_image_url ? (
                  <Image
                    source={{ uri: a.cover_image_url }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                ) : (
                  <CoverGrad seed={seed} r={i + 2} style={{ width: '100%', height: '100%' }} />
                )}
                <LinearGradient
                  colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)']}
                  locations={[0.4, 1]}
                  style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                />
                <View
                  style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: '#E11D48',
                    paddingHorizontal: 6,
                    paddingVertical: 3,
                    borderRadius: 3,
                  }}
                >
                  <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF' }} />
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontSize: 9,
                      fontFamily: 'Pretendard-Bold',
                      letterSpacing: 0.6,
                    }}
                  >
                    LIVE
                  </Text>
                </View>
                <View style={{ position: 'absolute', bottom: 10, left: 10, right: 10 }}>
                  <Text
                    style={{
                      color: 'rgba(255,255,255,0.9)',
                      fontFamily: 'Pretendard-Bold',
                      fontSize: 11,
                      letterSpacing: 0.4,
                      marginBottom: 2,
                    }}
                  >
                    {a.name}
                  </Text>
                  <Text
                    numberOfLines={2}
                    style={{
                      color: '#FFFFFF',
                      fontFamily: 'Pretendard-Regular',
                      fontSize: 12,
                      lineHeight: 15,
                    }}
                  >
                    {a.title}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

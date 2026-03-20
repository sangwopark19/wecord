import { ScrollView, Text, View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@wecord/shared/i18n';
import { supabase } from '../../lib/supabase';
import { PrimaryCTAButton } from '../PrimaryCTAButton';

interface ArtistMember {
  id: string;
  display_name: string;
  profile_image_url: string | null;
}

interface Community {
  id: string;
  name: string;
  description: string | null;
  cover_image_url: string | null;
  type: 'solo' | 'group';
  category: string | null;
  member_count: number;
}

interface CommunityPreviewSheetProps {
  community: Community;
  isMember: boolean;
  onJoinPress: () => void;
  onEnterPress: () => void;
}

export function CommunityPreviewSheet({
  community,
  isMember,
  onJoinPress,
  onEnterPress,
}: CommunityPreviewSheetProps) {
  const { t } = useTranslation('community');

  const { data: recentPosts } = useQuery({
    queryKey: ['communityRecentPosts', community.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts_with_nickname')
        .select('id, content, created_at')
        .eq('community_id', community.id)
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!community.id,
  });

  const { data: artistMembers } = useQuery({
    queryKey: ['communityArtistMembers', community.id],
    queryFn: async (): Promise<ArtistMember[]> => {
      const { data, error } = await supabase
        .from('artist_members')
        .select('id, display_name, profile_image_url')
        .eq('community_id', community.id)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ArtistMember[];
    },
    enabled: community.type === 'group' && !!community.id,
  });

  return (
    <View className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Cover Image */}
        <Image
          source={{ uri: community.cover_image_url ?? undefined }}
          style={{ width: '100%', aspectRatio: 16 / 9 }}
          contentFit="cover"
          transition={200}
        />

        <View className="p-4">
          {/* Community Name */}
          <Text className="text-display font-semibold text-foreground">{community.name}</Text>

          {/* Member count + category */}
          <View className="flex-row items-center mt-2 gap-2">
            <Text className="text-body text-muted-foreground">
              {t('preview.memberCount', { count: community.member_count })}
            </Text>
            {community.category ? (
              <View className="bg-input px-2 py-0.5 rounded-full">
                <Text className="text-label text-muted-foreground">{community.category}</Text>
              </View>
            ) : null}
          </View>

          {/* Description */}
          {community.description ? (
            <Text className="text-body text-foreground mt-3">{community.description}</Text>
          ) : null}

          {/* Artist members thumbnails (group type only) */}
          {community.type === 'group' && artistMembers && artistMembers.length > 0 ? (
            <View className="mt-4">
              <Text className="text-heading font-semibold text-foreground mb-2">
                {t('tabs.artist')}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {artistMembers.map((artist) => (
                  <View key={artist.id} className="items-center mr-3">
                    <Image
                      source={{ uri: artist.profile_image_url ?? undefined }}
                      style={{ width: 48, height: 48, borderRadius: 24 }}
                      contentFit="cover"
                    />
                    <Text className="text-label text-muted-foreground mt-1" numberOfLines={1}>
                      {artist.display_name}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Recent posts preview */}
          {recentPosts && recentPosts.length > 0 ? (
            <View className="mt-4">
              {recentPosts.map((post: { id: string; content: string | null; created_at: string | null }) => (
                <View key={post.id} className="border-t border-border pt-2 mt-2">
                  <Text className="text-body text-foreground" numberOfLines={2}>
                    {post.content}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Spacer for sticky CTA */}
          <View className="h-20" />
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View className="absolute bottom-0 left-0 right-0 pb-6 pt-2 bg-background">
        {isMember ? (
          <PrimaryCTAButton label={t('enter')} onPress={onEnterPress} />
        ) : (
          <PrimaryCTAButton label={t('join.cta')} onPress={onJoinPress} />
        )}
      </View>
    </View>
  );
}

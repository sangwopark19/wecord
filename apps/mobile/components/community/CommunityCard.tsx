import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from '@wecord/shared/i18n';
import type { CommunitySearchResult } from '../../hooks/community/useCommunitySearch';

interface CommunityCardProps {
  community: CommunitySearchResult;
}

export function CommunityCard({ community }: CommunityCardProps) {
  const router = useRouter();
  const { t } = useTranslation('community');

  return (
    <Pressable
      onPress={() => router.push(`/(community)/${community.id}/preview` as never)}
      className="flex-1 m-2 bg-card rounded-xl overflow-hidden"
      accessibilityRole="button"
      accessibilityLabel={community.name}
      style={{ minHeight: 44 }}
    >
      <Image
        source={{ uri: community.cover_image_url ?? undefined }}
        style={{ width: '100%', aspectRatio: 1 }}
        contentFit="cover"
        transition={200}
      />
      <View className="p-2">
        <Text className="text-heading font-semibold text-foreground" numberOfLines={1}>
          {community.name}
        </Text>
        <Text className="text-label text-muted-foreground mt-0.5">
          {t('preview.memberCount', { count: community.member_count })}
        </Text>
      </View>
    </Pressable>
  );
}

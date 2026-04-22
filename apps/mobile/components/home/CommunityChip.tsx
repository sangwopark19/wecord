import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface CommunityChipProps {
  communityId: string;
  communityName: string;
  communitySlug?: string;
}

export function CommunityChip({ communityId, communityName }: CommunityChipProps) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/(community)/${communityId}` as never)}
      accessibilityRole="link"
      accessibilityLabel={`${communityName} 커뮤니티`}
      style={{ alignSelf: 'flex-start', marginBottom: 8 }}
    >
      <View
        className="flex-row items-center border border-accent rounded-full px-2 py-0.5"
        style={{ gap: 4 }}
      >
        <Ionicons name="people-outline" size={12} color="#8B5CF6" />
        <Text className="text-label text-accent">{communityName}</Text>
      </View>
    </Pressable>
  );
}

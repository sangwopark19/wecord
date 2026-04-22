import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@wecord/shared/i18n';
import { useMyCommunities } from '../../hooks/community/useMyCommunities';
import { JoinedCommunityRow } from '../../components/more/JoinedCommunityRow';

export default function JoinedCommunitiesScreen() {
  const router = useRouter();
  const { t } = useTranslation('more');
  const { data, isLoading } = useMyCommunities();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
        }}
        className="border-border"
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="back"
          style={{ minHeight: 44, justifyContent: 'center', marginRight: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text className="text-heading font-semibold text-foreground">
          {t('sections.joinedCommunities')}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator className="mt-12" color="#8B5CF6" />
      ) : (data ?? []).length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="people-outline" size={48} color="#666666" />
          <Text className="text-heading font-semibold text-foreground mt-4 text-center">
            {t('joinedCommunities.emptyHeading')}
          </Text>
          <Text className="text-body text-muted-foreground mt-2 text-center">
            {t('joinedCommunities.emptyBody')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.communityId}
          renderItem={({ item, index }) => (
            <JoinedCommunityRow
              community={item}
              isLast={index === (data?.length ?? 0) - 1}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

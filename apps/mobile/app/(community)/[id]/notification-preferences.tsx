import { View, Text, Pressable, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@wecord/shared/i18n';
import { useNotificationPreferences } from '../../../hooks/notification/useNotificationPreferences';
import type { NotificationPreferences } from '../../../hooks/notification/useNotificationPreferences';

interface PreferenceRowProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

function PreferenceRow({ label, description, value, onChange }: PreferenceRowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
      }}
      className="border-border"
    >
      <View style={{ flex: 1, marginRight: 16 }}>
        <Text className="text-heading font-semibold text-foreground">{label}</Text>
        <Text className="text-label text-muted-foreground mt-1">{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#3A3A3A', true: '#00E5C3' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

export default function NotificationPreferencesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation('notification');

  const communityId = id ?? '';
  const { preferences, updatePreference } = useNotificationPreferences(communityId);

  const handleChange = (column: keyof NotificationPreferences, value: boolean) => {
    updatePreference(column, value);
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
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
          accessibilityLabel="뒤로가기"
          style={{ minHeight: 44, justifyContent: 'center', marginRight: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text className="text-display font-semibold text-foreground">
          {t('preferences.title')}
        </Text>
      </View>

      <ScrollView className="flex-1">
        <PreferenceRow
          label={t('preferences.creatorPost')}
          description={t('preferences.creatorPostDesc')}
          value={preferences.creator_posts}
          onChange={(value) => handleChange('creator_posts', value)}
        />
        <PreferenceRow
          label={t('preferences.comments')}
          description={t('preferences.commentsDesc')}
          value={preferences.comments}
          onChange={(value) => handleChange('comments', value)}
        />
        <PreferenceRow
          label={t('preferences.likes')}
          description={t('preferences.likesDesc')}
          value={preferences.likes}
          onChange={(value) => handleChange('likes', value)}
        />
        <PreferenceRow
          label={t('preferences.notices')}
          description={t('preferences.noticesDesc')}
          value={preferences.notices}
          onChange={(value) => handleChange('notices', value)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

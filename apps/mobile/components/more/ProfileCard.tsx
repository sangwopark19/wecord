import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from '@wecord/shared/i18n';
import type { Profile } from '../../stores/authStore';

interface Props {
  profile: Profile;
}

export function ProfileCard({ profile }: Props) {
  const router = useRouter();
  const { t } = useTranslation('more');
  const initial = (profile.globalNickname?.[0] ?? '?').toUpperCase();

  return (
    <View
      className="bg-card rounded-xl mx-4 p-4 flex-row items-center"
      style={{ height: 88 }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          overflow: 'hidden',
          backgroundColor: '#00E5C3',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {profile.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={{ width: 56, height: 56 }} />
        ) : (
          <Text className="text-heading font-semibold text-foreground">{initial}</Text>
        )}
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text className="text-heading font-semibold text-foreground" numberOfLines={1}>
          {profile.globalNickname}
        </Text>
        {profile.bio ? (
          <Text className="text-body text-muted-foreground" numberOfLines={1}>
            {profile.bio}
          </Text>
        ) : null}
      </View>
      <Pressable
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onPress={() => router.push('/(more)/profile-edit' as any)}
        accessibilityRole="button"
        accessibilityLabel={t('profileCard.editButton')}
        style={{ minHeight: 44, justifyContent: 'center' }}
      >
        <Text className="text-label text-teal">{t('profileCard.editButton')}</Text>
      </Pressable>
    </View>
  );
}

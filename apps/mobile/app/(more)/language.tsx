import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@wecord/shared/i18n';
import i18n from '@wecord/shared/i18n';
import { useAuthStore } from '../../stores/authStore';
import { useUpdateProfile } from '../../hooks/profile/useUpdateProfile';
import {
  LanguagePicker,
  type SupportedLanguage,
} from '../../components/settings/LanguagePicker';

export default function LanguageSettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation('settings');
  const profile = useAuthStore((s) => s.profile);
  const updateProfile = useUpdateProfile();

  useEffect(() => {
    if (!profile) router.back();
  }, [profile, router]);
  if (!profile) return null;

  const handleChange = async (code: SupportedLanguage) => {
    await i18n.changeLanguage(code);
    try {
      await updateProfile.mutateAsync({ language: code });
    } catch {
      // Best effort — i18n already changed; persistence retried on next mutation.
    }
    router.back();
  };

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
          {t('language.rowLabel')}
        </Text>
      </View>
      <View className="px-4">
        <LanguagePicker value={profile.language} onChange={handleChange} mode="settings" />
      </View>
    </SafeAreaView>
  );
}

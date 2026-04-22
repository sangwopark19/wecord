import { useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from '@wecord/shared/i18n';
import { SafeAreaView } from 'react-native-safe-area-context';
import i18n from '@wecord/shared/i18n';
import { PrimaryCTAButton } from '../../components/PrimaryCTAButton';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import {
  LanguagePicker,
  type SupportedLanguage,
} from '../../components/settings/LanguagePicker';

export default function LanguageScreen() {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const { user, profile, setProfile } = useAuthStore();

  const defaultLanguage: SupportedLanguage =
    (profile?.language as SupportedLanguage | undefined) ?? 'ko';
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(defaultLanguage);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!user || !profile) return;

    setLoading(true);
    try {
      await i18n.changeLanguage(selectedLanguage);

      await supabase
        .from('profiles')
        .update({ language: selectedLanguage })
        .eq('user_id', user.id);

      setProfile({ ...profile, language: selectedLanguage });

      router.push('/(onboarding)/curate' as never);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-background">
      <View className="flex-1 px-4">
        <Text className="text-heading font-semibold text-foreground mt-6">
          {t('language.title')}
        </Text>

        <LanguagePicker
          value={selectedLanguage}
          onChange={(code) => {
            setSelectedLanguage(code);
            // Onboarding still previews the change live (parent commits on CTA).
            i18n.changeLanguage(code);
          }}
          mode="onboarding"
        />
      </View>

      <View className="pb-6">
        <PrimaryCTAButton
          label={t('language.cta')}
          onPress={handleContinue}
          loading={loading}
        />
      </View>
    </SafeAreaView>
  );
}

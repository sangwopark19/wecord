import { useState } from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from '@wecord/shared/i18n';
import { SafeAreaView } from 'react-native-safe-area-context';
import i18n from '@wecord/shared/i18n';
import { PrimaryCTAButton } from '../../components/PrimaryCTAButton';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';

type SupportedLanguage = 'ko' | 'en' | 'th' | 'zh' | 'ja';

const LANGUAGES: { code: SupportedLanguage; label: string }[] = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'th', label: 'ภาษาไทย' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
];

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

        <FlatList
          data={LANGUAGES}
          keyExtractor={(item) => item.code}
          className="mt-4"
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderItem={({ item }) => {
            const isSelected = item.code === selectedLanguage;
            return (
              <Pressable
                onPress={() => setSelectedLanguage(item.code)}
                className={`flex-row items-center justify-between h-[52px] rounded-xl px-4 bg-card ${
                  isSelected ? 'border-2 border-teal' : 'border-2 border-transparent'
                }`}
              >
                <Text className="text-body font-regular text-foreground">{item.label}</Text>
                <View
                  className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                    isSelected ? 'border-teal' : 'border-subtle'
                  }`}
                >
                  {isSelected && (
                    <View className="w-[10px] h-[10px] rounded-full bg-teal" />
                  )}
                </View>
              </Pressable>
            );
          }}
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

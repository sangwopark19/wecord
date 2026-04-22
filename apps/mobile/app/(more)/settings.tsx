import { useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@wecord/shared/i18n';
import { useAuthStore } from '../../stores/authStore';
import { SettingsRow } from '../../components/settings/SettingsRow';
import { reconcilePushToggle, readPushPermission } from '../../hooks/settings/usePushPermission';

type SupportedLanguage = 'ko' | 'en' | 'th' | 'zh' | 'ja';

const LANG_LABEL: Record<SupportedLanguage, string> = {
  ko: '한국어',
  en: 'English',
  th: 'ภาษาไทย',
  zh: '中文',
  ja: '日本語',
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const APP_VERSION: string = (require('../../app.json') as { expo: { version: string } }).expo
  .version;

// TODO(07-03): replace with production admin URL.
const TERMS_URL_BASE = 'https://wecord-docs.pages.dev/terms';
const PRIVACY_URL_BASE = 'https://wecord-docs.pages.dev/privacy';

export default function SettingsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation('settings');
  const { t: tMore } = useTranslation('more');
  const profile = useAuthStore((s) => s.profile);
  const [pushEnabled, setPushEnabled] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const { enabled } = await readPushPermission();
        if (!cancelled) setPushEnabled(enabled);
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  const togglePush = useCallback(
    async (desired: boolean) => {
      await reconcilePushToggle({
        desired,
        setEnabled: setPushEnabled,
        copy: {
          rowLabel: t('push.rowLabel'),
          helperOff: t('push.helperOff'),
          openSettingsCta: t('push.openSettingsCta'),
          openSettingsCancel: t('push.openSettingsCancel'),
        },
      });
    },
    [t]
  );

  if (!profile) return null;

  const lang = i18n.language as SupportedLanguage;
  const termsUrl = `${TERMS_URL_BASE}?lang=${lang}`;
  const privacyUrl = `${PRIVACY_URL_BASE}?lang=${lang}`;

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
        <Text className="text-heading font-semibold text-foreground">{t('screenTitle')}</Text>
      </View>

      <ScrollView>
        <View className="bg-card rounded-xl mx-4 mt-6 overflow-hidden">
          <SettingsRow
            leftIcon="language-outline"
            label={t('language.rowLabel')}
            right="valueWithChevron"
            value={LANG_LABEL[profile.language as SupportedLanguage] ?? profile.language}
            isFirst
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onPress={() => router.push('/(more)/language' as any)}
          />
          <SettingsRow
            leftIcon="notifications-outline"
            label={t('push.rowLabel')}
            right="switch"
            switchValue={pushEnabled}
            onSwitchChange={togglePush}
          />
          <SettingsRow
            leftIcon="people-outline"
            label={t('perCommunity.rowLabel')}
            right="chevron"
            isLast
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onPress={() => router.push('/(more)/joined-communities' as any)}
          />
        </View>
        <Text className="text-label text-muted-foreground pl-4 mt-2">
          {pushEnabled ? t('push.helperOn') : t('push.helperOff')}
        </Text>

        <View className="bg-card rounded-xl mx-4 mt-6 overflow-hidden">
          <SettingsRow
            leftIcon="document-text-outline"
            label={t('legal.termsRow')}
            right="chevron"
            isFirst
            onPress={() => Linking.openURL(termsUrl)}
          />
          <SettingsRow
            leftIcon="shield-checkmark-outline"
            label={t('legal.privacyRow')}
            right="chevron"
            onPress={() => Linking.openURL(privacyUrl)}
          />
          <SettingsRow
            leftIcon="information-circle-outline"
            label={tMore('about.versionLabel')}
            right="value"
            value={APP_VERSION}
            isLast
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

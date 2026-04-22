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

// 07-03 Task 3: production admin domain. Replace `wecord-docs.pages.dev` if
// the Cloudflare Pages deploy lands on a different project name OR if you
// later wire a custom domain (e.g. `wecord.app`) per the branded-domain row
// in 07-SUBMISSION-CHECKLIST.md. The legal pages are served by the
// apps/admin (public) route group shipped in 07-03 Task 1.
//
// Manual cutover: see .planning/phases/07-launch-polish/07-03-MANUAL-FOLLOWUP.md
// step "Cloudflare Pages deploy" — once the deploy returns a stable URL,
// update PROD_ADMIN_URL here AND in apps/mobile/app/(tabs)/more.tsx (single
// source of truth would require a config module — kept inline for now to
// avoid a circular import with @wecord/shared).
const PROD_ADMIN_URL = 'https://wecord-docs.pages.dev';
const TERMS_URL_BASE = `${PROD_ADMIN_URL}/terms`;
const PRIVACY_URL_BASE = `${PROD_ADMIN_URL}/privacy`;

export default function SettingsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation('settings');
  const { t: tMore } = useTranslation('more');
  const { t: tAccount } = useTranslation('account');
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

        {/* Phase 7 / D-37 — Destructive group. In-app deletion path is
            ≤3 taps (Home → More → Settings → Delete account) per Google
            Play DMA + Apple Guideline 4.8. */}
        <View className="mt-6 mx-4 bg-card rounded-xl overflow-hidden mb-12">
          <SettingsRow
            label={tAccount('deleteAccount.rowLabel')}
            destructive
            right="chevron"
            isFirst
            isLast
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onPress={() => router.push('/(more)/delete-account/warning' as any)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

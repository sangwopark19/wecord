import { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@wecord/shared/i18n';
import { useAuthStore } from '../../stores/authStore';
import { useMyCommunities } from '../../hooks/community/useMyCommunities';
import { ProfileCard } from '../../components/more/ProfileCard';
import { JoinedCommunityRow } from '../../components/more/JoinedCommunityRow';
import { SettingsRow } from '../../components/settings/SettingsRow';
// expo-application is not installed; use app.json fallback for the version label.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const APP_VERSION: string = (require('../../app.json') as { expo: { version: string } }).expo
  .version;

// 07-03 Task 3: production admin domain. Mirror constant in
// apps/mobile/app/(more)/settings.tsx — both files must agree. Update both
// after the Cloudflare Pages deploy in 07-03-MANUAL-FOLLOWUP.md returns a
// stable URL (default project name `wecord-docs` → `wecord-docs.pages.dev`).
// If a custom domain (e.g. `wecord.app`) is later wired, update both
// constants in the same commit.
const PROD_ADMIN_URL = 'https://wecord-docs.pages.dev';
const TERMS_URL_BASE = `${PROD_ADMIN_URL}/terms`;
const PRIVACY_URL_BASE = `${PROD_ADMIN_URL}/privacy`;

export default function MoreScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation('more');
  const profile = useAuthStore((s) => s.profile);
  const { data: joined, isLoading } = useMyCommunities();

  const lang = i18n.language;
  const termsUrl = `${TERMS_URL_BASE}?lang=${lang}`;
  const privacyUrl = `${PRIVACY_URL_BASE}?lang=${lang}`;

  const handleLogoutPress = useCallback(() => {
    Alert.alert(
      t('logout.dialogTitle'),
      undefined,
      [
        { text: t('logout.dialogCancel'), style: 'cancel' },
        {
          text: t('logout.dialogConfirm'),
          style: 'destructive',
          onPress: async () => {
            // T-7-05: signOut clears state; Task 6 wires queryClient.clear via
            // a registered onSignOut callback. Caller owns navigation.
            await useAuthStore.getState().signOut();
            router.replace('/(auth)/login');
          },
        },
      ],
      { cancelable: true }
    );
  }, [router, t]);

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#00E5C3" />
      </SafeAreaView>
    );
  }

  const visible = (joined ?? []).slice(0, 5);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="border-b border-border px-4 py-3">
        <Text className="text-display font-semibold text-foreground">{t('tabLabel')}</Text>
      </View>
      <ScrollView className="flex-1">
        <View className="mt-4">
          <ProfileCard profile={profile} />
        </View>

        <Text className="text-label text-muted-foreground pl-4 pt-6 pb-2">
          {t('sections.joinedCommunities')}
        </Text>
        {isLoading ? (
          <ActivityIndicator className="my-4" color="#00E5C3" />
        ) : (joined ?? []).length === 0 ? (
          <View className="bg-card rounded-xl mx-4 p-8 items-center">
            <Text className="text-heading font-semibold text-foreground text-center">
              {t('joinedCommunities.emptyHeading')}
            </Text>
            <Text className="text-body text-muted-foreground text-center mt-2">
              {t('joinedCommunities.emptyBody')}
            </Text>
          </View>
        ) : (
          <View className="bg-card rounded-xl mx-4 overflow-hidden">
            {visible.map((c, i) => (
              <JoinedCommunityRow
                key={c.communityId}
                community={c}
                isLast={i === visible.length - 1 && (joined ?? []).length <= 5}
              />
            ))}
            {(joined ?? []).length > 5 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('joinedCommunities.viewAll')}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onPress={() => router.push('/(more)/joined-communities' as any)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  height: 48,
                  paddingHorizontal: 16,
                }}
              >
                <Text className="text-body text-foreground">
                  {t('joinedCommunities.viewAll')}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#999999" />
              </Pressable>
            )}
          </View>
        )}

        <Text className="text-label text-muted-foreground pl-4 pt-6 pb-2">
          {t('sections.settings')}
        </Text>
        <View className="bg-card rounded-xl mx-4 overflow-hidden">
          <SettingsRow
            leftIcon="settings-outline"
            label={t('sections.settings')}
            right="chevron"
            isFirst
            isLast
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onPress={() => router.push('/(more)/settings' as any)}
          />
        </View>

        <Text className="text-label text-muted-foreground pl-4 pt-6 pb-2">
          {t('sections.about')}
        </Text>
        <View className="bg-card rounded-xl mx-4 overflow-hidden">
          <SettingsRow
            label={t('about.versionLabel')}
            right="value"
            value={APP_VERSION}
            isFirst
          />
          <SettingsRow
            leftIcon="document-text-outline"
            label={t('about.versionLabel') /* placeholder; legal rows live in settings */}
            right="none"
            isLast
          />
        </View>

        <View className="mt-6 mx-4 bg-card rounded-xl overflow-hidden mb-12">
          <SettingsRow
            label={t('logout.rowLabel')}
            destructive
            right="none"
            isFirst
            isLast
            onPress={handleLogoutPress}
          />
        </View>

        {/* Inline links — kept here so the More tab About section stays minimal */}
        <View className="px-6 pb-12 items-center">
          <Pressable
            onPress={() => Linking.openURL(termsUrl)}
            accessibilityRole="link"
            accessibilityLabel="Terms"
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Text className="text-label text-muted-foreground">Terms · Privacy</Text>
          </Pressable>
          <Pressable
            onPress={() => Linking.openURL(privacyUrl)}
            accessibilityRole="link"
            accessibilityLabel="Privacy"
            style={{ minHeight: 44, justifyContent: 'center' }}
          >
            <Text className="text-label text-muted-foreground">Privacy Policy</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

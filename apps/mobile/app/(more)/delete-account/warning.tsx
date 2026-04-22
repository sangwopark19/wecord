import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@wecord/shared/i18n';

// Phase 7 / D-37 — Step 1 of 3. Warning + irreversible-action notice.
// Tapping "계속" advances to the DELETE-typing confirmation screen.
export default function DeleteAccountWarningScreen() {
  const router = useRouter();
  const { t } = useTranslation();

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
          {t('account:deleteAccount.rowLabel')}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingTop: 64 }}>
        <Text className="text-display font-semibold text-foreground">
          {t('account:deleteAccount.warningHeading')}
        </Text>
        <Text className="text-body text-muted-foreground mt-4">
          {t('account:deleteAccount.warningBody')}
        </Text>
      </ScrollView>

      <View className="px-4 pb-6">
        <Pressable
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onPress={() => router.push('/(more)/delete-account/confirm' as any)}
          accessibilityRole="button"
          accessibilityLabel={t('account:deleteAccount.continueCta')}
          className="rounded-[28px] items-center justify-center"
          style={{ height: 52, backgroundColor: '#7E1A1A' }}
        >
          <Text className="text-heading font-semibold text-foreground">
            {t('account:deleteAccount.continueCta')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

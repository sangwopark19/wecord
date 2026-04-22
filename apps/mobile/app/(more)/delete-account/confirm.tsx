import { useState } from 'react';
import { View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@wecord/shared/i18n';

// Phase 7 / D-37 — Step 2 of 3. User must type DELETE exactly to enable the
// final destructive button (GitHub repo-delete pattern). Prevents accidental
// account deletion from a stray tap.
export default function DeleteAccountConfirmScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [typed, setTyped] = useState('');
  const canProceed = typed === 'DELETE';

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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 px-6"
        style={{ paddingTop: 48 }}
      >
        <Text className="text-body text-foreground">
          {t('account:deleteAccount.confirmLabel')}
        </Text>
        <TextInput
          value={typed}
          onChangeText={setTyped}
          placeholder={t('account:deleteAccount.confirmPlaceholder')}
          placeholderTextColor="#666666"
          autoCapitalize="characters"
          autoCorrect={false}
          className="bg-card rounded-xl px-4 mt-4 text-body text-foreground"
          style={{ height: 48 }}
          accessibilityLabel={t('account:deleteAccount.confirmLabel')}
        />
      </KeyboardAvoidingView>

      <View className="px-4 pb-6">
        <Pressable
          onPress={() => {
            if (canProceed) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              router.push('/(more)/delete-account/processing' as any);
            }
          }}
          disabled={!canProceed}
          accessibilityRole="button"
          accessibilityLabel={t('account:deleteAccount.finalCta')}
          accessibilityState={{ disabled: !canProceed }}
          className="rounded-[28px] items-center justify-center"
          style={{ height: 52, backgroundColor: canProceed ? '#B91C1C' : '#1C1C1E' }}
        >
          <Text
            className={`text-heading font-semibold ${canProceed ? 'text-foreground' : 'text-subtle'}`}
          >
            {t('account:deleteAccount.finalCta')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

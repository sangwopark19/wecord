import { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from '@wecord/shared/i18n';
import { useDeleteAccount } from '../../../hooks/account/useDeleteAccount';

// Phase 7 / D-37 — Step 3 of 3. Fires the Edge Function on mount.
// On success: signOut already called inside the hook → router.replace
// to /(auth)/login (clears the (more) stack so back button can't recover
// the just-deleted state).
// On error: Alert + router.back() so the user can retry from confirm screen.
export default function DeleteAccountProcessingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const del = useDeleteAccount();
  const firedRef = useRef(false);

  useEffect(() => {
    // useEffect runs twice in StrictMode dev; gate so we only fire once.
    if (firedRef.current) return;
    firedRef.current = true;

    (async () => {
      try {
        await del.mutateAsync();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.replace('/(auth)/login' as any);
      } catch {
        Alert.alert('', t('account:deleteAccount.failureToast'));
        router.back();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background items-center justify-center">
      <ActivityIndicator size="large" color="#00E5C3" />
      <Text className="text-body text-muted-foreground mt-6">
        {t('account:deleteAccount.processing')}
      </Text>
    </SafeAreaView>
  );
}

import '../global.css';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, ActivityIndicator } from 'react-native';
import { initI18n } from '@wecord/shared';
import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { queryClient } from '../lib/queryClient';
import { useAuthStore } from '../stores/authStore';

// Initialize i18n at app startup (before any component renders)
initI18n();

function AuthGuard() {
  const router = useRouter();
  const segments = useSegments();
  const { session, profile, loading, initialize } = useAuthStore();
  const registerOnSignOut = useAuthStore((s) => s.registerOnSignOut);

  useEffect(() => {
    initialize();
  }, []);

  // T-7-05: register the queryClient.clear cleanup with the authStore so
  // signOut() invokes it from inside the finally block. We avoid importing
  // queryClient inside authStore.ts (which would create a Zustand ↔ TanStack
  // import cycle).
  useEffect(() => {
    const unregister = registerOnSignOut(() => {
      queryClient.clear();
    });
    return unregister;
  }, [registerOnSignOut]);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inOnboardingGroup = (segments[0] as any) === '(onboarding)';
    void (segments[0] === '(tabs)'); // inTabsGroup — used for clarity, routing is implicit

    if (!session && !inAuthGroup) {
      // Not authenticated — redirect to login
      router.replace('/(auth)/login');
    } else if (session && profile && !profile.onboardingCompleted && !inOnboardingGroup) {
      // Authenticated but onboarding not complete
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace('/(onboarding)/tos' as any);
    } else if (session && profile?.onboardingCompleted && (inAuthGroup || inOnboardingGroup)) {
      // Authenticated and onboarding complete — send to tabs
      router.replace('/(tabs)');
    }
  }, [session, profile, loading, segments]);

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-display font-semibold text-foreground mb-4">Wecord</Text>
        <ActivityIndicator color="#FFFFFF" size="small" />
      </View>
    );
  }

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
    Pretendard: require('pretendard/dist/public/static/alternative/Pretendard-Regular.ttf'),
    'Pretendard-SemiBold': require('pretendard/dist/public/static/alternative/Pretendard-SemiBold.ttf'),
    'Pretendard-Bold': require('pretendard/dist/public/static/alternative/Pretendard-Bold.ttf'),
    'Pretendard-ExtraBold': require('pretendard/dist/public/static/alternative/Pretendard-ExtraBold.ttf'),
    'Pretendard-Black': require('pretendard/dist/public/static/alternative/Pretendard-Black.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#FFFFFF" size="small" />
      </View>
    );
  }

  return (
    <ActionSheetProvider>
      <QueryClientProvider client={queryClient}>
        <View className="flex-1 bg-background">
          <StatusBar style="light" />
          <AuthGuard />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#0B0B0F' },
            }}
          />
        </View>
      </QueryClientProvider>
    </ActionSheetProvider>
  );
}

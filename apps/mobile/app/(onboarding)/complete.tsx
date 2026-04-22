import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';

export default function CompleteScreen() {
  const router = useRouter();
  const { user, profile, setProfile, onboardingData } = useAuthStore();

  useEffect(() => {
    async function finishOnboarding() {
      if (!user || !profile) return;

      await supabase
        .from('profiles')
        .update({
          date_of_birth: onboardingData?.dateOfBirth ?? null,
          language: profile.language,
          onboarding_completed: true,
        })
        .eq('user_id', user.id);

      setProfile({ ...profile, onboardingCompleted: true });

      await new Promise((resolve) => setTimeout(resolve, 500));

      router.replace('/(tabs)');
    }

    void finishOnboarding();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center">
        <Text className="text-display font-semibold text-foreground">Wecord</Text>
        <Text className="text-body font-regular text-muted-foreground mt-4">환영합니다</Text>
      </View>
    </SafeAreaView>
  );
}

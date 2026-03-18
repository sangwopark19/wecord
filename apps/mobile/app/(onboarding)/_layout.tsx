import { Stack, useSegments } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OnboardingDotIndicator } from '../../components/OnboardingDotIndicator';

const STEP_MAP: Record<string, number> = {
  tos: 0,
  dob: 1,
  language: 2,
  curate: 3,
};

export default function OnboardingLayout() {
  const segments = useSegments();
  const lastSegment = segments[segments.length - 1] ?? '';
  const currentStep = STEP_MAP[lastSegment] ?? 0;

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView edges={['top']}>
        <OnboardingDotIndicator currentStep={currentStep} totalSteps={4} />
      </SafeAreaView>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000000' },
          animation: 'slide_from_right',
        }}
      />
    </View>
  );
}

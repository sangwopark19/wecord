import { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

interface OnboardingDotIndicatorProps {
  currentStep: number;
  totalSteps?: number;
}

function AnimatedDot({ isActive }: { isActive: boolean }) {
  const scaleAnim = useRef(new Animated.Value(isActive ? 1.25 : 1.0)).current;

  useEffect(() => {
    Animated.timing(scaleAnim, {
      toValue: isActive ? 1.25 : 1.0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isActive, scaleAnim]);

  return (
    <Animated.View
      style={{ transform: [{ scale: scaleAnim }] }}
      className={`w-2 h-2 rounded-full ${isActive ? 'bg-teal' : 'bg-input'}`}
    />
  );
}

export function OnboardingDotIndicator({
  currentStep,
  totalSteps = 4,
}: OnboardingDotIndicatorProps) {
  return (
    <View className="flex-row justify-center items-center gap-1 py-4">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <AnimatedDot key={index} isActive={index === currentStep} />
      ))}
    </View>
  );
}

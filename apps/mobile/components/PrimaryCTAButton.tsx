import { useState } from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';

interface PrimaryCTAButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

export function PrimaryCTAButton({
  label,
  onPress,
  disabled = false,
  loading = false,
}: PrimaryCTAButtonProps) {
  const [pressed, setPressed] = useState(false);

  const isDisabledState = disabled || loading;

  const bgClass = isDisabledState
    ? 'bg-input'
    : pressed
      ? 'bg-teal-dark'
      : 'bg-teal';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={isDisabledState}
      className={`mx-4 h-[52px] rounded-[28px] items-center justify-center ${bgClass}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabledState }}
    >
      {loading ? (
        <ActivityIndicator color="#000000" size={20} />
      ) : (
        <Text
          className={`text-heading font-semibold ${isDisabledState ? 'text-subtle' : 'text-[#000000]'}`}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

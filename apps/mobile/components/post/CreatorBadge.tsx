import { View, Text } from 'react-native';

export function CreatorBadge() {
  return (
    <View
      className="bg-card border border-teal/30 rounded px-1.5 py-0.5"
      accessibilityRole="text"
      accessibilityLabel="크리에이터"
    >
      <Text className="text-teal text-label font-semibold">Creator</Text>
    </View>
  );
}

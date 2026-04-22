import { View, Text } from 'react-native';

export function CreatorBadge() {
  return (
    <View
      style={{
        backgroundColor: '#8B5CF6',
        borderRadius: 3,
        paddingHorizontal: 6,
        paddingVertical: 2,
      }}
      accessibilityRole="text"
      accessibilityLabel="크리에이터"
    >
      <Text
        style={{
          color: '#FFFFFF',
          fontSize: 10,
          fontFamily: 'Pretendard-Bold',
          letterSpacing: 0.4,
        }}
      >
        OFFICIAL
      </Text>
    </View>
  );
}

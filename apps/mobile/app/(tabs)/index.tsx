import { View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <Text className="text-foreground text-display font-semibold">Wecord</Text>
      <Text className="text-muted-foreground text-body mt-2">Foundation Phase</Text>
    </View>
  );
}

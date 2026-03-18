import { Link, Stack } from 'expo-router';
import { View, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View className="flex-1 bg-background items-center justify-center p-4">
        <Text className="text-foreground text-display font-semibold">
          This screen does not exist.
        </Text>
        <Link href="/" className="mt-4">
          <Text className="text-teal text-body">Go to home screen!</Text>
        </Link>
      </View>
    </>
  );
}

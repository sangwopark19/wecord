import '../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { initI18n } from '@wecord/shared';

// Initialize i18n at app startup (before any component renders)
initI18n();

export default function RootLayout() {
  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000000' },
        }}
      />
    </View>
  );
}

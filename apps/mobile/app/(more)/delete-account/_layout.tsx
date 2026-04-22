import { Stack } from 'expo-router';

// 3-screen delete-account flow stack. Inherits the (more) group's headerless
// dark theme; each screen renders its own back arrow + title.
export default function DeleteAccountLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' },
      }}
    />
  );
}

import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export function FAB() {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push('/(community)/compose' as never)}
      className="absolute bottom-24 right-4 w-14 h-14 bg-teal rounded-full items-center justify-center"
      style={{ elevation: 4 }}
      accessibilityRole="button"
      accessibilityLabel="새 글 쓰기"
    >
      <Ionicons name="add" size={28} color="#000000" />
    </Pressable>
  );
}

import { View, Text } from 'react-native';

interface NotificationGroupHeaderProps {
  label: string;
}

export function NotificationGroupHeader({ label }: NotificationGroupHeaderProps) {
  return (
    <View style={{ paddingVertical: 8, paddingHorizontal: 16 }} className="bg-background">
      <Text className="text-label font-semibold text-muted-foreground">{label}</Text>
    </View>
  );
}

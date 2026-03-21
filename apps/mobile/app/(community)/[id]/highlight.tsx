import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import HighlightScreen from '../../../components/highlight/HighlightScreen';

export default function HighlightTab() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View className="flex-1 bg-background">
      <HighlightScreen communityId={id ?? ''} />
    </View>
  );
}

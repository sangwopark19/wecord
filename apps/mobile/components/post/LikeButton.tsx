import { Pressable, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface LikeButtonProps {
  isLiked: boolean;
  likeCount: number;
  onPress: () => void;
  size?: 'sm' | 'md';
}

export function LikeButton({ isLiked, likeCount, onPress, size = 'md' }: LikeButtonProps) {
  const scale = useSharedValue(1);

  const iconSize = size === 'sm' ? 16 : 20;
  const tealColor = '#00E5C3';
  const defaultColor = '#999999';

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    // Reset to 1 first to ensure animation always triggers
    scale.value = 1;
    scale.value = withSequence(
      withSpring(1.3, { damping: 8, stiffness: 300 }),
      withSpring(1.0, { damping: 8, stiffness: 300 })
    );
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center gap-1"
      style={{ minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}
      accessibilityRole="button"
      accessibilityLabel={isLiked ? '좋아요 취소' : '좋아요'}
      accessibilityState={{ selected: isLiked }}
    >
      <Animated.View style={animatedStyle}>
        <Ionicons
          name={isLiked ? 'heart' : 'heart-outline'}
          size={iconSize}
          color={isLiked ? tealColor : defaultColor}
        />
      </Animated.View>
      <Text
        className={
          size === 'sm'
            ? 'text-label text-muted-foreground'
            : 'text-body text-muted-foreground'
        }
      >
        {likeCount}
      </Text>
    </Pressable>
  );
}

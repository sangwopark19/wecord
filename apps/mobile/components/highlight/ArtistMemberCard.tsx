import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { HighlightArtistMember } from '../../hooks/highlight/useHighlight';

interface ArtistMemberCardProps {
  member: HighlightArtistMember;
  onPress: () => void;
}

export function ArtistMemberCard({ member, onPress }: ArtistMemberCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={member.display_name}
      style={{ width: 80, height: 100, alignItems: 'center' }}
    >
      {/* Circular avatar — 56px diameter */}
      {member.profile_image_url ? (
        <Image
          source={{ uri: member.profile_image_url }}
          style={{ width: 56, height: 56, borderRadius: 28 }}
          contentFit="cover"
        />
      ) : (
        <View className="bg-input" style={{ width: 56, height: 56, borderRadius: 28 }} />
      )}

      {/* Member name */}
      <Text
        className="text-label font-regular text-foreground text-center mt-1"
        numberOfLines={1}
        style={{ width: 80 }}
      >
        {member.display_name}
      </Text>
    </Pressable>
  );
}

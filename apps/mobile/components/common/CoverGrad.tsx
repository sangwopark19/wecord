import { View, Text, ViewStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const PALETTES: ReadonlyArray<readonly [string, string, string]> = [
  ['#8B5CF6', '#EC4899', '#F59E0B'],
  ['#22D3EE', '#6366F1', '#0F172A'],
  ['#F43F5E', '#7C3AED', '#1E1B4B'],
  ['#F97316', '#FB7185', '#7C2D12'],
  ['#10B981', '#0891B2', '#064E3B'],
  ['#FACC15', '#F97316', '#4C1D95'],
  ['#E11D48', '#1E1B4B', '#000000'],
  ['#60A5FA', '#A855F7', '#111827'],
];

const AVATAR_PALETTE = [
  '#8B5CF6',
  '#EC4899',
  '#22D3EE',
  '#F97316',
  '#10B981',
  '#F43F5E',
  '#6366F1',
  '#FACC15',
  '#14B8A6',
  '#EF4444',
];

function pickPalette(seed: number): readonly [string, string, string] {
  const idx = ((seed % PALETTES.length) + PALETTES.length) % PALETTES.length;
  return PALETTES[idx]!;
}

interface CoverGradProps {
  seed?: number;
  r?: number;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
}

export function CoverGrad({ seed = 0, r = 0, style, borderRadius }: CoverGradProps) {
  const [c0, c1, c2] = pickPalette(seed);

  const spotOffsetX = 0.1 + ((r % 5) * 0.12);
  const spotOffsetY = 0.18 + ((r % 3) * 0.14);

  return (
    <View
      style={[
        { overflow: 'hidden', backgroundColor: c2 },
        borderRadius !== undefined ? { borderRadius } : null,
        style,
      ]}
    >
      <LinearGradient
        colors={[c0, c1, c2]}
        locations={[0, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']}
        start={{ x: spotOffsetX, y: spotOffsetY }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
    </View>
  );
}

interface AvatarProps {
  name?: string;
  seed?: number;
  size?: number;
  ring?: boolean;
  ringColor?: string;
  shape?: 'circle' | 'square';
}

export function Avatar({
  name = 'A',
  seed = 0,
  size = 36,
  ring = false,
  ringColor = '#0B0B0F',
  shape = 'circle',
}: AvatarProps) {
  const charCode = name.length > 0 ? name.charCodeAt(0) : 65;
  const bg = AVATAR_PALETTE[((seed + charCode) % AVATAR_PALETTE.length + AVATAR_PALETTE.length) % AVATAR_PALETTE.length]!;
  const cleaned = name.replace(/[^A-Za-z0-9가-힣ぁ-んァ-ヶ一-龯]/g, '').slice(0, 2).toUpperCase();
  const initials = cleaned.length > 0 ? cleaned : '✦';

  const borderWidth = ring ? 2 : 0;
  const outer = size + borderWidth * 2;

  return (
    <View
      style={{
        width: outer,
        height: outer,
        borderRadius: shape === 'square' ? 8 : outer / 2,
        backgroundColor: ring ? ringColor : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: shape === 'square' ? 6 : size / 2,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Text
          style={{
            color: '#FFFFFF',
            fontFamily: 'Pretendard-Bold',
            fontSize: Math.round(size * 0.38),
            letterSpacing: -0.3,
          }}
          numberOfLines={1}
        >
          {initials}
        </Text>
      </View>
    </View>
  );
}

export function getSeedFromString(str: string | null | undefined): number {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

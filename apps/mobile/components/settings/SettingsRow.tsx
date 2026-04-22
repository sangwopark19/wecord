import { View, Text, Pressable, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface Props {
  leftIcon?: IoniconName;
  label: string;
  value?: string;
  right?: 'switch' | 'chevron' | 'valueWithChevron' | 'value' | 'none';
  switchValue?: boolean;
  onSwitchChange?: (v: boolean) => void;
  destructive?: boolean;
  onPress?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function SettingsRow({
  leftIcon,
  label,
  value,
  right = 'chevron',
  switchValue,
  onSwitchChange,
  destructive,
  onPress,
  isLast,
}: Props) {
  const Container = onPress ? Pressable : View;
  const containerProps = onPress
    ? {
        accessibilityRole: 'button' as const,
        accessibilityLabel: label,
        onPress,
      }
    : {};

  return (
    <Container
      {...containerProps}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        paddingHorizontal: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: '#2A2A2A',
      }}
    >
      {leftIcon && (
        <Ionicons
          name={leftIcon}
          size={20}
          color={destructive ? '#FF4D4F' : '#FFFFFF'}
          style={{ marginRight: 12 }}
        />
      )}
      <Text
        className={`flex-1 text-body font-regular ${
          destructive ? 'text-destructive' : 'text-foreground'
        }`}
      >
        {label}
      </Text>
      {right === 'switch' && (
        <Switch
          value={!!switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: '#2A2A2A', true: '#00E5C3' }}
          thumbColor="#FFFFFF"
          accessibilityRole="switch"
        />
      )}
      {right === 'value' && (
        <Text className="text-body text-muted-foreground">{value}</Text>
      )}
      {right === 'valueWithChevron' && (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text className="text-body text-muted-foreground" style={{ marginRight: 4 }}>
            {value}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#999999" />
        </View>
      )}
      {right === 'chevron' && <Ionicons name="chevron-forward" size={16} color="#999999" />}
    </Container>
  );
}

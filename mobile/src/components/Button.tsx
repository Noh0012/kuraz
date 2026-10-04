import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, shadow } from '@/theme/tokens';
import { Text } from './Text';

type Variant = 'primary' | 'dark' | 'outline' | 'white' | 'whiteOutline' | 'orange' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.primary, fg: colors.white },
  dark: { bg: colors.ink, fg: colors.white },
  outline: { bg: colors.white, fg: colors.text, border: colors.border },
  white: { bg: colors.white, fg: colors.primary },
  whiteOutline: { bg: 'transparent', fg: colors.white, border: colors.white },
  orange: { bg: colors.orange, fg: colors.white },
  ghost: { bg: 'transparent', fg: colors.primary },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
};

interface Props {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  icon?: ComponentProps<typeof Ionicons>['name'];
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ title, onPress, variant = 'primary', size = 'md', icon, loading, disabled, style }: Props) {
  const v = VARIANTS[variant];
  const height = size === 'sm' ? 38 : size === 'lg' ? 54 : 46;
  const fontSize = size === 'sm' ? 14 : 16;
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        {
          height,
          paddingHorizontal: size === 'sm' ? 14 : 20,
          borderRadius: radius.sm,
          backgroundColor: v.bg,
          borderWidth: v.border ? 1.5 : 0,
          borderColor: v.border,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: inactive ? 0.55 : pressed ? 0.85 : 1,
        },
        variant === 'orange' && shadow.card,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon && <Ionicons name={icon} size={fontSize + 2} color={v.fg} />}
          <Text weight="semibold" numberOfLines={1} style={{ color: v.fg, fontSize }}>
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

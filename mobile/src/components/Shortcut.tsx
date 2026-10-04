import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import { colors } from '@/theme/tokens';
import { Text } from './Text';

/** Icon tile + label shortcut ("Bookmarks", "Saved Videos"). */
export function Shortcut({
  icon,
  label,
  onPress,
  tint = colors.primary,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  tint?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, opacity: pressed ? 0.75 : 1 })}
    >
      <View style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: '#E1EEFB', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={28} color={tint} />
      </View>
      <Text weight="medium" style={{ fontSize: 17, color: colors.textSoft }}>
        {label}
      </Text>
    </Pressable>
  );
}

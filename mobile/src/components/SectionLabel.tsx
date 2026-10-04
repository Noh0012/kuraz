import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '@/theme/tokens';
import { Text } from './Text';

/** Uppercase grey section heading ("MOST WATCHED", "CURATED FOR YOU"). */
export function SectionLabel({ children, right, style }: { children: string; right?: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }, style]}>
      <Text weight="semibold" style={{ fontSize: 15, color: colors.label, letterSpacing: 0.6, textTransform: 'uppercase' }}>
        {children}
      </Text>
      {right}
    </View>
  );
}

export function Chip({ label, tone = 'blue' }: { label: string; tone?: 'blue' | 'green' | 'orange' | 'grey' | 'red' }) {
  const palette = {
    blue: { bg: colors.primarySoft, fg: colors.primaryDark },
    green: { bg: colors.successSoft, fg: colors.success },
    orange: { bg: colors.warningSoft, fg: colors.warning },
    grey: { bg: colors.divider, fg: colors.textSoft },
    red: { bg: colors.dangerSoft, fg: colors.danger },
  }[tone];
  return (
    <View style={{ backgroundColor: palette.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' }}>
      <Text weight="bold" style={{ color: palette.fg, fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase' }}>
        {label}
      </Text>
    </View>
  );
}

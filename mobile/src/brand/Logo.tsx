import { useId } from 'react';
import { View, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Text } from '@/components/Text';
import { colors } from '@/theme/tokens';

// Kuraz = the small tin kerosene lamp generations of Ethiopian students studied by.
// Mark: a flame (with an inner flame) over the lamp's wick holder and body.
export const FLAME_OUTER =
  'M50 8C50 8 74 31 74 51C74 64.3 63.3 74 50 74C36.7 74 26 64.3 26 51C26 39 34 30 39 22C40 31 44 36 48 38C47 27 49 15 50 8Z';
export const FLAME_INNER = 'M50 40C50 40 62 51 62 59.5C62 66 56.6 70.5 50 70.5C43.4 70.5 38 66 38 59.5C38 51 50 40 50 40Z';
export const LAMP_NECK = 'M46 75H54V80H46Z';
export const LAMP_BODY = 'M40 81H60C62.2 81 64 82.8 64 85V91C64 93.2 62.2 95 60 95H40C37.8 95 36 93.2 36 91V85C36 82.8 37.8 81 40 81Z';

interface MarkProps {
  size: number;
  color?: string;
  innerColor?: string;
}

/** The bare flame-and-lamp mark (used on the splash screen). */
export function LogoMark({ size, color = colors.white, innerColor = '#9EDCFF' }: MarkProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Path d={FLAME_OUTER} fill={color} />
      <Path d={FLAME_INNER} fill={innerColor} />
      <Path d={LAMP_NECK} fill={color} />
      <Path d={LAMP_BODY} fill={color} />
    </Svg>
  );
}

/** App-icon tile: the mark on the blue gradient rounded square. */
export function LogoTile({ size, style }: { size: number; style?: ViewStyle }) {
  // SVG ids are document-global on web; a shared id would resolve to a hidden screen's copy.
  const gradientId = `kurazTile${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#22C3F7" />
            <Stop offset="1" stopColor="#0A84E8" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" rx="24" fill={`url(#${gradientId})`} />
        <Path d={FLAME_OUTER} fill={colors.white} transform="translate(17 13) scale(0.66)" />
        <Path d={FLAME_INNER} fill="#7FD1FF" transform="translate(17 13) scale(0.66)" />
        <Path d={LAMP_NECK} fill={colors.white} transform="translate(17 13) scale(0.66)" />
        <Path d={LAMP_BODY} fill={colors.white} transform="translate(17 13) scale(0.66)" />
      </Svg>
    </View>
  );
}

/** Tile + "Kuraz" wordmark, as on the bottom of the splash screen. */
export function LogoLockup({ size = 56, color = colors.white }: { size?: number; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: size * 0.3 }}>
      <LogoTile size={size} />
      <Text weight="bold" style={{ fontSize: size * 0.62, color, letterSpacing: -0.5 }}>
        Kuraz
      </Text>
    </View>
  );
}

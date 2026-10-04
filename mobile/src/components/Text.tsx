import { Text as RNText, type TextProps } from 'react-native';
import { colors, fonts } from '@/theme/tokens';

export type Weight = keyof typeof fonts;

/** App text: Inter in the given weight (custom fonts on Android ignore fontWeight, so we pick the family). */
export function Text({ weight = 'regular', style, ...rest }: TextProps & { weight?: Weight }) {
  return <RNText {...rest} style={[{ fontFamily: fonts[weight], color: colors.text, fontSize: 15 }, style]} />;
}

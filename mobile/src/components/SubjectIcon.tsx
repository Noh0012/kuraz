import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { View } from 'react-native';
import { alpha } from '@/theme/tokens';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const ICONS: Record<string, IconName> = {
  math: 'calculator-variant-outline',
  english: 'alphabetical-variant',
  physics: 'atom',
  chemistry: 'flask-outline',
  biology: 'dna',
  book: 'book-open-variant',
};

export function subjectIconName(icon: string): IconName {
  return ICONS[icon] ?? ICONS.book;
}

/** Coloured soft tile with the subject glyph (QBank list, chips, thumbnails). */
export function SubjectIcon({ icon, color, size = 64 }: { icon: string; color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        backgroundColor: alpha(color, 0.12),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <MaterialCommunityIcons name={subjectIconName(icon)} size={size * 0.5} color={color} />
    </View>
  );
}

import { View } from 'react-native';
import { colors } from '@/theme/tokens';

export function ProgressBar({ value, color = colors.primary, height = 4, track = colors.divider }: { value: number; color?: string; height?: number; track?: string }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden', flex: 1 }}>
      <View style={{ width: `${pct * 100}%`, height, borderRadius: height, backgroundColor: color }} />
    </View>
  );
}

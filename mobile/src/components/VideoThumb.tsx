import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { formatDuration } from '@/lib/format';
import { alpha, colors } from '@/theme/tokens';
import { subjectIconName } from './SubjectIcon';
import { Text } from './Text';

interface Props {
  width: number;
  subject: { icon: string; color: string };
  thumbnailUrl?: string | null;
  durationSeconds?: number;
  locked?: boolean;
  progress?: number; // 0..1
  style?: StyleProp<ViewStyle>;
}

/** Lesson thumbnail: the real image when there is one, otherwise a subject-coloured card. */
export function VideoThumb({ width, subject, thumbnailUrl, durationSeconds, locked, progress, style }: Props) {
  const height = Math.round((width * 9) / 16);
  const small = width < 120;
  return (
    <View style={[{ width, height, borderRadius: small ? 8 : 12, overflow: 'hidden' }, style]}>
      {thumbnailUrl ? (
        <Image source={{ uri: thumbnailUrl }} style={{ width, height }} contentFit="cover" />
      ) : (
        <LinearGradient colors={[subject.color, alpha('#0D2457', 0.95)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width, height }}>
          <MaterialCommunityIcons
            name={subjectIconName(subject.icon)}
            size={height * 0.9}
            color={alpha('#FFFFFF', 0.14)}
            style={{ position: 'absolute', right: -height * 0.12, bottom: -height * 0.18 }}
          />
        </LinearGradient>
      )}
      <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}>
        <View
          style={{
            width: small ? 22 : 40,
            height: small ? 22 : 40,
            borderRadius: 40,
            backgroundColor: locked ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.92)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons
            name={locked ? 'lock-closed' : 'play'}
            size={small ? 11 : 18}
            color={locked ? colors.white : colors.primary}
            style={locked ? undefined : { marginLeft: 2 }}
          />
        </View>
      </View>
      {!!durationSeconds && !small && (
        <View style={{ position: 'absolute', right: 6, bottom: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
          <Text weight="semibold" style={{ color: colors.white, fontSize: 11 }}>
            {formatDuration(durationSeconds)}
          </Text>
        </View>
      )}
      {progress !== undefined && progress > 0 && (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: 'rgba(255,255,255,0.35)' }}>
          <View style={{ width: `${Math.min(1, progress) * 100}%`, height: 3, backgroundColor: colors.danger }} />
        </View>
      )}
    </View>
  );
}

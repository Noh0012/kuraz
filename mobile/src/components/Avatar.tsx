import { Image } from 'expo-image';
import { View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { initials } from '@/lib/format';
import { alpha, colors } from '@/theme/tokens';
import { Text } from './Text';

/** Teacher picture: photo when available, otherwise initials on a soft peach tile (Videos list). */
export function TeacherAvatar({ name, url, size = 72, color = '#F08A6C' }: { name: string | null; url?: string | null; size?: number; color?: string }) {
  if (url) return <Image source={{ uri: url }} style={{ width: size, height: size, borderRadius: size * 0.22 }} contentFit="cover" />;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        backgroundColor: alpha(color, 0.16),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text weight="bold" style={{ fontSize: size * 0.34, color }}>
        {initials(name)}
      </Text>
    </View>
  );
}

/** Student avatar: photo, or the light-blue person silhouette from the reference app. */
export function UserAvatar({ url, size = 48, warn = false }: { url?: string | null; size?: number; warn?: boolean }) {
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: '#BFE3F7',
          overflow: 'hidden',
          backgroundColor: '#EAF6FD',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {url ? (
          <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <Svg width={size * 0.86} height={size * 0.86} viewBox="0 0 100 100">
            <Circle cx="50" cy="38" r="19" fill="#5AACDA" />
            <Path d="M14 96C14 74 30 62 50 62C70 62 86 74 86 96Z" fill="#5AACDA" />
          </Svg>
        )}
      </View>
      {warn && (
        <View
          style={{
            position: 'absolute',
            right: -2,
            bottom: -2,
            width: size * 0.36,
            height: size * 0.36,
            borderRadius: size,
            backgroundColor: colors.orange,
            borderWidth: 2,
            borderColor: colors.white,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text weight="extrabold" style={{ color: colors.white, fontSize: size * 0.2, lineHeight: size * 0.24 }}>
            !
          </Text>
        </View>
      )}
    </View>
  );
}

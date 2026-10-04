import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, View } from 'react-native';
import type { ContinueWatching, Plan } from '@/types/contracts';
import { formatRemaining } from '@/lib/format';
import { colors, gutter, shadow } from '@/theme/tokens';
import { Text } from './Text';
import { VideoThumb } from './VideoThumb';

/** Sticky "Start your prep with PREMIUM plan · UPGRADE" banner above the tab bar. */
export function UpgradeBanner({ plan }: { plan: Plan | null }) {
  const router = useRouter();
  if (plan?.tier === 'premium') return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Upgrade to Premium"
      onPress={() => router.push('/plans')}
      style={[
        {
          position: 'absolute',
          left: gutter,
          right: gutter,
          bottom: 12,
          backgroundColor: colors.navy,
          borderRadius: 14,
          paddingVertical: 10,
          paddingLeft: 12,
          paddingRight: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        },
        shadow.raised,
      ]}
    >
      <View style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name="hexagon" size={34} color={colors.orange} style={{ position: 'absolute' }} />
        <Ionicons name="star" size={15} color={colors.white} />
      </View>
      <Text weight="semibold" style={{ color: colors.white, fontSize: 15, flex: 1 }} numberOfLines={2}>
        {plan ? 'Unlock all tests with PREMIUM' : 'Start your prep with PREMIUM plan'}
      </Text>
      <View style={[{ backgroundColor: colors.orange, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9 }, shadow.card]}>
        <Text weight="bold" style={{ color: colors.white, fontSize: 15, letterSpacing: 0.4 }}>
          UPGRADE
        </Text>
      </View>
    </Pressable>
  );
}

/** "Continue watching" mini bar pinned above the tab bar on the Videos tab. */
export function ContinueBar({ item }: { item: ContinueWatching }) {
  const router = useRouter();
  const { video } = item;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Continue watching ${video.title}`}
      onPress={() => router.push(`/video/${video.id}`)}
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.divider,
          paddingHorizontal: gutter,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        shadow.raised,
      ]}
    >
      <VideoThumb
        width={96}
        subject={video.subject}
        thumbnailUrl={video.thumbnail_url}
        progress={video.duration_seconds ? (video.progress?.position_seconds ?? 0) / video.duration_seconds : 0}
      />
      <View style={{ flex: 1, gap: 4 }}>
        <Text weight="semibold" style={{ fontSize: 15 }} numberOfLines={1}>
          {video.title}
        </Text>
        <Text style={{ fontSize: 13, color: colors.textMuted }} numberOfLines={1}>
          {formatRemaining(item.remaining_seconds)} | {video.subject.name}
        </Text>
      </View>
      <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="chevron-forward" size={20} color={colors.white} />
      </View>
    </Pressable>
  );
}

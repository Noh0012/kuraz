import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, useWindowDimensions, View } from 'react-native';
import type { VideoCard } from '@/types/contracts';
import { colors, gradients, gutter, radius, shadow } from '@/theme/tokens';
import { Text } from '../Text';
import { TeacherFigure } from './TeacherFigure';

const GAP = 16;

/** Horizontal, snapping carousel of the grade's most watched lessons with pagination dots. */
export function MostWatched({ videos }: { videos: VideoCard[] }) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - gutter * 2 - 26, 420);
  const [index, setIndex] = useState(0);

  return (
    <View>
      <FlatList
        horizontal
        data={videos}
        keyExtractor={(v) => v.id}
        renderItem={({ item, index: i }) => <HeroCard video={item} rank={i + 1} width={cardWidth} />}
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + GAP}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: gutter, gap: GAP, paddingBottom: 6 }}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / (cardWidth + GAP)))}
      />
      {videos.length > 1 && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 7, marginTop: 16 }}>
          {videos.map((v, i) => (
            <View
              key={v.id}
              style={{
                width: i === index ? 24 : 7,
                height: 7,
                borderRadius: 4,
                backgroundColor: i === index ? colors.ink : '#D9DCE6',
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function HeroCard({ video, rank, width }: { video: VideoCard; rank: number; width: number }) {
  const router = useRouter();
  const heroHeight = Math.round(width * 0.56);
  const open = () => router.push(`/video/${video.id}`);
  return (
    <View style={[{ width, backgroundColor: colors.white, borderRadius: radius.lg }, shadow.card]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Watch ${video.title}`} onPress={open}>
        <LinearGradient
          colors={gradients.heroCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ height: heroHeight, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, overflow: 'hidden' }}
        >
          <View style={{ position: 'absolute', left: 0, bottom: 0 }}>
            <TeacherFigure width={width * 0.42} color={video.subject.color} variant={rank} teacherName={video.subject.teacher_name} />
          </View>
          <LinearGradient
            colors={gradients.badge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, right: 0, paddingHorizontal: 16, paddingVertical: 10, borderBottomLeftRadius: 16 }}
          >
            <Text weight="bold" style={{ color: colors.white, fontSize: 20 }}>
              #{rank}
            </Text>
          </LinearGradient>
          <View style={{ marginLeft: width * 0.42, paddingRight: 16, paddingTop: heroHeight * 0.24, gap: 6 }}>
            <Text weight="semibold" style={{ color: colors.white, fontSize: 13, letterSpacing: 1.2 }} numberOfLines={1}>
              {video.subject.name.toUpperCase()}
            </Text>
            <Text weight="bold" style={{ color: colors.white, fontSize: 19, lineHeight: 24 }} numberOfLines={2}>
              {video.title}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15 }} numberOfLines={1}>
              {video.subject.teacher_name}
            </Text>
            <View
              style={{
                marginTop: 6,
                alignSelf: 'flex-start',
                backgroundColor: colors.primary,
                borderRadius: 6,
                paddingHorizontal: 14,
                paddingVertical: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {video.locked && <Ionicons name="lock-closed" size={14} color={colors.white} />}
              <Text weight="semibold" style={{ color: colors.white, fontSize: 15 }}>
                Watch Now
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
      <View style={{ padding: 14 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Lesson notes"
          onPress={open}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            borderWidth: 1.5,
            borderColor: colors.border,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#DDF5EA', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="document-text" size={20} color="#3DB38A" />
          </View>
          <Text weight="semibold" style={{ fontSize: 18, flex: 1 }}>
            Notes
          </Text>
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

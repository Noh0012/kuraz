import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { TeacherAvatar } from '@/components/Avatar';
import { ScreenHeader } from '@/components/Headers';
import { Chip } from '@/components/SectionLabel';
import { ErrorState, LoadingState } from '@/components/States';
import { Text } from '@/components/Text';
import { VideoThumb } from '@/components/VideoThumb';
import { formatDuration } from '@/lib/format';
import { useSubjectVideos } from '@/lib/queries';
import { colors, gutter } from '@/theme/tokens';

export default function SubjectVideosScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const q = useSubjectVideos(id);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title={q.data?.subject.name ?? 'Videos'} />
      {q.isPending ? (
        <LoadingState />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => q.refetch()} colors={[colors.primary]} />}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: gutter, backgroundColor: colors.white }}>
            <TeacherAvatar name={q.data.subject.teacher_name} url={q.data.subject.teacher_avatar_url} color={q.data.subject.color} size={60} />
            <View style={{ flex: 1 }}>
              <Text weight="semibold" style={{ fontSize: 18 }}>
                {q.data.subject.teacher_name}
              </Text>
              <Text style={{ color: colors.textMuted, marginTop: 2 }}>
                {q.data.chapters.reduce((n, c) => n + c.videos.length, 0)} lessons in {q.data.chapters.length} chapters
              </Text>
            </View>
          </View>
          {q.data.chapters.map((chapter, ci) => (
            <View key={chapter.id} style={{ paddingHorizontal: gutter, paddingTop: 24, gap: 12 }}>
              <Text weight="semibold" style={{ fontSize: 13, color: colors.label, letterSpacing: 0.6 }}>
                CHAPTER {ci + 1}
              </Text>
              <Text weight="bold" style={{ fontSize: 18, marginTop: -6 }}>
                {chapter.title}
              </Text>
              {chapter.videos.map((v) => {
                const progress = v.progress?.completed ? 1 : v.duration_seconds ? (v.progress?.position_seconds ?? 0) / v.duration_seconds : 0;
                return (
                  <Pressable
                    key={v.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${v.title}${v.locked ? ', locked' : ''}`}
                    onPress={() => router.push(`/video/${v.id}`)}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      gap: 14,
                      backgroundColor: colors.white,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 10,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <VideoThumb width={132} subject={q.data.subject} thumbnailUrl={v.thumbnail_url} locked={v.locked} progress={progress} />
                    <View style={{ flex: 1, gap: 6, paddingVertical: 2 }}>
                      <Text weight="semibold" style={{ fontSize: 15, lineHeight: 20 }} numberOfLines={2}>
                        {v.title}
                      </Text>
                      <Text style={{ color: colors.textMuted, fontSize: 13 }}>{formatDuration(v.duration_seconds)}</Text>
                      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                        {v.is_free && <Chip label="Free" />}
                        {v.progress?.completed && <Chip label="Watched" tone="green" />}
                        {v.bookmarked && <Ionicons name="bookmark" size={16} color={colors.primary} />}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

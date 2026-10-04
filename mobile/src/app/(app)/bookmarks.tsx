import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Card } from '@/components/Card';
import { ScreenHeader } from '@/components/Headers';
import { Explanation } from '@/components/QuestionView';
import { Chip } from '@/components/SectionLabel';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';
import { Text } from '@/components/Text';
import { VideoThumb } from '@/components/VideoThumb';
import { formatDuration } from '@/lib/format';
import { useBookmarks, useToggleBookmark } from '@/lib/queries';
import { colors, gutter } from '@/theme/tokens';

export default function BookmarksScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: 'videos' | 'questions' }>();
  const [tab, setTab] = useState<'videos' | 'questions'>(params.tab ?? 'videos');
  const bookmarks = useBookmarks();
  const toggle = useToggleBookmark();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Bookmarks" />
      <View style={{ flexDirection: 'row', backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
        {(['videos', 'questions'] as const).map((t) => (
          <Pressable key={t} accessibilityRole="tab" accessibilityState={{ selected: tab === t }} onPress={() => setTab(t)} style={{ flex: 1, alignItems: 'center', paddingVertical: 14 }}>
            <Text weight={tab === t ? 'semibold' : 'medium'} style={{ fontSize: 16, color: tab === t ? colors.text : colors.textMuted }}>
              {t === 'videos' ? `Videos (${bookmarks.data?.videos.length ?? 0})` : `Questions (${bookmarks.data?.questions.length ?? 0})`}
            </Text>
            <View style={{ position: 'absolute', bottom: 0, height: 3, width: '60%', borderRadius: 2, backgroundColor: tab === t ? colors.ink : 'transparent' }} />
          </Pressable>
        ))}
      </View>
      {bookmarks.isPending ? (
        <LoadingState />
      ) : bookmarks.isError ? (
        <ErrorState error={bookmarks.error} onRetry={() => bookmarks.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: gutter, gap: 12, paddingBottom: 40 }}>
          {tab === 'videos' ? (
            bookmarks.data.videos.length === 0 ? (
              <EmptyState icon="bookmark-outline" title="No saved lessons yet" message="Tap Bookmark on any lesson to find it here." />
            ) : (
              bookmarks.data.videos.map((v) => (
                <Pressable
                  key={v.id}
                  accessibilityRole="button"
                  onPress={() => router.push(`/video/${v.id}`)}
                  style={{ flexDirection: 'row', gap: 12, backgroundColor: colors.white, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}
                >
                  <VideoThumb width={112} subject={v.subject} thumbnailUrl={v.thumbnail_url} locked={v.locked} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text weight="semibold" numberOfLines={2}>
                      {v.title}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                      {v.subject.name} · {formatDuration(v.duration_seconds)}
                    </Text>
                  </View>
                  <Pressable accessibilityRole="button" accessibilityLabel="Remove bookmark" onPress={() => toggle.mutate({ type: 'video', id: v.id, on: false })} hitSlop={10}>
                    <Ionicons name="bookmark" size={22} color={colors.primary} />
                  </Pressable>
                </Pressable>
              ))
            )
          ) : bookmarks.data.questions.length === 0 ? (
            <EmptyState icon="bookmark-outline" title="No saved questions yet" message="Tap the bookmark icon while practising to save tricky questions." />
          ) : (
            bookmarks.data.questions.map((q) => (
              <Card key={q.id} style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Chip label={q.subject.name} />
                  {q.chapter && (
                    <Text style={{ color: colors.textMuted, fontSize: 13, flex: 1 }} numberOfLines={1}>
                      {q.chapter.title}
                    </Text>
                  )}
                  <Pressable accessibilityRole="button" accessibilityLabel="Remove bookmark" onPress={() => toggle.mutate({ type: 'question', id: q.id, on: false })} hitSlop={10}>
                    <Ionicons name="bookmark" size={20} color={colors.primary} />
                  </Pressable>
                </View>
                <Text weight="medium" style={{ fontSize: 16, lineHeight: 23 }}>
                  {q.stem}
                </Text>
                {q.attempt ? (
                  <Explanation reveal={q.attempt} />
                ) : (
                  q.chapter && (
                    <Pressable accessibilityRole="button" onPress={() => router.push(`/qbank/${q.chapter!.id}`)}>
                      <Text weight="semibold" style={{ color: colors.primary }}>
                        Practice this chapter →
                      </Text>
                    </Pressable>
                  )
                )}
              </Card>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

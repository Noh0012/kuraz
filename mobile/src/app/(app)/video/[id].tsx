import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef } from 'react';
import { Alert, Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TeacherAvatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { LockedView } from '@/components/LockedView';
import { ScreenHeader } from '@/components/Headers';
import { ErrorState, LoadingState } from '@/components/States';
import { Text } from '@/components/Text';
import { api, isLocked } from '@/lib/api';
import { formatDuration } from '@/lib/format';
import { keys, useToggleBookmark, useVideo } from '@/lib/queries';
import { colors, gutter } from '@/theme/tokens';

/** Plays a lesson, resumes where the student stopped and reports progress every ~15 s. */
function LessonPlayer({ videoId, source, startAt }: { videoId: string; source: string; startAt: number }) {
  const qc = useQueryClient();
  const lastTime = useRef(startAt);
  const lastSent = useRef(startAt);
  const player = useVideoPlayer(source, (p) => {
    p.timeUpdateEventInterval = 1;
    p.play();
  });

  useEffect(() => {
    const save = (seconds: number, completed?: boolean) => {
      lastSent.current = seconds;
      api(`/videos/${videoId}/progress`, { method: 'PUT', body: { position_seconds: Math.floor(seconds), completed } }).catch(() => {
        // Progress is best-effort; the next save will catch up.
      });
    };
    let resumed = false;
    const subs = [
      player.addListener('statusChange', ({ status }) => {
        if (status === 'readyToPlay' && !resumed) {
          resumed = true;
          if (startAt > 5) player.currentTime = startAt;
        }
      }),
      player.addListener('timeUpdate', ({ currentTime }) => {
        lastTime.current = currentTime;
        if (Math.abs(currentTime - lastSent.current) >= 15) save(currentTime);
      }),
      player.addListener('playingChange', ({ isPlaying }) => {
        if (!isPlaying && lastTime.current > 0) save(lastTime.current);
      }),
      player.addListener('playToEnd', () => save(lastTime.current, true)),
    ];
    return () => {
      subs.forEach((s) => s.remove());
      if (lastTime.current > 0) save(lastTime.current);
      // Refresh "continue watching" and progress bars after leaving the player.
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: keys.continue });
        qc.invalidateQueries({ queryKey: keys.home });
        qc.invalidateQueries({ queryKey: ['subject-videos'] });
      }, 800);
    };
  }, [player, videoId, startAt, qc]);

  return (
    <VideoView
      player={player}
      style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' }}
      nativeControls
      fullscreenOptions={{ enable: true }}
      contentFit="contain"
    />
  );
}

export default function VideoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const video = useVideo(id);
  const bookmark = useToggleBookmark();

  if (video.isPending) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScreenHeader title="Lesson" />
        <LoadingState />
      </View>
    );
  }
  if (video.isError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <ScreenHeader title="Lesson" />
        {isLocked(video.error) ? <LockedView /> : <ErrorState error={video.error} onRetry={() => video.refetch()} />}
      </View>
    );
  }

  const v = video.data;
  const startAt = v.progress && !v.progress.completed ? v.progress.position_seconds : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: insets.top, backgroundColor: '#000' }}>
        <LessonPlayer key={v.id} videoId={v.id} source={v.source_url} startAt={startAt} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          hitSlop={10}
          style={{ position: 'absolute', top: insets.top + 8, left: 8, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ padding: gutter, gap: 18, paddingBottom: insets.bottom + 32 }}>
        <View style={{ gap: 6 }}>
          <Text weight="semibold" style={{ color: v.subject.color, fontSize: 13, letterSpacing: 1.1 }}>
            {v.subject.name.toUpperCase()} · {v.chapter.title.toUpperCase()}
          </Text>
          <Text weight="bold" style={{ fontSize: 22, lineHeight: 29 }}>
            {v.title}
          </Text>
          <Text style={{ color: colors.textMuted }}>{formatDuration(v.duration_seconds)}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TeacherAvatar name={v.subject.teacher_name} url={v.subject.teacher_avatar_url} color={v.subject.color} size={44} />
          <View style={{ flex: 1 }}>
            <Text weight="semibold">{v.subject.teacher_name}</Text>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>{v.subject.name} teacher</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <ActionPill
            icon={v.bookmarked ? 'bookmark' : 'bookmark-outline'}
            label={v.bookmarked ? 'Saved' : 'Bookmark'}
            active={v.bookmarked}
            onPress={() => bookmark.mutate({ type: 'video', id: v.id, on: !v.bookmarked })}
          />
          <ActionPill
            icon="document-text-outline"
            label="Notes"
            onPress={() =>
              v.notes_url
                ? Linking.openURL(v.notes_url)
                : Alert.alert('Notes', 'Written notes for this lesson are being prepared. The summary below covers the key points.')
            }
          />
          <ActionPill icon="flag-outline" label="Report" onPress={() => router.push({ pathname: '/report-issue', params: { category: 'video', ref: v.id } })} />
        </View>

        {v.description && (
          <Card style={{ gap: 8 }}>
            <Text weight="semibold" style={{ fontSize: 16 }}>
              About this lesson
            </Text>
            <Text style={{ color: colors.textSoft, lineHeight: 22 }}>{v.description}</Text>
          </Card>
        )}

        {v.next && (
          <Card onPress={() => router.replace(`/video/${v.next!.id}`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={v.next.locked ? 'lock-closed' : 'play'} size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>Up next</Text>
              <Text weight="semibold" numberOfLines={2}>
                {v.next.title}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color={colors.text} />
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

function ActionPill({
  icon,
  label,
  onPress,
  active,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        height: 44,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: active ? colors.primary : colors.border,
        backgroundColor: active ? colors.primarySoft : colors.white,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Ionicons name={icon} size={18} color={active ? colors.primary : colors.textSoft} />
      <Text weight="semibold" style={{ color: active ? colors.primary : colors.textSoft, fontSize: 14 }}>
        {label}
      </Text>
    </Pressable>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, RefreshControl, ScrollView, View } from 'react-native';
import { TeacherAvatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { ContinueBar } from '@/components/FloatingBars';
import { SearchBar } from '@/components/Headers';
import { Shortcut } from '@/components/Shortcut';
import { ErrorState, LoadingState } from '@/components/States';
import { Text } from '@/components/Text';
import { useContinue, useSubjects } from '@/lib/queries';
import { colors, gutter } from '@/theme/tokens';

export default function VideosTab() {
  const router = useRouter();
  const subjects = useSubjects();
  const cont = useContinue();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SearchBar scope="videos" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: cont.data ? 110 : 32 }}
        refreshControl={
          <RefreshControl
            refreshing={subjects.isRefetching}
            onRefresh={() => {
              subjects.refetch();
              cont.refetch();
            }}
            colors={[colors.primary]}
          />
        }
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 22, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
          <Shortcut icon="bookmark" label="Bookmarks" onPress={() => router.push('/bookmarks')} />
          <Shortcut
            icon="arrow-down"
            label="Saved Videos"
            onPress={() => Alert.alert('Saved videos', 'Downloading lessons for offline viewing is coming soon.')}
          />
        </View>
        <View style={{ paddingHorizontal: gutter, paddingTop: 24, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text weight="semibold" style={{ fontSize: 17, color: colors.textSoft }}>
              Subjects
            </Text>
            <Ionicons name="reorder-three-outline" size={24} color={colors.textMuted} />
          </View>
          {subjects.isPending ? (
            <LoadingState />
          ) : subjects.isError ? (
            <ErrorState error={subjects.error} onRetry={() => subjects.refetch()} />
          ) : (
            subjects.data.map((s) => (
              <Card key={s.id} onPress={() => router.push(`/subjects/${s.id}/videos`)} style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 18 }} accessibilityLabel={`${s.name} videos`}>
                <TeacherAvatar name={s.teacher_name} url={s.teacher_avatar_url} color={s.color} size={76} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Text weight="semibold" style={{ fontSize: 20 }}>
                    {s.name}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 15 }} numberOfLines={1}>
                    {s.teacher_name ?? `${s.video_count} lessons`}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                    {s.video_count} lessons · {s.chapter_count} chapters
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.text} />
              </Card>
            ))
          )}
        </View>
      </ScrollView>
      {cont.data && <ContinueBar item={cont.data} />}
    </View>
  );
}

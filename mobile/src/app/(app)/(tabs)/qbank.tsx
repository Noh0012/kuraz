import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView, View } from 'react-native';
import { Card } from '@/components/Card';
import { SearchBar } from '@/components/Headers';
import { ProgressBar } from '@/components/ProgressBar';
import { Shortcut } from '@/components/Shortcut';
import { ErrorState, LoadingState } from '@/components/States';
import { SubjectIcon } from '@/components/SubjectIcon';
import { Text } from '@/components/Text';
import { useSubjects } from '@/lib/queries';
import { colors, gutter } from '@/theme/tokens';

export default function QbankTab() {
  const router = useRouter();
  const subjects = useSubjects();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SearchBar scope="qbank" />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={subjects.isRefetching} onRefresh={() => subjects.refetch()} colors={[colors.primary]} />}
      >
        <View style={{ alignItems: 'center', paddingVertical: 22, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
          <Shortcut icon="bookmark" label="Bookmarks" onPress={() => router.push({ pathname: '/bookmarks', params: { tab: 'questions' } })} />
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
              <Card
                key={s.id}
                onPress={() => router.push(`/subjects/${s.id}/qbank`)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 18, paddingVertical: 18 }}
                accessibilityLabel={`${s.name} question bank, ${s.qbank.answered} of ${s.qbank.total} completed`}
              >
                <SubjectIcon icon={s.icon} color={s.color} size={76} />
                <View style={{ flex: 1, gap: 10 }}>
                  <Text weight="semibold" style={{ fontSize: 20 }}>
                    {s.name}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <ProgressBar value={s.qbank.total ? s.qbank.answered / s.qbank.total : 0} color={s.color} />
                    <Text style={{ color: colors.textMuted, fontSize: 14 }}>
                      {s.qbank.answered}/{s.qbank.total} completed
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.text} />
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

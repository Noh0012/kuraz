import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { ScreenHeader } from '@/components/Headers';
import { ErrorState, LoadingState } from '@/components/States';
import { Text } from '@/components/Text';
import { errorMessage } from '@/lib/api';
import { useGrades, useMe, useUpdateMe } from '@/lib/queries';
import { colors, gutter, radius } from '@/theme/tokens';

const BLURB: Record<number, string> = {
  9: 'Foundations of secondary school',
  10: 'Prepare for the Grade 10 exam',
  11: 'Natural science stream',
  12: 'National exam (ESSLCE) preparation',
};

export default function GradeSelect() {
  const router = useRouter();
  const grades = useGrades();
  const { data: me } = useMe();
  const update = useUpdateMe();
  const firstTime = !!me && !me.grade;

  async function choose(id: number) {
    if (id === me?.grade?.id) {
      router.back();
      return;
    }
    try {
      await update.mutateAsync({ grade_id: id });
      if (router.canGoBack()) router.back();
      else router.replace('/');
    } catch (e) {
      Alert.alert('Could not change grade', errorMessage(e));
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title={firstTime ? 'Choose your grade' : 'Switch grade'} onBack={firstTime ? () => undefined : undefined} />
      {grades.isPending ? (
        <LoadingState />
      ) : grades.isError ? (
        <ErrorState error={grades.error} onRetry={() => grades.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: gutter, gap: 12 }}>
          <Text style={{ color: colors.textSoft, lineHeight: 22, marginBottom: 6 }}>
            Lessons, questions and tests are tailored to each grade. Plans are bought per grade.
          </Text>
          {grades.data.map((g) => {
            const selected = g.id === me?.grade?.id;
            return (
              <Pressable
                key={g.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected, busy: update.isPending }}
                disabled={update.isPending}
                onPress={() => choose(g.id)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  padding: 16,
                  borderRadius: radius.lg,
                  borderWidth: 1.5,
                  borderColor: selected ? colors.primary : colors.border,
                  backgroundColor: selected ? colors.primarySoft : colors.white,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: selected ? colors.primary : colors.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Text weight="bold" style={{ fontSize: 20, color: selected ? colors.white : colors.text }}>
                    {g.id}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text weight="semibold" style={{ fontSize: 17 }}>
                    {g.name}
                  </Text>
                  <Text style={{ color: colors.textMuted, marginTop: 2 }}>{BLURB[g.id] ?? ''}</Text>
                </View>
                <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={24} color={selected ? colors.primary : colors.textMuted} />
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

import { useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { IconButton, SearchBar } from '@/components/Headers';
import { EmptyState, ErrorState, LoadingState } from '@/components/States';
import { TestCardRow } from '@/components/TestCardRow';
import { Text } from '@/components/Text';
import { useMe, useTests } from '@/lib/queries';
import type { TestType } from '@/types/contracts';
import { colors, gutter } from '@/theme/tokens';

const TABS: { type: TestType; label: string }[] = [
  { type: 'national', label: 'Past Exams' },
  { type: 'mock', label: 'Mock Tests' },
  { type: 'unit', label: 'Unit Tests' },
];

export default function TestsTab() {
  const { data: me } = useMe();
  // Past national exams exist for Grade 12; other grades start on mock tests.
  const [picked, setPicked] = useState<TestType | null>(null);
  const type: TestType = picked ?? (me?.grade?.id === 12 ? 'national' : 'mock');
  const tests = useTests(type);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SearchBar
        scope="tests"
        right={
          <IconButton
            icon="information-circle-outline"
            label="About tests"
            onPress={() =>
              Alert.alert(
                'About tests',
                'Past Exams are practice papers in the style of the Grade 12 national exam, grouped by year (E.C.).\n\nMock Tests open monthly and mix every subject.\n\nUnit Tests check one subject at a time.\n\nTests are timed, your answers are saved as you go, and you can review every answer after submitting.',
              )
            }
          />
        }
      />
      <View style={{ flexDirection: 'row', backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.divider, paddingHorizontal: gutter / 2 }}>
        {TABS.map((t) => {
          const active = t.type === type;
          return (
            <Pressable
              key={t.type}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setPicked(t.type)}
              style={{ flex: 1, alignItems: 'center', paddingTop: 12, paddingBottom: 14 }}
            >
              <Text weight={active ? 'semibold' : 'medium'} style={{ fontSize: 16, color: active ? colors.text : colors.textMuted }}>
                {t.label}
              </Text>
              <View style={{ position: 'absolute', bottom: 0, height: 3, width: '80%', borderRadius: 2, backgroundColor: active ? colors.ink : 'transparent' }} />
            </Pressable>
          );
        })}
      </View>
      {tests.isPending ? (
        <LoadingState />
      ) : tests.isError ? (
        <ErrorState error={tests.error} onRetry={() => tests.refetch()} />
      ) : tests.data.sections.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title={type === 'national' ? 'No past exams for this grade' : 'No tests yet'}
          message={type === 'national' ? 'Past national exam papers are available for Grade 12.' : 'New tests are added regularly. Check back soon.'}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: gutter, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={tests.isRefetching} onRefresh={() => tests.refetch()} colors={[colors.primary]} />}
        >
          {tests.data.sections.map((section) => (
            <View key={section.title} style={{ marginTop: 24, gap: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Text weight="semibold" style={{ fontSize: 15, color: colors.label, letterSpacing: 0.6 }}>
                  {section.title.toUpperCase()}
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              </View>
              {section.tests.map((t) => (
                <TestCardRow key={t.id} test={t} />
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

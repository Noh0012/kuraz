import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SectionLabel } from '@/components/SectionLabel';
import { EmptyState, ErrorState } from '@/components/States';
import { SubjectIcon } from '@/components/SubjectIcon';
import { TestCardRow } from '@/components/TestCardRow';
import { Text } from '@/components/Text';
import { VideoThumb } from '@/components/VideoThumb';
import { formatDuration } from '@/lib/format';
import { useSearch } from '@/lib/queries';
import { colors, fonts, gutter } from '@/theme/tokens';

type Scope = 'all' | 'videos' | 'qbank' | 'tests';
const SCOPES: { key: Scope; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'videos', label: 'Videos' },
  { key: 'qbank', label: 'QBank' },
  { key: 'tests', label: 'Tests' },
];

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ scope?: Scope }>();
  const [scope, setScope] = useState<Scope>(params.scope ?? 'all');
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');

  // Debounce typing.
  useEffect(() => {
    const t = setTimeout(() => setQuery(text.trim()), 300);
    return () => clearTimeout(t);
  }, [text]);

  const results = useSearch(query);
  const show = (s: Scope) => scope === 'all' || scope === s;
  const data = results.data;
  const empty = data && !data.videos.length && !data.chapters.length && !data.tests.length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingTop: insets.top + 10, paddingHorizontal: gutter, paddingBottom: 10, backgroundColor: colors.white, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1, height: 48, borderRadius: 12, borderWidth: 1.5, borderColor: colors.primary, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 }}>
            <Ionicons name="search-outline" size={20} color={colors.textSoft} />
            <TextInput
              autoFocus
              value={text}
              onChangeText={setText}
              placeholder="Search lessons, chapters, tests"
              placeholderTextColor={colors.textMuted}
              returnKeyType="search"
              style={{ flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.text }}
            />
            {results.isFetching ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : text ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Clear" onPress={() => setText('')} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {SCOPES.map((s) => (
            <Pressable
              key={s.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: scope === s.key }}
              onPress={() => setScope(s.key)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 18,
                backgroundColor: scope === s.key ? colors.ink : colors.bg,
              }}
            >
              <Text weight="semibold" style={{ color: scope === s.key ? colors.white : colors.textSoft, fontSize: 14 }}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: gutter, gap: 12, paddingBottom: 40 }}>
        {query.length < 2 ? (
          <EmptyState icon="search" title="Search Kuraz" message="Find lessons, QBank chapters and tests for your grade." />
        ) : results.isError ? (
          <ErrorState error={results.error} onRetry={() => results.refetch()} />
        ) : empty ? (
          <EmptyState icon="search" title={`No results for “${query}”`} message="Try a different word, like a chapter or topic name." />
        ) : data ? (
          <>
            {show('videos') && data.videos.length > 0 && (
              <View style={{ gap: 10 }}>
                <SectionLabel>Videos</SectionLabel>
                {data.videos.map((v) => (
                  <Pressable
                    key={v.id}
                    accessibilityRole="button"
                    onPress={() => router.push(`/video/${v.id}`)}
                    style={{ flexDirection: 'row', gap: 12, backgroundColor: colors.white, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: colors.border }}
                  >
                    <VideoThumb width={112} subject={v.subject} thumbnailUrl={v.thumbnail_url} locked={v.locked} />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text weight="semibold" numberOfLines={2}>
                        {v.title}
                      </Text>
                      <Text style={{ color: colors.textMuted, fontSize: 13 }} numberOfLines={1}>
                        {v.subject.name} · {formatDuration(v.duration_seconds)}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
            {show('qbank') && data.chapters.length > 0 && (
              <View style={{ gap: 10, marginTop: 8 }}>
                <SectionLabel>QBank chapters</SectionLabel>
                {data.chapters.map((c) => (
                  <Pressable
                    key={c.id}
                    accessibilityRole="button"
                    onPress={() => router.push(c.locked ? '/plans' : `/qbank/${c.id}`)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.white, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: colors.border }}
                  >
                    <SubjectIcon icon={c.subject.icon} color={c.subject.color} size={44} />
                    <View style={{ flex: 1 }}>
                      <Text weight="semibold">{c.title}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                        {c.subject.name} · {c.question_count} questions
                      </Text>
                    </View>
                    <Ionicons name={c.locked ? 'lock-closed' : 'chevron-forward'} size={20} color={colors.textMuted} />
                  </Pressable>
                ))}
              </View>
            )}
            {show('tests') && data.tests.length > 0 && (
              <View style={{ gap: 10, marginTop: 8 }}>
                <SectionLabel>Tests</SectionLabel>
                {data.tests.map((t) => (
                  <TestCardRow key={t.id} test={t} />
                ))}
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

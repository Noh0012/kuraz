import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView, View } from 'react-native';
import { UpgradeBanner } from '@/components/FloatingBars';
import { AppHeader, IconButton } from '@/components/Headers';
import { CuratedBanner, QotdCard } from '@/components/home/Curated';
import { MostWatched } from '@/components/home/MostWatched';
import { SectionLabel } from '@/components/SectionLabel';
import { ErrorState, LoadingState } from '@/components/States';
import { useHome } from '@/lib/queries';
import { colors, gutter } from '@/theme/tokens';

export default function HomeScreen() {
  const router = useRouter();
  const home = useHome();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppHeader right={<IconButton bordered icon="gift" color="#E8453C" label="Plans and offers" onPress={() => router.push('/plans')} />} />
      {home.isPending ? (
        <LoadingState />
      ) : home.isError ? (
        <ErrorState error={home.error} onRetry={() => home.refetch()} />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingTop: 28, paddingBottom: home.data.plan?.tier === 'premium' ? 32 : 110 }}
          refreshControl={<RefreshControl refreshing={home.isRefetching} onRefresh={() => home.refetch()} colors={[colors.primary]} />}
        >
          {home.data.most_watched.length > 0 && (
            <View style={{ marginBottom: 36 }}>
              <SectionLabel style={{ paddingHorizontal: gutter }}>Most watched</SectionLabel>
              <MostWatched videos={home.data.most_watched} />
            </View>
          )}
          <SectionLabel style={{ paddingHorizontal: gutter }}>Curated for you</SectionLabel>
          <CuratedBanner free={home.data.free} />
          {home.data.qotd && (
            <View style={{ marginTop: 32 }}>
              <QotdCard qotd={home.data.qotd} />
            </View>
          )}
        </ScrollView>
      )}
      {home.data && <UpgradeBanner plan={home.data.plan} />}
    </View>
  );
}

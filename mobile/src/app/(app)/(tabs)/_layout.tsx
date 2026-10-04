import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { TabBar } from '@/components/TabBar';
import { useMe } from '@/lib/queries';
import { colors } from '@/theme/tokens';

export default function TabsLayout() {
  const { data: me } = useMe();
  // Every list is per grade, so a student without one picks it first.
  if (me && !me.grade) return <Redirect href="/grade-select" />;

  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="videos" />
      <Tabs.Screen name="qbank" />
      <Tabs.Screen name="tests" />
      <Tabs.Screen name="me" />
    </Tabs>
  );
}

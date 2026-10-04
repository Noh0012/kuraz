import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Alert, ScrollView, View } from 'react-native';
import { Button } from '@/components/Button';
import { ScreenHeader } from '@/components/Headers';
import { Chip } from '@/components/SectionLabel';
import { ErrorState, LoadingState } from '@/components/States';
import { Text } from '@/components/Text';
import { errorMessage } from '@/lib/api';
import { formatBirr, formatDate } from '@/lib/format';
import { useMe, usePackages, usePurchase } from '@/lib/queries';
import type { Package } from '@/types/contracts';
import { colors, gutter, radius, shadow } from '@/theme/tokens';

export default function PlansScreen() {
  const { data: me } = useMe();
  const packages = usePackages();
  const purchase = usePurchase();

  function buy(p: Package) {
    // Payments are stubbed for now: the backend activates the package immediately.
    Alert.alert(
      `${p.active_until ? 'Extend' : 'Get'} ${p.name}`,
      `${formatBirr(p.price_etb)} for ${Math.round(p.duration_days / 30)} months.\n\nPayments are in test mode: no money is charged and the plan activates right away.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Activate',
          onPress: async () => {
            try {
              const res = await purchase.mutateAsync(p.id);
              Alert.alert('You are all set', `${res.subscription.package.name} is active until ${formatDate(res.plan?.expires_at ?? res.subscription.expires_at!)}.`);
            } catch (e) {
              Alert.alert('Could not activate the plan', errorMessage(e));
            }
          },
        },
      ],
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScreenHeader title="Plans" />
      {packages.isPending ? (
        <LoadingState />
      ) : packages.isError ? (
        <ErrorState error={packages.error} onRetry={() => packages.refetch()} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: gutter, gap: 18, paddingBottom: 40 }}>
          <View style={{ gap: 6 }}>
            <Text weight="bold" style={{ fontSize: 24 }}>
              {packages.data.grade.name} plans
            </Text>
            <Text style={{ color: colors.textSoft, lineHeight: 22 }}>
              {me?.plan
                ? `You are on ${me.plan.name} until ${formatDate(me.plan.expires_at)}.`
                : 'You are on the Free Plan. Unlock every lesson, question and test for your grade.'}
            </Text>
          </View>
          {packages.data.packages.map((p) => (
            <PlanCard key={p.id} pkg={p} onBuy={() => buy(p)} busy={purchase.isPending && purchase.variables === p.id} />
          ))}
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 14, borderRadius: radius.md, backgroundColor: colors.warningSoft }}>
            <Ionicons name="information-circle" size={20} color={colors.warning} />
            <Text style={{ flex: 1, color: colors.textSoft, lineHeight: 20 }}>
              Test mode: plans activate instantly without payment. Telebirr and card payments will be added before launch.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function PlanCard({ pkg, onBuy, busy }: { pkg: Package; onBuy: () => void; busy: boolean }) {
  const premium = pkg.tier === 'premium';
  const months = Math.round(pkg.duration_days / 30);
  const body = (
    <View style={{ padding: 20, gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text weight="bold" style={{ fontSize: 22, color: premium ? colors.white : colors.text }}>
          {pkg.name}
        </Text>
        {pkg.active_until ? <Chip label="Active" tone="green" /> : premium ? <Chip label="Best value" tone="orange" /> : null}
      </View>
      {pkg.description && <Text style={{ color: premium ? 'rgba(255,255,255,0.85)' : colors.textSoft, lineHeight: 21 }}>{pkg.description}</Text>}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
        <Text weight="extrabold" style={{ fontSize: 30, color: premium ? colors.white : colors.text }}>
          {formatBirr(pkg.price_etb)}
        </Text>
        <Text style={{ color: premium ? 'rgba(255,255,255,0.8)' : colors.textMuted, marginBottom: 5 }}>/ {months} months</Text>
      </View>
      <View style={{ gap: 10 }}>
        {pkg.features.map((f) => (
          <View key={f} style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <Ionicons name="checkmark-circle" size={20} color={premium ? colors.orange : colors.success} />
            <Text style={{ color: premium ? colors.white : colors.text, flex: 1 }}>{f}</Text>
          </View>
        ))}
      </View>
      {pkg.active_until && (
        <Text style={{ color: premium ? 'rgba(255,255,255,0.85)' : colors.textSoft }}>Active until {formatDate(pkg.active_until)}</Text>
      )}
      <Button
        title={pkg.active_until ? `Extend ${pkg.name}` : `Get ${pkg.name}`}
        variant={premium ? 'orange' : 'primary'}
        size="lg"
        loading={busy}
        onPress={onBuy}
      />
    </View>
  );
  if (!premium) {
    return <View style={[{ backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border }, shadow.card]}>{body}</View>;
  }
  return (
    <LinearGradient colors={[colors.navy, colors.navyDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[{ borderRadius: radius.lg }, shadow.raised]}>
      {body}
    </LinearGradient>
  );
}

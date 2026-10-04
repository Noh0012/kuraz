import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ApiError, errorMessage } from '@/lib/api';
import { colors } from '@/theme/tokens';
import { Button } from './Button';
import { Text } from './Text';

export function LoadingState({ label }: { label?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
      <ActivityIndicator color={colors.primary} size="large" />
      {label && <Text style={{ color: colors.textMuted }}>{label}</Text>}
    </View>
  );
}

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
  action,
}: {
  icon?: ComponentProps<typeof Ionicons>['name'];
  title: string;
  message?: string;
  action?: { title: string; onPress: () => void };
}) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 }}>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={34} color={colors.primary} />
      </View>
      <Text weight="semibold" style={{ fontSize: 17, textAlign: 'center' }}>
        {title}
      </Text>
      {message && <Text style={{ color: colors.textMuted, textAlign: 'center', lineHeight: 21 }}>{message}</Text>}
      {action && <Button title={action.title} onPress={action.onPress} style={{ marginTop: 8 }} />}
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const offline = error instanceof ApiError && error.code === 'network';
  return (
    <EmptyState
      icon={offline ? 'cloud-offline-outline' : 'alert-circle-outline'}
      title={offline ? 'You are offline' : 'Something went wrong'}
      message={errorMessage(error)}
      action={onRetry ? { title: 'Try again', onPress: onRetry } : undefined}
    />
  );
}

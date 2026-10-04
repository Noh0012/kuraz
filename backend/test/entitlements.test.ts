import { describe, expect, it } from 'vitest';
import {
  activeUntil,
  bestPlan,
  buildEntitlements,
  canAccess,
  type SubscriptionRow,
} from '../src/services/entitlements.js';

const now = new Date('2026-10-04T12:00:00Z');

function sub(overrides: Partial<SubscriptionRow> & { tier?: string; grade?: number; tests?: boolean } = {}): SubscriptionRow {
  return {
    package_id: overrides.package_id ?? 'pkg-basic-12',
    starts_at: overrides.starts_at ?? '2026-09-01T00:00:00Z',
    expires_at: overrides.expires_at ?? '2027-03-01T00:00:00Z',
    packages: {
      name: overrides.tier === 'premium' ? 'Premium' : 'Basic',
      tier: overrides.tier ?? 'basic',
      grade_id: overrides.grade ?? 12,
      includes_videos: true,
      includes_qbank: true,
      includes_tests: overrides.tests ?? false,
    },
  };
}

describe('entitlements', () => {
  it('free content is always accessible', () => {
    const ent = buildEntitlements([], now);
    expect(canAccess(ent, 12, 'videos', true)).toBe(true);
    expect(canAccess(ent, 12, 'videos', false)).toBe(false);
  });

  it('grants only the content kinds and grade of the package', () => {
    const ent = buildEntitlements([sub()], now);
    expect(canAccess(ent, 12, 'videos', false)).toBe(true);
    expect(canAccess(ent, 12, 'qbank', false)).toBe(true);
    expect(canAccess(ent, 12, 'tests', false)).toBe(false);
    expect(canAccess(ent, 11, 'videos', false)).toBe(false);
  });

  it('ignores expired subscriptions and renewals that have not started', () => {
    const expired = sub({ expires_at: '2026-10-01T00:00:00Z' });
    const future = sub({ starts_at: '2027-03-01T00:00:00Z', expires_at: '2027-09-01T00:00:00Z' });
    const ent = buildEntitlements([expired, future], now);
    expect(canAccess(ent, 12, 'videos', false)).toBe(false);
    expect(bestPlan(ent, 12)).toBeNull();
    expect(activeUntil(ent, 'pkg-basic-12')).toBeNull();
  });

  it('reports the end of the last queued renewal', () => {
    const current = sub();
    const renewal = sub({ starts_at: '2027-03-01T00:00:00Z', expires_at: '2027-09-01T00:00:00Z' });
    const ent = buildEntitlements([current, renewal], now);
    expect(activeUntil(ent, 'pkg-basic-12')).toBe('2027-09-01T00:00:00Z');
    expect(bestPlan(ent, 12)?.expires_at).toBe('2027-09-01T00:00:00Z');
  });

  it('prefers premium over basic for the header plan', () => {
    const ent = buildEntitlements([sub(), sub({ package_id: 'pkg-premium-12', tier: 'premium', tests: true })], now);
    const plan = bestPlan(ent, 12);
    expect(plan?.tier).toBe('premium');
    expect(plan?.includes).toEqual(['videos', 'qbank', 'tests']);
    expect(bestPlan(ent, 11)).toBeNull();
  });
});

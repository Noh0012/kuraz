import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import type { ContentKind, Package, PackagesList, PurchaseResult, Subscription, Tier } from '../contracts.js';
import { env } from '../env.js';
import { userId } from '../middleware/auth.js';
import { HttpError, one, rows } from '../lib/http.js';
import { db } from '../lib/supabase.js';
import { activeUntil, bestPlan, loadEntitlements } from '../services/entitlements.js';
import { getProfile, requireGrade } from '../services/profile.js';

export const commerceRoutes = Router();

const SUBSCRIPTION_SELECT =
  'id, status, starts_at, expires_at, amount_etb, provider, created_at, packages!inner(id, name, tier, grade_id)' as const;

function includesOf(p: { includes_videos: boolean; includes_qbank: boolean; includes_tests: boolean }): ContentKind[] {
  const out: ContentKind[] = [];
  if (p.includes_videos) out.push('videos');
  if (p.includes_qbank) out.push('qbank');
  if (p.includes_tests) out.push('tests');
  return out;
}

function toSubscription(s: {
  id: string;
  status: string;
  starts_at: string | null;
  expires_at: string | null;
  amount_etb: number;
  provider: string;
  created_at: string;
  packages: { id: string; name: string; tier: string; grade_id: number };
}): Subscription {
  return {
    id: s.id,
    package: { id: s.packages.id, name: s.packages.name, tier: s.packages.tier as Tier, grade_id: s.packages.grade_id },
    status: s.status,
    starts_at: s.starts_at,
    expires_at: s.expires_at,
    amount_etb: Number(s.amount_etb),
    provider: s.provider,
    created_at: s.created_at,
  };
}

commerceRoutes.get('/packages', async (req, res) => {
  const uid = userId(req);
  const [profile, ent] = await Promise.all([getProfile(uid), loadEntitlements(uid)]);
  const gradeId = req.query.grade_id ? z.coerce.number().int().parse(req.query.grade_id) : requireGrade(profile);
  const [grade, packages] = await Promise.all([
    db.from('grades').select('id, name').eq('id', gradeId).maybeSingle(),
    db.from('packages').select('*').eq('grade_id', gradeId).eq('is_active', true).order('sort'),
  ]);
  const body: PackagesList = {
    grade: one(grade, 'Grade'),
    packages: rows(packages).map(
      (p): Package => ({
        id: p.id,
        name: p.name,
        tier: p.tier as Tier,
        description: p.description,
        features: p.features,
        price_etb: Number(p.price_etb),
        duration_days: p.duration_days,
        includes: includesOf(p),
        active_until: activeUntil(ent, p.id),
      }),
    ),
  };
  res.json(body);
});

commerceRoutes.get('/subscriptions', async (req, res) => {
  const uid = userId(req);
  const data = rows(
    await db
      .from('subscriptions')
      .select(SUBSCRIPTION_SELECT)
      .eq('user_id', uid)
      .order('created_at', { ascending: false }),
  );
  res.json(data.map(toSubscription));
});

const purchaseSchema = z.object({ package_id: z.uuid() });

/**
 * Stub checkout: activates the package immediately. Buying again while active queues a
 * renewal that starts when the current period ends. A real provider (e.g. Chapa) would
 * create a pending subscription here and activate it from its webhook.
 */
commerceRoutes.post('/subscriptions', async (req, res) => {
  if (env.PAYMENTS_PROVIDER !== 'stub') throw new HttpError(501, 'not_implemented', 'Payments are not configured');
  const uid = userId(req);
  const { package_id } = purchaseSchema.parse(req.body);
  const pkg = one(
    await db.from('packages').select('*').eq('id', package_id).eq('is_active', true).maybeSingle(),
    'Package',
  );

  const now = new Date();
  const latest = rows(
    await db
      .from('subscriptions')
      .select('expires_at')
      .eq('user_id', uid)
      .eq('package_id', package_id)
      .eq('status', 'active')
      .gt('expires_at', now.toISOString())
      .order('expires_at', { ascending: false })
      .limit(1),
  )[0];
  const startsAt = latest?.expires_at ? new Date(latest.expires_at) : now;
  const expiresAt = new Date(startsAt.getTime() + pkg.duration_days * 86_400_000);

  const created = one(
    await db
      .from('subscriptions')
      .insert({
        user_id: uid,
        package_id,
        status: 'active',
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        provider: 'stub',
        tx_ref: `stub_${randomUUID()}`,
        amount_etb: pkg.price_etb,
      })
      .select(SUBSCRIPTION_SELECT)
      .maybeSingle(),
    'Subscription',
  );

  const ent = await loadEntitlements(uid, now);
  const body: PurchaseResult = { subscription: toSubscription(created), plan: bestPlan(ent, pkg.grade_id) };
  res.status(201).json(body);
});

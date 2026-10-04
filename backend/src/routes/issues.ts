import { Router } from 'express';
import { z } from 'zod';
import type { Json } from '../db/types.js';
import { userId } from '../middleware/auth.js';
import { ok } from '../lib/http.js';
import { db } from '../lib/supabase.js';

export const issueRoutes = Router();

const issueSchema = z.object({
  category: z.enum(['video', 'question', 'test', 'payment', 'account', 'app', 'other']).default('other'),
  message: z.string().trim().min(5, 'Tell us a little more (at least 5 characters)').max(2000),
  context: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

issueRoutes.post('/issues', async (req, res) => {
  const uid = userId(req);
  const { category, message, context } = issueSchema.parse(req.body);
  ok(await db.from('issue_reports').insert({ user_id: uid, category, message, context: (context ?? null) as Json }));
  res.status(201).json({ received: true });
});

import { Router } from 'express';
import type { Grade } from '../contracts.js';
import { rows } from '../lib/http.js';
import { db } from '../lib/supabase.js';

export const publicRoutes = Router();

publicRoutes.get('/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

publicRoutes.get('/grades', async (_req, res) => {
  const grades: Grade[] = rows(await db.from('grades').select('id, name').order('sort'));
  res.json(grades);
});

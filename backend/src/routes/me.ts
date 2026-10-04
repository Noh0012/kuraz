import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { userId } from '../middleware/auth.js';
import { HttpError, maybe, ok } from '../lib/http.js';
import { db } from '../lib/supabase.js';
import { loadEntitlements } from '../services/entitlements.js';
import { getProfile, toMe } from '../services/profile.js';

export const meRoutes = Router();

const AVATAR_BUCKET = 'avatars';
const AVATAR_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (AVATAR_TYPES[file.mimetype]) cb(null, true);
    else cb(new HttpError(400, 'invalid_upload', 'Use a JPEG, PNG or WebP image'));
  },
});

// Blank strings clear optional text fields.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v === '' ? null : v));

const patchSchema = z
  .object({
    full_name: z.string().trim().min(2, 'Enter your full name').max(120).optional(),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9 ]{7,20}$/, 'Enter a valid phone number')
      .nullable()
      .optional()
      .or(z.literal('').transform(() => null)),
    grade_id: z.number().int().optional(),
    school: optionalText(160),
    region: optionalText(80),
    city: optionalText(80),
  })
  .strict();

meRoutes.get('/me', async (req, res) => {
  const id = userId(req);
  const [profile, ent] = await Promise.all([getProfile(id), loadEntitlements(id)]);
  res.json(toMe(profile, ent));
});

meRoutes.patch('/me', async (req, res) => {
  const id = userId(req);
  const patch = patchSchema.parse(req.body);
  if (patch.grade_id !== undefined) {
    const grade = maybe(await db.from('grades').select('id').eq('id', patch.grade_id).maybeSingle());
    if (!grade) throw new HttpError(400, 'invalid_request', 'Unknown grade');
  }
  await getProfile(id); // make sure the row exists
  ok(await db.from('profiles').update(patch).eq('id', id));
  const [profile, ent] = await Promise.all([getProfile(id), loadEntitlements(id)]);
  res.json(toMe(profile, ent));
});

meRoutes.post('/me/avatar', upload.single('avatar'), async (req, res) => {
  const id = userId(req);
  const file = req.file;
  if (!file) throw new HttpError(400, 'invalid_upload', 'Attach an image in the "avatar" field');

  const storage = db.storage.from(AVATAR_BUCKET);
  const path = `${id}/${Date.now()}.${AVATAR_TYPES[file.mimetype]}`;
  const uploaded = await storage.upload(path, file.buffer, { contentType: file.mimetype, upsert: true });
  if (uploaded.error) throw new HttpError(500, 'upload_failed', uploaded.error.message);

  // Remove older pictures so each user keeps a single file.
  const existing = await storage.list(id);
  const stale = (existing.data ?? []).map((f) => `${id}/${f.name}`).filter((p) => p !== path);
  if (stale.length) await storage.remove(stale);

  const avatarUrl = storage.getPublicUrl(path).data.publicUrl;
  ok(await db.from('profiles').update({ avatar_url: avatarUrl }).eq('id', id));
  const [profile, ent] = await Promise.all([getProfile(id), loadEntitlements(id)]);
  res.json(toMe(profile, ent));
});

/** Play Store requirement: deletes the account and, through cascades, all of its data. */
meRoutes.delete('/me', async (req, res) => {
  const id = userId(req);
  const storage = db.storage.from(AVATAR_BUCKET);
  const files = await storage.list(id);
  if (files.data?.length) await storage.remove(files.data.map((f) => `${id}/${f.name}`));

  const { error } = await db.auth.admin.deleteUser(id);
  if (error) throw new HttpError(500, 'delete_failed', error.message);
  res.status(204).end();
});

import { z } from 'zod';

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),
  SUPABASE_URL: z.url(),
  SUPABASE_SECRET_KEY: z.string().min(20, 'Set SUPABASE_SECRET_KEY in backend/.env (Dashboard > Settings > API Keys)'),
  PAYMENTS_PROVIDER: z.enum(['stub']).default('stub'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error(`Invalid environment:\n${z.prettifyError(parsed.error)}`);
  process.exit(1);
}

export const env = parsed.data;

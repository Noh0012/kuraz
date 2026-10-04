import { createClient } from '@supabase/supabase-js';
import { env } from '../env.js';
import type { Database } from '../db/types.js';

// Privileged client (secret key, bypasses RLS). Never expose it to the mobile app.
export const db = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

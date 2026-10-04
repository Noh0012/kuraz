import Constants from 'expo-constants';
import { Platform } from 'react-native';

// EXPO_PUBLIC_* values are inlined at build time; they must be read as literal process.env.X.
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.warn('Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (see mobile/.env.example)');
}

/**
 * API base URL. In development the API runs on the same computer as Metro, so we reuse the
 * host Expo Go loaded the bundle from (it follows the PC's Wi-Fi IP automatically).
 * Release builds must set EXPO_PUBLIC_API_URL to an HTTPS address.
 */
function resolveApiUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/+$/, '');
  if (Platform.OS === 'web') return 'http://localhost:4000/v1';
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host ?? 'localhost'}:4000/v1`;
}

export const API_URL = resolveApiUrl();

// Placeholders: replace with the real support channels before release
// (.example is a reserved domain, so nothing is sent to a stranger meanwhile).
export const SUPPORT: { email: string; phone: string | null; telegram: string | null; hours: string } = {
  email: 'support@kuraz.example',
  phone: null,
  telegram: null,
  hours: 'Mon–Sat, 8:30 AM – 6:00 PM (EAT)',
};

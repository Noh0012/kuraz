// Design tokens. Values sampled from the reference screenshots.
export const colors = {
  primary: '#0A9BF5',
  primaryDark: '#0A7FD6',
  primarySoft: '#E3F2FE',
  text: '#2B2D4E',
  textSoft: '#5B6079',
  textMuted: '#8A8FA8',
  label: '#7D82A0',
  bg: '#F5F6FA',
  card: '#FFFFFF',
  border: '#E5E7EF',
  divider: '#EEF0F5',
  navy: '#1D4E89',
  navyDeep: '#1A2A6C',
  ink: '#262B4A', // active tab, dark buttons
  orange: '#F7A93B',
  orangeDark: '#E58E1A',
  success: '#1DB37A',
  successSoft: '#E3F7EE',
  danger: '#E5484D',
  dangerSoft: '#FDECEC',
  warning: '#F2A72B',
  warningSoft: '#FFF4E0',
  white: '#FFFFFF',
  overlay: 'rgba(16, 22, 48, 0.55)',
} as const;

export const gradients = {
  splash: ['#0BBFF0', '#1A2A6C'] as const,
  tile: ['#22C3F7', '#0A84E8'] as const,
  heroCard: ['#123B7A', '#0D2457'] as const,
  curated: ['#3AA8F7', '#2D8EF0'] as const,
  badge: ['#FF4FA3', '#FF8A3D'] as const,
};

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 } as const;

/** Horizontal page padding used by every screen. */
export const gutter = 20;

export const shadow = {
  card: {
    shadowColor: '#1B2559',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  raised: {
    shadowColor: '#0B1A3D',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
} as const;

/** Adds an alpha channel to a #RRGGBB colour. */
export function alpha(hex: string, opacity: number): string {
  const a = Math.round(Math.min(1, Math.max(0, opacity)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

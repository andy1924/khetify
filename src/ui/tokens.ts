/**
 * Khetify design tokens, extracted from the final Pencil frame (Qx0SG).
 * 390 × 844 reference · content padding 24 · section gap 20.
 */

export const colors = {
  background: '#FBFCF9',
  ink: '#263B29',
  heading: '#213827',
  muted: '#657360',
  mutedSoft: '#6A7667',
  faint: '#6C7564',
  subtle: '#697462',

  accent: '#BEDDA7',
  accentPressed: '#AFCF91',
  accentInk: '#263B29',
  accentDeep: '#3D5C30',

  surface: '#EEF4E7',
  surfaceSoft: '#F6F8F3',
  surfaceMuted: '#F2F5EE',
  surfaceAlt: '#F0F4EB',
  surfaceTint: '#EDF4E4',
  surfacePlain: '#FBFCF9',
  sheet: '#F9FBF5',

  border: '#DFE6D8',
  borderSoft: '#E6EBE1',
  divider: '#E6EBE1',

  selected: '#D4E7BE',
  chipBg: '#EBF2E4',
  chipInk: '#4A693D',

  icon: '#52664D',
  iconFaint: '#A1AC96',
  iconQuiet: '#8AA474',

  track: '#E7EDE0',
  trackFill: '#AFCF91',
  toggleOff: '#D3DCCA',
  toggleOn: '#4E6B3C',

  danger: '#78643A',
  dangerBg: '#F6F0DF',
  warningBg: '#F6F0DF',
  warningInk: '#78643A',
  warningBody: '#76694C',
  infoBg: '#F4F7EF',
  infoInk: '#5A714C',
  successBg: '#E9F1DF',
  successInk: '#2E452B',

  overlay: 'rgba(20, 32, 21, 0.32)',
  white: '#FFFFFF',
  transparent: 'transparent',
  disabled: '#A3AF99',
} as const;

export const spacing = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  huge: 32,
} as const;

export const radii = {
  xs: 8,
  sm: 10,
  md: 12,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  sheet: 28,
  pill: 99,
  full: 999,
} as const;

export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  fallback: 'Inter',
} as const;

export type TextVariant =
  | 'display'
  | 'heading'
  | 'title'
  | 'subtitle'
  | 'body'
  | 'strong'
  | 'caption'
  | 'meta'
  | 'label';

type TextStyleToken = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
};

export const typography: Record<TextVariant, TextStyleToken> = {
  // 30/600 — hero statements on Home
  display: { fontFamily: fonts.semiBold, fontSize: 30, lineHeight: 37.5 },
  // 28/600 — screen titles
  heading: { fontFamily: fonts.semiBold, fontSize: 28, lineHeight: 39 },
  // 21/600 — card and section titles
  title: { fontFamily: fonts.semiBold, fontSize: 21, lineHeight: 29 },
  // 16/600 — list titles
  subtitle: { fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 22 },
  // 14/400 — body copy
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  // 14/500 — emphasised inline text
  strong: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20 },
  // 12/400 — supporting copy
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 },
  // 11/400 — footnotes, demo notes
  meta: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 15 },
  // 10/600 — section labels (SEED TO GRAIN, YOUR NEXT STEP)
  label: { fontFamily: fonts.semiBold, fontSize: 10, lineHeight: 14, letterSpacing: 0.4 },
};

/** Default text colour per variant, matching the reference hierarchy. */
export const textColors: Record<TextVariant, string> = {
  display: colors.ink,
  heading: colors.heading,
  title: colors.ink,
  subtitle: colors.ink,
  body: colors.muted,
  strong: colors.ink,
  caption: colors.muted,
  meta: colors.faint,
  label: colors.muted,
};

/** Minimum accessible touch target. */
export const touchTarget = 48;

export const contentPadding = 24;
export const sectionGap = 20;

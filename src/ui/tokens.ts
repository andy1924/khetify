/**
 * Friendly Khetify palette: warm neutral surfaces, readable charcoal type,
 * restrained green actions, and blue / terracotta supporting accents.
 */

export const colors = {
  background: '#FAF8F4',
  ink: '#292C29',
  heading: '#242824',
  muted: '#64665F',
  mutedSoft: '#686A63',
  faint: '#686A63',
  subtle: '#686A63',

  accent: '#285B45',
  accentPressed: '#386D55',
  accentInk: '#FFFFFF',
  accentDeep: '#285B45',
  blueBg: '#EAF0F7',
  blueInk: '#355E81',
  clayBg: '#F6EAE1',
  clayInk: '#965737',
  goldBg: '#F6F0DC',
  goldInk: '#7C642D',

  surface: '#F1EEE8',
  surfaceSoft: '#F6F3ED',
  surfaceMuted: '#F2EFE9',
  surfaceAlt: '#ECEFF3',
  surfaceTint: '#F2EEE5',
  surfacePlain: '#FFFFFF',
  sheet: '#FFFDFA',

  border: '#DEDAD2',
  borderSoft: '#E9E5DD',
  divider: '#E9E5DD',

  selected: '#E4ECE4',
  chipBg: '#ECEFE9',
  chipInk: '#4A693D',

  icon: '#565F59',
  iconFaint: '#767A71',
  iconQuiet: '#8AA474',

  track: '#E8E4DC',
  trackFill: '#386D55',
  toggleOff: '#D3DCCA',
  toggleOn: '#4E6B3C',

  danger: '#963D32',
  dangerBg: '#F9EAE6',
  warningBg: '#F6F0DF',
  warningInk: '#78643A',
  warningBody: '#76694C',
  infoBg: '#EDF2F7',
  infoInk: '#355E81',
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
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semiBold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
  fallback: 'DMSans_400Regular',
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
  display: { fontFamily: fonts.semiBold, fontSize: 30, lineHeight: 40 },
  // 28/600 — screen titles
  heading: { fontFamily: fonts.semiBold, fontSize: 28, lineHeight: 39 },
  // 21/600 — card and section titles
  title: { fontFamily: fonts.semiBold, fontSize: 21, lineHeight: 29 },
  // 16/600 — list titles
  subtitle: { fontFamily: fonts.semiBold, fontSize: 16, lineHeight: 22 },
  // 16/400 — body copy
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 22 },
  // 16/500 — emphasised inline text
  strong: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 22 },
  // 13/400 — supporting copy
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  // 12/400 — footnotes
  meta: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16 },
  // 12/600 — section labels
  label: { fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },
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

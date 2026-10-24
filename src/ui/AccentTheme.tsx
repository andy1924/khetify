import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * Session accent theme for the demo user.
 *
 * Contract (agreed with root):
 *   export AccentProvider, useAccent, accentOptions, type AccentId
 *   useAccent(): { accent, setAccent }  — accent has id,label,strong,soft,selected,ink
 *
 * In-memory only: the demo does not persist preferences. `setAccent(id)` applies
 * immediately. Root mounts `<AccentProvider>` above the app; outside a provider
 * `useAccent` falls back to the default forest accent (inert picker) so isolated
 * previews/tests never crash.
 */

export type AccentId = 'forest' | 'olive' | 'teal' | 'clay' | 'plum' | 'blue';

export type Accent = {
  id: AccentId;
  label: string;
  strong: string;
  soft: string;
  selected: string;
  ink: string;
};

/* ------------------------------------------------------------------ */
/* Derived palette                                                     */
/* ------------------------------------------------------------------ */

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const part = (value: number) => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`;
}

/** Linear blend; `amount` is how much of `to` ends up in the result. */
export function mix(from: string, to: string, amount: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  return rgbToHex([
    a[0] + (b[0] - a[0]) * amount,
    a[1] + (b[1] - a[1]) * amount,
    a[2] + (b[2] - a[2]) * amount,
  ]);
}

/** Relative luminance, used only to decide whether text on a fill is dark or light. */
function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(channel => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * The full surface stack for an accent.
 *
 * Only `strong` (the deep tone), `soft` (the light fill) and `ink` (text on the
 * fill) are authored; every other tint — card wash, quiet icon, hairline
 * border, deep label text — is mixed from those three toward white or black.
 * That keeps a new accent to three hex values and guarantees the whole screen
 * stays in one hue family: a blue accent yields light-blue cards and blue
 * icons, not green ones.
 */
export type AccentPalette = {
  strong: string;
  soft: string;
  selected: string;
  ink: string;
  /** Deep accent text/icons on light surfaces. */
  deep: string;
  /** Quiet secondary icon. */
  icon: string;
  /** Faint icon for inactive controls. */
  iconFaint: string;
  /** Card wash (the reference `#E8F0DE` for forest). */
  surface: string;
  /** Second-level card wash (`#F1F5EB`). */
  surfaceSoft: string;
  /** Icon tile background (`#F0F4EB`). */
  surfaceTile: string;
  /** Hairline border (`#DFE6D8`). */
  border: string;
  /** Divider / very quiet border (`#E6EBE1`). */
  borderSoft: string;
  /** Page wash behind the accent (`#FBFCF9`). */
  page: string;
  /** Chip/tag fill. */
  chip: string;
  /** Chip/tag text. */
  chipInk: string;
  /** Selected control fill (`#D4E7BE`). */
  active: string;
  /** Primary body copy. */
  muted: string;
  /** Quietest supporting copy. */
  faint: string;
  /** Screen title ink. */
  heading: string;
  /** Sheet surface. */
  sheet: string;
  /** Disabled text/icon. */
  disabled: string;
};

function buildPalette(accent: Accent): AccentPalette {
  const { strong, soft, ink, selected } = accent;
  const white = '#FFFFFF';
  // Dark text on the accent needs to stay readable on the light fill.
  const safeInk = luminance(soft) > 0.05 ? mix(strong, '#000000', 0.45) : ink;
  return {
    strong,
    soft,
    selected,
    ink: safeInk,
    deep: mix(strong, '#000000', 0.1),
    icon: mix(strong, white, 0.22),
    iconFaint: mix(strong, white, 0.62),
    surface: mix(soft, white, 0.58),
    surfaceSoft: mix(soft, white, 0.78),
    surfaceTile: mix(soft, white, 0.72),
    border: mix(strong, white, 0.84),
    borderSoft: mix(strong, white, 0.89),
    page: mix(soft, white, 0.95),
    chip: mix(soft, white, 0.7),
    chipInk: mix(strong, '#000000', 0.15),
    active: mix(soft, white, 0.25),
    muted: mix(strong, white, 0.34),
    faint: mix(strong, white, 0.42),
    heading: mix(strong, '#000000', 0.28),
    sheet: mix(soft, white, 0.93),
    disabled: mix(strong, white, 0.6),
  };
}

const paletteCache = new Map<AccentId, AccentPalette>();

export function paletteFor(accent: Accent): AccentPalette {
  const cached = paletteCache.get(accent.id);
  if (cached) return cached;
  const built = buildPalette(accent);
  paletteCache.set(accent.id, built);
  return built;
}

export const accentOptions: readonly Accent[] = [
  {
    id: 'forest',
    label: 'Forest',
    strong: '#285B45',
    soft: '#BEDDA7',
    selected: 'rgba(209,229,213,0.62)',
    ink: '#263B29',
  },
  {
    id: 'olive',
    label: 'Olive',
    strong: '#566A2E',
    soft: '#D6DFB6',
    selected: 'rgba(219,228,199,0.62)',
    ink: '#2C3520',
  },
  {
    id: 'teal',
    label: 'Teal',
    strong: '#2A5F63',
    soft: '#B9D8D5',
    selected: 'rgba(206,229,227,0.62)',
    ink: '#1F3A3C',
  },
  {
    id: 'clay',
    label: 'Clay',
    strong: '#8A4B34',
    soft: '#E2C4B4',
    selected: 'rgba(236,214,202,0.62)',
    ink: '#3E2519',
  },
  {
    id: 'plum',
    label: 'Plum',
    strong: '#5A4468',
    soft: '#D3C6DC',
    selected: 'rgba(223,212,231,0.62)',
    ink: '#32263B',
  },
  {
    id: 'blue',
    label: 'Blue',
    strong: '#2E6CA4',
    soft: '#BCD9F1',
    selected: 'rgba(206,228,244,0.62)',
    ink: '#1B3346',
  },
] as const;

export const defaultAccent: Accent = accentOptions[0];

function accentById(id: AccentId): Accent {
  return accentOptions.find(option => option.id === id) ?? defaultAccent;
}

type AccentContextValue = {
  accent: Accent;
  /** All tints derived from `accent`; stable per accent id. */
  palette: AccentPalette;
  setAccent: (id: AccentId) => void;
};

const AccentContext = createContext<AccentContextValue | null>(null);

const fallbackValue: AccentContextValue = {
  accent: defaultAccent,
  palette: paletteFor(defaultAccent),
  setAccent: () => {},
};

export function AccentProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<AccentId>(defaultAccent.id);
  const accent = useMemo(() => accentById(id), [id]);
  const palette = useMemo(() => paletteFor(accent), [accent]);
  const setAccent = useCallback((next: AccentId) => setId(next), []);
  const value = useMemo(() => ({ accent, palette, setAccent }), [accent, palette, setAccent]);
  return <AccentContext.Provider value={value}>{children}</AccentContext.Provider>;
}

/** Current session accent. Falls back to forest outside `<AccentProvider>`. */
export function useAccent(): AccentContextValue {
  return useContext(AccentContext) ?? fallbackValue;
}

/** The derived surface stack only — the common case for styling. */
export function useAccentPalette(): AccentPalette {
  return useAccent().palette;
}

/**
 * Build a stylesheet once per accent instead of once per module.
 *
 * ```tsx
 * const makeStyles = (p: AccentPalette) => StyleSheet.create({ hero: { backgroundColor: p.surface } });
 * const styles = useStyles(makeStyles);
 * ```
 *
 * `StyleSheet.create` still runs outside render for each accent, so a retint
 * costs one stylesheet build, not a per-frame object allocation.
 */
export function useStyles<T>(factory: (palette: AccentPalette) => T): T {
  const palette = useAccentPalette();
  return useMemo(() => factory(palette), [factory, palette]);
}

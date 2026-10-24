import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, radii } from './tokens';
import { useAccentPalette, type AccentPalette } from './AccentTheme';

export type CardTone = 'surface' | 'plain' | 'soft' | 'muted' | 'tint' | 'translucent' | 'warning' | 'info';

export type CardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  /** Surface colour family. `surface` is the reference EEF4E7 card. */
  tone?: CardTone;
  padding?: number;
  gap?: number;
  radius?: number;
  accessibilityLabel?: string;
  testID?: string;
};

/**
 * Accent-aware tones. Everything that reads as "the app's green surface" is
 * remixed from the active accent; warning/info keep their semantic colour.
 */
function accentTones(p: AccentPalette) {
  const tones: Record<CardTone, string> = {
    surface: p.surface,
    plain: p.page,
    soft: p.surfaceSoft,
    muted: p.surfaceSoft,
    tint: p.surface,
    translucent: p.surfaceTile,
    warning: colors.warningBg,
    info: p.surfaceSoft,
  };
  return tones;
}

/** Quiet surface container: 20 radius by default, no shadow, no border. */
export function Card({
  children,
  style,
  onPress,
  tone = 'surface',
  padding = 20,
  gap,
  radius = radii.xxl,
  accessibilityLabel,
  testID,
}: CardProps) {
  const palette = useAccentPalette();
  const background = accentTones(palette)[tone];
  const base: StyleProp<ViewStyle> = [
    styles.base,
    { backgroundColor: background, padding, gap, borderRadius: radius },
    style,
  ];

  if (!onPress) {
    return (
      <View style={base} testID={testID} accessible={false}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      testID={testID}
      android_ripple={{ color: 'rgba(38, 59, 41, 0.06)' }}
      style={({ pressed }) => [base, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.88,
  },
});

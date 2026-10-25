import React from 'react';
import { Pressable, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { Button, Icon, Text, colors, radii, type IconName } from './ui';
import { useAccentPalette, useStyles, type AccentPalette } from '../../ui/AccentTheme';

/* ---------------------------------------------------------------- headings */

export function ScreenHeading({
  title,
  titleColor,
}: {
  title: string;
  subtitle?: string;
  /** Tools uses `#263B29`; every other reference screen uses `#213827`. */
  titleColor?: string;
  /** Tools and Soil use a 14/400 subtitle; other screens use 13/400. */
  subtitleSize?: number;
}) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.heading}>
      <Text style={[styles.headingTitle, { color: titleColor }]} accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------- chips */

export type ChipTone = 'ready' | 'limited' | 'unavailable' | 'partial' | 'gold' | 'best';

/** Accent-derived tones; the amber/gold states stay semantic warnings. */
function chipTones(p: AccentPalette): Record<ChipTone, { bg: string; ink: string }> {
  return {
    ready: { bg: p.chip, ink: p.chipInk },
    limited: { bg: '#F4EDDC', ink: '#76663b' },
    unavailable: { bg: p.surfaceSoft, ink: p.muted },
    partial: { bg: '#F5EFDE', ink: '#7a693c' },
    gold: { bg: '#F1EDDF', ink: '#74653f' },
    best: { bg: p.chip, ink: p.deep },
  };
}

export function StatusChip({ label, tone }: { label: string; tone: ChipTone }) {
  const palette = useAccentPalette();
  const styles = useStyles(makeStyles);
  const tones = chipTones(palette)[tone];
  return (
    <View style={[styles.chip, { backgroundColor: tones.bg }]}>
      <Text style={[styles.chipLabel, { color: tones.ink }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ banner */

export function Banner({
  title,
  body,
  icon = 'circle-alert',
  tone = 'warning',
}: {
  title?: string;
  body: string;
  icon?: IconName;
  tone?: 'warning' | 'danger';
}) {
  const styles = useStyles(makeStyles);
  const ink = tone === 'danger' ? '#8B7746' : '#78643A';
  return (
    <View
      style={[styles.banner, { backgroundColor: tone === 'danger' ? '#F6F0DF' : colors.warningBg }]}
      accessibilityRole="alert"
    >
      <View style={styles.bannerHead}>
        <Icon name={icon} size={19} color={ink} strokeWidth={1.6} />
        {title ? (
          <Text style={[styles.bannerTitle, { color: ink }]}>{title}</Text>
        ) : null}
      </View>
      <Text style={[styles.bannerBody, { color: colors.warningBody }]}>{body}</Text>
    </View>
  );
}

export function InfoStrip({ text, icon = 'info' }: { text: string; icon?: IconName }) {
  const palette = useAccentPalette();
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.infoStrip}>
      <Icon name={icon} size={16} color={palette.icon} strokeWidth={1.6} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------- sheet */

export { Sheet } from './ui';

/* -------------------------------------------------------------- list rows */

export function HairlineRow({
  children,
  style,
  last,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  last?: boolean;
}) {
  const styles = useStyles(makeStyles);
  return <View style={[styles.hairlineRow, last && styles.noHairline, style]}>{children}</View>;
}

export function KeyRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.keyRow}>
      <Text style={styles.keyLabel}>{label}</Text>
      <Text style={[styles.keyValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

/* ----------------------------------------------------------------- toggle */

export function SelectCircle({
  selected,
  onPress,
  label,
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
}) {
  const palette = useAccentPalette();
  const styles = useStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      hitSlop={10}
      style={[styles.circle, selected ? styles.circleOn : styles.circleOff]}
    >
      {selected ? <Icon name="check" size={14} color={palette.ink} strokeWidth={2} /> : null}
    </Pressable>
  );
}

export function PickerField({
  label,
  value,
  onPress,
  style,
}: {
  label: string;
  value: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = useAccentPalette();
  const styles = useStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      onPress={onPress}
      style={({ pressed }) => [styles.pickerField, pressed && styles.pressed, style]}
    >
      <Text style={styles.pickerLabel}>{label}</Text>
      <View style={styles.pickerValueRow}>
        <Text style={styles.pickerValue} numberOfLines={1}>
          {value}
        </Text>
        <Icon name="chevron-down" size={14} color={palette.muted} />
      </View>
    </Pressable>
  );
}

/** Compact label-over-input used inside sheets (flat field recipe, 12 radius). */
export function TextFieldRow({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'number-pad' | 'decimal-pad';
  error?: string;
}) {
  const palette = useAccentPalette();
  const styles = useStyles(makeStyles);
  return (
    <View
      style={[
        styles.textField,
        error ? { borderWidth: 1, borderColor: '#C6B489' } : null,
      ]}
    >
      <Text style={styles.pickerLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.iconFaint}
        keyboardType={keyboardType}
        accessibilityLabel={label}
        selectionColor={palette.deep}
        style={styles.textFieldInput}
      />
    </View>
  );
}

export function TwoButtonRow({
  primary,
  secondary,
}: {
  primary: React.ReactNode;
  secondary: React.ReactNode;
}) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.twoButtons}>
      <View style={styles.twoButtonCell}>{primary}</View>
      <View style={styles.twoButtonCell}>{secondary}</View>
    </View>
  );
}

export { Button };

const makeStyles = (p: AccentPalette) => {
  const hairline = { borderBottomWidth: 0, borderBottomColor: p.border } as const;
  return StyleSheet.create({
    heading: { gap: 6 },
    headingTitle: { fontFamily: 'System', fontWeight: '600', fontSize: 28, lineHeight: 39.2 },
    headingSubtitle: { fontFamily: 'System', fontWeight: '400', fontSize: 13, lineHeight: 18.2, color: p.muted },

    chip: {
      minHeight: 25,
      borderRadius: radii.pill,
      paddingHorizontal: 10,
      paddingVertical: 6,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
    },
    chipLabel: { fontFamily: 'System', fontWeight: '500', fontSize: 11, lineHeight: 14 },

    banner: { borderRadius: 18, padding: 12, gap: 6 },
    bannerHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    bannerTitle: { fontFamily: 'System', fontWeight: '600', fontSize: 13, lineHeight: 18 },
    bannerBody: { fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 17 },

    infoStrip: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    infoText: { flex: 1, fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 17, color: p.muted },


    hairlineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 48,
      paddingVertical: 12,
      gap: 12,
      ...hairline,
    },
    noHairline: { borderBottomWidth: 0 },

    keyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7 },
    keyLabel: { flex: 1, fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 17, color: p.muted },
    keyValue: { fontFamily: 'System', fontWeight: '500', fontSize: 12, lineHeight: 17, color: p.deep, textAlign: 'right' },

    circle: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    circleOn: { backgroundColor: p.active },
    circleOff: { backgroundColor: p.sheet, borderWidth: 1, borderColor: p.border },

    pickerField: {
      flex: 1,
      minHeight: 54,
      borderRadius: 12,
      backgroundColor: p.surfaceSoft,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 4,
      justifyContent: 'center',
    },
    pickerLabel: { fontFamily: 'System', fontWeight: '400', fontSize: 11, lineHeight: 15, color: p.muted },
    pickerValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    pickerValue: { flex: 1, fontFamily: 'System', fontWeight: '400', fontSize: 14, lineHeight: 19, color: p.ink },

    textField: {
      minHeight: 54,
      borderRadius: 12,
      backgroundColor: p.surfaceSoft,
      paddingHorizontal: 14,
      paddingVertical: 10,
      gap: 4,
    },
    textFieldInput: {
      padding: 0,
      margin: 0,
      fontFamily: 'System', fontWeight: '500',
      fontSize: 15,
      lineHeight: 21,
      color: p.ink,
      includeFontPadding: false,
    },
    twoButtons: { flexDirection: 'row', gap: 12 },
    twoButtonCell: { flex: 1 },
    pressed: { opacity: 0.86 },
  });
};

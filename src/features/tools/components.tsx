import React from 'react';
import { Pressable, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { Button, Icon, Text, colors, radii, type IconName } from './ui';

/* ---------------------------------------------------------------- headings */

export function ScreenHeading({
  title,
  subtitle,
  titleColor = colors.heading,
  subtitleSize = 13,
}: {
  title: string;
  subtitle?: string;
  /** Tools uses `#292C29`; every other reference screen uses `#242824`. */
  titleColor?: string;
  /** Tools and Soil use a 14/400 subtitle; other screens use 13/400. */
  subtitleSize?: number;
}) {
  return (
    <View style={styles.heading}>
      <Text style={[styles.headingTitle, { color: titleColor }]} accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={[
            styles.headingSubtitle,
            subtitleSize !== 13 && { fontSize: subtitleSize, lineHeight: subtitleSize * 1.4 },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------- chips */

export type ChipTone = 'ready' | 'limited' | 'unavailable' | 'partial' | 'gold' | 'best';

const chipTones: Record<ChipTone, { bg: string; ink: string }> = {
  ready: { bg: '#E3EED7', ink: '#5c6953' },
  limited: { bg: '#F4EDDC', ink: '#76663b' },
  unavailable: { bg: '#EAEDE5', ink: '#606d56' },
  partial: { bg: '#F5EFDE', ink: '#7a693c' },
  gold: { bg: '#F1EDDF', ink: '#74653f' },
  best: { bg: '#ECEFE9', ink: '#4A693D' },
};

export function StatusChip({ label, tone }: { label: string; tone: ChipTone }) {
  const palette = chipTones[tone];
  return (
    <View style={[styles.chip, { backgroundColor: palette.bg }]}>
      <Text style={[styles.chipLabel, { color: palette.ink }]} numberOfLines={1}>
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
  return (
    <View style={styles.infoStrip}>
      <Icon name={icon} size={16} color="#8D9A81" strokeWidth={1.6} />
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
  return <View style={[styles.hairlineRow, last && styles.noHairline, style]}>{children}</View>;
}

export function KeyRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
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
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      hitSlop={10}
      style={[styles.circle, selected ? styles.circleOn : styles.circleOff]}
    >
      {selected ? <Icon name="check" size={14} color="#292D29" strokeWidth={2} /> : null}
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
        <Icon name="chevron-down" size={14} color={colors.muted} />
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
        placeholderTextColor="#A3AF99"
        keyboardType={keyboardType}
        accessibilityLabel={label}
        selectionColor="#3D5C30"
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
  return (
    <View style={styles.twoButtons}>
      <View style={styles.twoButtonCell}>{primary}</View>
      <View style={styles.twoButtonCell}>{secondary}</View>
    </View>
  );
}

export { Button };

const hairline = { borderBottomWidth: 1, borderBottomColor: '#DEDAD2' } as const;

const styles = StyleSheet.create({
  heading: { gap: 6 },
  headingTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 28, lineHeight: 39 },
  headingSubtitle: { fontFamily: 'DMSans_400Regular', fontSize: 14, lineHeight: 19, color: '#6a7667' },

  chip: {
    minHeight: 25,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  chipLabel: { fontFamily: 'DMSans_500Medium', fontSize: 12, lineHeight: 16 },

  banner: { borderRadius: 18, padding: 12, gap: 6 },
  bannerHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bannerTitle: { fontFamily: 'DMSans_600SemiBold', fontSize: 14, lineHeight: 19 },
  bannerBody: { fontFamily: 'DMSans_400Regular', fontSize: 13, lineHeight: 18 },

  infoStrip: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 13, lineHeight: 18, color: '#64665F' },


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
  keyLabel: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 13, lineHeight: 18, color: '#6a7560' },
  keyValue: { fontFamily: 'DMSans_500Medium', fontSize: 13, lineHeight: 18, color: '#526D43', textAlign: 'right' },

  circle: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  circleOn: { backgroundColor: '#D7E5D8' },
  circleOff: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DEDAD2' },

  pickerField: {
    flex: 1,
    minHeight: 54,
    borderRadius: 12,
    backgroundColor: '#F6F3ED',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
    justifyContent: 'center',
  },
  pickerLabel: { fontFamily: 'DMSans_400Regular', fontSize: 12, lineHeight: 16, color: '#666f63' },
  pickerValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pickerValue: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 16, lineHeight: 22, color: '#292D29' },

  textField: {
    minHeight: 54,
    borderRadius: 12,
    backgroundColor: '#F6F3ED',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
  },
  textFieldInput: {
    padding: 0,
    margin: 0,
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    lineHeight: 21,
    color: '#292D29',
    includeFontPadding: false,
  },
  twoButtons: { flexDirection: 'row', gap: 12 },
  twoButtonCell: { flex: 1 },
  pressed: { opacity: 0.86 },
});

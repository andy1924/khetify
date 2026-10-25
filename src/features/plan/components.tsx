import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { colors, Icon, Text, type IconName } from '../../ui';
import { useAccentPalette, useStyles } from '../../ui/AccentTheme';
import type { AccentPalette } from '../../ui/AccentTheme';

/** Screen title block used by the plan screens (28/600 + 13/400 muted line). */
export function ScreenHeading({ title }: { title: string; subtitle?: string }) {
  const styles = useStyles(makeStyles);
  const palette = useAccentPalette();
  return (
    <View style={styles.heading}>
      <Text variant="heading" color={palette.ink} accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
}

/** Warning panel for the incomplete-estimate state on the stage screen. */
export function EstimateBanner({ title, body }: { title: string; body: string }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <View style={styles.bannerHead}>
        <Icon name="circle-alert" size={19} color={colors.warningInk} strokeWidth={1.6} />
        <Text style={styles.bannerTitle}>{title}</Text>
      </View>
      <Text style={styles.bannerBody}>{body}</Text>
    </View>
  );
}

/** Small informational strip (shield-check privacy note). */
export function InfoStrip({ text, icon = 'shield-check' }: { text: string; icon?: IconName }) {
  const palette = useAccentPalette();
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.infoStrip}>
      <Icon name={icon} size={18} color={palette.icon} strokeWidth={1.6} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

/** Hairline separator used inside the grouped form cards. */
export function Hairline({ inset = 0 }: { inset?: number }) {
  const styles = useStyles(makeStyles);
  return <View style={[styles.hairline, { marginHorizontal: inset }]} />;
}

/** Label/value pair used by grouped summary cards (label 12, value 15/500). */
export function GroupedField({
  label,
  value,
  flex,
}: {
  label: string;
  value: string;
  flex?: boolean;
}) {
  const styles = useStyles(makeStyles);
  return (
    <View style={[styles.groupedField, flex ? styles.flex : null]}>
      <Text style={styles.groupedLabel}>{label}</Text>
      <Text style={styles.groupedValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

/** Editable label/value row: renders an input in place of the value. */
export function EditableRow({
  label,
  children,
  flex,
  error,
  last,
}: {
  label: string;
  children: React.ReactNode;
  flex?: boolean;
  error?: string;
  last?: boolean;
}) {
  const styles = useStyles(makeStyles);
  return (
    <View style={[styles.editRow, last && styles.noHairline, flex ? styles.flex : null]}>
      <Text style={styles.groupedLabel}>{label}</Text>
      {children}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

/** Selectable option row with an explicit selected check. */
export function ChoiceRow({
  label,
  caption,
  selected,
  onPress,
  accessibilityLabel,
}: {
  label: string;
  caption?: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const palette = useAccentPalette();
  const styles = useStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        selected && styles.choiceSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.choiceCopy}>
        <Text style={[styles.choiceLabel, selected && styles.choiceLabelSelected]}>{label}</Text>
        {caption ? <Text style={styles.choiceCaption}>{caption}</Text> : null}
      </View>
      <View style={[styles.circle, selected ? styles.circleOn : styles.circleOff]}>
        {selected ? <Icon name="check" size={14} color={palette.ink} strokeWidth={2} /> : null}
      </View>
    </Pressable>
  );
}

/** Stage indicator: check for completed, ordinal for current/pending, lock for locked. */
export function StageIndicator({
  status,
  ordinal,
}: {
  status: 'completed' | 'current' | 'locked';
  ordinal: string;
}) {
  const palette = useAccentPalette();
  const styles = useStyles(makeStyles);
  if (status === 'completed') {
    return (
      <View style={[styles.indicator, styles.indicatorDone]}>
        <Icon name="check" size={16} color={palette.icon} strokeWidth={1.9} />
      </View>
    );
  }
  return (
    <View style={[styles.indicator, status === 'current' ? styles.indicatorCurrent : styles.indicatorLocked]}>
      <Text style={[styles.indicatorText, status === 'current' && styles.indicatorTextCurrent]}>
        {ordinal}
      </Text>
    </View>
  );
}

export function PressableRow({
  children,
  onPress,
  label,
  style,
  disabled,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  label: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  const styles = useStyles(makeStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      android_ripple={{ color: 'rgba(38, 59, 41, 0.05)' }}
      style={({ pressed }) => [style, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

export { colors };

const makeStyles = (p: AccentPalette) => StyleSheet.create({
  heading: { gap: 6 },
  headingSubtitle: { fontFamily: 'System', fontWeight: '400', fontSize: 13, lineHeight: 18.2, color: p.icon },

  banner: { backgroundColor: '#F6F0DF', borderRadius: 18, padding: 12, gap: 6 },
  bannerHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bannerTitle: { fontFamily: 'System', fontWeight: '600', fontSize: 13, lineHeight: 18, color: '#78643A' },
  bannerBody: { fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 17, color: '#76694C' },

  infoStrip: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { flex: 1, fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 17, color: p.icon },

  hairline: { height: 1, backgroundColor: p.border },
  flex: { flex: 1 },

  groupedField: { paddingVertical: 12, gap: 4 },
  groupedLabel: { fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 17, color: p.icon },
  groupedValue: { fontFamily: 'System', fontWeight: '500', fontSize: 15, lineHeight: 21, color: p.ink },

  editRow: {
    paddingVertical: 10,
    gap: 4,
    borderBottomWidth: 0,
    borderBottomColor: p.border,
  },
  noHairline: { borderBottomWidth: 0 },
  errorText: { fontFamily: 'System', fontWeight: '400', fontSize: 11, lineHeight: 15, color: '#8B4A3A' },

  choice: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: p.border,
    backgroundColor: p.page,
  },
  choiceSelected: { backgroundColor: p.surface, borderColor: p.active },
  choiceCopy: { flex: 1, gap: 2 },
  choiceLabel: { fontFamily: 'System', fontWeight: '500', fontSize: 14, lineHeight: 20, color: p.ink },
  choiceLabelSelected: { color: p.ink },
  choiceCaption: { fontFamily: 'System', fontWeight: '400', fontSize: 11, lineHeight: 15, color: p.icon },

  circle: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  circleOn: { backgroundColor: p.active },
  circleOff: { backgroundColor: p.page, borderWidth: 1, borderColor: p.border },

  indicator: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  indicatorDone: { backgroundColor: p.surfaceSoft },
  indicatorCurrent: { backgroundColor: p.active },
  indicatorLocked: { backgroundColor: p.surfaceSoft },
  indicatorText: { fontFamily: 'System', fontWeight: '500', fontSize: 11, lineHeight: 15, color: p.iconFaint },
  indicatorTextCurrent: { color: p.icon },

  pressed: { opacity: 0.85 },
});

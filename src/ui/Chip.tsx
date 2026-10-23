import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Icon, type IconName, type LucideIcon } from './Icon';
import { Text } from './Text';
import { colors, radii } from './tokens';

export type ChipTone =
  | 'neutral'
  | 'selected'
  | 'soft'
  | 'info'
  | 'success'
  | 'ready'
  | 'limited'
  | 'unavailable'
  | 'warning'
  | 'danger'
  | 'reported'
  | 'reviewed'
  | 'confirmed';

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: ChipTone;
  icon?: IconName | LucideIcon;
  /** Leading dot instead of an icon. */
  dot?: boolean;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
};

const toneStyles: Record<ChipTone, { bg: string; ink: string }> = {
  neutral: { bg: colors.chipBg, ink: colors.chipInk },
  soft: { bg: colors.chipBg, ink: colors.chipInk },
  selected: { bg: colors.selected, ink: colors.chipInk },
  info: { bg: colors.infoBg, ink: colors.chipInk },
  success: { bg: colors.surfaceTint, ink: colors.successInk },
  ready: { bg: '#E3EED7', ink: '#5C6953' },
  limited: { bg: '#F4EDDC', ink: '#76663B' },
  unavailable: { bg: '#EAEDE5', ink: '#606D56' },
  warning: { bg: colors.warningBg, ink: colors.warningInk },
  danger: { bg: colors.dangerBg, ink: colors.danger },
  reported: { bg: '#F0ECDC', ink: '#76663C' },
  reviewed: { bg: '#E8EDE3', ink: '#556D44' },
  confirmed: { bg: '#DCECCF', ink: '#556D44' },
};

/**
 * Pill chip, 25pt tall with 10pt side padding, matching the reference status
 * and filter chips. Selectable chips expose busy/selected state; static chips
 * are announced as text.
 */
export function Chip({
  label,
  selected,
  onPress,
  tone = 'soft',
  icon,
  dot = false,
  size = 'md',
  style,
  accessibilityLabel,
  testID,
}: ChipProps) {
  const palette = selected ? toneStyles.selected : toneStyles[tone];
  const inkColor = palette.ink;
  const iconColor = inkColor;

  const content = (
    <View style={[styles.row, size === 'sm' && styles.rowSm]}>
      {dot ? <View style={[styles.dot, { backgroundColor: iconColor }]} /> : null}
      {icon
        ? typeof icon === 'string'
          ? <Icon name={icon as IconName} size={13} color={iconColor} strokeWidth={1.8} />
          : React.createElement(icon, { size: 13, color: iconColor, strokeWidth: 1.8 })
        : null}
      <Text
        variant="meta"
        weight={selected ? 'semiBold' : 'medium'}
        color={inkColor}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );

  if (!onPress) {
    return (
      <View style={[styles.base, { backgroundColor: palette.bg }, style]} testID={testID}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      onPress={onPress}
      testID={testID}
      android_ripple={{ color: 'rgba(38, 59, 41, 0.08)', borderless: false }}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: palette.bg },
        pressed && styles.pressed,
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    minHeight: 25,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rowSm: {
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  pressed: {
    opacity: 0.82,
  },
});

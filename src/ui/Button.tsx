import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Icon, type IconName, type LucideIcon } from './Icon';
import { Text } from './Text';
import { colors, radii, touchTarget } from './tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';

export type ButtonProps = {
  title?: string;
  label?: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  /** Icon rendered before the label. Pass a string name or a lucide component. */
  icon?: IconName | LucideIcon;
  /** Icon rendered after the label (default arrow only when `trailingArrow` is set). */
  trailingIcon?: IconName | LucideIcon;
  /** Show the reference arrow-right glyph after the label. */
  trailingArrow?: boolean;
  /** Custom children replace the label (expanded buttons, icon-only). */
  children?: React.ReactNode;
  /** Fills the available width. Defaults to true, matching the reference CTAs. */
  fullWidth?: boolean;
  /** Height: md 48 (reference), sm 40, lg 52. */
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
};

const backgrounds: Record<ButtonVariant, string> = {
  primary: colors.accent,
  secondary: colors.surface,
  ghost: colors.transparent,
  outline: colors.transparent,
  danger: colors.dangerBg,
};

const labelColors: Record<ButtonVariant, string> = {
  primary: colors.accentInk,
  secondary: colors.accentInk,
  ghost: colors.accentDeep,
  outline: colors.ink,
  danger: colors.danger,
};

const heights = { sm: 40, md: touchTarget, lg: 52 } as const;

/**
 * Filled pill button, 48dp tall with a 24 radius, matching the HeroUI-based
 * reference. Primary is leaf green, secondary is the soft surface, ghost is
 * borderless.
 */
export function Button({
  title,
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  icon,
  trailingIcon,
  trailingArrow = variant === 'primary',
  children,
  fullWidth = true,
  size = 'md',
  style,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const text = title ?? label ?? '';
  const inactive = disabled || loading;
  const iconColor = inactive ? colors.disabled : labelColors[variant];

  const renderIcon = (value: IconName | LucideIcon | undefined, fallbackName?: IconName) => {
    if (!value && !fallbackName) return null;
    if (typeof value === 'string' || value === undefined) {
      return <Icon name={(value ?? fallbackName) as IconName} size={18} color={iconColor} strokeWidth={1.8} />;
    }
    const Glyph = value;
    return <Glyph size={18} color={iconColor} strokeWidth={1.8} />;
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? text}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      testID={testID}
      android_ripple={{ color: 'rgba(38, 59, 41, 0.10)', borderless: false }}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: heights[size],
          backgroundColor: backgrounds[variant],
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: colors.border,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: inactive ? 0.55 : pressed ? 0.86 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={labelColors[variant]} />
      ) : (
        <View style={styles.content}>
          {renderIcon(icon)}
          {children ?? (
            <Text
              variant="strong"
              weight="semiBold"
              color={inactive ? colors.disabled : labelColors[variant]}
              style={styles.label}
            >
              {text}
            </Text>
          )}
          {trailingIcon ? renderIcon(trailingIcon) : null}
          {!trailingIcon && trailingArrow && !inactive && !children ? renderIcon(undefined, 'arrow-right') : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.xxxl,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    flexShrink: 1,
  },
});

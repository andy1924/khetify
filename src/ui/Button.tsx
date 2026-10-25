import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Icon, type IconName, type LucideIcon } from './Icon';
import { Text } from './Text';
import { colors, radii, touchTarget } from './tokens';
import { motion, useReduceMotion } from './motion';
import { useAccentPalette, type AccentPalette } from './AccentTheme';

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

function backgrounds(p: AccentPalette): Record<ButtonVariant, string> {
  return {
    primary: p.soft,
    secondary: p.surface,
    ghost: colors.transparent,
    outline: colors.transparent,
    danger: colors.dangerBg,
  };
}

function labelColors(p: AccentPalette): Record<ButtonVariant, string> {
  return {
    primary: p.ink,
    secondary: p.ink,
    ghost: p.deep,
    outline: p.ink,
    danger: colors.danger,
  };
}

const heights = { sm: 40, md: touchTarget, lg: 52 } as const;

/**
 * Filled pill button, 48dp tall with a 24 radius, matching the HeroUI-based
 * reference. Primary is leaf green, secondary is the soft surface, ghost is
 * borderless.
 *
 * Press feedback is a short native-driven scale (90ms down, 140ms back), so the
 * label responds on the UI thread instead of waiting for a JS re-render. The
 * scale sits on the inner content view, leaving layout, padding and the pill
 * background on the pressable where call sites override them.
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
  const palette = useAccentPalette();
  // Primary and secondary follow the session accent so a blue accent never
  // leaves a green pill behind; other variants keep their semantic colour.
  const background = backgrounds(palette)[variant];
  const labelColor = labelColors(palette)[variant];
  const iconColor = inactive ? palette.disabled : labelColor;
  const reduceMotion = useReduceMotion();

  const [press] = React.useState(() => new Animated.Value(1));
  const running = React.useRef<Animated.CompositeAnimation | null>(null);

  // Stop the in-flight timing when the button unmounts mid-press, and settle at
  // rest if the system preference flips while it is still animating.
  React.useEffect(() => () => running.current?.stop(), []);
  React.useEffect(() => {
    if (!reduceMotion) return;
    running.current?.stop();
    press.setValue(1);
  }, [press, reduceMotion]);

  const animatePress = React.useCallback(
    (toValue: number, duration: number) => {
      // A new touch cancels the previous timing so a quick tap never leaves two
      // animations fighting over the same scale.
      running.current?.stop();
      if (reduceMotion) {
        press.setValue(toValue);
        return;
      }
      running.current = Animated.timing(press, {
        toValue,
        duration,
        easing: toValue < 1 ? motion.easing.out : motion.easing.in,
        useNativeDriver: true,
      });
      running.current.start();
    },
    [press, reduceMotion],
  );

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
      onPressIn={() => animatePress(motion.pressScale, motion.press)}
      onPressOut={() => animatePress(1, motion.release)}
      testID={testID}
      android_ripple={{ color: 'rgba(38, 59, 41, 0.10)', borderless: false }}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: heights[size],
          backgroundColor: background,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: palette.border,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: inactive ? 0.55 : pressed ? motion.pressOpacity : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={labelColor} />
      ) : (
        <Animated.View style={[styles.content, { transform: [{ scale: press }] }]}>
          {renderIcon(icon)}
          {children ?? (
            <Text
              variant="strong"
              weight="semiBold"
              color={inactive ? palette.disabled : labelColor}
              style={styles.label}
            >
              {text}
            </Text>
          )}
          {trailingIcon ? renderIcon(trailingIcon) : null}
          {!trailingIcon && trailingArrow && !inactive && !children ? renderIcon(undefined, 'arrow-right') : null}
        </Animated.View>
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

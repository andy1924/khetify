import React from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Icon, type IconName, type LucideIcon } from './Icon';
import { Text, SectionLabel } from './Text';
import { colors, radii, touchTarget } from './tokens';
import { motion, useReduceMotion } from './motion';
import { useAccentPalette, useStyles, type AccentPalette } from './AccentTheme';

/* ------------------------------------------------------------------ */
/* Row                                                                 */
/* ------------------------------------------------------------------ */

export type RowProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Vertical alignment. Defaults to center. */
  align?: ViewStyle['alignItems'];
  /** Space between children (default 8). */
  gap?: number;
  /** Let children share width evenly. */
  fill?: boolean;
  wrap?: boolean;
  justify?: ViewStyle['justifyContent'];
};

/** Horizontal layout helper used throughout the reference. */
export function Row({ children, style, align = 'center', gap = 8, fill = false, wrap = false, justify }: RowProps) {
  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: align, gap, flexWrap: wrap ? 'wrap' : 'nowrap', justifyContent: justify },
        fill && { flex: 1 },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Divider                                                             */
/* ------------------------------------------------------------------ */

export function Divider({
  style,
  inset = 0,
  color,
}: {
  style?: StyleProp<ViewStyle>;
  inset?: number;
  color?: string;
}) {
  const styles = useStyles(makeStyles);
  const palette = useAccentPalette();
  return <View style={[styles.divider, { marginHorizontal: inset, backgroundColor: color ?? palette.borderSoft }, style]} />;
}

/* ------------------------------------------------------------------ */
/* Notice                                                              */
/* ------------------------------------------------------------------ */

export type NoticeTone = 'warning' | 'info' | 'neutral' | 'danger' | 'success';

export type NoticeProps = {
  title?: string;
  children?: React.ReactNode;
  tone?: NoticeTone;
  icon?: IconName | LucideIcon;
  style?: StyleProp<ViewStyle>;
  /** Render without a surface fill (inline footnote). */
  plain?: boolean;
};

function noticePalettes(p: AccentPalette): Record<NoticeTone, { bg: string; ink: string; title: string }> {
  return {
    warning: { bg: colors.warningBg, ink: colors.warningBody, title: colors.warningInk },
    info: { bg: p.surfaceSoft, ink: p.chipInk, title: p.chipInk },
    neutral: { bg: p.surfaceSoft, ink: p.muted, title: p.ink },
    danger: { bg: colors.dangerBg, ink: colors.danger, title: colors.danger },
    success: { bg: p.surface, ink: p.ink, title: p.ink },
  };
}

/**
 * Quiet advisory panel used for estimate-incomplete, limitations and stale
 * data states. The design pairs a short title with one explanatory line.
 */
export function Notice({ title, children, tone = 'neutral', icon, style, plain = false }: NoticeProps) {
  const accentPalette = useAccentPalette();
  const styles = useStyles(makeStyles);
  const palette = noticePalettes(accentPalette)[tone];
  // JSX interpolation creates arrays of text children. Native Views cannot
  // render those strings (or numbers) directly, including inside fragments.
  const body: React.ReactNode[] = [];
  let text: (string | number)[] = [];
  const flushText = () => {
    if (text.length === 0) return;
    body.push(<Text key={`text-${body.length}`} variant="meta" color={palette.ink} style={styles.noticeBody}>{text}</Text>);
    text = [];
  };
  const append = (nodes: React.ReactNode) => React.Children.forEach(nodes, child => {
    if (typeof child === 'string' || typeof child === 'number') text.push(child);
    else if (React.isValidElement<{ children?: React.ReactNode }>(child) && child.type === React.Fragment) append(child.props.children);
    else if (child != null && typeof child !== 'boolean') {
      flushText();
      body.push(<React.Fragment key={`node-${body.length}`}>{child}</React.Fragment>);
    }
  });
  append(children);
  flushText();
  return (
    <View style={[styles.notice, !plain && { backgroundColor: palette.bg }, style]}>
      {title ? (
        <Row gap={8} align="flex-start">
          {icon ? <Icon name={icon as IconName} size={16} color={palette.title} strokeWidth={1.7} /> : null}
          <Text variant="caption" weight="semiBold" color={palette.title} style={styles.flexText}>
            {title}
          </Text>
        </Row>
      ) : null}
      {body}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* KeyValue                                                            */
/* ------------------------------------------------------------------ */

export type KeyValueProps = {
  label: string;
  value: string;
  /** Stacked (default) or a single justified line. */
  layout?: 'stack' | 'inline';
  /** Emphasise the value (12/500 ink). */
  strong?: boolean;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

/** Label/value pair used in plan, forecast and import summaries. */
export function KeyValue({ label, value, layout = 'stack', strong = false, style, onPress }: KeyValueProps) {
  const styles = useStyles(makeStyles);
  const palette = useAccentPalette();
  const content =
    layout === 'inline' ? (
      <Row justify="space-between" gap={12} style={styles.inlineRow}>
        <Text variant="caption" color={palette.muted} style={styles.flexText}>
          {label}
        </Text>
        <Text variant="caption" weight="medium" color={strong ? palette.ink : palette.chipInk}>
          {value}
        </Text>
      </Row>
    ) : (
      <View style={styles.stack}>
        <Text variant="caption" color={palette.muted}>
          {label}
        </Text>
        <Text variant="caption" weight={strong ? 'semiBold' : 'medium'} color={strong ? palette.ink : palette.chipInk}>
          {value}
        </Text>
      </View>
    );

  if (!onPress) return <View style={style}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      onPress={onPress}
      style={style}
    >
      {content}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* DemoBadge                                                           */
/* ------------------------------------------------------------------ */

/**
 * Small demo marker. The reference uses 11/500 chip text on EB F2 E4 at 99
 * radius. Keep this the only engineering-facing badge on a screen.
 */
export function DemoBadge({
  label = 'Demo',
  style,
}: {
  label?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles(makeStyles);
  const palette = useAccentPalette();
  return (
    <View style={[styles.demoBadge, style]} accessibilityLabel={`${label} data`}>
      <Text variant="meta" weight="medium" color={palette.chipInk}>
        {label}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* IconSurface                                                         */
/* ------------------------------------------------------------------ */

export type IconSurfaceProps = {
  name?: IconName | LucideIcon;
  size?: number;
  box?: number;
  radius?: number;
  background?: string;
  color?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Rounded square that hosts an icon (48×48, 16 radius on Home shortcuts). */
export function IconSurface({
  name,
  size = 20,
  box = 48,
  radius = radii.lg,
  background,
  color,
  children,
  style,
}: IconSurfaceProps) {
  const palette = useAccentPalette();
  background = background ?? palette.surfaceTile;
  color = color ?? palette.icon;
  return (
    <View
      style={[
        { width: box, height: box, borderRadius: radius, backgroundColor: background, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      {children ??
        (name
          ? typeof name === 'string'
            ? <Icon name={name as IconName} size={size} color={color} strokeWidth={1.6} />
            : React.createElement(name, { size, color, strokeWidth: 1.6 })
          : null)}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Avatar                                                              */
/* ------------------------------------------------------------------ */

export function Avatar({
  initials,
  size = 38,
  background,
  color,
  style,
}: {
  initials: string;
  size?: number;
  background?: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = useAccentPalette();
  background = background ?? palette.chip;
  color = color ?? palette.chipInk;
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: background,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
      accessible
      accessibilityLabel={`${initials} avatar`}
    >
      <Text variant="meta" weight="semiBold" color={color} style={{ fontSize: size * 0.29 }}>
        {initials}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* ProgressBar                                                         */
/* ------------------------------------------------------------------ */

export function ProgressBar({
  progress,
  style,
  height = 4,
  fill,
  track,
}: {
  /** 0–1 */
  progress: number;
  style?: StyleProp<ViewStyle>;
  height?: number;
  fill?: string;
  track?: string;
}) {
  const palette = useAccentPalette();
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View
      style={[{ height, borderRadius: height, backgroundColor: track ?? palette.border, overflow: 'hidden' }, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <View style={{ width: `${clamped * 100}%`, height, borderRadius: height, backgroundColor: fill ?? palette.active }} />
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* SegmentedProgress                                                   */
/* ------------------------------------------------------------------ */

/** Discrete progress segments (assessment step indicator). */
export function SegmentedProgress({
  count,
  current,
  style,
  height = 4,
  gap = 6,
}: {
  count: number;
  /** Zero-based index of the active segment; earlier segments render filled. */
  current: number;
  style?: StyleProp<ViewStyle>;
  height?: number;
  gap?: number;
}) {
  const palette = useAccentPalette();
  return (
    <Row gap={gap} style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={{
            flex: 1,
            height,
            borderRadius: height,
            backgroundColor: index <= current ? palette.active : palette.border,
          }}
        />
      ))}
    </Row>
  );
}

/* ------------------------------------------------------------------ */
/* Toggle                                                              */
/* ------------------------------------------------------------------ */

export type ToggleProps = {
  value: boolean;
  onValueChange?: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/** 36×22 pill switch with a 16pt thumb, matching the consent control. */
export function Toggle({ value, onValueChange, label, disabled = false, style, accessibilityLabel }: ToggleProps) {
  const styles = useStyles(makeStyles);
  const palette = useAccentPalette();
  const reduceMotion = useReduceMotion();
  const accentPalette = useAccentPalette();
  // 0 = off, 1 = on. Only the thumb moves on the native thread; the track
  // colour switches instantly so a caller-supplied `backgroundColor` still wins
  // through the `style` prop.
  const [progress] = React.useState(() => new Animated.Value(value ? 1 : 0));

  React.useEffect(() => {
    if (reduceMotion) {
      progress.setValue(value ? 1 : 0);
      return;
    }
    const animation = Animated.spring(progress, {
      toValue: value ? 1 : 0,
      ...motion.toggleSpring,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [value, progress, reduceMotion]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange?.(!value)}
      hitSlop={10}
      style={[
        styles.toggle,
        { backgroundColor: value ? accentPalette.strong : palette.borderSoft, opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.toggleThumb,
          {
            transform: [
              {
                translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 14] }),
              },
            ],
          },
        ]}
      />
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* ListRow                                                             */
/* ------------------------------------------------------------------ */

export type ListRowProps = {
  title: string;
  description?: string;
  icon?: IconName | LucideIcon;
  iconColor?: string;
  iconBackground?: string;
  /** Right-hand value text (replaces the chevron when provided). */
  value?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  /** Show a chevron-right. Defaults to true when `onPress` is set. */
  chevron?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
};

/**
 * Settings/entry row: icon, title, supporting line, trailing chevron.
 * Reference uses 72pt minimum height with 16pt vertical padding.
 */
export function ListRow({
  title,
  description,
  icon,
  iconColor,
  iconBackground,
  value,
  right,
  onPress,
  chevron,
  style,
  accessibilityLabel,
  testID,
}: ListRowProps) {
  const styles = useStyles(makeStyles);
  const palette = useAccentPalette();
  const resolvedIconColor = iconColor ?? palette.icon;
  const showChevron = chevron ?? Boolean(onPress);
  const content = (
    <Row gap={12} style={styles.listRow} align="center">
      {icon ? (
        iconBackground ? (
          <IconSurface name={icon} box={36} radius={12} background={iconBackground} color={resolvedIconColor} size={18} />
        ) : typeof icon === 'string' ? (
          <Icon name={icon as IconName} size={18} color={resolvedIconColor} strokeWidth={1.7} />
        ) : (
          React.createElement(icon, { size: 18, color: resolvedIconColor, strokeWidth: 1.7 })
        )
      ) : null}
      <View style={styles.listRowText}>
        <Text variant="strong" color={palette.ink}>
          {title}
        </Text>
        {description ? (
          <Text variant="meta" color={palette.faint} style={styles.listRowDescription}>
            {description}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="meta" weight="medium" color={palette.chipInk}>
          {value}
        </Text>
      ) : null}
      {right}
      {showChevron && !right ? <Icon name="chevron-right" size={16} color={palette.iconFaint} /> : null}
    </Row>
  );

  if (!onPress) return <View style={style}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      onPress={onPress}
      android_ripple={{ color: 'rgba(38, 59, 41, 0.05)' }}
      testID={testID}
      style={({ pressed }) => [style, pressed && styles.pressedDim]}
    >
      {content}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Footnote                                                           */
/* ------------------------------------------------------------------ */

/** Small closing note ("Demo farm · Sample data"). */
export function Footnote({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  const palette = useAccentPalette();
  return (
    <Text variant="meta" color={palette.faint} style={style}>
      {children}
    </Text>
  );
}

/* ------------------------------------------------------------------ */
/* IconButton                                                          */
/* ------------------------------------------------------------------ */

export type IconButtonProps = {
  name: IconName | LucideIcon;
  onPress?: () => void;
  label: string;
  size?: number;
  box?: number;
  radius?: number;
  background?: string;
  color?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Square icon action (community "new report" is 42×42, 14 radius, D5E7BD). */
export function IconButton({
  name,
  onPress,
  label,
  size = 20,
  box = 42,
  radius = 14,
  background,
  color,
  disabled = false,
  style,
}: IconButtonProps) {
  const palette = useAccentPalette();
  const surface = background ?? palette.active;
  const glyphColor = color ?? palette.icon;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      android_ripple={{ color: 'rgba(38, 59, 41, 0.12)', borderless: false }}
      style={({ pressed }) => [
        {
          width: box,
          height: box,
          borderRadius: radius,
          backgroundColor: surface,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {typeof name === 'string'
        ? <Icon name={name as IconName} size={size} color={glyphColor} strokeWidth={1.7} />
        : React.createElement(name, { size, color: glyphColor, strokeWidth: 1.7 })}
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* LinkText                                                            */
/* ------------------------------------------------------------------ */

/** Inline text action ("Edit costs ›", "Change mobile number"). */
export function LinkText({
  children,
  onPress,
  color,
  variant = 'caption',
  weight = 'medium',
  chevron = false,
  style,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  color?: string;
  variant?: 'caption' | 'meta' | 'body' | 'strong';
  weight?: 'regular' | 'medium' | 'semiBold';
  chevron?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const styles = useStyles(makeStyles);
  const palette = useAccentPalette();
  const ink = color ?? palette.chipInk;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (typeof children === 'string' ? children : undefined)}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.linkText, style, pressed && styles.pressedDim]}
    >
      <Text variant={variant} weight={weight} color={ink}>
        {children}
      </Text>
      {chevron ? <Icon name="chevron-right" size={13} color={ink} /> : null}
    </Pressable>
  );
}

export { SectionLabel };

const makeStyles = (p: AccentPalette) => StyleSheet.create({
  divider: { height: 0, width: '100%' },
  notice: {
    borderRadius: radii.xl,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 6,
  },
  noticeBody: {
    lineHeight: 17,
  },
  flexText: { flex: 1 },
  inlineRow: { paddingVertical: 2 },
  stack: { gap: 4 },
  demoBadge: {
    borderRadius: radii.pill,
    backgroundColor: p.chip,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  toggle: {
    width: 36,
    height: 22,
    borderRadius: 11,
    padding: 3,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  listRow: {
    minHeight: touchTarget,
    paddingVertical: 12,
  },
  listRowText: { flex: 1, gap: 4 },
  listRowDescription: { lineHeight: 16 },
  pressedDim: { opacity: 0.85 },
  linkText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 2,
  },
});

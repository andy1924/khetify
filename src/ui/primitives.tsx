import React from 'react';
import {
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
  color = colors.divider,
}: {
  style?: StyleProp<ViewStyle>;
  inset?: number;
  color?: string;
}) {
  return <View style={[styles.divider, { marginHorizontal: inset, backgroundColor: color }, style]} />;
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

const noticePalettes: Record<NoticeTone, { bg: string; ink: string; title: string }> = {
  warning: { bg: colors.warningBg, ink: colors.warningBody, title: colors.warningInk },
  info: { bg: colors.infoBg, ink: colors.infoInk, title: colors.infoInk },
  neutral: { bg: colors.surfaceSoft, ink: colors.muted, title: colors.ink },
  danger: { bg: colors.dangerBg, ink: colors.danger, title: colors.danger },
  success: { bg: colors.successBg, ink: colors.successInk, title: colors.successInk },
};

/**
 * Quiet advisory panel used for estimate-incomplete, limitations and stale
 * data states. The design pairs a short title with one explanatory line.
 */
export function Notice({ title, children, tone = 'neutral', icon, style, plain = false }: NoticeProps) {
  const palette = noticePalettes[tone];
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
      {children ? (
        typeof children === 'string' ? (
          <Text variant="meta" color={palette.ink} style={styles.noticeBody}>
            {children}
          </Text>
        ) : (
          children
        )
      ) : null}
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
  const content =
    layout === 'inline' ? (
      <Row justify="space-between" gap={12} style={styles.inlineRow}>
        <Text variant="caption" color={colors.muted} style={styles.flexText}>
          {label}
        </Text>
        <Text variant="caption" weight="medium" color={strong ? colors.ink : colors.chipInk}>
          {value}
        </Text>
      </Row>
    ) : (
      <View style={styles.stack}>
        <Text variant="caption" color={colors.muted}>
          {label}
        </Text>
        <Text variant="caption" weight={strong ? 'semiBold' : 'medium'} color={strong ? colors.ink : colors.chipInk}>
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
  background = colors.surfaceAlt,
  color = colors.icon,
  children,
  style,
}: IconSurfaceProps) {
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
  background = '#ECF2E5',
  color = colors.chipInk,
  style,
}: {
  initials: string;
  size?: number;
  background?: string;
  color?: string;
  style?: StyleProp<ViewStyle>;
}) {
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
  fill = colors.trackFill,
  track = colors.track,
}: {
  /** 0–1 */
  progress: number;
  style?: StyleProp<ViewStyle>;
  height?: number;
  fill?: string;
  track?: string;
}) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View
      style={[{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }, style]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <View style={{ width: `${clamped * 100}%`, height, borderRadius: height, backgroundColor: fill }} />
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
  return (
    <Row gap={gap} style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={{
            flex: 1,
            height,
            borderRadius: height,
            backgroundColor: index <= current ? colors.trackFill : colors.track,
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
        { backgroundColor: value ? colors.toggleOn : colors.toggleOff, opacity: disabled ? 0.5 : 1 },
        style,
      ]}
    >
      <View style={[styles.toggleThumb, value ? styles.toggleThumbOn : styles.toggleThumbOff]} />
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
  iconColor = colors.iconQuiet,
  iconBackground,
  value,
  right,
  onPress,
  chevron,
  style,
  accessibilityLabel,
  testID,
}: ListRowProps) {
  const showChevron = chevron ?? Boolean(onPress);
  const content = (
    <Row gap={12} style={styles.listRow} align="center">
      {icon ? (
        iconBackground ? (
          <IconSurface name={icon} box={36} radius={12} background={iconBackground} color={iconColor} size={18} />
        ) : typeof icon === 'string' ? (
          <Icon name={icon as IconName} size={18} color={iconColor} strokeWidth={1.7} />
        ) : (
          React.createElement(icon, { size: 18, color: iconColor, strokeWidth: 1.7 })
        )
      ) : null}
      <View style={styles.listRowText}>
        <Text variant="strong" color={colors.ink}>
          {title}
        </Text>
        {description ? (
          <Text variant="meta" color={colors.subtle} style={styles.listRowDescription}>
            {description}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="meta" weight="medium" color={colors.chipInk}>
          {value}
        </Text>
      ) : null}
      {right}
      {showChevron && !right ? <Icon name="chevron-right" size={16} color={colors.iconFaint} /> : null}
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
  return (
    <Text variant="meta" color={colors.faint} style={style}>
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
  background = '#D5E7BD',
  color = colors.icon,
  disabled = false,
  style,
}: IconButtonProps) {
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
          backgroundColor: background,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {typeof name === 'string'
        ? <Icon name={name as IconName} size={size} color={color} strokeWidth={1.7} />
        : React.createElement(name, { size, color, strokeWidth: 1.7 })}
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
  color = colors.chipInk,
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (typeof children === 'string' ? children : undefined)}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.linkText, style, pressed && styles.pressedDim]}
    >
      <Text variant={variant} weight={weight} color={color}>
        {children}
      </Text>
      {chevron ? <Icon name="chevron-right" size={13} color={color} /> : null}
    </Pressable>
  );
}

export { SectionLabel };

const styles = StyleSheet.create({
  divider: { height: StyleSheet.hairlineWidth, width: '100%' },
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
  toggle: {
    width: 36,
    height: 22,
    borderRadius: 11,
    padding: 3,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  toggleThumbOff: { alignSelf: 'flex-start' },
  toggleThumbOn: { alignSelf: 'flex-end' },
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

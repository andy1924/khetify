import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, type StyleProp, type TextStyle } from 'react-native';
import { colors, textColors, typography, type TextVariant } from './tokens';

/** Reference variants. `primary`/`secondary`/`muted` are accepted colour shorthands. */
export type TextTone =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'faint'
  | 'accent'
  | 'inverse'
  | 'danger'
  | 'success'
  | 'warning'
  | 'ink'
  | 'brand';

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  color?: string;
  tone?: TextTone;
  weight?: 'regular' | 'medium' | 'semiBold' | 'bold';
  align?: TextStyle['textAlign'];
  style?: StyleProp<TextStyle>;
};

const toneColors: Record<TextTone, string> = {
  primary: colors.ink,
  secondary: colors.muted,
  muted: colors.muted,
  faint: colors.faint,
  accent: colors.accentDeep,
  inverse: colors.accentInk,
  danger: colors.danger,
  success: colors.successInk,
  warning: colors.warningInk,
  ink: colors.ink,
  brand: colors.chipInk,
};

const weights = {
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
} as const;

export function Text({ variant = 'body', color, tone, weight, align, style, ...rest }: TextProps) {
  const token = typography[variant];
  return (
    <RNText
      {...rest}
      style={[
        {
          fontFamily: token.fontFamily,
          fontWeight: weight ? weights[weight] : ['display', 'heading', 'title', 'subtitle', 'label'].includes(variant) ? '600' : variant === 'strong' ? '500' : '400',
          fontSize: token.fontSize,
          lineHeight: token.lineHeight,
          letterSpacing: token.letterSpacing,
          color: color ?? (tone ? toneColors[tone] : textColors[variant]),
          textAlign: align,
        },
        style,
      ]}
    />
  );
}

/** Small uppercase section label: 10/600, letter-spaced. */
export function SectionLabel({
  children,
  style,
  tone,
  color,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  tone?: TextTone;
  color?: string;
}) {
  return (
    <Text variant="label" tone={tone ?? 'muted'} color={color} style={style}>
      {typeof children === 'string' ? children.toUpperCase() : children}
    </Text>
  );
}

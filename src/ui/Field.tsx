import React from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { colors, fonts, radii } from './tokens';
import { Text } from './Text';

export type FieldProps = {
  label?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions | 'phone-pad' | 'number-pad' | 'decimal-pad';
  error?: string;
  suffix?: React.ReactNode;
  /** Trailing accessory, typically a chevron for a select-style field. */
  right?: React.ReactNode;
  multiline?: boolean;
  /** Renders a value-only field when no `onChangeText` is supplied and `editable` is false. */
  editable?: boolean;
  /** Larger value type for the leading phone-number field (22/500 in the reference). */
  large?: boolean;
  /** Optional helper line under the field. */
  hint?: string;
  /** Surface tone: soft (F6F8F3, reference) or transparent for grouped forms. */
  tone?: 'soft' | 'plain' | 'transparent';
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  autoFocus?: boolean;
  maxLength?: number;
  accessibilityLabel?: string;
  testID?: string;
  onSubmitEditing?: () => void;
  onBlur?: () => void;
  onFocus?: () => void;
};

/**
 * Label-over-value input surface: 12 radius, soft fill, 14/10 padding, 4 gap.
 * Label 12/400 muted, value 14/400 ink. Errors use the muted danger tone with
 * an explicit message so colour is never the only signal.
 */
export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  error,
  suffix,
  right,
  multiline = false,
  editable = true,
  large = false,
  hint,
  tone = 'soft',
  style,
  inputStyle,
  autoFocus,
  maxLength,
  accessibilityLabel,
  testID,
  onSubmitEditing,
  onBlur,
  onFocus,
}: FieldProps) {
  const canEdit = editable && Boolean(onChangeText);
  const background =
    tone === 'soft' ? colors.surfaceSoft : tone === 'plain' ? colors.surfacePlain : colors.transparent;

  return (
    <View style={style}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: background,
            borderColor: error ? colors.danger : colors.transparent,
            borderWidth: error ? 1 : 0,
          },
        ]}
      >
        <View style={styles.labels}>
          {label ? (
            <Text variant="caption" color={colors.muted} style={styles.label} numberOfLines={1}>
              {label}
            </Text>
          ) : null}
          {canEdit ? (
            <View style={styles.inputRow}>
              <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.muted}
                keyboardType={keyboardType as KeyboardTypeOptions}
                multiline={multiline}
                autoFocus={autoFocus}
                maxLength={maxLength}
                onBlur={onBlur}
                onFocus={onFocus}
                onSubmitEditing={onSubmitEditing}
                accessibilityLabel={accessibilityLabel ?? label ?? placeholder}
                testID={testID}
                selectionColor={colors.accentDeep}
                style={[
                  large ? styles.largeValue : styles.value,
                  multiline && styles.multiline,
                  inputStyle,
                ]}
              />
              {suffix ? <View style={styles.suffix}>{suffix}</View> : null}
            </View>
          ) : (
            <Text
              variant={large ? 'title' : 'body'}
              weight={large ? 'medium' : 'regular'}
              color={value ? colors.ink : colors.muted}
              style={large ? styles.largeValueText : styles.valueText}
              numberOfLines={multiline ? undefined : 1}
            >
              {value || placeholder || '—'}
            </Text>
          )}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      {error ? (
        <Text variant="meta" color={colors.danger} style={styles.message}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="meta" color={colors.faint} style={styles.message}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 54,
    borderRadius: radii.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  labels: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 13,
  },
  value: {
    padding: 0,
    margin: 0,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 17,
    color: colors.ink,
    includeFontPadding: false,
  },
  largeValue: {
    padding: 0,
    margin: 0,
    fontFamily: fonts.medium,
    fontSize: 22,
    lineHeight: 26,
    color: colors.ink,
    includeFontPadding: false,
  },
  valueText: {
    fontSize: 14,
    lineHeight: 17,
  },
  largeValueText: {
    fontSize: 22,
    lineHeight: 26,
  },
  multiline: {
    minHeight: 54,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  suffix: {
    paddingBottom: 1,
  },
  right: {
    paddingLeft: 8,
  },
  message: {
    marginTop: 6,
    paddingHorizontal: 2,
  },
});

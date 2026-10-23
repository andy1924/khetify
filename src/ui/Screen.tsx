import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, contentPadding, sectionGap } from './tokens';
import { useNavigationInset } from './NavigationInset';

export type ScreenProps = {
  children: React.ReactNode;
  /** Wrap content in a ScrollView (default true). Set false for centred/empty states. */
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  /**
   * Reserve the bottom safe-area inset. Defaults to false because the shared
   * floating tab bar (orchestrator-owned) already clears the gesture inset on
   * tab screens. Onboarding and modal routes pass `bottom`.
   */
  bottom?: boolean;
  /** Pinned footer rendered below the scroll area (actions, primary CTA). */
  footer?: React.ReactNode;
  /** Content gap between top-level sections. Defaults to 20. */
  gap?: number;
  /** Disable keyboard avoidance when the screen has no editable field. */
  keyboard?: boolean;
  backgroundColor?: string;
  testID?: string;
};

/**
 * Page container: background, top inset, 24pt gutters, optional scrolling and
 * keyboard avoidance. Never renders a fake status or gesture bar — the real
 * Android system chrome and the shared tab bar own those.
 */
export function Screen({
  children,
  scroll = true,
  contentStyle,
  style,
  bottom = false,
  footer,
  gap = sectionGap,
  keyboard = false,
  backgroundColor = colors.background,
  testID,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const navigationInset = useNavigationInset();
  const bottomInset = bottom ? Math.max(insets.bottom, 12) : 0;
  const contentBottomInset = footer ? bottomInset : Math.max(bottomInset, navigationInset);
  const topInset = 8;

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.content,
        { gap, paddingTop: topInset, paddingBottom: 24 + contentBottomInset },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentInsetAdjustmentBehavior="never"
    >
      {children}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.flex,
        styles.content,
        { gap, paddingTop: topInset, paddingBottom: 24 + contentBottomInset },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <View style={[{ flex: 1, backgroundColor, paddingTop: insets.top }, style]} testID={testID}>
      {keyboard ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {body}
          {footer ? (
            <View style={[styles.footer, { paddingBottom: Math.max(bottomInset, navigationInset, 16) }]}>{footer}</View>
          ) : null}
        </KeyboardAvoidingView>
      ) : (
        <>
          {body}
          {footer ? (
            <View style={[styles.footer, { paddingBottom: Math.max(bottomInset, navigationInset, 16) }]}>{footer}</View>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: contentPadding,
  },
  footer: {
    paddingHorizontal: contentPadding,
    paddingTop: 12,
    backgroundColor: colors.background,
  },
});

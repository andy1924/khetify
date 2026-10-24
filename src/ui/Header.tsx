import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { router } from 'expo-router';
import { Icon } from './Icon';
import { Text } from './Text';
import { touchTarget } from './tokens';
import { useAccentPalette } from './AccentTheme';

export type HeaderProps = {
  title: string;
  subtitle?: string;
  /** Render a back control. Defaults to a chevron-left plus the `backLabel`. */
  back?: boolean;
  onBack?: () => void;
  /** Text beside the back control (the reference uses the section name). */
  backLabel?: string;
  /** Right-hand accessory, e.g. an action button. */
  right?: React.ReactNode;
  /** Large 28pt title (default) or the compact 22pt in-flow variant. */
  size?: 'lg' | 'md';
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/**
 * Screen title block. Optional back row sits above the title, matching
 * stage-detail screens ("‹ Your season"); the shared tab bar remains visible.
 */
export function Header({
  title,
  back = false,
  onBack,
  backLabel,
  right,
  size = 'lg',
  style,
}: HeaderProps) {
  const palette = useAccentPalette();
  return (
    <View style={[styles.container, style]}>
      {back ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={backLabel ? `Back to ${backLabel}` : 'Go back'}
          onPress={onBack ?? (() => router.back())}
          hitSlop={8}
          style={styles.backRow}
        >
          <Icon name="chevron-left" size={18} color={palette.icon} strokeWidth={1.8} />
          {backLabel ? (
            <Text variant="caption" color={palette.muted} numberOfLines={1}>
              {backLabel}
            </Text>
          ) : null}
        </Pressable>
      ) : null}
      <View style={styles.titleRow}>
        <View style={styles.titleBlock}>
          {size === 'lg' ? (
            <Text variant="heading" color={palette.heading} accessibilityRole="header">
              {title}
            </Text>
          ) : (
            <Text variant="title" color={palette.heading} accessibilityRole="header">
              {title}
            </Text>
          )}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 20,
    alignSelf: 'flex-start',
    paddingRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  titleBlock: {
    flex: 1,
    gap: 6,
  },
  subtitle: {
    marginTop: 0,
  },
  right: {
    justifyContent: 'center',
    minHeight: touchTarget / 2,
  },
});

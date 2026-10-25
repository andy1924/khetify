import React from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { Text } from './Text';
import { colors, radii } from './tokens';
import { motion, useReduceMotion } from './motion';
import { useAccentPalette } from './AccentTheme';
import { useT } from '../locales';

export type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Optional supporting line under the title. */
  subtitle?: string;
  /** Fixed footer (buttons); scrolls with content when `scroll` is false. */
  footer?: React.ReactNode;
  /** A left-aligned back/extra control next to the title. */
  onBack?: () => void;
  /** Constrain height so long sheets scroll internally (default true). */
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

const AnimatedView = Animated.View;

/**
 * Bottom sheet surface: 24 radius, F9FBF5 fill, 18 padding, dimmed backdrop.
 * Rendered with the platform Modal so Android back dismisses it. Content
 * scrolls internally; the footer stays reachable above the gesture inset.
 *
 * Motion is a short native-driven slide (220ms in / 170ms out) with a backdrop
 * fade, instead of the platform's ~300ms slide. The Modal stays mounted for the
 * exit animation and the whole transition collapses to a fade when the system
 * reduced-motion setting is on.
 */
export function Sheet({
  visible,
  onClose,
  title,
  children,
  footer,
  onBack,
  scroll = true,
  style,
  accessibilityLabel,
}: SheetProps) {
  const insets = useSafeAreaInsets();
  const t = useT();
  const reduceMotion = useReduceMotion();
  const palette = useAccentPalette();

  // `mounted` keeps the sheet on screen while it animates out; `progress`
  // drives both the slide (0 = hidden, 1 = resting) and the backdrop opacity.
  const [mounted, setMounted] = React.useState(visible);
  const [progress] = React.useState(() => new Animated.Value(visible ? 1 : 0));

  // Mount during render (React's "adjust state when props change" pattern) so
  // opening never waits a frame before the slide starts.
  if (visible && !mounted) setMounted(true);

  React.useEffect(() => {
    // Every hidden Sheet mounts this effect; skip the no-op 0→0 timing so
    // opening the app does not schedule pointless native animations.
    if (!visible && !mounted) return;
    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: reduceMotion ? motion.press : visible ? motion.sheetIn : motion.sheetOut,
      easing: reduceMotion ? Easing.linear : visible ? motion.easing.out : motion.easing.in,
      useNativeDriver: true,
    });
    animation.start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
    // Stop the in-flight timing on unmount or when `visible` flips mid-slide,
    // so a reopened sheet never inherits a half-finished exit callback.
    return () => animation.stop();
  }, [visible, mounted, progress, reduceMotion]);

  if (!mounted) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <AnimatedView style={[styles.backdrop, { opacity: progress }]} pointerEvents="box-none">
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t('common.dismissSheet')}
          />
        </AnimatedView>
        <AnimatedView
          style={[
            styles.sheet,
            { backgroundColor: palette.sheet, paddingBottom: Math.max(insets.bottom, 18) },
            reduceMotion
              ? { opacity: progress }
              : {
                  transform: [
                    {
                      translateY: progress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [64, 0],
                      }),
                    },
                  ],
                },
            style,
          ]}
          accessibilityViewIsModal
          accessibilityLabel={accessibilityLabel ?? title}
        >
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            {onBack ? (
              <Pressable
                onPress={onBack}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={t('common.back')}
                style={styles.backButton}
              >
                <Icon name="chevron-left" size={18} color={palette.icon} />
              </Pressable>
            ) : null}
            <View style={styles.headerText}>
              <Text variant="title" color={palette.ink} accessibilityRole="header">
                {title}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              style={styles.closeButton}
            >
              <Icon name="x" size={18} color={palette.icon} />
            </Pressable>
          </View>
          {scroll ? (
            <ScrollView
              style={styles.bodyScroll}
              contentContainerStyle={styles.body}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
          ) : (
            <View style={styles.body}>{children}</View>
          )}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </AnimatedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.overlay,
  },
  sheet: {
    borderTopLeftRadius: radii.xxxl,
    borderTopRightRadius: radii.xxxl,
    paddingHorizontal: 18,
    paddingTop: 10,
    maxHeight: '88%',
    gap: 12,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -6,
    marginTop: 2,
  },
  bodyScroll: {
    flexGrow: 0,
  },
  body: {
    gap: 12,
    paddingBottom: 4,
  },
  footer: {
    gap: 10,
    paddingTop: 4,
  },
});

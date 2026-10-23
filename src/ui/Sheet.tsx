import React from 'react';
import {
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

/**
 * Bottom sheet surface: 24 radius, F9FBF5 fill, 18 padding, dimmed backdrop.
 * Rendered with the platform Modal so Android back dismisses it. Content
 * scrolls internally; the footer stays reachable above the gesture inset.
 */
export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  footer,
  onBack,
  scroll = true,
  style,
  accessibilityLabel,
}: SheetProps) {
  const insets = useSafeAreaInsets();
  const t = useT();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={t('common.dismissSheet')}
        />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 18) },
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
                <Icon name="chevron-left" size={18} color={colors.icon} />
              </Pressable>
            ) : null}
            <View style={styles.headerText}>
              <Text variant="title" color={colors.ink} accessibilityRole="header">
                {title}
              </Text>
              {subtitle ? (
                <Text variant="caption" color={colors.mutedSoft}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              style={styles.closeButton}
            >
              <Icon name="x" size={18} color={colors.icon} />
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
        </View>
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
    backgroundColor: colors.sheet,
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
    backgroundColor: colors.border,
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

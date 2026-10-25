import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Button, Icon, Text, colors, radii, type IconName, type LucideIcon } from '../../ui';
import { useAccentPalette } from '../../ui/AccentTheme';

export type ConsentPermission = {
  icon: IconName;
  /** Lucide component for glyphs outside the shared `iconMap`. */
  component?: LucideIcon;
  label: string;
  detail?: string;
};

export type ConsentDialogProps = {
  visible: boolean;
  title: string;
  body: string;
  permissions?: readonly ConsentPermission[];
  /** Small print under the permission list. */
  note?: string;
  cancelLabel?: string;
  continueLabel?: string;
  /** Android back and a scrim tap both route here. */
  onCancel: () => void;
  onContinue: () => void;
  testID?: string;
};

/**
 * A centred Android-style consent dialog — deliberately not the app's bottom
 * `Sheet`, because this is Google's surface asking for permission, not
 * Khetify's own. White card, 28 radius, permission rows, two text-weight
 * actions. The platform Modal handles Android back via `onRequestClose`.
 */
export function ConsentDialog({
  visible,
  title,
  body,
  permissions,
  note,
  cancelLabel = 'Cancel',
  continueLabel = 'Continue',
  onCancel,
  onContinue,
  testID,
}: ConsentDialogProps) {
  const palette = useAccentPalette();
  const rows = permissions ?? [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.root} testID={testID}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
        />
        <View
          style={styles.card}
          accessibilityViewIsModal
          accessibilityLabel={title}
        >
          <View style={[styles.badge, { backgroundColor: palette.surface }]}>
            <Icon name="sprout" size={24} color={palette.deep} strokeWidth={1.7} />
          </View>

          <View style={styles.copy}>
            <Text variant="title" color={palette.heading} accessibilityRole="header" style={styles.title}>
              {title}
            </Text>
            <Text variant="caption" color={palette.muted}>
              {body}
            </Text>
          </View>

          {rows.length > 0 ? (
            <View style={[styles.list, { borderColor: palette.borderSoft }]}>
              {rows.map((permission, index) => (
                <View
                  key={permission.label}
                  style={[
                    styles.row,
                    index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: palette.borderSoft },
                  ]}
                >
                  <View style={[styles.rowIcon, { backgroundColor: palette.surfaceSoft }]}>
                    <Icon
                      name={permission.icon}
                      component={permission.component}
                      size={17}
                      color={palette.icon}
                      strokeWidth={1.7}
                    />
                  </View>
                  <View style={styles.rowText}>
                    <Text variant="subtitle" weight="medium" color={palette.ink}>
                      {permission.label}
                    </Text>
                    {permission.detail ? (
                      <Text variant="meta" color={palette.faint}>
                        {permission.detail}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {note ? (
            <Text variant="meta" color={palette.faint}>
              {note}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Button
              title={cancelLabel}
              variant="ghost"
              fullWidth={false}
              trailingArrow={false}
              onPress={onCancel}
              style={styles.action}
            />
            <Button
              title={continueLabel}
              fullWidth={false}
              trailingArrow={false}
              onPress={onContinue}
              style={styles.action}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.overlay,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    gap: 16,
    padding: 24,
    borderRadius: radii.sheet,
    backgroundColor: colors.white,
    shadowColor: '#0B1F12',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 12,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { gap: 6 },
  title: { fontSize: 20, lineHeight: 27 },
  list: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 1 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 2,
  },
  action: { flexGrow: 1, flexBasis: 0, paddingHorizontal: 16 },
});

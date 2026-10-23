import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, Icon, radii, Sheet, Text } from '../../ui';
import { localeOptions, languageLabel, useT } from '../../locales';
import { useDemo } from '../../demo';
import type { Locale } from '../../demo';

/** Brand + global language selector, shared by all three onboarding steps. */
export function OnboardingHeader({ showSelector = true }: { showSelector?: boolean }) {
  const t = useT();
  const { state } = useDemo();
  const [open, setOpen] = React.useState(false);

  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <Text variant="heading" weight="semiBold" color={colors.ink} style={styles.wordmark}>
          {t('common.brand.name')}
        </Text>
      </View>
      {showSelector ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('language.selector.a11y')}
          onPress={() => setOpen(true)}
          hitSlop={2}
          style={styles.selector}
        >
          <Icon name="languages" size={17} color={colors.ink} />
          <Text variant="caption" weight="medium" color={colors.ink} numberOfLines={1}>
            {languageLabel(state.locale)}
          </Text>
          <Icon name="chevron-down" size={14} color={colors.ink} />
        </Pressable>
      ) : null}
      <LanguageSheet visible={open} onClose={() => setOpen(false)} />
    </View>
  );
}

function LanguageSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { state, actions } = useDemo();
  const t = useT();
  return (
    <Sheet visible={visible} onClose={onClose} title={t('profile.languageSheet')}>
      <View style={styles.sheetList}>
        {localeOptions.map(option => {
          const selected = state.locale === option.code;
          return (
            <Pressable
              key={option.code}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={t(option.nativeKey)}
              onPress={() => {
                actions.setLocale(option.code);
                onClose();
              }}
              style={[styles.sheetRow, selected && styles.optionSelected]}
            >
              <Text variant="subtitle" weight={selected ? 'semiBold' : 'regular'} color={colors.ink}>
                {t(option.nativeKey)}
              </Text>
              {option.englishKey ? (
                <Text variant="caption" color={colors.muted}>
                  {t(option.englishKey)}
                </Text>
              ) : null}
              <View style={styles.flex} />
              <SelectionDot selected={selected} />
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

export function SelectionDot({ selected }: { selected: boolean }) {
  return (
    <View style={[styles.dot, selected ? styles.dotSelected : styles.dotIdle]}>
      {selected ? <Icon name="check" size={14} color={colors.ink} strokeWidth={2} /> : null}
    </View>
  );
}

export function StepHeading({
  step,
  title,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.headingBlock}>
      <Text variant="meta" weight="semiBold" color={colors.muted} style={styles.step}>
        {step}
      </Text>
      <Text variant="display" weight="semiBold" color={colors.ink} style={styles.title}>
        {title}
      </Text>
    </View>
  );
}

/** Shared footer: primary pill plus the small note beneath it. */
export function OnboardingFooter({ children }: { children: React.ReactNode }) {
  return <View style={styles.footer}>{children}</View>;
}

export function FooterNote({
  children,
  onPress,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  if (!onPress) {
    return (
      <Text variant="meta" color={colors.muted} style={styles.footerNote}>
        {children}
      </Text>
    );
  }
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={accessibilityLabel} onPress={onPress} hitSlop={8}>
      <Text variant="meta" color={colors.muted} style={styles.footerNote}>
        {children}
      </Text>
    </Pressable>
  );
}

export function useOnboardingNav() {
  const router = useRouter();
  return React.useMemo(
    () => ({
      toMobile: () => router.push('/mobile'),
      toOtp: () => router.push('/otp'),
      toLanguage: () => router.push('/language'),
      toHome: () => router.replace('/(tabs)/home'),
      back: () => router.back(),
    }),
    [router],
  );
}

export type { Locale };

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  wordmark: { fontSize: 22, lineHeight: 31 },
  selector: {
    minHeight: 44,
    maxWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#EFF4E8',
  },
  sheetList: { gap: 6 },
  sheetRow: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: radii.md,
    backgroundColor: colors.surfacePlain,
  },
  optionSelected: { backgroundColor: '#EFF4E8' },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotSelected: { backgroundColor: '#C4DEA9' },
  dotIdle: { backgroundColor: '#FEFFFC', borderWidth: 1, borderColor: colors.border },
  headingBlock: { gap: 4 },
  step: { letterSpacing: 0.4 },
  title: { marginTop: 6 },
  description: { marginTop: 8 },
  footer: { gap: 12, paddingTop: 16 },
  footerNote: { textAlign: 'center' },
});

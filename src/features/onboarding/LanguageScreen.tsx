import React from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, colors, Screen, Text } from '../../ui';
import { languageLabel, localeOptions, useT } from '../../locales';
import { useDemo } from '../../demo';
import {
  FooterNote,
  OnboardingFooter,
  OnboardingHeader,
  SelectionDot,
  StepHeading,
} from './components';

/**
 * A / Choose a language — edsu0.
 * Selection is local (kept in the in-memory store); copy stays English until a
 * reviewed translation exists, so only the chosen language and its native name change.
 */
export function LanguageScreen() {
  const t = useT();
  const { state, actions } = useDemo();


  return (
    <Screen
      gap={0}
      contentStyle={{ paddingTop: 0 }}
      keyboard={false}
      bottom
      footer={
        <OnboardingFooter>
          <Button
            title={t('language.continue', { language: languageLabel(state.locale) })}
            onPress={() => router.push('/details')}
            accessibilityLabel={t('language.continue', { language: languageLabel(state.locale) })}
          />
          <FooterNote>{t('language.footer')}</FooterNote>
        </OnboardingFooter>
      }
    >
      <OnboardingHeader />
      <View style={styles.content}>
        <StepHeading step={'Step 1 of 3'} title={t('language.title')} description={t('language.description')} />
        <View style={styles.options} accessibilityRole="radiogroup">
          {localeOptions.map(option => {
            const selected = state.locale === option.code;
            return (
              <Pressable
                key={option.code}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={
                  option.englishKey ? `${t(option.nativeKey)}, ${t(option.englishKey)}` : t(option.nativeKey)
                }
                onPress={() => actions.setLocale(option.code)}
                style={[styles.option, selected && styles.optionSelected]}
              >
                <View style={styles.optionLabels}>
                  <Text variant="subtitle" weight={selected ? 'semiBold' : 'regular'} color={colors.ink}>
                    {t(option.nativeKey)}
                  </Text>
                  {option.englishKey ? (
                    <Text variant="caption" color={colors.muted}>
                      {t(option.englishKey)}
                    </Text>
                  ) : null}
                </View>
                <SelectionDot selected={selected} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 22, paddingTop: 24 },
  options: { gap: 6 },
  option: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#FEFFFC',
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  optionSelected: { backgroundColor: '#EFF4E8', borderColor: '#EFF4E8' },
  optionLabels: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
});

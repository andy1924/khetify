import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, colors, Field, Icon, Screen, Sheet, Text } from '../../ui';
import { useT } from '../../locales';
import { useDemo, formatIndianMobile } from '../../demo';
import {
  FooterNote,
  OnboardingFooter,
  OnboardingHeader,
  StepHeading,
  useOnboardingNav,
} from './components';

const INDIAN_MOBILE = /^[6-9]\d{9}$/;

/**
 * B / Mobile number — p8xMa.
 * The only sign-in field. Sending a code is simulated: no SMS, permission or
 * network call; it stores the number locally and moves to the OTP step.
 */
export function MobileScreen() {
  const t = useT();
  const { state, actions } = useDemo();
  const nav = useOnboardingNav();
  const [termsOpen, setTermsOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [focused, setFocused] = React.useState(false);

  const digits = state.onboarding.mobile;

  const onChange = (text: string) => {
    const nextDigits = text.replace(/\D/g, '').slice(0, 10);
    setError(nextDigits && !INDIAN_MOBILE.test(nextDigits) ? t(nextDigits.length < 10 ? 'mobile.error.short' : 'mobile.error.invalid') : null);
    actions.setMobile(text);
  };

  const onSend = () => {
    if (!digits) {
      setError(t('mobile.error.empty'));
      return;
    }
    if (digits.length < 10) {
      setError(t('mobile.error.short'));
      return;
    }
    if (!INDIAN_MOBILE.test(digits)) {
      setError(t('mobile.error.invalid'));
      return;
    }
    setError(null);
    actions.otpSending();
    nav.toOtp();
  };

  return (
    <Screen
      gap={0}
      contentStyle={{ paddingTop: 0 }}
      keyboard
      bottom
      footer={
        <OnboardingFooter>
          <Button title={t('mobile.send')} onPress={onSend} disabled={!INDIAN_MOBILE.test(digits)} testID="onboarding-send-code" />
          <FooterNote onPress={() => setTermsOpen(true)} accessibilityLabel={t('mobile.terms.title')}>
            {t('mobile.footer')}
          </FooterNote>
        </OnboardingFooter>
      }
    >
      <OnboardingHeader />
      <View style={styles.content}>
        <StepHeading step={t('mobile.step')} title={t('mobile.title')} description={t('mobile.description')} />

        <Field
          label={t('mobile.field.label')}
          value={focused ? digits : formatIndianMobile(digits)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChangeText={onChange}
          placeholder={t('mobile.placeholder')}
          keyboardType="phone-pad"
          large
          maxLength={focused ? 10 : 11}
          error={error ?? undefined}
          accessibilityLabel={t('mobile.a11y.field')}
          testID="onboarding-mobile-field"
          onSubmitEditing={onSend}
        />

        <View style={styles.info}>
          <Icon name="message-square" size={22} color={colors.muted} strokeWidth={1.6} />
          <View style={styles.infoCopy}>
            <Text variant="strong" weight="semiBold" color={colors.ink}>
              {t('mobile.info.title')}
            </Text>
            <Text variant="caption" color={colors.muted}>
              {t('mobile.info.detail')}
            </Text>
          </View>
        </View>
      </View>

      <Sheet visible={termsOpen} onClose={() => setTermsOpen(false)} title={t('mobile.terms.title')}>
        <View style={styles.sheetBody}>
          <Text variant="body" color={colors.muted}>
            {t('mobile.terms.body')}
          </Text>
          <Button title={t('mobile.terms.ack')} onPress={() => setTermsOpen(false)} testID="terms-ack" />
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 22, paddingTop: 24 },
  info: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  infoCopy: { flex: 1, gap: 4 },
  sheetBody: { gap: 20, paddingTop: 4 },
});

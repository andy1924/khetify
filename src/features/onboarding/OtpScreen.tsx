import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Button,
  colors,
  Field,
  Icon,
  radii,
  Screen,
  Sheet,
  Text,
} from '../../ui';
import { useT } from '../../locales';
import { DEMO_OTP_CODE, formatCountdown, maskedMobile, OTP_RESEND_SECONDS, useDemo } from '../../demo';
import { FooterNote, OnboardingFooter, OnboardingHeader, StepHeading } from './components';

const SEND_DELAY_MS = 900;
const VERIFY_DELAY_MS = 2400;
const SIGN_IN_DELAY_MS = 1200;

/**
 * C / Automatic OTP login — q4xq4n.
 *
 * Entirely local and deterministic: no SMS, no permissions, no network. The
 * demo code is `526448`. Whether the first automatic attempt succeeds is
 * derived from the entered number (last digit even → succeeds), so the
 * failure/retry path is reproducible rather than random.
 */
export function OtpScreen() {
  const t = useT();
  const { state, actions } = useDemo();
  const router = useRouter();

  const { otpStatus, mobile } = state.onboarding;
  const [remaining, setRemaining] = React.useState(OTP_RESEND_SECONDS);
  const [autoAttempt, setAutoAttempt] = React.useState(0);
  const [manualOpen, setManualOpen] = React.useState(false);
  const [manualCode, setManualCode] = React.useState('');
  const [manualError, setManualError] = React.useState<string | null>(null);
  const [flowKey, setFlowKey] = React.useState(0);

  // Deterministic: a number ending in an odd digit fails the first automatic
  // attempt. Every retry succeeds, so failure/retry is reproducible, not random.
  const lastDigitOdd = Number(mobile.slice(-1)) % 2 === 1;
  const shouldFail = lastDigitOdd && autoAttempt === 0;

  // Simulated send → verify → result.
  React.useEffect(() => {
    if (otpStatus !== 'sending') return;
    const verifyTimer = setTimeout(() => actions.otpVerifying(), SEND_DELAY_MS);
    return () => clearTimeout(verifyTimer);
  }, [otpStatus, actions, flowKey]);

  React.useEffect(() => {
    if (otpStatus !== 'verifying') return;
    const resultTimer = setTimeout(() => {
      if (shouldFail) actions.otpFailed();
      else actions.otpSuccess();
    }, VERIFY_DELAY_MS);
    return () => clearTimeout(resultTimer);
  }, [otpStatus, actions, shouldFail, flowKey]);

  // Success → continue to Home.
  React.useEffect(() => {
    if (otpStatus !== 'success') return;
    const done = setTimeout(() => {
      actions.completeOnboarding();
      router.replace('/(tabs)/home');
    }, SIGN_IN_DELAY_MS);
    return () => clearTimeout(done);
  }, [otpStatus, actions, router]);

  // Kick off the simulated request when arriving from the number screen.
  React.useEffect(() => {
    if (otpStatus === 'idle') actions.otpSending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resend countdown: a single timeout per remaining second, cleaned on unmount.
  React.useEffect(() => {
    if (remaining <= 0) return;
    const timer = setTimeout(() => setRemaining(current => Math.max(0, current - 1)), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  const resend = () => {
    if (remaining > 0 || otpStatus === 'verifying' || otpStatus === 'sending') return;
    setRemaining(OTP_RESEND_SECONDS);
    actions.otpReset();
    setFlowKey(key => key + 1);
    actions.otpSending();
  };

  const retry = () => {
    setAutoAttempt(attempt => attempt + 1);
    setRemaining(OTP_RESEND_SECONDS);
    actions.otpReset();
    actions.otpSending();
    setFlowKey(key => key + 1);
  };

  const submitManual = () => {
    if (manualCode.replace(/\D/g, '') === DEMO_OTP_CODE) {
      setManualOpen(false);
      setManualError(null);
      actions.otpSuccess();
      return;
    }
    setManualError(t('otp.manual.error'));
  };

  const changeNumber = () => {
    actions.otpReset();
    router.back();
  };

  const verifying = otpStatus === 'sending' || otpStatus === 'verifying';
  const failed = otpStatus === 'error';
  const succeeded = otpStatus === 'success';

  return (
    <Screen
      gap={0}
      contentStyle={{ paddingTop: 0 }}
      keyboard={false}
      bottom
      footer={
        <OnboardingFooter>
          {!failed && <Button
            title={t('otp.signingIn')}
            variant="secondary"
            disabled
            trailingArrow={false}
            accessibilityLabel={t('otp.signingIn')}
          />}
          <FooterNote>{t('otp.footer')}</FooterNote>
        </OnboardingFooter>
      }
    >
      <OnboardingHeader />
      <View style={styles.content}>
        <StepHeading
          step={t('otp.step')}
          title={t('otp.title')}
          description={t('otp.sentTo', { mobile: maskedMobile(mobile) })}
        />

        <View style={styles.status} accessibilityLiveRegion="polite">
          <Icon
            name="message-square"
            size={32}
            color={failed ? colors.warningInk : colors.ink}
            strokeWidth={1.5}
          />
          <Text variant="subtitle" weight="semiBold" color={colors.ink} style={styles.statusHeading}>
            {failed ? t('otp.retryTitle') : t('otp.received')}
          </Text>

          {failed ? (
            <Text variant="caption" color={colors.warningBody}>
              {t('otp.retryBody')}
            </Text>
          ) : (
            <>
              <View style={styles.digits} accessibilityLabel={t('otp.received')}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <View key={index} style={styles.digit}>
                    <Text
                      variant="title"
                      weight="regular"
                      color={colors.ink}
                      accessibilityLabel={t('otp.digit.a11y', { index: index + 1 })}
                    >
                      •
                    </Text>
                  </View>
                ))}
              </View>
              <Text variant="body" weight="medium" color={colors.ink}>
                {succeeded ? t('otp.verified') : t('otp.verifying')}
              </Text>
            </>
          )}
        </View>

        {failed ? (
          <View style={styles.actions}>
            <Button title={t('otp.retry')} onPress={retry} testID="otp-retry" />
            <Button
              title={t('otp.manual')}
              variant="secondary"
              onPress={() => {
                setManualCode('');
                setManualError(null);
                setManualOpen(true);
              }}
              testID="otp-manual"
            />
          </View>
        ) : (
          <View style={styles.links}>
            {remaining > 0 ? (
              <Text variant="caption" color={colors.muted}>
                {t('otp.resendIn', { time: formatCountdown(remaining) })}
              </Text>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={resend}
                disabled={verifying}
                hitSlop={8}
                accessibilityState={{ disabled: verifying }}
              >
                <Text variant="caption" weight="medium" color={verifying ? colors.disabled : colors.ink}>
                  {t('otp.resend')}
                </Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={changeNumber}
              hitSlop={8}
              style={styles.linkRow}
            >
              <Text variant="caption" weight="medium" color={colors.ink}>
                {t('otp.changeNumber')}
              </Text>
            </Pressable>
          </View>
        )}
      </View>


      <Sheet
        visible={manualOpen}
        onClose={() => setManualOpen(false)}
        title={t('otp.manual.title')}
      >
        <View style={styles.sheetBody}>
          <Field
            value={manualCode}
            onChangeText={text => {
              setManualError(null);
              setManualCode(text.replace(/\D/g, '').slice(0, 6));
            }}
            placeholder={t('otp.manual.placeholder')}
            keyboardType="number-pad"
            maxLength={6}
            large
            error={manualError ?? undefined}
            hint={t('otp.manual.hint', { code: DEMO_OTP_CODE })}
            accessibilityLabel={t('otp.manual.title')}
            testID="otp-manual-input"
          />
          <Button title={t('otp.manual.submit')} onPress={submitManual} testID="otp-manual-submit" />
          <Button title={t('otp.cancel')} variant="ghost" onPress={() => setManualOpen(false)} />
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: 22, paddingTop: 24 },
  status: {
    gap: 20,
    padding: 22,
    borderRadius: 20,
    backgroundColor: '#EEEDE6',
  },
  statusHeading: { fontSize: 18, lineHeight: 25 },
  digits: { flexDirection: 'row', gap: 10 },
  digit: {
    flex: 1,
    height: 48,
    borderRadius: radii.sm,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { gap: 10 },
  links: { gap: 16 },
  linkRow: { alignSelf: 'flex-start' },
  sheetBody: { gap: 16, paddingTop: 4 },
});

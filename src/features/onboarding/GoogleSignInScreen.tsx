import React from 'react';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Mail, MapPin, UserRound } from 'lucide-react-native';
import { Button, Icon, Screen, Text, radii } from '../../ui';
import { useAccentPalette, useStyles, type AccentPalette } from '../../ui/AccentTheme';
import { useT } from '../../locales';
import { useDemoDispatch } from '../../demo';
import { ConsentDialog } from './ConsentDialog';
import { GoogleMark } from './GoogleMark';

type Step = 'idle' | 'identity' | 'location';

/**
 * The single sign-in surface for the demo: brand, one line, one action.
 *
 * Tapping "Continue with Google" walks two Android-style consent dialogs and
 * then signs the demo user straight in. Nothing is fetched, no permission is
 * requested from the OS, and cancelling either dialog is a valid outcome:
 * Cancel on the identity dialog returns here, Cancel on the location dialog
 * still enters the app (just without a saved device location).
 */
export function GoogleSignInScreen() {
  const styles = useStyles(makeStyles);
  const palette = useAccentPalette();
  const t = useT();
  const dispatch = useDemoDispatch();
  const [step, setStep] = React.useState<Step>('idle');

  const enterApp = (locationGranted: boolean) => {
    setStep('idle');
    // One atomic dispatch: the app never renders a half-filled farm. The
    // `onboarding/googleSignIn` reducer branch sets the demo profile, the
    // location consent, and the signed-in flags in a single state update.
    dispatch({ type: 'onboarding/googleSignIn', location: locationGranted });
    router.replace('/(tabs)/home');
  };

  return (
    <Screen scroll={false} gap={0} bottom contentStyle={styles.content}>
      <View style={styles.brand} accessibilityRole="header">
        <View style={[styles.mark, { backgroundColor: palette.surface }]}>
          <Icon name="sprout" size={30} color={palette.deep} strokeWidth={1.6} />
        </View>
        <Text variant="display" weight="semiBold" color={palette.ink} style={styles.wordmark}>
          {t('common.brand.name')}
        </Text>
        <Text variant="body" color={palette.muted} align="center" style={styles.tagline}>
          Your field, season and market — in one calm place.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button
          variant="primary"
          size="lg"
          onPress={() => setStep('identity')}
          accessibilityLabel="Continue with Google"
          testID="google-sign-in"
        >
          <GoogleMark size={19} />
          <Text variant="strong" weight="semiBold" color={palette.ink}>
            Continue with Google
          </Text>
        </Button>
      </View>

      <ConsentDialog
        visible={step === 'identity'}
        title="Khetify wants to access your information"
        body="Khetify will be able to see the name, email address and profile picture on your Google Account."
        permissions={[
          { icon: 'user-round', component: UserRound, label: 'Name', detail: 'Asha Patil' },
          { icon: 'mail', component: Mail, label: 'Email address', detail: 'asha.patil@gmail.com' },
          { icon: 'image', label: 'Profile picture' },
        ]}
        note="You can revoke access at any time in your Google Account settings."
        onCancel={() => setStep('idle')}
        onContinue={() => setStep('location')}
        testID="google-identity-dialog"
      />

      <ConsentDialog
        visible={step === 'location'}
        title="Allow Khetify to access your location?"
        body="Your location centres the map on your field and shows nearby crop reports. Khetify reads it only while the app is open."
        permissions={[
          { icon: 'map-pin', component: MapPin, label: 'Approximate location', detail: 'Nashik, Maharashtra' },
          { icon: 'map', label: 'While using the app', detail: 'No background tracking' },
        ]}
        note="You can continue without location and find your field manually later."
        onCancel={() => enterApp(false)}
        onContinue={() => enterApp(true)}
        testID="google-location-dialog"
      />
    </Screen>
  );
}

const makeStyles = (p: AccentPalette) =>
  StyleSheet.create({
    content: {
      paddingTop: 8,
      paddingBottom: 24,
      justifyContent: 'space-between',
    },
    // Optical centre: the brand block sits slightly above true centre, which
    // reads as centred once the action block anchors the bottom.
    brand: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      paddingBottom: 24,
    },
    mark: {
      width: 68,
      height: 68,
      borderRadius: radii.xxl,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    wordmark: { fontSize: 38, lineHeight: 44, letterSpacing: -0.8 },
    tagline: { maxWidth: 264 },
    actions: { gap: 12 },
  });

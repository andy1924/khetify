import React, { useRef, useState } from 'react';
import { Linking, Platform } from 'react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useDemo } from '../../demo';
import { Button, Header, Notice, Screen, Text } from '../../ui';
import { OnboardingHeader } from './components';

export function LocationScreen() {
  const { dispatch, actions } = useDemo();
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [blocked, setBlocked] = useState(false);
  const inFlight = useRef(false);
  const finish = () => { actions.completeOnboarding(); router.replace('/(tabs)/home'); };
  const locate = async () => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(''); setBlocked(false);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setBlocked(!permission.canAskAgain);
        setError('Location access was not granted. You can continue and find your field manually.'); return;
      }
      if (!await Location.hasServicesEnabledAsync()) { setError('Location services are off. Turn them on and retry, or continue manually.'); return; }
      let timer: ReturnType<typeof setTimeout> | undefined;
      let position: Location.LocationObject;
      try {
        position = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
          new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Location took too long. Please retry outside or continue manually.')), 20000); }),
        ]);
      } finally { if (timer) clearTimeout(timer); }
      const { latitude, longitude, accuracy } = position.coords;
      if (latitude < 6 || latitude > 38 || longitude < 68 || longitude > 98) { setError('This location is outside the India service area. You can find your Indian field manually.'); return; }
      dispatch({ type: 'onboarding/location', location: { latitude, longitude, accuracy, capturedAt: position.timestamp } });
      finish();
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to get your location. Retry or continue manually.'); }
    finally { inFlight.current = false; setBusy(false); }
  };
  return <Screen>
    <OnboardingHeader />
    <Text variant="meta">Step 3 of 3</Text>
    <Header title="Find your field nearby" subtitle="Allow location access to center the map around your phone." back />
    <Notice title="Your choice" tone="info">We read your location once when you tap Allow location. It stays in this session and helps center the map. Loading a map shares the viewed area with the map service. You will draw and confirm your actual field boundary.</Notice>
    <Text>You can continue without permission and use village search or coordinates. There is no background location tracking.</Text>
    {error ? <Notice tone="warning" title="Location unavailable">{error}</Notice> : null}
    {blocked ? <Text>Location permission is blocked. Enable it in your device settings, or use manual setup.{Platform.OS === 'web' ? ' On web, use your browser’s site permissions; location requires HTTPS or localhost.' : ''}</Text> : null}
    {blocked && Platform.OS !== 'web' ? <Button title="Open device settings" variant="secondary" onPress={() => { void Linking.openSettings().catch(() => setError('Open device settings manually to allow location.')); }} /> : null}
    <Button title={busy ? 'Getting your location…' : 'Allow location'} disabled={busy} onPress={locate} />
    <Button title="Continue without location" variant="ghost" disabled={busy} onPress={() => { dispatch({ type: 'onboarding/location', location: null }); finish(); }} />
  </Screen>;
}

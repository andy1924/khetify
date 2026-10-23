import React, { useState } from 'react';
import { router } from 'expo-router';
import { useDemo } from '../../demo';
import { Button, Field, Header, Screen, Text } from '../../ui';
import { OnboardingHeader } from './components';

export function DetailsScreen() {
  const { state, dispatch } = useDemo();
  const existing = state.onboarding.completed;
  const [name, setName] = useState(existing ? state.farm.farmerName : '');
  const [district, setDistrict] = useState(existing ? state.farm.district : '');
  const [stateName, setStateName] = useState(existing ? state.farm.stateName : '');
  const [crop, setCrop] = useState(existing ? state.farm.crop : '');
  return <Screen keyboard>
    <OnboardingHeader />
    <Text variant="meta">Step 2 of 3</Text>
    <Header title="A little about you" subtitle="Start with your name. You can add your field on Home." back />
    <Field label="Your name" placeholder="Enter your name" value={name} onChangeText={setName} autoCapitalize="words" autoComplete="name" maxLength={80} testID="farmer-name" />
    <Field label="Village / district · optional" value={district} onChangeText={setDistrict} maxLength={120} />
    <Field label="State · optional" value={stateName} onChangeText={setStateName} maxLength={80} />
    <Field label="Main crop · optional" value={crop} onChangeText={setCrop} maxLength={80} />
    <Button title="Continue" disabled={!name.trim()} onPress={() => {
      dispatch({ type: 'onboarding/details', name, district, stateName, crop }); router.push('/location');
    }} />
  </Screen>;
}

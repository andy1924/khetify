import { Redirect } from 'expo-router';
import { selectIsAuthenticated, useDemoSlices } from '../demo';

export default function Index() {
  const state = useDemoSlices(['onboarding'] as const);
  return <Redirect href={selectIsAuthenticated(state) ? '/(tabs)/home' : '/sign-in'} />;
}

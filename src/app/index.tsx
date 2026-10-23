import { Redirect } from 'expo-router';
import { selectIsAuthenticated, useDemoState } from '../demo';
export default function Index() {
  const state = useDemoState();
  return <Redirect href={selectIsAuthenticated(state) ? '/(tabs)/home' : '/language'} />;
}

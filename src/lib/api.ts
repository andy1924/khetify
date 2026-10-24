import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { resolveApiUrl } from './api-url';

export const apiBase = resolveApiUrl(
  process.env.EXPO_PUBLIC_FIELD_API_URL || '', Platform.OS,
  Constants.expoConfig?.hostUri, __DEV__,
);

export function connectionError() {
  if (!apiBase) return 'The field service is not configured. Set EXPO_PUBLIC_FIELD_API_URL and restart Expo.';
  const host = new URL(apiBase).hostname;
  if (Platform.OS !== 'web' && ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(host)) {
    return 'This phone cannot use your computer’s localhost. Start Expo in LAN mode on the same Wi-Fi, or set the backend URL to your computer’s LAN IP or a reachable HTTPS service.';
  }
  return 'Cannot reach the field service. Make sure the backend is running, your phone and computer share Wi-Fi, and the backend allows LAN connections. Then refresh.';
}

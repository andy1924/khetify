import '../../global.css';
import React, { useEffect } from 'react';
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { useFonts, DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from '@expo-google-fonts/dm-sans';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HeroUINativeProvider } from 'heroui-native/provider';
import { House, Sprout, LayoutGrid, Users, UserRound } from 'lucide-react-native';
import { DemoProvider } from '../demo';
import { useT } from '../locales';

const tabs = [
  { name: 'home', label: 'Home', Icon: House },
  { name: 'plan', label: 'Farm Plan', Icon: Sprout },
  { name: 'tools', label: 'Tools', Icon: LayoutGrid },
  { name: 'community', label: 'Community', Icon: Users },
  { name: 'profile', label: 'Profile', Icon: UserRound },
] as const;

function Navigation() {
  const t = useT();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [keyboardOpen, setKeyboardOpen] = React.useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  const onboarding = ['/', '/language', '/mobile', '/otp'].includes(pathname);
  const active = tabs.find(tab => pathname === `/${tab.name}` || pathname.startsWith(`/${tab.name}/`))?.name ?? 'home';
  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FAF8F4' }, animation: 'slide_from_right' }} />
      {!onboarding && !keyboardOpen && (
        <View style={[styles.navigationInset, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.navigation} accessibilityRole="tablist">
            {tabs.map(({name, Icon}) => {
              const selected = active === name;
              const title = t(`tabs.${name}`);
              return <Pressable key={name} accessibilityRole="tab" accessibilityLabel={title} accessibilityState={{selected}} onPress={() => router.navigate(`/(tabs)/${name}`)} style={[styles.tab, selected && styles.selected]}>
                <Icon size={20} strokeWidth={1.6} color={selected ? '#292C29' : '#64665F'} />
                <Text style={[styles.tabLabel, selected && styles.selectedLabel]}>{title}</Text>
              </Pressable>;
            })}
          </View>
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  useKeepAwake('khetify-ui-demo');
  const [loaded, error] = useFonts({ DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold });
  if (!loaded && !error) return <View style={[styles.root, styles.loading]}><ActivityIndicator color="#292C29" /></View>;
  return <GestureHandlerRootView style={styles.root}><SafeAreaProvider><HeroUINativeProvider><DemoProvider><Navigation /></DemoProvider></HeroUINativeProvider></SafeAreaProvider></GestureHandlerRootView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAF8F4' },
  loading: { alignItems: 'center', justifyContent: 'center' },
  navigationInset: { paddingTop: 8, paddingHorizontal: 16, backgroundColor: '#FAF8F4' },
  navigation: { minHeight: 72, flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 4, borderRadius: 22, borderWidth: 1, borderColor: '#E9E5DD' },
  tab: { flex: 1, minHeight: 62, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 16 },
  selected: { backgroundColor: '#E4ECE4' },
  tabLabel: { color: '#64665F', fontFamily: 'DMSans_500Medium', fontSize: 12, textAlign: 'center', flexShrink: 1 },
  selectedLabel: { color: '#292C29', fontFamily: 'DMSans_600SemiBold' },
});

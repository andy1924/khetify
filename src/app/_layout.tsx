import '../../global.css';
import React, { useEffect } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HeroUINativeProvider } from 'heroui-native/provider';
import { House, ChartNoAxesCombined, UserRound } from 'lucide-react-native';
import { DemoProvider } from '../demo';
import { useT } from '../locales';

const tabs = [
  { name: 'home', labelKey: 'tabs.home', Icon: House },
  { name: 'prices', labelKey: 'tabs.prices', Icon: ChartNoAxesCombined },
  { name: 'profile', labelKey: 'tabs.profile', Icon: UserRound },
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
  const onboarding = ['/', '/language', '/details', '/location', '/mobile', '/otp'].includes(pathname);
  const active = pathname === '/tools/mandi' || pathname === '/tools/forecast' ? 'prices' : tabs.find(tab => pathname === `/${tab.name}` || pathname.startsWith(`/${tab.name}/`))?.name ?? 'home';
  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FBFCF9' }, animation: 'slide_from_right' }} />
      {!onboarding && !keyboardOpen && (
        <View style={[styles.navigationInset, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.navigation} accessibilityRole="tablist">
            {tabs.map(({name, labelKey, Icon}) => {
              const selected = active === name;
              const title = t(labelKey);
              return <Pressable key={name} accessibilityRole="tab" accessibilityLabel={title} accessibilityState={{selected}} onPress={() => router.navigate(`/(tabs)/${name}`)} style={[styles.tab, selected && styles.selected]}>
                <Icon size={20} strokeWidth={1.6} color={selected ? '#263B29' : '#657360'} />
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
  return <GestureHandlerRootView style={styles.root}><SafeAreaProvider><HeroUINativeProvider><DemoProvider><Navigation /></DemoProvider></HeroUINativeProvider></SafeAreaProvider></GestureHandlerRootView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FBFCF9' },
  loading: { alignItems: 'center', justifyContent: 'center' },
  navigationInset: { paddingTop: 8, paddingHorizontal: 16, backgroundColor: '#FBFCF9' },
  navigation: { minHeight: 66, flexDirection: 'row', backgroundColor: '#EEF4E7', padding: 6, borderRadius: 34 },
  tab: { flex: 1, minHeight: 54, alignItems: 'center', justifyContent: 'center', gap: 3, borderRadius: 22 },
  selected: { backgroundColor: '#D4E7BE' },
  tabLabel: { color: '#657360', fontFamily: 'System', fontWeight: '400', fontSize: 13 },
  selectedLabel: { color: '#263B29', fontFamily: 'System', fontWeight: '600' },
});

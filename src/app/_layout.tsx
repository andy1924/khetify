import '../../global.css';
import React, { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { BlurTargetView, BlurView } from 'expo-blur';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HeroUINativeProvider } from 'heroui-native/provider';
import { House, ChartNoAxesCombined, Bell, UserRound } from 'lucide-react-native';
import { DemoProvider } from '../demo';
import { useT } from '../locales';
import { NavigationInsetContext } from '../ui/NavigationInset';

const tabs = [
  { name: 'home', labelKey: 'tabs.home', Icon: House },
  { name: 'prices', labelKey: 'tabs.prices', Icon: ChartNoAxesCombined },
  { name: 'alerts', labelKey: 'tabs.alerts', Icon: Bell },
  { name: 'profile', labelKey: 'tabs.profile', Icon: UserRound },
] as const;

function Navigation() {
  const t = useT();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const blurTarget = useRef<ComponentRef<typeof View> | null>(null);
  const [navigationHeight, setNavigationHeight] = useState(80);
  const [keyboardOpen, setKeyboardOpen] = React.useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  const onboarding = ['/', '/language', '/details', '/location', '/mobile', '/otp'].includes(pathname);
  const active = pathname.startsWith('/community') ? 'alerts' : pathname === '/tools/mandi' || pathname === '/tools/forecast' ? 'prices' : tabs.find(tab => pathname === `/${tab.name}` || pathname.startsWith(`/${tab.name}/`))?.name ?? 'home';
  const showNavigation = !onboarding && !keyboardOpen;
  const bottomSpacing = Math.max(insets.bottom, 12);
  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <NavigationInsetContext.Provider value={showNavigation ? navigationHeight + bottomSpacing + 12 : 0}>
        <BlurTargetView ref={blurTarget} style={styles.content}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FBFCF9' }, animation: 'slide_from_right' }} />
        </BlurTargetView>
      </NavigationInsetContext.Provider>
      {showNavigation && (
        <View pointerEvents="box-none" style={[styles.navigationInset, { bottom: bottomSpacing }]}>
          <View style={styles.navigationShadow} onLayout={event => setNavigationHeight(event.nativeEvent.layout.height)}>
            <View style={styles.navigationGlass}>
              <BlurView pointerEvents="none" blurTarget={blurTarget} blurMethod="dimezisBlurViewSdk31Plus" intensity={65} tint="systemUltraThinMaterialLight" style={StyleSheet.absoluteFill} />
              <View pointerEvents="none" style={styles.glassWash} />
              <View pointerEvents="none" style={styles.glassHighlight} />
              <View style={styles.navigation} accessibilityRole="tablist">
                {tabs.map(({name, labelKey, Icon}) => {
                  const selected = active === name;
                  const title = t(labelKey);
                  return <Pressable key={name} accessibilityRole="tab" accessibilityLabel={title} accessibilityState={{selected}} onPress={() => router.navigate(`/(tabs)/${name}`)} style={({ pressed }) => [styles.tab, selected && styles.selected, pressed && styles.tabPressed]}>
                    <Icon size={21} strokeWidth={selected ? 2 : 1.7} color={selected ? '#285B45' : '#535B53'} />
                    <Text style={[styles.tabLabel, selected && styles.selectedLabel]}>{title}</Text>
                  </Pressable>;
                })}
              </View>
            </View>
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
  content: { flex: 1 },
  navigationInset: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  navigationShadow: { width: '100%', maxWidth: 520, borderRadius: 40, shadowColor: '#243A2D', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.14, shadowRadius: 22, elevation: 8 },
  navigationGlass: { overflow: 'hidden', borderRadius: 40, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.85)', backgroundColor: 'rgba(250, 248, 244, 0.28)' },
  glassWash: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(255, 255, 255, 0.26)' },
  glassHighlight: { position: 'absolute', top: 0, left: 24, right: 24, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.95)' },
  navigation: { minHeight: 76, flexDirection: 'row', padding: 6, gap: 2 },
  tab: { flex: 1, minWidth: 0, minHeight: 62, paddingVertical: 9, paddingHorizontal: 2, alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 32, borderWidth: 1, borderColor: 'transparent' },
  selected: { backgroundColor: 'rgba(209, 229, 213, 0.62)', borderColor: 'rgba(255, 255, 255, 0.8)' },
  tabPressed: { backgroundColor: 'rgba(209, 229, 213, 0.8)', transform: [{ scale: 0.97 }] },
  tabLabel: { color: '#535B53', fontFamily: 'System', fontWeight: '400', fontSize: 13, textAlign: 'center', flexShrink: 1 },
  selectedLabel: { color: '#285B45', fontWeight: '600' },
});

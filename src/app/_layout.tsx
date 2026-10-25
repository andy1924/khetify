import '../../global.css';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { HeroUINativeProvider } from 'heroui-native/provider';
import { House, ChartNoAxesCombined, Bell, UserRound } from 'lucide-react-native';
import { DemoProvider } from '../demo';
import { useT } from '../locales';
import { NavigationInsetContext } from '../ui/NavigationInset';
import { AccentProvider, useAccent, useAccentPalette } from '../ui/AccentTheme';
import { motion, useReduceMotion } from '../ui/motion';

const tabs = [
  { name: 'home', labelKey: 'tabs.home', Icon: House },
  { name: 'prices', labelKey: 'tabs.prices', Icon: ChartNoAxesCombined },
  { name: 'alerts', labelKey: 'tabs.alerts', Icon: Bell },
  { name: 'profile', labelKey: 'tabs.profile', Icon: UserRound },
] as const;

const ONBOARDING_ROUTES = ['/', '/sign-in'];

/**
 * One tab. The selected pill cross-fades and the glyph lifts 1pt — all native
 * driven, so a tap never waits on a JS render to look responsive.
 */
const TabItem = React.memo(function TabItem({
  name,
  label,
  selected,
  accentSelected,
  accentStrong,
  reduceMotion,
  onPress,
}: {
  name: string;
  label: string;
  selected: boolean;
  accentSelected: string;
  accentStrong: string;
  reduceMotion: boolean;
  onPress: (name: string) => void;
}) {
  const [pill] = useState(() => new Animated.Value(selected ? 1 : 0));
  const [press] = useState(() => new Animated.Value(1));
  const running = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    running.current?.stop();
    if (reduceMotion) {
      pill.setValue(selected ? 1 : 0);
      return;
    }
    running.current = Animated.timing(pill, {
      toValue: selected ? 1 : 0,
      duration: selected ? 150 : 110,
      easing: motion.easing.out,
      useNativeDriver: true,
    });
    running.current.start();
    return () => running.current?.stop();
  }, [selected, pill, reduceMotion]);

  const animatePress = useCallback((toValue: number) => {
    press.stopAnimation();
    if (reduceMotion) {
      press.setValue(1);
      return;
    }
    Animated.timing(press, {
      toValue,
      duration: toValue < 1 ? motion.press : motion.release,
      easing: toValue < 1 ? motion.easing.out : motion.easing.in,
      useNativeDriver: true,
    }).start();
  }, [press, reduceMotion]);

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={() => onPress(name)}
      onPressIn={() => animatePress(0.94)}
      onPressOut={() => animatePress(1)}
      style={styles.tab}
    >
      <Animated.View
        style={[styles.tabPill, { backgroundColor: accentSelected, opacity: pill }]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.tabContent,
          {
            transform: [
              { scale: press },
              { translateY: pill.interpolate({ inputRange: [0, 1], outputRange: [0, -1] }) },
            ],
          },
        ]}
        pointerEvents="none"
      >
        <IconFor name={name} selected={selected} accentStrong={accentStrong} />
        <Text style={[styles.tabLabel, selected && styles.selectedLabel, selected && { color: accentStrong }]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
});

function IconFor({ name, selected, accentStrong }: { name: string; selected: boolean; accentStrong: string }) {
  const Icon = tabs.find(tab => tab.name === name)!.Icon;
  return <Icon size={21} strokeWidth={selected ? 2 : 1.7} color={selected ? accentStrong : '#535B53'} />;
}

/**
 * Tab press semantics: switching tabs uses `navigate`; tapping the tab you are
 * already inside returns to that tab's root, popping any detail screen pushed
 * above the tab group. The bar stays mounted throughout.
 */
function selectTab(name: string, active: string, pathname: string) {
  const href = `/(tabs)/${name}`;
  if (pathname === `/${name}`) return;
  if (active === name) {
    router.dismissTo(href);
    return;
  }
  router.navigate(href);
}

function Navigation() {
  const t = useT();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { accent } = useAccent();
  const palette = useAccentPalette();
  const reduceMotion = useReduceMotion();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const onboarding = ONBOARDING_ROUTES.includes(pathname);
  const active = pathname.startsWith('/community')
    ? 'alerts'
    : pathname === '/tools/market' || pathname === '/tools/forecast'
      ? 'prices'
      : tabs.find(tab => pathname === `/${tab.name}` || pathname.startsWith(`/${tab.name}/`))?.name ?? 'home';
  const showNavigation = !onboarding && !keyboardOpen;
  const bottomSpacing = Math.max(insets.bottom, 12);
  const navigationInset = showNavigation ? 88 + bottomSpacing + 12 : 0;

  const onPressTab = useCallback(
    (name: string) => selectTab(name, active, pathname),
    [active, pathname],
  );

  return (
    <View style={[styles.root, { backgroundColor: palette.page }]}>
      <StatusBar style="dark" />
      <NavigationInsetContext.Provider value={navigationInset}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: palette.page },
            animation: reduceMotion ? 'none' : 'slide_from_right',
            animationTypeForReplace: 'pop',
          }}
        />
      </NavigationInsetContext.Provider>
      {showNavigation && (
        <View pointerEvents="box-none" style={[styles.navigationInset, { paddingBottom: bottomSpacing }]}>
          <View style={[styles.navigation, { backgroundColor: palette.surface }]} accessibilityRole="tablist">
            {tabs.map(({ name, labelKey }) => (
              <TabItem
                key={name}
                name={name}
                label={t(labelKey)}
                selected={active === name}
                accentSelected={accent.selected}
                accentStrong={accent.strong}
                reduceMotion={reduceMotion}
                onPress={onPressTab}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

export default function RootLayout() {
  useKeepAwake('khetify-ui-demo');
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AccentProvider>
          <HeroUINativeProvider>
            <DemoProvider>
              <Navigation />
            </DemoProvider>
          </HeroUINativeProvider>
        </AccentProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // The bar sits in flow over the stack with an opaque leaf surface. A live
  // BlurView here re-blurred the whole screen on every scroll frame, which was
  // the app's largest source of dropped frames; a flat tint reads the same and
  // costs nothing.
  navigationInset: { position: 'absolute', left: 16, right: 16, bottom: 0 },
  navigation: {
    minHeight: 72,
    flexDirection: 'row',
    padding: 6,
    gap: 2,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.85)',
    shadowColor: '#243A2D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },
  tab: { flex: 1, minWidth: 0, minHeight: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 30 },
  tabPill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderRadius: 30 },
  tabContent: { alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabLabel: { color: '#535B53', fontFamily: 'System', fontWeight: '400', fontSize: 11.5, textAlign: 'center', flexShrink: 1 },
  selectedLabel: { fontWeight: '600' },
});

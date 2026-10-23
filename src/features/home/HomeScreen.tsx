import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useDemo } from '../../demo';
import { useT } from '../../locales';
import { homeText } from './strings';
import { Avatar, Button, colors, fonts, Icon, IconSurface, Screen, SectionLabel, Text } from '../../ui';

const QUICK_TOOLS = [
  { key: 'soil', icon: 'flask-conical', labelKey: 'home.quick.soil', route: '/tools/soil', background: colors.clayBg, color: colors.clayInk },
  { key: 'cropPhoto', icon: 'camera', labelKey: 'home.quick.cropPhoto', route: '/tools/photo', background: colors.blueBg, color: colors.blueInk },
  { key: 'prices', icon: 'store', labelKey: 'home.quick.prices', route: '/tools/mandi', background: colors.goldBg, color: colors.goldInk },
] as const;

export function HomeScreen() {
  const { state } = useDemo();
  const t = useT();
  const firstName = state.farm.farmerName.split(' ')[0];
  const soilTested = state.farm.soilTest !== null;

  return (
    <Screen gap={24}>
      <View style={styles.topRow}>
        <View style={styles.topCopy}>
          <View style={styles.brand}>
            <Icon name="sprout" size={20} color={colors.accent} />
            <Text variant="subtitle" weight="bold">{t('common.brand.name')}</Text>
          </View>
          <Text variant="heading" accessibilityRole="header" style={styles.greeting}>
            {t('home.greeting', { name: firstName })}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tabs.profile')}
          onPress={() => router.navigate('/(tabs)/profile')}
          style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}
        >
          <Avatar initials={state.farm.initials} size={44} background={colors.surface} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.farmSummary}>
        <Icon name="map-pin" size={16} color={colors.muted} />
        <Text style={styles.farmText}>
          {t('home.farmSummary', {
            farm: state.farm.farmName,
            area: String(state.farm.areaAcres),
            season: state.farm.season,
            crop: state.farm.crop.toLowerCase(),
          })}
        </Text>
      </View>

      <View style={styles.hero}>
        <Image
          source={require('../../../assets/images/farmer-phone-magic.jpg')}
          style={styles.heroImage}
          resizeMode="cover"
          accessible={false}
        />
        <View style={styles.heroContent}>
          <SectionLabel color={colors.clayInk}>{t('home.hero.label')}</SectionLabel>
          <Text variant="display" style={styles.heroTitle}>{t('home.hero.title')}</Text>
          <Text style={styles.heroBody}>{t('home.hero.body')}</Text>
          <Button title={t('home.hero.cta')} onPress={() => router.push('/(tabs)/plan')} icon="sprout" />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text variant="subtitle" accessibilityRole="header">{t('home.next.label')}</Text>
          <Text variant="caption" color={colors.muted}>{t('home.next.today')}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('home.next.title')}. ${t('home.next.body')}`}
          onPress={() => router.push('/tools/soil')}
          style={({ pressed }) => [styles.nextCard, pressed && styles.pressed]}
        >
          <IconSurface name="flask-conical" box={48} background={colors.clayBg} color={colors.clayInk} size={24} />
          <View style={styles.nextCopy}>
            <Text variant="subtitle">{t('home.next.title')}</Text>
            <Text variant="caption">{t('home.next.body')}</Text>
            {soilTested ? <Text variant="caption" tone="success">{homeText('home.next.imported')}</Text> : null}
          </View>
          <Icon name="chevron-right" size={20} />
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text variant="subtitle" accessibilityRole="header">{t('home.tools.title')}</Text>
        <View style={styles.quickRow}>
          {QUICK_TOOLS.map(tool => (
            <Pressable
              key={tool.key}
              accessibilityRole="button"
              accessibilityLabel={t(tool.labelKey)}
              onPress={() => router.push(tool.route as never)}
              style={({ pressed }) => [styles.quickCell, pressed && styles.pressed]}
            >
              <IconSurface name={tool.icon} box={48} radius={16} background={tool.background} color={tool.color} size={24} />
              <Text variant="caption" weight="medium" color={colors.ink} align="center">{t(tool.labelKey)}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Text variant="meta">{t('home.footer')}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  topCopy: { flex: 1, gap: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  greeting: { fontSize: 28, lineHeight: 35, letterSpacing: -0.7 },
  profileButton: { minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  farmSummary: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: -12 },
  farmText: { flex: 1, fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.muted },
  hero: { backgroundColor: colors.white, borderRadius: 24, borderWidth: 1, borderColor: colors.borderSoft, overflow: 'hidden' },
  heroImage: { width: '100%', height: 192 },
  heroContent: { padding: 20, gap: 12 },
  heroTitle: { fontSize: 28, lineHeight: 35, letterSpacing: -0.7 },
  heroBody: { marginBottom: 4 },
  section: { gap: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  nextCard: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderSoft, borderRadius: 20 },
  nextCopy: { flex: 1, gap: 5 },
  quickRow: { flexDirection: 'row', gap: 10 },
  quickCell: { flex: 1, alignItems: 'center', gap: 10, paddingVertical: 16, paddingHorizontal: 6, backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.borderSoft },
  pressed: { opacity: 0.78 },
});

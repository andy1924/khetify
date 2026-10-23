import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useDemo } from '../../demo';
import { useT } from '../../locales';
import { homeText } from './strings';
import { Avatar, Button, DemoBadge, Icon, IconSurface, Screen, SectionLabel, Text } from '../../ui';

const QUICK_TOOLS = [
  { key: 'soil', icon: 'flask-conical', labelKey: 'home.quick.soil', route: '/tools/soil' },
  { key: 'cropPhoto', icon: 'scan-line', labelKey: 'home.quick.cropPhoto', route: '/tools/photo' },
  { key: 'prices', icon: 'chart-no-axes-combined', labelKey: 'home.quick.prices', route: '/tools/mandi' },
] as const;

/** 01 · Home — fixture summary, continued plan entry, next step and tool shortcuts. */
export function HomeScreen() {
  const { state } = useDemo();
  const t = useT();

  const firstName = state.farm.farmerName.split(' ')[0];
  const soilTested = state.farm.soilTest !== null;

  return (
    <Screen>
      <View style={styles.topRow}>
        <View style={styles.topCopy}>
          <SectionLabel color="#607755">{t('common.brand.upper')}</SectionLabel>
          <Text variant="heading" style={styles.greeting}>
            {t('home.greeting', { name: firstName })}
          </Text>
        </View>
        <Avatar initials={state.farm.initials} size={38} />
      </View>

      <View style={styles.farmRow}>
        <View style={styles.farmSummary}>
          <Icon name="map-pin" size={14} color="#6B7964" />
          <Text style={styles.farmText} numberOfLines={1}>
            {t('home.farmSummary', {
              farm: state.farm.farmName,
              area: String(state.farm.areaAcres),
              season: state.farm.season,
              crop: state.farm.crop.toLowerCase(),
            })}
          </Text>
        </View>
        <DemoBadge label={t('common.demo')} />
      </View>

      <View style={styles.hero}>
        <SectionLabel color="#657360">{t('home.hero.label')}</SectionLabel>
        <Text variant="display" style={styles.heroTitle}>
          {t('home.hero.title')}
        </Text>
        <Text style={styles.heroBody}>{t('home.hero.body')}</Text>
        <Button
          title={t('home.hero.cta')}
          onPress={() => router.push('/(tabs)/plan')}
          style={styles.heroButton}
        />
      </View>

      <View style={styles.nextBlock}>
        <View style={styles.nextHead}>
          <SectionLabel color="#6c7764">{t('home.next.label')}</SectionLabel>
          <Text style={styles.nextToday}>{t('home.next.today')}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('home.next.title')}. ${t('home.next.body')}`}
          onPress={() => router.push('/tools/soil')}
          style={({ pressed }) => [styles.nextBody, pressed && styles.pressed]}
        >
          <Text variant="title" style={styles.nextTitle}>
            {t('home.next.title')}
          </Text>
          <Text style={styles.nextCopy}>{t('home.next.body')}</Text>
          {soilTested ? (
            <Text style={styles.nextMeta}>{homeText('home.next.imported')}</Text>
          ) : null}
        </Pressable>
      </View>

      <View style={styles.quickRow}>
        {QUICK_TOOLS.map(tool => (
          <Pressable
            key={tool.key}
            accessibilityRole="button"
            accessibilityLabel={t(tool.labelKey)}
            onPress={() => router.push(tool.route as never)}
            style={({ pressed }) => [styles.quickCell, pressed && styles.pressed]}
          >
            <IconSurface name={tool.icon} box={48} radius={16} background="#F0F4EB" color="#52664D" size={22} />
            <Text style={styles.quickLabel}>{t(tool.labelKey)}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.footer}>{t('home.footer')}</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  topCopy: { flex: 1, gap: 6 },
  greeting: { color: '#213827', lineHeight: 35 },

  farmRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: -8 },
  farmSummary: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  farmText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18, color: '#6B7964' },

  hero: { backgroundColor: '#EEF4E7', borderRadius: 20, padding: 20, gap: 14 },
  heroTitle: { color: '#263B29', lineHeight: 37.5 },
  heroBody: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, color: '#657360' },
  heroButton: { marginTop: 2 },

  nextBlock: {
    paddingTop: 4,
    paddingBottom: 18,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DFE6D8',
  },
  nextHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  nextToday: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 15, color: '#5C7950' },
  nextBody: { gap: 4 },
  nextTitle: { color: '#26392B' },
  nextCopy: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, color: '#6c7667' },

  quickRow: { flexDirection: 'row', gap: 16 },
  quickCell: { flex: 1, alignItems: 'center', gap: 8, minHeight: 48, paddingVertical: 2 },
  quickLabel: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 15, color: '#607057' },

  nextMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 15, color: '#5A714C' },
  planNote: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 15, color: '#697462' },
  footer: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 15, color: '#6c7564' },
  pressed: { opacity: 0.85 },
});

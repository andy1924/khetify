import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useDemoSlices } from '../../demo';
import { useT } from '../../locales';
import { Button, Icon, Screen, Text} from './ui';
import { useAccentPalette, useStyles, type AccentPalette } from '../../ui/AccentTheme';
import { PickerField, ScreenHeading, Sheet, StatusChip } from './components';
import { toolCopy } from './strings';
import { useToolRecorder } from './history';

const COMMODITIES = ['Wheat', 'Soybean', 'Onion'];
const MARKETS = ['Nashik', 'Lasalgaon', 'Pimpalgaon'];

/** 11 · Forecast — the data gate is closed, so no projection is ever rendered. */
export function ForecastScreen() {
  const styles = useStyles(makeStyles);
  const state = useDemoSlices(['market'] as const);
  const recordToolUse = useToolRecorder();
  const t = useT();
  const [picker, setPicker] = useState<'commodity' | 'market' | null>(null);
  const [marketName, setMarketName] = useState('Nashik');
  const [commodity, setCommodity] = useState(state.market.commodity);

  const showQuotes = () => {
    recordToolUse('forecast', 'tools.forecast.title', `${commodity} · ${marketName} · no forecast`);
    router.push(`/tools/market?commodity=${encodeURIComponent(commodity)}`);
  };

  return (
    <Screen>
      <ScreenHeading title={t('forecast.title')} subtitle={t('forecast.subtitle')} />

      <StatusChip label={t('forecast.unavailable')} tone="gold" />

      <View style={styles.pickers}>
        <PickerField
          label={t('forecast.commodity')}
          value={commodity}
          onPress={() => setPicker('commodity')}
        />
        <PickerField
          label={t('forecast.market')}
          value={marketName}
          onPress={() => setPicker('market')}
        />
      </View>

      <View style={styles.headline}>
        <Text style={styles.headlineText}>{t('forecast.heading')}</Text>
        <Text style={styles.body}>{t('forecast.body')}</Text>
      </View>

      <View style={styles.dataCard}>
        <Text style={styles.eyebrow}>{t('forecast.dataCheck')}</Text>
        <CheckRow label={t('forecast.series')} value={t('forecast.missing')} />
        <CheckRow label={t('forecast.lastDate')} value={t('common.unknown')} />
        <CheckRow label={t('forecast.horizon')} value={t('common.notAvailable')} />
      </View>

      <Button title={t('forecast.showCurrent')} onPress={showQuotes} />

      <Text style={styles.footer}>{t('forecast.note')}</Text>

      <PickerSheet
        visible={picker !== null}
        title={
          picker === 'commodity' ? toolCopy('forecast.pickerCommodity') : toolCopy('forecast.pickerMarket')
        }
        options={picker === 'commodity' ? COMMODITIES : MARKETS}
        selected={picker === 'commodity' ? commodity : marketName}
        onSelect={value => {
          if (picker === 'commodity') setCommodity(value);
          if (picker === 'market') setMarketName(value);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
    </Screen>
  );
}

function CheckRow({ label, value }: { label: string; value: string }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.checkRow}>
      <Text style={styles.checkLabel}>{label}</Text>
      <Text style={styles.checkValue}>{value}</Text>
    </View>
  );
}

/** Local single-choice sheet used by both selectors. */
export function PickerSheet({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}) {
  const palette = useAccentPalette();
  const styles = useStyles(makeStyles);
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      {options.map(option => {
        const active = option === selected;
        return (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option}
            onPress={() => onSelect(option)}
            style={[styles.option, active && styles.optionActive]}
          >
            <Text style={styles.optionLabel}>{option}</Text>
            {active ? <Icon name="check" size={18} color={palette.deep} /> : null}
          </Pressable>
        );
      })}
    </Sheet>
  );
}

const makeStyles = (p: AccentPalette) => StyleSheet.create({
  pickers: { flexDirection: 'row', gap: 12 },
  headline: { gap: 12, paddingVertical: 8 },
  headlineText: { fontFamily: 'System', fontWeight: '600', fontSize: 24, lineHeight: 30, color: p.deep },
  body: { fontFamily: 'System', fontWeight: '400', fontSize: 13, lineHeight: 18.2, color: p.muted },
  dataCard: { backgroundColor: p.surfaceSoft, borderRadius: 18, padding: 16, gap: 10 },
  eyebrow: {
    fontFamily: 'System', fontWeight: '600',
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.4,
    color: p.muted,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkLabel: { flex: 1, fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 17, color: p.muted },
  checkValue: {
    fontFamily: 'System', fontWeight: '500',
    fontSize: 12,
    lineHeight: 17,
    color: p.deep,
    textAlign: 'right',
  },
  footer: { fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 17, color: p.muted },
  option: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: p.surfaceSoft,
  },
  optionActive: { backgroundColor: p.active },
  optionLabel: { fontFamily: 'System', fontWeight: '500', fontSize: 14, lineHeight: 20, color: p.ink },
});

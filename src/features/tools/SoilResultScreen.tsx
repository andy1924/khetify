import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useDemo } from '../../demo';
import { formatDateLabel, type SoilParamKey } from '../../demo';
import { useT } from '../../locales';
import { Button, Icon, Screen, Text } from './ui';
import { Banner, ScreenHeading, Sheet, StatusChip } from './components';
import { soilParamLabel, toolCopy } from './strings';

const PERCENT_PARAMS: SoilParamKey[] = ['organicCarbon'];

function displayValue(key: SoilParamKey, value: string, unit?: string): string {
  const suffix = unit ?? (PERCENT_PARAMS.includes(key) ? '%' : '');
  return suffix === '%' ? `${value}%` : suffix ? `${value} ${suffix}` : value;
}

/** 09 · Soil result — partial data, persistent limitations, evidence sheet. */
export function SoilResultScreen() {
  const { state, actions } = useDemo();
  const t = useT();
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  const result = state.soil.result;

  const startImport = () => {
    actions.beginSoilImport();
    router.push('/tools/import');
  };

  if (!result) {
    return (
      <Screen>
        <ScreenHeading title={t('soilResult.title')} subtitle={t('soil.subtitle')} />
        <Banner
          title={toolCopy('soil.retryTitle')}
          body={toolCopy('soil.retryBody')}
          icon="circle-alert"
        />
        <Button title={t('common.back')} variant="secondary" trailingArrow={false} onPress={() => router.back()} />
      </Screen>
    );
  }

  const partial = result.enteredCount < result.totalCount;

  return (
    <Screen>
      <ScreenHeading
        title={t('soilResult.title')}
        subtitle={t('soilResult.subtitle', { date: formatDateLabel(result.sampleDate) })}
      />

      {partial ? <StatusChip label={t('soilResult.partial')} tone="partial" /> : null}

      <View style={styles.valuesCard}>
        <Text style={styles.captured}>
          {t('soilResult.captured', { count: result.enteredCount, total: result.totalCount })}
        </Text>
        <View style={styles.valueGrid}>
          {result.entered.map(entry => (
            <View key={entry.key} style={styles.valueCell}>
              <Text style={styles.valueBig} numberOfLines={1} adjustsFontSizeToFit>
                {displayValue(entry.key, entry.value, result.units[entry.key])}
              </Text>
              <Text style={styles.valueLabel} numberOfLines={2}>
                {soilParamLabel(t, entry.key)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {partial ? (
        <Text style={styles.explain}>{t('soilResult.explain')}</Text>
      ) : (
        <Text style={styles.explain}>
          {toolCopy('soilResult.completeNote', { total: result.totalCount })}
        </Text>
      )}

      <View style={styles.limitations}>
        <Text style={styles.limitationsTitle}>{t('soilResult.limitations')}</Text>
        <Text style={styles.limitationsBody}>{t('soilResult.limitationsBody')}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: evidenceOpen }}
        accessibilityLabel={`${t('soilResult.evidence')}. ${t('common.optional')}`}
        onPress={() => setEvidenceOpen(true)}
        style={styles.evidenceRow}
      >
        <Icon name="book-open" size={18} color="#52664D" />
        <Text style={styles.evidenceLabel}>{t('soilResult.evidence')}</Text>
        <Icon name="chevron-down" size={16} color="#52664D" />
      </Pressable>

      {state.soil.imported ? (
        <View style={styles.importedNote}>
          <Icon name="check" size={16} color="#52664D" />
          <Text style={styles.importedText}>
            {toolCopy('soil.imported')} · {toolCopy('soil.importedNote')}
          </Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button title={t('soilResult.import')} onPress={startImport} />
        <Text style={styles.footnote}>{t('soilResult.importNote')}</Text>
      </View>

      <Sheet
        visible={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        title={t('soilResult.evidence')}
      >
        <Text style={styles.sheetBody}>{t('soilResult.evidenceBody')}</Text>
        <View style={styles.evidenceList}>
          <EvidenceRow label={toolCopy('soilResult.evidenceSample')} value={formatDateLabel(result.sampleDate)} />
          <EvidenceRow
            label={toolCopy('soilResult.evidenceValue')}
            value={`${result.enteredCount} · ${result.entered.map(e => e.value).join(', ')}`}
          />
          <EvidenceRow label={toolCopy('soilResult.evidenceLimit')} value={t('soilResult.limitations')} />
          {partial ? <EvidenceRow label={t('soilResult.explain')} value="—" muted /> : null}
        </View>
        <Banner body={t('soilResult.limitationsBody')} icon="shield-check" />
      </Sheet>
    </Screen>
  );
}

function EvidenceRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <View style={styles.evidenceItem}>
      <Text style={styles.evidenceItemLabel}>{label}</Text>
      <Text style={[styles.evidenceItemValue, muted && { color: '#8A9483' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  valuesCard: {
    backgroundColor: '#EDF4E4',
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  captured: { fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 17, color: '#607052' },
  valueGrid: { flexDirection: 'row', gap: 18, flexWrap: 'wrap' },
  valueCell: { flexBasis: '44%', flexGrow: 1, minWidth: 0, gap: 5 },
  valueBig: { fontFamily: 'System', fontWeight: '600', fontSize: 36, lineHeight: 45, color: '#3D5C30' },
  valueLabel: { fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 17, color: '#637058' },
  explain: { fontFamily: 'System', fontWeight: '400', fontSize: 13, lineHeight: 18.2, color: '#687560' },
  limitations: { backgroundColor: '#F6F0E0', borderRadius: 18, padding: 16, gap: 8 },
  limitationsTitle: { fontFamily: 'System', fontWeight: '600', fontSize: 13, lineHeight: 18, color: '#7b683a' },
  limitationsBody: { fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 17, color: '#77694b' },
  evidenceRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F4F7EF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  evidenceLabel: {
    flex: 1,
    fontFamily: 'System', fontWeight: '600',
    fontSize: 13,
    lineHeight: 18,
    color: '#5A714C',
  },
  importedNote: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  importedText: { flex: 1, fontFamily: 'System', fontWeight: '400', fontSize: 11, lineHeight: 15, color: '#687560' },
  actions: { gap: 8 },
  footnote: { fontFamily: 'System', fontWeight: '400', fontSize: 10, lineHeight: 14, color: '#697462' },
  sheetBody: { fontFamily: 'System', fontWeight: '400', fontSize: 13, lineHeight: 18, color: '#687560' },
  evidenceList: { backgroundColor: '#F4F7EF', borderRadius: 14, paddingHorizontal: 14 },
  evidenceItem: { paddingVertical: 10, gap: 3 },
  evidenceItemLabel: { fontFamily: 'System', fontWeight: '400', fontSize: 11, lineHeight: 15, color: '#6a7560' },
  evidenceItemValue: { fontFamily: 'System', fontWeight: '500', fontSize: 13, lineHeight: 18, color: '#526D43' },
});

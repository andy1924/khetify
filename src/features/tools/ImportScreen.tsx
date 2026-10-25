import React, { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useDemoSlices, useDemoActions } from '../../demo';
import { formatDateLabel, type SoilParamKey } from '../../demo';
import { useT } from '../../locales';
import { Button, Icon, Screen, Text } from './ui';
import { useAccentPalette, useStyles, type AccentPalette } from '../../ui/AccentTheme';
import { Banner, ScreenHeading, SelectCircle, TwoButtonRow } from './components';
import { soilParamLabel, toolCopy } from './strings';

const PERCENT_PARAMS: SoilParamKey[] = ['organicCarbon'];

function displayValue(key: SoilParamKey, value: string, unit?: string): string {
  const suffix = unit ?? (PERCENT_PARAMS.includes(key) ? '%' : '');
  return suffix === '%' ? `${value}%` : suffix ? `${value} ${suffix}` : value;
}

/** 10 · Explicit import confirmation — review selected fields, confirm or cancel. */
export function ImportScreen() {
  const palette = useAccentPalette();
  const styles = useStyles(makeStyles);
  const state = useDemoSlices(['soil', 'farm', 'plan'] as const);
  const actions = useDemoActions();
  useFocusEffect(useCallback(() => () => actions.cancelSoilImport(), [actions]));
  const t = useT();
  const result = state.soil.result;
  const [selected, setSelected] = useState<SoilParamKey[]>(
    () => result?.entered.map(entry => entry.key) ?? [],
  );

  const entered = useMemo(() => result?.entered ?? [], [result]);
  const otherCount = result ? result.totalCount - result.enteredCount : 0;
  const allSelected = entered.length > 0 && selected.length === entered.length;

  const summary = useMemo(
    () =>
      entered
        .filter(entry => selected.includes(entry.key))
        .map(entry => displayValue(entry.key, entry.value, result?.units[entry.key]))
        .join(', '),
    [entered, selected, result],
  );

  const toggle = (key: SoilParamKey) => {
    setSelected(current =>
      current.includes(key) ? current.filter(item => item !== key) : [...current, key],
    );
  };

  const confirm = () => {
    if (selected.length === 0) return;
    actions.confirmSoilImport(selected);
    router.replace('/tools/soil-result');
  };

  const cancel = () => {
    actions.cancelSoilImport();
    router.back();
  };

  if (!result) {
    return (
      <Screen>
        <ScreenHeading title={t('import.title')} subtitle={t('import.subtitle')} />
        <Banner body={toolCopy('soil.retryBody')} icon="circle-alert" />
        <Button title={t('common.back')} variant="secondary" trailingArrow={false} onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeading title={t('import.title')} subtitle={t('import.subtitle')} />

      <View style={styles.destination}>
        <View style={styles.destinationRow}>
          <Icon name="sprout" size={28} color={palette.icon} />
          <View style={styles.destinationCopy}>
            <Text style={styles.farmName}>{state.farm.farmName}</Text>
            <Text style={styles.planLine}>
              {t('import.destinationLine', {
                crop: state.farm.crop,
                season: state.farm.season,
                version: state.plan.version,
              })}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.question}>{t('import.question')}</Text>
        <Text style={styles.selectHint}>{toolCopy('import.selectHint')}</Text>

        <View style={styles.rows}>
          <ReadOnlyRow label={t('import.sampleDate')} value={formatDateLabel(result.sampleDate)} />
          {entered.map(entry => (
            <View key={entry.key} style={styles.row}>
              <SelectCircle
                selected={selected.includes(entry.key)}
                onPress={() => toggle(entry.key)}
                label={soilParamLabel(t, entry.key)}
              />
              <Text style={styles.rowLabel}>{soilParamLabel(t, entry.key)}</Text>
              <Text style={styles.rowValue}>{displayValue(entry.key, entry.value, result.units[entry.key])}</Text>
            </View>
          ))}
          <ReadOnlyRow
            label={t('import.other', { count: otherCount })}
            value={t('common.unknown')}
          />
        </View>

        <View style={styles.divider} />

        <Text style={styles.note}>{t('import.note')}</Text>

        <TwoButtonRow
          primary={
            <Button
              title={t('import.confirm')}
              onPress={confirm}
              disabled={selected.length === 0}
            />
          }
          secondary={
            <Button
              title={t('import.cancel')}
              variant="secondary"
              trailingArrow={false}
              onPress={cancel}
            />
          }
        />

        <View style={styles.selectionNote}>
          <Icon name="shield-check" size={15} color={palette.icon} />
          <Text style={styles.selectionText}>
            {selected.length === 0
              ? toolCopy('import.needOne')
              : `${allSelected ? '' : `${toolCopy('import.selectedCount', {
                  count: selected.length,
                  total: entered.length,
                })} · `}${summary}`}
          </Text>
        </View>
      </View>

      <Text style={styles.footer}>{t('import.footer')}</Text>

      {result.crop !== state.farm.crop ? (
        <Text style={styles.footer}>
          {toolCopy('import.sampleCropNote', { crop: result.crop, farmCrop: state.farm.crop })}
        </Text>
      ) : null}

      {state.soil.imported ? (
        <Text style={styles.footer}>{toolCopy('import.imported')}</Text>
      ) : null}
    </Screen>
  );
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.row}>
      <View style={styles.circleSpacer} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, styles.rowValueMuted]}>{value}</Text>
    </View>
  );
}

const makeStyles = (p: AccentPalette) => StyleSheet.create({
  destination: { backgroundColor: p.surfaceSoft, borderRadius: 18, padding: 14 },
  destinationRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  destinationCopy: { flex: 1, gap: 4 },
  farmName: { fontFamily: 'System', fontWeight: '600', fontSize: 20, lineHeight: 28, color: p.heading },
  planLine: { fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 17, color: p.muted },

  panel: {
    backgroundColor: p.page,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: p.border,
    padding: 18,
    gap: 14,
  },
  question: { fontFamily: 'System', fontWeight: '600', fontSize: 22, lineHeight: 28.6, color: p.heading },
  selectHint: { fontFamily: 'System', fontWeight: '400', fontSize: 11, lineHeight: 15, color: p.muted },
  rows: { gap: 2 },
  row: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowLabel: { flex: 1, fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 17, color: p.muted },
  rowValue: {
    fontFamily: 'System', fontWeight: '500',
    fontSize: 12,
    lineHeight: 17,
    color: p.deep,
    textAlign: 'right',
  },
  rowValueMuted: { color: p.faint },
  circleSpacer: { width: 22, height: 22 },
  divider: { height: 0, backgroundColor: p.borderSoft },
  note: { fontFamily: 'System', fontWeight: '400', fontSize: 13, lineHeight: 18.2, color: p.muted },
  selectionNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  selectionText: { flex: 1, fontFamily: 'System', fontWeight: '400', fontSize: 11, lineHeight: 15, color: p.muted },
  footer: { fontFamily: 'System', fontWeight: '400', fontSize: 11, lineHeight: 15, color: p.faint },
});

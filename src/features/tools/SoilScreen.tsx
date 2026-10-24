import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useDemoSlices, useDemoActions } from '../../demo';
import { useT } from '../../locales';
import { formatDateLabel, SOIL_PARAMS, type SoilParamKey } from '../../demo';
import { Button, Field, Icon, Screen, Text } from './ui';
import { useAccentPalette, useStyles, type AccentPalette } from '../../ui/AccentTheme';
import { Banner, InfoStrip, ScreenHeading, Sheet } from './components';
import { toolCopy } from './strings';
import { useToolRecorder } from './history';

/** Units offered per parameter. Local to this screen; the demo store holds raw values. */
const UNIT_OPTIONS: Record<SoilParamKey, string[]> = {
  ph: [],
  organicCarbon: ['%', 'g/kg'],
  electricalConductivity: ['dS/m', 'µS/cm'],
  nitrogen: ['kg/ha', '%'],
  phosphorus: ['kg/ha', 'ppm'],
  potassium: ['kg/ha', 'ppm'],
  sulphur: ['ppm', 'kg/ha'],
  zinc: ['ppm', 'kg/ha'],
  iron: ['ppm', 'kg/ha'],
  copper: ['ppm', 'kg/ha'],
  manganese: ['ppm', 'kg/ha'],
  boron: ['ppm', 'kg/ha'],
};

const DEFAULT_UNITS: Partial<Record<SoilParamKey, string>> = {
  organicCarbon: '%',
  electricalConductivity: 'dS/m',
};

const PRIMARY: SoilParamKey[] = ['ph', 'organicCarbon'];
const ADDITIONAL: SoilParamKey[] = SOIL_PARAMS.filter(key => !PRIMARY.includes(key));

const NUMERIC = /^-?\d*(\.\d*)?$/;

const paramKey = (key: SoilParamKey) => `soil.param.${key}` as const;

type Phase = 'idle' | 'loading' | 'error';

/** 08 · Soil test input — editable values, optional fields, validation, local result. */
export function SoilScreen() {
  const palette = useAccentPalette();
  const styles = useStyles(makeStyles);
  const state = useDemoSlices(['soil'] as const);
  const actions = useDemoActions();
  const recordToolUse = useToolRecorder();
  const t = useT();
  const units = useMemo(() => ({ ...DEFAULT_UNITS, ...state.soil.units }), [state.soil.units]);
  const [unitTarget, setUnitTarget] = useState<SoilParamKey | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [cropDraft, setCropDraft] = useState(state.soil.crop);
  const [dateDraft, setDateDraft] = useState(state.soil.sampleDate);
  const [editError, setEditError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const invalid = useMemo(
    () =>
      SOIL_PARAMS.filter(key => {
        const value = state.soil.values[key];
        if (value === undefined || value.trim() === '') return false;
        const numeric = Number(value);
        return !NUMERIC.test(value.trim()) || !Number.isFinite(numeric) || numeric < 0 || (key === 'ph' && numeric > 14);
      }),
    [state.soil.values],
  );

  const enteredCount = SOIL_PARAMS.filter(key => (state.soil.values[key] ?? '').trim() !== '').length;
  const remaining = SOIL_PARAMS.length - enteredCount;

  const submit = () => {
    if (enteredCount === 0) return;
    if (invalid.length > 0) {
      setShowErrors(true);
      setPhase('error');
      return;
    }
    setShowErrors(false);
    setPhase('loading');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      actions.analyzeSoil();
      recordToolUse('soil', 'tools.soil.title', `${enteredCount} of ${SOIL_PARAMS.length} values`);
      setPhase('idle');
      router.push('/tools/soil-result');
    }, 850);
  };

  const openEdit = () => {
    setCropDraft(state.soil.crop);
    setDateDraft(state.soil.sampleDate);
    setEditError(null);
    setEditOpen(true);
  };

  const saveEdit = () => {
    const crop = cropDraft.trim();
    const date = dateDraft.trim();
    if (!crop) {
      setEditError(toolCopy('soil.cropError'));
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setEditError(toolCopy('soil.dateError'));
      return;
    }
    actions.setSoilContext({ crop, sampleDate: date });
    setEditOpen(false);
    setEditError(null);
  };

  // Stable per-parameter handlers so the 12 value fields can be memoised: typing
  // in one field re-renders only that field, not the other eleven TextInputs.
  const handlers = useMemo(() => {
    const map = {} as Record<SoilParamKey, { change: (text: string) => void; pick: () => void }>;
    for (const key of SOIL_PARAMS) {
      map[key] = {
        change: text => actions.setSoilValue(key, text),
        pick: () => setUnitTarget(key),
      };
    }
    return map;
  }, [actions]);

  const unitLabel = (key: SoilParamKey) => units[key] ?? '';
  /** Carbon's input label carries the currently selected unit, never a hardcoded one. */
  const inputLabel = (key: SoilParamKey) => {
    if (key === 'organicCarbon') {
      const unit = units[key];
      return unit ? toolCopy('soil.param.organicCarbonUnit', { unit }) : t('soil.param.organicCarbon');
    }
    return t(paramKey(key));
  };
  const unitOptions = unitTarget ? UNIT_OPTIONS[unitTarget] : [];

  return (
    <Screen keyboard>
      <ScreenHeading title={t('soil.title')} subtitle={t('soil.subtitle')} subtitleSize={14} />

      <View style={styles.summaryRow}>
        <Text style={styles.context}>
          {t('soil.context', {
            crop: state.soil.crop,
            date: formatDateLabel(state.soil.sampleDate),
          })}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('soil.edit')} ${t('soil.editSheet')}`}
          onPress={openEdit}
          hitSlop={8}
          style={styles.editButton}
        >
          <Text style={styles.editLabel}>{t('soil.edit')}</Text>
          <Icon name="pencil" size={15} color={palette.icon} />
        </Pressable>
      </View>

      <View style={styles.fields}>
        {PRIMARY.map(key => (
          <SoilValueField
            key={key}
            paramKey={key}
            label={inputLabel(key)}
            value={state.soil.values[key] ?? ''}
            unit={unitLabel(key)}
            unitOptions={UNIT_OPTIONS[key]}
            onChangeText={handlers[key].change}
            onPickUnit={handlers[key].pick}
            invalid={showErrors && invalid.includes(key)}
            errorText={t('soil.error.value')}
          />
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: state.soil.showAdditional }}
        accessibilityLabel={`${t('soil.addMore')}. ${
          remaining > 0 ? t('soil.remaining', { count: remaining }) : ''
        }`}
        onPress={actions.toggleSoilAdditional}
        style={styles.additionalToggle}
      >
        <View style={styles.additionalCopy}>
          <Text style={styles.additionalTitle}>{t('soil.addMore')}</Text>
          <Text style={styles.additionalSub}>
            {remaining > 0
              ? t('soil.remaining', { count: remaining })
              : toolCopy('soil.additionalHint')}
          </Text>
        </View>
        <Icon
          name="chevron-down"
          size={20}
          color={palette.icon}
        />
      </Pressable>

      {state.soil.showAdditional ? (
        <View style={styles.fields}>
          {ADDITIONAL.map(key => (
            <SoilValueField
              key={key}
              paramKey={key}
              label={inputLabel(key)}
              value={state.soil.values[key] ?? ''}
              unit={unitLabel(key)}
              unitOptions={UNIT_OPTIONS[key]}
              onChangeText={handlers[key].change}
              onPickUnit={handlers[key].pick}
              invalid={showErrors && invalid.includes(key)}
              errorText={t('soil.error.value')}
              compact
            />
          ))}
        </View>
      ) : null}

      <InfoStrip text={t('soil.helper')} />
      {enteredCount === 0 ? <Text style={styles.emptyHint}>{t('soil.needValue')}</Text> : null}

      <View style={styles.actions}>
        {phase === 'error' ? (
          <Banner
            title={toolCopy('soil.retryTitle')}
            body={toolCopy('soil.retryBody')}
            icon="circle-alert"
          />
        ) : null}
        <Button
          title={
            enteredCount === 1
              ? t('soil.analyzeOne')
              : t('soil.analyze', { count: enteredCount })
          }
          onPress={submit}
          disabled={enteredCount === 0}
          loading={phase === 'loading'}
          trailingArrow={enteredCount > 0}
        />
        {phase === 'error' ? (
          <Button
            title={toolCopy('soil.retry')}
            variant="secondary"
            trailingArrow={false}
            onPress={() => {
              setPhase('idle');
              setShowErrors(false);
            }}
          />
        ) : null}
      </View>

      <Sheet
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        title={t('soil.editSheet')}
        footer={
          <Button title={t('common.save')} trailingArrow={false} onPress={saveEdit} />
        }
      >
        <Text style={styles.sheetNote}>{toolCopy('soil.editNote')}</Text>
        <Field
          label={t('soil.crop')}
          value={cropDraft}
          onChangeText={setCropDraft}
          placeholder={toolCopy('soil.cropPlaceholder')}
        />
        <Field
          label={t('soil.sampleDate')}
          value={dateDraft}
          onChangeText={setDateDraft}
          placeholder={toolCopy('soil.datePlaceholder')}
        />
        {editError ? <Banner body={editError} /> : null}
      </Sheet>

      <Sheet
        visible={unitTarget !== null}
        onClose={() => setUnitTarget(null)}
        title={unitTarget ? t(paramKey(unitTarget)) : ''}
      >
        <Text style={styles.sheetNote}>{toolCopy('soil.additionalHint')}</Text>
        {unitOptions.length === 0 ? (
          <Text style={styles.sheetNote}>{toolCopy('soil.unit.none')}</Text>
        ) : (
          unitOptions.map(option => {
            const selected = unitTarget ? unitLabel(unitTarget) === option : false;
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={option}
                onPress={() => {
                  if (unitTarget) actions.setSoilUnit(unitTarget, option);
                  setUnitTarget(null);
                }}
                style={[styles.unitRow, selected && styles.unitRowSelected]}
              >
                <Text style={styles.unitRowLabel}>{option}</Text>
                {selected ? <Icon name="check" size={18} color={palette.deep} /> : null}
              </Pressable>
            );
          })
        )}
      </Sheet>
    </Screen>
  );
}

/** Memoised: only the edited parameter's value, unit and error change. */
const SoilValueField = React.memo(function SoilValueField({
  label,
  value,
  unit,
  unitOptions,
  onChangeText,
  onPickUnit,
  invalid,
  errorText,
  compact,
}: {
  paramKey: SoilParamKey;
  label: string;
  value: string;
  unit: string;
  unitOptions: string[];
  onChangeText: (text: string) => void;
  onPickUnit: () => void;
  invalid: boolean;
  errorText: string;
  compact?: boolean;
}) {
  const palette = useAccentPalette();
  const styles = useStyles(makeStyles);
  return (
    <View>
      <View style={[styles.valueCard, compact && styles.valueCardCompact]}>
        <View style={styles.valueLabels}>
          <Text style={styles.valueLabel}>{label}</Text>
          <View style={styles.valueRow}>
            <TextInputValue
              value={value}
              onChangeText={onChangeText}
              accessibilityLabel={label}
              large={!compact}
            />
            {unitOptions.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${toolCopy('tools.soil.unit')}: ${unit || '—'}`}
                onPress={onPickUnit}
                hitSlop={8}
                style={styles.unitButton}
              >
                <Text style={styles.unitButtonLabel}>{unit || '—'}</Text>
                <Icon name="chevron-down" size={13} color={palette.icon} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
      {invalid ? <Text style={styles.fieldError}>{errorText}</Text> : null}
    </View>
  );
});

function TextInputValue({
  value,
  onChangeText,
  accessibilityLabel,
  large,
}: {
  value: string;
  onChangeText: (text: string) => void;
  accessibilityLabel: string;
  large: boolean;
}) {
  const palette = useAccentPalette();
  const styles = useStyles(makeStyles);
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      keyboardType="decimal-pad"
      accessibilityLabel={accessibilityLabel}
      placeholder="—"
      placeholderTextColor={palette.iconFaint}
      selectionColor={palette.deep}
      style={large ? styles.inputLarge : styles.inputSmall}
    />
  );
}

const makeStyles = (p: AccentPalette) => StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 4,
    paddingBottom: 16,
    borderBottomWidth: 0,
    borderBottomColor: p.border,
    minHeight: 48,
  },
  context: { flex: 1, fontFamily: 'System', fontWeight: '400', fontSize: 13, lineHeight: 18, color: p.muted },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingLeft: 8 },
  editLabel: { fontFamily: 'System', fontWeight: '500', fontSize: 13, lineHeight: 18, color: p.ink },

  fields: { gap: 16 },
  valueCard: {
    minHeight: 78,
    borderRadius: 12,
    backgroundColor: p.surfaceSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  valueCardCompact: { minHeight: 64 },
  valueLabels: { gap: 4 },
  valueLabel: { fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 16, color: p.muted },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inputLarge: {
    flex: 1,
    padding: 0,
    margin: 0,
    fontFamily: 'System', fontWeight: '500',
    fontSize: 22,
    lineHeight: 28,
    color: p.ink,
    includeFontPadding: false,
  },
  inputSmall: {
    flex: 1,
    padding: 0,
    margin: 0,
    fontFamily: 'System', fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: p.ink,
    includeFontPadding: false,
  },
  unitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: p.chip,
  },
  unitButtonLabel: { fontFamily: 'System', fontWeight: '500', fontSize: 11, lineHeight: 14, color: p.deep },
  fieldError: {
    marginTop: 6,
    fontFamily: 'System', fontWeight: '400',
    fontSize: 11,
    lineHeight: 15,
    color: '#8B4A3A',
  },

  additionalToggle: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 18,
    borderTopWidth: 0,
    borderBottomWidth: 0,
    borderColor: p.border,
  },
  additionalCopy: { flex: 1, gap: 5 },
  additionalTitle: { fontFamily: 'System', fontWeight: '500', fontSize: 15, lineHeight: 20, color: p.ink },
  additionalSub: { fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 16, color: p.muted },

  actions: { gap: 12 },
  emptyHint: { fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 17, color: '#77694b' },

  sheetNote: { fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 17, color: p.muted },
  unitRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: p.surfaceSoft,
  },
  unitRowSelected: { backgroundColor: p.active },
  unitRowLabel: { fontFamily: 'System', fontWeight: '500', fontSize: 14, lineHeight: 20, color: p.ink },
});

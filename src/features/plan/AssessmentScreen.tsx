import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { formatRupees, useDemo, type AssessmentDraft, type WaterAvailability } from '../../demo';
import { useT } from '../../locales';
import { Button, Icon, Screen, SegmentedProgress, Sheet, Text } from '../../ui';
import { ChoiceRow, Hairline, InfoStrip, ScreenHeading } from './components';
import { planText } from './strings';

const WATER_OPTIONS: { key: WaterAvailability; labelKey: string }[] = [
  { key: 'rainfed', labelKey: 'assessment.water.rainfed' },
  { key: 'limited', labelKey: 'assessment.water.limited' },
  { key: 'reliable', labelKey: 'assessment.water.reliable' },
];

const SEASON_KEYS = [
  { value: 'Rabi', labelKey: 'assessment.season.rabi' },
  { value: 'Kharif', labelKey: 'assessment.season.kharif' },
  { value: 'Zaid', labelKey: 'assessment.season.zaid' },
] as const;

const SEED_OPTIONS = [
  { id: 'demo-seed-a', labelKey: 'plan.seed.a' },
  { id: 'demo-seed-b', labelKey: 'plan.seed.b' },
] as const;

const ACRES_PER_HECTARE = 2.47105;

type Errors = Partial<Record<'farmName' | 'area' | 'district' | 'budget' | 'season', string>>;

/** 03 · Farm assessment — editable land & resources, then a sample seed choice. */
export function AssessmentScreen() {
  const { state, actions } = useDemo();
  const t = useT();
  const draft = state.assessmentDraft;

  const [step, setStep] = useState<0 | 1>(0);
  const [unit, setUnit] = useState<'acres' | 'hectares'>('acres');
  const [seedId, setSeedId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [dirty, setDirty] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  // Start from current farm values on every entry. The previous version
  // re-seeded whenever the draft was null, which rebuilt the form right after
  // cancel/save instead of leaving the screen.
  const draftRef = useRef(state.assessmentDraft);

  const dirtyRef = useRef(false);
  const discardOpenRef = useRef(false);
  useEffect(() => {
    draftRef.current = state.assessmentDraft;
    dirtyRef.current = dirty;
    discardOpenRef.current = discardOpen;
  }, [state.assessmentDraft, dirty, discardOpen]);

  const leave = useCallback(
    (discardDraft: boolean) => {
      if (discardDraft) actions.cancelAssessment();
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)/plan');
    },
    [actions],
  );

  const goBackSafely = useCallback(() => {
    if (dirtyRef.current) {
      setDiscardOpen(true);
      return;
    }
    leave(true);
  }, [leave]);

  // Focus-scoped: never intercept hardware back while another tab is showing,
  // resume a fresh draft on re-entry, and drop the draft when navigating away.
  useFocusEffect(
    useCallback(() => {
      if (!draftRef.current) actions.beginAssessment();
      // Fresh local form state for this entry (a retained route may keep it).
      setDirty(false);
      setStep(0);
      setSeedId(null);
      setErrors({});
      setDiscardOpen(false);
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (discardOpenRef.current) return false;
        goBackSafely();
        return true;
      });
      return () => {
        subscription.remove();
        actions.cancelAssessment();
      };
    }, [actions, goBackSafely]),
  );

  const patch = (values: Partial<AssessmentDraft>) => {
    actions.updateAssessment(values);
    setDirty(true);
  };

  if (!draft) {
    return <Screen>{null}</Screen>;
  }

  const areaText =
    unit === 'acres'
      ? draft.areaAcres === null
        ? ''
        : String(draft.areaAcres)
      : draft.areaAcres === null
        ? ''
        : String(Math.round((draft.areaAcres / ACRES_PER_HECTARE) * 100) / 100);

  const budgetText = draft.budget === null ? '' : String(draft.budget);

  const validateStepOne = (): boolean => {
    const next: Errors = {};
    if (!draft.farmName.trim()) next.farmName = t('assessment.error.name');
    if (draft.areaAcres === null || draft.areaAcres <= 0) next.area = t('assessment.error.area');
    if (!draft.district.trim()) next.district = t('assessment.error.name');
    if (draft.budget === null || draft.budget <= 0) {
      next.budget = planText('assessment.error.budgetRange');
    }
    if (!draft.season.trim()) next.season = planText('assessment.error.season');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const nextStep = () => {
    if (!validateStepOne()) return;
    setStep(1);
  };

  const save = () => {
    actions.saveAssessment();
    if (seedId) actions.setStageSeed('seed', seedId);
    setDirty(false);
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/plan');
  };

  const summary = planText('assessment.step2.summary', {
    farm: draft.farmName.trim() || state.farm.farmName,
    area: String(draft.areaAcres ?? state.farm.areaAcres),
    season: draft.season,
    budget: `₹${formatRupees(draft.budget ?? state.farm.budget)}`,
  });

  return (
    <Screen keyboard contentStyle={styles.screenContent}>
      <ScreenHeading
        title={t('assessment.title')}
        subtitle={step === 0 ? t('assessment.subtitle') : planText('assessment.step2.subtitle')}
      />
      <SegmentedProgress count={2} current={step} />

      {step === 0 ? (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('assessment.farmDetails')}</Text>
            <View style={styles.pairRow}>
              <View style={styles.pairCell}>
                <Text style={styles.fieldLabel}>{t('assessment.farmName')}</Text>
                <TextInput
                  value={draft.farmName}
                  onChangeText={value => patch({ farmName: value })}
                  accessibilityLabel={t('assessment.farmName')}
                  placeholder={state.farm.farmName}
                  placeholderTextColor="#A3AF99"
                  selectionColor="#3D5C30"
                  style={styles.input}
                />
                {errors.farmName ? <Text style={styles.error}>{errors.farmName}</Text> : null}
              </View>
              <View style={styles.pairCell}>
                <Text style={styles.fieldLabel}>{t('assessment.area')}</Text>
                <View style={styles.areaRow}>
                  <TextInput
                    value={areaText}
                    onChangeText={value => {
                      const cleaned = value.replace(/[^0-9.]/g, '');
                      const parsed = cleaned ? Number(cleaned) : null;
                      const acres =
                        parsed === null || !Number.isFinite(parsed)
                          ? null
                          : unit === 'acres'
                            ? parsed
                            : Math.round(parsed * ACRES_PER_HECTARE * 100) / 100;
                      patch({ areaAcres: acres });
                    }}
                    keyboardType="decimal-pad"
                    accessibilityLabel={`${t('assessment.area')} (${planText(`assessment.unit.${unit}`)})`}
                    placeholder="2"
                    placeholderTextColor="#A3AF99"
                    selectionColor="#3D5C30"
                    style={[styles.input, styles.areaInput]}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${planText('assessment.unit.label')}: ${planText(
                      `assessment.unit.${unit}`,
                    )}`}
                    onPress={() => setUnit(current => (current === 'acres' ? 'hectares' : 'acres'))}
                    hitSlop={8}
                    style={styles.unitChip}
                  >
                    <Text style={styles.unitLabel}>{planText(`assessment.unit.${unit}`)}</Text>
                    <Icon name="chevron-down" size={12} color="#565F59" strokeWidth={1.8} />
                  </Pressable>
                </View>
                {errors.area ? <Text style={styles.error}>{errors.area}</Text> : null}
              </View>
            </View>
            <Hairline />
            <View style={styles.fullRow}>
              <Text style={styles.fieldLabel}>{t('assessment.district')}</Text>
              <TextInput
                value={draft.district}
                onChangeText={value => patch({ district: value })}
                accessibilityLabel={t('assessment.district')}
                placeholder={`${state.farm.district}, ${state.farm.stateName}`}
                placeholderTextColor="#A3AF99"
                selectionColor="#3D5C30"
                style={styles.input}
              />
              {errors.district ? <Text style={styles.error}>{errors.district}</Text> : null}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('assessment.seasonResources')}</Text>
            <View style={styles.pairRow}>
              <View style={styles.pairCell}>
                <Text style={styles.fieldLabel}>{t('assessment.season')}</Text>
                <View style={styles.seasonRow}>
                  {SEASON_KEYS.map(season => {
                    const selected = draft.season === season.value;
                    return (
                      <Pressable
                        key={season.value}
                        accessibilityRole="radio"
                        accessibilityLabel={planText(season.labelKey as never)}
                        accessibilityState={{ selected }}
                        onPress={() => patch({ season: season.value })}
                        style={[styles.seasonChip, selected && styles.seasonChipSelected]}
                      >
                        <Text style={[styles.seasonText, selected && styles.seasonTextSelected]}>
                          {planText(season.labelKey as never)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {errors.season ? <Text style={styles.error}>{errors.season}</Text> : null}
              </View>
              <View style={styles.pairCell}>
                <Text style={styles.fieldLabel}>{t('assessment.budget')}</Text>
                <View style={styles.budgetRow}>
                  <Text style={styles.currency}>₹</Text>
                  <TextInput
                    value={budgetText}
                    onChangeText={value => {
                      const cleaned = value.replace(/[^0-9]/g, '');
                      patch({ budget: cleaned ? Number(cleaned) : null });
                    }}
                    keyboardType="number-pad"
                    accessibilityLabel={t('assessment.budget')}
                    placeholder="30,000"
                    placeholderTextColor="#A3AF99"
                    selectionColor="#3D5C30"
                    style={[styles.input, styles.budgetInput]}
                  />
                </View>
                {errors.budget ? <Text style={styles.error}>{errors.budget}</Text> : null}
                {!errors.budget && draft.budget !== null ? (
                  <Text style={styles.budgetHint}>₹ {formatRupees(draft.budget)}</Text>
                ) : null}
              </View>
            </View>
            <Hairline />
            <View style={styles.fullRow}>
              <Text style={styles.fieldLabel}>{t('assessment.water')}</Text>
              <View style={styles.waterRow}>
                {WATER_OPTIONS.map(option => {
                  const selected = draft.water === option.key;
                  return (
                    <Pressable
                      key={option.key}
                      accessibilityRole="radio"
                      accessibilityLabel={t(option.labelKey as never)}
                      accessibilityState={{ selected }}
                      onPress={() => patch({ water: option.key })}
                      style={[styles.waterChip, selected && styles.waterChipSelected]}
                    >
                      <Text style={styles.waterText}>{t(option.labelKey as never)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          <InfoStrip text={t('assessment.privacy')} />

          <Button title={t('assessment.next')} onPress={nextStep} />
        </>
      ) : (
        <>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHead}>
              <Icon name="sprout" size={20} color="#72975A" strokeWidth={1.6} />
              <Text style={styles.summaryText} numberOfLines={2}>
                {summary}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{planText('assessment.step2.section')}</Text>
            <Text style={styles.cardBody}>{planText('assessment.step2.body')}</Text>
            <View style={styles.choiceList}>
              {SEED_OPTIONS.map(option => (
                <ChoiceRow
                  key={option.id}
                  label={planText(option.labelKey)}
                  selected={seedId === option.id}
                  onPress={() => {
                    setSeedId(current => (current === option.id ? null : option.id));
                  }}
                />
              ))}
            </View>
            <Text style={styles.cardNote}>{planText('assessment.step2.note')}</Text>
          </View>

          <View style={styles.stepActions}>
            <Button
              title={planText('assessment.step2.save')}
              onPress={() => {
                if (!validateStepOne()) {
                  setStep(0);
                  return;
                }
                save();
              }}
            />
            <Button
              title={planText('assessment.step2.back')}
              variant="secondary"
              trailingArrow={false}
              onPress={() => setStep(0)}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={planText('assessment.skipSeed')}
              onPress={save}
              hitSlop={8}
              style={styles.skipButton}
            >
              <Text style={styles.skipText}>{planText('assessment.skipSeed')}</Text>
            </Pressable>
          </View>
        </>
      )}

      <Sheet
        visible={discardOpen}
        onClose={() => setDiscardOpen(false)}
        title={planText('assessment.cancelTitle')}
        footer={
          <View style={styles.sheetActions}>
            <View style={styles.sheetCell}>
              <Button
                title={planText('assessment.keepEditing')}
                variant="secondary"
                trailingArrow={false}
                onPress={() => setDiscardOpen(false)}
              />
            </View>
            <View style={styles.sheetCell}>
              <Button
                title={planText('assessment.discard')}
                variant="secondary"
                trailingArrow={false}
                onPress={() => {
                  setDiscardOpen(false);
                  setDirty(false);
                  leave(true);
                }}
              />
            </View>
          </View>
        }
      >
        <Text style={styles.sheetText}>{planText('assessment.cancelBody')}</Text>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: { gap: 20 },
  card: { backgroundColor: '#F2EFE9', borderRadius: 18, paddingTop: 18, paddingHorizontal: 18, paddingBottom: 8, gap: 8 },
  cardTitle: { fontFamily: 'DMSans_500Medium', fontSize: 16, lineHeight: 22, color: '#343A33' },
  cardBody: { fontFamily: 'DMSans_400Regular', fontSize: 13, lineHeight: 18, color: '#6a7560' },
  cardNote: { fontFamily: 'DMSans_400Regular', fontSize: 12, lineHeight: 16, color: '#686A63', paddingBottom: 6 },

  pairRow: { flexDirection: 'row', gap: 16 },
  pairCell: { flex: 1, gap: 4, paddingVertical: 10 },
  fullRow: { paddingVertical: 10, gap: 4 },
  fieldLabel: { fontFamily: 'DMSans_400Regular', fontSize: 13, lineHeight: 18, color: '#66705d' },
  input: {
    padding: 0,
    margin: 0,
    minHeight: 24,
    fontFamily: 'DMSans_500Medium',
    fontSize: 15,
    lineHeight: 21,
    color: '#343A33',
    includeFontPadding: false,
  },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  areaInput: { flex: 1 },
  unitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 99,
    backgroundColor: '#E9E6DF',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  unitLabel: { fontFamily: 'DMSans_500Medium', fontSize: 12, lineHeight: 16, color: '#4A693D' },

  budgetRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  currency: { fontFamily: 'DMSans_500Medium', fontSize: 15, lineHeight: 21, color: '#343A33' },
  budgetInput: { flex: 1 },
  budgetHint: { fontFamily: 'DMSans_400Regular', fontSize: 12, lineHeight: 16, color: '#686A63' },

  seasonRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 },
  seasonChip: {
    minHeight: 30,
    justifyContent: 'center',
    borderRadius: 99,
    backgroundColor: '#E9E6DF',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  seasonChipSelected: { backgroundColor: '#E4ECE4' },
  seasonText: { fontFamily: 'DMSans_500Medium', fontSize: 12, lineHeight: 16, color: '#4A693D' },
  seasonTextSelected: { color: '#3D5C30', fontFamily: 'DMSans_600SemiBold' },

  waterRow: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  waterChip: {
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 99,
    backgroundColor: '#E9E6DF',
    paddingHorizontal: 14,
  },
  waterChipSelected: { backgroundColor: '#E4ECE4' },
  waterText: { fontFamily: 'DMSans_500Medium', fontSize: 12, lineHeight: 16, color: '#4A693D' },

  error: { fontFamily: 'DMSans_400Regular', fontSize: 12, lineHeight: 16, color: '#8B4A3A' },

  summaryCard: { backgroundColor: '#EFF5E7', borderRadius: 18, padding: 14 },
  summaryHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryText: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 13, lineHeight: 18, color: '#526D43' },

  choiceList: { gap: 8, marginTop: 2 },

  stepActions: { gap: 12 },
  skipButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  skipText: { fontFamily: 'DMSans_500Medium', fontSize: 14, lineHeight: 19, color: '#526C43' },

  sheetActions: { flexDirection: 'row', gap: 12 },
  sheetCell: { flex: 1 },
  sheetText: { fontFamily: 'DMSans_400Regular', fontSize: 14, lineHeight: 20, color: '#646861' },
});

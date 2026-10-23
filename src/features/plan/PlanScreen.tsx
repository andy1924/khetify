import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  formatRupees,
  selectRemainingBudget,
  useDemo,
  type PlanStage,
} from '../../demo';
import { useT } from '../../locales';
import { Button, Icon, Screen, Sheet, Text } from '../../ui';
import { InfoStrip, PressableRow, ScreenHeading, StageIndicator } from './components';
import { planText } from './strings';

const EMPTY_FEATURES = ['plan.empty.cover.1', 'plan.empty.cover.2', 'plan.empty.cover.3'] as const;

/** 02/04 · Farm Plan — empty first-visit state or the active six-stage plan. */
export function PlanScreen() {
  const { state, actions } = useDemo();
  const t = useT();
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);
  const [lockedStage, setLockedStage] = useState<string | null>(null);

  if (!state.plan.exists) {
    return (
      <Screen>
        <ScreenHeading title={t('plan.empty.title')} subtitle={t('plan.empty.subtitle')} />

        <View style={styles.emptyBody}>
          <Image source={require('../../../assets/images/wheat-field.jpg')} style={styles.emptyImage} resizeMode="cover" accessible={false} />
          <Text style={styles.emptyHeading}>{t('plan.empty.heading')}</Text>
          <Text style={styles.emptyCopy}>{t('plan.empty.body')}</Text>
          <View style={styles.emptyPanel}>
            {EMPTY_FEATURES.map(key => (
              <View key={key} style={styles.emptyFeature}>
                <Icon name="check" size={16} color="#565F59" strokeWidth={1.8} />
                <Text style={styles.emptyFeatureText}>{t(key)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.emptyActions}>
          <Button
            title={t('plan.empty.assess')}
            onPress={() => {
              actions.beginAssessment();
              router.push('/plan/assessment');
            }}
          />
          <Button
            title={t('plan.empty.browse')}
            variant="secondary"
            trailingArrow={false}
            onPress={() => router.push('/(tabs)/tools')}
          />
        </View>
      </Screen>
    );
  }

  const remaining = selectRemainingBudget(state);
  const waterKey = `plan.constraint.water.${state.farm.water}` as const;

  const openStage = (stage: PlanStage) => {
    if (stage.status === 'locked') {
      setLockedStage(stage.titleKey);
      return;
    }
    router.push({ pathname: '/plan/stage', params: { stage: stage.id } });
  };

  return (
    <Screen>
      <ScreenHeading
        title={t('plan.title')}
        subtitle={t('plan.subtitle', {
          farm: state.farm.farmName,
          crop: state.farm.crop,
          season: state.farm.season,
        })}
      />

      <View style={styles.budgetCard}>
        <Text style={styles.budgetLabel}>
          {t('plan.budget.label', { budget: formatRupees(state.plan.budget) })}
        </Text>
        <View style={styles.budgetValueRow}>
          <Text style={styles.budgetValue} numberOfLines={1} adjustsFontSizeToFit>
            ₹ {formatRupees(remaining)}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('plan.budget.revise')}
            onPress={() => {
              actions.beginRevision();
              router.push('/plan/review');
            }}
            hitSlop={8}
            style={({ pressed }) => [styles.reviseChip, pressed && styles.pressed]}
          >
            <Text style={styles.reviseLabel}>{t('plan.budget.revise')}</Text>
          </Pressable>
        </View>
        <View style={styles.budgetChips}>
          <View style={styles.constraintChip}>
            <Text style={styles.constraintText}>
              {t('plan.constraint.area', { area: String(state.farm.areaAcres) })}
            </Text>
          </View>
          <View style={styles.constraintChip}>
            <Text style={styles.constraintText}>{t(waterKey)}</Text>
          </View>
        </View>
      </View>

      <View>
        {state.plan.stages.map((stage, index) => {
          const last = index === state.plan.stages.length - 1;
          const locked = stage.status === 'locked';
          const caption = t(stage.captionKey);
          return (
            <PressableRow
              key={stage.id}
              label={t('plan.stage.a11y', {
                title: t(stage.titleKey),
                status: caption,
              })}
              onPress={() => openStage(stage)}
              style={[styles.stageRow, !last && styles.stageHairline]}
            >
              <StageIndicator status={stage.status} ordinal={stage.ordinal} />
              <View style={styles.stageCopy}>
                <Text style={styles.stageTitle}>{t(stage.titleKey)}</Text>
                <Text style={styles.stageCaption} numberOfLines={2}>
                  {caption}
                </Text>
              </View>
              {locked ? (
                <Icon name="lock-keyhole" size={14} color="#A1AC96" strokeWidth={1.7} />
              ) : stage.status === 'current' ? (
                <Icon name="chevron-right" size={18} color="#565F59" strokeWidth={1.8} />
              ) : (
                <Icon name="chevron-right" size={16} color="#A1AC96" strokeWidth={1.8} />
              )}
            </PressableRow>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={planText('plan.assumptions.title')}
        onPress={() => setAssumptionsOpen(true)}
        hitSlop={8}
        style={({ pressed }) => [styles.footerRow, pressed && styles.pressed]}
      >
        <Text style={styles.footerText}>
          {t('plan.footer', { version: String(state.plan.version) })}
        </Text>
      </Pressable>

      <Sheet
        visible={assumptionsOpen}
        onClose={() => setAssumptionsOpen(false)}
        title={planText('plan.assumptions.title')}
        footer={
          <Button
            title={t('common.close')}
            variant="secondary"
            trailingArrow={false}
            onPress={() => setAssumptionsOpen(false)}
          />
        }
      >
        <View style={styles.sheetBody}>
          <Text style={styles.sheetText}>{planText('plan.assumptions.body')}</Text>
          <AssumptionRow label={planText('plan.assumptions.area')} value={`${state.farm.areaAcres} acres`} />
          <AssumptionRow label={planText('plan.assumptions.water')} value={t(waterKey)} />
          <AssumptionRow
            label={planText('plan.assumptions.budget')}
            value={`₹ ${formatRupees(state.plan.budget)}`}
          />
          <AssumptionRow
            label={planText('plan.assumptions.committed')}
            value={`₹ ${formatRupees(state.plan.committedCost)}`}
          />
          <Text style={styles.sheetNote}>{planText('plan.assumptions.source')}</Text>
        </View>
      </Sheet>

      <Sheet
        visible={lockedStage !== null}
        onClose={() => setLockedStage(null)}
        title={planText('plan.stage.lockedTitle')}
        footer={
          <Button
            title={t('common.close')}
            variant="secondary"
            trailingArrow={false}
            onPress={() => setLockedStage(null)}
          />
        }
      >
        <View style={styles.sheetBody}>
          <Text style={styles.sheetText}>{planText('plan.stage.lockedBody')}</Text>
          <InfoStrip icon="lock-keyhole" text={lockedStage ? t(lockedStage as never) : ''} />
        </View>
      </Sheet>
    </Screen>
  );
}

function AssumptionRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.assumptionRow}>
      <Text style={styles.assumptionLabel}>{label}</Text>
      <Text style={styles.assumptionValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyBody: { alignItems: 'center', gap: 12, paddingTop: 8 },
  emptyImage: { width: '100%', height: 144, borderRadius: 22, marginBottom: 8 },
  emptyHeading: {
    fontFamily: 'DMSans_600SemiBold',
    fontSize: 25,
    lineHeight: 34,
    color: '#2A412B',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyCopy: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 16,
    lineHeight: 22,
    color: '#6c7766',
    textAlign: 'center',
  },
  emptyPanel: {
    alignSelf: 'stretch',
    backgroundColor: '#F6F8F2',
    borderRadius: 18,
    padding: 16,
    gap: 10,
    marginTop: 8,
  },
  emptyFeature: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emptyFeatureText: { flex: 1, fontFamily: 'DMSans_400Regular', fontSize: 13, lineHeight: 18, color: '#64745A' },
  emptyActions: { gap: 12 },

  budgetCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E9E5DD', borderRadius: 22, padding: 20, gap: 8 },
  budgetLabel: { fontFamily: 'DMSans_600SemiBold', fontSize: 12, lineHeight: 16, letterSpacing: 0.4, color: '#5e6f50' },
  budgetValueRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12 },
  budgetValue: { flex: 1, minWidth: 180, fontFamily: 'DMSans_600SemiBold', fontSize: 32, lineHeight: 43, color: '#292C29' },
  reviseChip: {
    borderRadius: 12,
    backgroundColor: '#F1EEE8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 48,
    justifyContent: 'center',
  },
  reviseLabel: { fontFamily: 'DMSans_500Medium', fontSize: 12, lineHeight: 16, color: '#526C43' },
  budgetChips: { flexDirection: 'row', gap: 8, marginTop: 4, flexWrap: 'wrap' },
  constraintChip: {
    borderRadius: 99,
    backgroundColor: '#F1F6E8',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  constraintText: { fontFamily: 'DMSans_400Regular', fontSize: 12, lineHeight: 16, color: '#5C7350' },

  stageRow: { minHeight: 59, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  stageHairline: { borderBottomWidth: 1, borderBottomColor: '#E7EBE1' },
  stageCopy: { flex: 1, gap: 3 },
  stageTitle: { fontFamily: 'DMSans_500Medium', fontSize: 16, lineHeight: 22, color: '#343A33' },
  stageCaption: { fontFamily: 'DMSans_400Regular', fontSize: 12, lineHeight: 16, color: '#6c7562' },

  footerRow: { paddingVertical: 8, minHeight: 36, justifyContent: 'center' },
  footerText: { fontFamily: 'DMSans_400Regular', fontSize: 12, lineHeight: 16, color: '#686A63' },

  sheetBody: { gap: 12 },
  sheetText: { fontFamily: 'DMSans_400Regular', fontSize: 14, lineHeight: 20, color: '#646861' },
  sheetNote: { fontFamily: 'DMSans_400Regular', fontSize: 12, lineHeight: 16, color: '#686A63' },
  assumptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#E9E5DD',
  },
  assumptionLabel: { fontFamily: 'DMSans_400Regular', fontSize: 13, lineHeight: 18, color: '#6a7560' },
  assumptionValue: { fontFamily: 'DMSans_500Medium', fontSize: 13, lineHeight: 18, color: '#526D43' },
  pressed: { opacity: 0.85 },
});

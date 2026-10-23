import React, { useCallback, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { formatRupees, useDemo } from '../../demo';
import { useT } from '../../locales';
import { Button, Icon, Screen, Sheet, Text } from '../../ui';
import { ScreenHeading } from './components';
import { planText } from './strings';

const CHANGE_ICONS = { storage: 'minus', seed: 'replace', resources: 'equal' } as const;

/** 06 · Review plan changes — before/after budget, sample delta, confirm or cancel. */
export function ReviewScreen() {
  const { state, actions } = useDemo();
  const t = useT();
  const draft = state.plan.revisionDraft;

  const [editOpen, setEditOpen] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState(draft ? String(draft.toBudget) : '');
  const [editError, setEditError] = useState<string | null>(null);

  const cancel = () => {
    actions.cancelRevision();
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/plan');
  };

  // The revision draft is screen-scoped: leaving Review any way (tab switch,
  // hardware back, unmount) discards it, so a reopened Review always starts
  // from the current plan budget. The back listener is focus-scoped so a
  // retained covered route never intercepts back for another screen.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        actions.cancelRevision();
        if (router.canGoBack()) router.back();
        else router.replace('/(tabs)/plan');
        return true;
      });
      return () => {
        subscription.remove();
        actions.cancelRevision();
      };
    }, [actions]),
  );

  if (!draft) {
    return (
      <Screen>
        <ScreenHeading title={planText('revision.missing')} subtitle={t('revision.title')} />
        <Button
          title={planText('revision.openPlan')}
          variant="secondary"
          trailingArrow={false}
          onPress={() => router.replace('/(tabs)/plan')}
        />
      </Screen>
    );
  }

  const waterKey = `plan.constraint.water.${state.farm.water}` as const;
  const nextVersion = state.plan.version + 1;

  const applyBudget = () => {
    const cleaned = budgetDraft.replace(/[^0-9]/g, '');
    const value = cleaned ? Number(cleaned) : 0;
    if (!Number.isFinite(value) || value <= 0) {
      setEditError(planText('revision.error.budget'));
      return;
    }
    actions.setRevisionBudget(value);
    setEditError(null);
    setEditOpen(false);
  };

  const confirm = () => {
    actions.confirmRevision();
    router.replace('/(tabs)/plan');
  };
  return (
    <Screen>
      <ScreenHeading
        title={t('revision.title')}
        subtitle={t('revision.subtitle', { farm: state.farm.farmName })}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('revision.budgetLabel')}. ${planText('revision.editAction')}`}
        onPress={() => {
          setBudgetDraft(String(draft.toBudget));
          setEditError(null);
          setEditOpen(true);
        }}
        style={({ pressed }) => [styles.strip, pressed && styles.pressed]}
      >
        <View style={styles.stripTop}>
          <Text style={styles.stripLabel}>{t('revision.budgetLabel')}</Text>
          <View style={styles.editChip}>
            <Text style={styles.editChipText}>{planText('revision.editAction')}</Text>
          </View>
        </View>
        <Text style={styles.stripValue} numberOfLines={1} adjustsFontSizeToFit>
          {t('revision.budgetValue', {
            from: formatRupees(draft.fromBudget),
            to: formatRupees(draft.toBudget),
          })}
        </Text>
      </Pressable>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>{t('revision.sheetTitle')}</Text>
        <Text style={styles.panelBody}>{t('revision.sheetBody')}</Text>

        <View style={styles.changeList}>
          {draft.changes.map(change => (
            <View key={change.id} style={styles.changeRow}>
              <Icon name={CHANGE_ICONS[change.id]} size={18} color="#7F966A" strokeWidth={1.8} />
              <View style={styles.changeCopy}>
                <Text style={styles.changeTitle}>{t(change.titleKey)}</Text>
                <Text style={styles.changeDetail}>
                  {change.id === 'resources'
                    ? t(change.detailKey, { area: String(state.farm.areaAcres), water: t(waterKey) })
                    : t(change.detailKey)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        <Text style={styles.delta}>{t('revision.delta', { delta: formatRupees(draft.delta) })}</Text>
        <Text style={styles.note}>{t('revision.note', { version: String(nextVersion) })}</Text>

        <View style={styles.actions}>
          <View style={styles.actionCell}>
            <Button title={t('revision.confirm')} onPress={confirm} />
          </View>
          <View style={styles.actionCell}>
            <Button
              title={t('revision.cancel')}
              variant="secondary"
              trailingArrow={false}
              onPress={cancel}
            />
          </View>
        </View>
      </View>

      <Sheet
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        title={planText('revision.editTitle')}
        footer={
          <Button title={planText('revision.editApply')} onPress={applyBudget} />
        }
      >
        <View style={styles.sheetBody}>
          <Text style={styles.sheetText}>{planText('revision.editBody')}</Text>
          <View style={styles.budgetField}>
            <Text style={styles.budgetLabel}>{planText('revision.editLabel')}</Text>
            <View style={styles.budgetRow}>
              <Text style={styles.currency}>₹</Text>
              <TextInput
                value={budgetDraft}
                onChangeText={value => {
                  setBudgetDraft(value.replace(/[^0-9]/g, ''));
                  setEditError(null);
                }}
                keyboardType="number-pad"
                accessibilityLabel={planText('revision.editLabel')}
                selectionColor="#3D5C30"
                style={styles.budgetInput}
              />
            </View>
            {editError ? <Text style={styles.error}>{editError}</Text> : null}
          </View>
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  strip: { backgroundColor: '#F2F5EC', borderRadius: 18, padding: 18, gap: 12 },
  stripTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  stripLabel: { fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 17, color: '#646f5c' },
  editChip: { borderRadius: 99, backgroundColor: '#E4EBD9', paddingHorizontal: 10, paddingVertical: 4 },
  editChipText: { fontFamily: 'System', fontWeight: '500', fontSize: 10, lineHeight: 14, color: '#526C43' },
  stripValue: { fontFamily: 'System', fontWeight: '600', fontSize: 24, lineHeight: 31, color: '#526C43' },

  panel: {
    backgroundColor: '#F9FBF5',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#DFE7D7',
    padding: 18,
    gap: 12,
  },
  panelTitle: { fontFamily: 'System', fontWeight: '600', fontSize: 22, lineHeight: 29, color: '#2E472B' },
  panelBody: { fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 17, color: '#687460' },

  changeList: { gap: 10 },
  changeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  changeCopy: { flex: 1, gap: 4 },
  changeTitle: { fontFamily: 'System', fontWeight: '500', fontSize: 13, lineHeight: 18, color: '#4F6543' },
  changeDetail: { fontFamily: 'System', fontWeight: '400', fontSize: 11, lineHeight: 15, color: '#6a7361' },

  divider: { height: 0, backgroundColor: '#E6EBE1' },
  delta: { fontFamily: 'System', fontWeight: '600', fontSize: 14, lineHeight: 20, color: '#526E43' },
  note: { fontFamily: 'System', fontWeight: '400', fontSize: 11, lineHeight: 15, color: '#68725d' },

  actions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  actionCell: { flex: 1 },

  sheetBody: { gap: 12 },
  sheetText: { fontFamily: 'System', fontWeight: '400', fontSize: 13, lineHeight: 19, color: '#687560' },
  budgetField: { backgroundColor: '#F6F8F3', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 4 },
  budgetLabel: { fontFamily: 'System', fontWeight: '400', fontSize: 11, lineHeight: 15, color: '#666f63' },
  budgetRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  currency: { fontFamily: 'System', fontWeight: '500', fontSize: 16, lineHeight: 22, color: '#243527' },
  budgetInput: {
    flex: 1,
    padding: 0,
    margin: 0,
    fontFamily: 'System', fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#243527',
    includeFontPadding: false,
  },
  error: { fontFamily: 'System', fontWeight: '400', fontSize: 11, lineHeight: 15, color: '#8B4A3A' },
  pressed: { opacity: 0.85 },
});

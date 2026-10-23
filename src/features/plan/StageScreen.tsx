import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  selectCurrentStage,
  selectStageIndex,
  useDemo,
  type StageId,
} from '../../demo';
import { useT } from '../../locales';
import { Button, Icon, Screen, Sheet, Text } from '../../ui';
import { EstimateBanner, PressableRow, ScreenHeading } from './components';
import { planText } from './strings';

const STAGE_IDS: StageId[] = ['land', 'seed', 'preparation', 'nutrition', 'harvest', 'selling'];

const SEED_OPTIONS = [
  { id: 'demo-seed-a', labelKey: 'plan.seed.a' },
  { id: 'demo-seed-b', labelKey: 'plan.seed.b' },
] as const;

const NUMERIC = /^\d*(\.\d*)?$/;

function isStageId(value: unknown): value is StageId {
  return typeof value === 'string' && (STAGE_IDS as string[]).includes(value);
}

/** 05 · Stage detail — seed choice, optional quote, mark done, source sheet. */
export function StageScreen() {
  const { state, actions } = useDemo();
  const t = useT();
  const params = useLocalSearchParams<{ stage?: string }>();

  const fallback = selectCurrentStage(state);
  const stageId: StageId = isStageId(params.stage) ? params.stage : fallback?.id ?? 'seed';
  const stage = state.plan.stages.find(item => item.id === stageId);
  const index = selectStageIndex(state, stageId);

  const [quote, setQuote] = useState(stage?.quotePerKg !== null && stage?.quotePerKg !== undefined ? String(stage.quotePerKg) : '');
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [seedSheet, setSeedSheet] = useState(false);
  const [sourceSheet, setSourceSheet] = useState(false);
  const [doneSheet, setDoneSheet] = useState(false);

  if (!stage) {
    return (
      <Screen>
        <ScreenHeading title={t('plan.title')} subtitle={t('stage.back')} />
        <Button
          title={planText('revision.openPlan')}
          variant="secondary"
          trailingArrow={false}
          onPress={() => router.replace('/(tabs)/plan')}
        />
      </Screen>
    );
  }

  const locked = stage.status === 'locked';
  const completed = stage.status === 'completed';
  const incomplete = stage.quotePerKg === null;
  const selectedSeed = SEED_OPTIONS.find(option => option.id === stage.seedId) ?? null;

  const saveQuote = () => {
    const cleaned = quote.trim();
    if (cleaned === '') {
      setQuoteError(t('stage.seed.quoteError'));
      return;
    }
    if (!NUMERIC.test(cleaned)) {
      setQuoteError(t('stage.seed.quoteError'));
      return;
    }
    const value = Number(cleaned);
    if (!Number.isFinite(value) || value <= 0) {
      setQuoteError(t('stage.seed.quoteError'));
      return;
    }
    setQuoteError(null);
    actions.setStageQuote(stageId, Math.round(value * 100) / 100);
    setSavedNote(t('stage.seed.quoteSaved'));
  };

  const clearQuote = () => {
    setQuote('');
    setQuoteError(null);
    actions.setStageQuote(stageId, null);
    setSavedNote(t('stage.seed.quoteCleared'));
  };

  const confirmDone = () => {
    setDoneSheet(false);
    actions.markStageDone(stageId);
    router.replace('/(tabs)/plan');
  };

  return (
    <Screen keyboard>
      <ScreenHeading
        title={t(stage.titleKey)}
        subtitle={t('stage.of', { index: String(index + 1) })}
      />

      <PressableRow
        label={t('stage.back')}
        onPress={() => router.back()}
        style={styles.backRow}
      >
        <Icon name="arrow-left" size={20} color="#65775B" strokeWidth={1.8} />
        <Text style={styles.backText}>{t('stage.back')}</Text>
      </PressableRow>

      {locked ? (
        <View style={styles.lockedPanel}>
          <View style={styles.lockedHead}>
            <Icon name="lock-keyhole" size={19} color="#78643A" strokeWidth={1.7} />
            <Text style={styles.lockedTitle}>{planText('plan.stage.lockedTitle')}</Text>
          </View>
          <Text style={styles.lockedBody}>{planText('plan.stage.lockedBody')}</Text>
          <Button
            title={planText('revision.openPlan')}
            variant="secondary"
            trailingArrow={false}
            onPress={() => router.replace('/(tabs)/plan')}
          />
        </View>
      ) : (
        <>
          {incomplete ? (
            <EstimateBanner
              title={t('stage.seed.incomplete')}
              body={t('stage.seed.incompleteBody')}
            />
          ) : null}

          <View style={styles.taskCard}>
            <Text style={styles.taskTitle}>{t('stage.seed.task')}</Text>
            <Text style={styles.taskBody}>{t('stage.seed.taskBody')}</Text>

            <PressableRow
              label={`${t('stage.seed.option')}: ${selectedSeed ? planText(selectedSeed.labelKey) : t('stage.seed.awaiting')}`}
              onPress={() => setSeedSheet(true)}
              style={styles.taskRow}
            >
              <Text style={styles.taskLabel}>{t('stage.seed.option')}</Text>
              <View style={styles.taskValueRow}>
                <Text style={styles.taskValue} numberOfLines={1}>
                  {selectedSeed ? planText(selectedSeed.labelKey) : t('stage.seed.awaiting')}
                </Text>
                <Icon name="chevron-right" size={14} color="#52664D" strokeWidth={1.8} />
              </View>
            </PressableRow>

            <View style={styles.taskRowPlain}>
              <Text style={styles.taskLabel}>{t('stage.seed.quantity')}</Text>
              <Text style={styles.taskValue}>{t('common.unknown')}</Text>
            </View>
          </View>

          <PressableRow
            label={t('stage.evidence')}
            onPress={() => setSourceSheet(true)}
            style={styles.evidenceRow}
          >
            <Icon name="book-open" size={20} color="#52664D" strokeWidth={1.6} />
            <Text style={styles.evidenceLabel}>{t('stage.evidence')}</Text>
            <Icon name="chevron-right" size={16} color="#52664D" strokeWidth={1.8} />
          </PressableRow>

          <View style={styles.quoteField}>
            <Text style={styles.quoteLabel}>{t('stage.seed.quoteLabel')}</Text>
            <TextInput
              value={quote}
              onChangeText={value => {
                setQuote(value.replace(/[^0-9.]/g, ''));
                setQuoteError(null);
                setSavedNote(null);
              }}
              keyboardType="decimal-pad"
              placeholder={t('stage.seed.quotePlaceholder')}
              placeholderTextColor="#A3AF99"
              accessibilityLabel={t('stage.quoteA11y')}
              selectionColor="#3D5C30"
              editable={!completed}
              style={styles.quoteInput}
            />
            {quoteError ? <Text style={styles.quoteError}>{quoteError}</Text> : null}
            {savedNote ? <Text style={styles.savedNote}>{savedNote}</Text> : null}
            {stage.quotePerKg !== null ? (
              <Text style={styles.savedNote}>
                {`₹ ${stage.quotePerKg} / kg · `}{planText('plan.stage.quantityHint')}
              </Text>
            ) : null}
          </View>

          <View style={styles.actionsRow}>
            <View style={styles.actionCell}>
              <Button title={t('stage.seed.saveQuote')} onPress={saveQuote} disabled={completed} />
            </View>
            <View style={styles.actionCell}>
              <Button
                title={t('stage.seed.markDone')}
                variant="secondary"
                trailingArrow={false}
                onPress={() => setDoneSheet(true)}
                disabled={completed}
              />
            </View>
          </View>

          {stage.quotePerKg !== null ? (
            <PressableRow label={t('stage.seed.removeQuote')} onPress={clearQuote} style={styles.clearRow}>
              <Text style={styles.clearText}>{t('stage.seed.removeQuote')}</Text>
            </PressableRow>
          ) : null}

          <Text style={styles.footer}>{t('stage.seed.footer')}</Text>
        </>
      )}

      <Sheet
        visible={seedSheet}
        onClose={() => setSeedSheet(false)}
        title={planText('plan.stage.seedSheetTitle')}
        subtitle={planText('plan.stage.seedSheetBody')}
        footer={
          <Button
            title={t('common.close')}
            variant="secondary"
            trailingArrow={false}
            onPress={() => setSeedSheet(false)}
          />
        }
      >
        <View style={styles.sheetBody}>
          {SEED_OPTIONS.map(option => {
            const selected = stage.seedId === option.id;
            return (
              <PressableRow
                key={option.id}
                label={planText(option.labelKey)}
                onPress={() => {
                  actions.setStageSeed(stageId, option.id);
                  setSeedSheet(false);
                }}
                style={[styles.seedOption, selected && styles.seedOptionSelected]}
              >
                <Text style={styles.seedOptionLabel}>{planText(option.labelKey)}</Text>
                {selected ? <Icon name="check" size={16} color="#30432B" strokeWidth={2} /> : null}
              </PressableRow>
            );
          })}
          <PressableRow
            label={t('stage.seed.awaiting')}
            onPress={() => {
              actions.setStageSeed(stageId, null);
              setSeedSheet(false);
            }}
            style={styles.seedOption}
          >
            <Text style={styles.seedClear}>{t('stage.seed.awaiting')}</Text>
          </PressableRow>
        </View>
      </Sheet>

      <Sheet
        visible={sourceSheet}
        onClose={() => setSourceSheet(false)}
        title={planText('plan.stage.sourceTitle')}
        footer={
          <Button
            title={t('common.close')}
            variant="secondary"
            trailingArrow={false}
            onPress={() => setSourceSheet(false)}
          />
        }
      >
        <View style={styles.sheetBody}>
          <Text style={styles.sheetText}>{planText('plan.stage.sourceBody')}</Text>
          {STAGE_IDS.map((id, position) => (
            <View key={id} style={styles.sourceRow}>
              <Text style={styles.sourceOrdinal}>{String(position + 1).padStart(2, '0')}</Text>
              <Text style={styles.sourceLabel}>
                {t(`plan.stage.${id}.title` as const)}
              </Text>
              {id === stageId ? (
                <Icon name="check" size={14} color="#52664D" strokeWidth={2} />
              ) : null}
            </View>
          ))}
          <Text style={styles.sheetNote}>{planText('plan.stage.sourceNote')}</Text>
        </View>
      </Sheet>

      <Sheet
        visible={doneSheet}
        onClose={() => setDoneSheet(false)}
        title={planText('plan.stage.doneSheetTitle')}
        footer={
          <View style={styles.actionsRow}>
            <View style={styles.actionCell}>
              <Button
                title={planText('plan.stage.doneConfirm')}
                onPress={confirmDone}
              />
            </View>
            <View style={styles.actionCell}>
              <Button
                title={t('common.cancel')}
                variant="secondary"
                trailingArrow={false}
                onPress={() => setDoneSheet(false)}
              />
            </View>
          </View>
        }
      >
        <View style={styles.sheetBody}>
          <Text style={styles.sheetText}>{planText('plan.stage.doneSheetBody')}</Text>
          <Text style={styles.sheetNote}>{t('stage.seed.footer')}</Text>
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 24, alignSelf: 'flex-start' },
  backText: { fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 17, color: '#65775B' },

  taskCard: { backgroundColor: '#F1F6EA', borderRadius: 18, padding: 16, gap: 10 },
  taskTitle: { fontFamily: 'System', fontWeight: '600', fontSize: 21, lineHeight: 29, color: '#30472B' },
  taskBody: { fontFamily: 'System', fontWeight: '400', fontSize: 13, lineHeight: 18, color: '#636f57' },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 40,
    borderTopWidth: 0,
    borderTopColor: '#DFE6D8',
    paddingTop: 10,
  },
  taskRowPlain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    minHeight: 28,
    paddingBottom: 4,
  },
  taskLabel: { fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 17, color: '#66705d' },
  taskValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  taskValue: { fontFamily: 'System', fontWeight: '500', fontSize: 12, lineHeight: 17, color: '#455C3C', textAlign: 'right' },

  evidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingVertical: 14 },
  evidenceLabel: { flex: 1, fontFamily: 'System', fontWeight: '500', fontSize: 14, lineHeight: 20, color: '#4F6843' },

  quoteField: {
    backgroundColor: '#F6F8F3',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  quoteLabel: { fontFamily: 'System', fontWeight: '400', fontSize: 11, lineHeight: 15, color: '#666f63' },
  quoteInput: {
    padding: 0,
    margin: 0,
    fontFamily: 'System', fontWeight: '400',
    fontSize: 14,
    lineHeight: 19,
    color: '#243527',
    includeFontPadding: false,
  },
  quoteError: { fontFamily: 'System', fontWeight: '400', fontSize: 11, lineHeight: 15, color: '#8B4A3A' },
  savedNote: { fontFamily: 'System', fontWeight: '400', fontSize: 11, lineHeight: 15, color: '#5A714C' },

  actionsRow: { flexDirection: 'row', gap: 12 },
  actionCell: { flex: 1 },
  clearRow: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' },
  clearText: { fontFamily: 'System', fontWeight: '500', fontSize: 12, lineHeight: 17, color: '#526C43' },
  footer: { fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 17, color: '#6c7564' },

  lockedPanel: { backgroundColor: '#F6F0DF', borderRadius: 18, padding: 16, gap: 10 },
  lockedHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lockedTitle: { fontFamily: 'System', fontWeight: '600', fontSize: 14, lineHeight: 20, color: '#78643A' },
  lockedBody: { fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 17, color: '#76694C' },

  sheetBody: { gap: 10 },
  sheetText: { fontFamily: 'System', fontWeight: '400', fontSize: 13, lineHeight: 19, color: '#687560' },
  sheetNote: { fontFamily: 'System', fontWeight: '400', fontSize: 11, lineHeight: 15, color: '#697462' },

  seedOption: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: '#FEFFFC',
    borderWidth: 1,
    borderColor: '#DFE6D8',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  seedOptionSelected: { backgroundColor: '#EEF4E7', borderColor: '#C4DEA9' },
  seedOptionLabel: { fontFamily: 'System', fontWeight: '500', fontSize: 14, lineHeight: 20, color: '#30432B' },
  seedClear: { fontFamily: 'System', fontWeight: '400', fontSize: 13, lineHeight: 18, color: '#687560' },

  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: 0,
    borderBottomColor: '#E6EBE1',
  },
  sourceOrdinal: { fontFamily: 'System', fontWeight: '500', fontSize: 11, lineHeight: 15, color: '#8A9A80', width: 20 },
  sourceLabel: { flex: 1, fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 17, color: '#30432B' },
});

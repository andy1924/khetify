import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useDemo } from '../../demo';
import {
  formatDateLabel,
  formatRupees,
  selectMarketRows,
  type MarketCosts,
  type MarketQuote,
} from '../../demo';
import { useT } from '../../locales';
import { Button, Icon, Screen, Text } from './ui';
import { Banner, ScreenHeading, Sheet, StatusChip, TextFieldRow } from './components';
import { toolCopy } from './strings';
import { useToolRecorder } from './history';

const COST_FIELDS: { key: keyof MarketCosts; labelKey: 'mandi.transport' | 'mandi.handling' | 'mandi.fees' }[] = [
  { key: 'transport', labelKey: 'mandi.transport' },
  { key: 'handling', labelKey: 'mandi.handling' },
  { key: 'fees', labelKey: 'mandi.fees' },
];

/** 12 · Mandi comparison — editable quantity/costs, deterministic local sort, unknown stays unknown. */
export function MandiScreen() {
  const { state, actions } = useDemo();
  const recordToolUse = useToolRecorder();
  const t = useT();
  const params = useLocalSearchParams<{ commodity?: string }>();
  const rows = selectMarketRows(state);
  const bestId = rows.find(row => row.net !== null)?.id ?? null;

  const [sheetMarket, setSheetMarket] = useState<MarketQuote['id'] | null>(null);
  const [quantityDraft, setQuantityDraft] = useState(String(state.market.quantityQuintals));
  const [costDrafts, setCostDrafts] = useState<Record<keyof MarketCosts, string>>({
    transport: '',
    handling: '',
    fees: '',
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [recorded, setRecorded] = useState(false);

  const commodity = params.commodity ?? state.market.commodity;
  const quoteDate = state.market.quotes[0]?.quotedOn;

  const selectedQuote = useMemo(
    () => state.market.quotes.find(quote => quote.id === sheetMarket) ?? null,
    [sheetMarket, state.market.quotes],
  );

  const openSheet = (marketId: MarketQuote['id']) => {
    const quote = state.market.quotes.find(item => item.id === marketId);
    setQuantityDraft(String(state.market.quantityQuintals));
    setCostDrafts({
      transport: quote?.costs.transport !== null && quote?.costs.transport !== undefined ? String(quote.costs.transport) : '',
      handling: quote?.costs.handling !== null && quote?.costs.handling !== undefined ? String(quote.costs.handling) : '',
      fees: quote?.costs.fees !== null && quote?.costs.fees !== undefined ? String(quote.costs.fees) : '',
    });
    setErrors([]);
    setSheetMarket(marketId);
  };

  const confirmSheet = () => {
    const nextErrors: string[] = [];
    const quantity = Number(quantityDraft.trim());
    if (!Number.isFinite(quantity) || quantity <= 0) nextErrors.push(toolCopy('mandi.quantityError'));

    const parsed: Partial<Record<keyof MarketCosts, number | null>> = {};
    for (const field of COST_FIELDS) {
      const raw = costDrafts[field.key].trim();
      if (raw === '') {
        parsed[field.key] = null;
        continue;
      }
      if (!/^\d*\.?\d*$/.test(raw) || !Number.isFinite(Number(raw))) {
        nextErrors.push(toolCopy('mandi.costError'));
        break;
      }
      parsed[field.key] = Number(raw);
    }

    if (nextErrors.length > 0) {
      setErrors(nextErrors);
      return;
    }

    actions.setMarketQuantity(quantity);
    if (sheetMarket) {
      for (const field of COST_FIELDS) {
        actions.setMarketCost(sheetMarket, field.key, parsed[field.key] ?? null);
      }
    }
    recordToolUse('mandi', 'tools.mandi.title', `${commodity} · ${quantity} q`);
    setRecorded(true);
    setSheetMarket(null);
  };

  if (commodity !== state.market.commodity) {
    return <Screen>
      <ScreenHeading title={t('mandi.title')} subtitle={commodity} />
      <Banner title={t('common.notAvailable')} body={t('mandi.unsupported', { commodity })} />
      <Button title={t('mandi.wheatFixture')} onPress={() => router.setParams({ commodity: state.market.commodity })} />
    </Screen>;
  }

  return (
    <Screen>
      <ScreenHeading
        title={t('mandi.title')}
        subtitle={t('mandi.subtitle', {
          crop: commodity,
          grade: state.market.grade,
          quantity: state.market.quantityQuintals,
        })}
      />

      <View style={styles.stale}>
        <Text style={styles.staleTitle}>
          {t('mandi.stale', { date: quoteDate ? formatDateLabel(quoteDate) : t('common.unknown') })}
        </Text>
        <Text style={styles.staleBody}>{t('mandi.staleBody')}</Text>
      </View>

      <View style={styles.sortRow}>
        <Icon name="arrow-down-wide-narrow" size={18} color="#52664D" />
        <Text style={styles.sortLabel}>
          {t('mandi.sorted', { quantity: state.market.quantityQuintals })}
        </Text>
      </View>

      {rows.map(row => {
        const best = row.id === bestId && row.net !== null;
        const knownCosts = row.costsTotal !== null;
        return (
          <View
            key={row.id}
            style={[styles.marketCard, best ? styles.bestCard : styles.otherCard]}
          >
            <View style={styles.marketHead}>
              <Text style={styles.marketName}>{row.name}</Text>
              {best ? <StatusChip label={t('mandi.best')} tone="best" /> : null}
            </View>

            <View style={styles.priceNetRow}>
              <Text style={styles.price}>{t('mandi.price', { price: formatRupees(row.pricePerQuintal) })}</Text>
              <Text style={[styles.net, row.net === null && styles.netUnknown]}>
                {row.net === null ? t('common.incomplete') : `₹ ${formatRupees(row.net)}`}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                knownCosts
                  ? t('mandi.costs', { costs: formatRupees(row.costsTotal ?? 0) })
                  : t('mandi.costMissing')
              }
              onPress={() => openSheet(row.id)}
              hitSlop={6}
              style={styles.costRow}
            >
              <Text style={styles.costText}>
                {knownCosts
                  ? t('mandi.costs', { costs: formatRupees(row.costsTotal ?? 0) })
                  : t('mandi.costMissing')}
              </Text>
            </Pressable>

          </View>
        );
      })}

      <Text style={styles.footer}>{t('mandi.footer')}</Text>

      {recorded ? (
        <View style={styles.recordedRow}>
          <Icon name="check" size={15} color="#52664D" />
          <Text style={styles.recordedText}>{toolCopy('mandi.recorded')}</Text>
        </View>
      ) : null}

      <Sheet
        visible={sheetMarket !== null}
        onClose={() => setSheetMarket(null)}
        title={
          selectedQuote ? toolCopy('mandi.marketSheet', { market: selectedQuote.name }) : t('mandi.editTitle')
        }
        footer={
          <Button title={toolCopy('mandi.confirm')} trailingArrow={false} onPress={confirmSheet} />
        }
      >
        <TextFieldRow
          label={t('mandi.quantity')}
          value={quantityDraft}
          onChangeText={setQuantityDraft}
          keyboardType="decimal-pad"
          placeholder="10"
        />
        {COST_FIELDS.map(field => (
          <View key={field.key} style={styles.costFieldRow}>
            <View style={styles.costField}>
              <TextFieldRow
                label={t(field.labelKey)}
                value={costDrafts[field.key]}
                onChangeText={text =>
                  setCostDrafts(current => ({ ...current, [field.key]: text }))
                }
                keyboardType="number-pad"
                placeholder={t('mandi.costPlaceholder')}
              />
            </View>
            {selectedQuote && selectedQuote.costs[field.key] !== null ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t(field.labelKey)}: ${t('common.unknown')}`}
                onPress={() => setCostDrafts(current => ({ ...current, [field.key]: '' }))}
                hitSlop={8}
                style={styles.clearButton}
              >
                <Icon name="minus" size={16} color="#657360" />
              </Pressable>
            ) : null}
          </View>
        ))}

        {errors.map(message => (
          <Banner key={message} body={message} icon="circle-alert" />
        ))}

        <View style={styles.noteRow}>
          <Icon name="info" size={15} color="#8D9A81" />
          <Text style={styles.noteText}>{t('mandi.incompleteNote')}</Text>
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stale: { backgroundColor: '#F6F0E0', borderRadius: 18, padding: 12, gap: 6 },
  staleTitle: { fontFamily: 'System', fontWeight: '500', fontSize: 12, lineHeight: 17, color: '#7c6a3e' },
  staleBody: { fontFamily: 'System', fontWeight: '400', fontSize: 11, lineHeight: 15, color: '#756a4c' },
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 18 },
  sortLabel: { flex: 1, fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 17, color: '#637656' },

  marketCard: { borderRadius: 18, padding: 14, gap: 8 },
  bestCard: { backgroundColor: '#EAF2DE' },
  otherCard: { backgroundColor: '#F4F7EF' },
  marketHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  marketName: { fontFamily: 'System', fontWeight: '600', fontSize: 15, lineHeight: 21, color: '#4B673D' },
  priceNetRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { flex: 1, fontFamily: 'System', fontWeight: '400', fontSize: 13, lineHeight: 18, color: '#626c56' },
  net: {
    fontFamily: 'System', fontWeight: '600',
    fontSize: 21,
    lineHeight: 29,
    color: '#4B6A3A',
    textAlign: 'right',
  },
  netUnknown: { color: '#4B6A3A' },
  costRow: { minHeight: 32, justifyContent: 'center' },
  costText: { fontFamily: 'System', fontWeight: '400', fontSize: 11, lineHeight: 15, color: '#646e5a' },

  footer: { fontFamily: 'System', fontWeight: '400', fontSize: 11, lineHeight: 15, color: '#697560' },
  recordedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordedText: { flex: 1, fontFamily: 'System', fontWeight: '400', fontSize: 11, lineHeight: 15, color: '#687560' },

  costFieldRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  costField: { flex: 1 },
  clearButton: {
    width: 44,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F4F7EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  noteText: { flex: 1, fontFamily: 'System', fontWeight: '400', fontSize: 11, lineHeight: 15, color: '#687560' },
});

import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useDemoSlices, useDemoActions } from '../../demo';
import {
  formatRupees,
  selectMarketRows,
  type MarketCosts,
  type MarketQuote,
} from '../../demo';
import { useT } from '../../locales';
import { Button, Icon, Screen, Text } from './ui';
import { useAccentPalette, useStyles, type AccentPalette } from '../../ui/AccentTheme';
import { Banner, ScreenHeading, Sheet, StatusChip, TextFieldRow } from './components';
import { toolCopy } from './strings';
import { useToolRecorder } from './history';

const COST_FIELDS: { key: keyof MarketCosts; labelKey: 'market.transport' | 'market.handling' | 'market.fees' }[] = [
  { key: 'transport', labelKey: 'market.transport' },
  { key: 'handling', labelKey: 'market.handling' },
  { key: 'fees', labelKey: 'market.fees' },
];

/** 12 · Market comparison — editable quantity/costs, deterministic local sort, unknown stays unknown. */
export function MarketScreen() {
  const palette = useAccentPalette();
  const styles = useStyles(makeStyles);
  const state = useDemoSlices(['market'] as const);
  const actions = useDemoActions();
  const recordToolUse = useToolRecorder();
  const t = useT();
  const params = useLocalSearchParams<{ commodity?: string }>();
  // Derived/sorted rows only change with the market slice.
  const rows = useMemo(() => selectMarketRows(state), [state]);
  const bestId = rows.find(row => row.net !== null)?.id ?? null;

  const [sheetMarket, setSheetMarket] = useState<MarketQuote['id'] | null>(null);
  const [quantityDraft, setQuantityDraft] = useState(String(state.market.quantityQuintals));
  const [costDrafts, setCostDrafts] = useState<Record<keyof MarketCosts, string>>({
    transport: '',
    handling: '',
    fees: '',
  });
  const [errors, setErrors] = useState<string[]>([]);

  const commodity = params.commodity ?? state.market.commodity;

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
    if (!Number.isFinite(quantity) || quantity <= 0) nextErrors.push(toolCopy('market.quantityError'));

    const parsed: Partial<Record<keyof MarketCosts, number | null>> = {};
    for (const field of COST_FIELDS) {
      const raw = costDrafts[field.key].trim();
      if (raw === '') {
        parsed[field.key] = null;
        continue;
      }
      if (!/^\d*\.?\d*$/.test(raw) || !Number.isFinite(Number(raw))) {
        nextErrors.push(toolCopy('market.costError'));
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
    recordToolUse('market', 'tools.market.title', `${commodity} · ${quantity} q`);
    setSheetMarket(null);
  };

  if (commodity !== state.market.commodity) {
    return <Screen>
      <ScreenHeading title={t('market.title')} subtitle={commodity} />
      <Banner title={t('common.notAvailable')} body={t('market.unsupported', { commodity })} />
      <Button title={t('market.wheatFixture')} onPress={() => router.setParams({ commodity: state.market.commodity })} />
    </Screen>;
  }

  return (
    <Screen>
      <ScreenHeading
        title={t('market.title')}
        subtitle={t('market.subtitle', {
          crop: commodity,
          grade: state.market.grade,
          quantity: state.market.quantityQuintals,
        })}
      />

      <View style={styles.sortRow}>
        <Icon name="arrow-down-wide-narrow" size={18} color={palette.icon} />
        <Text style={styles.sortLabel}>
          {t('market.sorted', { quantity: state.market.quantityQuintals })}
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
              {best ? <StatusChip label={t('market.best')} tone="best" /> : null}
            </View>

            <View style={styles.priceNetRow}>
              <Text style={styles.price}>{t('market.price', { price: formatRupees(row.pricePerQuintal) })}</Text>
              <Text style={[styles.net, row.net === null && styles.netUnknown]}>
                {row.net === null ? t('common.incomplete') : `₹ ${formatRupees(row.net)}`}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                knownCosts
                  ? t('market.costs', { costs: formatRupees(row.costsTotal ?? 0) })
                  : t('market.costMissing')
              }
              onPress={() => openSheet(row.id)}
              hitSlop={6}
              style={styles.costRow}
            >
              <Text style={styles.costText}>
                {knownCosts
                  ? t('market.costs', { costs: formatRupees(row.costsTotal ?? 0) })
                  : t('market.costMissing')}
              </Text>
            </Pressable>

          </View>
        );
      })}

      <Sheet
        visible={sheetMarket !== null}
        onClose={() => setSheetMarket(null)}
        title={
          selectedQuote ? toolCopy('market.marketSheet', { market: selectedQuote.name }) : t('market.editTitle')
        }
        footer={
          <Button title={toolCopy('market.confirm')} trailingArrow={false} onPress={confirmSheet} />
        }
      >
        <TextFieldRow
          label={t('market.quantity')}
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
                placeholder={t('market.costPlaceholder')}
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
                <Icon name="minus" size={16} color={palette.icon} />
              </Pressable>
            ) : null}
          </View>
        ))}

        {errors.map(message => (
          <Banner key={message} body={message} icon="circle-alert" />
        ))}

        <View style={styles.noteRow}>
          <Icon name="info" size={15} color={palette.icon} />
          <Text style={styles.noteText}>{t('market.incompleteNote')}</Text>
        </View>
      </Sheet>
    </Screen>
  );
}

const makeStyles = (p: AccentPalette) => StyleSheet.create({
  sortRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 18 },
  sortLabel: { flex: 1, fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 17, color: p.muted },

  marketCard: { borderRadius: 18, padding: 14, gap: 8 },
  bestCard: { backgroundColor: p.surface },
  otherCard: { backgroundColor: p.surfaceSoft },
  marketHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  marketName: { fontFamily: 'System', fontWeight: '600', fontSize: 15, lineHeight: 21, color: p.deep },
  priceNetRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { flex: 1, fontFamily: 'System', fontWeight: '400', fontSize: 13, lineHeight: 18, color: p.muted },
  net: {
    fontFamily: 'System', fontWeight: '600',
    fontSize: 21,
    lineHeight: 29,
    color: p.deep,
    textAlign: 'right',
  },
  netUnknown: { color: p.deep },
  costRow: { minHeight: 32, justifyContent: 'center' },
  costText: { fontFamily: 'System', fontWeight: '400', fontSize: 11, lineHeight: 15, color: p.muted },

  costFieldRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  costField: { flex: 1 },
  clearButton: {
    width: 44,
    height: 48,
    borderRadius: 12,
    backgroundColor: p.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  noteText: { flex: 1, fontFamily: 'System', fontWeight: '400', fontSize: 11, lineHeight: 15, color: p.icon },
});

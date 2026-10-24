import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useT } from '../../locales';
import type { ToolKind } from '../../demo';
import type { StringKey } from '../../locales';
import { formatDateLabel } from '../../demo';
import { Icon, Screen, Text } from './ui';
import { useAccentPalette, useStyles, type AccentPalette } from '../../ui/AccentTheme';
import { ScreenHeading, Sheet, StatusChip, Button } from './components';
import { useToolHistory } from './history';
import { toolCopy } from './strings';

type ToolStatus = 'ready' | 'limited' | 'unavailable';

interface ToolEntry {
  kind: ToolKind;
  titleKey: StringKey;
  detailKey: StringKey;
  status: ToolStatus;
  icon: string;
  route?: string;
}

const TOOLS: ToolEntry[] = [
  { kind: 'soil', titleKey: 'tools.soil.title', detailKey: 'tools.soil.detail', status: 'ready', icon: 'flask-conical', route: '/tools/soil' },
  { kind: 'cropPhoto', titleKey: 'tools.cropPhoto.title', detailKey: 'tools.cropPhoto.detail', status: 'limited', icon: 'scan-line', route: '/tools/photo?tool=cropPhoto' },
  { kind: 'grainQuality', titleKey: 'tools.grainQuality.title', detailKey: 'tools.grainQuality.detail', status: 'unavailable', icon: 'wheat' },
  { kind: 'grainId', titleKey: 'tools.grainId.title', detailKey: 'tools.grainId.detail', status: 'limited', icon: 'scan' },
  { kind: 'forecast', titleKey: 'tools.forecast.title', detailKey: 'tools.forecast.detail', status: 'unavailable', icon: 'chart-no-axes-combined', route: '/tools/forecast' },
  { kind: 'market', titleKey: 'tools.market.title', detailKey: 'tools.market.detail', status: 'ready', icon: 'store', route: '/tools/market' },
  { kind: 'satellite', titleKey: 'tools.satellite.title', detailKey: 'tools.satellite.detail', status: 'limited', icon: 'satellite', route: '/tools/satellite' },
];

const statusLabel: Record<ToolStatus, StringKey> = {
  ready: 'tools.status.ready',
  limited: 'tools.status.limited',
  unavailable: 'tools.status.unavailable',
};

const statusTone = { ready: 'ready', limited: 'limited', unavailable: 'unavailable' } as const;

const KIND_LABEL: Record<ToolKind, StringKey> = {
  soil: 'tools.soil.title',
  cropPhoto: 'tools.cropPhoto.title',
  grainQuality: 'tools.grainQuality.title',
  grainId: 'tools.grainId.title',
  forecast: 'tools.forecast.title',
  market: 'tools.market.title',
  satellite: 'tools.satellite.title',
};

/** 07 · Independent tools — six entries with capability states and local history. */
export function ToolsScreen() {
  const styles = useStyles(makeStyles);
  const palette = useAccentPalette();
  const t = useT();
  const history = useToolHistory();
  const [sheetTool, setSheetTool] = useState<ToolEntry | null>(null);

  const open = (tool: ToolEntry) => {
    if (tool.route) {
      router.push(tool.route as never);
      return;
    }
    setSheetTool(tool);
  };

  return (
    <Screen>
      <ScreenHeading
        title={t('tools.title')}
        subtitle={t('tools.subtitle')}
        titleColor={palette.ink}
        subtitleSize={14}
      />

      <View>
        {TOOLS.filter(tool => tool.route && tool.kind !== 'forecast').map(tool => {
          const usable = tool.status !== 'unavailable';
          return (
            <Pressable
              key={tool.titleKey}
              accessibilityRole="button"
              accessibilityLabel={`${t(tool.titleKey)}. ${t(tool.detailKey)}.`}
              onPress={() => open(tool)}
              android_ripple={{ color: palette.surface }}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View style={styles.iconCell}>
                <Icon name={tool.icon} size={24} color={usable ? palette.icon : palette.iconFaint} strokeWidth={1.6} />
              </View>
              <View style={styles.labels}>
                <Text style={styles.title}>{t(tool.titleKey)}</Text>
              </View>
              {tool.status === 'ready' ? <Icon name="arrow-right" size={18} color={palette.iconFaint} /> : null}
            </Pressable>
          );
        })}
      </View>

      {history.length > 0 ? (
        <View style={styles.history}>
          <Text style={styles.eyebrow}>{toolCopy('tools.recent')}</Text>
          {history.map(entry => (
            <View key={entry.id} style={styles.historyRow}>
              <View style={styles.historyLabel}>
                <Text style={styles.subStrong}>{t(KIND_LABEL[entry.tool])}</Text>
                <Text style={styles.sub}>{entry.summary}</Text>
              </View>
              <Text style={styles.meta}>{formatDateLabel(isoDay(entry.createdAt))}</Text>
            </View>
          ))}
          <Text style={styles.meta}>{toolCopy('tools.recentNote')}</Text>
        </View>
      ) : null}

      <Sheet
        visible={sheetTool !== null}
        onClose={() => setSheetTool(null)}
        title={sheetTool ? t(sheetTool.titleKey) : ''}
        footer={
          <Button
            title={t('common.close')}
            variant="secondary"
            trailingArrow={false}
            onPress={() => setSheetTool(null)}
          />
        }
      >
        {sheetTool ? (
          <View style={styles.sheetBody}>
            <StatusChip label={t(statusLabel[sheetTool.status])} tone={statusTone[sheetTool.status]} />
            <Text style={styles.body13}>{t(sheetTool.detailKey)}</Text>
            <Text style={styles.body13}>This feature is being prepared.</Text>
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

function isoDay(timestamp: number): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

const makeStyles = (p: AccentPalette) => StyleSheet.create({
  row: { minHeight: 80, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, marginBottom: 10, borderRadius: 18, backgroundColor: p.surfaceSoft },
  pressed: { backgroundColor: p.surface },
  iconCell: { width: 26, height: 24, justifyContent: 'center' },
  labels: { flex: 1, gap: 5 },
  title: { fontFamily: 'System', fontSize: 17, lineHeight: 23, color: p.ink, fontWeight: '600' },
  sub: { fontFamily: 'System', fontSize: 14, lineHeight: 20, color: p.muted },
  subStrong: { fontFamily: 'System', fontWeight: '500', fontSize: 12, lineHeight: 17, color: p.ink },
  meta: { fontFamily: 'System', fontWeight: '400', fontSize: 11, lineHeight: 15, color: p.icon },
  eyebrow: { fontFamily: 'System', fontWeight: '600', fontSize: 10, lineHeight: 14, letterSpacing: 0.4, color: p.icon },
  body13: { fontFamily: 'System', fontWeight: '400', fontSize: 13, lineHeight: 18, color: p.icon },
  note: { fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 18, color: p.icon },
  history: { gap: 12, paddingTop: 4 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyLabel: { flex: 1, gap: 2 },
  sheetBody: { gap: 10 },
});

import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useT } from '../../locales';
import type { ToolKind } from '../../demo';
import type { StringKey } from '../../locales';
import { formatDateLabel } from '../../demo';
import { Icon, Screen, Text } from './ui';
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
  { kind: 'mandi', titleKey: 'tools.mandi.title', detailKey: 'tools.mandi.detail', status: 'ready', icon: 'store', route: '/tools/mandi' },
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
  mandi: 'tools.mandi.title',
};

/** 07 · Independent tools — six entries with capability states and local history. */
export function ToolsScreen() {
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
        titleColor="#263B29"
        subtitleSize={14}
      />

      <View>
        {TOOLS.map(tool => {
          const usable = tool.status !== 'unavailable';
          return (
            <Pressable
              key={tool.kind}
              accessibilityRole="button"
              accessibilityLabel={`${t(tool.titleKey)}. ${t(tool.detailKey)}. ${t(statusLabel[tool.status])}.`}
              onPress={() => open(tool)}
              android_ripple={{ color: 'rgba(38, 59, 41, 0.05)' }}
              style={({ pressed }) => [styles.row, styles.rowHairline, pressed && styles.pressed]}
            >
              <View style={styles.iconCell}>
                <Icon name={tool.icon} size={24} color={usable ? '#6B8C52' : '#A3AF99'} strokeWidth={1.6} />
              </View>
              <View style={styles.labels}>
                <Text style={styles.title}>{t(tool.titleKey)}</Text>
                <Text style={styles.sub}>{t(tool.detailKey)}</Text>
              </View>
              <StatusChip label={t(statusLabel[tool.status])} tone={statusTone[tool.status]} />
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.note}>{t('tools.importNote')}</Text>

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
            <Text style={styles.body13}>{t('tools.unavailableNote')}</Text>
            {sheetTool.kind === 'grainId' ? (
              <Text style={styles.meta}>{toolCopy('tools.grainId.sheetBody')}</Text>
            ) : null}
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

const styles = StyleSheet.create({
  row: { minHeight: 86, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  rowHairline: { borderBottomWidth: 1, borderBottomColor: '#DFE6D8' },
  pressed: { backgroundColor: 'rgba(38, 59, 41, 0.03)' },
  iconCell: { width: 26, height: 24, justifyContent: 'center' },
  labels: { flex: 1, gap: 5 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 16, lineHeight: 22, color: '#263B29' },
  sub: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, color: '#657360' },
  subStrong: { fontFamily: 'Inter_500Medium', fontSize: 12, lineHeight: 17, color: '#263B29' },
  meta: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 15, color: '#697462' },
  eyebrow: { fontFamily: 'Inter_600SemiBold', fontSize: 10, lineHeight: 14, letterSpacing: 0.4, color: '#657360' },
  body13: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18, color: '#687560' },
  note: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, color: '#657360' },
  history: { gap: 12, paddingTop: 4 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyLabel: { flex: 1, gap: 2 },
  sheetBody: { gap: 10 },
});

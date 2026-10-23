import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';
import { useDemo } from '../../demo';
import { useT } from '../../locales';
import { Button, Icon, Screen, Text } from './ui';
import { Banner, ScreenHeading, Sheet, StatusChip } from './components';
import { toolCopy } from './strings';
import { useToolRecorder } from './history';

type PhotoTool = 'cropPhoto' | 'grainId' | 'grainQuality';

interface Fixture {
  id: string;
  title: string;
  kind: 'leaf' | 'grain' | 'grainClose';
  note: string;
}

/**
 * Feature-local vector fixture artwork. Drawn natively with react-native-svg,
 * never a reference screenshot and never a real capture. No camera, gallery or
 * upload permission is requested.
 */
const FIXTURES: Fixture[] = [
  {
    id: 'fixture-leaf',
    title: 'Leaf · demo',
    kind: 'leaf',
    note: 'Illustrated leaf with pale spots. Not a photograph.',
  },
  {
    id: 'fixture-grain-lot',
    title: 'Grain lot · demo',
    kind: 'grain',
    note: 'Illustrated grain lot on a plain surface.',
  },
  {
    id: 'fixture-grain-close',
    title: 'Single grain · demo',
    kind: 'grainClose',
    note: 'Illustrated single-grain close-up.',
  },
];

const TOOL_COPY: Record<PhotoTool, { titleKey: 'tools.cropPhoto.title' | 'tools.grainId.title' | 'tools.grainQuality.title'; detailKey: 'tools.cropPhoto.detail' | 'tools.grainId.detail' | 'tools.grainQuality.detail'; state: 'ready' | 'limited' | 'unavailable' }> = {
  cropPhoto: { titleKey: 'tools.cropPhoto.title', detailKey: 'tools.cropPhoto.detail', state: 'limited' },
  grainId: { titleKey: 'tools.grainId.title', detailKey: 'tools.grainId.detail', state: 'limited' },
  grainQuality: { titleKey: 'tools.grainQuality.title', detailKey: 'tools.grainQuality.detail', state: 'unavailable' },
};

/** Photo-driven tools: local fixture picker only, no diagnostics, no permissions. */
export function PhotoToolScreen() {
  const { state } = useDemo();
  const recordToolUse = useToolRecorder();
  const t = useT();
  const params = useLocalSearchParams<{ tool?: string }>();
  const tool: PhotoTool =
    params.tool === 'grainId' || params.tool === 'grainQuality' ? params.tool : 'cropPhoto';
  const meta = TOOL_COPY[tool];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** Sheet-local candidate; only Confirm commits it to `selectedId`. */
  const [draftId, setDraftId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [recorded, setRecorded] = useState(false);

  const selected = useMemo(
    () => FIXTURES.find(fixture => fixture.id === selectedId) ?? null,
    [selectedId],
  );

  const stateTone = meta.state === 'unavailable' ? 'unavailable' : 'limited';
  const stateLabel =
    meta.state === 'unavailable' ? t('tools.status.unavailable') : t('tools.status.limited');

  const openPicker = () => {
    setDraftId(selectedId);
    setPickerOpen(true);
  };

  const closePicker = () => {
    setDraftId(selectedId);
    setPickerOpen(false);
  };

  const commitPicker = () => {
    if (draftId) setSelectedId(draftId);
    setRecorded(false);
    setPickerOpen(false);
  };

  const confirmSelection = () => {
    if (!selected) return;
    recordToolUse(
      tool,
      meta.titleKey,
      tool === 'grainId' ? 'Demo fixture preview' : `${selected.title} · preview only`,
    );
    setRecorded(true);
    setPickerOpen(false);
  };

  return (
    <Screen>
      <ScreenHeading title={t(meta.titleKey)} subtitle={t(meta.detailKey)} />

      <StatusChip label={stateLabel} tone={stateTone} />

      {tool === 'grainQuality' ? (
        <View style={styles.unavailableBlock}>
          <Text style={styles.body}>{toolCopy('photo.unavailableBody')}</Text>
          <Text style={styles.footnote}>{t('tools.unavailableNote')}</Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: tool === 'grainQuality' }}
        accessibilityLabel={selected ? toolCopy('photo.change') : toolCopy('photo.pick')}
        disabled={tool === 'grainQuality'}
        onPress={openPicker}
        style={({ pressed }) => [styles.previewCard, pressed && { opacity: 0.9 }]}
      >
        {selected ? (
          <FixtureArt kind={selected.kind} />
        ) : (
          <View style={styles.previewEmpty}>
            <Icon
              name={tool === 'grainQuality' ? 'wheat' : 'camera'}
              size={42}
              color="#A3AF99"
              strokeWidth={1.3}
            />
            <Text style={styles.previewEmptyText}>
              {tool === 'grainQuality' ? t('tools.unavailableNote') : toolCopy('photo.empty')}
            </Text>
          </View>
        )}
      </Pressable>

      <View style={styles.previewMeta}>
        <View style={styles.previewMetaText}>
          <Text style={styles.previewTitle}>{selected ? selected.title : t('common.notAvailable')}</Text>
          <Text style={styles.footnote}>
            {selected ? toolCopy('photo.fixture') : t('tools.grainQuality.detail')}
          </Text>
        </View>
        {tool !== 'grainQuality' ? (
          <Button
            title={selected ? toolCopy('photo.change') : toolCopy('photo.pick')}
            variant="secondary"
            trailingArrow={false}
            fullWidth={false}
            onPress={openPicker}
          />
        ) : null}
      </View>

      {selected && tool !== 'grainQuality' ? (
        <View style={styles.limitsCard}>
          <Text style={styles.limitsTitle}>{toolCopy('photo.limitedTitle')}</Text>
          <Text style={styles.body}>{toolCopy('photo.limitedBody')}</Text>
          <View style={styles.attributeRow}>
            <Icon name="info" size={16} color="#8D9A81" />
            <Text style={styles.attribute}>
              {selected.kind === 'leaf'
                ? toolCopy('photo.inspect.leaf')
                : selected.kind === 'grain'
                  ? toolCopy('photo.inspect.grain')
                  : toolCopy('photo.inspect.grainId')}
            </Text>
          </View>
        </View>
      ) : null}

      {tool !== 'grainQuality' ? (
        <Banner body={toolCopy('photo.noDiagnosis')} icon="shield-check" />
      ) : null}

      {selected && tool !== 'grainQuality' ? (
        <View style={styles.actions}>
          <Text style={styles.contextLine}>
            {`${state.farm.crop} · ${state.farm.season} · ${toolCopy('photo.fixture')}`}
          </Text>
          <Button
            title={toolCopy('photo.continue')}
            trailingArrow={false}
            onPress={confirmSelection}
          />
          <Button
            title={toolCopy('photo.remove')}
            variant="ghost"
            trailingArrow={false}
            onPress={() => {
              setSelectedId(null);
            }}
          />
        </View>
      ) : null}

      {recorded ? (
        <View style={styles.recordedRow}>
          <Icon name="check" size={15} color="#52664D" />
          <Text style={styles.footnote}>{toolCopy('photo.recorded')}</Text>
        </View>
      ) : null}

      <Sheet
        visible={pickerOpen}
        onClose={closePicker}
        title={toolCopy('photo.pickerTitle')}
        footer={
          <Button
            title={t('common.confirm')}
            trailingArrow={false}
            disabled={!draftId}
            onPress={commitPicker}
          />
        }
      >
        <Text style={styles.footnote}>{toolCopy('photo.pickerNote')}</Text>
        <View style={styles.fixtureGrid}>
          {FIXTURES.map(fixture => {
            const active = fixture.id === draftId;
            return (
              <Pressable
                key={fixture.id}
                accessibilityRole="radio"
                accessibilityLabel={`${fixture.title}. ${fixture.note}`}
                accessibilityState={{ selected: active }}
                onPress={() => setDraftId(fixture.id)}
                style={[styles.fixtureCell, active && styles.fixtureCellActive]}
              >
                <FixtureArt kind={fixture.kind} compact />
                <Text style={styles.fixtureLabel}>{fixture.title}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.footnote}>{t('compose.photoNotice')}</Text>
      </Sheet>
    </Screen>
  );
}

/* ------------------------------------------------------- vector fixture art */

function FixtureArt({ kind, compact }: { kind: Fixture['kind']; compact?: boolean }) {
  const height = compact ? 96 : 210;
  return (
    <View style={[styles.art, { height }]} accessible={false}>
      <Svg width="100%" height="100%" viewBox="0 0 320 210" preserveAspectRatio="xMidYMid slice">
        <Rect x="0" y="0" width="320" height="210" fill="#F1F6EA" />
        {kind === 'leaf' ? <LeafArt /> : kind === 'grain' ? <GrainLotArt /> : <GrainCloseArt />}
        <Rect x="0" y="0" width="320" height="210" fill="none" stroke="#DFE6D8" strokeWidth="2" />
      </Svg>
      <View style={styles.artBadge}>
        <Text style={styles.artBadgeText}>{toolCopy('photo.badge')}</Text>
      </View>
    </View>
  );
}

function LeafArt() {
  return (
    <>
      <Path
        d="M60 170 C 80 90, 160 40, 262 44 C 268 120, 206 176, 118 178 Z"
        fill="#CBDDBA"
        stroke="#93A982"
        strokeWidth="2"
      />
      <Path d="M74 168 C 132 140, 196 96, 254 52" stroke="#8AA474" strokeWidth="2" fill="none" />
      <Path d="M120 152 C 150 148, 168 132, 186 112" stroke="#A6B998" strokeWidth="1.5" fill="none" />
      <Path d="M158 126 C 190 122, 210 106, 228 86" stroke="#A6B998" strokeWidth="1.5" fill="none" />
      <Circle cx="146" cy="104" r="7" fill="#D8C79A" opacity="0.9" />
      <Circle cx="190" cy="82" r="5" fill="#D8C79A" opacity="0.9" />
      <Circle cx="120" cy="132" r="4" fill="#D8C79A" opacity="0.9" />
      <Circle cx="214" cy="120" r="6" fill="#D8C79A" opacity="0.8" />
    </>
  );
}

function GrainLotArt() {
  const grains = [
    { x: 92, y: 108, r: -18 },
    { x: 128, y: 96, r: 12 },
    { x: 164, y: 112, r: -8 },
    { x: 200, y: 98, r: 20 },
    { x: 236, y: 116, r: -14 },
    { x: 110, y: 136, r: 8 },
    { x: 146, y: 140, r: -20 },
    { x: 182, y: 134, r: 16 },
    { x: 218, y: 142, r: 4 },
    { x: 254, y: 136, r: -10 },
  ];
  return (
    <>
      <Ellipse cx="172" cy="132" rx="118" ry="50" fill="#E4EDD8" />
      {grains.map(grain => (
        <Ellipse
          key={`${grain.x}-${grain.y}`}
          cx={grain.x}
          cy={grain.y}
          rx="15"
          ry="9"
          fill="#DCC99A"
          stroke="#BFA975"
          strokeWidth="1.4"
          transform={`rotate(${grain.r} ${grain.x} ${grain.y})`}
        />
      ))}
      {grains.map(grain => (
        <Line
          key={`line-${grain.x}-${grain.y}`}
          x1={grain.x - 8}
          y1={grain.y}
          x2={grain.x + 8}
          y2={grain.y}
          stroke="#B49C67"
          strokeWidth="1.2"
        />
      ))}
    </>
  );
}

function GrainCloseArt() {
  return (
    <>
      <Ellipse cx="160" cy="108" rx="86" ry="52" fill="#DCC99A" stroke="#BFA975" strokeWidth="2" />
      <Line x1="92" y1="108" x2="228" y2="108" stroke="#B49C67" strokeWidth="2" />
      <Path d="M118 92 C 138 84, 180 84, 202 94" stroke="#C8B482" strokeWidth="1.6" fill="none" />
      <Path d="M116 124 C 138 132, 182 132, 204 122" stroke="#C8B482" strokeWidth="1.6" fill="none" />
      <Circle cx="160" cy="108" r="3" fill="#B49C67" />
    </>
  );
}

const styles = StyleSheet.create({
  unavailableBlock: { gap: 10, paddingVertical: 8 },
  body: { fontFamily: 'System', fontWeight: '400', fontSize: 13, lineHeight: 18.2, color: '#697460' },
  footnote: { fontFamily: 'System', fontWeight: '400', fontSize: 11, lineHeight: 15, color: '#697462' },

  previewCard: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F1F6EA',
    minHeight: 210,
  },
  previewEmpty: {
    minHeight: 210,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  previewEmptyText: {
    fontFamily: 'System', fontWeight: '400',
    fontSize: 13,
    lineHeight: 18,
    color: '#657360',
    textAlign: 'center',
  },
  art: { width: '100%', backgroundColor: '#F1F6EA' },
  artBadge: {
    position: 'absolute',
    left: 12,
    top: 12,
    backgroundColor: 'rgba(251, 252, 249, 0.92)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  artBadgeText: { fontFamily: 'System', fontWeight: '500', fontSize: 10, lineHeight: 14, color: '#4A693D' },

  previewMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  previewMetaText: { flex: 1, gap: 3 },
  previewTitle: { fontFamily: 'System', fontWeight: '600', fontSize: 15, lineHeight: 21, color: '#263B29' },

  limitsCard: { backgroundColor: '#F4F7EF', borderRadius: 18, padding: 16, gap: 8 },
  limitsTitle: { fontFamily: 'System', fontWeight: '600', fontSize: 13, lineHeight: 18, color: '#5A714C' },
  attributeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  attribute: { flex: 1, fontFamily: 'System', fontWeight: '400', fontSize: 12, lineHeight: 17, color: '#687560' },

  actions: { gap: 10 },
  contextLine: { fontFamily: 'System', fontWeight: '400', fontSize: 11, lineHeight: 15, color: '#697462' },
  recordedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  fixtureGrid: { flexDirection: 'row', gap: 10 },
  fixtureCell: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
    gap: 6,
  },
  fixtureCellActive: { borderColor: '#9DBA82' },
  fixtureLabel: {
    fontFamily: 'System', fontWeight: '500',
    fontSize: 11,
    lineHeight: 15,
    color: '#4A693D',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
});

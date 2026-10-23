import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useDemo, formatDistance } from '../../demo';
import { useT } from '../../locales';
import { Button, Divider, Icon, Screen, Sheet, Text, colors } from '../../ui';
import { CommunityHeading, FixtureArt, findFixturePhoto, type FixturePhotoId } from './components';
import { communityCopy } from './strings';

/**
 * `/community/detail` has no reference screen (docs/reference-qa.md §10). It is
 * built from the established system: 28/600 heading, 20pt gaps, soft surface
 * cards, the same status badges and one evidence/limitations sheet.
 */
export function ObservationDetailScreen() {
  const { state } = useDemo();
  const t = useT();
  const params = useLocalSearchParams<{ id?: string }>();
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  const item = state.community.feed.find(entry => entry.id === params.id) ?? null;
  const photo = item ? findFixturePhoto(item.photoId) : null;

  if (!item) {
    return (
      <Screen>
        <CommunityHeading
          title={t('community.title')}
          subtitle={communityCopy['detail.notFound']}
          back={<BackRow />}
        />
        <View style={styles.notFound}>
          <Icon name="circle-help" size={24} color={colors.iconQuiet} />
          <Text variant="body" color={colors.muted}>
            {communityCopy['detail.notFoundBody']}
          </Text>
        </View>
        <Button
          title={communityCopy['detail.backToFeed']}
          trailingArrow={false}
          onPress={() => router.replace('/(tabs)/community')}
        />
      </Screen>
    );
  }

  const statusLabel = t(`community.status.${item.status}`);
  const time =
    item.hoursAgo <= 0
      ? communityCopy['community.time.justNow']
      : item.hoursAgo >= 24 && item.hoursAgo < 48
        ? t('community.yesterday')
        : t('community.hoursAgo', { hours: item.hoursAgo });

  const statusBody =
    item.status === 'reported'
      ? communityCopy['detail.evidenceReported']
      : item.status === 'reviewed'
        ? communityCopy['detail.evidenceReviewed']
        : communityCopy['detail.evidenceConfirmed'];

  return (
    <Screen>
      <CommunityHeading
        title={t(item.titleKey)}
        subtitle={`${statusLabel} · ${time}`}
        back={<BackRow />}
      />

      <View style={styles.statusRow}>
        <View style={[styles.badge, statusBadge[item.status]]}>
          <Text variant="meta" weight="medium" color={statusBadgeInk[item.status]}>
            {statusLabel}
          </Text>
        </View>
        <Text variant="meta" color={colors.subtle} style={styles.flex}>
          {statusBody}
        </Text>
      </View>

      {photo ? (
        <FixtureArt id={photo.id as FixturePhotoId} height={180} />
      ) : (
        <View style={styles.noPhoto}>
          <Icon name="image" size={22} color={colors.iconQuiet} />
          <Text variant="meta" color={colors.faint}>
            {communityCopy['detail.noPhoto']}
          </Text>
        </View>
      )}

      <View style={styles.summaryCard}>
        <Text variant="label" color={colors.muted}>
          {communityCopy['detail.summary'].toUpperCase()}
        </Text>
        <Text variant="body" color={colors.muted} style={styles.summaryBody}>
          {t(item.detailKey)}
        </Text>
      </View>

      <View style={styles.metaCard}>
        <Row label={communityCopy['detail.cropLabel']} value={item.crop} />
        <Divider />
        <Row label={communityCopy['detail.districtLabel']} value={item.district} />
        <Divider />
        <Row label={communityCopy['detail.distance']} value={formatDistance(item.distanceKm)} />
        <Divider />
        <Row label={communityCopy['detail.observed']} value={time} />
        <Divider />
        <Row label={communityCopy['detail.source']} value={communityCopy['detail.sourceValue']} />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={communityCopy['detail.evidence']}
        onPress={() => setEvidenceOpen(true)}
        style={({ pressed }) => [styles.limitsCard, pressed && styles.pressed]}
      >
        <View style={styles.limitsHead}>
          <Icon name="shield-check" size={18} color={colors.icon} />
          <Text variant="strong" color={colors.ink} style={styles.flex}>
            {communityCopy['detail.evidence']}
          </Text>
          <Icon name="chevron-right" size={16} color={colors.iconFaint} />
        </View>
        <Text variant="meta" color={colors.subtle} style={styles.limitsBody}>
          {communityCopy['detail.limitsBody']}
        </Text>
      </Pressable>

      <Text variant="meta" color="#6A7461" style={styles.footer}>
        {communityCopy['detail.footer']}
      </Text>

      <Sheet
        visible={evidenceOpen}
        onClose={() => setEvidenceOpen(false)}
        title={communityCopy['detail.evidenceSheetTitle']}
        footer={
          <Button
            title={t('common.close')}
            variant="secondary"
            trailingArrow={false}
            onPress={() => setEvidenceOpen(false)}
          />
        }
      >
        <Text variant="body" color={colors.muted} style={styles.sheetBody}>
          {communityCopy['detail.evidenceSheetBody']}
        </Text>
        <View style={styles.sheetBlock}>
          <Text variant="strong" color={colors.ink}>
            {communityCopy['detail.privacyTitle']}
          </Text>
          <Text variant="meta" color={colors.subtle} style={styles.sheetBody}>
            {communityCopy['detail.privacyBody']}
          </Text>
        </View>
        <View style={styles.sheetBlock}>
          <Text variant="strong" color={colors.ink}>
            {communityCopy['detail.limitsTitle']}
          </Text>
          <Text variant="meta" color={colors.subtle} style={styles.sheetBody}>
            {communityCopy['detail.limitsBody']}
          </Text>
        </View>
        <View style={styles.sheetBlock}>
          <Text variant="strong" color={colors.ink}>
            {statusLabel}
          </Text>
          <Text variant="meta" color={colors.subtle} style={styles.sheetBody}>
            {statusBody}
          </Text>
        </View>
      </Sheet>
    </Screen>
  );
}

function BackRow() {
  const t = useT();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('common.back')} · ${communityCopy['detail.back']}`}
      onPress={() => router.back()}
      hitSlop={8}
      style={styles.backRow}
    >
      <Icon name="chevron-left" size={18} color={colors.icon} strokeWidth={1.8} />
      <Text variant="caption" color={colors.mutedSoft}>
        {communityCopy['detail.back']}
      </Text>
    </Pressable>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text variant="caption" color={colors.muted}>
        {label}
      </Text>
      <Text variant="caption" weight="medium" color={colors.chipInk} style={styles.metaValue}>
        {value}
      </Text>
    </View>
  );
}

const statusBadge = {
  reported: { backgroundColor: '#F0ECDC' },
  reviewed: { backgroundColor: '#E9E6DF' },
  confirmed: { backgroundColor: '#DCECCF' },
} as const;

const statusBadgeInk = {
  reported: '#76663C',
  reviewed: '#556D44',
  confirmed: '#556D44',
} as const;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, alignSelf: 'flex-start' },
  notFound: { gap: 10, paddingVertical: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 25 },
  badge: {
    minHeight: 25,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: 99,
  },
  noPhoto: {
    minHeight: 96,
    borderRadius: 18,
    backgroundColor: '#F2EFE9',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  summaryCard: { backgroundColor: '#EDF2F7', borderRadius: 18, padding: 16, gap: 8 },
  summaryBody: { lineHeight: 20 },
  metaCard: { backgroundColor: '#F2EFE9', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  metaValue: { flex: 1, textAlign: 'right' },
  limitsCard: { backgroundColor: '#F1EEE8', borderRadius: 18, padding: 16, gap: 8 },
  limitsHead: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 24 },
  limitsBody: { lineHeight: 16 },
  pressed: { opacity: 0.85 },
  footer: { lineHeight: 16 },
  sheetBody: { lineHeight: 17 },
  sheetBlock: { gap: 4, paddingTop: 8 },
});

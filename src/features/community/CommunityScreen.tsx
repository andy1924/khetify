import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import {
  useDemoSlices,
  useDemoActions,
  selectFilteredFeed,
  formatDistance,
  type CommunityFilter,
  type Observation,
} from '../../demo';
import { useT, type StringKey } from '../../locales';
import { Button, Chip, Icon, Screen, Sheet, Text } from '../../ui';
import { useAccentPalette } from '../../ui/AccentTheme';
import { useStyles, type AccentPalette } from '../../ui/AccentTheme';
import { CommunityHeading, FeedPost } from './components';
import { communityCopy } from './strings';

const FILTERS: { id: CommunityFilter; key: StringKey; detail: string }[] = [
  {
    id: 'nearby',
    key: 'community.filter.nearby',
    detail: 'Reports within 10 km.',
  },
  {
    id: 'crop',
    key: 'community.filter.crop',
    detail: 'Reports for this crop.',
  },
  {
    id: 'week',
    key: 'community.filter.week',
    detail: 'Reports added in the last 168 hours.',
  },
];

const STATUS_LABEL = {
  reported: 'community.status.reported',
  reviewed: 'community.status.reviewed',
  confirmed: 'community.status.confirmed',
} as const satisfies Record<string, StringKey>;

/** Local fixture time label; never a live clock. */
function timeLabel(hoursAgo: number, t: ReturnType<typeof useT>): string {
  if (hoursAgo <= 0) return communityCopy['community.time.justNow'];
  if (hoursAgo >= 24 && hoursAgo < 48) return t('community.yesterday');
  return t('community.hoursAgo', { hours: hoursAgo });
}

function metaLabel(item: Observation, t: ReturnType<typeof useT>): string {
  return t('community.meta', {
    time: timeLabel(item.hoursAgo, t),
    distance: formatDistance(item.distanceKm).replace('≈ ', '').replace(/\s*km$/, ''),
  });
}

/** 13 · Community · demo feed — fixture posts, filters, detail and compose. */
export function CommunityScreen() {
  const palette = useAccentPalette();
  const styles = useStyles(makeStyles);
  const state = useDemoSlices(['community', 'farm'] as const);
  const actions = useDemoActions();
  const t = useT();
  const [filterSheet, setFilterSheet] = useState(false);
  const [dismissedSubmission, setDismissedSubmission] = useState<string | null>(null);
  // Derived feed is memoised so unrelated re-renders (the filter sheet, the
  // dismissed banner) do not re-filter and rebuild every row's props.
  const feed = useMemo(() => selectFilteredFeed(state), [state]);
  const submitted = state.community.lastSubmittedId;
  const showSuccess = Boolean(submitted) && submitted !== dismissedSubmission;

  const select = useCallback(
    (id: CommunityFilter) => {
      actions.setCommunityFilter(id);
    },
    [actions],
  );

  const openPost = useCallback((id: string) => {
    router.push(`/community/detail?id=${encodeURIComponent(id)}`);
  }, []);

  return (
    <Screen>
      <CommunityHeading
        title={t('community.title')}
        subtitle={t('community.subtitle')}
        action={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('community.newReport')}
            onPress={() => router.push('/community/compose')}
            hitSlop={4}
            style={({ pressed }) => [styles.composeTarget, pressed && styles.pressed]}
          >
            <View style={styles.composeButton}>
              <Icon name="plus" size={20} color={palette.icon} />
            </View>
          </Pressable>
        }
      />

      <View style={styles.filterRow}>
        {FILTERS.map(filter => {
          const selected = state.community.filter === filter.id;
          return (
            <Pressable
              key={filter.id}
              accessibilityRole="radio"
              accessibilityLabel={t(filter.key)}
              accessibilityState={{ selected }}
              onPress={() => select(filter.id)}
              style={styles.chipTarget}
            >
              <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
                <Chip label={t(filter.key)} selected={selected} />
              </View>
            </Pressable>
          );
        })}
        <View style={styles.filterSpacer} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={communityCopy['community.filterSheet']}
          onPress={() => setFilterSheet(true)}
          hitSlop={10}
          style={styles.filterButton}
        >
          <Icon name="sliders-horizontal" size={16} color={palette.chipInk} />
        </Pressable>
      </View>

      {showSuccess ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('compose.submitted')}. ${communityCopy['community.dismiss']}`}
          onPress={() => setDismissedSubmission(submitted)}
          style={styles.successBanner}
        >
          <Icon name="circle-check" size={18} color={palette.ink} />
          <Text variant="meta" color={palette.ink} style={styles.flex}>
            {t('compose.submitted')}
          </Text>
          <Icon name="x" size={14} color={palette.ink} />
        </Pressable>
      ) : null}

      {feed.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="filter" size={22} color={palette.icon} />
          <Text variant="body" color={palette.muted} style={styles.emptyText}>
            {t('community.empty')}
          </Text>
          <Button
            title={t('community.filter.nearby')}
            variant="secondary"
            trailingArrow={false}
            fullWidth={false}
            onPress={() => select('nearby')}
          />
        </View>
      ) : (
        <View>
          {feed.map(item => (
            <FeedPost
              key={item.id}
              id={item.id}
              time={metaLabel(item, t)}
              title={t(item.titleKey)}
              detail={t(item.detailKey)}
              status={item.status}
              statusLabel={t(STATUS_LABEL[item.status])}
              onOpen={openPost}
            />
          ))}
        </View>
      )}

      <Text variant="meta" color={palette.icon} style={styles.footer}>
        {t('community.footer')}
      </Text>

      <Sheet
        visible={filterSheet}
        onClose={() => setFilterSheet(false)}
        title={communityCopy['community.filterSheet']}
        footer={
          <Button
            title={communityCopy['community.filter.done']}
            trailingArrow={false}
            onPress={() => setFilterSheet(false)}
          />
        }
      >
        <View style={styles.sheetList}>
          {FILTERS.map(filter => {
            const selected = state.community.filter === filter.id;
            return (
              <Pressable
                key={filter.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${t(filter.key)}. ${filter.detail}`}
                onPress={() => select(filter.id)}
                style={[styles.sheetRow, selected && styles.sheetRowSelected]}
              >
                <View style={styles.sheetRowText}>
                  <Text variant="strong" color={palette.ink}>
                    {t(filter.key)}
                  </Text>
                  <Text variant="meta" color={palette.faint}>
                    {filter.detail}
                  </Text>
                </View>
                <View style={[styles.dot, selected && styles.dotSelected]}>
                  {selected ? <Icon name="check" size={13} color={palette.ink} strokeWidth={2} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </Screen>
  );
}

const makeStyles = (p: AccentPalette) => StyleSheet.create({
  flex: { flex: 1 },
  composeTarget: { width: 48, height: 48, alignItems: 'flex-end', justifyContent: 'center' },
  composeButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#D5E7BD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: p.surface,
  },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48 },
  chipTarget: { minHeight: 48, justifyContent: 'center' },
  filterSpacer: { flex: 1 },
  filterButton: {
    width: 48,
    height: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 20,
  },
  emptyText: { lineHeight: 20 },
  footer: { lineHeight: 16 },
  sheetNote: { lineHeight: 16 },
  sheetList: { gap: 8 },
  sheetRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: p.surfaceSoft,
  },
  sheetRowSelected: { backgroundColor: p.surface },
  sheetRowText: { flex: 1, gap: 3 },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: p.border,
    backgroundColor: p.page,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotSelected: { backgroundColor: p.active, borderColor: p.active },
});

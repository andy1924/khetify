import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Path, Rect } from 'react-native-svg';
import { Chip, Icon, colors, type IconName } from '../../ui';
import { Text } from '../../ui';
import type { ObservationStatus } from '../../demo';

/* ------------------------------------------------------------------ heading */

/**
 * 28/600 screen title with the 13/400 supporting line. Community needs the
 * 42×42 compose action on the same row, so this is its own composite rather
 * than the shared Header.
 */
export function CommunityHeading({
  title,
  subtitle,
  action,
  back,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  back?: React.ReactNode;
}) {
  return (
    <View style={styles.heading}>
      {back}
      <View style={styles.headingRow}>
        <View style={styles.headingText}>
          <Text variant="heading" color={colors.heading} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? (
            <Text variant="caption" color={colors.mutedSoft} style={styles.headingSubtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {action}
      </View>
    </View>
  );
}

/* --------------------------------------------------------------- feed post */

export const STATUS_KEYS = {
  reported: 'community.status.reported',
  reviewed: 'community.status.reviewed',
  confirmed: 'community.status.confirmed',
} as const;

export function StatusChip({ status, label }: { status: ObservationStatus; label: string }) {
  return <Chip label={label} tone={status} />;
}

const POST_ICONS: Record<ObservationStatus, IconName> = {
  reported: 'bug',
  reviewed: 'cloud-rain',
  confirmed: 'sprout',
};

/**
 * One feed post: 136pt tall reference block — meta row, status badge, 16/600
 * title, 12/400 line — closed by a hairline. Tappable rows keep ≥48dp and an
 * accessibility label carrying the whole post.
 */
export function FeedPost({
  time,
  title,
  detail,
  status,
  statusLabel,
  onPress,
}: {
  time: string;
  title: string;
  detail: string;
  status: ObservationStatus;
  statusLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${statusLabel}. ${time}. ${detail}`}
      onPress={onPress}
      style={({ pressed }) => [styles.post, pressed && styles.pressed]}
    >
      <View style={styles.postMeta}>
        <Icon name={POST_ICONS[status]} size={20} color={colors.icon} strokeWidth={1.6} />
        <Text variant="meta" color="#687160" style={styles.postMetaText} numberOfLines={1}>
          {time}
        </Text>
      </View>
      <View style={styles.badgeRow}>
        <StatusChip status={status} label={statusLabel} />
      </View>
      <Text variant="subtitle" color={colors.ink}>
        {title}
      </Text>
      <Text variant="caption" color="#68715C" style={styles.postDetail}>
        {detail}
      </Text>
    </Pressable>
  );
}

/* ---------------------------------------------------------- fixture photos */

export type FixturePhotoId = 'fixture-leaf-spots' | 'fixture-waterlogging' | 'fixture-sprout';

export interface FixturePhoto {
  id: FixturePhotoId;
  label: string;
  note: string;
}

/** Local illustrated fixtures — never a capture, never a reference screenshot. */
export const FIXTURE_PHOTOS: FixturePhoto[] = [
  {
    id: 'fixture-leaf-spots',
    label: 'Wheat leaf · demo',
    note: 'Illustration of a wheat leaf with pale spots.',
  },
  {
    id: 'fixture-waterlogging',
    label: 'Standing water · demo',
    note: 'Illustration of standing water between crop rows.',
  },
  {
    id: 'fixture-sprout',
    label: 'Young crop · demo',
    note: 'Illustration of young plants in a field.',
  },
];

export function findFixturePhoto(id: string | null): FixturePhoto | null {
  if (!id) return null;
  return FIXTURE_PHOTOS.find(photo => photo.id === id) ?? null;
}

/** Native vector rendering of a fixture; no image files or permissions. */
export function FixtureArt({
  id,
  height = 148,
  compact = false,
}: {
  id: FixturePhotoId;
  height?: number;
  compact?: boolean;
}) {
  return (
    <View style={[styles.art, { height }]} accessible={false}>
      <Svg width="100%" height="100%" viewBox="0 0 320 150" preserveAspectRatio="xMidYMid slice">
        <Rect x="0" y="0" width="320" height="150" fill="#F4F1EA" />
        {id === 'fixture-leaf-spots' ? <LeafSpotsArt /> : null}
        {id === 'fixture-waterlogging' ? <WaterloggingArt /> : null}
        {id === 'fixture-sprout' ? <SproutRowsArt /> : null}
        <Rect x="0" y="0" width="320" height="150" fill="none" stroke="#DEDAD2" strokeWidth="2" />
      </Svg>
      {!compact ? (
        <View style={styles.artBadge}>
          <Text variant="meta" weight="medium" color="#4A693D">
            Fixture
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function LeafSpotsArt() {
  return (
    <>
      <Ellipse cx="166" cy="80" rx="120" ry="58" fill="#E4EDD8" />
      <Path
        d="M84 130 C 100 62, 168 22, 250 26 C 254 90, 208 136, 130 136 Z"
        fill="#CBDDBA"
        stroke="#93A982"
        strokeWidth="2"
      />
      <Path d="M96 128 C 146 106, 198 70, 246 34" stroke="#8AA474" strokeWidth="2" fill="none" />
      <Path d="M134 114 C 160 110, 176 96, 192 78" stroke="#A6B998" strokeWidth="1.5" fill="none" />
      <Circle cx="152" cy="78" r="6" fill="#D8C79A" />
      <Circle cx="192" cy="60" r="4.5" fill="#D8C79A" />
      <Circle cx="128" cy="100" r="3.5" fill="#D8C79A" />
      <Circle cx="212" cy="96" r="5" fill="#D8C79A" opacity="0.85" />
    </>
  );
}

function WaterloggingArt() {
  return (
    <>
      <Rect x="0" y="88" width="320" height="62" fill="#DCE7CE" />
      <Path d="M0 88 C 60 74, 110 100, 170 86 C 232 72, 272 96, 320 84 L320 150 L0 150 Z" fill="#C6D8B4" />
      <Ellipse cx="88" cy="112" rx="46" ry="11" fill="#AFC79B" opacity="0.75" />
      <Ellipse cx="208" cy="126" rx="58" ry="12" fill="#AFC79B" opacity="0.6" />
      <Line x1="152" y1="16" x2="152" y2="112" stroke="#9BB287" strokeWidth="2.4" />
      <Path d="M152 26 C 138 22, 128 34, 130 46" stroke="#9BB287" strokeWidth="2.4" fill="none" />
      <Path d="M152 36 C 166 32, 176 44, 174 56" stroke="#9BB287" strokeWidth="2.4" fill="none" />
      <Path d="M40 66 C 54 54, 70 58, 74 70 C 58 76, 46 74, 40 66 Z" fill="#B9CDA6" />
      <Path d="M244 54 C 260 44, 276 50, 280 62 C 264 68, 250 64, 244 54 Z" fill="#B9CDA6" />
      <Path d="M118 40 L126 40 L122 48 Z" fill="#93A982" />
    </>
  );
}

function SproutRowsArt() {
  const rows = [40, 96, 152, 208, 264];
  return (
    <>
      <Rect x="0" y="0" width="320" height="150" fill="#F3F7EC" />
      <Rect x="0" y="106" width="320" height="44" fill="#E0EAD2" />
      {rows.map((x, index) => (
        <React.Fragment key={x}>
          <Line
            x1={x}
            y1={118}
            x2={x + (index % 2 === 0 ? 4 : -4)}
            y2={70}
            stroke="#8AA474"
            strokeWidth="2.4"
          />
          <Path
            d={`M${x} 90 C ${x - 16} 84, ${x - 18} 68, ${x - 10} 62 C ${x + 1} 68, ${x + 4} 82, ${x} 90 Z`}
            fill="#B9D2A2"
          />
          <Path
            d={`M${x + 1} 76 C ${x + 16} 70, ${x + 20} 54, ${x + 12} 48 C ${x + 2} 54, ${x - 1} 68, ${x + 1} 76 Z`}
            fill="#A7C48E"
          />
        </React.Fragment>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  heading: { gap: 10 },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headingText: { flex: 1, gap: 6 },
  headingSubtitle: { lineHeight: 19 },

  post: {
    minHeight: 136,
    paddingVertical: 14,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSoft,
  },
  pressed: { opacity: 0.85 },
  postMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 20 },
  postMetaText: { flex: 1 },
  badgeRow: { flexDirection: 'row', minHeight: 25, alignItems: 'center' },
  postDetail: { lineHeight: 20 },

  art: { width: '100%', backgroundColor: '#F4F1EA', overflow: 'hidden' },
  artBadge: {
    position: 'absolute',
    left: 12,
    top: 12,
    backgroundColor: 'rgba(251, 252, 249, 0.92)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});

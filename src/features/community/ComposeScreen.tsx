import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useDemo } from '../../demo';
import { useT } from '../../locales';
import { Button, Field, Icon, Sheet, Screen, Text, Toggle, colors } from '../../ui';
import {
  CommunityHeading,
  FIXTURE_PHOTOS,
  FixtureArt,
  findFixturePhoto,
  type FixturePhotoId,
} from './components';
import { communityCopy } from './strings';

const TYPE_OPTIONS = [
  { id: 'compose.type.symptoms', label: null },
  { id: 'compose.type.pest', label: communityCopy['compose.type.pest'] },
  { id: 'compose.type.water', label: communityCopy['compose.type.water'] },
  { id: 'compose.type.other', label: communityCopy['compose.type.other'] },
] as const;

type PickerMode = 'camera' | 'gallery' | null;

/** 14 · Share an observation — local draft, fixture photo, no permissions. */
export function ComposeScreen() {
  const { state, actions } = useDemo();
  const t = useT();
  const draft = state.community.draft;
  const [typeSheet, setTypeSheet] = useState(false);
  const [picker, setPicker] = useState<PickerMode>(null);
  const [attempted, setAttempted] = useState(false);

  const notesError = attempted && !draft.notes.trim() ? t('compose.notesRequired') : undefined;
  const districtError =
    attempted && !draft.district.trim() ? communityCopy['compose.districtRequired'] : undefined;
  const observedError =
    attempted && !draft.observedLabel.trim() ? communityCopy['compose.observedRequired'] : undefined;

  const photo = findFixturePhoto(draft.photoId);

  // Leaving the screen any way (Cancel, hardware back, tab switch) discards the
  // local draft, so an abandoned report never reappears on the next compose.
  useFocusEffect(useCallback(() => () => actions.resetObservationDraft(), [actions]));

  const typeLabel = (id: string) => {
    const option = TYPE_OPTIONS.find(entry => entry.id === id) ?? TYPE_OPTIONS[0];
    return option.label ?? t('compose.type.symptoms');
  };

  const submit = () => {
    setAttempted(true);
    if (!draft.notes.trim() || !draft.district.trim() || !draft.observedLabel.trim()) return;
    actions.submitObservation();
    // Crop is optional, so a blank crop would never match the Crop filter.
    // Land on Nearby (the new report is 2 km away) so it is always visible.
    actions.setCommunityFilter('nearby');
    router.replace('/(tabs)/community');
  };

  const cancel = () => {
    actions.resetObservationDraft();
    router.back();
  };

  return (
    <Screen keyboard>
      <CommunityHeading
        title={t('compose.title')}
        subtitle={t('compose.subtitle')}
        back={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
            onPress={cancel}
            hitSlop={8}
            style={styles.backRow}
          >
            <Icon name="chevron-left" size={18} color={colors.icon} strokeWidth={1.8} />
            <Text variant="caption" color={colors.mutedSoft}>
              {t('common.cancel')}
            </Text>
          </Pressable>
        }
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('compose.type')}. ${typeLabel(draft.type)}`}
        onPress={() => setTypeSheet(true)}
      >
        <Field
          label={t('compose.type')}
          value={typeLabel(draft.type)}
          editable={false}
          right={<Icon name="chevron-down" size={16} color={colors.iconQuiet} />}
        />
      </Pressable>

      <View style={styles.metaRow}>
        <View style={styles.metaCell}>
          <Field
            label={t('compose.crop')}
            value={draft.crop}
            onChangeText={crop => actions.updateObservation({ crop })}
            placeholder={t('common.unknown')}
          />
        </View>
        <View style={styles.metaCell}>
          <Field
            label={t('compose.observed')}
            value={draft.observedLabel}
            onChangeText={observedLabel => actions.updateObservation({ observedLabel })}
            error={observedError}
            placeholder={t('compose.observedNow')}
          />
        </View>
      </View>

      <View style={styles.consentCard}>
        <View style={styles.consentHead}>
          <Icon name="map-pin" size={18} color={colors.icon} />
          <Text variant="caption" weight="semiBold" color="#597347" style={styles.consentTitle}>
            {t('compose.location.title')}
          </Text>
          <Toggle
            value={draft.useApproximateLocation}
            onValueChange={actions.setObservationLocationConsent}
            accessibilityLabel={t('compose.location.title')}
          />
        </View>
        <Text variant="meta" color="#646C59" style={styles.consentBody}>
          {draft.useApproximateLocation
            ? communityCopy['compose.locationOn']
            : t('compose.location.body')}
        </Text>
        <Field
          label={t('compose.district')}
          value={draft.district}
          onChangeText={district => actions.updateObservation({ district })}
          placeholder="Nashik, Maharashtra"
          error={districtError}
          tone="transparent"
          style={styles.districtField}
          hint={draft.useApproximateLocation ? communityCopy['compose.districtApproximate'] : undefined}
        />
      </View>

      <View style={styles.photoCard}>
        {photo ? (
          <View style={styles.photoPreview}>
            <FixtureArt id={photo.id as FixturePhotoId} height={148} />
            <View style={styles.photoPreviewMeta}>
              <View style={styles.photoPreviewText}>
                <Text variant="strong" color="#637652">
                  {photo.label}
                </Text>
                <Text variant="meta" color="#7A8574">
                  {communityCopy['community.photo.fixture']}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={communityCopy['community.photo.remove']}
                onPress={() => actions.setObservationPhoto(null)}
                hitSlop={10}
                style={styles.removeButton}
              >
                <Icon name="x" size={16} color={colors.icon} />
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.photoRow}>
            <Icon name="camera" size={28} color="#94AA7D" strokeWidth={1.5} />
            <Text variant="strong" color="#637652" style={styles.photoLabel}>
              {t('compose.photo')}
            </Text>
            <View style={styles.photoActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('compose.camera')}
                onPress={() => setPicker('camera')}
                hitSlop={4}
                style={styles.photoChip}
              >
                <Text variant="meta" weight="medium" color={colors.chipInk}>
                  {t('compose.camera')}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('compose.gallery')}
                onPress={() => setPicker('gallery')}
                hitSlop={4}
                style={styles.photoChip}
              >
                <Text variant="meta" weight="medium" color={colors.chipInk}>
                  {t('compose.gallery')}
                </Text>
              </Pressable>
            </View>
          </View>
        )}
        {photo ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={communityCopy['community.photo.change']}
            onPress={() => setPicker('gallery')}
            hitSlop={6}
            style={styles.changeRow}
          >
            <Text variant="meta" weight="medium" color={colors.chipInk}>
              {communityCopy['community.photo.change']}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.notesCard}>
        <Field
          label={t('compose.notes')}
          value={draft.notes}
          onChangeText={notes => actions.updateObservation({ notes })}
          placeholder={t('compose.notesPlaceholder')}
          multiline
          error={notesError}
          tone="transparent"
        />
      </View>

      <Button title={t('compose.submit')} onPress={submit} />

      <Text variant="meta" color={colors.faint} style={styles.footnote}>
        {t('compose.photoNotice')}
      </Text>

      <Sheet visible={typeSheet} onClose={() => setTypeSheet(false)} title={t('compose.type')}>
        <View style={styles.sheetList}>
          {TYPE_OPTIONS.map(option => {
            const selected = draft.type === option.id;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={typeLabel(option.id)}
                onPress={() => {
                  actions.updateObservation({ type: option.id });
                  setTypeSheet(false);
                }}
                style={[styles.sheetRow, selected && styles.sheetRowSelected]}
              >
                <Text variant="strong" color={colors.ink} style={styles.flex}>
                  {typeLabel(option.id)}
                </Text>
                {selected ? <Icon name="check" size={16} color={colors.ink} strokeWidth={2} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>

      <Sheet
        visible={picker !== null}
        onClose={() => setPicker(null)}
        title={
          picker === 'camera'
            ? communityCopy['community.photo.cameraTitle']
            : communityCopy['community.photo.galleryTitle']
        }
      >
        <Text variant="meta" color={colors.faint} style={styles.sheetNote}>
          {communityCopy['community.photo.pickerNote']}
        </Text>
        <View style={styles.fixtureList}>
          {FIXTURE_PHOTOS.map(item => {
            const selected = draft.photoId === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${item.label}. ${item.note}`}
                onPress={() => {
                  actions.setObservationPhoto(item.id);
                  setPicker(null);
                }}
                style={[styles.fixtureCell, selected && styles.fixtureCellSelected]}
              >
                <FixtureArt id={item.id} height={104} compact />
                <View style={styles.fixtureText}>
                  <Text variant="meta" weight="medium" color="#4A693D">
                    {item.label}
                  </Text>
                  <Text variant="meta" color="#7A8574">
                    {item.note}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, alignSelf: 'flex-start' },
  metaRow: { flexDirection: 'row', gap: 12 },
  metaCell: { flex: 1 },

  consentCard: {
    backgroundColor: '#EEF4E5',
    borderRadius: 18,
    padding: 12,
    gap: 8,
  },
  consentHead: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 22 },
  consentTitle: { flex: 1 },
  consentBody: { lineHeight: 16 },
  districtField: { marginTop: 2 },

  photoCard: {
    backgroundColor: '#F6F8F2',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBE5D2',
    gap: 10,
  },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  photoLabel: { flex: 1, fontSize: 14, lineHeight: 20 },
  photoActions: { flexDirection: 'row', gap: 6 },
  photoChip: {
    minHeight: 44,
    minWidth: 61,
    paddingHorizontal: 12,
    borderRadius: 99,
    backgroundColor: '#EBF2E4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPreview: { gap: 10 },
  photoPreviewMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  photoPreviewText: { flex: 1, gap: 3 },
  removeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF2E4',
  },
  changeRow: { minHeight: 44, justifyContent: 'center' },

  notesCard: { backgroundColor: '#F2F5EC', borderRadius: 18, padding: 14 },
  footnote: { lineHeight: 16 },

  sheetList: { gap: 8 },
  sheetRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#F2F5EC',
  },
  sheetRowSelected: { backgroundColor: '#E8F0DE' },
  sheetNote: { lineHeight: 16 },
  fixtureList: { gap: 10 },
  fixtureCell: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  fixtureCellSelected: { borderColor: '#9DBA82' },
  fixtureText: { paddingHorizontal: 10, paddingVertical: 8, gap: 2 },
  flex: { flex: 1 },
});

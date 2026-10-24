import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { useDemo, formatRupees, numberOrNull, type WaterAvailability } from '../../demo';
import { languageLabel, localeOptions, useT } from '../../locales';
import {
  Button,
  Field,
  Icon,
  ListRow,
  Screen,
  Sheet,
  Text,
  Toggle,
  colors,
} from '../../ui';
import { DemoAvatar } from '../../ui/DemoAvatar';
import { accentOptions, useAccent, useAccentPalette, useStyles, type AccentPalette } from '../../ui/AccentTheme';
import { profileCopy } from './strings';

/** Local picker copy — keeps the accent control self-contained. */
const ACCENT_LABEL = 'Accent colour';
const ACCENT_NOTE = 'Used for your avatar and key actions.';

const WATER_OPTIONS: { id: WaterAvailability; label: string }[] = [
  { id: 'rainfed', label: profileCopy['profile.water.rainfed'] },
  { id: 'limited', label: profileCopy['profile.water.limited'] },
  { id: 'reliable', label: profileCopy['profile.water.reliable'] },
];

type SheetId =
  | 'consent'
  | 'evidence'
  | 'freshness'
  | 'language'
  | 'about'
  | 'edit'
  | 'reset'
  | 'signOut'
  | null;

/** 15 · Farm profile & privacy — fixture identity, resources, settings and demo controls. */
export function ProfileScreen() {
  const { state, actions } = useDemo();
  const { accent, setAccent } = useAccent();
  const palette = useAccentPalette();
  const styles = useStyles(makeStyles);
  const t = useT();
  const [sheet, setSheet] = useState<SheetId>(null);
  const [attempted, setAttempted] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const draft = state.profileDraft;
  const waterLabel = WATER_OPTIONS.find(option => option.id === state.farm.water)?.label ?? '';

  const close = () => {
    setSheet(null);
    setAttempted(false);
  };

  const fullLocation = `${state.farm.district}, ${state.farm.stateName}`;

  return (
    <Screen>
      <View style={styles.heading}>
        <Text variant="heading" color={palette.heading} accessibilityRole="header">
          {t('profile.title')}
        </Text>
      </View>

      <View
        style={styles.identity}
        accessible
        accessibilityLabel={profileCopy['profile.identityA11y']
          .replace('{name}', state.farm.farmerName)
          .replace('{location}', fullLocation)}
      >
        <DemoAvatar size={48} />
        <View style={styles.identityText}>
          <Text variant="title" color={palette.ink}>
            {state.farm.farmerName}
          </Text>
          <Text variant="caption" color={palette.faint}>
            {fullLocation}
          </Text>
        </View>
      </View>

      <View style={[styles.farmCard, { backgroundColor: palette.surface }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={profileCopy['profile.editFarmA11y'].replace('{farm}', state.farm.farmName)}
          onPress={() => {
            actions.beginProfileEdit();
            setSheet('edit');
          }}
          style={styles.farmHead}
        >
          <Text variant="title" color={palette.deep} style={styles.flex}>
            {state.farm.farmName}
          </Text>
          <Icon name="pencil" size={17} color={palette.icon} />
        </Pressable>
        <ResourceRow label={t('profile.area')} value={profileCopy['profile.acres'].replace('{area}', String(state.farm.areaAcres))} />
        <ResourceRow label={t('profile.water')} value={waterLabel} />
        <ResourceRow
          label={t('profile.budget')}
          value={t('profile.budgetValue', { budget: formatRupees(state.farm.budget) })}
        />
      </View>

      <View>
        <ListRow
          icon="map-pin"
          title={t('profile.location')}
          description={
            state.consents.approximateLocation ? t('profile.location.on') : t('profile.location.off')
          }
          onPress={() => setSheet('consent')}
          style={styles.settingsRow}
        />
<ListRow
          icon="refresh-cw"
          title={t('profile.freshness')}
          description={t('profile.freshnessBody')}
          onPress={() => setSheet('freshness')}
          style={styles.settingsRow}
        />
        <ListRow
          icon="languages"
          title={t('profile.language')}
          description={languageLabel(state.locale)}
          onPress={() => setSheet('language')}
          style={styles.settingsRow}
        />
        <ListRow
          icon="info"
          title={t('profile.about')}
          description={t('profile.aboutBody')}
          onPress={() => setSheet('about')}
          style={styles.settingsRow}
        />
      </View>

      {/* Session accent — recolours the demo avatar and primary accents. */}
      <View style={styles.accentBlock}>
        <View style={styles.accentHead}>
          <Text variant="strong" color={palette.ink}>
            {ACCENT_LABEL}
          </Text>
          <Text variant="meta" color={palette.faint}>
            {accent.label}
          </Text>
        </View>
        <View style={styles.accentRow} accessibilityRole="radiogroup">
          {accentOptions.map(option => {
            const selected = accent.id === option.id;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${option.label} accent`}
                onPress={() => setAccent(option.id)}
                style={({ pressed }) => [
                  styles.swatchButton,
                  selected && styles.swatchButtonSelected,
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.swatch, { backgroundColor: option.strong }, selected && styles.swatchSelected]}>
                  {selected ? <Icon name="check" size={13} color={colors.white} strokeWidth={2.4} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
        <Text variant="meta" color={palette.faint}>
          {ACCENT_NOTE}
        </Text>
      </View>

      {/* Demo controls sit below the reference content, not inside it. */}
      <View style={styles.demoBlock}>
        <DemoRow icon="log-out"
          title={t('profile.signOut')}
          body={t('profile.signOutBody')}
          accessibilityLabel={profileCopy['profile.signOutA11y']}
          onPress={() => setSheet('signOut')}
        />

        {notice ? (
          <Text variant="meta" color={palette.chipInk}>
            {notice}
          </Text>
        ) : null}
        <Text variant="meta" color={palette.faint}>
          {t('profile.version')}
        </Text>
      </View>

      {/* ------------------------------------------------------------- sheets */}

      <Sheet visible={sheet === 'consent'} onClose={close} title={t('profile.consentSheet')}>
        <Text variant="meta" color={palette.faint} style={styles.sheetNote}>
          {profileCopy['profile.consentNote']}
        </Text>
        <View style={styles.sheetList}>
          <ConsentRow
            title={t('profile.consent.location')}
            body={profileCopy['profile.consent.locationDetail']}
            value={state.consents.approximateLocation}
            onChange={value => actions.setConsent('approximateLocation', value)}
          />
          <ConsentRow
            title={t('profile.consent.community')}
            body={profileCopy['profile.consent.communityDetail']}
            value={state.consents.communitySharing}
            onChange={value => actions.setConsent('communitySharing', value)}
          />
          <ConsentRow
            title={t('profile.consent.notifications')}
            body={profileCopy['profile.consent.notificationsDetail']}
            value={state.consents.notifications}
            onChange={value => actions.setConsent('notifications', value)}
          />
        </View>
        <Button title={t('common.done')} variant="secondary" trailingArrow={false} onPress={close} />
      </Sheet>

      <Sheet visible={sheet === 'language'} onClose={close} title={t('profile.languageSheet')}>
        <View style={styles.sheetList}>
          {localeOptions.map(option => {
            const selected = state.locale === option.code;
            return (
              <Pressable
                key={option.code}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={languageLabel(option.code)}
                onPress={() => actions.setLocale(option.code)}
                style={[styles.languageRow, selected && { backgroundColor: palette.surface }]}
              >
                <View style={styles.flex}>
                  <Text variant="subtitle" weight={selected ? 'semiBold' : 'regular'} color={palette.ink}>
                    {t(option.nativeKey)}
                  </Text>
                  {option.englishKey ? (
                    <Text variant="meta" color={palette.muted}>
                      {t(option.englishKey)}
                    </Text>
                  ) : null}
                </View>
                <View style={[styles.dot, selected && styles.dotSelected]}>
                  {selected ? <Icon name="check" size={13} color={palette.ink} strokeWidth={2} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
        <Text variant="meta" color={palette.faint} style={styles.sheetNote}>
          {profileCopy['profile.languageNote']}
        </Text>
        <Button title={t('common.done')} variant="secondary" trailingArrow={false} onPress={close} />
      </Sheet>

      <Sheet
        visible={sheet === 'evidence'}
        onClose={close}
        title={t('profile.evidenceSheet')}
        footer={
          <Button title={t('common.close')} variant="secondary" trailingArrow={false} onPress={close} />
        }
      >
        <Text variant="body" color={palette.muted} style={styles.sheetBody}>
          {profileCopy['profile.evidence.body']}
        </Text>
        <Text variant="strong" color={palette.ink}>
          {profileCopy['profile.evidence.sources']}
        </Text>
        <View style={styles.sourceList}>
          <SourceRow label={profileCopy['profile.evidence.farm']} />
          <SourceRow label={profileCopy['profile.evidence.soil']} />
          <SourceRow label={profileCopy['profile.evidence.market']} />
        </View>
        <Text variant="strong" color={palette.ink}>
          {profileCopy['profile.evidence.limits']}
        </Text>
        <Text variant="meta" color={palette.faint} style={styles.sheetBody}>
          {profileCopy['profile.evidence.limitsBody']}
        </Text>
      </Sheet>

      <Sheet
        visible={sheet === 'freshness'}
        onClose={close}
        title={t('profile.freshnessSheet')}
        footer={
          <Button title={t('common.close')} variant="secondary" trailingArrow={false} onPress={close} />
        }
      >
        <Text variant="body" color={palette.muted} style={styles.sheetBody}>
          {profileCopy['profile.freshness.body']}
        </Text>
        <View style={styles.sourceList}>
          <SourceRow label={profileCopy['profile.freshness.quotes']} value={profileCopy['profile.freshness.quotesValue']} />
          <SourceRow label={profileCopy['profile.freshness.soil']} value={profileCopy['profile.freshness.soilValue']} />
          <SourceRow label={profileCopy['profile.freshness.farm']} value={profileCopy['profile.freshness.farmValue']} />
        </View>
      </Sheet>

      <Sheet
        visible={sheet === 'about'}
        onClose={close}
        title={t('profile.aboutSheet')}
        footer={
          <Button title={t('common.close')} variant="secondary" trailingArrow={false} onPress={close} />
        }
      >
        <Text variant="body" color={palette.muted} style={styles.sheetBody}>
          {profileCopy['profile.about.body']}
        </Text>
        <View style={styles.aboutBlock}>
          <Text variant="strong" color={palette.ink}>
            {profileCopy['profile.about.resetTitle']}
          </Text>
          <Text variant="meta" color={palette.faint} style={styles.sheetBody}>
            {profileCopy['profile.about.resetBody']}
          </Text>
        </View>
        <Text variant="meta" color={palette.faint}>
          {t('profile.version')}
        </Text>
      </Sheet>

      <Sheet
        visible={sheet === 'edit'}
        onClose={() => {
          actions.cancelProfileEdit();
          close();
        }}
        title={profileCopy['profile.editTitle']}
        subtitle={profileCopy['profile.editSubtitle']}
      >
        {draft ? (
          <View style={styles.form}>
            <Field
              label={profileCopy['profile.field.name']}
              placeholder="Enter your name"
              autoCapitalize="words"
              autoComplete="name"
              value={draft.farmerName}
              onChangeText={farmerName => actions.updateProfileDraft({ farmerName })}
              error={attempted && !draft.farmerName.trim() ? t('profile.error.name') : undefined}
            />
            <View style={styles.formRow}>
              <Field
                label={profileCopy['profile.field.district']}
                value={draft.district}
                onChangeText={district => actions.updateProfileDraft({ district })}
                style={styles.flex}
              />
              <Field
                label={profileCopy['profile.field.state']}
                value={draft.stateName}
                onChangeText={stateName => actions.updateProfileDraft({ stateName })}
                style={styles.flex}
              />
            </View>
            <Field
              label={profileCopy['profile.field.farm']}
              value={draft.farmName}
              onChangeText={farmName => actions.updateProfileDraft({ farmName })}
            />
            <View style={styles.formRow}>
              <Field
                label={profileCopy['profile.field.area']}
                value={draft.areaAcres === null ? '' : String(draft.areaAcres)}
                onChangeText={text => actions.updateProfileDraft({ areaAcres: numberOrNull(text) })}
                keyboardType="decimal-pad"
                error={
                  attempted && (draft.areaAcres === null || draft.areaAcres <= 0)
                    ? t('profile.error.area')
                    : undefined
                }
                style={styles.flex}
              />
              <Field
                label={profileCopy['profile.field.budget']}
                value={draft.budget === null ? '' : String(draft.budget)}
                onChangeText={text => actions.updateProfileDraft({ budget: numberOrNull(text) })}
                keyboardType="number-pad"
                error={
                  attempted && (draft.budget === null || draft.budget <= 0)
                    ? t('profile.error.budget')
                    : undefined
                }
                style={styles.flex}
              />
            </View>

            <Text variant="caption" color={palette.muted}>
              {profileCopy['profile.field.water']}
            </Text>
            <View style={styles.waterRow}>
              {WATER_OPTIONS.map(option => {
                const selected = draft.water === option.id;
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={option.label}
                    onPress={() => actions.updateProfileDraft({ water: option.id })}
                    style={[styles.waterChip, selected && { backgroundColor: palette.active }]}
                  >
                    <Text variant="meta" weight={selected ? 'semiBold' : 'medium'} color={palette.chipInk}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text variant="meta" color={palette.faint} style={styles.sheetNote}>
              {t('profile.editNote')}
            </Text>

            <Button
              title={profileCopy['profile.saveAction']}
              trailingArrow={false}
              onPress={() => {
                setAttempted(true);
                if (
                  !draft.farmerName.trim() ||
                  draft.areaAcres === null ||
                  draft.areaAcres <= 0 ||
                  draft.budget === null ||
                  draft.budget <= 0
                ) {
                  return;
                }
                actions.saveProfileEdit();
                close();
                setNotice(profileCopy['profile.saved']);
              }}
            />
            <Button
              title={profileCopy['profile.edit.discard']}
              variant="ghost"
              trailingArrow={false}
              onPress={() => {
                actions.cancelProfileEdit();
                close();
              }}
            />
          </View>
        ) : (
          <Text variant="body" color={palette.muted}>
            {t('profile.editNote')}
          </Text>
        )}
      </Sheet>

      <Sheet
        visible={sheet === 'reset'}
        onClose={close}
        title={t('profile.resetConfirm')}
        footer={
          <View style={styles.confirmActions}>
            <Button title={t('common.cancel')} variant="secondary" trailingArrow={false} onPress={close} />
            <Button
              title={t('profile.reset')}
              trailingArrow={false}
              onPress={() => {
                actions.resetDemo();
                close();
                // Drop the authenticated (tabs) stack so hardware back cannot
                // re-enter the app while signed out.
                if (router.canDismiss()) router.dismissAll();
                router.replace('/sign-in');
              }}
            />
          </View>
        }
      >
        <Text variant="body" color={palette.muted} style={styles.sheetBody}>
          {t('profile.resetBody')}
        </Text>
      </Sheet>

      <Sheet
        visible={sheet === 'signOut'}
        onClose={close}
        title={t('profile.signOutConfirm')}
        footer={
          <View style={styles.confirmActions}>
            <Button title={t('common.cancel')} variant="secondary" trailingArrow={false} onPress={close} />
            <Button
              title={t('profile.signOut')}
              trailingArrow={false}
              onPress={() => {
                actions.signOut();
                close();
                if (router.canDismiss()) router.dismissAll();
                router.replace('/sign-in');
              }}
            />
          </View>
        }
      >
        <Text variant="body" color={palette.muted} style={styles.sheetBody}>
          {t('profile.signOutBody')}
        </Text>
      </Sheet>

</Screen>
  );
}

function ResourceRow({ label, value }: { label: string; value: string }) {
  const styles = useStyles(makeStyles);
  const palette = useAccentPalette();
  return (
    <View style={styles.resourceRow}>
      <Text variant="caption" color={palette.faint}>
        {label}
      </Text>
      <Text variant="caption" weight="medium" color={palette.chipInk} style={styles.flex} align="right">
        {value}
      </Text>
    </View>
  );
}

function DemoRow({
  icon,
  title,
  body,
  accessibilityLabel,
  onPress,
}: {
  icon: 'replace' | 'triangle-alert' | 'refresh-cw' | 'log-out';
  title: string;
  body: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  const styles = useStyles(makeStyles);
  const palette = useAccentPalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${accessibilityLabel}. ${body}`}
      onPress={onPress}
      style={({ pressed }) => [styles.demoRow, pressed && styles.pressed]}
    >
      <Icon name={icon} size={18} color={palette.icon} />
      <View style={styles.flex}>
        <Text variant="strong" color={palette.ink}>
          {title}
        </Text>
        <Text variant="meta" color={palette.faint}>
          {body}
        </Text>
      </View>
      <Icon name="chevron-right" size={16} color={palette.iconFaint} />
    </Pressable>
  );
}

function ConsentRow({
  title,
  body,
  value,
  onChange,
}: {
  title: string;
  body: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const styles = useStyles(makeStyles);
  const palette = useAccentPalette();
  return (
    <View style={styles.consentRow}>
      <View style={styles.flex}>
        <Text variant="strong" color={palette.ink}>
          {title}
        </Text>
        <Text variant="meta" color={palette.faint}>
          {body}
        </Text>
      </View>
      <Toggle value={value} onValueChange={onChange} accessibilityLabel={title} />
    </View>
  );
}

function SourceRow({ label, value }: { label: string; value?: string }) {
  const styles = useStyles(makeStyles);
  const palette = useAccentPalette();
  return (
    <View style={styles.sourceRow}>
      <Icon name="circle-check" size={15} color={palette.icon} />
      <Text variant="meta" color={palette.faint} style={styles.flex}>
        {label}
      </Text>
      {value ? (
        <Text variant="meta" weight="medium" color={palette.chipInk}>
          {value}
        </Text>
      ) : null}
    </View>
  );
}

const makeStyles = (p: AccentPalette) => StyleSheet.create({
  flex: { flex: 1 },
  heading: { gap: 6 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 51 },
  identityText: { flex: 1, gap: 4 },

  farmCard: { backgroundColor: '#EEF4E7', borderRadius: 18, padding: 16, gap: 10 },
  farmHead: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  resourceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 17 },

  settingsRow: { minHeight: 72, paddingVertical: 16, borderBottomWidth: 0, borderBottomColor: '#E7EDE0' },

  accentBlock: { gap: 10 },
  accentHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  accentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  swatchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: p.border,
    backgroundColor: p.surfaceSoft,
  },
  swatchButtonSelected: { borderColor: p.ink, borderWidth: 1.5 },
  swatch: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: { width: 30, height: 30, borderRadius: 15 },

  demoBlock: { gap: 10, paddingTop: 8 },
  demoRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 0,
    borderBottomColor: '#E7EDE0',
  },
  pressed: { opacity: 0.8 },

  sheetList: { gap: 8 },
  sheetNote: { lineHeight: 16 },
  sheetBody: { lineHeight: 20 },
  languageRow: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#F2F5EC',
  },
  languageRowSelected: { backgroundColor: '#E8F0DE' },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#D6DFD0',
    backgroundColor: '#FEFFFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotSelected: { backgroundColor: '#C4DEA9', borderColor: '#C4DEA9' },

  consentRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    borderBottomWidth: 0,
    borderBottomColor: '#E7EDE0',
  },
  sourceList: { gap: 8, paddingVertical: 4 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 24 },
  aboutBlock: { gap: 4, paddingTop: 8 },

  form: { gap: 12 },
  formRow: { flexDirection: 'row', gap: 12 },
  waterRow: { flexDirection: 'row', gap: 8 },
  waterChip: {
    minHeight: 44,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 99,
    backgroundColor: '#EBF2E4',
  },
  waterChipSelected: { backgroundColor: '#D4E7BE' },
  confirmActions: { gap: 10 },
});

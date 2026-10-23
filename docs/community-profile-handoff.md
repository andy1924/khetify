# Community & Profile — implementation handoff

UI-only Expo Go demo. No backend, network, permissions, camera, gallery or upload.
Owned files: `src/features/community/**`, `src/features/profile/**`, this note.

## Changed files

Community (`src/features/community/`)
- `index.tsx` — exports `CommunityScreen`, `ComposeScreen`, `ObservationDetailScreen`.
- `CommunityScreen.tsx` — feed (fixture `selectFilteredFeed`), three filter chips with working
  selection, filter sheet, 42×42 compose action inside a 48dp target, post → detail with
  `?id=`, submit success banner on return, footer note.
- `ComposeScreen.tsx` — editable type (sheet), crop, observed date/label, district, notes;
  approximate-location toggle; camera/gallery open a local **fixture** picker with preview and
  remove/change; validation for notes/observed/district; submit prepends a `Reported` item via
  `actions.submitObservation()` and returns to the feed; Cancel discards the draft only.
- `ObservationDetailScreen.tsx` — `/community/detail?id=…`; exact fixture title/labels/status,
  status explanation, privacy/limitations, and an evidence sheet. Unknown id → bounded
  not-found state.
- `components.tsx` — heading, feed post (meta/badge/16-title/12-body/hairline), status chips,
  three vector fixture illustrations (native `react-native-svg`, no image assets or permissions).
- `strings.ts` — feature-owned keyed English copy (see “Keys to centralise”).

Profile (`src/features/profile/`)
- `index.tsx` — exports `ProfileScreen`.
- `ProfileScreen.tsx` — Asha Patil / AP avatar / East field card with Area, Water, Season
  budget; five settings rows (Location & consent, Evidence library, Data freshness, Language,
  About Khetify); farm edit sheet (name, district, state, farm, area, budget, water) with
  cancel/confirm and inline errors; language sheet with the six real script names writing
  `state.locale`; three separate consent switches (location / community / in-app reminders);
  evidence, freshness and about sheets. Demo controls sit **below** the reference content.
- `strings.ts` — feature-owned keyed English copy.

## Demo controls (below reference content)

- **First-visit scenario** — confirm → `actions.startFirstVisit()` then
  `router.navigate('/(tabs)/plan')`.
- **Reset demo** — confirm dialog → `actions.resetDemo()` then `router.replace('/language')`.
- **Sign out** — confirm dialog using `profile.signOut*` copy → `actions.signOut()` then
  `router.replace('/language')`.

A failure-scenario control was drafted and removed: `otpFailed()` changes `otpStatus` only, and
`onboarding/otpReset` cannot be reached through `DemoActions`, so no honest scenario could be
staged without editing `src/demo`. The OTP screen's own failure/retry path (odd last digit)
still covers that state.

## Design notes

- 24pt gutters, 20pt section gaps, 28/600 headings, 48dp minimum targets; the 25pt chips are
  wrapped in 48dp pressables and are `radio` controls with `accessibilityState.selected`.
- `Screen` keeps `bottom={false}` (parent renders the floating tab footer + bottom inset).
  Compose passes `keyboard` for notes; all sheets use the shared `Sheet` (internal scroll).
- No fake status/gesture chrome, no elevation, no screenshot-as-app. Feed titles use 16/600
  `#47603B` and bodies 12/400 `#68715C`; profile row anatomy mirrors the reference
  (14/500 `#5C7950`, 11/400 `#697462`, 21pt icon, hairline `#E7EDE0`).
- Photos are illustrated native vectors rendered by `react-native-svg`; selecting one shows a
  preview plus label/“Fixture photo selected”. No bundle assets added, so no provenance work.

## Keys to centralise (`src/locales`)

All reference copy reuses existing keys (`community.*`, `compose.*`, `profile.*`, `common.*`).
These are new and live in feature `strings.ts`; move them into `src/locales/en.ts` when the
locale owner is free (do not double-edit):

`community.filterSheet`, `community.filterNote`, `community.filter.done`, `community.time.justNow`,
`community.dismiss`, `community.photo.fixture`, `community.photo.remove`, `community.photo.change`,
`community.photo.pickerTitle`, `community.photo.cameraTitle`, `community.photo.galleryTitle`,
`community.photo.pickerNote`, `community.photo.badge`, `community.photo.a11y`.

`compose.typeSheet`, `compose.type.pest`, `compose.type.water`, `compose.type.other`,
`compose.observedRequired`, `compose.districtRequired`, `compose.districtApproximate`,
`compose.locationOn`, `compose.photoAddA11y`.

`detail.back`, `detail.notFound`, `detail.notFoundBody`, `detail.backToFeed`, `detail.summary`,
`detail.meta`, `detail.status`, `detail.evidence`, `detail.evidenceSheetTitle`,
`detail.evidenceSheetBody`, `detail.evidenceReported/Reviewed/Confirmed`, `detail.privacyTitle`,
`detail.privacyBody`, `detail.limitsTitle`, `detail.limitsBody`, `detail.source`,
`detail.sourceValue`, `detail.observed`, `detail.distance`, `detail.cropLabel`,
`detail.districtLabel`, `detail.reportedLabel`, `detail.noPhoto`, `detail.footer`.

`profile.identityA11y`, `profile.editFarmA11y`, `profile.acres`, `profile.water.*`,
`profile.editTitle`, `profile.editSubtitle`, `profile.field.*`, `profile.edit.discard`,
`profile.edit.discardTitle`, `profile.edit.discardBody`, `profile.edit.keepEditing`,
`profile.saveAction`, `profile.saved`, `profile.languageNote`, `profile.consentHeading`,
`profile.consentNote`, `profile.consent.*Detail`, `profile.evidence.*`, `profile.freshness.*`,
`profile.about.*`, `profile.demoControls`, `profile.demoNote`, `profile.resetA11y`,
`profile.signOutA11y`, `profile.firstVisit`, `profile.firstVisitBody`, `profile.firstVisitA11y`.

## Checks

- `node_modules/.bin/tsc --noEmit` — clean for these modules; only the known
  `features/home` / `features/plan` missing-module errors remain (other worker).
- `node_modules/.bin/eslint src/features/community src/features/profile` — 0 errors, 0 warnings.

## Gaps / integration

- Parent must confirm `src/app/community/*` and tab routes still import from the feature
  indexes (unchanged contract). `router.dismissAll()` is not used.
- Feed pagination, real photos, uploads, moderation and notifications are intentionally absent.
- Reset/sign-out rely on `router.replace('/language')`; if the orchestrator changes that route,
  update both confirm handlers.

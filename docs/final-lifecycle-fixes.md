# Final lifecycle fixes — home / plan / community / profile

UI-only. Scope: `src/features/{home,plan,community,profile}` + this file. No shared
locale, demo-reducer, route, dependency or app-level edits were made.

## Fixed

### Assessment (`src/features/plan/AssessmentScreen.tsx`)

- **Draft reinitialized right after cancel/save** — the old
  `useEffect([state.assessmentDraft])` called `beginAssessment()` whenever the
  draft became `null`, which is exactly what cancel/save produce. The screen now
  seeds once per focus entry (`useFocusEffect`, `draftRef` guard) and clears the
  draft on blur. Cancel/discard/save no longer rebuild the form in place.
- **Back listener stayed active off-screen** — the `BackHandler` subscription
  moved from a bare `useEffect` (re-subscribed on every render, retained while
  covered) to `useFocusEffect`, so only the focused screen handles hardware back.
- Fresh local form state (`dirty`, `step`, `seedId`, `errors`, `discardOpen`) is
  reset on each focus entry, so a retained route cannot show stale step-2 state.
- Navigation uses `router.canGoBack() ? back() : replace('/(tabs)/plan')` so a
  deeplinked entry cannot leave the user stuck.
- **Seed clobbering after save** — verified against the reducer: `assessment/save`
  sets `plan.stages` from fixtures (`seedId: null`) and the following
  `setStageSeed('seed', seedId)` runs as a separate dispatch on the committed
  state, so the selected seed survives. Order is unchanged; save now also clears
  `dirty`.

### Review (`src/features/plan/ReviewScreen.tsx`)

- **Abandoned revision draft leaked through the tab bar** — `cancelRevision()` now
  runs on blur via `useFocusEffect`, and the `BackHandler` listener is registered
  inside that same focus effect (so it is removed when Review is not focused and
  cannot intercept back for another screen). A reopened Review always starts from
  the current plan budget instead of a stale abandoned draft.
- `cancel()` / hardware back use `canGoBack()` with a Plan fallback.

### Compose (`src/features/community/ComposeScreen.tsx`)

- **Draft survived hardware back / tab exit** — `resetObservationDraft()` now runs
  on blur via `useFocusEffect`, matching explicit Cancel. Stale notes, photo,
  district and type no longer reappear on the next compose.
- **Submitted post invisible under the Crop filter when Crop was blank** — Crop
  stays optional and we do not fabricate a crop for the farm. Instead, after a
  successful submit the screen switches the feed filter to `nearby` (the new
  fixture post is `distanceKm: 2`), so the success banner and the new "Reported"
  post are always visible. `actions.setCommunityFilter` is already exposed by the
  demo store; no shared contract change was needed.

### Profile (`src/features/profile/ProfileScreen.tsx`)

- **Reset left the authenticated stack behind** — reset now mirrors sign-out:
  `canDismiss() && dismissAll()` before `replace('/language')`, so hardware back
  from `/language` cannot re-enter the signed-out tab app. Sign-out got the same
  `canDismiss()` guard for safety.

## Verified / unchanged

- Home: no lifecycle handlers; renders from state only.
- Stage detail (`plan/StageScreen.tsx`): no `BackHandler`; seed and quote edits
  commit directly to the store, so there is no draft to discard. Untouched.
- Community feed/detail: no `BackHandler`; sheets dismiss via `Modal`
  `onRequestClose`. Untouched.
- Shared contracts: no changes requested. `setCommunityFilter`,
  `resetObservationDraft`, `cancelRevision`, `cancelAssessment`,
  `beginAssessment` were all already in `DemoActions`.

## Checks

- `npx tsc --noEmit` — clean (exit 0).
- `npx eslint src/features/home src/features/plan src/features/community src/features/profile` — clean (exit 0).
- No device/emulator interaction; native QA remains with the parent.

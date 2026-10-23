# Remaining flows — independent review (home / plan / community / profile)

Scope: `src/features/home`, `src/features/plan`, `src/features/community`, `src/features/profile`, read against `src/demo` reducer/selectors and the route tree. Bounded, read-only; no edits outside this file. `tools/onboarding` excluded (other reviewer). Verified against the original brief (UI-only, exact final Qx0SG, native Expo Go, no backend, drafts cancel, confirm on local state, 5 tabs).

Result: 4 concrete lifecycle/state defects, all in the draft-vs-navigation seam. All other checked behaviours were correct.

## 1. Compose draft survives Android hardware back (no cancel)

- **File:** `src/features/community/ComposeScreen.tsx:54` (only `cancel()` resets; handler absent), route `src/app/community/compose.tsx`
- **Repro:** Community → `+` → type notes / pick a fixture photo / enable location → press Android hardware back (do not tap Cancel) → `+` again.
- **Impact:** The previous draft is still in `state.community.draft` (`community/draftReset` is never dispatched). Stale notes, photo and district reappear and can be submitted as a new report, which contradicts the "drafts cancel" requirement; Cancel and hardware back behave differently.
- **Minimal fix:** add a `BackHandler` listener that calls `cancel()` + `router.back()` (same pattern as `AssessmentScreen.tsx:57`), or a blur cleanup mirroring `src/features/tools/ImportScreen.tsx:21`.

## 2. Abandoned plan-revision draft leaks through the tab bar and resurfaces

- **Files:** `src/features/plan/ReviewScreen.tsx:22` (cancel only on explicit button), `src/demo/reducer.ts:196` (`if (state.plan.revisionDraft) return state`), `src/features/plan/PlanScreen.tsx:98`; tab bar is visible on pushed routes (`src/app/_layout.tsx:39`)
- **Repro:** Plan → Revise → tap the budget strip → set 30000 → Apply → tap the **Home** tab → Plan → Revise.
- **Impact:** Navigating away pops Review without `cancelRevision`, so `revisionDraft` stays stored. `beginRevision` is a no-op while a draft exists, so the reopened Review silently shows the abandoned 30000 budget as if it were the fresh reference 26000; confirming it commits a budget from a flow the user never finished. Double-tapping Revise likewise pushes two Review screens over the same draft.
- **Minimal fix:** clear the draft on blur/unmount (`useFocusEffect(() => () => actions.cancelRevision())` pattern, as `ImportScreen.tsx:21`), or drop the guard in `revisionBegin` so each entry starts from `state.plan.budget`.

## 3. Submitted observation disappears under the Crop filter when crop is blank

- **Files:** `src/demo/reducer.ts:79` (`crop: draft.crop`), filter at `src/demo/selectors.ts:56`; crop is optional in `ComposeScreen.tsx:96`
- **Repro:** Community → filter **Crop** → `+` → leave Crop empty (placeholder "Unknown"), fill notes, observed, district → Submit.
- **Impact:** Success banner says the report was added, but `draft.crop` is `''`, which never equals `state.farm.crop`, so the new "Reported" post is filtered out and the feed shows the empty state. The submission looks lost.
- **Minimal fix:** in `submittedObservation`, fall back to the farm crop when the field is blank (`crop: draft.crop.trim() || state.farm.crop`), or default the compose field to the farm crop.

## 4. Reset leaves the authenticated stack behind, so Back re-enters the app

- **File:** `src/features/profile/ProfileScreen.tsx:470` (`actions.resetDemo(); close(); router.replace('/language')`); contrast sign-out at `:493-495` which calls `router.dismissAll()` first
- **Repro:** Profile → Reset → confirm → `/language` → press Android hardware back.
- **Impact:** Reset clears auth (`resetDemo` → `createInitialState`) but only replaces the top route; the pushed `(tabs)` stack entry remains, so Back returns to the 5-tab app while signed out, no language/OTP gate. Sign-out does not have this bug, so the two demo controls behave inconsistently; `src/app/index.tsx` only guards the `/` entry route.
- **Minimal fix:** mirror sign-out — `router.dismissAll(); router.replace('/language')` in the reset confirm (or `router.replace('/')` and let the index redirect run).

## Checked, no defect

- Assessment back: dirty → discard sheet, "Keep editing" retains, "Discard"/keep-clean path cancels draft then pops. `dirty` is set only by real patches, so unit toggling correctly does not prompt.
- Assessment save/skip-seed writes farm + seed stage, then replaces to Plan; step-2 revalidation cannot leave a half-saved plan.
- Review cancel/confirm and Stage done/unlock match the reducer (`version`, budget, `committedCost`, next-stage unlock).
- Profile edit begin/update/save/cancel round-trips the draft (save clears draft and recomputes initials); modal/hardware back cancels without committing.
- Community filter chips/sheet, detail status + source/evidence copy, submitted "Reported" badge; compose validation only gates notes/district/observed, as intended.
- Home and Profile render from state only; no duplicated or unreferenced extra copy rows remain in the reviewed files.

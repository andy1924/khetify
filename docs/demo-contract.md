# Demo store contract (src/demo) — published by the foundation worker

UI-only Expo Go demo. In-memory state only. No backend, SMS, network or persistence.
Other workers: import from `src/demo` and `src/locales` only; do not edit these modules.
Preserve other agents' work.

## Integration

`src/app/_layout.tsx` (orchestrator) wraps the app in `<DemoProvider>`. Every screen gets state through `useDemo()`.

```tsx
import { useDemo, selectRemainingBudget, selectMarketRows } from '../../demo';
import { useT } from '../../locales';

function Example() {
  const { state, actions } = useDemo();
  const t = useT();
  return <Text>{t('plan.budget.label', { budget: formatRupees(state.plan.budget) })}</Text>;
}
```

`useDemo()` returns `{ state: DemoState, dispatch, actions: DemoActions }`.
Also exported: `useDemoState()`, `useDemoActions()`, `useDemoSelector(fn)`, `DemoProvider`, `demoReducer`, `createInitialState()`, `initialDemoState`.
All action helpers are typed and semantic; prefer `actions.*` over raw `dispatch`.

## State (exact fixtures)

```ts
type Locale = 'en' | 'hi' | 'mr' | 'gu' | 'ta' | 'te';
type WaterAvailability = 'rainfed' | 'limited' | 'reliable';
type OtpStatus = 'idle' | 'sending' | 'verifying' | 'success' | 'error';
type StageId = 'land' | 'seed' | 'preparation' | 'nutrition' | 'harvest' | 'selling';
type StageStatus = 'completed' | 'current' | 'locked';
type ObservationStatus = 'reported' | 'reviewed' | 'confirmed';
type CommunityFilter = 'nearby' | 'crop' | 'week';
type SoilParamKey = 'ph' | 'organicCarbon' | 'electricalConductivity' | 'nitrogen' | 'phosphorus'
  | 'potassium' | 'sulphur' | 'zinc' | 'iron' | 'copper' | 'manganese' | 'boron';
type ConsentKey = 'approximateLocation' | 'communitySharing' | 'notifications';
type ToolKind = 'soil' | 'cropPhoto' | 'grainQuality' | 'grainId' | 'forecast' | 'mandi';

interface DemoState {
  locale: Locale;                       // selected language, kept in memory
  onboarding: {
    mobile: string;                     // raw 10 digits, fixture '9876526448'
    otpStatus: OtpStatus;
    otpAttempts: number;
    signedIn: boolean;                  // false initially
    completed: boolean;                 // true after OTP success
  };
  farm: {
    farmerName: 'Asha Patil'; initials: 'AP';
    district: 'Nashik'; state: 'Maharashtra';
    farmName: 'East field'; areaAcres: 2;
    crop: 'Wheat'; season: 'Rabi'; water: 'limited'; budget: 30000;
    soilTest: { sampleDate: string; values: Partial<Record<SoilParamKey, string>> } | null;
  };
  plan: {
    exists: boolean;                    // true initially (active-plan fixture)
    version: number;                    // 1
    budget: number;                     // mirrors farm.budget (30000)
    committedCost: number;              // 5200 → remaining 24800
    stages: PlanStage[];                // six stages, see below
    revisionDraft: PlanRevisionDraft | null;
    revisionHistory: { version: number; budget: number; delta: number }[];
  };
  assessmentDraft: AssessmentDraft | null;   // isolated draft
  profileDraft: ProfileDraft | null;         // isolated draft
  soil: {
    crop: 'Wheat'; sampleDate: '2026-10-12';
    values: Partial<Record<SoilParamKey, string>>;  // { ph: '7.4', organicCarbon: '0.6' }
    showAdditional: boolean;
    result: SoilResult | null;
    importDraft: boolean;               // confirmation view open
    imported: boolean;
  };
  market: {
    commodity: 'Wheat'; grade: 'FAQ'; quantityQuintals: 10;
    quotes: MarketQuote[];              // Lasalgaon 2520/₹850, Nashik 2560/₹1350, Pimpalgaon 2500/unknown
  };
  community: {
    filter: CommunityFilter;            // 'nearby' initially
    feed: Observation[];                // three fixture observations
    draft: ObservationDraft;
    submittedIds: string[];
    lastSubmittedId: string | null;
  };
  consents: { approximateLocation: boolean; communitySharing: boolean; notifications: boolean }; // all false
  toolHistory: ToolHistoryEntry[];
}
```

Stage fixture (order fixed):

| # | id | title key | status | caption key |
|---|----|-----------|--------|-------------|
| 01 | land | plan.stage.land.title | completed | plan.stage.land.done |
| 02 | seed | plan.stage.seed.title | current | plan.stage.seed.current |
| 03 | preparation | plan.stage.preparation.title | locked | plan.stage.preparation.locked |
| 04 | nutrition | plan.stage.nutrition.title | locked | plan.stage.nutrition.locked |
| 05 | harvest | plan.stage.harvest.title | locked | plan.stage.harvest.locked |
| 06 | selling | plan.stage.selling.title | locked | plan.stage.selling.locked |

`PlanStage = { id, ordinal: '01'..'06', status, titleKey, captionKey, quotePerKg: number | null, seedId: string | null }`.
`seedId` is the chosen option from the demo shortlist; the fixture starts `null` (Awaiting selection).
No seed dose or cost is derived from it.
`PlanRevisionDraft = { fromBudget, toBudget, delta, changes: { id, titleKey, detailKey }[] }`
(fixture 30000 → 26000, three changes: storage, seed shortlist, area/water).
`delta` is the reference screen's **sample cost estimate** (3200), independent of the budget
reduction (4000). It is a fixture, not a proportional algorithm. `setRevisionBudget` edits the
target budget only; confirming still reduces `committedCost` by 3200.

## Actions (semantic)

```ts
actions.setLocale(code)
actions.setMobile(digits)                  // strips non-digits, max 10
actions.otpSending() / otpVerifying() / otpSuccess() / otpFailed() / otpReset()
actions.completeOnboarding()
actions.signOut()
actions.resetDemo()                        // restore every fixture
actions.startFirstVisit()                  // plan.exists = false (empty-state scenario)

actions.beginAssessment() / updateAssessment(patch) / cancelAssessment() / saveAssessment()
actions.beginRevision() / cancelRevision() / confirmRevision()
actions.setStageQuote(stageId, quotePerKg | null)
actions.setStageSeed(stageId, seedId | null)
actions.setRevisionBudget(budget | null)        // editable target, delta stays 3200
actions.markStageDone(stageId)

actions.setSoilValue(key, value) / clearSoilValue(key)
actions.setSoilUnit(key, unit) // units snapshot into results and selected farm imports
actions.toggleSoilAdditional() / setSoilContext({ crop?, sampleDate? })
actions.analyzeSoil() / beginSoilImport() / cancelSoilImport()
actions.confirmSoilImport(keys?: SoilParamKey[]) // only reviewed populated fields; needs importDraft

actions.setMarketQuantity(quintals)
actions.setMarketCost(marketId, 'transport' | 'handling' | 'fees', number | null)

actions.setCommunityFilter(filter)
actions.updateObservation(patch) / setObservationLocationConsent(boolean)
actions.setObservationPhoto(photoId | null) / submitObservation() / resetObservationDraft()

actions.beginProfileEdit() / updateProfileDraft(patch) / cancelProfileEdit() / saveProfileEdit()
actions.setConsent(key, boolean)
actions.recordToolUse(tool, labelKey, summary) // newest first, deduplicated, five local entries
actions.clearToolHistory()                   // resetDemo also clears history
```

## Selectors and formatting helpers

```ts
selectRemainingBudget(state)        // plan.budget - plan.committedCost → 24800 initially
selectMarketRows(state)             // [{ id, name, pricePerQuintal, costs, costsTotal, net, incomplete }]
                                    // net = price × qty − costsTotal; null when any cost is null
selectSoilSummary(state)            // { entered: {key,value}[], enteredCount, totalCount: 12, unknownCount }
selectFilteredFeed(state)           // filter: nearby ≤10 km · crop 'Wheat' · week ≤168 h
selectCurrentStage(state) / selectStage(state, id)
selectIsAuthenticated(state)

formatRupees(30000) → '30,000'      // Indian grouping, no symbol
formatIndianMobile('9876526448') → '98765 26448'
formatDateLabel('2026-10-12') → '12 Oct 2026'
maskedMobile('9876526448') → '+91 ••••••6448'
DEMO_OTP_CODE = '526448'
```

## Invariants

- Unknown stays unknown. No invented agronomy, fertilizer doses, seed rates or prices.
  Seed quote storage only records the farmer-entered ₹/kg; quantity/cost stay `Unknown`.
- Market net proceeds are `null` when any cost is unknown; never treated as zero.
- Soil result is partial: 2 of 12 values, no nutrient/suitability claims.
- Drafts are isolated: `assessmentDraft`, `profileDraft`, `plan.revisionDraft`,
  `soil.importDraft`, `community.draft`. Cancel clears the draft and leaves committed state untouched.
- `confirmSoilImport` is a no-op unless `soil.importDraft` is true; it imports only the requested
  keys that are populated, ignores unknown/empty ones, and never adds tasks or budget lines.
- `saveAssessment` commits farm values; creates the plan (stage 1 done, stage 2 current) when absent.
- `confirmRevision` applies the draft budget (default 26000), reduces `committedCost` by 3200, bumps `version` to 2,
  mirrors `farm.budget`, and keeps prior versions in `revisionHistory`.
- `markStageDone` only completes the current stage, unlocks the next, and never fabricates cost.
- `confirmSoilImport` fills `farm.soilTest` only; it adds no tasks and does not change budget.
- `submitObservation` prepends a `reported` item to the local feed and resets the draft.
- `saveProfileEdit` commits name/district/farm/area/water/budget, keeps plan budget in sync.
- `signOut`: signedIn/completed false, mobile cleared, OTP idle, all drafts cleared. Fixtures and plan stay.
- `resetDemo`: every field returns to the fixture above. `startFirstVisit`: plan.exists false for the empty-state screen.

## Localization

`src/locales` owns all interface copy. Reference English only; no fabricated translations —
every non-English locale falls back to the English string. Native language names are real.

```ts
import { useT, translate, localeOptions, stageTitleKey } from '../../locales';
const t = useT();                       // reads state.locale
t('ob.mobile.send');
t('plan.budget.label', { budget: formatRupees(state.plan.budget) });
translate('en', 'common.cancel');
```

`StringKey` is the exhaustive union of dictionary keys. Stage titles/captions come from
`plan.stage.<id>.title|current|locked|done`; use `stageTitleKey(id)` and `stage.captionKey` directly.
Do not invent new agronomic or safety copy: add a key and report it to the orchestrator instead.

## Seed quote / OTP notes

OTP is fully local: deterministic timers, `526448` is the demo code, resend countdown 24 s,
manual fallback sheet for failure/retry. No SMS, permissions or API calls.

## Onboarding (foundation, done)

Exported from `src/features/onboarding/index.tsx`: `LanguageScreen`, `MobileScreen`, `OtpScreen`
(route files under `src/app` stay thin imports).

- `LanguageScreen`: six radio options, selection stored as `state.locale`, CTA label follows the
  selected language's native name. Copy itself stays English (no fabricated translations).
- `MobileScreen`: editable `+91` field (fixture `98765 26448`), inline validation for empty/short/
  invalid Indian numbers, simulated `Send verification code` → `/otp`, and a local Terms & privacy
  sheet. No SMS, permissions or network.
- `OtpScreen`: deterministic local timers (`sending` → `verifying` → `success|error`), 24 s resend
  countdown, retry after failure, manual-entry fallback (`DEMO_OTP_CODE = '526448'`), change-number
  back navigation, and `router.replace('/(tabs)/home')` after success. All timers are cleaned up
  on unmount. A number ending in an odd digit fails its first automatic attempt; retries succeed.
- Shared pieces in `src/features/onboarding/components.tsx` (`OnboardingHeader` + language sheet,
  `StepHeading`, `SelectionDot`, `OnboardingFooter`, `FooterNote`, `useOnboardingNav`).
- `resetDemo` / `signOut` semantics are documented above; onboarding never writes plan or farm data.

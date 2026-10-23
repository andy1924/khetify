# Home / Farm Plan handoff (feature worker)

Scope: `src/features/home/**` and `src/features/plan/**` only. No dependency,
config, route, shared-UI or locale edits. No commits, no backend.

## Changed files

- `src/features/home/HomeScreen.tsx` — 01 Home: greeting + initials avatar, farm
  summary + Demo chip, hero card with `Continue my plan` → `/(tabs)/plan`, next step
  block → `/tools/soil`, three shortcuts (`/tools/soil`, `/tools/photo`, `/tools/mandi`),
  plan-remaining note and demo footer. All values read from `useDemo()` fixtures.
- `src/features/home/strings.ts` — temporary feature-local copy (see additions).
- `src/features/home/index.tsx` — exports `HomeScreen`.
- `src/features/plan/PlanScreen.tsx` — 02/04: empty state when `!state.plan.exists`
  (`Assess my farm` → begins assessment and pushes `/plan/assessment`;
  `Browse independent tools` → `/(tabs)/tools`), otherwise the active plan with the
  remaining-budget card (`selectRemainingBudget`), `Revise plan` chip → begin revision +
  `/plan/review`, area/water constraint chips, resume button for the current stage,
  six stage rows with completed/current/locked indicators, locked-stage notice sheet and
  an Assumptions & evidence sheet with fixture values.
- `src/features/plan/AssessmentScreen.tsx` — 03 + step 2. Step 1: editable farm name, area
  with acres/hectares toggle (converted to acres for the store), district, season chips,
  budget digits (formatted hint), water chips, privacy strip, `Choose seed options`.
  Validation messages use the tan/danger-muted tone, never red. Step 2 (missing surface):
  sample summary card + two generic demo seed options + create/skip. Cancel/back keeps
  committed values (draft discarded through a local confirm sheet).
- `src/features/plan/StageScreen.tsx` — 05: back row `Your season`, stage title/subtitle from
  state, incomplete-estimate banner while the quote is unknown, task card with seed row
  (`Awaiting selection` → generic options sheet) and `Quantity & cost` = `Unknown`,
  `View source calendar` sheet (fixed demo sequence), editable ₹/kg quote with validation,
  `Save quote` / `Mark done` (side-by-side, 48dp), done confirmation sheet, locked-stage panel.
  Saving a quote records the farmer's number only; quantity/cost are never derived.
- `src/features/plan/ReviewScreen.tsx` — 06: `₹ 30,000 → ₹ 26,000` strip from the draft,
  editable target budget sheet (`setRevisionBudget`; delta stays the fixture 3,200),
  three change rows, `Estimated cost delta  −₹ 3,200`, v2 note, Confirm (applies) /
  Cancel (draft cleared, committed plan untouched). Direct entry without a draft shows a
  bounded "no revision pending" screen. Android back cancels the draft.
- `src/features/plan/components.tsx` — feature-local composites (heading, banner, info strip,
  hairline, editable/grouped rows, choice row, stage indicator, pressable row).
- `src/features/plan/strings.ts` — temporary feature-local copy (below).
- `src/features/plan/index.tsx` — exports `PlanScreen`, `AssessmentScreen`, `StageScreen`,
  `ReviewScreen`.

## Shared additions requested (orchestrator centralizes)

Add to `src/locales/en.ts` (English only; same text as `planCopy`/`homeCopy`):

- `home.planNote`: `Plan remaining · {remaining}`
- `home.next.imported`: `Soil test values are in your farm plan.`
- `plan.assumptions.title` / `.body` / `.area` / `.water` / `.budget` / `.committed` / `.source`
- `plan.locked.title`, `plan.locked.body` (`Finish {prerequisite} first. …`)
- `plan.seed.a` = `Demo seed option A`, `plan.seed.b` = `Demo seed option B`
- `plan.stage.seedSheetTitle`, `plan.stage.seedSheetBody`, `plan.stage.quantityHint`,
  `plan.stage.editQuote`, `plan.stage.doneSheetTitle`, `plan.stage.doneSheetBody`,
  `plan.stage.doneConfirm`, `plan.stage.lockedTitle`, `plan.stage.lockedBody`,
  `plan.stage.sourceTitle`, `plan.stage.sourceBody`, `plan.stage.sourceNote`
- `assessment.step2.subtitle` = `Step 2 of 2 · Seed options`, `.section`, `.body`, `.note`,
  `.save` = `Create my plan`, `.back`, `.summary`
- `assessment.unit.acres` / `.hectares` / `.label`, `assessment.season.rabi|kharif|zaid`
- `assessment.error.budgetRange`, `assessment.error.season`, `assessment.skipSeed`,
  `assessment.cancelTitle`, `assessment.cancelBody`, `assessment.keepEditing`,
  `assessment.discard`
- `revision.editTitle`, `.editBody`, `.editLabel`, `.editAction`, `.editApply`,
  `.error.budget`, `.missing`, `.missingBody`, `.openPlan`

Migration is mechanical: swap `planText('x')` → `t('x')` and `homeText('x')` → `t('x')`, then
delete the two `strings.ts` files.

## Decisions / gaps

- Seed shortlist is two deliberately generic samples (`Demo seed option A/B`) stored as
  `seedId`; no variety, dose, rate or price is implied. Quote entry stores ₹/kg only.
- Step 2 of the assessment uses the reference system (heading 28/600, step subtitle,
  segmented progress with the second segment active, grouped card, primary CTA) since no
  reference screen exists for it.
- Area accepts acres or hectares; hectares are converted to acres on entry so the store keeps
  a single unit. The reference only shows acres.
- Locked stages open a bounded notice sheet rather than navigating (reference: not navigable).
- No fake status/gesture bars, no external links, no network. Bottom tab bar and safe insets
  are the parent's; these screens use the shared `Screen` (no `bottom` inset).
- Not verified on a physical device from this worker (parent QA owns that).

## Checks run (scoped)

- `npx tsc --noEmit` — pass (whole project, includes other workers' modules).
- `npx eslint src/features/home src/features/plan` — pass, 0 errors/warnings.
- `npm run check:demo` — 12 meaningful state checks pass.

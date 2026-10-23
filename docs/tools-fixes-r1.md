# Tools fixes r1 — bounded implementation

Implemented 24 Oct 2026 from `docs/ui-review-r1.md` findings **1, 3, 5, 6, 10, 11, 12**.
Ownership honored: `src/features/tools/**`, `src/locales/tools.ts`, this doc. No routes,
`src/ui`, onboarding, demo store/backend or dependency changes; parent-owned fixes
(reducer `imported` reset, tokens/error tone, onboarding, sheet strings) were left intact.

## Applied

| # | Fix | Files |
| --- | --- | --- |
| 1 | Chip and unknown-nutrient sentence render only while `enteredCount < totalCount`; complete results get a neutral `soilResult.completeNote` with no recommendations. Fixture 2/12 copy unchanged (`PARTIAL DATA`, `Nutrients are unknown…`). | `SoilResultScreen.tsx`, `locales/tools.ts` |
| 3 | Destination line is `{crop} · {season} · Plan v{version}` from the current farm and plan; adds a note only when the sample crop differs from the farm crop (result crop stays in the snapshot/note, not silently relabelled). Default state still renders `Wheat · Rabi · Plan v1`. | `ImportScreen.tsx`, `locales/tools.ts` |
| 5 | Photo picker holds a sheet-local `draftId` seeded from `selectedId`; Confirm commits it, while backdrop/X/Android back/close discard. `openPicker`/`closePicker`/`commitPicker`. | `PhotoToolScreen.tsx` |
| 6 | CTA renamed `Save preview to history` (limits card is already visible above it). | `locales/tools.ts` |
| 10 | Result and import rows use unit-free labels via shared `soilParamLabel` (`pH`, `Organic carbon`, plain parameter names). Input label for carbon renders the currently selected unit (`Organic carbon ({unit})`) instead of hardcoded `(%)`. | `strings.ts`, `SoilResultScreen.tsx`, `ImportScreen.tsx`, `SoilScreen.tsx`, `locales/tools.ts` |
| 11 | Evidence sheet enumerates `result.entered` (snapshot), no longer `selectSoilSummary(state)`; the selector import was dropped from this screen. | `SoilResultScreen.tsx` |
| 12 | Removed the duplicated Grain-quality detail line in the Tools sheet and the duplicated `Grain quality` heading in the photo unavailable block (plus its unused style). | `ToolsScreen.tsx`, `PhotoToolScreen.tsx` |

## Verification

- `npx tsc --noEmit` — clean (exit 0)
- `npx eslint src/features/tools src/locales/tools.ts` — clean (exit 0)
- `npx tsx src/demo/__checks__/reducer.checks.ts` — demo store checks passed (fixtures unchanged)
- No emulator run performed (parent owns the native walkthrough).

# Tools / Markets handoff

Owner: tools worker. Scope: `src/features/tools/**` only. Routes under `src/app/tools/*`
were created by the parent and only re-export these screens.

## Exports (contract complete)

```ts
export { ToolsScreen } from './ToolsScreen';        // /(tabs)/tools       · ref 07 t2BiPQ
export { SoilScreen } from './SoilScreen';          // /tools/soil         · ref 08 Fg69d
export { SoilResultScreen } from './SoilResultScreen'; // /tools/soil-result · ref 09 h1OGIt
export { ImportScreen } from './ImportScreen';      // /tools/import       · ref 10 L4cTXl
export { ForecastScreen } from './ForecastScreen';  // /tools/forecast     · ref 11 fSsdp
export { MandiScreen } from './MandiScreen';        // /tools/mandi        · ref 12 Xf3n9
export { PhotoToolScreen } from './PhotoToolScreen';// /tools/photo        · no reference (ref 11/07)
```

## Shared-store usage (no local store)

- `useDemo()` for state/actions; `selectSoilSummary`, `selectMarketRows`, `formatRupees`,
  `formatDateLabel`, `SOIL_PARAMS`, `type SoilParamKey`.
- Tool history: `state.toolHistory` via `useToolHistory()`; writes through
  `actions.recordToolUse(tool, labelKey, summary)` (adapter `useToolRecorder()` in
  `history.ts`). No feature-global store, no listeners. `resetDemo` clears it centrally.
- Import uses `actions.confirmSoilImport(selectedKeys)` (parent-added selection array);
  Cancel uses `actions.cancelSoilImport()`. Import never touches budget or tasks.

## Requested shared additions (parent owns)

1. **Locale keys** — temporary English layer in `src/features/tools/strings.ts`
   (`toolsCopy` / `toolCopy`). Move into `src/locales/en.ts` when convenient:
   `tools.recent`, `tools.recentNote`, `tools.grainId.sheetBody`, `tools.soil.unit`,
   `soil.unit.none`, `soil.editNote`, `soil.cropPlaceholder`, `soil.datePlaceholder`,
   `soil.dateError`, `soil.cropError`, `soil.analyzing`, `soil.retryTitle`, `soil.retryBody`,
   `soil.retry`, `soil.imported`, `soil.importedNote`, `soil.additionalHint`,
   `soilResult.percentNote`, `soilResult.evidenceSample`, `soilResult.evidenceValue`,
   `soilResult.evidenceLimit`, `import.selectHint`, `import.selectedCount`, `import.needOne`,
   `import.imported`, `forecast.pickerCommodity`, `forecast.pickerMarket`,
   `mandi.edit`, `mandi.quantityError`, `mandi.costError`, `mandi.marketSheet`,
   `mandi.recorded`, `mandi.confirm`, `photo.pick`, `photo.change`, `photo.pickerTitle`,
   `photo.pickerNote`, `photo.empty`, `photo.fixture`, `photo.limitedTitle`,
   `photo.limitedBody`, `photo.supported`, `photo.noDiagnosis`, `photo.unavailableBody`,
   `photo.inspectTitle`, `photo.inspect.leaf`, `photo.inspect.grain`,
   `photo.inspect.grainId`, `photo.remove`, `photo.continue`, `photo.badge`, `photo.recorded`.
2. Nothing else — no route, dependency, `src/ui`, `src/demo` or `src/locales` edits were made.

## Screen behaviour

- **07 Tools** — six rows (86 high, hairline on all six), icon `#6B8C52` usable /
  `#A3AF99` unavailable, ready/limited/unavailable chips. Soil → `/tools/soil`,
  Crop photo → `/tools/photo?tool=cropPhoto`, Forecast → `/tools/forecast`,
  Mandi → `/tools/mandi`. Grain quality and Grain ID open a bounded sheet
  (no blank route, no fake result). Local history section from `state.toolHistory`.
  Tools title colour `#263B29` and 14/400 subtitle per reference.
- **08 Soil** — editable pH / organic carbon (`decimal-pad`, blank = unknown, no zero
  substitution), 10 additional params behind the collapsible row with per-field unit
  pickers, crop/sample-date editor sheet with validation, count-driven CTA
  (`Interpret N values`, disabled at 0), local ~850 ms `analyzing` → `analyzeSoil()` →
  result route, invalid numeric input shows a tan banner + retry. Keyboard avoidance on.
- **09 Result** — exact captured values with `%` only for organic carbon, `PARTIAL DATA`
  chip, persistent limitations card, evidence sheet (local sources + limitations only),
  CTA → `/tools/import`, imported-state note after a confirmed import.
- **10 Import** — destination card, per-value check circles (only populated values;
  unchecking excludes that key), sample date and `Other N parameters / Unknown` rows,
  explicit `Add values` / `Cancel`, idempotent confirm, cancel leaves state untouched.
- **11 Forecast** — commodity/market pickers update the local selection, UNAVAILABLE
  chip, never renders a chart or pseudo-forecast, data-check rows stay `Missing /
  Unknown / Not available`, CTA → `/tools/mandi?commodity=…`.
- **12 Mandi** — deterministic `selectMarketRows` sort (known net first, highest first),
  `Best net` follows the leader, quantity/cost sheet with validation and confirm/cancel,
  empty cost = unknown (never zero), `Incomplete` rendered for Pimpalgaon, stale banner
  persists, footer stays two lines.
- **Photo (`/tools/photo`)** — local vector fixture picker only (three SVG illustrations
  drawn with `react-native-svg`, tagged `DEMO`), supported/limited/unavailable states,
  no camera/gallery permission, no diagnosis. `grainQuality` shows the unavailable state.

## Verification

- `npx tsc --noEmit` — no errors from `src/features/tools` (remaining errors are the
  other workers' not-yet-created feature folders).
- `npx eslint src/features/tools` — clean.
- Metro (8081) bundles all seven routes: `(tabs)/tools`, `tools/soil`, `tools/soil-result`,
  `tools/import`, `tools/forecast`, `tools/mandi`, `tools/photo` → HTTP 200.

## Gaps / notes

- Device visual comparison and the phone walk-through are parent-owned (not run here).
- Units chosen in the soil screen are presentation-only (feature-local map); they are not
  stored in `soil.values`, so the result shows the entered number (and `%` for organic
  carbon) exactly as designed.
- `SOIL_PARAMS` order drives the result grid; more than two entered values wrap into rows
  at 146-wide columns (reference only shows two).

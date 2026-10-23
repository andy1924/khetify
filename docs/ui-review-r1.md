# UI review r1 — tools / onboarding / shared primitives

Read-only review, 24 Oct 2026. Owner: review sub-agent. Scope: `src/ui`, `src/features/onboarding`,
`src/features/tools`, `src/demo` + `src/locales` contracts. Excluded by brief: Home/Plan and
Community/Profile (other workers), dependency/config/route files, native-device acceptance.

Verification performed in this review: `npx tsc --noEmit` clean, `npx eslint` on ui/tools/
onboarding/demo/locales clean, `npx tsx src/demo/__checks__/reducer.checks.ts` → 12/12 pass.
Reference evidence compared: `edsu0` (A), `L4cTXl` (10), `Fg69d` (08), `h1OGIt` (09) PNGs against
code, plus docs/reference-qa.md §6. No app code, routes, deps or design modules were modified.

## Already addressed (verified in current code — do not re-fix)

| Item | Evidence |
| --- | --- |
| Soil units are store-backed and snapshotted into results/import | `src/demo/types.ts:82,91,154`, `src/demo/reducer.ts:286,320,348`, `src/features/tools/SoilResultScreen.tsx:11-14,63`, `ImportScreen.tsx:13-17,98` |
| Numeric validation rejects non-finite / negative / pH > 14 | `src/features/tools/SoilScreen.tsx:60-70` |
| Import cancel on Android back (focus-blur cleanup) and explicit Cancel | `src/features/tools/ImportScreen.tsx:21,53-56` |
| Import requires review + selected-keys subset; no budget/task writes | `src/demo/reducer.ts:338-351`, checks: "import blocked before review", "partial import only ph" |
| Mandi `".", "1..2"` etc. rejected for costs | `src/features/tools/MandiScreen.tsx:70-81` |
| Revision delta 3200 with budget cut independent | `src/demo/reducer.ts:12,21`, checks "revision delta 3200" |
| Tool history centralized in the demo store, reset clears it | `src/features/tools/history.ts:1-22`, `src/demo/reducer.ts:35-40` |
| No fake status/gesture bars; real top safe-area inset | `src/ui/Screen.tsx:48,105-106` |
| Button arrow only on primary, none when disabled/loading; labels wrap | `src/ui/Button.tsx:97-104,140-148` |

Findings below are what remains after those fixes.

---

## 1 · Soil result keeps asserting "PARTIAL DATA" and "Nutrients are unknown" after all 12 values are entered — Medium

`src/features/tools/SoilResultScreen.tsx:53` (chip, unconditional) · `:73` (static explain copy)
`src/locales/en.ts:263` (`soilResult.partial`), `:265` (`soilResult.explain`)

Repro: Soil → *Add more test values* → fill all ten extra parameters → `Interpret 12 values`.
Result shows `12 of 12 values provided` while the chip still reads `PARTIAL DATA` and the body still
says "Nutrients are unknown. Crop suitability and fertiliser quantities cannot be determined."
The header count is dynamic, the two claims about unknown nutrients are not. This is the
"unknown stays unknown / don't claim what fixtures lack" invariant in reverse: it claims unknown
for values the user just supplied.

Minimal fix: gate both on completeness —
`const partial = result.enteredCount < result.totalCount;` render the chip and the unknown-nutrient
sentence only when `partial`; otherwise show the neutral evidence limitation only.

## 2 · `imported` is never cleared by a new analysis, so a fresh unreviewed sample shows "Added to your plan" — Medium

`src/demo/reducer.ts:309-330` (`soil/analyze` does not reset `imported`) · rendered at
`src/features/tools/SoilResultScreen.tsx:92-98` and `src/features/tools/ImportScreen.tsx:144-146`

Repro: Soil → Interpret → Add test values → Add values (imported). Back to Soil → change pH to 6.9 →
Interpret. The new result screen immediately shows "Added to your plan · These test values are in
your plan record" for a sample that was never imported, and opening `/tools/import` appends
"These values are already in your plan." before the user confirms anything.

Minimal fix: in `soil/analyze`, set `imported: false` alongside the new `result`
(and/or derive the note from `farm.soilTest` matching the current result snapshot) so the flag
describes the current sample, not the previous one.

## 3 · Import destination line is hardcoded `Wheat · Rabi`, ignoring the sample crop and farm season — Medium

`src/locales/en.ts:284` (`'import.destination': 'Wheat · Rabi · Plan v{version}'`) ·
`src/features/tools/ImportScreen.tsx:77-79` (passes only `version`)

Repro: `/tools/soil` → Edit → crop `Soybean` → Interpret → Add test values to plan. Destination card
reads `East field` / `Wheat · Rabi · Plan v1` while the values being imported belong to a Soybean
sample. Same mismatch if season was changed to Kharif in assessment.

Minimal fix: pass crop/season as params — `t('import.destination', { crop: result crop, season: state.farm.season, version })`
with `'import.destination': '{crop} · {season} · Plan v{version}'`; keep the fixture rendering
`Wheat · Rabi · Plan v1` at default state.

## 4 · Forecast→Mandi passes the commodity as a label only; the rows stay Wheat prices — Medium

`src/features/tools/ForecastScreen.tsx:11,27` (Soybean/Onion selectable, `?commodity=` forwarded) ·
`src/features/tools/MandiScreen.tsx:43` (label from params), `:100-107` (subtitle), rows from
`state.market.quotes` (Wheat fixture, `src/demo/fixtures.ts:112-139`)

Repro: Forecast → Commodity `Onion` → "Show current price instead". Mandi header becomes
`Onion · FAQ grade · 10 quintals` and the sort row `Net for 10 quintals`, but the cards are still
Lasalgaon ₹2,520/q etc. — wheat mandi prices under an onion label, with no notice. Truthfulness
failure (a number presented under a commodity it does not describe). The selected market in
Forecast is also dropped entirely (`ForecastScreen.tsx:24,27`).

Minimal fix (either): scope the picker to the commodities the fixture actually has (Wheat only,
others disabled/“no fixture”), or carry the chosen commodity into `market.commodity` **and** render an
explicit "Demo quotes are for Wheat" note on any non-Wheat selection. Also forward `market` as a
second param or drop the second picker's downstream promise.

## 5 · Photo fixture picker commits instantly — dismissing the sheet does not cancel the change — Medium

`src/features/tools/PhotoToolScreen.tsx:215` (`onPress={() => setSelectedId(fixture.id)}`) ·
`:198-201` (footer Confirm only closes the sheet) · `:62`

Repro: `/tools/photo?tool=cropPhoto` → tap preview → picker → tap "Single grain · demo" → press
Android back (or tap the backdrop / X). The preview has already switched and `Show preview limits`
is armed; no confirmation took place. Every other sheet in this module (soil unit, market costs,
OTP manual) is draft-then-commit, and §8 of reference-qa requires "cancelled edits do not apply".

Minimal fix: hold the candidate in a sheet-local `draftId` (initialised from `selectedId` on open,
reset on close) and have Confirm call `setSelectedId(draftId)`; drop the disabled state that hides
this because `selected` already changed.

## 6 · Photo "Show preview limits" CTA cannot show anything — Low (misleading control)

`src/features/tools/PhotoToolScreen.tsx:148-170` (limits card already rendered when `selected`) ·
`:170-177` (CTA `toolCopy('photo.continue')`)

The limits card the label promises is rendered above the button, so tapping it only writes tool
history. The label and the visible state disagree, and the only real effect is a history entry.

Minimal fix: rename to what it does (`Save preview to history` / `Done`) or move the limits card
behind the CTA so the label is true.

## 7 · Error styling uses a non-palette red, contradicting the design's tan-only error tone — Low

`src/ui/tokens.ts:45-46` (`danger #8B4A3A`, `dangerBg #F5E7E2`) consumed by
`src/ui/Field.tsx:84,135` (border + message), `src/features/tools/SoilScreen.tsx:437-441`
(`fieldError #8B4A3A`); surfaced on Mobile validation and OTP manual code.

reference-qa §3.3: "the palette has no error red; errors use the tan banner tone". `MobileScreen`
and the OTP sheet therefore render a colour the reference never uses, and the same class of error is
tan in the tools banners (`src/features/tools/components.tsx:71-100`) — two error looks in one app.

Minimal fix: recolour `Field` error text/border and `SoilScreen.fieldError` to the warning tan pair
(`#78643A` text on `#F6F0DF`), keeping the explicit message so colour is never the only signal.

## 8 · Mobile CTA is enabled with an empty/invalid number; validation is tap-only — Low

`src/features/onboarding/MobileScreen.tsx:35-49` (guards inside `onSend`), `:61` (no `disabled`)

reference-qa §6/B accept: "CTA disabled until valid". Currently an empty field still shows a live
`Send verification code` primary whose press produces the error. The failure is legible, so this is
fidelity, not breakage.

Minimal fix: `disabled={!/^[6-9]\d{9}$/.test(digits)}` on the footer button while keeping `onSend`
validation as the defensive path; the disabled recipe should follow the soft-surface style (see 11).

## 9 · OTP footer keeps claiming "Signing you in…" in the failure state — Low

`src/features/onboarding/OtpScreen.tsx:128-137` (unconditional disabled `otp.signingIn`) vs the
`failed` branch (`:155-200`: Couldn't verify / Try again / Enter code manually)

On the simulated-failure screen the card says verification failed and offers retry, while the pinned
footer simultaneously states a sign-in is in progress. Two contradictory statuses on one screen.

Minimal fix: render the footer CTA as `otp.signingIn` only for `sending|verifying|success`, and hide
it (or reuse the retry label) when `failed`.

## 10 · Unit is baked into the parameter label, so label + value can double-render the unit — Low (verify against the in-flight label fix)

`src/locales/en.ts:244` (`'soil.param.organicCarbon': 'Organic carbon (%)'`) used as both the input
label (`SoilScreen.tsx:143-155`) and the result/import label
(`SoilResultScreen.tsx:66-68`, `ImportScreen.tsx:97-99`), while the value now carries the stored unit
(`displayValue`, `SoilResultScreen.tsx:11-14`).

If the unit is changed to `g/kg`, the field is still labelled "Organic carbon (%)" and the result
pair reads label `Organic carbon (%)` with value `0.6 g/kg`. At default fixtures the result pair is
`Organic carbon (%)` + `0.6%` — the reference `h1OGIt` label is plain `Organic carbon`. The reported
pH/carbon label correction likely handled the grid; the import panel and the additional-parameter
labels still come from the same key.

Minimal fix: keep `(%)` only in the input label (reference `Fg69d`) and add unit-free keys
(`soil.paramShort.organicCarbon` etc.) for result/import labels; or strip a trailing parenthetical
before rendering labels next to a unit-bearing value.

## 11 · Result evidence sheet reads live draft values instead of the result snapshot — Low

`src/features/tools/SoilResultScreen.tsx:116` (`summary.entered.map(...)`; `summary` from
`selectSoilSummary(state)` at `:24`)

Repro: Interpret 2 values → open Evidence & sources → note "2 · 7.4, 0.6" → back to Soil, change pH to
6.5 → return to the result route. The card still shows the snapshot (7.4) while the evidence sheet
enumerates the edited value. The snapshot exists precisely to prevent this.

Minimal fix: build that row from `result.entered` (the snapshot), not from the live selector.

## 12 · Duplicate copy on tools and photo unavailable surfaces — Low

- `src/features/tools/ToolsScreen.tsx:130-138`: the bounded Grain quality sheet renders
  `t(sheetTool.detailKey)` and then `t('tools.grainQuality.detail')` again → "Needs validated data"
  twice in one sheet.
- `src/features/tools/PhotoToolScreen.tsx:88,94`: grainQuality renders the title as the screen
  heading and again as `styles.unavailableHeading` ("Grain quality" twice, stacked).

Minimal fix: drop the second occurrence in each (keep the heading/paragraph pair once).

## 13 · Mobile backspace at the 5/5 group boundary looks like a no-op — Low

`src/features/onboarding/MobileScreen.tsx:24-30` (renders `formatIndianMobile(digits)`) with
`src/demo/format.ts:22-27`

Repro: field at `98765 26448`, put the caret immediately after the space, press backspace. The
deleted space is restored by re-grouping on the same keystroke, so nothing appears to happen; a
second backspace is required to remove `5`. Keyboard-driven editing still works, so this is polish,
but it is the most-used field in onboarding.

Minimal fix: compare digit strings rather than formatted text (`onChangeText` already strips), and
only insert the space when the raw digits grew; or accept a native-free approach by deleting the
digit before the caret when the edit removed only the separator.

## 14 · Shared `Sheet` hardcodes English accessibility strings — Low (localization contract)

`src/ui/Sheet.tsx:66` ("Dismiss sheet"), `:84` ("Go back"), `:104` ("Close")

Contract: "place all interface strings behind localization keys". Every feature screen routes copy
through `useT`/`toolCopy`, but these three labels are literal and will stay English after a reviewed
translation lands. Cheap to fix now: accept optional label props defaulting to the current strings,
or route through a passed-in `t`.

---

## Explicitly checked and clean

- Onboarding A screen geometry/copy matches `edsu0`: `1 OF 3  /  LANGUAGE` double-spaced, 30/600
  two-line title, six rows 56 high gap 6 radius 12, selection circle 22, native + Latin label pair,
  CTA "Continue in English" with arrow, footer note. (`LanguageScreen.tsx`, `components.tsx`)
- Sheet dismissal: backdrop, X and Android back all call `onClose` (`Sheet.tsx:58-62,100-108`).
- Import panel structure matches `L4cTXl` (destination card, 22/600 question, rows, divider, note,
  two 165-wide buttons, footer), and cancel leaves `farm.soilTest` null (verified by check
  "import cancel leaves farm").
- Soil input matches `Fg69d`: summary row + Edit, 78-high field cards, collapsible row with top and
  bottom hairline, info strip, count-driven CTA with correct singular/plural, footer units note.
- Soil result matches `h1OGIt` for the fixture state: PARTIAL DATA chip, 36/600 values, 146-wide
  columns, limitations card, evidence row, CTA + footnote.
- Mandi maths: net = price × quantity − itemised costs, unknown cost → `null` never 0, known nets
  sort first, `Best net` follows the leader, stale banner present, two-line footer.
- Tool history: newest first, deduplicated per tool, capped at 5, dates formatted, cleared by
  `resetDemo`.
- Icons used by these screens all exist in `src/ui/Icon.tsx` (no silent empty glyphs); every tappable
  row/control meets ≥48 dp except the intentionally 25-high status chips, which are non-interactive.
- No `any` casts, no dead timers: Soil's timer is cleared on unmount (`SoilScreen.tsx:52-56`), OTP
  clears all three timers.

## Limits of this review

Native visual/interaction acceptance was not performed here (parent-owned; emulator/Expo Go
in-flight). Findings 1-5 come from code paths plus contract text; each has a deterministic local
repro that does not need a device. Home/Plan and Community/Profile were out of scope by the brief.
This report does not constitute whole-app or physical-device acceptance.

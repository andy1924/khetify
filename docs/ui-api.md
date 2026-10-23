# Khetify `src/ui` API

Shared primitives for all feature screens. Import everything from `@/ui` (or `../../ui`).

```tsx
import { Screen, Header, Text, Button, Card, Field, Chip, Icon } from '@/ui';
```

Source of truth for visuals: Pencil frame `Qx0SG` (390 × 844). Tokens below are
extracted from that frame, not invented.

## Tokens

| Export | Contents |
|---|---|
| `colors` | `background #FBFCF9`, `ink #263B29`, `heading #213827`, `muted #657360`, `accent #BEDDA7`, `surface #EEF4E7`, `chipBg #EBF2E4`, `chipInk #4A693D`, `border #DFE6D8`, `selected #D4E7BE`, plus warning/info/success surfaces, `icon #52664D`, `overlay`, `danger`. |
| `spacing` | `xs 4 · sm 6 · md 8 · lg 12 · xl 16 · xxl 20 · xxxl 24 · huge 32` |
| `radii` | `xs 8 · sm 10 · md 12 · lg 16 · xl 18 · xxl 20 · xxxl 24 · sheet 28 · pill 99` |
| `fonts` | `regular/medium/semiBold/bold` → `Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold` (loaded by the root layout). |
| `typography` | variant → size/line-height/family |
| `textColors` | default colour per text variant |
| `touchTarget` | `48` |
| `contentPadding` / `sectionGap` | `24` / `20` |

### Text variants

| Variant | Size / weight | Used for |
|---|---|---|
| `display` | 30 / 600 | Home hero statement |
| `heading` | 28 / 600 | screen titles |
| `title` | 21 / 600 | card titles ("Compare available seeds") |
| `subtitle` | 16 / 600 | list row titles |
| `body` | 14 / 400 | body copy |
| `strong` | 14 / 500 | inline emphasis, button labels |
| `caption` | 12 / 400 | supporting copy, field labels |
| `meta` | 11 / 400 | footnotes, chips |
| `label` | 10 / 600 | `SEED TO GRAIN`, `YOUR NEXT STEP` (uppercase, tracked) |

`Text` accepts `variant`, `color` (explicit hex), `tone` (`primary|secondary|muted|faint|accent|inverse|danger|success|warning|ink|brand`),
`weight`, `align`, and all RN `TextProps`.

## Components

### `Screen`
```tsx
<Screen scroll={false} gap={20} keyboard bottom footer={<Button … />}>…</Screen>
```
- Renders a fixed real top safe-area inset and 8pt content offset, with 24pt gutters. Scrolling content cannot overlap the status bar.
- `scroll` (default `true`) wraps content in a `ScrollView` with keyboard
  dismissal on drag and `keyboardShouldPersistTaps="handled"`.
- `footer` pins actions below the scroll area (with bottom inset when `bottom`).
- `bottom` defaults to **false**: tab screens rely on the shared floating tab
  bar for the gesture inset. Onboarding/modal routes pass `bottom`.
- `keyboard` enables `KeyboardAvoidingView` on iOS; Android uses the app's
  `softwareKeyboardLayoutMode: "resize"`.
- Does **not** render fake status or gesture bars.

### `Header`
```tsx
<Header title="Seed options" subtitle="Stage 2 of 6 · Demo plan" />
<Header title="Seed options" back backLabel="Your season" onBack={() => router.back()} />
<Header title="Around your farm" subtitle="Local observations. Shared with care." right={<IconButton …/>} />
```
Title 28/600, subtitle 13/400 muted. `size="md"` gives the 22/600 compact title.

### `Button`
```tsx
<Button title="Continue my plan" onPress={next} />
<Button title="Mark done" variant="secondary" trailingArrow={false} />
<Button title="Save quote" loading />
<Button variant="ghost" icon="plus" trailingArrow={false} title="Add photo" />
```
- `variant`: `primary` (`#BEDDA7` pill) · `secondary` (`#EEF4E7` pill) · `ghost` (borderless) · `outline` · `danger`.
- Minimum48dp tall,24 radius,20pt side padding,8pt gap. Primary buttons have an arrow by default; secondary and disabled buttons are arrow-less. Labels can wrap at larger font scales.
- `loading`, `disabled`, `icon`, `trailingIcon`, `trailingArrow`, `fullWidth`, `size`.
- Accessible role/state; disabled reduces opacity and announces busy.

### `Card`
```tsx
<Card>…</Card>                            // EEF4E7, 20 radius, 20 padding
<Card tone="soft" padding={16} gap={10}>…</Card>
<Card onPress={open} accessibilityLabel="…">…</Card>
```
`tone`: `surface` (default) · `plain` · `soft` · `muted` · `tint` · `translucent` · `warning` · `info`.

### `Field`
```tsx
<Field label="Soil pH" value={ph} onChangeText={setPh} keyboardType="decimal-pad" />
<Field label="Mobile number · India (+91)" value={mobile} large />
<Field label="Notes" multiline value={notes} onChangeText={setNotes} />
<Field label="Crop" value="Wheat" editable={false} right={<Icon name="chevron-down" />} />
<Field label="pH" value={v} error="Enter a value between 3 and 10" />
```
Soft surface, 12 radius, 10×14 padding; label 11/400 muted above a 14/400 value.
`large` gives the 22/500 leading phone value. `error` adds a 1pt danger border plus
a message (never colour alone). `hint` renders a muted helper line.

### `Chip`
```tsx
<Chip label="Demo" />
<Chip label="Wheat" selected onPress={…} />
<Chip label="Ready" tone="ready" />
<Chip label="Unavailable" tone="unavailable" />
<Chip label="Limits" onPress={…} icon="check" />
```
25pt tall, `radius 99`, 6×10 padding, 11/500 text. Tones include
`neutral|selected|soft|info|success|ready|limited|unavailable|warning|danger|reported|reviewed|confirmed`.
Static chips are views; pressable chips expose `selected` state.

### `Sheet`
```tsx
<Sheet visible={open} onClose={close} title="Edit costs" footer={<Button title="Apply" />}>
  …
</Sheet>
```
Platform `Modal`, dimmed backdrop, 24 top radius, `F9FBF5` fill, 18 padding,
internal scroll, Android back dismisses. `onBack` adds a leading chevron.

### `Icon`
```tsx
<Icon name="flask-conical" size={20} color={colors.icon} />
```
Wraps `lucide-react-native` at 1.6 stroke. Names cover every icon in the 18
reference screens (`sprout`, `arrow-right`, `check`, `lock-keyhole`, `map-pin`,
`book-open`, `flask-conical`, `scan-line`, `chart-no-axes-combined`, `wheat`,
`store`, `arrow-down-wide-narrow`, `refresh-cw`, …) plus common affordances.
Unknown names render nothing rather than crashing; pass `component` for others.

## Composite helpers

| Component | Purpose |
|---|---|
| `Row` | flex row with `gap`, `align`, `justify`, `wrap`, `fill`. |
| `Divider` | hairline `#E6EBE1` rule; `inset` for padded dividers. |
| `Notice` | advisory panel: `tone` + `title` + body. Reference "Estimate incomplete" / "Limitations" / stale-quote copy. |
| `KeyValue` | label/value pair, `layout="inline"` for justify-between rows. |
| `DemoBadge` | the single "Demo" pill (`EBF2E4`, 99 radius). |
| `IconSurface` | 48×48 rounded square hosting an icon (Home shortcuts, stage indicators). |
| `IconButton` | 42×42 `D5E7BD` square action (Community compose). |
| `LinkText` | inline text action with optional chevron ("Edit costs ›"). |
| `Avatar` | circular initials (AP, 38–48pt). |
| `ProgressBar` | 4pt track/`AFCF91` fill; accessible progress value. |
| `SegmentedProgress` | discrete step segments (assessment "1 of 2"). |
| `Toggle` | 36×22 consent switch, accessible `switch` role. |
| `ListRow` | icon + title + description + chevron/settings row, ≥48dp. |
| `Footnote` | 11pt closing note. |
| `SectionLabel` | uppercase 10/600 label. |

## Notes for feature workers

- Do not add screens here; this module is layout/visual only.
- Every interactive element is at least 48dp (chips are 25pt visually but sit
  inside ≥48dp rows where tappable).
- Never render a fake 9:41 status bar or Android gesture pill.
- French/Devanagari labels: pass the native name through `Text` with the
  default Inter family; script fallback glyphs come from the Android system font.

# Khetify — reference QA (final mobile `Qx0SG`)

Read-only QA reference for the 18-screen Expo Go clone. Source of truth: Pencil frame
`Qx0SG` — `4. Khetify — Final Mobile` in
`C:/Users/p/.pencil/documents/686b59aa-ff2b-4c3e-b89d-f125e722f184/untitled.pen`
(never read the `.pen` directly). Full extracted node graph with bounds, fills, type and
copy: `docs/design-nodes.json`. This file is the acceptance sheet; it changes no app code.

Exports: 24 Oct 2026, Pencil `Export` at scale 1 into `docs/reference-images/`, one PNG per
screen, named by node id. Images are 391×845 because the 1 px device border is included.

## 1. How to compare

* Compare at logical **390 × 844**, content column **x = 24 … 366** (**342 wide**), then again
  on the real phone and a smaller viewport (e.g. 360 × 780) and at font scale 1.3.
* On every reference PNG the vertical bands are:

  | Band | y | Render on device? |
  | --- | --- | --- |
  | fake Android status bar | 0 – 44 | **No** — use the real status bar + safe area |
  | content | 44 – 734 | yes, this is the screen |
  | bottom tab inset | 734 – 820 | yes (tabs), 86 tall |
  | fake gesture area | 820 – 844 | **No** |
  | 1 px `#D6DFD0` border, radius 28 | frame edge | **No** — device chrome |

  Content starts at y=44 in the reference, so subtract 44 from every reference y before
  comparing against a safe-area-padded screen. Home-type screens use top padding 8 inside
  that content area.
* The board also contains presentation material that is **not** an app screen and must not be
  implemented: `Direction and identity` (`GAGr1`), the HeroUI component showcase (`m6ftX`),
  the six section headings (`00`–`05`), and `Handoff and component provenance` (`bhf2h`).
  Section headings only group the screens.

## 2. Screen index

| Ref | Screen | Route (coordination) | Node | PNG | Section |
| --- | --- | --- | --- | --- | --- |
| A | Choose a language | `/language` | `edsu0` | `docs/reference-images/edsu0.png` | 00 onboarding |
| B | Mobile number | `/mobile` | `p8xMa` | `docs/reference-images/p8xMa.png` | 00 |
| C | Automatic OTP login | `/otp` | `q4xq4n` | `docs/reference-images/q4xq4n.png` | 00 |
| 01 | Home | `/(tabs)/home` | `czNuR` | `docs/reference-images/czNuR.png` | 01 begin |
| 02 | Farm Plan · first visit | `/(tabs)/plan` | `X5bTRi` | `docs/reference-images/X5bTRi.png` | 02 plan |
| 03 | Farm assessment | `/plan/assessment` | `wKkWW` | `docs/reference-images/wKkWW.png` | 01 |
| 04 | Active farm plan | `/(tabs)/plan` (active) | `aJ08s` | `docs/reference-images/aJ08s.png` | 02 |
| 05 | Stage detail · partial data | `/plan/stage` | `FnsXh` | `docs/reference-images/FnsXh.png` | 02 |
| 06 | Review plan changes | `/plan/review` | `je22r` | `docs/reference-images/je22r.png` | 02 |
| 07 | Independent tools | `/(tabs)/tools` | `t2BiPQ` | `docs/reference-images/t2BiPQ.png` | 03 tools |
| 08 | Soil test input | `/tools/soil` | `Fg69d` | `docs/reference-images/Fg69d.png` | 03 |
| 09 | Soil result · partial data | `/tools/soil-result` | `h1OGIt` | `docs/reference-images/h1OGIt.png` | 03 |
| 10 | Explicit import confirmation | `/tools/import` | `L4cTXl` | `docs/reference-images/L4cTXl.png` | 03 |
| 11 | Forecast · unavailable | `/tools/forecast` | `fSsdp` | `docs/reference-images/fSsdp.png` | 04 decisions |
| 12 | Mandi comparison | `/tools/mandi` | `Xf3n9` | `docs/reference-images/Xf3n9.png` | 04 |
| 13 | Community · demo feed | `/(tabs)/community` | `n5wOi` | `docs/reference-images/n5wOi.png` | 05 |
| 14 | Share an observation | `/community/compose` | `mZ7xf` | `docs/reference-images/mZ7xf.png` | 05 |
| 15 | Farm profile & privacy | `/(tabs)/profile` | `W1ShI` | `docs/reference-images/W1ShI.png` | 05 |

`/tools/photo` and `/community/detail` have **no reference screen** (see §10).

## 3. Tokens

### 3.1 Core tokens (Pencil variables `k4-*` — use these in `src/ui`)

| Token | Hex | Where |
| --- | --- | --- |
| background / `k4-bg` | `#FBFCF9` | every screen |
| ink / `k4-ink` | `#263B29` | button labels, input values, field text |
| muted / `k4-muted` | `#657360` | supporting copy, icons |
| accent / `k4-accent` | `#BEDDA7` | primary buttons |
| soft / `k4-soft` | `#EEF4E7` | cards, secondary buttons, tab bar |
| border / `k4-line` | `#DFE6D8` | 1 px hairlines on list rows/fields |
| selected / `k4-selected` | `#D4E7BE` | selected tab, selected water chip |

These seven match `KHETIFY_EXPO_PLAN.md`. Do **not** flatten the rest of the palette into
them: the reference deliberately uses near-neighbour greens for hierarchy and the screens
will look flat/generic if collapsed.

### 3.2 Screen-level text colours (exact hex in the design)

| Role | Hex | Notes |
| --- | --- | --- |
| Tab-screen title 28/600 | `#213827` | all screens except **07 Tools**, which is `#263B29` |
| Home greeting 28/600 | `#213827` | line height 1.25 |
| Onboarding heading 30/600 | `#243527` | line height 1.4 |
| Home hero heading 30/600 | `#263B29` | line height 1.25 |
| Empty-plan heading 25/600 | `#2A412B` | line height 1.25 |
| Screen subtitle 13/400 | `#6a7667` | Tools subtitle is 14/400, Soil subtitle 14/400 |
| Row title (plan stage) 14/500 | `#30432B` | sub-line 11/400 `#6c7562` |
| Row title (tools) 16/600 | `#263B29` | sub-line 12/400 `#657360` |
| Row title (profile) 14/500 | `#5C7950` | sub-line 11/400 `#697462` |
| Big number (budget) 32/600 | `#2E452B` | soil result numbers 36/600 `#3D5C30` |
| Community post title 16/600 | `#47603B` | body 12/400 `#68715c` |
| Section label 10/600 | `#657360` / `#6c7764` | `SEED TO GRAIN`, `YOUR NEXT STEP` |
| Link 13–14/500 | `#4F6843` | evidence rows |
| Footer note 10–12/400 | `#657360` / `#697462` / `#6c7564` | per screen in §6 |

### 3.3 State colours

| State | Surface | Text |
| --- | --- | --- |
| Ready chip | `#E3EED7` | `#5c6953` |
| Limited chip | `#F4EDDC` | `#76663b` |
| Unavailable chip | `#EAEDE5` | `#606d56` |
| Partial-data chip | `#F5EFDE` | `#7a693c` |
| Unavailable (forecast) chip | `#F1EDDF` | `#74653f` |
| Warning banner (stage) | `#F6F0DF` | `#78643A` title / `#76694c` body / icon `#8B7746` |
| Warning banner (limits) | `#F6F0E0` | `#7b683a` title / `#77694b` body |
| Stale banner (mandi) | `#F6F0E0` | `#7c6a3e` / `#756a4c` |
| Post badge Reported | `#F0ECDC` | `#76663c` |
| Post badge Reviewed | `#E8EDE3` | `#556d44` |
| Post badge Confirmed | `#DCECCF` | `#556d44` |
| Do not use red/green semantic primaries | — | the palette has no error red; errors use the tan banner tone |

### 3.4 Type

Font: **Inter** everywhere (weights 400 / 500 / 600 only — never 700+). Native script
labels use Noto Sans Devanagari / Gujarati / Tamil / Telugu at 17/400.

| Role | Size/weight | Line height | Examples |
| --- | --- | --- | --- |
| Onboarding hero | 30/600 | 1.4 | `Make yourself\nat home.` |
| Home hero | 30/600 | 1.25 | `Your season,\none step at a time.` |
| Screen title | 28/600 | 1.4 | `Your farm plan` |
| Home greeting | 28/600 | 1.25 | `Good morning, Asha` |
| Large display | 25/600 · 24/600 | 1.25 | empty plan, forecast unavailable, review budget 24 |
| Sheet title | 22/600 | 1.3 | `Review the changes`, `Add these test values?` |
| Card title | 21/600 | 1.4 | `Add your soil test`, `Compare available seeds` |
| Profile name | 21/600 | 1.4 | `Asha Patil` |
| Onboarding subtitle | 14/400 | 1.4 | |
| Screen subtitle | 13/400 | 1.4 | |
| Body / field value | 14/400–500 | 1.4 | |
| Small value / caption | 12/400–500 | 1.4 | |
| Micro / chip | 11/400–600 | 1.4 | chips 11/500 |
| Tab label | 10/600 selected, 10/400 unselected | 1.2 | |
| Eyebrow | 10/600 | 1.4 | `KHETIFY`, `SEED TO GRAIN` |

### 3.5 Shape and spacing

* Content padding **24**; block gap **20**; heading internal gap **6**; max content width 342.
* Radii: tab bar 34, tab item 22, sheet/dialog 24, button 24 (pill), card 18, card 20 (hero),
  input 12, chip 99, small control 14, avatar 20/24 (circle), icon surface 16, progress 4.
* Hairline **1** px, bottom only, on list rows/fields; dividers inside panels `#E6EBE1`.
* No shadows or elevation anywhere in the design. Hierarchy comes from fill contrast only.
* Icon sizes: 14, 15, 16, 17, 18, 20, 21, 22, 24, 28, 32, 42. Icon set is **lucide**:
  `sprout, signal, wifi, battery-full, arrow-right, arrow-left, house, layout-grid, users,
  user-round, chevron-right, chevron-down, check, languages, lock-keyhole, map-pin,
  book-open, message-square, flask-conical, scan-line, chart-no-axes-combined, pencil, info,
  shield-check, circle-alert, minus, replace, equal, wheat, scan, store,
  arrow-down-wide-narrow, plus, bug, cloud-rain, camera, refresh-cw`
  (`signal`/`wifi`/`battery-full` only appear in the fake status bar → do not implement).

## 4. Chrome rules

* **No fabricated status bar, no fabricated gesture bar, no rounded device frame/border.**
  Use real safe-area insets. Content top padding on tab screens is 8 below the safe area.
* **Tab bar** (all tab and detail screens): inset 16 left/right, 8 above, 12 below the
  bottom safe area; container 358×66, fill `#EEF4E7`, radius 34, inner padding 6.
  Five equal items (69.2 wide × 54, no gap between them), radius 22, inner icon/label gap 3,
  icon 20 over label 10. Selected item fill `#D4E7BE`, icon `#263B29`, label `#263B29` 600.
  Unselected fill = bar fill (`#EEF4E7`), icon `#657360`, label `#657360` 400 (the shared
  component defaults to 500; the screens override to 400/600).
  It floats over scrolling content; content needs bottom clearance ≥ 86 + safe inset.
  There is no shadow and no top divider.
* **Detail screens keep the tab bar** (05, 06, 08, 09, 10, 11, 12, 14 all show it).
  Onboarding screens (A/B/C) have no tab bar; they pin a bottom action block:
  padding `[16, 24, 20, 24]`, gap 12, 48-high pill button, 11/400 footer note.
* **Onboarding header** (A/B/C only): 56 high, padding 0/24; left brand = sprout 24 `#243527`
  + `khetify` 22/600 `#243527` gap 7; right language pill 111×44, fill `#EFF4E8`, radius 14,
  padding 0/12, `languages` 17 + label 12/500 + `chevron-down` 14, all `#243527`.
  This header does not appear on the tab screens.
* Android back must work on every pushed detail route; back affordance on 05 is the inline
  row `arrow-left` 20 + `Your season` 12 (`#65775B`), not a system header.

## 5. Component recipes

| Recipe | Spec |
| --- | --- |
| Primary button | 48 high, radius 24, fill `#BEDDA7`, padding 0/20, gap 8, label 14/600 `#263B29`, `arrow-right` 18 `#263B29`; full 342 for single CTA, 165 side-by-side (gap 12) |
| Secondary button | same geometry, fill `#EEF4E7`, ink label, **no arrow** (`Browse independent tools`, `Mark done`, `Cancel` in 06 and 10, `Signing you in…`) |
| Loading/disabled button | fill `#EEF4E7`, label `#657360`, **no arrow** (OTP `Signing you in…`) |
| Chip (status) | height 25, radius 99, padding 6/10, label 11/500, gap 5, tones in §3.3 |
| Chip (selectable) | height 25 for filters, **36** for water availability, **44** for camera/gallery; selected fill `#D4E7BE`/`#E8EDE3` for water; label `#4A693D` |
| Flat field | fill `#F6F8F3`, radius 12, padding `[10,14]`, gap 4; label 11–12 `#666f63`; value 14–22 `#243527` |
| Bordered field (phone/soil big) | 78 high, value 22/500 |
| Grouped form card | fill `#F2F5EE`, radius 18, padding `[18,18,8,18]`; fields inside are transparent with bottom hairline `#DFE6D8`, padding `[12,0]`, label 12, value 15/500 |
| Card | fill soft/`#F1F6EA`/`#EDF4E4`, radius 18, padding 16–18, gap 8–10 |
| Hairline row | padding 0 ([14,0] for list cards, [16,0] profile, [10,0] plan stages), bottom 1 px, vertically centred |
| Banner | radius 18, padding 12, gap 6–8, icon 19, title 13/600, body 12/400 |
| Info strip | icon 16–18 + 12/400 `#657360`, gap 8 |
| Big metric | 32–36/600; label 10/600 or 12/400 muted |
| Toggle | 36×22, radius 11, off fill `#D3DCCA`, thumb 16 white (padding 3) |
| Selected circle | 22×22, radius 11, fill `#C4DEA9`, `check` 14 `#243527`; unselected: fill `#FEFFFC`, 1 px `#D6DFD0` |

## 6. Screen specs and acceptance

Legend: `y` is relative to the content top (reference y − 44). All copy is exact, including
spacing, `·`, `—`, `→`, `−` (U+2212), `₹`, `…`, `›`, `≈`, and bullet `••••••`.

### A · Choose a language — `/language` — `edsu0`

Blocks: header 56; content (padding 24, gap 22): step `y24`, heading `y61` (84 = 2×42),
description `y167`, option list `y229` (6 rows, 56 high, gap 6); bottom action block.

Copy: `1 OF 3  /  LANGUAGE` (two spaces either side of `/`) 11/600 `#666F63` ·
`Make yourself\nat home.` 30/600 `#243527` ·
`Choose your language. Khetify will use it across the app.` 14/400 `#666F63` ·
rows: `English` 17/600; `हिन्दी`+`Hindi`; `मराठी`+`Marathi`; `ગુજરાતી`+`Gujarati`;
`தமிழ்`+`Tamil`; `తెలుగు`+`Telugu` (native 17/400, Latin 12/400 `#666F63`, gap 10) ·
CTA `Continue in English` · footer `You can change this anytime in Profile.` 11/400.

Spec: selected row fill `#EFF4E8`; unselected rows fill `#FEFFFC` + bottom hairline
`#D6DFD0`; rows radius 12, padding 0/14, gap 12, label block 280 wide, selection 22 at the
right; header language pill mirrors the selection.

Accept: selecting any row moves the selected fill/check, updates the header pill label and
the CTA label still reads `Continue in English` (reference only draws the English case —
keep the label pattern, don't invent a different layout); selection persists into Profile;
all six scripts render without clipping at font scale 1.3; CTA ≥48 dp; row press target
spans the full 342 × 56.

### B · Mobile number — `/mobile` — `p8xMa`

Copy: `2 OF 3  /  MOBILE NUMBER` · `Your farm journey\nstarts here.` ·
`Enter your mobile number. We’ll send a code to sign you in.` ·
field label `Mobile number · India (+91)` 12, value `98765 26448` 22/500 ·
`One code, no password` 14/600 with `message-square` 22 `#666F63` and
`Your SMS code is fetched automatically.` 13/400 ·
CTA `Send verification code` · footer `By continuing, you agree to the Terms & Privacy Policy.`

Spec: phone field 342×78, fill `#F6F8F3`, radius 12, padding `[10,14]`, gap 4 (no visible
border); explanation block padding 12/0, gap 20; footer is the terms entry point.

Accept: field editable with numeric keyboard, `+91` prefix fixed, grouping as shown, inline
validation for <10 digits (tan banner tone, not red), CTA disabled until valid; tapping the
footer opens a local Terms & Privacy sheet; CTA advances to `/otp` and passes the last four
digits; back returns to language.

### C · Automatic OTP login — `/otp` — `q4xq4n`

Copy: `3 OF 3  /  AUTO VERIFICATION` · `Let the code\ncome to you.` ·
`Code sent to +91 ••••••6448` · card: `Code received automatically` 18/600, six digit
boxes 41.33×48 radius 10 fill `#FEFFFC` each showing `•` 23, `Verifying your number…`
14/500 · `Resend code in 00:24` 13/400 · `Change mobile number` 13/500 ·
disabled CTA `Signing you in…` (no arrow) · footer `You’ll go straight to Home after verification.`

Spec: status card 342×229, fill `#EFF4E8`, radius 20, padding 22, gap 20; icon
`message-square` 32; digit row gap 10.

Accept (all local, no SMS): deterministic receive → verify → success; countdown ticks
`00:24`→`00:00`; resend only at 00:00; `Change mobile number` returns to `/mobile` with the
number preserved; simulated failure shows an error state with retry and a manual-entry
fallback on the same card; timers cleared on unmount; success routes to `/(tabs)/home` and
does not allow back into onboarding.

### 01 · Home — `/(tabs)/home` — `czNuR`

Stack (y): greeting 8 (53), farm summary 81 (25), hero 126 (238), next step 384 (106),
quick tools 510 (71), demo note 601 (15); tab bar.

Copy: eyebrow `KHETIFY` 10/600 `#607755` · `Good morning, Asha` 28/600 `#213827` ·
avatar `AP` 11/600 `#4A693D` on `#ECF2E5` 38 · `map-pin` 14 + `East field · 2 acres · Rabi wheat`
13 `#6B7964` · chip `Demo` (25 high, `#EBF2E4`/`#4A693D`) ·
hero: `SEED TO GRAIN` 10/600 `#657360`; `Your season,\none step at a time.` 30/600
`#263B29`; `A practical plan from seed to sale.` 14 `#657360`; CTA `Continue my plan` ·
next step: `YOUR NEXT STEP` 10/600 `#6c7764` + right `Today` 11 `#5C7950`;
`Add your soil test` 21/600 `#26392B`; `Know your soil before choosing inputs.` 14 `#6c7667` ·
quick tools three 103.3-wide columns, icon surfaces 48×48 `#F0F4EB` radius 16, icons 22
`#52664D`: `flask-conical` `Soil`, `scan-line` `Crop photo`, `chart-no-axes-combined` `Prices`,
labels 11 `#607057` · footer `Demo farm · Sample data` 11 `#6c7564`.

Spec: hero fill `#EEF4E7`, radius 20, padding 20, gap 14; next-step block padding `[4,0,18,0]`
with bottom hairline `#DFE6D8`; quick tools gap 16; greeting block gap 12; page gap 20.

Accept: greeting and farm summary come from fixtures; avatar is initials; `Continue my plan`
→ `/(tabs)/plan` (active); `Add your soil test` and `Soil` → `/tools/soil`;
`Crop photo` → `/tools/photo`; `Prices` → `/tools/mandi`; demo note always visible;
Home scrolls on small screens without the tab bar moving.

### 02 · Farm Plan · first visit — `/(tabs)/plan` — `X5bTRi`

Copy: `Your farm plan` 28 · `A season of small, confident steps.` 13 ·
72 circle `#EBF2E1` with `sprout` 42 `#718F58` · `Every good season\nstarts with a plan.`
25/600 `#2A412B` · `A practical plan for your land, water and budget. Review it as your
resources change.` 14 `#6c7766` · panel `#F6F8F2` radius 18 padding 16 with three
`check` 16 `#52664D` rows 12 `#64745A`: `Six stages, from seed to sale`,
`Your resources, your choices`, `Review every change before applying` ·
`Assess my farm` primary · `Browse independent tools` secondary.

Accept: empty state only when no plan exists; `Assess my farm` → `/plan/assessment`;
`Browse independent tools` → `/(tabs)/tools`; vertical rhythm survives 360-wide screens;
no disabled/greyed primary; tab Farm Plan selected.

### 03 · Farm assessment — `/plan/assessment` — `wKkWW`

Copy: `Know your farm` · `Step 1 of 2 · Land & resources` · progress (two 4-high segments,
168 wide, 6 gap; active `#AFCF91`, inactive `#E7EDE0`) ·
card `Farm details`: `Farm name`/`East field`, `Farm area`/`2 acres`,
`District`/`Nashik, Maharashtra` · card `Season & resources`:
`Season`/`Rabi`, `Season budget`/`₹30,000`, `Water availability` chips
`Rainfed` `Limited` `Reliable` (Limited selected) ·
`shield-check` 18 + `Precise location is optional and stays private.` 12 ·
CTA `Choose seed options`.

Spec: both cards fill `#F2F5EE`, radius 18, padding `[18,18,8,18]`; field pairs 145 wide with
16 gap and 61-high hairline rows; water chips 36 high (`#E8EDE3` unselected, `#D4E7BE`
selected), 11/500 `#4A693D`; privacy note gap 8.

Accept: every field editable, in-place (tap value → input), units editable (`acres`,
`hectares`), budget accepts digits and formats `₹30,000`, exactly one water chip selected,
validation shown in the design's banner tone (never red), step 1 → step 2 (missing surface,
see §10) → save updates the plan fixtures and returns to `/(tabs)/plan`; back/cancel
preserves the previous plan; progress bar reflects step.

### 04 · Active farm plan — `/(tabs)/plan` — `aJ08s`

Copy: `Your season` · `East field · Wheat · Rabi · Demo plan` ·
budget card `REMAINING · OF ₹30,000` 10/600 `#5e6f50`, `₹ 24,800` 32/600 `#2E452B`
(note the space after ₹), chip `Revise plan`, chips `2 acres`, `Limited water` ·
stage rows: `Land assessment` / `Farm details saved` (done: circle `#F2F5EE` + check 16);
`Seed options` / `Review your seed shortlist` (current: circle `#D6E8C2`, `02` 11/500
`#586351`, chevron-right 18 `#52664D`); `Preparation & sowing` / `After seed selection`;
`Nutrition & water` / `After sowing is complete`; `Harvest & storage` / `After crop
maturity`; `Selling` / `After harvest details` (locked rows: `lock-keyhole` 14 `#A1AC96`) ·
footer `Demo plan v1 · Assumptions & evidence  ›`.

Spec: budget card fill `#E9F1DF`, radius 18, padding 16, gap 8; value row gap 6 with the
revise chip right-aligned; stage rows 59 high, padding `[10,0]`, gap 12, bottom hairline
`#E7EBE1`; indicator 32 circle; title 14/500 `#30432B`; sub 11 `#6c7562`.

Accept: tapping current stage → `/plan/stage`; locked stages not navigable (or open a
notice); revise chip and footer → `/plan/review`; remaining budget is a function of the
fixtures (never hardcoded); completed stage shows check, not a number; states change after
marking a stage done; footer version label reflects plan v1/v2.

### 05 · Stage detail · partial data — `/plan/stage` — `FnsXh`

Copy: back row `arrow-left` 20 + `Your season` 12/400 `#65775B` ·
`Seed options` · `Stage 2 of 6 · Demo plan` ·
banner: `circle-alert` 19 `#8B7746`, `Estimate incomplete` 13/600 `#78643A`,
`Add a seed quote to estimate quantity and cost.` 12 `#76694c` ·
task card: `Compare available seeds` 21/600 `#30472B`, `Choose seed before preparation and
sowing.` 13 `#636f57`, rows `Seed option` / `Awaiting selection`, `Quantity & cost` /
`Unknown` (labels 12 `#66705d`, values 12/500 `#455C3C`) ·
evidence row `book-open` 20 + `View source calendar` 14/500 `#4F6843` + chevron ·
optional field label `Your local seed quote · optional` 11, value `Enter ₹ per kg` 14 ·
actions `Save quote` (primary, 165) and `Mark done` (secondary, 165) ·
footer `Unknown costs stay marked incomplete.` 12 `#6c7564`.

Spec: page gap 20; back row 20 high; banner 342×68 radius 18 padding 12 gap 8; task card
fill `#F1F6EA` radius 18 padding 16 gap 10; evidence row padding `[14,0]`; quote field
`#F6F8F3` radius 12 padding `[10,14]`; no divider under the evidence row.

Accept: quote entry accepts a number, `Save quote` converts `Unknown` → computed quantity/
cost and removes the banner only when the estimate is complete; `Mark done` marks the stage
and returns to plan with budget/next stage updated; source calendar opens a local sheet/
route; empty quote + Save shows validation in place; keyboard does not cover the actions.

### 06 · Review plan changes — `/plan/review` — `je22r`

Copy: `Revise your plan` · `East field · Demo revision` ·
strip: `Season budget` 12 `#646f5c`, `₹ 30,000 → ₹ 26,000` 24/600 `#526C43` ·
panel: `Review the changes` 22/600 `#2E472B`, `Nothing changes until you confirm.` 12 `#687460`,
three diff rows — `minus` `Remove optional storage upgrade` / `Keeps essential tasks within
budget`; `replace` `Replace the seed shortlist` / `Lower-cost option for review`;
`equal` `Keep area and water unchanged` / `2 acres · Limited water` (titles 13/500
`#4F6543`, subs 11 `#6a7361`, icons 18 `#7F966A`) · divider · `Estimated cost delta  −₹ 3,200`
14/600 `#526E43` (two spaces before the delta, U+2212) · `Demo estimate · Saves as plan v2` 11
`#68725d` · buttons `Confirm` / `Cancel` (147 each).

Spec: strip fill `#F2F5EC` radius 18 padding 18 gap 12; panel fill `#F9FBF5`, radius 24,
1 px border `#DFE7D7`, padding 18, gap 12; divider `#E6EBE1`; row gap 10, copy gap 4.

Accept: shows real before/after from the store; `Cancel`/back leaves the plan and budget
untouched (v1); `Confirm` applies, sets v2, updates remaining budget and stage list, and
returns to the plan; direct navigation to `/plan/review` without a pending revision must not
fabricate a diff (redirect back); panel content scrolls if the viewport is short.

### 07 · Independent tools — `/(tabs)/tools` — `t2BiPQ`

Copy: `Tools for your farm` (28/600 `#263B29`) · `Choose what you need. No plan required.`
14 `#6a7667` · six 86-high rows: `Soil analysis`/`Interpret your test`/`Ready`;
`Crop photo`/`Visible symptom triage`/`Limited`;
`Grain quality`/`Needs validated data`/`Unavailable`;
`Grain ID`/`Supported types only`/`Limited`;
`Price forecast`/`Needs a complete series`/`Unavailable`;
`Mandi comparison`/`Compare net proceeds`/`Ready` · footer
`Nothing is added to your plan until you confirm.` 12/400 `#657360` (line height 1.5).

Spec: rows padding `[14,0]`, gap 14, bottom hairline `#DFE6D8` on **all six**; icon 24 at
`#6B8C52` when usable and `#A3AF99` when unavailable; title 16/600 `#263B29`; sub 12
`#657360`; chips right-aligned, tones §3.3.

Accept: soil → `/tools/soil`, crop photo → `/tools/photo`, forecast → `/tools/forecast`,
mandi → `/tools/mandi`; Grain quality and Grain ID have no route — open a bounded
"Unavailable/Limited" sheet (no blank route, no fake result); every row ≥48 dp tall;
ready/limited/unavailable are visually distinct at a glance and labelled in words.

### 08 · Soil test input — `/tools/soil` — `Fg69d`

Copy: `Your soil test` · `Start with the values you have.` 14 `#657360` ·
summary `Wheat · Sampled 12 Oct 2026` 13 + `Edit` 13/500 with `pencil` 15 ·
fields `Soil pH`/`7.4`, `Organic carbon (%)`/`0.6` (values 22/500) ·
collapsed row `Add more test values` 15/500 + `10 values not entered` 12 + chevron-down 20 ·
`info` 16 + `Missing values stay unknown.` 12 `#657360` ·
CTA `Interpret 2 values` · footer `Demo values · Use the units on your report.` 11.

Spec: summary row padding `[4,0,16,0]`, bottom hairline; field cards 342×78 fill `#F6F8F3`
radius 12, padding `[10,14]`, gap 16 between cards; collapsible row padding `[18,0]` with
top **and** bottom hairline; CTA full width.

Accept: pH/organic carbon editable numbers (decimal), values blank = unknown (no zero
substitution); expanding shows the remaining 10 parameters with per-field unit selection;
`Edit` opens the crop/sample-date editor; CTA count always equals filled values
(`Interpret 1 value`/`Interpret 2 values`/…); with zero values CTA is disabled; CTA →
`/tools/soil-result` with the same values; keyboard avoidance present.

### 09 · Soil result · partial data — `/tools/soil-result` — `h1OGIt`

Copy: `Your soil, in context` · `Sample: 12 Oct 2026 · Demo result` ·
chip `PARTIAL DATA` · card `2 of 12 values provided` 12 `#607052`, `7.4`/`pH`, `0.6%`/
`Organic carbon` (36/600 `#3D5C30`, labels 12 `#637058`) ·
`Nutrients are unknown. Crop suitability and fertiliser quantities cannot be determined.`
13 `#687560` · limitations card `Limitations` 13/600 `#7b683a` +
`A full lab report and agronomist review are needed for recommendations.` 12 `#77694b` ·
evidence row `book-open` 18 + `Evidence & sources` 13/600 `#5A714C` + chevron-down 16 ·
CTA `Add test values to plan` · footnote `You will review the import before applying it.` 10
`#697462`.

Spec: values card fill `#EDF4E4` radius 18 padding 16 gap 8, two 146-wide columns gap 18;
limitations card `#F6F0E0`; evidence row `#F4F7EF` radius 18 padding 16.

Accept: renders exactly the captured values with `%` where the design has it; chip shows
PARTIAL DATA while <12 values and the copy about unknowns stays; evidence opens a local
sheet (sources + limitations), never a fake citation; CTA → `/tools/import`; the card
never shows invented nutrient numbers.

### 10 · Explicit import confirmation — `/tools/import` — `L4cTXl`

Copy: `Add to your plan` · `Review the values before you continue.` ·
destination card: `sprout` 28 `#72975A`, `East field` 20/600 `#3C5930`,
`Wheat · Rabi · Plan v1` 12 `#647059` ·
panel `Add these test values?` 22/600 `#344F2A`, rows `Sample date`/`12 Oct 2026`,
`pH`/`7.4`, `Organic carbon`/`0.6%`, `Other 10 parameters`/`Unknown`
(labels 12 `#6a7560`, values 12/500 `#526D43`) · divider ·
`This adds your test record. It does not automatically add tasks or change your budget.` 13
`#68755d` · `Add values` / `Cancel` · footer
`Results always stay available in your tool history.` 11 `#697461`.

Spec: destination `#EFF5E7` radius 18 padding 14 gap 12; panel fill `#FAFCF6` radius 24,
1 px `#DFE8D5`, padding 18, gap 14.

Accept: `Cancel` returns to the result with nothing imported; `Add values` writes the soil
record to the demo store, marks it imported, and the plan/home show the imported state;
import never changes the budget or adds tasks; re-importing is idempotent; status is visible
somewhere the user returns to.

### 11 · Forecast · unavailable — `/tools/forecast` — `fSsdp`

Copy: `Price forecast` · `A clear horizon starts with reliable data.` ·
chip `UNAVAILABLE` · fields `Commodity`/`Wheat`, `Market`/`Nashik` ·
`Not enough history\nfor a forecast.` 24/600 `#4D6541` ·
`The price history is incomplete. A grounded forecast is unavailable.` 13 `#697460` ·
data card: `DATA CHECK` 10/600 `#68715d`; `Complete price series`/`Missing`,
`Last available date`/`Unknown`, `Forecast horizon`/`Not available` (12, values 12/500
`#5f734f`) · CTA `Show current price instead` ·
`Current quotes include their source date.` 12 `#687460`.

Spec: chip 96×25; fields 165×54 side by side gap 12; data card `#F3F6ED` radius 18 padding
16 gap 10; unavailable block padding `[8,0]` gap 12.

Accept: commodity/market open local pickers and update the header summary; the screen never
renders a chart or a number dressed as a forecast; CTA navigates to current quotes (mandi)
with the selected commodity; if the demo scenario flips the gate open, the screen can show
a forecast state but must label it as demo and keep the data-check framing.

### 12 · Mandi comparison — `/tools/mandi` — `Xf3n9`

Copy: `Compare mandis` · `Wheat · FAQ grade · 10 quintals` ·
stale banner `Demo quotes · 12 Oct 2026 · Stale` 12/500 + `Confirm with the market before
selling.` 11 · sort row `arrow-down-wide-narrow` 18 + `Net for 10 quintals · Highest first`
12 `#637656` · cards:
`Lasalgaon` 15/600 `#4B673D` + chip `Best net`; `₹ 2,520 / q` 13 `#626c56`; `₹ 24,350`
21/600 `#4B6A3A`; `Your costs ₹850 · Edit costs  ›` 11 `#646e5a` ·
`Nashik`; `₹ 2,560 / q`; `₹ 24,250`; `Your costs ₹1,350 · Edit costs  ›` ·
`Pimpalgaon`; `₹ 2,500 / q`; `Incomplete`; `Transport cost missing · Add  ›` ·
footer `Costs are yours. Missing costs stay unknown.\nDemo prices; confirm before selling.` 11
`#697560`.

Spec: banner `#F6F0E0` radius 18 padding 12 gap 6; best card fill `#EAF2DE`, others
`#F4F7EF`; cards radius 18 padding 14 gap 8; header/net grid 153 + 153 with 8 gap; net value
right-aligned; footer is two lines.

Accept: net = 10 × price − costs, computed locally (24,350 / 24,250); missing transport keeps
`Incomplete` and never falls back to zero; editing costs updates net and may re-sort, with
`Best net` moving to the new leader; quantity editable elsewhere (mandi edit sheet) and the
subtitle/units update; stale banner persists for the stale fixture; sorting label matches
the actual order.

### 13 · Community · demo feed — `/(tabs)/community` — `n5wOi`

Copy: `Around your farm` · `Local observations. Shared with care.`; plus button 42×42
`#D5E7BD` radius 14, `plus` 20 `#52664D` · filters `10 km · Demo`, `Wheat`, `This week`
(25 high, `#EBF2E4`) · three posts:
`bug` 20, `2 hours ago · ≈ 3 km`, badge `Reported`, `Leaf spots observed` 16/600 `#47603B`,
`Farmer observation; cause unverified.` 12 `#68715c`;
`cloud-rain` 20, `5 hours ago · ≈ 6 km`, `Reviewed`, `Waterlogging in a field`,
`Checked for relevance; not confirmed.`;
`sprout` 20, `Yesterday · ≈ 4 km`, `Confirmed`, `Field observation verified`,
`Verified against evidence in this demo.` ·
footer `Demo reports · In-app feed only.\nExact farm locations remain private.` 11 `#6a7461`.

Spec: header block gap 12; filter row 25 high gap 8; posts 342×136, padding `[14,0]`,
gap 8, bottom hairline; badge sits under the meta row; title/body fill 342; footer 2 lines.

Accept: filters change the visible fixture subset and show selected state (reference shows
all three unselected — keep the chip geometry and add a selected tone from §3.3);
`plus` → `/community/compose`; tapping a post → `/community/detail`; submitting the
composer prepends a `Reported` post and returns to the feed; badges are visually distinct
and worded; distances/times stay fixture-based.

### 14 · Share an observation — `/community/compose` — `mZ7xf`

Copy: `Share what you see` · `Your report will be labelled Reported.` ·
field `Observation type`/`Crop symptoms` · `Crop`/`Wheat`, `Observed`/`Today, 8:30 am` ·
consent card: `map-pin` 18, `Use approximate location` 13/600 `#597347`, toggle off,
`Precise farm location stays private.` 11 `#646c59`, field `District`/`Nashik, Maharashtra` ·
photo row `camera` 28 `#94AA7D`, `Add photo` 14/500 `#637652`, chips `Camera`, `Gallery`
44 high (`#EBF2E4`) · notes `Notes` 11 `#67725c` + `Small brown spots on lower leaves.\nFirst
noticed this morning.` 13 `#607350` · CTA `Submit as Reported`.

Spec: type field 54 high; metadata 2-up 165 each; consent card `#EEF4E5` radius 18 padding
12 gap 8; photo row `#F6F8F2` radius 18 padding 16 with 1 px border `#DBE5D2`; notes card
`#F2F5EC` radius 18 padding 14; toggle 36×22.

Accept: all fields editable; photo chips open a local fixture picker (bundled images, no
permission prompt) and show the selected thumbnail in the row; toggling location flips the
thumb and hides/reveals nothing destructively; district remains the manual fallback when the
toggle is off; submit adds a `Reported` post locally, clears the draft, returns to the feed;
notes/type empty → inline validation; keyboard avoidance for notes.

### 15 · Farm profile & privacy — `/(tabs)/profile` — `W1ShI`

Copy: `Your farm, your way` · `Profile & preferences` · avatar `AP` 22/600 `#567043` on
`#E6F0DA` 48 · `Asha Patil` 21/600 `#405E33` · `Nashik, Maharashtra` 12 `#697560` ·
farm card: `East field` 17/600 `#4D6E3C` + `pencil` 17; `Area`/`2 acres`, `Water`/`Limited`,
`Season budget`/`₹30,000 · your estimate` (rows 12: label `#626c58`, value 12/500 `#5b7249`) ·
five settings rows 72 high: `Location & consent`/`Approximate location · Off`;
`Evidence library`/`Sources and their limitations`; `Data freshness`/`Market quotes need a
refresh`; `Language`/`English`; `About Khetify`/`Capabilities & boundaries`
(titles 14/500 `#5C7950`, subs 11 `#697462`, icons 21 `#8AA474`, chevrons 17 `#99A98B`,
bottom hairline `#E7EDE0`).

Spec: farm card `#EEF4E7` radius 18 padding 16 gap 10; settings rows padding `[16,0]` gap 12;
no card around the settings list.

Accept: pencil opens a local farm editor that writes the same fixtures used by Home/Plan;
each settings row opens a sheet/route (consent toggles, evidence list, freshness summary,
language chooser, about) with content consistent with the design system; language change
updates the label and app locale; demo reset and sign-out must be reachable from About (or
an added row using the same row anatomy) — plan requires an obvious reset; sign-out returns
to `/language` and clears local state.

## 7. Fixtures (single source of truth)

| Key | Value |
| --- | --- |
| Farmer | Asha Patil · initials `AP` · Nashik, Maharashtra |
| Farm | East field · 2 acres · district Nashik, Maharashtra |
| Crop / season | Wheat · Rabi |
| Water | Limited (options Rainfed / Limited / Reliable) |
| Season budget | ₹30,000 (rendered `₹30,000` in assessment/profile, `₹ 30,000` in review strip) |
| Plan | demo plan v1 · remaining ₹24,800 · 6 stages |
| Stage 1 | Land assessment — done — `Farm details saved` |
| Stage 2 | Seed options — current — `Review your seed shortlist` |
| Stage 3 | Preparation & sowing — locked — `After seed selection` |
| Stage 4 | Nutrition & water — locked — `After sowing is complete` |
| Stage 5 | Harvest & storage — locked — `After crop maturity` |
| Stage 6 | Selling — locked — `After harvest details` |
| Revision | budget 30,000 → 26,000 · delta −₹3,200 · saves v2 · three diff rows as in §6/06 |
| Phone | +91 98765 26448 · masked +91 ••••••6448 · resend 00:24 |
| Soil sample | Wheat · sampled 12 Oct 2026 · pH 7.4 · organic carbon 0.6 (0.6%) · 2 of 12 values · 10 not entered |
| Import target | East field · Wheat · Rabi · Plan v1 · other 10 parameters unknown |
| Forecast | Wheat · Nashik · unavailable · series missing · last date unknown · horizon not available |
| Mandi | 10 quintals, FAQ grade, quotes 12 Oct 2026 (stale) |
| Lasalgaon | ₹2,520/q · costs ₹850 (transport 600, handling 100, fees 150) · net ₹24,350 · best |
| Nashik | ₹2,560/q · costs ₹1,350 · net ₹24,250 |
| Pimpalgaon | ₹2,500/q · transport missing · net `Incomplete` |
| Community | `2 hours ago · ≈ 3 km` Reported Leaf spots; `5 hours ago · ≈ 6 km` Reviewed Waterlogging; `Yesterday · ≈ 4 km` Confirmed Field observation |
| Compose | Crop symptoms · Wheat · Today, 8:30 am · district Nashik, Maharashtra · notes as §6/14 |
| Home next step | Add your soil test · Today · `Know your soil before choosing inputs.` |

Rounding, currency spacing, units (`acres`, `quintals`, `₹ / q`, `%`) and the exact strings
above must not drift between screens. Net proceeds must be computed from price × quantity −
itemised costs, not hardcoded per row.

## 8. State coverage

The 18 references show mostly the happy/partial path. These are required demo states and
where they should appear (they must reuse the same components, not invent new styling):

| State | Where | Reference basis |
| --- | --- | --- |
| Empty | Farm Plan with no plan | 02 |
| Partial / unknown | Stage quote, soil result, mandi, forecast | 05, 09, 12, 11 |
| Stale | Mandi quotes | 12 |
| Unavailable / limited | Tools rows, forecast, grain tools | 07, 11 |
| Warning | Stage estimate, soil limitations | 05, 09 |
| Loading | OTP verifying; save/import actions | C (`Verifying your number…`, disabled CTA) |
| Success | OTP success → Home; quote saved; observation submitted; plan v2 | inferred from design system |
| Error / retry | OTP failure, invalid form input | tan banner + inline field messages |
| Done | Stage 1 check, mark-done | 04 |
| Disabled | Save with empty quote, Interpret with 0 values, OTP CTA | C buttons |

## 9. Integration pitfalls

1. **Do not implement the reference chrome.** Exported PNGs include the fake 9:41 status bar,
   the gesture handle, the 1 px `#D6DFD0` border and 28 radius. QA compares content only;
   the app must use real insets.
2. **Tab bar is custom and floating.** A stock `Tabs` bar cannot match 358×66 / radius 34 /
   inset 16 / five 69.2-wide items. Use a custom `tabBar`; keep it rendered on detail
   routes; reserve ≥ 86 + safe-inset bottom space in scroll content.
3. **Four colour systems are close but distinct** (`#213827` titles vs `#263B29` ink,
   `#6a7667` subtitles vs `#657360` muted). A blind token collapse reads as flat; map per
   §3.2.
4. **Near-duplicate type sizes** (10/11/12/13/14/15/16/21/22/25/28/30/32/36) are deliberate.
   Do not normalise to a 12/14/16 scale.
5. **Line heights**: 1.4 default, 1.25 for 24–30 display (home hero, empty plan, forecast,
   home greeting), 1.3 for 22 sheet titles, 1.5 for the tools footer. Two-line strings are
   authored with `\n` and must break exactly there.
6. **Fonts**: Inter must be loaded (screens rely on 400/500/600). Script labels need the Noto
   families or the system fallback; verify no clipping of Devanagari matras, Tamil/Telugu
   ascenders, and that the 17/400 native label + 12/400 Latin label stay on one row.
7. **Currency/typography characters**: `₹` with and without a following space differs by
   screen; `−₹ 3,200` uses U+2212; `→`, `›`, `≈`, `…`, `••••••`, `·` are literal copy.
8. **Small chips (25 dp) are below the 48 dp touch minimum.** Keep the visual height and add
   padding/hitSlop; never enlarge the chip fill.
9. **No shadows.** Adding elevation to cards, the tab bar, or sheets breaks the flat look.
10. **Hairline rules differ by list**: `#DFE6D8` for tools/fields, `#E7EBE1` for plan stages,
    `#E7EDE0` for profile, `#E6EBE1` for in-panel dividers, `#D6DFD0` only for the (unused)
    device frame and unselected language rows.
11. **Android font scaling breaks fixed-height rows** (86 tool rows, 72 profile rows, 59 stage
    rows, 78 input cards). Use `minHeight` and allow growth; test at 1.3.
12. **Keyboard**: assessment, stage quote, compose notes, phone number, and soil fields sit
    low; the pinned onboarding action block must move above the keyboard or the screen must
    scroll.
13. **Detail routes must keep the tab bar** and the primary action reachable; on short screens
    the content scrolls while the tab bar stays fixed.
14. **05 back is a row, not a header.** Do not add a native stack header; return to the plan.
15. **06 and 10 are full screens with sheet-styled panels**, not OS modals. Match the panel
    fills/borders above; the tab bar stays visible.
16. **Every number is demo data** and must stay consistent with §7 or be derived from it.
    Never show a forecast, price, nutrient value or community fact that the fixtures do not
    contain.
17. **Status badge wording is product behaviour** (`Reported` ≠ `Reviewed` ≠ `Confirmed`);
    do not merge styles or invent a fourth badge.
18. **Tools Grain quality / Grain ID have no reference screen.** Their rows must not push a
    blank route; use a bounded sheet in the established style.

## 10. Gaps — reference surfaces that do not exist (build them from this system)

* Assessment **step 2 of 2** (`Choose seed options` destination) — only step 1 is drawn.
  Use heading 28/600 + `Step 2 of 2 · Seed options` + the same progress row with the second
  segment active + grouped card + primary CTA.
* Quote/source sheets behind `View source calendar`, `Assumptions & evidence`, `Edit costs`,
  `Edit` (soil sample), `Data freshness`, `Evidence library`, `About Khetify`,
  `Location & consent`, language chooser, Terms & Privacy.
* `/tools/photo`, `/community/detail`, grain tool states.
* Demo reset / sign-out (required by the plan; Profile has no row for it).
* Loading/error/empty variants beyond the ones listed in §8.
* No reference for landscape, tablets, or font scale >1.3 — preserve the 342 column and rhythm.

## 11. QA procedure

1. Capture each route at 390-wide logical, default fixtures, and place it next to the PNG.
   Check content y=44..734 only; ignore reference chrome.
2. Verify the stack order, gaps (20), content padding (24), and that every block is 342 wide.
3. Verify exact copy against §6 (punctuation, currency spacing, capitalisation).
4. Walk the flows: language → mobile → OTP → Home; Home → plan/tools; plan → stage → review;
   soil → result → import; tools → forecast/mandi; community → compose → feed;
   profile → farm edit → reset.
5. Check the states in §8, cancelled edits not applying, confirmed edits propagating, and
   reset restoring §7.
6. Repeat on a 360-wide viewport and at font scale 1.3; check keyboard behavior, Android
   back, and that no primary action is clipped or hidden.
7. Record pass/fail per screen with the screenshot path; do not claim physical-device
   verification without evidence.

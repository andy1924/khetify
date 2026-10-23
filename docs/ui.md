# UI flows and layout

Extracted from `research.md`. Scope: Expo React Native (TypeScript, Expo Router), Android/iOS, demonstrated in Expo Go. This document describes screens, navigation, per-screen layout, and state handling only — API and data contracts live in the research doc.

## Navigation model

Bottom tab bar with five tabs, plus stack screens pushed from tabs.

| Tab | Root screen | Purpose |
|---|---|---|
| Home | Home dashboard | Entry point; pick Seed-to-Grain or an independent tool |
| Farm Plan | Plan list / active plan | Persistent staged workflow |
| Tools | Tool grid | Independent analysis tools (no farm enrollment required) |
| Community | Alert feed | Local reports and alerts |
| Profile | Settings and farm profile | Land/resources, consent, account |

Stack screens (pushed over tabs):

- Onboarding: land/resource assessment (first-run only)
- Tool detail screens: Soil, Crop image, Grain image, Grain ID, Price forecast, Mandi comparison
- Report composer (community)
- Plan revision confirmation sheet
- Result/evidence detail (citations, limitations)

**Core navigation rule:** tools are reachable from the Tools tab without a plan; a plan is reachable without using tools. Results never enter a plan automatically — always via an explicit "Add to plan" confirmation.

## App flow

```
Launch
  → Onboarding (first run) or Home
Home
  ├─ Start Seed-to-Grain → Onboarding inputs → Plan created → Farm Plan tab
  └─ Choose tool → Tools tab → Tool screen → Result → optional "Import to plan"
Tools
  → Soil | Crop image | Grain image | Grain ID | Price forecast | Mandi comparison
  → Result screen (evidence, limitations, actions)
Community
  → Alert feed → filtered by radius / crop / recency
  → Report composer → unverified report shown in feed as "Reported"
Farm Plan
  → Stage list → Stage detail → Task detail
  → Revise plan (budget/resource change) → Diff sheet → Updated plan
```

## Screen layouts

### Home

Vertical scroll.

1. Greeting + active farm summary chip (crop, area, season) — or "No active plan" call to action.
2. Primary card: **Seed-to-Grain** — subtitle "Step-by-step plan from seed to sale", CTA `Start` / `Continue`.
3. Next-action card: single highest-priority task from the active plan, with due date and reason.
4. Alert strip: up to 2 recent community alerts near the farm (crop-relevant, recent).
5. Tool shortcuts row: 3–4 icons (Soil, Crop image, Prices, Community).
6. Honest-state footer: data freshness ("Prices as of <date>"), any unavailable features.

### Farm Plan — list / empty state

- Empty state: illustration + copy explaining the plan is persistent and revised as budget/resources change. Primary `Assess my farm` button; secondary `Browse tools`.
- Plan list (multi-farm later): card per farm — crop, area, season, stage progress bar, next task, remaining budget.

### Farm Plan — active plan

Vertical timeline of stages (Land assessment → Seed options → Preparation/sowing → Nutrition/water/weather → Harvest/storage → Selling).

Per stage card:

- Stage name, status (`done` / `current` / `locked` / `blocked`), progress
- Up to 3 tasks with checkbox, cost, and source tag
- Locked stages show prerequisite text instead of tasks

Header band (sticky):

- Remaining budget vs. total budget
- Constraints chips (water, area, season)
- `Revise plan` button → revision flow

Footer: assumptions and evidence version, expandable.

### Stage detail

- Task list with: title, rationale (why this task now), quantities, cost, evidence citation link, done checkbox.
- Missing-input banner when cost or quantity cannot be computed ("Price unavailable — estimate incomplete"). Never show a fabricated number.
- `Mark done` writes the action and updates budget/next task.

### Plan revision flow

1. Farmer edits budget, water availability, area, or a price quote.
2. Deterministic check runs server-side.
3. **Diff sheet** (bottom sheet, non-dismissible until reviewed): list of changes with reasons — removed tasks, replaced seed option, reordered stages, cost delta.
4. If no feasible plan exists: blocked state with the specific violated constraint and the options ("increase budget by ₹X" / "reduce area" / "switch seed option"), plus `View source calendar` fallback.
5. `Confirm` applies and bumps the plan version; `Cancel` restores the previous values.

### Tools tab

Grid of 6 cards, each with icon, name, and capability label (`Ready` / `Limited` / `Unavailable — needs data`). Unavailable tools remain visible with their prerequisite stated; they never render fake results.

### Tool screens (shared layout)

1. Header: tool name + one-line capability statement ("Interpret your soil test values" / "Provisional visual triage, not a diagnosis").
2. Input form: only fields documented in research.md for that tool; unknown units/values accepted as blank and shown as unknown.
3. `Analyze` CTA with inline validation.
4. Result view:
   - Structured result block (values, ranges, or description)
   - **Limitations** panel (persistent, not dismissible)
   - **Evidence** panel: source cards (publisher, date, section) — expandable
   - Actions: `Add to plan` (confirm dialog) and `Ask a follow-up` where grounded
5. Abstain state: explicit "Insufficient evidence" screen explaining what is missing, with no partial answer dressed as a result.

#### Soil analysis

Inputs: test values (12 Soil Health Card parameters), units, sample date, crop.
Layout: two-column value grid, unit selector per row, blank = unknown. Result: interpretation per value, crop suitability constraints, and what cannot be concluded without missing values.

#### Crop quality image

Inputs: photo (camera or gallery), crop, growth stage, recent history notes.
Layout: full-width photo drop area with `Camera` / `Gallery` buttons, then metadata form. Result: visible-symptom description + suggested inspection questions; prominently labelled provisional triage.

#### Grain image / Grain identification

Inputs: photo. Output constrained to a bounded class list; unknown → rejection screen ("Outside supported classes"), never a forced match. Defects listed separately from type.

#### Grain price forecast

Unavailable until the data gate passes. Screen shows the gate status, last available date of the series, and a `Show current price instead` action. When enabled: commodity/variety/market/horizon selectors, forecast with an uncertainty band and a baseline comparison, and the horizon stated explicitly.

#### Mandi comparison

Table layout:
- Row per market: price, grade, unit, date, transport/handling/fees entered by farmer, **net proceeds** (highlighted).
- Sorting on net proceeds, not headline price.
- Banners for stale quotes, mismatched units, and missing cost entries.

### Community

Feed of cards sorted by recency, filtered by:
- Radius (demo setting, labelled as such — not a spread model)
- Crop relevance
- Recency

Card: report type icon, crop, relative time, distance (approximate), evidence thumbnail, status badge (`Reported` / `Reviewed` / `Confirmed` / `Rejected`).

Rules rendered in the UI: duplicates never merge into a confirmed alert; `Reported` and `Reviewed` are visually distinct from `Confirmed`; pesticide reports carry "historical observation, not an endorsement."

Report composer: type selector, crop, observation time, location (consent gate; manual district fallback), photo, notes. Submits as **Reported**. Exact farm coordinates are never displayed to others.

Alerts: in-app feed only. No remote push in Expo Go — no UI may imply background notifications.

### Profile

- Farm profile and resources
- Location consent controls
- Evidence/source library link
- Data freshness summary
- About / capability boundary statement

## Shared components

| Component | Use |
|---|---|
| `EvidenceCard` | Publisher, date, section, access URL |
| `LimitationPanel` | Persistent, non-dismissible caveats |
| `StatusBadge` | Plan stage, tool availability, report verification state |
| `ConstraintChip` | Budget/water/area constraints in headers |
| `MissingInputBanner` | Unknown data, incomplete estimates |
| `ConfirmSheet` | Import-to-plan, plan revision diff |
| `AbstainView` | Insufficient evidence / out-of-scope |
| `FreshnessLabel` | Source date on prices, weather, alerts |

## State matrix

Every screen has these states, all labelled honestly:

| State | Rendering |
|---|---|
| Loading | Skeleton, no invented placeholders |
| Empty | Explanation + next action |
| Partial data | Value shown as unknown; estimate marked incomplete |
| Insufficient evidence | `AbstainView` with the missing input named |
| Stale data | `FreshnessLabel` + warning banner |
| Unsupported | Capability card with prerequisite; no result |
| Hard-constraint violation | Blocked state naming the constraint and the fix options |
| Error (422/401/403/503) | Actionable message; auth errors route to sign-in; 503 offers retry |

## Presentation constraints

- Single shared codebase for Android and iOS; verify on a physical Android and iOS device before the demo.
- Image tools may be cut at hour 8 — their tabs stay visible in an `Unavailable` state rather than disappearing.
- Snapshots, accelerated season progression, and simulated community events must be visibly labelled in the UI.
- Numbers that are projections carry a projection label; user-entered costs are distinguished from sourced prices.

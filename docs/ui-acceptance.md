# Khetify MVP UI acceptance

Implemented on 24 October 2026 in `D:/Apps/projects/adapt/khetify`. This is the authorized UI-only MVP: interactive native screens, deterministic local fixtures, and in-memory state. It has no service integration or persistent account/data storage. Main was pulled to `6ea01e2` before implementation; user-owned `docs/ui.md` was preserved.

## Delivered

- Three-step language/mobile/demo OTP onboarding with loading, failure and retry.
- Five connected tabs: Home, Farm Plan, Tools, Community and Profile. Detail routes retain tab navigation; the keyboard hides it while editing.
- Empty/active farm plans, two-step assessment, seed choices/quotes, stage completion/unlocking, budget revision review, confirm and cancel.
- Soil input and units, validation, analyzing/result states, immutable result snapshots, evidence and selective reviewed import. Unknown nutrients remain unknown.
- Forecast unavailable state; market comparison with editable quantity/costs and calculated nets. Missing costs remain incomplete. Unsupported commodities do not reuse wheat quotes.
- Bundled illustrated photo previews and history. Grain quality/identification states are explicitly bounded demo tools, with no diagnosis or camera/gallery permission.
- Community filters, compose/validation/fixture photo, local submission, status explanation and detail/evidence sheets.
- Profile/farm editing, six locale preferences, three consent controls, source/freshness/about sheets, first-visit scenario, reset and sign-out.

## Automated verification

- `npm run typecheck`: passes.
- `npm run lint`: passes across `src`.
- `npm run check:demo`: 13 meaningful state checks pass. Covers revision cancel/confirm, assessment/profile cancellation, selected soil import, units/snapshot isolation, import-claim reset, unknown market costs, quantity, stage ordering, history and reset.
- `npx expo install --check`: dependencies up to date.
- `npx expo-doctor`: 20/20 pass.
- Metro Android entry bundle: HTTP 200. Expo SDK 58.0.17 / React Native 0.88 / Expo Go 58.0.5.

## Native evidence

The real OnePlus CPH2569 (Android 15, 1080×2412, density 480, normal font scale) ran Expo Go via USB forwarding. On-device checks exercised onboarding into Home, tabs/Tools, soil entry with the real keyboard, soil result and selected import. Status/navigation chrome and keyboard behavior were inspected. Evidence includes `artifacts/phone-home.png`, `phone-tools.png`, `phone-keyboard.png`, and `phone-soil-result.png`.

After the final worker changes, a full phone reload was performed. A lost USB forwarding rule was restored, then onboarding succeeded again. Photo picker selection followed by Android back left the preview unselected. Community compose notes followed by hardware back were cleared when composing again. Expo Go's floating developer control was moved away from the New report button. Final power state reports `mWakefulness=Awake`, `mStayOn=true`; USB reverse is active.

Phone was left on Home with Metro running. Final screenshot: `artifacts/phone-final-home.png`.

Android emulator walkthrough also covered failed/retried OTP, all five tabs, empty assessment to active plan, seed quote, stage unlock, revision cancel and confirm, soil import subset, history, forecast/market quantity cancellation and recalculation, community validation/photo/submission, and profile edit cancellation. Captures for the 18 reference surfaces are under `artifacts/`; some predate final copy/lifecycle corrections and are development evidence, not a pixel-perfect final baseline.

Smaller 320×640 logical viewport at font scale 1.3 was exercised. Content scrolls and controls remain reachable; language/mobile screens were inspected at larger font. The Community tab label wraps at this extreme setting. Emulator overrides were restored afterwards. Phone display settings were not changed.

## Source fidelity and review

Only final Pencil frame `Qx0SG` controls the design. All 18 references were exported without changing the canvas; exact copy/tokens are in `reference-qa.md` and `design-nodes.json`. Native UI uses Inter, Lucide and the extracted palette, spacing and rounded shapes. Fake status/gesture bars are excluded. An exhaustive final pixel-diff across every screen/device was not performed.

Two independent Opus reviews are recorded in `ui-review-r1.md` and `remaining-flows-review.md`. Tools fixes are recorded in `tools-fixes-r1.md`; navigation/draft fixes in `final-lifecycle-fixes.md`. Parent fixes include imported-state reset and crop/unit snapshots, honest unsupported market states, onboarding validation/formatting, safe-area spacing, sheet localization labels and reference copy corrections.

## Running and limits

Metro stays running on port 8081. The connected phone uses `adb reverse tcp:8081 tcp:8081` and `exp://127.0.0.1:8081`; reconnect/reapply forwarding if USB disconnects. Android stay-awake while connected is enabled, with the original 120000 ms timeout unchanged; the app also uses foreground keep-awake. See `../README.md` for restart commands.

English is the reviewed reference copy; other locale choices save preference and fall back to English. State resets on a full reload. Camera/SMS, live prices/forecast, diagnosis, public posting, notifications, payments and a production backend are outside the UI-only implementation.

The Expo CLI dependency chain reports four high npm-audit entries through one node-forge advisory (GHSA-86w9-cpqp-85rv). The suggested automatic fix downgrades Expo to 44 and is incompatible with the verified SDK 58 setup. No production release or certificate-signing workflow was run.

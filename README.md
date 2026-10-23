# Khetify

A native farming-app MVP built with Expo and React Native, based on the final Khetify mobile design. It connects onboarding, farm planning, soil tools, market comparison, community reports and profile settings.

This version is an interactive **UI-only demo**. Accounts, OTP, plans, soil results, prices and community reports use deterministic local data. Nothing is sent to a service. State resets on a full reload; Profile also includes reset and sign-out controls.

## Features

| Area | Included |
| --- | --- |
| Onboarding | Six language choices, mobile-number validation, simulated OTP, loading/failure/retry states |
| Home | Farm summary, next step, plan entry and quick tools |
| Farm Plan | Empty and active plans, two-step assessment, seed options/quotes, ordered stages, budget revision with confirm/cancel |
| Soil | Input validation and units, sample result, evidence, selective import into the plan, tool history |
| Markets | Sample wheat prices, editable quantity and costs, calculated net returns, incomplete-data states |
| Photo tools | Bundled illustrated fixtures, preview selection and history; explicit capability limits |
| Community | Filters, observation details/status, report composition, fixture photo and local submission |
| Profile | Farm editing, language preference, consent switches, source/freshness sheets and demo controls |

## Run on Android

Requirements: Node.js, npm and Expo Go compatible with SDK 58. Android verification used Expo Go 58.0.5 on a OnePlus CPH2569 running Android 15. The dependency lockfile fixes the installed package set.

```powershell
git clone https://github.com/andy1924/khetify.git
cd khetify
npm ci
npm start
```

Keep the computer and phone on the same Wi-Fi. Scan the terminal QR code in Expo Go. If LAN is blocked, use `npx expo start --tunnel`.

For USB debugging on Windows, connect and authorize the phone, put Android platform-tools on your PATH, then run from the project folder:

```powershell
adb devices
adb reverse tcp:8081 tcp:8081
$env:REACT_NATIVE_PACKAGER_HOSTNAME='127.0.0.1'
npx expo start --lan --port 8081
```

Then open `exp://127.0.0.1:8081` in Expo Go. If multiple devices are connected, add `-s <serial>` after `adb`. Reapply forwarding after reconnecting USB. No account, API credentials or Android development build are required. The foreground demo keeps the screen awake for review.

## Review

The onboarding flow leads into five tabs: Home, Farm Plan, Tools, Community and Profile. Details retain the bottom navigation. Forms, sheets, confirmations, demo error states and local history are interactive. Confirmations apply state explicitly; cancellation leaves committed data alone. Camera/gallery actions use bundled fixtures and request no permissions.

The six language choices update the in-memory locale preference. English is the supplied reference content; complete reviewed translations are outside this UI build. Script labels use the device fallback font.

## Checks

```powershell
npm run typecheck
npm run lint
npm run check:demo
npx expo install --check
npx expo-doctor
```

TypeScript, ESLint, 13 state checks, the Android Metro bundle, Expo dependency compatibility and all 20 Expo Doctor checks passed during MVP verification. Android phone/emulator coverage and remaining visual limitations are recorded in [UI acceptance](docs/ui-acceptance.md). Reference screenshots and scenarios are in [Reference QA](docs/reference-qa.md).

## Project structure

```text
src/app/          Expo Router entries and navigation
src/features/     Onboarding, home, plan, tools, community and profile screens
src/ui/           Shared native components and design tokens
src/demo/         Typed local state, reducer, selectors and fixtures
src/locales/      Central interface copy and locale fallback
scripts/          Demo-state checks and local device QA helper
docs/             Design references, contracts and verification evidence
```

The stack uses Expo SDK 58, React Native 0.88, React 19.3, TypeScript, Expo Router, HeroUI Native/Uniwind foundations, Inter and Lucide. Shared UI APIs and state contracts are documented in [UI API](docs/ui-api.md) and [Demo contract](docs/demo-contract.md).

## Design and assets

Only Pencil frame `Qx0SG`, “4. Khetify — Final Mobile”, controls this implementation. Reference captures are in `docs/reference-images`; they are review material and are never rendered as app screens. Inter through `@expo-google-fonts/inter` uses the SIL Open Font License; Lucide icons use the ISC license. Bundled fixture artwork and assets are documented in [Asset provenance](docs/asset-provenance.md).


# Khetify

A native farming-app MVP built with Expo and React Native. Khetify combines local farm-planning tools with live, clearly labelled integrations for satellite monitoring, area alerts and AI-assisted plant-photo assessment.

The app is a demo, not a production agronomy service. Several planning, soil, market and community flows still use local in-memory fixtures, while the live integrations require the backend and provider configuration described below. State resets on a full reload; Profile also includes reset and sign-out controls.

## Features

| Area | Included |
| --- | --- |
| Onboarding | Six language choices, mobile-number validation, simulated OTP, loading/failure/retry states |
| Home | Farm summary, next step, plan entry and quick tools |
| Farm Plan | Empty and active plans, two-step assessment, seed options/quotes, ordered stages, budget revision with confirm/cancel |
| Soil | Input validation and units, sample result, evidence, selective import into the plan, tool history |
| Markets | Sample/local price states, editable quantity and costs, calculated net returns, incomplete-data states |
| Satellite | Uses the phone's foreground GPS location, requests a 500 m sampling area, fetches dated Copernicus Sentinel-2 imagery/NDVI when available, and falls back to an Esri aerial basemap for display |
| Alerts | Separate **Current warnings** and **Recent events** tabs; weather advisories come from Open-Meteo and nearby incidents require reviewed, consented backend data |
| Plant health | Sends an opted-in plant photo to the configured OpenAI vision model (`gpt-4.1-mini` by default) and returns image quality, confidence, possible causes and next steps |
| Photo tools | Bundled illustrated fixtures for unsupported grain/photo tools; the plant-health flow uses the live backend integration above |
| Community | Filters, observation details/status, report composition, fixture photo and local submission |
| Profile | Farm editing, language preference, consent switches, source/freshness sheets and demo controls |

## Run on Android

Requirements: Node.js, npm and Expo Go compatible with SDK 58. Android verification used Expo Go 58.0.5 on a OnePlus CPH2569 running Android 15. The dependency lockfile fixes the installed package set.

```bash
git clone https://github.com/andy1924/khetify.git
cd khetify
npm ci
npm start
```

`npm start` starts the local backend and Expo together. Keep the computer and phone on the same Wi-Fi and scan the terminal QR code in Expo Go. Allow foreground location access when opening Satellite. Expo tunnels forward Metro, not the backend port, so tunnel mode needs a reachable HTTPS backend URL.

Create `server/.env.local` for the backend and put the provider credentials there—not in the Expo app:

```dotenv
PRICE_API_HOST=0.0.0.0
COPERNICUS_CLIENT_ID=your-client-id
COPERNICUS_CLIENT_SECRET=your-client-secret
OPENAI_API_KEY=your-openai-key
```

For a phone on LAN, set the app's root `.env.local` to the computer's reachable address and restart Expo:

```dotenv
EXPO_PUBLIC_FIELD_API_URL=http://192.168.x.x:8787
```

Satellite credentials stay server-side. The phone's GPS is used only to request the nearby demo sampling area; it is not silently saved as a farm boundary. Sentinel imagery is a dated capture, not a live camera feed. If Sentinel imagery has no usable preview, the app displays an Esri aerial basemap while keeping NDVI labelled as unavailable.

For USB debugging on Windows, connect and authorize the phone, put Android platform-tools on your PATH, then run from the project folder:

```powershell
adb devices
adb reverse tcp:8081 tcp:8081
$env:REACT_NATIVE_PACKAGER_HOSTNAME='127.0.0.1'
npx expo start --lan --port 8081
```

Then open `exp://127.0.0.1:8081` in Expo Go. If multiple devices are connected, add `-s <serial>` after `adb`. Reapply forwarding after reconnecting USB. No account or Android development build is required for the local UI, but the live satellite and plant-health integrations need the server credentials above. The foreground demo keeps the screen awake for review.

## Review

The onboarding flow leads into six tabs: Home, Farm Plan, Tools, Alerts, Community and Profile. Details retain the bottom navigation. Forms, sheets, confirmations, demo error states and local history are interactive. Confirmations apply state explicitly; cancellation leaves committed data alone. Satellite requests foreground location permission; Plant Health requests photo-library/camera access only when the user chooses an image.

The six language choices update the in-memory locale preference. English is the supplied reference content; complete reviewed translations are outside this UI build. Script labels use the device fallback font.

## ICT, AI integrations and limits

The app's ICT layer connects the phone, location services, remote-sensing data and backend APIs: GPS identifies the nearby sampling area, Copernicus supplies dated crop signals, Open-Meteo supplies weather inputs, and the OpenAI vision integration assesses an opted-in plant photo. These integrations are deliberately separated from local demo fixtures so the UI can show when a source is unavailable.

- Copernicus credentials are required for Sentinel imagery and NDVI. The app never exposes those credentials to Expo.
- OpenAI is used only by Plant Health. The backend validates and downsizes images, sends them to the configured vision model with structured output, and does not save the photo or result. Pesticide suggestions are not shown unless reviewed label data is configured; the app does not invent chemical advice.
- Area alerts use approximate rounded coordinates. Weather advisories are modelled thresholds, not official IMD warnings. Missing weather or incident data is shown as unavailable/unconfigured rather than as an all-clear.
- The satellite basemap is for visual orientation. Its date may vary; NDVI is calculated only from dated Sentinel observations.

Detailed setup and data contracts are in [satellite setup](server/SATELLITE.md), [area alerts](server/AREA_ALERTS.md), and [plant-health setup](server/PLANT_HEALTH.md).

## Checks

```bash
npm run typecheck
npm run lint
npm run check:demo
npm --prefix server test
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
scripts/          Dev launcher, demo-state checks and location-area checks
server/           Satellite, alerts, plant-health and existing backend routes
docs/             Design references, contracts and verification evidence
```

The stack uses Expo SDK 58, React Native 0.88, React 19.3, TypeScript, Expo Router, HeroUI Native/Uniwind foundations, Inter and Lucide. Shared UI APIs and state contracts are documented in [UI API](docs/ui-api.md) and [Demo contract](docs/demo-contract.md).

## Design and assets

Only Pencil frame `Qx0SG`, “4. Khetify — Final Mobile”, controls this implementation. Reference captures are in `docs/reference-images`; they are review material and are never rendered as app screens. Inter through `@expo-google-fonts/inter` uses the SIL Open Font License; Lucide icons use the ISC license. Bundled fixture artwork and assets are documented in [Asset provenance](docs/asset-provenance.md).


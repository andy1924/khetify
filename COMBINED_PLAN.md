# Farm-to-Market Farmer App — Combined Product Plan

## Purpose

An India-focused Android app that helps farmers make practical decisions from seed selection through harvest and grain sale. The app is designed for ordinary phones, approximate inputs, limited connectivity, and low operating cost.

The product has two separate parts:

1. **Seed-to-Grain Plan:** one guided plan for a crop cycle, covering preparation, crop and seed choice, inputs, in-season actions, harvest, and sale.
2. **Standalone tools:** Soil Analysis, Crop Health Check, Grain Identification, Mandi Price Comparison, Price Trend, and Community Alerts. Each can be opened and used without creating a Seed-to-Grain Plan.

Advice is decision support. It must show its evidence and date, identify assumptions and uncertainty, and avoid promising yield, safety, prices, or profit.

## Users and boundaries

- **Primary user:** farmer using an Android phone in India. A farmer can try a useful feature without account creation, precise GPS, a soil test, or complete records.
- **Pilot scope:** one selected district or connected district cluster, two or three crops, and one or two languages. The actual pilot choices are open decisions; national coverage is not a launch claim.
- **Secondary buyer workflow:** comparing a procurer's own supplier samples and recorded prices is retained from the earlier plan as a later, separate workflow. It is not the farmer's mandi comparison feature. Access must be role-gated and buyer records private. Do not build this workflow in the farmer MVP.
- **Out of scope:** transaction marketplace, public supplier ranking, new sensors or drones, guaranteed yield or price, credit/insurance decisions, and official certification from an image.

## 1. Seed-to-Grain Plan

### Goal

Help a farmer plan and follow one crop cycle using their location, budget, land, water, and chosen crop. The farmer can edit assumptions and skip questions that do not apply.

### Minimum inputs

Ask progressively for:

- District or approximate area; GPS is optional.
- Season and crop, or permission to compare a short crop shortlist.
- Approximate plot area and budget range.
- Irrigation method and approximate water availability.
- Previous crop, if known.
- Optional Soil Health Card/lab result, seed packet, or relevant photos.

Do not ask for a value that will not change the next recommendation. Label unknown values instead of filling them with guesses.

### Plan steps and outputs

1. **Resource summary:** show farmer-provided facts, uploaded report values, assumptions, and missing information separately.
2. **Land preparation:** provide a crop- and season-specific checklist with timing, based on reviewed local guidance.
3. **Crop and seed choice:** compare up to three locally suitable choices by seed cost, crop duration, water demand, and known constraints. Show the source/date for suitability and price. Do not claim current stock without a verified availability source.
4. **Seed, fertilizer, and water plan:** calculate quantities only from a reviewed crop/region recommendation and confirmed plot area. Show the formula, units, assumptions, and estimated cost range where current prices exist. If data is insufficient, explain the missing input and link to general local guidance; never invent a dose.
5. **Weather-aware schedule:** show planting windows and crop-stage actions. Weather-based reminders show provider and update time, and are advisory. If forecast data is unavailable or stale, say so.
6. **Crop-stage checklist:** let the farmer mark actions complete, skip them, or change dates. Reminders are optional and can be paused.
7. **Problem handoff:** let the farmer open Crop Health Check or relevant Community Alerts. Neither a nearby report nor an uncertain image can automatically prescribe pesticide use.
8. **Harvest and storage:** offer a crop-specific checklist and guidance on representative sampling. Visual cues are not lab measurements or official grades.
9. **Sale planning:** open Mandi Price Comparison and Price Trend with the selected crop and area prefilled. Show gross reported prices separately from any farmer-entered transport or fee estimates.

### Plan card format

Every recommendation card contains: **next action, why, evidence/source and date, assumptions, confidence or limitation, and cost/quantity with units when supported**. Provide a safer fallback or local expert referral when confidence is low.

## 2. Standalone tools

### 2.1 Soil Analysis

**User action:** enter a conversation, describe the field, optionally add a photo, and optionally upload a Soil Health Card or lab report.

**Output:** plain-language interpretation of reported measurements; visible observations from photos; one or two useful follow-up questions; and crop/rotation options for the supported region when local references exist.

**Limits:** photos and descriptions cannot determine pH, NPK, or other chemical values. Do not output a fabricated soil score or precise deficiency. Mark report extraction as uncertain until the farmer confirms it. Explain crop rotation in terms of locally suitable seasons, previous crop, duration, and water; do not prescribe a fixed universal rotation schedule.

### 2.2 Crop Health Check (image-based)

**User action:** select crop and growth stage, add a clear image of the affected plant/area, and answer only relevant questions such as when symptoms began and how much area is affected.

**Output:** likely visible issue, plausible alternatives, confidence, a retake request where needed, low-risk immediate steps, and a referral path for uncertain or spreading symptoms.

**Limits:** start with a published list of supported crops and conditions. This is triage, not a definitive diagnosis or yield/harvest-quality score. Pesticide details appear only when an approved crop- and pest-specific label source is available; include application basis, protective equipment, waiting/re-entry interval, and source. Otherwise provide no dose and refer to a qualified local source.

### 2.3 Grain Identification and Visual Sample Check (image-based)

**User action:** photograph a small sample on a plain surface in adequate light; follow on-screen framing guidance.

**Output:** likely grain identity among the declared supported types, visible sample characteristics, confidence, alternatives, and retake guidance for mixed or poor-quality images.

**Limits:** a photo cannot establish moisture, contamination, toxins, food safety, official grade, or the defect rate of an entire lot. Do not create a whole-lot or supplier quality score from one image. Recommend representative sampling or laboratory/official grading when a measured result is needed. Store observations against the individual dated sample, not as a permanent judgment about a farmer or supplier.

### 2.4 Mandi Price Comparison

**User action:** choose crop/variety (if known), quantity unit, and approximate area; optionally enter expected transport cost.

**Output:** a short list of relevant markets with reported price, market, commodity/variety fields, unit, report date, source, and distance only when location data supports it. Valid unit conversions retain the original value and unit.

**Limits:** mark stale, missing, or incomparable records. A reported rate is not a live offer or guaranteed sale price. Show known costs separately and label unknown costs; do not claim net earnings when costs are missing. Verify source access, terms, fields, freshness, and coverage before relying on a feed.

### 2.5 Grain Price Trend (prediction)

**User action:** choose a supported crop/variety, market or region, and forecast horizon.

**Output:** only where historical data supports it, show a price range, forecast horizon, update time, data coverage, uncertainty, and recent model performance against a simple baseline.

**Release rule:** this feature is hidden for a market/crop combination until time-based back-testing shows useful performance and calibration on comparable data. If data is sparse or the model falls below its agreed threshold, show historical sourced prices and “forecast unavailable.” Never say the farmer should sell or hold, or promise a price.

### 2.6 Community Pest, Disease, and Pesticide Alerts

**User action:** opt in to alerts, select a coarse area/radius and crop interests, and optionally submit a report with crop, approximate area, date, symptoms or product used, and optional image.

**Alert contents:** nearby and crop-relevant report, age of report, evidence type, and confidence/status. A pesticide report may show the product/active ingredient and intended pest only as reported; verified label safety information is separately sourced and clearly distinguished.

**Controls and limits:** location sharing and notifications are separate opt-ins. Exact field coordinates and reporter identity are not public. Reports expire, can be corrected or flagged, and are deduplicated and rate-limited. Low-confidence reports are labeled and may be held for review. Community reports are not endorsements, diagnoses, or treatment instructions. Do not recommend a pesticide from a report alone. Use a maintained local extension contact only when verified.

## 3. Shared app functions

- **Profile:** optional language, approximate location, and saved crop plans. Ask separately before using precise location or sharing data.
- **Language:** select the pilot languages after farmer research. Use reviewed translations for buttons, safety information, units, and fixed guidance. Sarvam may support dynamic translation or voice after testing crop vocabulary, speech recognition, pronunciation, latency, and cost. Let users correct speech-to-text and replay audio.
- **Weak connectivity:** cache saved plans and fixed local guides; label cached prices/weather with last update; submit a community report only after the user confirms sending it.
- **Notifications:** off by default until the user opts in; controls for quiet hours, frequency, crop-plan reminders, and community alerts.
- **Feedback:** let users flag a result, correct input, request a retake, or report unsafe/misleading content. Do not promise human review unless a staffed review path exists.
- **Privacy:** collect minimum data; define retention and deletion; encrypt data in transit and storage; separate identity from community posts; restrict staff access; do not use identifiable or precise-location data for model training by default.
- **Traceability:** retain source/version and date for recommendations, model outputs, and displayed market/weather data so errors can be investigated.

## 4. Data and recommendation rules

Before using a data source, record its owner, terms, geographic coverage, fields, update rate, attribution requirements, quality checks, and fallback. Candidate sources include official/state agriculture guidance, weather services, government market-price data, and approved product labels; access and terms must be verified before implementation.

Use reviewed local rules and deterministic calculations for fertilizer, seed, and water quantities. AI can ask questions, interpret farmer language, and explain approved material. It cannot invent agronomic facts, numeric doses, prices, or source citations. Image models are limited to supported crops/classes and must return “uncertain” when evidence is weak.

## 5. Feasible delivery plan

### Hackathon prototype

Deliver a demonstrable, coherent farmer journey, not production claims:

- One selected pilot area and two crops, clearly named in the prototype.
- Seed-to-Grain flow using reviewed sample guidance and clearly labeled sample inputs.
- Standalone soil conversation and sourced/sample mandi comparison.
- A grain identification or crop-health image screen using a clearly labeled prototype result; do not imply validated diagnosis.
- One language plus reviewed interface labels; use simulated integrations only if visibly marked as demo data.
- Keep the price forecast and live community notifications as mockups or “coming later” unless real data, validation, privacy, and moderation are implemented.

### First field release

- Confirm pilot region, crops, language, agronomy reviewer, source rights, privacy approach, and support route.
- Ship the crop-cycle plan, soil report interpretation/conversation, and mandi comparison for that coverage.
- Add offline saved guidance, correction, source timestamps, and basic language testing.
- Measure task completion, comprehension, failure/stale-data rates, harmful advice reports, low-end device performance, and operating cost.

### Later releases

- Add grain identification and crop-health triage only for classes with expert-labeled local test data, capture guidance, and agreed precision/recall and abstention thresholds.
- Pilot community alerts only after opt-in location controls, report expiry, moderation ownership, abuse response, and deletion are working.
- Enable price forecasts only for crop/market pairs that pass time-split validation and periodic monitoring.
- Consider procurer supplier comparison only after buyer workflow, access control, input format, and retention are specified.
- Expand region, crop, and language coverage when data, review capacity, quality, and per-farmer cost support the expansion.

## 6. What makes a feature ready

- A named target user and a single clear user action.
- An exact input list, with required and optional fields identified.
- A defined output and a useful behavior when data is missing or uncertain.
- A named source or validation set for every factual or predictive claim.
- A measurable release check and an owner for ongoing data/model review.
- A fallback that does not invent a result or present stale information as current.

Do not add general-purpose chat, unspecified “AI recommendations,” broad scoring, open-ended social feeds, or integrations without a named farmer decision they improve. Every new feature must fit these readiness checks and the chosen pilot scope.

## 7. Decisions to settle for the build

1. Pilot district/area and the first two crops.
2. First language and whether voice input/output is required for the demo.
3. Hackathon demo versus field pilot deliverable.
4. Available agronomy reviewer and validated local content.
5. Price/weather data source that can be used, with its terms and update cadence.
6. Whether image analysis and community alerts will be simulated in the demo or implemented with validated data and moderation.

Until these are settled, use explicit demo data and label it. The product scope above defines the combined target; it does not claim every module is feasible in one hackathon build.

## Source preservation

This combined plan consolidates the user's expanded feature brief and the existing staged product plan. The originals remain available as `PLAN.md` in the workspace and `C:\Users\Sarvesh\Downloads\PLAN.md` in Downloads. Where an item from the earlier plan was not part of the farmer-facing request, it remains identified here as the deferred procurer workflow rather than being treated as an MVP feature.

# Khetify price backend

Backend only. No frontend, UI, mobile dependencies or screen wiring is changed.
Requires Node.js 24 or later. Install the locked backend dependency (`sharp`) with `npm ci`. It decodes photos, limits image dimensions and removes metadata before recognition.

## Run

From this folder:

```powershell
Copy-Item .env.example .env.local
npm ci
npm start
```

The API listens at `http://127.0.0.1:8787`. Keep the default loopback binding for local development. Set the allowed frontend origin only when a client is integrated. A phone can reach a USB-forwarded local server with `adb reverse tcp:8787 tcp:8787`. Public hosting needs an HTTPS reverse proxy and deployment-level access/rate controls.

OpenStreetMap Nominatim works without an API key. The configured User-Agent identifies this application. Location lookup is on explicit request, never autocomplete. Public Nominatim calls are serialized to at most one per 1.1 seconds, town searches are cached for 30 days, and the provider URL can be switched. This is suitable for a small pilot; use a hosted/self-hosted provider for larger traffic. Do not send personal addresses or confidential information.

Government price access **does** require a data.gov.in key. Put `DATA_GOV_API_KEY` in the server's ignored `.env.local`, never in a frontend variable. Verify this resource's access, permitted use, schema and INR/quintal units, then set `PRICE_SOURCE_VERIFIED=true`. The government resource could not be accessed for live verification during this implementation; no price-feed success or market coverage is claimed. Missing credentials, denied access and network failures return an explicit warning and any existing sourced history, with no sample-price fallback.

## API

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Server and price-feed configuration status; no secrets |
| `GET /api/places?q=Nashik%20India` | OSM town/market search, Indian matches with source object URLs |
| `GET /api/places?lat=20.01&lon=73.79` | Approximate-area reverse lookup; coordinates rounded to 2 decimals and not stored |
| `GET /api/prices?state=Maharashtra&commodity=Wheat&district=Nashik` | Fetch government reports, validate and persist history, return latest per comparable series |
| `GET /api/catalog` | Exact crop/variety/grade/market combinations present in stored data; optional state/district/commodity filters |
| `POST /api/compare` | Nearby-market filtering, quantity conversion and caller-entered costs, without storing location or costs |
| `GET /api/forecast?state=...&district=...&market=...&commodity=...&variety=...&grade=...&horizon=7` | Historical context, rolling back-tests, release reasons and a range only when every gate passes |
| `GET /api/photo-prices/capabilities` | Published photo crop scope, upload limits, confirmation requirements and model-configuration status |
| `POST /api/photo-prices` | Crop photo → tentative identity → local sourced prices → farmer confirmation → gated forecast |
| `GET /api/crops` | Configured identity mappings plus commodity coverage derived from sourced records; crop IDs for manual review/price linking |
| `POST /api/grain-screening` | Consented photo → validated specialized detector observations, or an honest unavailable/retake result |
| `POST /api/grain-screening/review` | Validate farmer-corrected visible counts and optional calibrated-meter reading; no storage |
| `POST /api/grain-screening/prices` | Reviewed grain observations → confirmed source commodity → existing price comparison and forecast gate |
| `POST /api/grain-history/session` | Explicit opt-in to result storage; creates a private bearer token |
| `GET /api/grain-history` / `POST /api/grain-history` | List or explicitly save reviewed results within the bearer token's private history |
| `DELETE /api/grain-history/:id` / `DELETE /api/grain-history` | Delete one owned result, or delete the history and revoke its token |

Price search requires state and commodity; optional exact filters are district, market, variety and grade. API names are the source names, so an OSM administrative name may need correction before matching the price feed. Queries above 10,000 upstream rows fail with a request to narrow the area; they are not partially accepted. Each successful query is cached for 15 minutes. Refresh failure is labelled separately from each row's source age. Prices older than three days are stale.

`GET /api/prices` also accepts `lat`, `lon` and `radius` (km, maximum 500). A radius requires an origin. Only markets with sourced coordinates can enter a distance filter. Results are sorted by known straight-line distance, then report date and market name. They are never ranked as a best sale or net-return recommendation. The response reports truncation beyond 100 series.

Example comparison request (record IDs must come from `/api/prices`; all costs below are **caller inputs**, not fetched fees):

```json
{
  "query": { "state": "Maharashtra", "district": "Nashik", "commodity": "Wheat" },
  "origin": { "lat": 20.01, "lon": 73.79 },
  "quantity": 100,
  "unit": "kg",
  "costs": {
    "REPLACE_WITH_SOURCED_RECORD_ID": { "transport": 100, "handling": 0, "fees": null }
  }
}
```

Transport, handling and fees are total INR for this quantity/trip, keyed by price record ID. `null` or omitted means unknown; explicit zero means a known zero cost. The backend returns gross at the reported modal rate, entered total costs and a remainder only when all inputs exist. Other costs may apply. A mixed variety/grade/date/unit or stale list has `comparable=false`. Original reported values and units are retained. Only kg/quintal conversion is supported; no inferred grades or fees.

Comparison responses additionally include `marketState`, using the existing app's `commodity`, `grade`, `quantityQuintals` and `quotes[{id,name,pricePerQuintal,costs,quotedOn}]` field names. Source metadata, stale status and variety are retained. This adapter is null if quantity or a consistent sourced crop/variety/grade/unit is unavailable. It never fills unknown grades or costs. IDs remain actual source-record IDs; the app's TypeScript union of three demo-market IDs is unchanged and still needs client integration separately. Existing `rows`, `estimate`, `comparable`, endpoints and forecast rules remain available.

For OSM locations, first search the market name with district/state using `/api/places`, then have the caller confirm the matching mandi rather than a nearby town. A comparison can include:

```json
{
  "marketLocations": [{
    "state": "SOURCE_STATE", "district": "SOURCE_DISTRICT", "market": "SOURCE_MARKET",
    "lat": 20.01, "lon": 73.79,
    "sourceUrl": "https://www.openstreetmap.org/node/REPLACE_WITH_REAL_OSM_ID",
    "confirmed": true
  }]
}
```

Use real numeric OSM object IDs and coordinates from the returned match. This fragment must be combined with a query. Pins are labelled caller-confirmed, not independently verified, and are not persisted. A maintained operator directory may instead be placed in `.price-data/markets.json` as an array of `{state,district,market,lat,lon,sourceUrl,verifiedOn}` objects. Unknown locations remain unknown. No market coordinates ship in the backend.

## Historical data and collection

The daily feed is not a historical archive. A current snapshot does not establish enough history for forecasting.

```powershell
npm run sync -- --state Maharashtra --district Nashik --commodity Wheat
npm run import:history -- C:\path\to\verified-agmarknet-export.json
```

History import accepts a JSON records array or `{ "records": [...] }` from the same AGMARKNET schema: `state`, `district`, `market`, `commodity`, `variety`, `grade`, `arrival_date` (DD/MM/YYYY or ISO date), `min_price`, `max_price`, `modal_price`; optional `unit` must be `INR/quintal`. Prices must be positive and min ≤ modal ≤ max; future/invalid dates, unknown units and blank identity fields are rejected. Import is all-or-nothing and requires source verification. Do not relabel unrelated or synthetic data as AGMARKNET. Same-series/date revisions replace older records. Other series remain separate.

Run collection regularly using your deployment scheduler. On-demand lookups also retain history. Use one server process and stop it before CLI import/sync; the local atomic JSON store is a single-writer pilot store, not a multi-replica production database. Back up market data separately from opt-in private result histories in `.price-data/grain-history/`. Photos, account identities, costs and exact GPS are not stored. Town-search cache can be deleted. Prices and imported history persist until the operator removes them. Move to a transactional database before multi-process ingestion or large deployment.

## Crop photo to price workflow

This remains **backend only**; the mobile camera and screens are not connected. Configure server `OPENAI_API_KEY` and `CROP_VISION_MODEL` for a model supporting image input and strict Structured Outputs via the Responses API. No default model is silently chosen. Live recognition has not been verified without these credentials. The price-data credential is separate.

The initial photo suggestion scope is wheat, maize, paddy, soybean and onion. `crop-scope.json` maps identities to exact source commodity names; confirm these mappings against the connected price feed before expanding coverage. This scope is an experimental suggestion list, not an expert-validated crop classifier. The model's confidence labels are not calibrated probabilities. Farmer confirmation is mandatory before a forecast, including when the model reports high confidence.

Manual price lookup is independent of this five-crop recognition scope. `/api/crops` derives additional commodity names and stable crop identifiers from the current price catalog. It includes the source's other agricultural commodities as well as grains; catalog membership is not automatic grain-recognition coverage. `hasSourcedPrices` describes stored catalog coverage, not freshness or model validation. POST `/api/photo-prices` with `cropConfirmed:true`, `query.commodity` from that catalog and no `image` or `analysisToken` uses farmer-confirmed identity, needs no vision key and performs no image inference. Its existing price/variety/grade/market confirmations and forecast gate still apply. Manual identity tokens contain no photo digest and never claim image recognition.

First call:

```json
{
  "image": { "mimeType": "image/jpeg", "base64": "REPLACE_WITH_BASE64_IMAGE_BYTES" },
  "consentToVision": true,
  "query": { "state": "Maharashtra", "district": "Nashik" },
  "horizonDays": 7,
  "quantity": 100,
  "unit": "kg"
}
```

The `base64` field is raw base64, without a data-URL prefix. Accepts one JPEG, PNG or WebP photo, at most 5 MiB / 20 megapixels, at least 64 pixels per side. The server decodes and orients it, resizes to at most 1536 pixels per side, and strips EXIF/GPS and other metadata before sending it to OpenAI. Images are not written to disk or logged. The API request uses `store:false`; the external provider's applicable processing/retention terms still apply. Consent is required before each new image submission. No remote image URLs are accepted.

Recognition returns only crop identity, broad visible plant parts, image quality and alternatives. Its schema has **no price, variety or grade fields**. Extra or malformed fields, refusal, incomplete output or provider failure are rejected. Blurry, dark, mixed or low-confidence photos request a retake; unknown crops are unsupported. They do not automatically produce prices. A farmer can instead explicitly confirm a supported crop and use the existing manual price workflow.

A usable photo suggestion plus area returns current sourced price context, exact `seriesOptions`, `requiresConfirmation` and an expiring `analysisToken`. A proposed crop is labelled unconfirmed and no forecast range is released. Never represent these current reports as the photo's realized sale price. Quality premiums/discounts, crop moisture, safety, quantity and official grade cannot be established from the image.

Follow up using the returned token, no image upload or second recognition call required:

```json
{
  "analysisToken": "REPLACE_WITH_RETURNED_TOKEN",
  "query": {
    "state": "SOURCE_STATE", "district": "SOURCE_DISTRICT", "market": "SOURCE_MARKET",
    "commodity": "SOURCE_COMMODITY", "variety": "SOURCE_VARIETY", "grade": "SOURCE_GRADE"
  },
  "cropConfirmed": true,
  "varietyConfirmed": true,
  "gradeConfirmed": true,
  "horizonDays": 7
}
```

Use the exact values in a matching sourced series. Variety and grade must come from farmer records/appropriate grading, not from a photo or a default `FAQ` assignment. A confirmed correction may override the visual suggestion; the response flags disagreement and labels the identity as farmer-confirmed. Confirmation alone **never bypasses** coverage, baseline, calibration or approved-policy checks. The endpoint calls the same forecast engine and policies as `/api/forecast`. Unavailable forecasts include sourced history and reasons. When eligible, it returns a range, target date, interval uncertainty, coverage, update time and baseline comparison.

Signed tokens contain a photo digest and the observation, not image bytes; signatures prevent client-supplied fake observations. They expire 15 minutes after analysis and on server restart, and are never persisted. Sending a new photo and a token together is rejected. A changed crop mapping invalidates the old suggestion. The API's temporary request memory contains the uploaded photo; it is released after processing rather than stored as a farm record.

To locate the area, supply `origin:{"lat":...,"lon":...}` and `consentToLocationLookup:true` when state is missing. The server rounds coordinates to 2 decimals before reverse lookup, uses the OSM area as a suggestion and returns it for review. No background permission request or location lookup occurs. OSM/source administrative names can differ. Existing confirmed `marketLocations`, `radiusKm` and per-record `costs` work on this endpoint just as in `/api/compare`; unknown market coordinates/costs remain unknown. This endpoint limits concurrent photo requests to two and reports busy instead of building an unbounded queue.

Integration references: [OpenAI image inputs](https://developers.openai.com/api/docs/guides/images-vision?api-mode=responses), [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs), and [sharp metadata removal](https://sharp.pixelplumbing.com/api-output/).

## Forecast release gate

The model is fixed: log-linear regression over the most recent 28 observations, compared with the last observed modal-price baseline. This is an initial candidate, not a field-validated price model. No sell/hold instructions or guaranteed prices are returned.

Required per exact state/district/market/crop/variety/grade/unit series:

- At least 180 observations over 365 calendar days, reporting density at least 45%, no gap above 14 days, and latest report no older than 3 days.
- Calendar-day horizons of 7, 14 or 30. No interpolation; a back-test requires an exact future target-date report.
- Non-overlapping evaluation horizons, training only on preceding observations, and 20 completed earlier calibration windows for each interval. The 80% intervals use a finite-sample quantile of absolute log residuals.
- Twelve evaluated windows within the last year. Both all 12 and the latest 6 must beat the baseline by the approved improvement threshold. Observed interval coverage and current interval width must pass the policy.
- A non-expired, explicitly enabled policy for this exact series, horizon and model version, with named reviewer and approval date. No approved policies ship.

`forecast` returns `available=false`, reasons and sourced history until these checks pass. It returns coverage, metrics when calculable, horizon, generated time, model version and data digest. A returned range is for **last source date + horizon**, not request time + horizon. Monitoring re-runs at every request and automatically suspends eligibility if conditions fail. The model uses the current normalized historical vintage; revised historical records are not a historical-vintage study.

Place approved policies in `.price-data/policies.json` as an array. Obtain `seriesKey` with exported `keyOf(row)` from `prices.mjs`. It is JSON of `[state,district,market,commodity,variety,grade,unit]`. Policy fields:

```text
enabled, seriesKey, horizonDays, modelVersion="log-linear-28-v1",
approvedBy, approvedOn (ISO date), expiresOn (ISO date),
minImprovement, minCoverage, maxCoverage, maxRelativeWidth
```

No thresholds have been agreed for a real series. An approval must set positive error improvement, a calibration band within 70–95% containing 80%, and relative width at most 50%. These are protective bounds, not an approval or evidence of model usefulness. Tests use synthetic series strictly inside test files and do not enable any market.

## Sources and limits

- Prices: [AGMARKNET OGD resource](https://www.data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi), Department of Agriculture and Farmers Welfare, Government of India. Expected daily reporting; actual market/commodity coverage and access require operator verification. Attribution travels with every price row.
- Licence: [Government Open Data License – India](https://data.gov.in/Godl). Verify applicability to the selected export/resource before import.
- Places/maps: [OpenStreetMap](https://www.openstreetmap.org/copyright), © OpenStreetMap contributors, ODbL. [Nominatim usage policy](https://operations.osmfoundation.org/policies/nominatim/). No scraping or bulk geocoding is implemented.

Rate limiting is per socket IP (60 requests/minute); a reverse proxy must apply appropriate limits before public use. Errors do not expose API keys. No request/location logs are emitted. Forecast evaluation is CPU-bound and recalculated on request; load testing and a database-backed job queue are deployment work, not completed production certification.

## Verification

### Mandi-Ready Crop Grader

This implementation changes backend files only. No camera, navigation, screens, frontend state or app persistence is added. Crop identifiers are configurable rather than restricted to wheat and soybean: cereals, millets, pulses and other named grains can be documented manually. Automatic observations require a separately validated detector for each crop. Accepting a crop identifier does not establish detector coverage.

`POST /api/grain-screening` accepts `{crop,image:{mimeType,base64},referenceConfirmed:true,consentToUpload:true}`. Image preprocessing flags poor lighting/detail; these heuristics are not grain measurements. Without a validated specialized detector, counts stay null. OpenAI is not used for this endpoint. Set `GRAIN_DETECTOR_URL` (HTTPS or loopback), optional server-only `GRAIN_DETECTOR_TOKEN`, and `.price-data/grain-detector.json`:

```text
{ validated:true, modelVersion, validationUrl (HTTPS), expiresOn,
  retention:"none", minConfidence (0.8–1),
  crops:{ cropId:{ traits:["foreignMaterial","broken","discolored"], criteria? } } }
```

Detector request: `{crop,image:<metadata-stripped JPEG data URL>,modelVersion,retention:"none"}`. Response: `{crop,modelVersion,lighting,focus,referenceVisible,plainBackground,objects}`. Lighting/focus values are `adequate`, `poor` or `unknown`. Each object has unique `id`, `kind` (`grain` or `foreign_material`), normalized `[x,y,width,height]` `box`, confidence 0–1, and for grain objects `broken` and `discolored` booleans or null. These are observations of the photo, never moisture, weight percentages, official grades or prices. Low confidence withholds counts. No supported criterion ships. Optional criteria require `{crop,basis:"visible-object-count",version,sourceUrl,minGrains,maxFractions:{foreignMaterial,broken,discolored}}`; thresholds must come from the operator's reviewed source.

`POST /api/grain-screening/review` accepts `{crop,cropName?,reviewed:true,counts?:{grains,foreignMaterial,broken,discolored},moisture?:{percent,meter,measuredOn,calibrated:true}}`. Use a stable lowercase crop identifier (letters, digits, underscores or hyphens, 2–64 characters); `other` requires a crop name. Counts are non-negative whole numbers up to 100000; omitted/null counts remain unknown. Broken/discolored counts cannot exceed a known grain count. Moisture is optional, requires a farmer-confirmed calibrated meter and valid date, and stays null/`not_measured` otherwise. The returned record has farmer-reviewed provenance, no model summary or official grade, and `stored:false`. Arbitrary submitted model/grade/price claims are not accepted into it. This endpoint itself creates no stored record.

To link a review to prices, POST `/api/grain-screening/prices` with `{review:<reviewed record>,query:<source selection>,cropConfirmed:true,quantity?,unit?,costs?,origin?,consentToLocationLookup?,marketLocations?,radiusKm?,horizonDays?,varietyConfirmed?,gradeConfirmed?}`. Select a crop identifier and its matching `commodity` from `/api/crops`; a named `other` review permits an explicitly farmer-confirmed custom mapping. A known mismatched crop/commodity is rejected. The response retains the review and uses the same `reportedPrices`, cost calculations, approximate-location consent and forecast gate as the existing photo-price workflow. `qualityPriceAdjustment` stays null: defects never turn into a made-up premium, discount or grade. Exact variety/grade/market must be confirmed independently before a forecast is considered.

Optional result history uses the same atomic JSON persistence approach without changing mobile state. POST `/api/grain-history/session` with `{consentToStore:true}` returns a random private token once. Send `Authorization: Bearer <token>` for subsequent history requests. POST `/api/grain-history` with `{consentToStore:true,review:<reviewed record>}` revalidates all observations and stores only the reviewed counts, optional meter reading and timestamps. Images and arbitrary external claims are rejected or excluded. GET lists only that token's records. DELETE `/api/grain-history/:id` removes one owned record; DELETE `/api/grain-history` deletes its file and revokes the token. No account ID, shared global history or demo tool-history mutation is used. Keep the token private and keep HTTP on loopback or behind HTTPS. Records persist until deletion, including across server restarts; there is no automatic expiry claim or account-based token recovery. Each scope holds at most 100 records and rejects new saves when full. Concurrent operations are serialized within the single server process. Operators must respect deletions in backups separately; no backup service is implemented.

Image upload requires explicit consent on every screening request. A future client must explain that photos are processed transiently, forwarded only to the configured detector requiring no retention, and never saved by this backend. Image deletion is unnecessary here because no image storage exists; client-managed local copies/history need their own delete control when a UI is separately requested. The manifest is an operator assertion: verify the actual provider's retention behavior and crop-specific evaluation before connecting it.

Key-free historical prices: `npm run collect:public-prices` imports the [CC BY 4.0 KrashiMitra archive](https://github.com/kunal-rajput-317/mandi-data), pins its Git revision, records per-file hashes, validates all rows and partitions real reports by state/commodity. Set `PRICE_PROVIDER=local` to serve these reports without feed credentials. Source dates, attribution, missing grades and stale status remain visible. This source is a third-party archive of AGMARKNET reports, not an official current offer. Large data stays in ignored `.price-data/`; repeat the collector to reproduce it. No synthetic rates are generated and archive age never advances to today's date.

Candidate training datasets found: [soybean defect images, CC BY 4.0](https://data.mendeley.com/datasets/xnx9bfbh6b/1), [mechanically harvested soybean images](https://data.mendeley.com/datasets/hwdtghttp7/2), and [GrainDet](https://github.com/hellodfan/GrainDet). They do not establish all-grain, India/phone-domain detection performance; some contain cropped images, limited classes or licensing constraints. No model or expert-labelled Indian validation set was fabricated or declared validated. A deployed specialized detector with appropriate rights and crop-specific evaluation is still needed for automated counts.

```powershell
npm test
```

Checks cover normalization, revisions, missing prices, stale records, location provenance, distance, unit/cost calculations, provider failures/pagination, HTTP validation, OSM caching/privacy, sparse histories, exact series separation, approval/expiry, baseline failure, calibration rejection, horizon evidence, photo decoding/metadata removal, vision refusal/malformed results, consent, token tampering/expiry, unclear-photo abstention, and the HTTP photo-to-confirmed-forecast workflow. Model/network responses and prices in tests are synthetic and do not establish field accuracy. Live OSM search for Nashik succeeded during implementation. The government price feed and live crop recognition remain unverified without their credentials.

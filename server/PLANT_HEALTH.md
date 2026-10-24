# Plant health photo assessment

Home → **Check a plant photo** (or Tools → Crop photo) opens a real camera/gallery flow, not an illustrated fixture. Confirm the crop and Indian state, optionally describe symptoms, explicitly consent, then submit. Existing unrelated grain demo tools remain separate and labelled as demos.

## Server configuration

Add these to `server/.env.local`, never to a public Expo variable or source control:

```dotenv
OPENAI_API_KEY=your-server-side-key
PLANT_HEALTH_MODEL=your-image-input-and-structured-outputs-compatible-model
```

Use a model available to your OpenAI account; an unset plant model falls back to `CROP_VISION_MODEL`. Restart with `npm --prefix server start`. `GET /api/plant-health/capabilities` exposes configuration booleans, not secrets. The app already uses `EXPO_PUBLIC_FIELD_API_URL` for the reachable backend address. Expo Go development resolves localhost to the Expo LAN host; phone and computer must be able to reach that port.

`POST /api/plant-health` accepts `{image:{mimeType,base64},crop,state,symptoms?,consentToAnalysis:true}`. JPEG/PNG/WebP only, ≤5 MiB, ≥64 pixels per side, ≤20 megapixels. Decoding strips metadata and downsizes to 1536 px before sending to the OpenAI Responses API with strict Structured Outputs and `store:false`. This app does not persist images or assessments. `store:false` is not a promise of zero provider retention; review [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data). Photos and farmer text are treated as untrusted evidence, not instructions.

Results contain possible causes, visible symptoms, image suitability, uncalibrated confidence, questions and predefined low-risk next steps. Poor photos and low confidence withhold chemical options. Model text is not a confirmed diagnosis or a chemical prescription. No automatic public incident is created.

## Verified pesticide options

There is deliberately **no fabricated pesticide catalog**. Until a plant-protection expert reviews current Indian crop-specific product labels, the UI states that no verified pesticide match is available. Nonchemical inspection steps and general sourced precautions still work once OpenAI is configured.

An operator can provide `plant-protection-labels.json` in `PRICE_DATA_DIR` (default `server/.price-data` when started with the npm script), as an array of records with:

- `id`, `crop`, `condition`, `activeIngredient`, `formulation`: exact human-reviewed label identity.
- `states`: eligible Indian states (`["*"]` only if reviewed as applicable nationwide).
- `sourceUrl`: HTTPS official `ppqs.gov.in` product-label URL; not a shop link or AI citation.
- `approvedForIndia:true`, nonempty `reviewedBy`, ISO `reviewedAt` and `validUntil`.
- `precautions`: exact product-specific restrictions, including applicable pre-harvest/re-entry intervals, protective equipment and crop restrictions.

Review must be within 90 days, not in the future, and not expired. Only an exact crop/state match and the primary suspected condition match can show an option; clear image and non-low confidence are also required. These are options for discussion with an expert, never a dose calculated from a photo. Confirm diagnosis, current registration, regional restrictions and the full exact label before application. Bans and registration changes require catalog review immediately, not only at expiry. No ingredient in test files is a real treatment recommendation.

Safety basis: [Government of Meghalaya pesticide handling](https://megagriculture.gov.in/public/pesticide_handling_default.aspx) and [Ministry of Agriculture label-claim guidance](https://www.pib.gov.in/newsite/PrintRelease.aspx?lang=2&reg=48&relid=68389). These general sources do not establish registration of any individual product today.

## Deployment and verification limits

The new endpoint shares the existing backend's two-concurrent-photo limit and adds three plant-photo requests/minute/socket-IP. This is a local-development safeguard, not production authentication or a spending budget. Before public deployment, add authenticated access, trusted-proxy rate limits, request/body/time limits and provider budget monitoring. Never publish an unauthenticated paid API proxy.

Tests use synthetic photos and mocked model responses; they verify request/validation/consent/failure contracts, not diagnostic accuracy. A live OpenAI assessment requires an actual plant photo, configured credentials and field-expert evaluation.

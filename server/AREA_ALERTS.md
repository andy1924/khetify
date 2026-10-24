# Alerts and area updates

The Alerts navigation tab uses a saved field's **rounded center** (0.01°) to call `GET /api/area-alerts?lat=...&lon=...&radius=10`. No precise boundary is sent to the weather service. Choose a field on Home first. A radius of 1–50 km filters reviewed incidents; it does not imply a uniform weather forecast throughout that circle.

Open-Meteo supplies the current-hour model temperature and the next 24 hourly samples (temperature range, precipitation total and peak gust), plus seven days of daily history. Hourly values are estimates, not station observations. Warnings are emitted only at app thresholds: precipitation ≥10 mm/hour, gust ≥50 km/h, temperature ≥40°C or ≤2°C. Historical event thresholds use ≥20 mm/day for rain. These are transparent product rules, not official IMD warning categories or evidence of damage. A calm forecast still displays its real metrics; an empty warning list is not an all-clear. The screen links to official IMD updates.

Weather cache: server memory, rounded area keys, 10-minute TTL, ≤200 entries. `refresh=true` bypasses it. The actual source-fetch time is returned separately from the check time. Missing values remain null: partial samples show `weatherStatus:"partial"`, total source failure or missing current coverage shows `"unavailable"`. Neither state fabricates zero rain or a safe-area message. The approximate cache keys are transient, not persisted to disk.

## Nearby pest/disease/damage reports

These need a **real reviewed public incident feed**, which is not configured in this workspace. The UI clearly says so instead of promoting community demo posts or AI photo guesses to real warnings.

A trusted operator may populate `area-incidents.json` in `PRICE_DATA_DIR` (default `server/.price-data` under the npm start script). Supply an array of sourced records containing `id`, `title`, `detail`, `status:"reviewed"|"confirmed"`, `published:true`, `sharingConsent:true`, approximate `location:{latitude,longitude}`, ISO `occurredAt`, optional `expiresAt`, and `source:{name,url}` with an HTTPS evidence link. Review and consent must be genuine, never added just to make a warning show up. This file is an ingestion boundary, not an implemented expert moderation service.

Recent events include eligible reports from the last 30 days within the chosen radius. Current warnings also require an unexpired `expiresAt`. Withdrawn/private/unconsented, future, stale and distant records are excluded. Coordinates and private reviewer/owner fields are never returned. Removing or withdrawing a record takes effect on the next request; the incident file is not weather-cached. No push delivery or automatic public report creation is implemented.

Source: [Open-Meteo forecast API](https://open-meteo.com/en/docs), CC BY 4.0. Review usage/licensing, authentication and upstream capacity before production use.

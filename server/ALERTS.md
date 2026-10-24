# Area alerts

`GET /api/area-alerts?lat=20&lon=75&radius=10` returns independent `warnings` and `events` lists, plus `weatherStatus` and `incidentStatus`. The Alerts navigation tab uses a selected saved field, sends only its center rounded to two decimals, and supports incident radii of 5, 10, 25 or 50 km. The weather model describes the approximate area; the radius is not a weather search radius.

## Weather

The backend queries [Open-Meteo](https://open-meteo.com/en/docs) without credentials, with a 12-second timeout and a bounded ten-minute in-memory cache. Requests explicitly use Celsius, mm, km/h, UTC and Unix timestamps. No location is written to storage.

- Current advisories examine the next 24 hours: hourly precipitation >= 10 mm, gusts >= 50 km/h, temperature >= 40 °C or <= 2 °C.
- Recent modeled events examine the previous seven complete UTC days: daily precipitation >= 20 mm, maximum gusts >= 50 km/h, maximum temperature >= 40 °C or minimum temperature <= 2 °C.
- These are app thresholds and model estimates, not official IMD warnings, pest detections, verified damage reports or crop-specific recommendations. The app labels the source and basis on each card. No records are fabricated when the source fails.
- Open-Meteo attribution is displayed (CC BY 4.0). The public API is intended for non-commercial use; check the provider's terms and commercial plan before commercial deployment.

## Reviewed public incidents

The trusted backend administrator can populate `area-incidents.json` inside `PRICE_DATA_DIR` (defaults to `.price-data` relative to server startup). There is no anonymous publish/review endpoint. Missing data is reported as `unconfigured`, not an all-clear. The community demo feed is never used as live evidence.

Each record must have `id`, `title` (up to 200 characters), `detail` (up to 3000), `status` (`reviewed` or `confirmed`), `published: true`, `sharingConsent: true`, `location: { latitude, longitude }`, `occurredAt` (ISO timestamp), and `source: { name, url }` with an HTTPS URL. An optional future `expiresAt` also includes the record in current warnings. Expired records remain in history for up to 30 days. Future, unreviewed, withdrawn, private, stale and out-of-radius records are excluded. Coordinates, owner IDs and reviewer IDs are never returned to the client. Only add records you are authorized to publish; keep withdrawals and expiry current in this trusted feed.

## Expo Go connectivity

Use `npm --prefix server start` from the project root with `PRICE_API_HOST=0.0.0.0` in `server/.env.local`. On local native development runs, a localhost backend URL is rewritten to the Expo LAN host from `Constants.expoConfig.hostUri`, retaining the API port. Web and production URLs are unchanged. Metro tunnels do not forward the API: use a reachable HTTPS backend for tunnel mode. Restart Expo after changing public environment variables, then reload Expo Go. The phone and computer must be on a network that allows peer connections.

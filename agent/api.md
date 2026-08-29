# API and Connectors

## Upstash visitor counter

- `GET /api/visits` reads the public count; `POST /api/visits` increments once per de-duplicated visitor.
- `api/visits.mjs` derives a short-lived salted hash from IP + user agent but stores no raw address.
- Server variables: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and optional `VISITS_SALT`.

## Vercel Web Analytics

- `src/main.jsx` injects `@vercel/analytics` only in production with automatic history tracking disabled.
- `src/App.jsx` manually reports sanitized `/` and `/project/<slug>` page views so hash-routed project details appear separately.
- Enable it from the Vercel project dashboard; there is no analytics environment variable.
- Reports are anonymous aggregates, not raw IP addresses or personal identities.

## GitHub activity

- Runtime data comes from `https://github-contributions-api.jogruber.de/v4/MohamedFuad16?y=last` with committed and embedded fallbacks.

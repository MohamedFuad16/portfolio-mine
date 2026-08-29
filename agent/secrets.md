# Secrets

Pointers only; never put values in this file.

- `.env.local` (ignored): optional local values copied from `.env.example`.
- Vercel server-only variables: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, optional `VISITS_SALT`.
- Vercel Web Analytics uses dashboard activation and no environment variable.

Never prefix Upstash credentials with `VITE_`; Vite would expose them in the browser bundle.

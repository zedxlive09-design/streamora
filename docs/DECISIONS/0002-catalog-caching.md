# ADR-0002: Catalog data sourced from iptv-org public JSON with in-memory cache

- Status: Accepted
- Date: 2026-10-31
- Owners: Architect, Backend

## Context
The product is a customizable front-end over the iptv-org dataset. The dataset is published as static JSON at `https://iptv-org.github.io/api/{channels,streams,countries,categories,regions,languages,subdivisions}.json` and is roughly 10k channels + 30k streams (~10MB total). Fetching on every request would be slow and abusive.

## Decision
- Fetch all 7 JSON files server-side at cold start into an in-memory cache.
- TTL = 24h; serve stale on fetch failure (stale-while-revalidate).
- Index channels by id, name (lowercased), country, categories for fast filter/search.
- Pagination + filtering operate on the cached index, never on raw JSON.
- Public API responses include `Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800`.

## Alternatives considered
1. **Mirror JSON to Turso tables on a cron** — more durable, but requires schema sync with upstream and adds DB load. Rejected for this scale.
2. **Fetch per-request with HTTP cache** — simpler but slower and harder to debug. Rejected.
3. **Vercel KV / Upstash Redis cache** — would add a paid service at scale. Rejected; in-memory cache is sufficient for single-instance Vercel.

## Consequences
### Positive
- Zero DB load for catalog reads.
- Fast filter/search.
- Stale fallback resilient to iptv-org outages.

### Negative / trade-offs
- First cold request after cache expiry pays full fetch cost (~3-5s) — mitigated by background revalidation.
- Multi-instance Vercel deployments each keep their own cache — acceptable for free tier.

## Validation
- `tests/unit/catalog.test.ts` asserts cache hit returns within 50ms after first fetch.
- Fetcher unit test simulates iptv-org 500 response and asserts stale data returned.

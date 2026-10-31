# Streamora — Requirements

Source of truth: `docs/PROJECT_BRIEF.md`. This document expands brief into engineering-testable requirements.

## Functional requirements

### FR-1 Catalog browsing
- **FR-1.1** System fetches the iptv-org dataset (channels, streams, countries, categories, regions, languages, subdivisions) from `https://iptv-org.github.io/api/*.json` server-side.
- **FR-1.2** System caches the dataset in memory with TTL = 24h and serves stale on fetch failure.
- **FR-1.3** Home page lists channels with pagination (≥50 per page) and supports filtering by country, category, language, and NSFW toggle (default off).
- **FR-1.4** Search by channel name (case-insensitive substring) returns matches within 200ms p95 from cache.
- **FR-1.5** Channel detail view shows metadata (name, country, categories, network, website, logo when available) and playable streams.

### FR-2 Stream playback
- **FR-2.1** Watch page renders an HTML5 `<video>` element.
- **FR-2.2** For HLS streams (`.m3u8`), use `hls.js` on browsers without native HLS (Chrome/Firefox); use native on Safari/iOS.
- **FR-2.3** For direct streams (`.mp4`, etc.), use native `<video src>`.
- **FR-2.4** Player exposes play/pause, mute, fullscreen, and a clear error state on playback failure with retry.
- **FR-2.5** Stream labels from iptv-org (e.g., "geo-blocked") surfaced as warnings above the player.

### FR-3 Authentication
- **FR-3.1** Sign-up with email + password (min 8 chars, max 72 chars per bcrypt limit).
- **FR-3.2** Sign-in with email + password; session cookie httpOnly, secure in production, sameSite=lax.
- **FR-3.3** Sign-out clears session.
- **FR-3.4** First registered user is promoted to `SUPERADMIN`. Subsequent users default to `USER`.
- **FR-3.5** Unauthenticated users can browse and watch; auth required only for personalization and admin.

### FR-4 User customization
- **FR-4.1** Authenticated user can favorite/unfavorite any channel; favorites list visible at `/dashboard/favorites`.
- **FR-4.2** Watch history auto-records (channelId, streamUrl, watchedAt) on player start, capped at last 100 entries per user.
- **FR-4.3** Authenticated user can attach free-form custom metadata to any channel: a list of `{key: string, value: string}` pairs, max 20 fields per channel per user.
- **FR-4.4** Custom metadata is private to the owning user; not visible to others.
- **FR-4.5** Profile page lets user update display name and default country filter; theme preference persisted.

### FR-5 Admin panel
- **FR-5.1** `/admin/*` routes are server-side guarded: only `ADMIN` and `SUPERADMIN` roles may access.
- **FR-5.2** `/admin/ads` CRUD for ad slots: fields `name`, `position` (home-top, home-sidebar, watch-pre, watch-mid, browse-top), `type` (text, image, html), `content`, `frequency` (every-load, once-per-session, every-N-minutes), `isActive`, `metadata` JSON.
- **FR-5.3** `/admin/users` lists users (paginated), allows role change between `USER` and `ADMIN`; superadmin-only can promote/demote admins. Cannot self-demote.
- **FR-5.4** `/admin/settings` site-wide key/value store (e.g., `brandName`, `defaultCountry`, `footer Attribution`).
- **FR-5.5** Every admin mutation (ad CRUD, role change, settings change) writes to `AuditLog` with userId, action, target, metadata, timestamp.

### FR-6 Ad rendering
- **FR-6.1** Public pages (home, browse, watch) query active ad slots for their position and render them according to frequency rules.
- **FR-6.2** Image ads render as `<img>` with alt text from metadata; HTML ads render in a sandboxed iframe (`sandbox=""`); text ads render in a styled `<div>`.
- **FR-6.3** Ads include a small "Ad" label for transparency (per FTC-style disclosure best practice).

## Non-functional requirements

### NFR-1 Performance
- Home page LCP < 2.5s on Vercel free tier (cold start acceptable).
- Channel search response < 200ms p95 from server cache.
- Player start < 3s for HLS streams.

### NFR-2 Security
- Passwords hashed bcrypt ≥12 rounds.
- All admin endpoints server-side authorized via session role check.
- All user-data writes server-side authorized via ownership check.
- `.env*` gitignored; no secrets in client bundles (NextAuth secret, Turso token).
- Security headers: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- HTML ad content sandboxed in iframe with no permissions.

### NFR-3 Accessibility
- All interactive elements keyboard-reachable with visible focus.
- All images have alt text (channel logos use channel name).
- Color contrast meets WCAG 2.1 AA in both light and dark themes.
- Player has accessible controls (aria-labels).

### NFR-4 Maintainability
- TypeScript strict mode.
- Lint passes (`bun run lint`).
- Modular components ≤200 LOC; reuse shadcn/ui primitives.
- API routes ≤150 LOC; business logic in `src/lib/services/`.

### NFR-5 Testability
- Unit tests for services (catalog cache, ad rendering logic, auth helpers).
- API contract tests for admin endpoints (auth + happy + 404).
- E2E test for sign-up → favorite → admin ad creation flow.
- Tests run in CI on every push.

## Traceability

| Requirement | Implementation module | Test |
|---|---|---|
| FR-1 | `src/lib/catalog/`, `src/app/page.tsx`, `src/app/browse/page.tsx` | `tests/unit/catalog.test.ts`, `tests/e2e/browse.spec.ts` |
| FR-2 | `src/components/player/`, `src/app/watch/[channelId]/page.tsx` | `tests/e2e/watch.spec.ts` |
| FR-3 | `src/lib/auth/`, `src/app/api/auth/`, `src/app/(auth)/` | `tests/unit/auth.test.ts`, `tests/e2e/auth.spec.ts` |
| FR-4 | `src/lib/services/user-data.ts`, `src/app/dashboard/` | `tests/unit/user-data.test.ts`, `tests/e2e/customize.spec.ts` |
| FR-5 | `src/app/admin/`, `src/lib/services/admin.ts` | `tests/unit/admin.test.ts`, `tests/e2e/admin.spec.ts` |
| FR-6 | `src/components/ads/`, `src/lib/services/ads.ts` | `tests/unit/ads.test.ts` |

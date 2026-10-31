# ADR-0003: Security baseline

- Status: Accepted
- Date: 2026-10-31
- Owners: Database & Security, Architect

## Context
Streamora accepts user input (sign-up, custom metadata, ad HTML), renders admin-supplied ad content to anonymous users, and stores credentials. We need an explicit baseline covering authn, authz, secrets, input validation, and HTML ad sandboxing.

## Decision

### Authentication
- Email + password via NextAuth Credentials provider.
- bcrypt ≥12 rounds for password hashing.
- JWT session cookies: `httpOnly`, `secure` in production, `sameSite: 'lax'`.

### Authorization (server-side, deny-by-default)
- `requireUser(req)` throws 401 if no session.
- `requireAdmin(req)` throws 403 if `role` not in `['ADMIN','SUPERADMIN']`.
- `requireOwnership(req, ownerId)` for user-scoped resources; never trust client-supplied userId.
- First registered user → `SUPERADMIN`; subsequent → `USER`. Promotion/demotion via admin panel only; no self-demotion.

### Secrets
- `.env*` in `.gitignore` (enforced).
- Production secrets (`NEXTAUTH_SECRET`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`) in Vercel project env vars, never committed.
- No secrets in client bundles. `NEXTAUTH_SECRET` only used server-side.

### Input validation
- All request bodies validated with Zod schemas at API boundary.
- All path params type-checked.
- Custom metadata: max 20 fields per channel per user, keys ≤50 chars, values ≤500 chars.

### HTML ad sandboxing
- Admin-created HTML ads rendered in `<iframe sandbox="">` (no `allow-scripts`, no `allow-forms`, no `allow-same-origin`).
- Image ads: `<img>` with required `alt` from metadata; URLs validated as `https://` or `http://` (no `javascript:`).
- "Ad" label visible per slot (disclosure best practice).

### HTTP security headers (via `next.config.ts`)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (production only)

### Logging
- Never log passwords, tokens, session cookies, email addresses (PII).
- Server errors logged with request path + correlation ID only.

### Rate limiting (free tier)
- Sign-up / sign-in: simple in-memory counter, 10 attempts per IP per 10 minutes. Adequate for free-tier single instance; document upgrade path to Upstash Ratelimit if abuse occurs.

## Alternatives considered
1. **Auth.js v5 with WebAuthn/passkeys** — better UX, more secure, but added complexity and device-binding not desired for community site. Deferred.
2. **Server-side session store in Turso** — would enable revocation but adds DB write per request. Rejected for free-tier scale.
3. **Cloudflare Turnstile / hCaptcha on sign-up** — would reduce bot signups but requires a third-party account. Documented as future enhancement.

## Consequences
### Positive
- Simple, well-understood security posture.
- No third-party services required.
- HTML ad sandboxing prevents admin-supplied XSS even if admin account is compromised.

### Negative / trade-offs
- JWT sessions cannot be revoked without denylist — documented as known limitation.
- In-memory rate limit resets on cold start — acceptable for free tier.

## Validation
- Unit tests assert 401/403 for unauthenticated/unauthorized access to `/api/admin/*` and `/api/user/*`.
- Unit test for HTML ad sandboxing asserts iframe has `sandbox=""` attribute.
- E2E test asserts anonymous user cannot reach `/admin/ads` (redirects to /login).
- `tests/unit/security.test.ts` checks Zod validation rejects oversized metadata, non-https image URLs, and `javascript:` URLs.

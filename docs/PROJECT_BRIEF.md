# Project Brief — Streamora

## Product
- **Name:** Streamora
- **One-sentence description:** A free, customizable IPTV streaming platform powered by the iptv-org catalog with admin-configurable ads and per-user metadata customization.
- **Problem being solved:** Discovering and watching free publicly-listed IPTV channels is fragmented (raw m3u files, no UI, no personalization). Streamora wraps the iptv-org dataset with a polished, searchable, personalizable web app and a built-in ad system operators can manage without code.
- **Target users:**
  1. End users — anyone who wants free TV channels in a browser, with favorites, history, and personal metadata.
  2. Operators/admins — people running their own Streamora instance who want to configure ad slots, manage users, and adjust the site without redeploying.
- **Platforms/browsers:** Modern evergreen browsers (Chrome, Firefox, Safari, Edge) on desktop, tablet, and mobile. Safari/iOS HLS handled natively; other browsers via hls.js.

## Goals and scope

### Must-have
- [x] Browse the iptv-org catalog: channels, categories, countries, languages, regions.
- [x] Search and filter channels by name, country, category, language, NSFW toggle.
- [x] Watch a channel in an in-browser HLS / direct-stream player.
- [x] User accounts (sign up, sign in, sign out) with email + password.
- [x] Per-user customization: favorites, watch history, and a free-form custom-metadata form (key/value pairs) per channel.
- [x] Admin panel: manage ad slots (create, edit, enable/disable, delete) with rich metadata.
- [x] Ad rendering on designated pages with admin-configured position, frequency, and content.
- [x] Admin panel: list users, change roles, view site settings.
- [x] Site settings store (key/value) for operator-configurable globals (brand name, default country, etc.).
- [x] Mobile-first responsive UI with light/dark theme.
- [x] Audit log for admin actions (ad changes, role changes, settings changes).
- [x] Vercel + Turso deployment artifacts (no production deploy without approval).

### Should-have
- [ ] Pagination/virtualization for large channel lists (iptv-org has ~10k+ channels).
- [ ] Server-side caching of the iptv-org dataset (refresh daily, fall back to stale).
- [ ] User-uploaded avatar (stored locally or via Vercel Blob when available).
- [ ] Per-user custom metadata schema builder (define your own fields).

### Out of scope (this release)
- [ ] Paid subscriptions, billing, or Stripe integration.
- [ ] DRM-protected streams.
- [ ] Mobile native apps (iOS/Android) — web only.
- [ ] Multi-tenant white-label deployments.
- [ ] Real-time chat / live comments.
- [ ] Video on demand (VOD) — live IPTV streams only.
- [ ] EPG (electronic program guide) — out of iptv-org scope.

## Users, roles, and permissions

| Role | Allowed actions | Restricted actions |
|---|---|---|
| Anonymous | Browse catalog, search, watch public streams, sign up / sign in | Cannot favorite, cannot keep history, cannot customize metadata, cannot access admin or dashboard |
| User | Everything anonymous can do, plus: favorite channels, watch history, per-channel custom metadata, profile customization (display name, theme preference, default country) | Cannot access admin panel, cannot manage ads, cannot change other users' data |
| Admin | Everything User can do, plus: manage ad slots, manage ad placements, manage users (change roles, disable), edit site settings, view audit log | Cannot deploy to production, cannot rotate secrets, cannot delete all data |
| Superadmin (first admin) | Everything Admin can do, plus: bootstrap additional admins | Same restrictions as Admin |

## Core user journeys
1. **Anonymous discovery → signup:** Land on home → browse by category/country → search a channel → click play → prompted to sign up to save favorites → sign up → channel is favorited automatically.
2. **Returning user customization:** Sign in → open a channel → open "Customize" panel → add custom metadata fields (e.g., "My rating", "Notes", "Preferred quality") → save → fields persist and reappear next visit.
3. **Admin configures an ad:** Sign in as admin → /admin/ads → create new ad slot (name, position, type, HTML/image/text content, frequency, active toggle) → save → ad appears on the configured page for all users → admin edits the same ad → change is reflected on next page load.
4. **Admin changes a user's role:** /admin/users → find user → change role from User to Admin → action recorded in audit log.

## Data and integrations
- **Main entities/data:**
  - Users, UserProfiles, UserFavorites, UserWatchHistory, UserChannelMetadata (free-form per-channel metadata).
  - AdSlots, AdPlacements (slot + page + frequency).
  - SiteSettings (key/value).
  - AuditLogs.
- **External APIs/services:**
  - iptv-org dataset (https://iptv-org.github.io/api/{channels,streams,countries,categories,regions,languages,subdivisions}.json) — fetched server-side, cached in memory/edge with daily refresh and stale fallback.
- **File uploads/storage:** None in this release (avatars deferred).
- **Notifications/email/SMS:** None in this release (password reset deferred — see Risks).
- **Reporting/analytics:** Audit log only; no third-party analytics.

## Non-functional requirements
- **Expected usage/scale:** Single-instance community deployment. Up to ~1k users, ~50 concurrent viewers. iptv-org catalog (~10k channels, ~30k streams) cached server-side.
- **Performance expectations:** First Contentful Paint < 2s on Vercel; channel list query < 200ms p95 from cache; player start < 3s.
- **Availability/recovery:** Vercel handles platform availability; Turso free tier provides daily backups; database is reproducible from Prisma migrations + iptv-org public dataset. No 99.9% SLA target for free tier.
- **Security/privacy/compliance:**
  - Passwords hashed with bcrypt (≥12 rounds).
  - Session cookies httpOnly, secure in production, sameSite=lax.
  - All admin actions server-side authorized; UI hiding is not authorization.
  - No PII collected beyond email + display name.
  - Audit log for admin actions.
  - CSP and security headers via `next.config.ts`.
- **Accessibility/localization:** WCAG 2.1 AA target for key flows (browse, watch, sign in, admin ad editor). English-only UI in this release; strings externalized for future i18n via `next-intl`.
- **Hosting/deployment constraints:** Vercel free tier (Next.js native), Turso free tier (libSQL). No paid services.
- **Budget/cost constraints:** $0 — free tiers only.

## Existing environment
- **Existing repository/code:** Fresh Next.js 16 + TypeScript + Tailwind 4 + shadcn/ui + Prisma + NextAuth + Zustand + TanStack Query scaffold provided by the fullstack-dev skill.
- **Preferred or prohibited technologies:**
  - Required: Next.js 16 App Router, TypeScript, Prisma, Turso (libSQL), Vercel.
  - Prohibited: paid services, external CDNs beyond Vercel's, any vendor lock-in.
- **Existing accounts/services:** None provided. User must supply Turso credentials, GitHub repo (we will create), and Vercel project.
- **Required integrations:** iptv-org public dataset.

## Acceptance criteria
- [ ] Anonymous user can browse, search, filter channels and play a stream in-browser.
- [ ] User can sign up, sign in, sign out; sessions persist across reloads.
- [ ] User can favorite/unfavorite channels; favorites list persists.
- [ ] User can add/edit/remove custom metadata fields per channel; data persists per user.
- [ ] Admin can CRUD ad slots via /admin/ads; changes appear on the designated pages.
- [ ] Admin can list users and change roles; actions appear in audit log.
- [ ] Admin can edit site settings (brand name, default country).
- [ ] Lint, typecheck, and unit tests pass.
- [ ] Production build succeeds locally (`bun run build`).
- [ ] No secrets in source control; `.env*` ignored.
- [ ] README + FINAL_HANDOFF.md explain setup, deploy, and risks.

## Open questions / assumptions
- **Assumption:** iptv-org dataset license (CC0 / public domain) permits reuse in a streaming aggregator. Will document attribution in footer.
- **Assumption:** Password reset can be deferred — admins reset passwords via DB in this release. Will document in risks.
- **Assumption:** First registered user is promoted to Superadmin automatically (bootstrap convention).
- **Open:** Email service for password reset — deferred; if required, recommend Resend free tier in a follow-up.
- **Open:** Image ad hosting — admin pastes image URL in this release; no upload.

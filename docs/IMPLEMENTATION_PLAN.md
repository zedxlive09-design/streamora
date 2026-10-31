# Streamora — Implementation Plan

Sequenced tasks with acceptance criteria and ownership. Phases map to the AGENTS.md workflow.

## Phase 0 — Intake & recon (DONE)
- [x] Read AGENTS.md and templates.
- [x] Read fullstack-dev skill.
- [x] Verify Next.js 16 + Prisma + NextAuth scaffold is initialized.
- [x] Write `docs/PROJECT_BRIEF.md`, `docs/REQUIREMENTS.md`, `docs/ARCHITECTURE.md`.

## Phase 1 — Architecture (DONE in this commit)
- [x] Select stack and document rationale (see ARCHITECTURE.md §2).
- [x] Define data model (Prisma schema — Phase 2 deliverable).
- [x] Define API contracts (`docs/contracts/`).
- [x] ADRs in `docs/DECISIONS/`.

## Phase 2 — Contracts & foundations (Database & Security + Backend)

### Task 2.1 — Prisma schema for Turso
**Owner:** Database & Security
**Files:** `prisma/schema.prisma`, `prisma/seed.ts`
**Acceptance:**
- Models: User, UserProfile, UserFavorite, UserWatchHistory, UserChannelMetadata, AdSlot, AdPlacement, SiteSetting, AuditLog.
- Enums: Role (USER, ADMIN, SUPERADMIN), AdPosition, AdType, AdFrequency.
- Indexes on foreign keys, uniqueness constraints.
- `bun run db:push` succeeds against local SQLite file.
- Seed script creates first superadmin + sample ad slots + default settings.

### Task 2.2 — libSQL adapter for Turso
**Owner:** Database & Security
**Files:** `src/lib/db.ts` (modify), `package.json` (add `@prisma/adapter-libsql`, `@libsql/client`)
**Acceptance:**
- Prisma client uses libSQL adapter when `TURSO_DATABASE_URL` is set.
- Falls back to local SQLite when only `DATABASE_URL` is set (dev).
- No connection leaks (singleton pattern preserved).

### Task 2.3 — API contracts
**Owner:** Backend
**Files:** `docs/contracts/catalog.md`, `docs/contracts/user.md`, `docs/contracts/admin.md`, `docs/contracts/auth.md`
**Acceptance:** Each endpoint documented per `templates/API_CONTRACT.md`.

### Task 2.4 — Auth foundation
**Owner:** Backend
**Files:** `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `prisma/schema.prisma`
**Acceptance:**
- NextAuth Credentials provider signs in user by email + bcrypt password.
- JWT session includes `role`.
- `requireUser`, `requireAdmin`, `requireOwnership` helpers exported.

## Phase 3 — Parallel implementation

### Task 3.1 — Catalog layer (Backend)
**Owner:** Backend
**Files:** `src/lib/catalog/types.ts`, `src/lib/catalog/fetcher.ts`, `src/lib/catalog/search.ts`, `src/app/api/catalog/*/route.ts`
**Acceptance:**
- Fetcher fetches all 7 iptv-org JSON files, parses with zod, caches in-memory 24h.
- Search supports name/country/category/language filter, pagination.
- API routes: `/api/catalog/channels`, `/api/catalog/channels/[id]`, `/api/catalog/countries`, `/api/catalog/categories`, `/api/catalog/languages`, `/api/catalog/search`.
- Cache-Control headers set.

### Task 3.2 — Public pages (Frontend)
**Owner:** Frontend
**Files:** `src/app/page.tsx`, `src/app/browse/page.tsx`, `src/app/watch/[channelId]/page.tsx`, `src/components/catalog/*`, `src/components/player/*`
**Acceptance:**
- Home shows channel grid (paginated), filter bar, search bar.
- Browse shows filters in a sidebar.
- Watch page renders VideoPlayer with HLS fallback.
- Loading/empty/error states for all data-driven sections.
- Mobile responsive; light/dark theme.

### Task 3.3 — Auth pages (Frontend + Backend)
**Owner:** Frontend + Backend
**Files:** `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`, `src/app/api/auth/signup/route.ts`
**Acceptance:**
- Sign-up validates email + password (zod), creates user, hashes password, signs in.
- First user → SUPERADMIN; subsequent → USER.
- Sign-in shows error on bad credentials.

### Task 3.4 — User dashboard (Frontend + Backend)
**Owner:** Frontend + Backend
**Files:** `src/app/dashboard/*`, `src/lib/services/user-data.ts`, `src/app/api/user/*`
**Acceptance:**
- Profile page edits display name, default country, theme.
- Favorites list with remove buttons.
- Watch history (last 100, newest first).
- Per-channel metadata editor (add/edit/remove key-value pairs).

### Task 3.5 — Admin panel (Frontend + Backend)
**Owner:** Frontend + Backend
**Files:** `src/app/admin/*`, `src/lib/services/admin.ts`, `src/app/api/admin/*`
**Acceptance:**
- /admin/ads: list, new, edit, delete, activate/deactivate.
- /admin/users: list, role change (cannot self-demote).
- /admin/settings: key/value editor.
- /admin (audit log): paginated table of admin actions.
- All mutations audit-logged.

### Task 3.6 — Ad rendering (Frontend + Backend)
**Owner:** Frontend + Backend
**Files:** `src/components/ads/AdSlotRenderer.tsx`, `src/lib/services/ads.ts`, `src/app/api/ads/route.ts`
**Acceptance:**
- Resolver returns active ad slots for given page position.
- Renderer supports text, image (with alt), HTML (sandboxed iframe).
- Frequency rules: every-load, once-per-session (cookie/localStorage), every-N-minutes.
- "Ad" label visible.

## Phase 4 — Integration & code review
- [ ] Lint passes: `bun run lint`.
- [ ] Typecheck passes: `bunx tsc --noEmit`.
- [ ] Build passes: `bun run build`.
- [ ] Review for security, accessibility, performance per AGENTS.md.

## Phase 5 — QA & DevOps
- [ ] Vitest unit tests for catalog, ads, auth, user-data, admin.
- [ ] Playwright E2E for: signup → favorite → admin ad flow.
- [ ] GitHub Actions workflow `.github/workflows/ci.yml`.
- [ ] Vercel config + Turso setup runbook.

## Phase 6 — Autonomous repair loop
- Run failing tests → fix root cause → re-run. Up to 3 attempts per root cause.

## Phase 7 — Documentation & handoff
- [ ] README with setup, env vars, deploy steps.
- [ ] `docs/FINAL_HANDOFF.md` with implementation summary, commands run, test outcomes, risks.
- [ ] `docs/operations.md` runbook.

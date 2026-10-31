# Streamora

> Free, customizable IPTV streaming platform powered by the [iptv-org](https://github.com/iptv-org/api) catalog. Admin-configurable ads, per-user custom metadata, free-tier deployment on Vercel + Turso.

## Features

- **Browse 10,000+ live TV channels** from the iptv-org public dataset.
- **Filter by country, category, language** + search by name and alt names.
- **Watch in-browser** — HLS via hls.js on Chrome/Firefox, native on Safari/iOS.
- **Personalize**: favorites, watch history, and per-channel custom metadata (free-form key/value fields).
- **Admin panel**: CRUD ad slots (text/image/html), manage users + roles, edit site settings, view audit log.
- **Ad system**: admin-configurable position, frequency, content; HTML ads sandboxed in `<iframe sandbox="">`.
- **Light/dark theme**, mobile-first responsive, accessible (WCAG 2.1 AA target).
- **$0 cost**: Vercel free tier + Turso free tier.

## Tech stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 |
| Language | TypeScript 5 (strict) |
| Styling | Tailwind CSS 4 + shadcn/ui (New York) + Lucide |
| State | Zustand (client) + TanStack Query (server) |
| Forms | react-hook-form + Zod |
| Database | Turso (libSQL) via Prisma 6 + `@prisma/adapter-libsql` |
| Auth | NextAuth.js v4 (Credentials, JWT sessions, role callback) |
| Video | hls.js + native `<video>` |
| Tests | Vitest (unit) + Playwright (E2E) |
| CI | GitHub Actions |
| Hosting | Vercel + Turso (free tiers) |

## Repository layout

```
.
├── docs/                       # Architecture, requirements, ADRs, contracts, handoff
│   ├── PROJECT_BRIEF.md
│   ├── REQUIREMENTS.md
│   ├── ARCHITECTURE.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── FINAL_HANDOFF.md
│   ├── operations.md
│   ├── contracts/              # API contract docs (catalog, user, admin)
│   └── DECISIONS/              # ADRs
├── prisma/                     # schema.prisma + seed.ts
├── src/
│   ├── app/                    # Routes (public, auth, dashboard, admin, api)
│   ├── components/             # ui/ (shadcn), catalog/, player/, ads/, admin/, layout/
│   ├── hooks/
│   ├── lib/                    # db.ts, auth.ts, catalog/, services/
│   └── types/
├── tests/
│   ├── unit/                   # Vitest
│   └── e2e/                    # Playwright
├── .github/workflows/ci.yml
├── .env.example
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
└── next.config.ts
```

## Quick start (local dev)

### Prerequisites
- Bun ≥ 1.3 (or npm/pnpm — Bun preferred)
- A terminal with internet access (for iptv-org dataset fetch)

### Steps

```bash
# 1. Install deps
bun install

# 2. Copy env template
cp .env.example .env
# Edit .env: set NEXTAUTH_SECRET to `openssl rand -base64 32` output.
# Leave DATABASE_URL as the local SQLite default for dev.

# 3. Generate Prisma client + push schema to local SQLite
bun run db:generate
bun run db:push

# 4. Seed demo data (superadmin user + welcome ad + default settings)
bun run db:seed
# → demo@streamora.local / streamora-demo-123  (first user → SUPERADMIN)

# 5. Start dev server
bun run dev
# → http://localhost:3000
```

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes (dev) | SQLite file path. Dev: `file:./db/streamora.db`. |
| `TURSO_DATABASE_URL` | yes (prod) | Turso database URL `libsql://...`. If set + `TURSO_AUTH_TOKEN` set, libSQL adapter is used. |
| `TURSO_AUTH_TOKEN` | yes (prod) | Turso access token from `turso db tokens create <db>`. |
| `NEXTAUTH_SECRET` | yes | `openssl rand -base64 32`. JWT signing secret. |
| `NEXTAUTH_URL` | prod only | Canonical production URL (e.g. `https://your-project.vercel.app`). |
| `CATALOG_BASE_URL` | optional | Override iptv-org base URL (default `https://iptv-org.github.io/api`). |
| `CATALOG_TTL_MS` | optional | In-memory cache TTL in ms (default `86400000` = 24h). |

`.env*` is gitignored — never commit secrets.

## Common commands

```bash
bun run dev           # Start dev server (port 3000)
bun run lint          # ESLint
bun run typecheck     # tsc --noEmit
bun run test          # Vitest unit tests (56 tests)
bun run test:watch    # Vitest watch mode
bun run test:e2e      # Playwright E2E (requires dev server + iptv-org access)
bun run db:push       # Push Prisma schema to current DATABASE_URL
bun run db:generate   # Regenerate Prisma client after schema change
bun run db:seed       # Seed demo superadmin + welcome banner ad + default settings
bun run build         # Production build (standalone output)
```

## First-user bootstrap

The **first user to sign up after a fresh deploy is automatically promoted to SUPERADMIN** (transactional check). Sign up immediately after deploy to claim the role. See [`docs/DECISIONS/0004-bootstrap-admin.md`](docs/DECISIONS/0004-bootstrap-admin.md).

Subsequent sign-ups default to `USER`. Promote to `ADMIN` via `/admin/users` (superadmin-only).

## Deployment (Vercel + Turso) — summary

> Full runbook: [`docs/operations.md`](docs/operations.md).
> **Do not deploy to production without explicit approval** (per AGENTS.md).

1. **Turso**: `turso db create streamora` → `turso db tokens create streamora` → set `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` in Vercel.
2. **Vercel**: import GitHub repo → framework preset "Next.js" → set env vars → deploy.
3. **Post-deploy**: visit `/signup` and create the first user (becomes SUPERADMIN).

## Security highlights

- bcrypt password hashing (≥12 rounds).
- JWT session cookies: `httpOnly`, `secure` (prod), `sameSite: 'lax'`.
- Server-side authorization on every `/api/admin/*` and `/api/user/*` mutation.
- HTML ad content rendered in `<iframe sandbox="">` (no scripts, no forms, no same-origin).
- Security headers via `next.config.ts`: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, HSTS.
- `.env*` gitignored; no secrets in client bundles.

See [`docs/DECISIONS/0003-security-baseline.md`](docs/DECISIONS/0003-security-baseline.md).

## Attribution

Channel data is sourced from the [iptv-org/api](https://github.com/iptv-org/api) dataset (CC0 / public domain). Streamora is an independent aggregator and is not affiliated with iptv-org.

## License

Source code: MIT (see `LICENSE`). Channel data: CC0 (iptv-org).

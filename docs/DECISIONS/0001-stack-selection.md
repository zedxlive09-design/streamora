# ADR-0001: Use Next.js 16 App Router + Prisma + Turso + Vercel

- Status: Accepted
- Date: 2026-10-31
- Owners: Architect

## Context
Streamora requires a free, scalable, easy-to-deploy web stack that supports server-side rendering (for SEO + fast first paint of channel catalogs), a relational database for users/ads/settings, and a hosting target with $0 cost. The user explicitly named Vercel + Turso and the iptv-org public dataset.

## Decision
Adopt:
- **Next.js 16 (App Router)** as the web framework — Vercel-native, RSC for catalog pages, Route Handlers for APIs.
- **Prisma 6** as ORM with the **libSQL adapter** for Turso.
- **Turso (libSQL/SQLite)** as the database — generous free tier, edge replicas, simple ops.
- **Vercel free tier** as the hosting target with `output: 'standalone'` build.
- **NextAuth.js v4 (Credentials provider)** for email+password auth with JWT sessions.
- **TanStack Query + Zustand** for client state, **react-hook-form + Zod** for forms.
- **Vitest + Playwright** for testing.

## Alternatives considered
1. **Drizzle ORM** — lighter, edge-friendlier, but Prisma was already scaffolded by the fullstack-dev skill and has stronger migration tooling. Rejected to avoid churn.
2. **Auth.js v5 beta** — supports edge sessions natively but Credentials provider semantics changed; v4 is stable. Rejected for risk.
3. **Neon / Supabase Postgres** — more powerful than Turso for complex queries, but Turso's SQLite + edge replicas match the simple read-heavy catalog workload at lower ops cost. Rejected for this scale.
4. **SQLite local file in production** — rejected: not Vercel-compatible (ephemeral filesystem).

## Consequences
### Positive
- Single deployable; no separate backend service.
- Type safety end-to-end (Prisma → TypeScript → Zod → forms).
- Free tier covers expected scale.
- Prisma migrations make schema changes safe and reviewable.

### Negative / trade-offs
- SQLite (Turso) has limited write concurrency — acceptable for read-heavy catalog + low admin write volume.
- JWT sessions cannot be revoked server-side without a denylist — acceptable for this risk profile.
- NextAuth Credentials provider requires custom password handling — mitigated by bcrypt.

## Validation
- `bun run build` succeeds.
- `bun run db:push` against Turso reproduces schema.
- Local dev works with `DATABASE_URL=file:./local.db`.

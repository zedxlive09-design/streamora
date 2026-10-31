# Streamora — Architecture

## 1. System overview

Streamora is a single deployable Next.js 16 App Router application. It serves:
- Public catalog + player pages (anonymous-accessible).
- Personalized dashboard (auth-required).
- Admin panel (admin/superadmin-only).
- RESTful API routes (Route Handlers).
- Server-side catalog cache + Turso-backed persistence.

```
Browser ──> Vercel Edge/Node (Next.js 16)
              │
              ├─ Public pages (/  /browse  /watch/[id])
              ├─ Auth pages     (/login  /signup)
              ├─ Dashboard      (/dashboard/*)
              ├─ Admin          (/admin/*)
              └─ API routes     (/api/catalog/*  /api/user/*  /api/admin/*  /api/auth/*)
                                     │
                                     ├─ Turso (libSQL) ─ Prisma adapter
                                     └─ iptv-org public JSON (cached 24h)
```

## 2. Selected stack

| Layer | Technology | Version | Why |
|---|---|---|---|
| Framework | Next.js (App Router) | 16.1.x | Vercel-native, server components, route handlers, standalone output for Vercel free tier. |
| Language | TypeScript | 5.x (strict) | Type safety end-to-end. |
| UI | Tailwind CSS 4 + shadcn/ui (New York) + Lucide | latest | Component library already configured; consistent design tokens. |
| State (client) | Zustand | 5.x | Lightweight, no boilerplate for UI state. |
| State (server) | TanStack Query | 5.x | Caching, refetch, optimistic updates for catalog data. |
| Forms | react-hook-form + Zod | latest | Type-safe forms with validation. |
| ORM | Prisma | 6.11.x | Type-safe schema, migrations, libSQL adapter for Turso. |
| Database | Turso (libSQL) | free tier | Generous free tier (500 DBs, 9 GB); edge replicas; SQLite-compatible. |
| Auth | NextAuth.js (Auth.js v4) | 4.24.x | Credentials provider, JWT sessions, role callback. |
| Video | hls.js + native `<video>` | latest | De-facto HLS on non-Safari browsers. |
| Testing | Vitest + Playwright | latest | Vitest for unit/services; Playwright for E2E. |
| Package manager | Bun | 1.3.x | Fast install, native dev server. |
| CI | GitHub Actions | n/a | Runs lint, typecheck, tests on push/PR. |
| Hosting | Vercel + Turso | free tiers | $0 deployment per requirements. |

Alternatives considered: Drizzle ORM (lighter, but Prisma already scaffolded and well-supported by Turso); Auth.js v5 beta (not stable for credentials provider); Postgres (Neon/Supabase) (more powerful but Turso's SQLite fits Next.js edge + is sufficient for this scale).

## 3. Component boundaries

```
src/
├─ app/                      # Routes (App Router)
│  ├─ (public)/              # Anonymous-accessible route group
│  │  ├─ page.tsx            # Home (catalog discovery)
│  │  ├─ browse/page.tsx
│  │  └─ watch/[channelId]/page.tsx
│  ├─ (auth)/                # Auth route group
│  │  ├─ login/page.tsx
│  │  └─ signup/page.tsx
│  ├─ dashboard/             # Auth-required
│  │  ├─ layout.tsx
│  │  ├─ page.tsx            # Profile
│  │  ├─ favorites/page.tsx
│  │  ├─ history/page.tsx
│  │  └─ metadata/[channelId]/page.tsx
│  ├─ admin/                 # Admin-only
│  │  ├─ layout.tsx
│  │  ├─ page.tsx            # Audit log
│  │  ├─ ads/
│  │  │  ├─ page.tsx         # List
│  │  │  ├─ new/page.tsx
│  │  │  └─ [id]/edit/page.tsx
│  │  ├─ users/page.tsx
│  │  └─ settings/page.tsx
│  ├─ api/
│  │  ├─ catalog/            # /api/catalog/channels, /streams, /countries...
│  │  ├─ user/               # /api/user/favorites, /history, /metadata
│  │  ├─ admin/              # /api/admin/ads, /users, /settings, /audit
│  │  └─ auth/[...nextauth]/route.ts
│  ├─ layout.tsx             # Root layout (theme, providers)
│  └─ globals.css
├─ components/
│  ├─ ui/                    # shadcn/ui primitives (already present)
│  ├─ player/                # VideoPlayer, HLSPlayer
│  ├─ catalog/               # ChannelCard, ChannelGrid, FilterBar, SearchBar
│  ├─ ads/                   # AdSlot renderer
│  ├─ admin/                 # AdForm, UserTable, SettingsForm
│  └─ layout/                # Header, Footer, Sidebar
├─ lib/
│  ├─ db.ts                  # Prisma client singleton (already present)
│  ├─ auth.ts                # NextAuth config + role helpers
│  ├─ catalog/
│  │  ├─ fetcher.ts          # iptv-org fetch + cache
│  │  ├─ types.ts            # iptv-org TypeScript types
│  │  └─ search.ts           # Search/filter helpers
│  ├─ services/
│  │  ├─ user-data.ts        # Favorites, history, metadata CRUD
│  │  ├─ admin.ts            # Admin actions + audit log
│  │  └─ ads.ts              # Ad slot resolution per page
│  └─ utils.ts               # cn() helper (already present)
├─ hooks/                    # useFavorites, useWatchHistory, etc.
└─ tests/
   ├─ unit/
   └─ e2e/
```

## 4. Data flow

### Catalog browsing (anonymous)
1. Browser requests `/` or `/browse`.
2. Server component calls `catalogFetcher.getChannels({ page, filters })`.
3. Fetcher checks in-memory cache; if stale (>24h) or empty, fetches JSON from iptv-org, parses, indexes, caches.
4. Returns paged, filtered slice to server component.
5. Server component renders ChannelGrid with ChannelCards.
6. Client-side TanStack Query hydrates search-as-you-type against `/api/catalog/search`.

### Stream playback
1. User clicks channel → navigates to `/watch/[channelId]`.
2. Server component fetches channel + its streams from catalog cache.
3. Renders VideoPlayer with first playable stream URL.
4. Client picks hls.js vs native based on URL suffix and `canPlayType('application/vnd.apple.mpegurl')`.
5. On play start, client POSTs `/api/user/history` (no-op if anonymous).

### Admin ad creation
1. Admin signs in → navigates to `/admin/ads/new`.
2. Submits AdForm (zod-validated).
3. Server action `createAdSlot` checks session role === ADMIN/SUPERADMIN.
4. Prisma inserts AdSlot.
5. AuditLog row inserted.
6. Revalidates `/admin/ads` path; redirect to list.
7. On next public page render, ads resolver picks up active slot for the configured position.

## 5. Authentication and authorization

- NextAuth Credentials provider: email + bcrypt-verified password.
- JWT session strategy (no DB session table needed on Turso free tier).
- `session.user.role` populated via `jwt` + `session` callbacks reading from DB.
- Server-side authorization helpers in `src/lib/auth.ts`:
  - `requireUser(request)` — throws 401 if no session.
  - `requireAdmin(request)` — throws 403 if role !== ADMIN/SUPERADMIN.
  - `requireOwnership(request, ownerId)` — for user-scoped resources.
- Client-side route groups (`dashboard`, `admin`) wrap layouts that call server-side guards; UI hiding is UX only.

## 6. Error handling, logging, observability

- Route handlers return `{ error: string, code: string }` JSON with appropriate HTTP status.
- Error codes documented in API contracts (`VALIDATION_ERROR`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`).
- Server-side errors logged via `console.error` with request path + correlation ID (Vercel captures).
- Never log secrets, passwords, tokens, or PII.
- 404 / 500 pages use Next.js `not-found.tsx` and `error.tsx` boundaries.

## 7. Performance

- iptv-org dataset cached in-memory (server only); 24h TTL; stale-while-revalidate on fetch failure.
- Catalog API responses cached at route level with `Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800`.
- Images use Next.js `<Image>` with remote patterns for channel logos.
- Code splitting: admin bundle separate from public bundle via route groups.
- Player lazy-loaded (`next/dynamic`) to keep home page light.

## 8. Security

See `docs/DECISIONS/0003-security-baseline.md` for full baseline. Highlights:
- bcrypt password hashing, ≥12 rounds.
- All admin mutations server-side authorized.
- HTML ad content rendered in `<iframe sandbox="">` (no scripts, no forms).
- `.env*` gitignored; `NEXTAUTH_SECRET`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` in Vercel project env vars.
- Security headers via `next.config.ts` `headers()`.

## 9. Backup and recovery

- Turso free tier provides automatic daily backups; PITR up to 7 days.
- Application state is reproducible from: Prisma migrations + iptv-org public dataset + user-supplied env vars.
- Disaster recovery runbook in `docs/operations.md`.

## 10. Deployment model

- **Build:** `bun run build` produces `.next/standalone`.
- **Deploy target:** Vercel project, framework preset "Next.js", no custom build command.
- **Database:** Turso database `streamora` created by user; `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` set in Vercel env.
- **Migrations:** `bun run db:push` (Prisma) at deploy time, or `prisma migrate deploy` for production.
- **No production deploy without user approval** per AGENTS.md and user instruction.

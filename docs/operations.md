# Streamora — Operations Runbook

## 1. Local development

```bash
bun install
cp .env.example .env  # edit NEXTAUTH_SECRET
bun run db:generate
bun run db:push
bun run db:seed       # demo superadmin + welcome banner ad
bun run dev
```

## 2. Production deployment (Vercel + Turso)

> **Authorization required**: do not deploy to production without explicit user approval (AGENTS.md autonomy boundaries).

### 2.1 Create Turso database

```bash
# Install Turso CLI: https://docs.turso.tech/cli
turso auth login
turso db create streamora --group default
turso db tokens create streamora
# Capture the token (cannot be retrieved again).
```

Get the database URL:

```bash
turso db show streamora --url
# → libsql://streamora-<your-handle>.turso.io
```

### 2.2 Push schema to Turso (one-time)

```bash
TURSO_DATABASE_URL=libsql://... \
TURSO_AUTH_TOKEN=eyJ... \
DATABASE_URL=libsql://... \
bun run db:push
```

Or run `prisma migrate deploy` against the Turso URL for controlled migrations.

### 2.3 Configure Vercel project

1. Push the GitHub repo to your Vercel account (Import Project).
2. Framework preset: **Next.js**.
3. Build command: default (`next build`).
4. Output: Vercel handles `output: 'standalone'` automatically.
5. Environment variables (Project Settings → Environment Variables):
   - `TURSO_DATABASE_URL` = `libsql://streamora-<handle>.turso.io`
   - `TURSO_AUTH_TOKEN` = token from step 2.1
   - `NEXTAUTH_SECRET` = output of `openssl rand -base64 32`
   - `NEXTAUTH_URL` = `https://your-project.vercel.app` (or custom domain)
   - `DATABASE_URL` = same value as `TURSO_DATABASE_URL` (so Prisma can find it)
6. Deploy.

### 2.4 Bootstrap superadmin

Immediately after first successful deploy:

1. Visit `https://your-project.vercel.app/signup`.
2. Sign up with your real email + a strong password.
3. The first user is auto-promoted to SUPERADMIN.
4. Verify: navigate to `/admin` — should load the admin panel.

If a non-trusted user signs up before you, **immediately revoke the deploy and reset the database**:

```bash
turso db shell streamora
> DELETE FROM User;
> DELETE FROM UserProfile;
> DELETE FROM AuditLog;
> .quit
```

Then redeploy and sign up first.

## 3. Routine operations

### 3.1 Rotate NEXTAUTH_SECRET

Rotating the secret invalidates all active sessions. Schedule during low traffic.

1. Generate new secret: `openssl rand -base64 32`.
2. Update Vercel env var.
3. Redeploy (or wait for Vercel auto-redeploy on env change).
4. All users will be signed out — expected.

### 3.2 Rotate TURSO_AUTH_TOKEN

```bash
turso db tokens revoke streamora <old-token-id>
turso db tokens create streamora
# Update TURSO_AUTH_TOKEN in Vercel, redeploy.
```

### 3.3 Add a new admin

1. Have the user sign up (or sign them up yourself).
2. Sign in as superadmin → `/admin/users`.
3. Find the user → change role from `USER` to `ADMIN`.
4. The action is recorded in `/admin` audit log.

### 3.4 Configure an ad

1. Sign in as admin → `/admin/ads/new`.
2. Fill in: name, position (e.g. `home-top`), type (`text`/`image`/`html`), content, frequency, metadata (alt, linkUrl, dismissible).
3. For image ads: paste an https image URL.
4. For HTML ads: paste HTML markup — it will be rendered in a sandboxed iframe (no scripts allowed).
5. Save → the ad appears on the configured page within ~60 seconds (cache TTL).

### 3.5 Disable an ad

`/admin/ads` → toggle the "Active" switch off. Changes propagate within 60 seconds.

## 4. Backup and recovery

### 4.1 Turso backups

Turso free tier includes automatic daily backups with PITR (point-in-time recovery) up to 7 days. Verify in Turso dashboard.

### 4.2 Manual backup

```bash
turso db shell streamora ".dump" > backup-$(date +%Y%m%d).sql
```

### 4.3 Restore from backup

```bash
turso db create streamora-restore --from dump backup-YYYYMMDD.sql
# Update TURSO_DATABASE_URL in Vercel to point at restored DB.
```

### 4.4 Full disaster recovery

Application state is reproducible from:
1. iptv-org public dataset (re-fetched on cold start).
2. Prisma schema migrations.
3. User-supplied env vars.

To rebuild from scratch:
1. Create new Turso DB.
2. `bun run db:push` against new DB.
3. Update Vercel env vars.
4. Redeploy.
5. Sign up first to claim superadmin.
6. Re-create ad slots + site settings via admin panel.

## 5. Monitoring

- **Vercel dashboard**: deployments, function logs, analytics.
- **Turso dashboard**: DB size, query count, replica latency.
- **Application logs**: `console.error` calls surface in Vercel function logs with request path.
- **Audit log**: `/admin` page shows admin mutations (role changes, ad CRUD, settings changes).

## 6. Known limitations

See `docs/FINAL_HANDOFF.md` § "Unresolved risks".

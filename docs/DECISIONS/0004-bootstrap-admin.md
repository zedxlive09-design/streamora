# ADR-0004: Bootstrap admin convention (first registered user is superadmin)

- Status: Accepted
- Date: 2026-10-31
- Owners: Architect, Database & Security

## Context
Streamora ships with no users. There must be a deterministic, safe way to bootstrap the first admin so the admin panel is reachable after initial deploy.

## Decision
- On user creation, if `User.count() === 0` at the moment of insert, the new user's `role` is set to `SUPERADMIN`. Otherwise, `USER`.
- The check + insert happen in a single Prisma transaction to avoid a race creating two superadmins.
- All subsequent role changes happen via `/admin/users` by an existing admin/superadmin.
- No self-demotion allowed (server-side check).

## Alternatives considered
1. **Env-var-defined bootstrap admin email** — would require user to set an env var before first sign-up; adds friction.
2. **CLI seed script** — requires running a command post-deploy; doesn't fit Vercel auto-deploy model.
3. **Magic link via email** — deferred (no email service in this release).

## Consequences
### Positive
- Zero-config bootstrap.
- Deterministic: first sign-up wins.
- No credentials in env vars.

### Negative / trade-offs
- Whoever signs up first becomes superadmin — operator must deploy and sign up immediately after first deploy to claim the role. Documented in deployment runbook.
- If first user signs up with a typo email, they can't be demoted without DB access — documented risk.

## Validation
- `tests/unit/auth.test.ts` asserts first-created user has `SUPERADMIN`, second has `USER`.
- Transaction test asserts no race creates two superadmins (mocked concurrent inserts).

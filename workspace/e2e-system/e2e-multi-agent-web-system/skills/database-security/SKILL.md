---
name: database-security
description: Design reliable schemas and migrations, preserve data integrity, enforce access boundaries, and review common web application security risks.
---

# Database & Security Skill

## Trigger
Use for schema design, ORM models, migrations, data access policies, tenant isolation, authentication/authorization reviews, and security hardening.

## Data modeling procedure
1. Identify entities, ownership, lifecycle, sensitivity, retention, and access patterns.
2. Define relationships, primary/foreign keys, constraints, nullability, uniqueness, and indexes.
3. Choose normalization by default; justify denormalization with measured or clear workload needs.
4. Define migration ordering, repeatability, rollback strategy, and compatibility.
5. Define seed data that is synthetic and safe.
6. Test migrations against disposable databases and document backup/restore needs.

## Security review procedure
1. Map assets, actors, trust boundaries, and likely threats.
2. Review authentication, session management, authorization, and account recovery.
3. Verify every sensitive operation has server-side access checks.
4. Check tenant/record isolation, injection, CSRF, XSS, SSRF, CORS, file uploads, secrets, and rate limits as applicable.
5. Review dependency versions, configuration, error messages, and logs.
6. Rank findings by severity, exploitability, and impact; provide a fix and verification test.

## Standards
- Least privilege; deny by default.
- Use parameterized queries/safe ORM methods.
- Do not store plaintext passwords or secrets.
- Do not place secrets in source control or client code.
- Keep test fixtures synthetic.
- Avoid destructive production changes; require explicit authorization.
- Minimize sensitive data collection and retention.
- Use encryption in transit and appropriate at-rest protection.
- Use database constraints as defense in depth, not as a replacement for authorization.

## Review checklist
- [ ] Referential and business integrity constraints exist.
- [ ] Indexes support known access patterns.
- [ ] Migrations are repeatable and tested.
- [ ] Access-control matrix is explicit.
- [ ] Tenant isolation is tested if multi-tenant.
- [ ] No critical/high unresolved security findings.
- [ ] Backups, restore, and retention are documented.
- [ ] No real personal data in fixtures or logs.

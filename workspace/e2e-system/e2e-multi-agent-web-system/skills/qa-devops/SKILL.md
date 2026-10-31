---
name: qa-devops
description: Verify requirements through automated tests, browser E2E journeys, CI/CD, production builds, and operational-readiness checks.
---

# QA & DevOps Skill

## Trigger
Use throughout implementation and before any release candidate is declared ready.

## Test strategy
1. Map requirements and risks to test levels.
2. Prioritize critical user journeys and security boundaries.
3. Use the existing test stack when viable; add a tool only when it provides clear value.
4. Keep tests deterministic, isolated, and repeatable.
5. Use synthetic fixtures and disposable environments.

## Test layers
- **Unit:** isolated business rules and utilities.
- **Integration:** database, service, and module boundaries.
- **Contract/API:** request/response schema, status codes, auth behavior.
- **E2E:** critical real-user journeys in a browser.
- **Non-functional:** accessibility, performance, reliability, security, and recovery checks as relevant.

## Defect workflow
Every defect ticket must include:
- Unique identifier and severity.
- Requirement/user journey affected.
- Environment and preconditions.
- Reproduction steps.
- Expected and actual result.
- Logs, screenshots, trace, or other evidence when available.
- Suspected owner and regression test expectation.

After a fix, rerun the failing test and relevant regression suite. Do not delete or weaken the test to obtain a pass.

## CI/CD and operations
- Run format, lint, static analysis, type checks, tests, and build in CI.
- Keep secrets in CI secret storage.
- Separate validation from deployment.
- Use health/readiness checks and structured logs where appropriate.
- Document environment configuration, migration order, backups, rollback, and recovery.
- Require explicit human authorization for production deployment and destructive live operations.

## Final quality gate
Report actual command output/status. Distinguish `PASS`, `FAIL`, `NOT RUN`, and `BLOCKED`.

A release candidate cannot be marked ready if a release-blocking test fails, if critical security findings remain, or if essential checks were not run without an explicitly accepted risk.

Final status must be one of:
- `READY FOR HUMAN RELEASE`
- `BLOCKED`
- `NOT READY`

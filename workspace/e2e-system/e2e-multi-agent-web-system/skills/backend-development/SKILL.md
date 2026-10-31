---
name: backend-development
description: Implement robust APIs, domain logic, authentication, authorization, integrations, validation, error handling, and observability.
---

# Backend Development Skill

## Trigger
Use for API endpoints, server-side workflows, business rules, authentication, integrations, background work, and backend refactoring.

## Procedure
1. Inspect existing runtime, framework, modules, middleware, configuration, and test patterns.
2. Confirm API contract, data ownership, identity model, and authorization rules.
3. Separate transport/controller code from domain logic and persistence where complexity warrants it.
4. Validate and normalize all external input at boundaries.
5. Enforce authorization server-side for every protected operation and resource.
6. Use safe queries, transactions, and idempotency where needed.
7. Define consistent error responses and avoid leaking internal details.
8. Add timeouts, retries with limits, and graceful degradation for external services.
9. Add structured observability without logging secrets or unnecessary personal data.
10. Test success, invalid input, authentication, authorization, not-found, conflict, rate-limit, and dependency failure paths.

## Standards
- Use parameterized queries or safe ORM APIs.
- Never trust client-provided role, tenant, owner, or price claims without verification.
- Use established password hashing and session/token libraries.
- Apply rate limits to login, password reset, OTP, and expensive endpoints as appropriate.
- Use pagination and bounded query sizes for collection endpoints.
- Make writes transactional when multiple records must remain consistent.
- Avoid broad catch blocks that hide failures.
- Document environment variable names, never secret values.

## Review checklist
- [ ] Contract and status codes are consistent.
- [ ] Input validation exists at trust boundaries.
- [ ] Authorization is enforced on the server.
- [ ] Queries and writes are safe.
- [ ] Sensitive data is minimized in responses and logs.
- [ ] Failure behavior is predictable.
- [ ] Tests cover positive and negative paths.
- [ ] Lint, type checks, and build pass.

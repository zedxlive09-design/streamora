---
name: frontend-development
description: Build production-quality web interfaces with responsive layouts, accessible interactions, reliable API integration, and testable components.
---

# Frontend Development Skill

## Trigger
Use for browser UI, pages, forms, navigation, client state, visual systems, frontend API integration, and accessibility improvements.

## Procedure
1. Inspect existing framework, routing, styling, component library, state model, and design conventions.
2. Map each user journey and required state: initial, loading, empty, success, validation, error, offline, unauthorized, and forbidden.
3. Define reusable components only where reuse is real; keep page composition understandable.
4. Implement semantic markup, responsive layouts, keyboard interaction, visible focus, labels, and accessible feedback.
5. Integrate documented APIs through a consistent client layer; centralize base URL and error handling.
6. Validate forms both client-side for usability and server-side for security.
7. Add unit/component tests and browser tests for critical interactions.
8. Run lint, type check, tests, and production build.

## Standards
- Use the repository's established language and framework.
- Prefer strict typing and explicit component props.
- Avoid duplicated business rules in the browser.
- Never embed server secrets or privileged keys in client bundles.
- Do not treat hidden controls or client route guards as security enforcement.
- Avoid unsafe HTML injection; sanitize only with a trusted, appropriate method when rich HTML is required.
- Avoid layout shifts and unnecessary large dependencies.
- Ensure useful empty states and actionable error messages.
- Support keyboard-only use and sensible screen-reader semantics.

## Review checklist
- [ ] Responsive at narrow and wide viewports.
- [ ] Keyboard navigation and focus states work.
- [ ] Forms have labels, validation, and error association.
- [ ] Loading/empty/success/error states are present.
- [ ] API failures do not crash the interface.
- [ ] Authorization-sensitive UI reflects server responses.
- [ ] No secrets or environment-specific values are hardcoded.
- [ ] No console errors in tested critical flows.
- [ ] Tests and production build pass.

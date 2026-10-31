---
name: software-architecture
description: Turn a web product brief into requirements, a justified technology stack, system architecture, contracts, and an executable delivery plan.
---

# Software Architecture Skill

## Trigger
Use when starting a new application, making a major architectural change, selecting a stack, splitting work across agents, or resolving cross-cutting technical decisions.

## Procedure
1. **Understand the product**
   - Identify users, roles, goals, workflows, core entities, integrations, and business rules.
   - Separate must-have, should-have, and future scope.
   - Define acceptance criteria that can be tested.
2. **Inspect reality**
   - Examine repository, runtime, dependencies, deployment, and existing conventions.
   - Preserve viable existing architecture; avoid rewrites without evidence.
3. **Capture non-functional requirements**
   - Security, privacy, accessibility, performance, reliability, scale, maintainability, localization, observability, recovery, and cost.
4. **Select the stack**
   - Compare reasonable options against requirements and constraints.
   - Prefer mature, maintained, well-documented tools.
   - Document trade-offs, versions, hosting implications, and operational burden.
5. **Design the system**
   - Define components, responsibilities, boundaries, data flows, trust boundaries, and integration points.
   - Define API conventions, error model, identity, authorization, and data ownership.
6. **Plan delivery**
   - Sequence dependencies.
   - Create small tasks with owners, acceptance criteria, and test expectations.
   - Identify parallelizable tasks and shared-file risks.
7. **Record decisions**
   - Create ADRs for decisions that are costly to reverse.

## Required artifacts
- Requirements and acceptance criteria.
- Architecture overview and component/data-flow diagrams where useful.
- Stack decision with rationale.
- API and data contracts or links to their owners.
- Implementation plan and risk register.
- Local development and deployment outline.

## Quality checklist
- [ ] Every major requirement maps to a component and test.
- [ ] Authentication is distinguished from authorization.
- [ ] Trust boundaries and sensitive data are identified.
- [ ] Failure modes and external dependencies are considered.
- [ ] Stack choice fits the actual deployment constraints.
- [ ] No unnecessary infrastructure or premature abstraction.
- [ ] Decisions and assumptions are explicit.

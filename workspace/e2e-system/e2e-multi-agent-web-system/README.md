# E2E Multi-Agent Web Development System

A platform-independent, fully autonomous multi-agent workflow for planning, building, reviewing, testing, fixing, documenting, and preparing web applications for production.

## Package contents

- `AGENTS.md` — shared operating contract and orchestration policy.
- `agents/` — five specialized subagent configurations.
- `skills/` — five reusable `SKILL.md` playbooks.
- `templates/` — project brief, decision record, API contract, and handoff templates.

The package is intentionally technology-flexible. The Architect selects the stack based on requirements, constraints, team familiarity, deployment target, security, maintainability, and total cost. The agents must document and justify that choice before implementation.

## Quick installation

1. Extract this folder into the root of your web application repository.
2. Keep `AGENTS.md` in the repository root.
3. Copy the five files from `agents/` into the subagent directory supported by your coding agent, or register them manually as named agents.
4. Make the five `skills/*/SKILL.md` files available to the agent's skill loader. If the platform has no skill loader, tell the orchestrator to read the relevant skill file before each task.
5. Add your project brief to `docs/PROJECT_BRIEF.md` using `templates/PROJECT_BRIEF.md`.
6. Start the orchestrator with:  
   **"Read AGENTS.md and docs/PROJECT_BRIEF.md. Execute the full autonomous E2E workflow. Ask me only when blocked by a decision that cannot be safely inferred or when an external action requires my credentials or approval."**

## Platform adaptation

This package uses plain Markdown and YAML frontmatter. It does not depend on a vendor-specific agent runtime.

- **Claude Code:** put `AGENTS.md` at repository root; adapt/copy agent files into `.claude/agents/`; place skill folders under `.claude/skills/<skill-name>/SKILL.md`.
- **OpenAI Codex:** put `AGENTS.md` at repository root (or translate its rules into the platform's supported repository instruction file); register each agent configuration using the Codex multi-agent features available in your installed version; expose skill folders to the agent.
- **Cursor / VS Code / other frameworks:** keep `AGENTS.md` as shared instructions and register each `agents/*.md` file as a named agent. Point each agent to its corresponding skill.
- **Any platform without subagents:** run the five roles sequentially in one agent, preserving the same handoff and approval gates.

Exact configuration filenames and agent orchestration features vary by product/version. The content files are portable; the registration step is platform-specific.

## Autonomous does not mean unsafe

Agents may autonomously edit code, run local tests, create branches, commit changes, and repair defects inside the repository. They must not deploy to production, spend money, alter live customer data, rotate secrets, change DNS, or perform destructive external actions without explicit authorization. Never ask the user to paste secrets into chat; use local environment variables or a secret manager.

## Recommended first run

- Ensure the repository has a clean Git working tree.
- Provide product goals, target users, must-have features, non-functional requirements, and deployment constraints.
- Ensure dependencies and local runtime are installed.
- Let the Architect produce a plan and stack decision.
- Allow the agents to implement and validate in iterative cycles.
- Review `docs/FINAL_HANDOFF.md`, test reports, and any unresolved risks before production release.

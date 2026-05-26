# WO-009 — AI Gateway PHI Boundary

## Objective

Replace mock AI paths with AI gateway abstractions and PHI safety checks while preserving mock mode.

## Scope

Implement scrubber, request packaging, prompt registry, response schemas, safety policy, governance events, and model-provider abstraction. External AI remains disabled by default.

## Suggested files/areas

`packages/ai-gateway`, AI API endpoints, worker jobs, security tests.

## Acceptance criteria

Tests prove raw PHI fields are rejected/redacted; UI/backend cannot call external AI directly; outputs are draft/candidate/suggestion only; no autonomous prohibited actions.

## Definition of done

- Meets this work order's acceptance criteria.
- Meets the global definition of done in `AGENTS.md`.
- Updates relevant docs and tests.
- Updates `repo_status.json` and `RUN_LOG.md`.
- Adds `SPEC_GAPS.md` entries for unresolved gaps.

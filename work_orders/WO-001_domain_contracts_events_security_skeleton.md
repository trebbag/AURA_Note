# WO-001 — Domain Contracts Events Security Skeleton

## Objective

Implement core domain types, OpenAPI seeds, event envelopes, RBAC/ABAC skeleton, audit scaffolding, and PHI redaction helpers.

## Scope

Define states and DTOs for appointments, notes, visit sessions, recordings, transcripts, suggestions, selections, wizard steps, tasks, billing preview, exports, and coaching. Add test fixtures.

## Suggested files/areas

`packages/domain`, `packages/contracts`, `packages/security`, `packages/testing`, `docs/DATA_MODEL.md`, `docs/API_EVENT_CONTRACTS.md`.

## Acceptance criteria

Domain invariants compile and unit tests cover appointment-note one-to-one, timer gate, blocker tasks, low-confidence override, and role visibility basics.

## Definition of done

- Meets this work order's acceptance criteria.
- Meets the global definition of done in `AGENTS.md`.
- Updates relevant docs and tests.
- Updates `repo_status.json` and `RUN_LOG.md`.
- Adds `SPEC_GAPS.md` entries for unresolved gaps.

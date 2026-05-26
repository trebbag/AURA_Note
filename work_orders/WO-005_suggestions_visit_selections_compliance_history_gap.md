# WO-005 — Suggestions Visit Selections Compliance History Gap

## Objective

Implement first-pass Suggestions, Visit Selections, Compliance & Quality Review, and History Gap Review using mock/deterministic AI service first.

## Scope

Support suggestion categories, Visit Selection filters, manual additions, low-confidence diagnosis override, compliance issues, history gap questions, and MA follow-up task routing.

## Suggested files/areas

Suggestions service, VisitSelections service, tasks, UI panels/drawers, tests.

## Acceptance criteria

Suggestion cards can be accepted/removed; Visit Selections update; low-confidence diagnosis requires reason; history gap can create blocker task; compliance hard block disables Finalize.

## Definition of done

- Meets this work order's acceptance criteria.
- Meets the global definition of done in `AGENTS.md`.
- Updates relevant docs and tests.
- Updates `repo_status.json` and `RUN_LOG.md`.
- Adds `SPEC_GAPS.md` entries for unresolved gaps.

# WO-003 — Draft Finalized Notes Documentation Workspace Shell

## Objective

Build Draft Notes, Finalized Notes, and Documentation Workspace shells.

## Scope

Draft Notes show workflow statuses. Finalized Notes show read-only placeholders. Documentation workspace includes top panel, controls bar, editor, Visit Selections, Suggestions, transcript drawer, Compliance drawer, History Gap drawer.

## Suggested files/areas

`apps/web` routes/components, API placeholders, Storybook/Playwright tests.

## Acceptance criteria

Workspace is navigable from schedule; editor locked before timer; finalized note route is read-only; all required empty/loading/blocked states exist.

## Definition of done

- Meets this work order's acceptance criteria.
- Meets the global definition of done in `AGENTS.md`.
- Updates relevant docs and tests.
- Updates `repo_status.json` and `RUN_LOG.md`.
- Adds `SPEC_GAPS.md` entries for unresolved gaps.

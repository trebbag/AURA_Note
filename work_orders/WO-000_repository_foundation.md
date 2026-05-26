# WO-000 — Repository Foundation

## Objective

Create or verify the monorepo foundation so Codex can build in deterministic, testable slices.

## Scope

Set up apps, packages, scripts, status surfaces, basic CI, and developer/documentation scaffolding. Do not implement clinical workflows yet.

## Suggested files/areas

Root config, `apps/*`, `packages/*`, `.github/*`, `scripts/*`.

## Acceptance criteria

`pnpm install`, `pnpm lint`, `pnpm typecheck`, and `pnpm test` should be defined. Web/API/worker skeletons should have health/status routes or placeholders. Repository instructions remain intact.

## Definition of done

- Meets this work order's acceptance criteria.
- Meets the global definition of done in `AGENTS.md`.
- Updates relevant docs and tests.
- Updates `repo_status.json` and `RUN_LOG.md`.
- Adds `SPEC_GAPS.md` entries for unresolved gaps.

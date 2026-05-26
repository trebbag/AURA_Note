# WO-008 — Exports PDF Copy Final Note Viewer

## Objective

Implement copy/export/PDF actions and finalized note viewer.

## Scope

Final note and patient summary can be copied, downloaded as PDF, exported, and queued for EHR writeback if configured. Finalized notes open read-only viewer.

## Suggested files/areas

Export service, PDF worker, final note viewer, EHR writeback queue placeholder, tests.

## Acceptance criteria

PDFs generated from approved versions; copy/export disabled before sign; writeback queue handles disabled/failure states; linked-staff visibility enforced.

## Definition of done

- Meets this work order's acceptance criteria.
- Meets the global definition of done in `AGENTS.md`.
- Updates relevant docs and tests.
- Updates `repo_status.json` and `RUN_LOG.md`.
- Adds `SPEC_GAPS.md` entries for unresolved gaps.

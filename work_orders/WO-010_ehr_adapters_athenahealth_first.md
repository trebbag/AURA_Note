# WO-010 — EHR Adapters Athenahealth First

## Objective

Implement EHR adapter interface, mock adapter, and athenahealth-first sandbox scaffolding.

## Scope

Support patient lookup, appointments, chart context, meds, allergies, problems, labs, documents, final note writeback, and status. Keep generic vendor-neutral interface.

## Suggested files/areas

`packages/ehr-adapters`, integration API, chart context parser, tests.

## Acceptance criteria

Standalone works with EHR disabled. Mock adapter populates chart context. Writeback queue handles configured/unconfigured/failure states. Athenahealth implementation is isolated.

## Definition of done

- Meets this work order's acceptance criteria.
- Meets the global definition of done in `AGENTS.md`.
- Updates relevant docs and tests.
- Updates `repo_status.json` and `RUN_LOG.md`.
- Adds `SPEC_GAPS.md` entries for unresolved gaps.

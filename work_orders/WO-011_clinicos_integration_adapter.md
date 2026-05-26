# WO-011 — ClinicOS Integration Adapter

## Objective

Implement ClinicOS integration adapter scaffolding.

## Scope

Map AURA Note objects/events to ClinicOS concepts: M03 VisitGraph, M04 tasks, M17 NP Cockpit, M21 Charge Integrity, M23 AI, M24 governance, M25 integration, M26 data. Provide mock ClinicOS mode.

## Suggested files/areas

`packages/clinicos-adapter`, mode resolver, integration settings, tests.

## Acceptance criteria

App boots in standalone and ClinicOS mock modes. Core workflows are identical. Mapping records are stored. ClinicOS unavailable state degrades safely.

## Definition of done

- Meets this work order's acceptance criteria.
- Meets the global definition of done in `AGENTS.md`.
- Updates relevant docs and tests.
- Updates `repo_status.json` and `RUN_LOG.md`.
- Adds `SPEC_GAPS.md` entries for unresolved gaps.

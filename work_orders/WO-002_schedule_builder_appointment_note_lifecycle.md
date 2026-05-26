# WO-002 — Schedule Builder Appointment Note Lifecycle

## Objective

Build standalone Schedule Builder and appointment-to-note lifecycle.

## Scope

MA/admin/clinician can create appointments with synthetic patient data. Every appointment creates exactly one note shell. Clinician can open Start Visit from schedule.

## Suggested files/areas

`apps/web`, `apps/api`, scheduling module, appointment/note repositories, tests.

## Acceptance criteria

Creating appointment creates note shell; duplicate note creation is blocked; schedule shows note status; ClinicOS/EHR scheduling can be disabled without breaking standalone mode.

## Definition of done

- Meets this work order's acceptance criteria.
- Meets the global definition of done in `AGENTS.md`.
- Updates relevant docs and tests.
- Updates `repo_status.json` and `RUN_LOG.md`.
- Adds `SPEC_GAPS.md` entries for unresolved gaps.

# WO-033 — Production Build Rails And Readiness Controls

## Objective

Put AURA Note back on explicit production-build rails after `WO-032` without implementing new runtime product behavior.

## Why this work order exists

`WO-000` through `WO-032` completed a strong synthetic/local-first package plus bounded post-CP4 persistence and storage evidence. The next work must not drift into production claims or uncontrolled future work. This work order makes the remaining build sequence, checkpoint gates, status semantics, `SPEC_GAPS.md`, and readiness scripts explicit before durable runtime implementation resumes.

## Prerequisites

- `WO-000` through `WO-032` complete and merged.
- `docs/PRODUCTION_BUILD_PLAN.md` exists as the production-build planning source.
- No active blocking `SPEC_GAP` exists for the rails work.

## In scope

- Update `AGENTS.md` with the post-`WO-032` checkpoint sequence and future status semantics.
- Update `docs/PRODUCTION_BUILD_PLAN.md` so future work orders are sequential, comprehensive, and fielded.
- Update `work_orders/README.md` so future work orders are discoverable.
- Update `repo_status.json` so `WO-033` is active/done after implementation and future work is represented without breaking synthetic readiness.
- Update `SPEC_GAPS.md` so it reflects the post-`WO-032` state and deferred production decisions.
- Update readiness scripts so synthetic readiness and production-build readiness are separate.
- Add guardrails that fail if future work orders are marked done without work-order file, run-log evidence, status evidence, and checkpoint/doc evidence where applicable.
- Update `CHECKPOINT_REPORT.md` and `RUN_LOG.md` with P6.5 evidence.

## Out of scope

- Runtime product behavior changes.
- Database schema changes.
- Production credentials or vendor access.
- Live EHR, live AI, live object storage, live transcription, production PHI storage, production deletion, charge finalization, claim submission, or medical-necessity determination.

## UX requirements

- No UI changes are required.
- Future UX requirements must remain visible in the production build plan.

## Backend/API requirements

- No API behavior changes are required.
- Readiness scripts must distinguish completed synthetic/local readiness from active production-build progress and final launch readiness.

## Data model/persistence requirements

- No schema changes are required.
- Future persistence expansion must remain sequenced through P7 work orders.

## Event/audit requirements

- No runtime domain events are required.
- `RUN_LOG.md` must record the re-rail changes, tests, risks, deferred decisions, and next work order.

## RBAC/ABAC requirements

- Preserve the current RBAC/ABAC matrix.
- Future work orders must preserve role-limited transcript, final note, billing, coaching, support, audit, and admin visibility.

## Standalone-mode behavior

- Standalone runtime behavior remains unchanged.
- Future work orders must preserve standalone-first operation.

## ClinicOS-integrated behavior

- ClinicOS-integrated runtime behavior remains unchanged.
- Future work orders must preserve adapter boundaries and prevent ClinicOS context from bypassing AURA Note permissions.

## AI/PHI/security requirements

- No raw PHI may be introduced.
- No external AI may be enabled.
- Deferred production decisions must remain visible in `SPEC_GAPS.md`.

## Testing requirements

- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `node scripts/status.js`
- `git diff --check`
- Full local gate unless a narrower docs/script gate is explicitly justified in `RUN_LOG.md`.

## Required scripts/gates

- `pnpm production:readiness`
- Existing CP4/post-CP4 gates must continue passing.

## Definition of Done

- `AGENTS.md` includes P6.5 through P11 checkpoint sequence.
- `work_orders/README.md` lists `WO-033` through `WO-051`.
- `docs/PRODUCTION_BUILD_PLAN.md` covers all remaining commercial-production areas and every future work order includes required fields.
- `repo_status.json` identifies the active/next work order without breaking synthetic readiness.
- `scripts/acceptance-readiness.js` does not falsely claim production readiness.
- `scripts/production-build-readiness.js` validates future work-order controls.
- `SPEC_GAPS.md` states there are no active gaps as of post-`WO-032` / re-rail review and lists deferred production decisions.
- `CHECKPOINT_REPORT.md` includes P6.5 evidence.
- `RUN_LOG.md` includes the work-order evidence and next step.
- Local gates and GitHub Actions pass before merge.

## Stop conditions

- A readiness-script conflict would make completed CP4/post-CP4 evidence unverifiable.
- A high-risk future work area lacks enough source authority to sequence safely.
- A build/test break remains unresolved after three focused repair attempts.

## Risks and deferred decisions

- Future work still depends on production identity, database, Azure, transcription, EHR, ClinicOS, AI, security/privacy, and claim-strategy decisions.
- `WO-033` must not mark AURA Note production-ready; it only makes the remainder of the build controllable.

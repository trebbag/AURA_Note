# WO-052 — Post-P11 Continuation Rails And Tranche Intake

## Objective

Create a safe post-P11 continuation plan that lets future AURA Note work resume without silently authorizing live production, vendor, PHI, payer, or launch behavior.

## Why this exists

`WO-051` intentionally stopped at P11 with `next_work_order: null`. The founder has asked Codex to continue with the work plan, but the repo needs an explicit intake/control layer before any new production-facing tranche can be activated. This work order defines that intake layer and leaves all high-risk deferred decisions visible.

## Prerequisites

- `WO-000` through `WO-051` are complete and merged.
- `repo_status.json` records `current_checkpoint: P11` and `next_work_order: null`.
- `SPEC_GAPS.md` has no active blockers for the completed synthetic/local scope.

## In scope

- Add a post-P11 continuation plan document.
- Document candidate future tranche families and their required approval evidence.
- Add a readiness verifier proving post-P11 work remains planning-only.
- Update work-order index, production plan, backlog, run log, checkpoint report, and status metadata.
- Keep `next_work_order: null` until a specific future tranche is approved and promoted.

## Out of scope

- Live claim submission, clearinghouse integration, payer integration, denial automation, payment posting, charge finalization, medical-necessity determination, or patient-facing financial conclusions.
- Live EHR writeback, live ClinicOS event delivery, live external AI, live transcription provider use, production PHI storage, production object storage execution, destructive production deletion, production restore execution, or production deployment.
- New runtime product behavior.

## UX requirements

- No new production UX screens are required.
- Any future UX tranche must preserve the Frontend Runtime Integration Gate: production-intended screens use typed API clients and persisted backend state, with Storybook/demo mocks explicitly labeled.

## Backend/API requirements

- No new backend endpoints are implemented in this work order.
- Any future backend tranche must be tenant-scoped, permission-checked, idempotent where repeat submissions are plausible, audit/event emitting, and safe in standalone and ClinicOS-integrated modes.

## Data model/persistence requirements

- No schema, migration, or runtime persistence change is implemented here.
- Future data-model work must name the tenant-owned tables affected, RLS posture, rollback posture, backup/restore posture, and synthetic/live boundary.

## Event/audit requirements

- No new domain events are emitted by this work order.
- Future state-changing work must add or update event contracts and audit evidence before the work order can be marked done.

## RBAC/ABAC requirements

- No permission matrix change is implemented here.
- Future work must name the roles, permissions, purpose-of-use, tenant/site scope, and negative tests before implementation.

## Standalone-mode behavior

Standalone mode remains the default authority for the current synthetic/local app state. Future work must not make ClinicOS required for core standalone operation unless the active work order explicitly defines a safe degraded mode.

## ClinicOS-integrated behavior

ClinicOS-integrated mode remains adapter-scoped. Future work cannot let ClinicOS identity, schedule, VisitGraph, WorkOS, Charge Integrity, Copilot Runtime, AI Governance, Integration Hub, or Data Cloud bypass AURA Note permissions, audit, human review, or tenant/site isolation.

## AI/PHI/security requirements

- No raw PHI is introduced.
- No external AI call is introduced.
- No production credential, `.env`, private key, real patient data, real payer data, or production connection string is introduced.
- AI remains draft/candidate/suggestion-only and human-review-required in all future work unless a later founder-approved work order and safety review explicitly authorizes a narrower behavior.

## Testing requirements

- Add a post-P11 continuation readiness verifier.
- Verify the new verifier, production readiness, acceptance readiness, status output, and whitespace checks.
- Full runtime gates are not required for a planning-only work order unless shared scripts or runtime files change in a way that can affect application behavior.

## Required scripts/gates

- `pnpm post-p11:readiness`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `node scripts/status.js`
- `git diff --check`

## Definition of Done

- Post-P11 continuation plan exists and is referenced from the production plan and backlog.
- `WO-052` is listed in `work_orders/README.md`.
- `repo_status.json` records `WO-052: done` while preserving `next_work_order: null`.
- Readiness scripts tolerate the terminal P11-plus planning state without falsely claiming production readiness.
- Run log and checkpoint report record the planning-only status, tests, risks, and next-step rules.
- No live production, vendor, claim, PHI, or launch behavior is introduced.

## Stop conditions

- A future implementation request requires live credentials, real PHI, legal/compliance approval, or production vendor behavior not specified in a new work order.
- A requested future claim/payer implementation lacks clearinghouse/payer strategy, billing compliance requirements, human approval model, audit model, denial/payment scope, rollback/void/reversal policy, and patient-facing financial language.
- Readiness scripts would imply production readiness or activate a future work order without explicit approval.

## Risks and deferred decisions

- The plan can organize future work, but it is not founder/clinical/compliance/security/legal approval for live use.
- All deferred decisions in `SPEC_GAPS.md` remain deferred until a named future work order resolves them with evidence.
- Future work may require new active `SPEC_GAP`s if product policy, legal, vendor, or safety decisions are still missing.

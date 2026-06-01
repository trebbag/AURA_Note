# WO-067 — ModeResolver And Adapter Runtime Wiring

## Objective

Implement the application-level mode resolver and enforce standalone-vs-ClinicOS adapter boundaries in runtime code.

## Why This Work Order Exists

AURA Note must be built once and support both standalone and ClinicOS-integrated modes. The current app has standalone workflow evidence and ClinicOS mock/degraded surfaces, but the next CR-3 tranche must make mode resolution explicit across runtime services so standalone behavior remains complete and ClinicOS integration cannot bypass AURA Note permissions.

## Prerequisites

- CR-2 complete through `WO-066`.
- Current adapter contracts in `packages/clinicos-adapter`, `packages/ehr-adapters`, API services, security helpers, and mode-boundary docs.
- Current `docs/STANDALONE_AND_CLINICOS_MODES.md`, `docs/BACKEND_BUILD_SPEC.md`, `docs/API_EVENT_CONTRACTS.md`, `docs/RBAC_ABAC_MATRIX.md`, and `docs/DATA_MODEL.md`.

## In Scope

- Add or harden a `ModeResolver` runtime boundary.
- Wire or document runtime adapter seams for schedule source, patient context, VisitGraph, tasks, audit, AI governance, Charge Integrity, EHR, export, and identity contexts where current services touch those domains.
- Preserve standalone default mode.
- Add ClinicOS mock/degraded/disabled mode evidence without enabling live credentials or live event bus.
- Add `pnpm mode:adapter-readiness`.
- Update code, tests, contracts/docs/status/run-log as needed.

## Out Of Scope

- Live ClinicOS credentials, live event bus, raw ClinicOS payload storage, production synchronization, live delegated identity, live EHR writeback, live AI, live transcription, claim submission, charge finalization, or production launch approval.
- Building a second ClinicOS-specific app.

## UX Requirements

- Relevant routes must display standalone, embedded, unavailable, stale, degraded, replay-needed, reconciliation-needed, permission-denied, approval-required, failed-publication, disabled, and read-only states where applicable.
- ClinicOS mode state must be visible as adapter-bound metadata, not as a permission bypass.

## Backend/API Requirements

- Runtime services call mode/adapter boundaries for appointments, patients, visits, tasks, identity, audit, AI, charge integrity, writeback, and exports where in scope.
- Adapter calls are tenant/site scoped, permission checked, validation protected, and fail closed for missing live configuration.
- No live ClinicOS payload delivery is introduced.

## Data Model/Persistence Requirements

- Mode mappings and adapter metadata are durable where already required by the active persisted slice.
- No raw live ClinicOS payload storage is added.
- Tenant-owned persisted adapter metadata must retain tenant/site isolation evidence.

## Event/Audit Requirements

- Mode resolution, adapter calls, degraded states, denied delegation, stale mappings, replay/reconciliation needs, and publication attempts must be audit-safe.
- Failed/degraded publication metadata must not include raw ClinicOS payloads.

## RBAC/ABAC Requirements

- ClinicOS cannot bypass AURA Note permissions, human-review gates, tenant/site isolation, purpose-of-use checks, transcript access rules, final note access rules, billing visibility rules, coaching visibility rules, support limits, or PHI policy.
- Cross-tenant and unauthorized service-account attempts must be denied before DTO data is exposed.

## Standalone-Mode Behavior

- Standalone remains the default and fully usable.
- No core v1 daily workflow may require ClinicOS context.

## ClinicOS-Integrated Behavior

- ClinicOS mode can be exercised in mock/degraded tests.
- Disabled/unavailable delegated identity, event publication, mapping, and module-context states fail safely and visibly.

## AI/PHI/Security Requirements

- No live ClinicOS, live AI, live EHR, live writeback, live transcription, raw PHI-to-external-AI, raw payload storage, credentials, secrets, or production PHI samples.
- Logs and audit records remain redacted and request/trace correlated.
- AI output remains draft/candidate/suggestion-only.

## Testing Requirements

- Unit/integration tests for standalone default, ClinicOS disabled, ClinicOS degraded, mock adapter success, stale mapping, failed publication, cross-tenant denial, service-account denial, and permission-boundary preservation.
- Browser evidence where mode state affects visible workflow.
- Existing standalone and frontend readiness gates must continue to pass.

## Required Scripts/Gates

- `pnpm mode:adapter-readiness`
- `pnpm standalone:workflow-readiness`
- `pnpm frontend:primary-runtime-readiness`
- `pnpm clinicos:integration-readiness`
- Default local gate applicable to touched files.
- `pnpm production:readiness`
- `node scripts/status.js`

## Definition Of Done

- Runtime services use `ModeResolver` and adapter boundaries where required.
- Standalone mode still works.
- ClinicOS mock/degraded paths are testable and permission-bound.
- No live ClinicOS, raw payload, delegated identity bypass, claim submission, autonomous finalization, or production launch behavior is introduced.
- Status, run-log, docs, tests, and readiness scripts are updated.

## Stop Conditions

- Live ClinicOS module contract, delegated identity policy, event-bus semantics, or production credential behavior is required.
- A mode boundary would weaken AURA Note tenant/site, purpose-of-use, RBAC, ABAC, or human-review gates.
- Three focused repair attempts fail.

## Risks And Deferred Decisions

- Live ClinicOS contracts, event-bus semantics, M03/M04/M17/M21/M23/M24/M25/M26 production mappings, delegated identity, replay/reconciliation ownership, and operational support remain deferred.

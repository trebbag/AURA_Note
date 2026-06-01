# WO-069 — Athenahealth Sandbox And Vendor-Neutral EHR Runtime Boundary

## Objective

Harden the EHR adapter path around athenahealth-first sandbox readiness while preserving vendor-neutral interfaces.

## Why This Work Order Exists

Commercial EHR use needs sandbox-shaped behavior, human approval, retry/dead-letter, reconciliation, disabled credential handling, and operational evidence without enabling production writeback or hard-coding athenahealth into the domain model.

## Prerequisites

- `WO-068` transcription runtime boundary complete.
- Current EHR adapter interfaces, mock/sandbox writeback queue, final-note/patient-summary export evidence, RBAC/ABAC matrix, and event contracts.
- Current `docs/BACKEND_BUILD_SPEC.md`, `docs/API_EVENT_CONTRACTS.md`, `docs/DATA_MODEL.md`, `docs/RBAC_ABAC_MATRIX.md`, and `docs/STANDALONE_AND_CLINICOS_MODES.md`.

## In Scope

- Athenahealth-first sandbox-shaped adapter behavior behind a vendor-neutral EHR adapter interface.
- Disabled credential handling and explicit fail-closed behavior.
- Patient lookup, appointment import, encounter context, chart context slices, and note/patient-summary writeback queue metadata where already supported by contracts.
- Human approval gates before writeback preparation or delivery.
- Retry, dead-letter, reconciliation-needed, acknowledgement, and support metadata states.
- `pnpm ehr:sandbox-runtime-readiness`.

## Out Of Scope

- Production EHR credentials.
- Raw EHR payload storage.
- Live EHR writeback.
- Autonomous final note, code, charge, claim, or medical-necessity finalization.
- Hard-coded athenahealth domain assumptions that would block vendor-neutral adapters.

## UX Requirements

- Browser-visible EHR states for disabled, configured, degraded, failed, approval-required, denied, pending, delivered, dead-lettered, reconciliation-needed, permission-denied, read-only, loading, empty, ready, and demo fixture.
- Human approval remains explicit before writeback-facing actions.
- Support views show operational metadata only.

## Backend/API Requirements

- EHR calls must be adapter-mediated, tenant/site scoped, permission checked, purpose-of-use checked, idempotent where retryable, audit logged, and event emitting.
- Credentials remain disabled or metadata-only unless a later approved work order provides real credentials.
- Writeback queue APIs must preserve human-review gates and fail closed without configured sandbox credentials.

## Data Model/Persistence Requirements

- Configuration metadata, credential-reference metadata, writeback approval/denial, attempts, acknowledgements, dead-letter, reconciliation, and support evidence must be represented consistently with the current data model.
- No production EHR payloads, real PHI, credentials, private keys, production URLs, or raw vendor responses are persisted.

## Event/Audit Requirements

- Record config reviewed, credential disabled, payload prepared, approval/denial, delivery attempt, failure, dead-letter, reconciliation, and incident evidence as audit-safe metadata.
- Event payloads must exclude raw EHR payloads, credentials, production vendor responses, claim submission, charge finalization, or medical-necessity decisions.

## RBAC/ABAC Requirements

- Only authorized clinicians/admins can approve writeback-facing actions.
- Support remains operational metadata only.
- ClinicOS-integrated mode cannot bypass AURA Note writeback approval or permissions.

## Standalone-Mode Behavior

- Standalone mode can run with EHR disabled and still complete documentation, finalization, exports, and draft claim preview.
- Sandbox/mock EHR context may be shown as degraded or disabled without blocking standalone workflows.

## ClinicOS-Integrated Behavior

- Future ClinicOS/M25 routing remains adapter-bound.
- ClinicOS cannot bypass AURA Note identity, role, human approval, writeback, or audit boundaries.

## AI/PHI/Security Requirements

- No raw EHR payload storage.
- No autonomous clinical, coding, billing, charge, claim, or medical-necessity finalization.
- Logs remain redacted and request/trace correlated.
- Synthetic fixtures only.

## Testing Requirements

- Unit/integration tests for sandbox adapter contracts, disabled credentials, approval gates, retry/dead-letter/reconciliation states, role denial, no raw payload logging, and vendor-neutral interface preservation.
- Browser/e2e tests for the EHR integration route states and human approval gates.
- Regression tests proving standalone mode is not blocked by disabled EHR credentials.

## Required Scripts/Gates

- `pnpm ehr:sandbox-runtime-readiness`
- `pnpm ehr:integration-readiness`
- `pnpm mode:adapter-readiness`
- Default local gate applicable to touched files.
- `pnpm production:readiness`
- `node scripts/status.js`

## Definition Of Done

- EHR sandbox path is production-shaped, adapter-mediated, vendor-neutral, permission-checked, human-review-gated, and safely disabled/mockable.
- Retry, dead-letter, reconciliation, audit/event, docs, status, and run-log evidence are updated.
- No live EHR credential, raw EHR payload storage, live writeback, claim submission, charge finalization, medical-necessity determination, autonomous clinical/coding/billing behavior, or production launch behavior is introduced.

## Stop Conditions

- Production credentialing, live vendor access, writeback payload policy, raw payload retention policy, or legal/privacy approval is required.
- A writeback path would weaken tenant/site scope, RBAC/ABAC, human approval, PHI redaction, auditability, or standalone/ClinicOS boundaries.
- Three focused repair attempts fail.

## Risks And Deferred Decisions

- Production credentialing, vendor acknowledgements, sandbox account availability, raw EHR payload retention policy, reconciliation policy, and legal/privacy review remain deferred.

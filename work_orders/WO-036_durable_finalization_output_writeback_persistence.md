# WO-036 — Durable Finalization, Output Metadata, And Writeback Queue Persistence

## Objective

Persist finalization runs, wizard decisions, enhanced note versions, patient summary versions, billing attestations, draft claim previews, export artifacts, and EHR writeback queue metadata through Prisma/local PostgreSQL.

## Why this work order exists

`WO-006` through `WO-008` made finalization, signed-output, export, and writeback queue behavior browser/API-testable with synthetic state. `WO-034` and `WO-035` moved visit capture and review-panel slices into durable local persistence. Finalization and output state must survive process restarts before P7 can be claimed.

## Prerequisites

- `WO-035` complete.
- Finalization/output/writeback Prisma schema relations from `WO-026` and `WO-027`.
- Existing finalization, draft-claim-preview, export, writeback, role-visibility, and no-claim-submission tests passing.

## In scope

- Prisma-backed local adapters for `FinalizationRun`, `WizardStepDecision`, `EnhancedNoteVersion`, `PatientSummaryVersion`, `BillingAttestation`, `DraftClaimPreview`, `ExportArtifact`, and `EhrWritebackJob`.
- Durable start, wizard decision, compose/re-beautify metadata, approval, Billing & Attest, draft claim preview, signed output, export artifact, and writeback queue state.
- Transaction and error-path tests for immutable signed outputs, duplicate finalize/export/writeback replay, and blocked signing paths.
- Tenant/site query filters for every persisted finalization/output/writeback read/write.
- Cross-tenant and cross-site denial tests at repository and API-harness layers.
- RLS SQL artifact and local PostgreSQL evidence for finalization/output/writeback tables.
- Readiness script `pnpm persistence:finalization-output-adapter`.

## Out of scope

- Live EHR writeback.
- Live claim submission.
- Charge finalization.
- Medical-necessity determination.
- Production PHI persistence.
- Clearinghouse, payer, denial-management, or payment workflows.

## UX requirements

- Existing Finalization Wizard, finalized-note viewer, export/copy/PDF, draft claim preview, and writeback queue browser/API states must continue to pass tests.
- Reloaded durable state must preserve read-only finalized states, approved summaries, draft-claim-preview disclaimers, writeback failure/disabled states, and export metadata.

## Backend/API requirements

- Finalization/output/writeback actions must validate input, enforce tenant/site scope, enforce permissions, and emit audit/event evidence.
- Billing & Attest must preserve `submittedClaim = false`.
- Signed output metadata must be immutable once dispatch completes.
- Writeback queue operations remain mock/disabled unless explicitly configured and human-approved.

## Data model/persistence requirements

- Persist `FinalizationRun`, `WizardStepDecision`, `EnhancedNoteVersion`, `PatientSummaryVersion`, `BillingAttestation`, `DraftClaimPreview`, `ExportArtifact`, and `EhrWritebackJob` rows through Prisma/local PostgreSQL.
- Preserve source references, frozen snapshots, approvals, unused audit items, signed-output metadata, storage-delivery metadata, draft-claim disclaimers, queue status, failure reason, retry posture, note/site/tenant references, and idempotency where applicable.
- Add query indexes or constraints needed for tenant/site, note, finalization run, export, and writeback lookup.

## Event/audit requirements

- Persist or emit audit-safe evidence for finalization start, wizard decisions, step completion, compose/re-beautify, final note approval, patient summary approval, draft claim preview generation, billing attestation, signing, dispatch, export generation, and writeback queued/failed states.
- Event payloads must not claim live claim submission, live EHR writeback, charge finalization, or medical-necessity determination.

## RBAC/ABAC requirements

- Treating clinicians and authorized admins can manage finalization when linked and permitted.
- Billing staff transcript access remains limited to billing-review-triggered contexts.
- Final note and patient summary access must respect linkage and role.
- Cross-tenant and cross-site reads/writes are denied before DTO exposure.

## Standalone-mode behavior

Standalone mode owns finalization records, signed-output metadata, export artifacts, draft claim previews, and writeback queue state.

## ClinicOS-integrated behavior

Writeback queue records remain mappable through EHR/ClinicOS adapter boundaries. ClinicOS must not bypass AURA Note tenant/site/RBAC/ABAC checks.

## AI/PHI/security requirements

Patient summaries must exclude internal billing, revenue, coaching, confidence, and unsupported suggestion details. No raw PHI may be sent to external AI. Logs must be redacted and correlated.

## Testing requirements

- Unit tests for repository mapping and finalization/output invariants.
- Local PostgreSQL integration tests for reload, immutable signed outputs, draft claim preview `submittedClaim = false`, billing-review-triggered transcript access metadata, writeback disabled/failure states, and transaction/error paths.
- Cross-tenant and cross-site denial tests.
- RLS read, insert, and update denial tests.
- API-harness tests proving denied persisted records are not exposed as DTOs.
- Browser/e2e regression for current finalization/export/writeback workflows.

## Required scripts/gates

- `pnpm persistence:finalization-output-adapter`
- `pnpm persistence:tenant-isolation`
- `pnpm acceptance:readiness`
- `pnpm production:readiness`
- Full standard local gate from `docs/PRODUCTION_BUILD_PLAN.md`.

## Definition of Done

- Finalization, signed-output, export metadata, draft claim preview, and writeback queue state are locally durable through Prisma/PostgreSQL.
- Tenant/site repository and API-harness denial tests pass.
- Finalization/output/writeback RLS policy artifact and evidence tests pass.
- Existing finalization/export/writeback UX remains browser-testable.
- No live EHR writeback, live claim submission, charge finalization, medical-necessity determination, autonomous coding/billing, live AI, live ClinicOS sync, or production PHI storage is introduced.
- `RUN_LOG.md`, `repo_status.json`, relevant docs, and readiness scripts are updated.
- CI passes before merge.

## Stop conditions

- Missing/unsafe policy for legal attestation, billing responsibility, draft claim preview, signed-output immutability, or writeback approval blocks implementation.
- RLS or tenant/site enforcement cannot be proven after three focused repair attempts.
- A schema/API conflict would require guessing clinical, privacy, billing, legal, or compliance behavior.

## Risks and deferred decisions

- Clearinghouse, payer, denial-management, and claim-submission strategy remains deferred to `WO-051`.
- Production PHI database approval remains deferred.
- Live EHR writeback credentials and vendor-specific behavior remain deferred.

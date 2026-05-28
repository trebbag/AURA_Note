# WO-044 — EHR Sandbox Integration And Writeback Queue Hardening

## Objective

Harden the athenahealth-first sandbox integration path, vendor-neutral EHR adapter boundary, and human-approved writeback queue without enabling live production EHR writeback.

## Why this exists

P9 begins after the P8 platform candidate. AURA Note needs a production-shaped EHR integration boundary that can operate in standalone mode, accept sandbox configuration when available, queue writeback safely, and preserve human approval, idempotency, retries, dead-letter evidence, reconciliation, and audit before any live vendor use.

## Prerequisites

- P8 production platform candidate is complete through `WO-043`.
- No active `SPEC_GAP` blocks athenahealth sandbox scope, writeback approval, reconciliation, or EHR permission behavior.
- No live production EHR credentials are required for this work order.

## In Scope

- athenahealth-first sandbox adapter hardening with deterministic mock/sandbox-ready behavior.
- Vendor-neutral EHR adapter interface refinements where needed.
- Writeback queue states for pending, approved, retrying, failed, dead-lettered, reconciled, and disabled.
- Human approval before writeback delivery.
- Idempotency, retry, dead-letter, reconciliation, and audit/event evidence.
- Browser/API-testable EHR integration status and queue states.

## Out Of Scope

- Live production EHR writeback.
- Production athenahealth credentials or production patient data.
- Hard-coding athenahealth into domain logic.
- Autonomous note submission, coding finalization, charge finalization, medical-necessity determination, or claim submission.

## UX Requirements

- Integration/status views must expose empty, loading, ready, degraded, failed, permission-denied, disabled, retrying, dead-letter, reconciled, and demo fixture states.
- Writeback-facing controls must clearly show that human approval is required and live delivery is disabled unless explicitly configured.
- No patient-facing or support-facing view may expose PHI-bearing writeback payloads.

## Backend/API Requirements

- Keep `/integrations/ehr/status` and chart context behavior intact.
- Add or harden backed endpoints for writeback queue inspection, approval, retry/dead-letter/reconciliation metadata, and disabled/sandbox status.
- Every state-changing action must be tenant/site scoped, permission checked, idempotent where repeat submissions are plausible, audit logged, and event emitting.
- Adapter calls must use mock or sandbox-safe behavior by default.

## Data Model/Persistence Requirements

- Represent writeback queue metadata, approval evidence, retry/dead-letter state, reconciliation identifiers, and adapter status as audit-safe metadata.
- Persisted tenant-owned metadata must remain tenant/site scoped and align with current RLS patterns when persistence is used.
- Do not persist live PHI payloads, production credentials, private keys, or production endpoints.

## Event/Audit Requirements

- Emit audit/domain evidence for adapter status checked, writeback queued, writeback approval recorded, retry scheduled, dead-letter recorded, reconciliation checked, and writeback disabled/failed.
- Event payloads must remain audit-safe metadata only.

## RBAC/ABAC Requirements

- Treating clinicians or authorized admins may queue/approve writeback when linked to the visit and permitted.
- Compliance/privacy/admin roles may view audit-safe integration status.
- Support users may view operational metadata only and cannot access PHI-bearing note, transcript, billing, or writeback payloads.
- ClinicOS-integrated mode must not bypass AURA Note permissions.

## Standalone-Mode Behavior

- Standalone mode remains fully functional when EHR is disabled.
- Sandbox/mock chart context and writeback queue behavior may be used for local evidence.

## ClinicOS-Integrated Behavior

- ClinicOS may receive integration status through adapter boundaries later, but AURA Note remains authoritative for note/writeback approval and permission checks.
- Missing ClinicOS delegation must fail closed.

## AI/PHI/Security Requirements

- No raw PHI is sent to external AI or EHR vendors.
- No production EHR credentials, `.env` files, private keys, production URLs, or real patient records may be committed.
- Logs and writeback evidence must be redacted and trace-correlated.

## Testing Requirements

- Unit/API tests for EHR adapter status, writeback approval, idempotency, retry/dead-letter/reconciliation states, role denials, cross-tenant denial, and disabled/sandbox behavior.
- Browser tests for integration/queue states and permission-denied/degraded modes.
- Contract/OpenAPI/event tests for any new endpoint or DTO.
- Readiness script for EHR sandbox/writeback hardening evidence.

## Required Scripts/Gates

- Add `pnpm ehr:integration-readiness` or equivalent.
- Run the standard local gate:
  - `pnpm install --frozen-lockfile`
  - `pnpm db:client:generate`
  - `pnpm lint`
  - `pnpm lint:phi`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm test:e2e`
  - `pnpm test:browser`
  - `pnpm build`
  - all persistence/storage/retention/identity/config/observability/readiness scripts
  - `pnpm production:readiness`
  - `pnpm acceptance:readiness`
  - `node scripts/status.js`
  - `git diff --check`

## Definition Of Done

- EHR sandbox/writeback queue behavior is browser/API-testable with synthetic data.
- Human approval, idempotency, retry/dead-letter/reconciliation, audit/event, and role-denial evidence exists.
- Live production EHR writeback remains disabled unless a later explicitly approved work order authorizes it.
- `RUN_LOG.md`, `repo_status.json`, relevant docs, scripts, tests, and work-order status are updated.

## Stop Conditions

- Live production EHR credentials or production patient data are required.
- athenahealth sandbox scope, writeback approval policy, reconciliation, or PHI payload handling is missing or contradictory in a way that blocks safe implementation.

## Risks And Deferred Decisions

- Production athenahealth credentialing, writeback scope, reconciliation ownership, vendor error taxonomy, and live rollout approval require founder/security/privacy/vendor review before production use.

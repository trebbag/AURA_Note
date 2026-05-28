# WO-045 — ClinicOS Integration Hardening

## Objective

Harden AURA Note ClinicOS-integrated mode through explicit adapter boundaries, mode mappings, event publication metadata, and permission-preserving degraded states without turning AURA Note into a second app or letting ClinicOS bypass AURA Note permissions.

## Why this exists

AURA Note must be built once and support standalone and ClinicOS-integrated modes. `WO-044` hardens the EHR sandbox/writeback boundary; the next P9 tranche must prove that ClinicOS integration with M03 VisitGraph, M04 WorkOS/tasks, M17 NP Cockpit, M21 Charge Integrity, M23 Copilot Runtime, M24 AI Governance, M25 Integration Hub, and M26 Data Cloud remains explicit, testable, tenant scoped, and permission safe.

## Prerequisites

- `WO-044` is complete and `repo_status.json` marks `WO-045` as the next active work order.
- P7 durable runtime, P7.5 standalone completion, P8.5 audio/transcription candidate, and P8 production-platform control evidence remain passing.
- No live ClinicOS credential, production event bus, production patient data, or production integration endpoint is required for this work order.

## In Scope

- Harden existing ClinicOS mode resolver and adapter contracts for standalone, mock ClinicOS, unavailable/degraded ClinicOS, and disabled delegation states.
- Add or harden API behavior for ClinicOS integration status, mappings, event publication metadata, stale mapping detection, failed/degraded publication metadata, and permission-preserving embedded-mode context.
- Add browser-testable ClinicOS integration status and mapping states.
- Add typed DTO/OpenAPI/event coverage for ClinicOS mapping, event publication, stale/degraded states, and M03/M04/M17/M21/M23/M24/M25/M26 module boundaries.
- Add deterministic tests for standalone/integrated parity, cross-tenant delegation denial, stale mapping, unavailable ClinicOS, failed publication, and service-account permission limits.
- Add a readiness script such as `pnpm clinicos:integration-readiness`.

## Out Of Scope

- Building ClinicOS modules inside this repo.
- Live ClinicOS credentials, production event bus, production tenant mapping, or production patient data.
- Allowing ClinicOS to bypass AURA Note RBAC/ABAC, PHI, audit, idempotency, or human-review gates.
- Live EHR writeback through ClinicOS.
- Autonomous diagnosis, coding, charge finalization, medical-necessity determination, or claim submission.

## UX Requirements

- Add or harden browser-visible ClinicOS integration surfaces with empty, loading, ready, saving, degraded, failed, permission-denied, disabled, stale mapping, read-only, and demo fixture states.
- Make standalone mode visibly authoritative when ClinicOS is disabled or unavailable.
- Show embedded-mode context as metadata only: ClinicOS module IDs, mapping state, last sync/publication status, and safe degraded reasons.
- Do not expose transcripts, final notes, billing details, coaching outputs, raw ClinicOS payloads, or PHI-bearing integration content to unauthorized roles or support users.

## Backend/API Requirements

- Preserve existing `/integrations/clinicos/status` and mapping behavior.
- Add or harden backed endpoints or service methods for ClinicOS mapping validation, stale mapping review, event publication metadata, failed/degraded publication metadata, and service-account denial paths.
- Every state-changing action must be tenant/site scoped, permission checked, audit logged, event emitting, and idempotent where repeated publication or mapping writes are plausible.
- Adapter behavior must remain mock or disabled-safe by default and must fail closed when delegated identity or ClinicOS availability is missing.

## Data Model/Persistence Requirements

- Use the existing durable metadata shape for `ModeMapping`, `IntegrationConnection`, `DomainEvent`, and audit-safe support/config records where possible.
- Represent ClinicOS mapping rows as tenant/site scoped metadata, including AURA Note local IDs, ClinicOS module family, ClinicOS external references, mapping status, stale/degraded reason, trace ID, and last checked/published timestamps.
- Do not persist raw ClinicOS payloads, live credentials, private keys, production URLs, or real patient identifiers.
- RLS or tenant/site isolation evidence must remain aligned with the P7 durable metadata patterns for any persisted tenant-owned mapping state.

## Event/Audit Requirements

- Emit or harden audit/domain evidence for mode resolution, mapping recorded, event publication queued/sent/skipped/failed, ClinicOS unavailable, stale mapping detected, and permission-denied service-context attempts.
- Event payloads must remain audit-safe metadata only.
- Do not emit final clinical/coding/billing conclusions or raw ClinicOS/EHR payloads.

## RBAC/ABAC Requirements

- ClinicOS service contexts must be explicitly represented and must not bypass AURA Note tenant/site/role/purpose checks.
- Authorized admins/service accounts may record integration metadata where permitted.
- Ordinary clinicians may view only linked embedded context needed for treatment workflow.
- Support users may view operational metadata only and cannot access PHI-bearing payloads, transcripts, final notes, billing details, coaching outputs, or raw ClinicOS messages.

## Standalone-Mode Behavior

- Standalone mode remains fully functional with ClinicOS disabled.
- Standalone-owned tenant, patient, schedule, note, finalization, export, task, coaching, audit, and writeback behavior must not depend on ClinicOS.
- Disabled ClinicOS status should produce safe degraded metadata, not broken workflow.

## ClinicOS-Integrated Behavior

- ClinicOS-integrated mode maps AURA Note objects to M03 VisitGraph, M04 WorkOS/tasks, M17 NP Cockpit, M21 Charge Integrity, M23 Copilot Runtime, M24 AI Governance, M25 Integration Hub, and M26 Data Cloud through adapter boundaries only.
- AURA Note remains authoritative for note approval, finalization gates, writeback approval, task blockers, PHI boundary, AI governance handoff, and permission checks.
- Missing or stale ClinicOS mappings fail closed or degrade safely until reviewed.

## AI/PHI/Security Requirements

- No raw PHI is sent to ClinicOS, external AI, EHR vendors, or analytics vendors outside documented mock/synthetic boundaries.
- No production ClinicOS credential, `.env`, private key, production URL, or real patient data may be committed.
- Any AI governance handoff to M23/M24 remains metadata-only and draft/candidate/human-review-required unless later approved work authorizes governed live behavior.
- Logs and integration evidence must be PHI-safe and trace correlated.

## Testing Requirements

- Unit and API tests for mode resolution, mapping write/read, stale mapping, unavailable ClinicOS, failed publication, idempotency, permission denial, service-account scope, and cross-tenant denial.
- Contract/OpenAPI/event tests for any new DTO, operation, or event.
- Browser tests for ClinicOS integration status and mapping/degraded states.
- Security tests proving ClinicOS cannot bypass AURA Note permissions.
- Readiness script coverage for no live credentials, no raw ClinicOS payloads, status/run-log evidence, and no prohibited clinical/billing behavior.

## Required Scripts/Gates

- Add `pnpm clinicos:integration-readiness` or an equivalent named verifier.
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
  - all persistence/storage/retention/identity/config/observability/EHR/readiness scripts
  - `pnpm production:readiness`
  - `pnpm acceptance:readiness`
  - `node scripts/status.js`
  - `git diff --check`

## Definition Of Done

- ClinicOS integration hardening is browser/API-testable with synthetic data.
- Standalone mode still works with ClinicOS disabled.
- ClinicOS-integrated mode is represented through adapter boundaries and cannot bypass AURA Note permissions.
- Mapping, stale/degraded publication, audit/event, idempotency, role-denial, and cross-tenant evidence exists.
- Live ClinicOS credentials, live production sync, raw ClinicOS payload storage, live writeback, autonomous clinical/coding/billing behavior, and claim submission remain disabled.
- `RUN_LOG.md`, `repo_status.json`, relevant docs, scripts, tests, and work-order status are updated.

## Stop Conditions

- Live ClinicOS credentials, production event bus access, or production patient data are required.
- ClinicOS module contracts conflict with AURA Note source-of-truth permissions or safety gates.
- Required mapping behavior is missing or ambiguous in a way that would require inventing product policy.
- Three focused repair attempts fail to resolve a build, test, migration, or runtime blocker.

## Risks And Deferred Decisions

- Live ClinicOS availability, module contract finalization, production identity delegation, operational ownership, event-bus delivery semantics, replay/reconciliation ownership, and Data Cloud analytics posture remain deferred to founder/security/privacy/ClinicOS review before live use.

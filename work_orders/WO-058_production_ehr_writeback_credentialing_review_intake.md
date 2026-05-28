# WO-058 — Production EHR Writeback Credentialing Review Intake

## Objective

Promote production EHR writeback credentialing review into a planning/control decision package without enabling production EHR credentials, raw EHR payload storage, live writeback delivery, autonomous finalization, claim submission, runtime EHR behavior, or production launch behavior.

## Why this work order exists

`WO-044` created a metadata-only EHR sandbox integration and writeback queue hardening path. Commercial EHR delivery now needs a governed credentialing, adapter, human-approval, idempotency, retry/dead-letter, reconciliation, audit, and support decision package before any live vendor implementation can safely begin.

## Prerequisites

- `WO-057` complete and merged.
- P11 retained with no active production-launch claim.
- No active `SPEC_GAP` blocks planning/control work.

## In scope

- Production EHR writeback credentialing review document.
- Vendor credentialing, credential source, adapter scope, writeback payload, human approval, idempotency, retry, dead-letter, reconciliation, sandbox/staging/prod promotion, support, and audit/event decision inventory.
- Future acceptance criteria for governed live EHR implementation.
- Readiness verifier, CI script hook, status, plan, index, run-log, checkpoint, and SPEC_GAPS updates.

## Out of scope

- Production EHR credentials.
- `.env` files, private keys, secret-manager integration, real vendor credentials, live vendor API calls, raw EHR payload storage, live writeback delivery, writeback without human approval, runtime EHR behavior, schema changes, migrations, claim submission, charge finalization, medical-necessity determination, autonomous clinical/coding/billing finalization, or production launch approval.

## UX requirements

No new route. Future operational UX must expose disabled, configured, degraded, failed, approval-required, denied, pending-delivery, delivered, dead-lettered, reconciliation-needed, permission-denied, and read-only states through typed API clients and persisted backend state before any launch claim.

## Backend/API requirements

No new endpoint. Future live writeback operations must be tenant/site scoped, permission checked, purpose-of-use checked, server mediated, idempotent where retries are plausible, audit/event emitting, fail closed when credentials/mappings/context are missing, and preserve human approval before delivery.

## Data model/persistence requirements

No schema change. Future work must define vendor configuration metadata, credential reference metadata, writeback scope approvals, payload preparation metadata, human approval/denial records, delivery attempts, vendor acknowledgements, retry/dead-letter records, reconciliation records, attachment/task handoff metadata, support evidence, and incident records.

## Event/audit requirements

Inventory future EHR events including vendor config reviewed, credential configured/disabled, writeback scope approved, payload prepared, writeback approved/denied, idempotency replayed, request sent/failed, delivery confirmed, dead-lettered, reconciliation completed, attachment exported, task handoff created, and EHR incident recorded.

## RBAC/ABAC requirements

Preserve current role boundaries and require future clinician/authorized approver controls for writeback approval, authorized-admin/integration-admin controls for vendor configuration, compliance/privacy controls for review, billing controls only where billing review is triggered, and support-scope limits for operational metadata.

## Standalone-mode behavior

Standalone remains metadata-only/mock for live EHR delivery until a future approved implementation work order enables a governed vendor path. AURA Note remains the source of tenant/site writeback configuration, approval policy, idempotency, audit, reconciliation, and support controls.

## ClinicOS-integrated behavior

ClinicOS-integrated mode may provide context and receive writeback status through adapters, but cannot bypass AURA Note permissions, tenant/site scoping, purpose-of-use checks, human approval, idempotency, PHI policy, audit evidence, reconciliation, or support-access limits.

## AI/PHI/security requirements

No real PHI, credentials, tokens, production URLs, `.env`, private keys, live vendor calls, raw EHR payload storage, live writeback delivery, external AI change, autonomous clinical/coding/billing behavior, medical-necessity determination, claim submission, or launch approval.

## Testing requirements

EHR live-review readiness verifier plus EHR integration, post-P11, production, acceptance, status, and whitespace gates.

## Required scripts/gates

- `pnpm ehr:live-review-readiness`
- `pnpm post-p11:readiness`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `node scripts/status.js`
- `git diff --check`

## Definition of Done

Decision package exists, `WO-058` is indexed and marked done, `next_work_order` remains `null`, readiness scripts pass, and no production EHR credential, raw EHR payload storage, live writeback delivery, writeback without human approval, runtime EHR behavior, autonomous finalization, claim submission, or launch behavior is authorized.

## Stop conditions

Production credential selection, live vendor credential, live SDK/API execution, raw EHR payload retention, writeback without human approval, vendor contracting, legal/privacy/security policy, rollback/reconciliation policy, claim/charge submission policy, or production launch approval is required before implementation.

## Risks and deferred decisions

Production athenahealth credentialing, credential source, vendor-neutral adapter scope, approved writeback object types, raw payload retention policy, human approval role, idempotency strategy, retry/dead-letter policy, reconciliation ownership, vendor acknowledgement handling, attachment/task semantics, support visibility, incident response, and operational ownership remain deferred.

# WO-059 — ClinicOS Live Integration Review Intake

## Objective

Promote ClinicOS live integration review into a planning/control decision package without enabling live ClinicOS credentials, live ClinicOS event-bus delivery, delegated identity bypass, raw ClinicOS payload storage, live synchronization, runtime ClinicOS behavior, or production launch behavior.

## Why this work order exists

`WO-045` created synthetic/browser/API-testable ClinicOS integration hardening evidence. Commercial embedded use now needs governed live module contracts, delegated identity posture, service-account governance, tenant/user mapping, event-bus delivery, replay/reconciliation, degraded-mode, audit, and support decisions before any live implementation can safely begin.

## Prerequisites

- `WO-058` complete and merged.
- P11 retained with no active production-launch claim.
- No active `SPEC_GAP` blocks planning/control work.

## In scope

- Production ClinicOS live integration review document.
- M03/M04/M17/M21/M23/M24/M25/M26 module contract inventory.
- Delegated identity, service-account, tenant/site/user/patient mapping, event-bus delivery, replay/reconciliation, degraded-mode, support, observability, and audit decision inventory.
- Future acceptance criteria for governed live ClinicOS implementation.
- Readiness verifier, CI script hook, status, plan, index, run-log, checkpoint, and SPEC_GAPS updates.

## Out of scope

- Live ClinicOS credentials, `.env` files, private keys, secret-manager integration, live event-bus calls, live synchronization, raw ClinicOS payload storage, delegated identity bypass, runtime ClinicOS behavior, schema changes, migrations, external AI change, EHR writeback delivery, claim submission, charge finalization, medical-necessity determination, autonomous clinical/coding/billing finalization, or production launch approval.

## UX requirements

No new route. Future embedded UX must expose standalone, embedded, unavailable, stale, degraded, replay-needed, reconciliation-needed, permission-denied, approval-required, failed-publication, and read-only states through typed API clients and persisted backend state before any launch claim.

## Backend/API requirements

No new endpoint. Future live ClinicOS operations must be tenant/site scoped, permission checked, purpose-of-use checked, server mediated, idempotent where replay is plausible, audit/event emitting, fail closed when credentials/mappings/context are missing, and preserve AURA Note permissions as authoritative.

## Data model/persistence requirements

No schema change. Future work must define module contract metadata, service-account reference metadata, delegated identity mappings, tenant/site/user/patient mappings, source freshness records, publication attempts, acknowledgements, retry/dead-letter records, replay requests, reconciliation records, degraded-mode records, support evidence, and incident records.

## Event/audit requirements

Inventory future ClinicOS events including module contract reviewed, service account configured/disabled, delegated identity reviewed, tenant/site/user/patient mapping reviewed, VisitGraph/WorkOS/Charge Integrity/Copilot/Governance/Integration Hub/Data Cloud mapping reviewed, event publication authorized/denied/failed, replay requested, reconciliation completed, degraded mode entered, and incident recorded.

## RBAC/ABAC requirements

Preserve current role boundaries and require future authorized-admin/integration-admin controls for live configuration, service-account controls for publication only within least-privilege scope, compliance/privacy controls for review, clinician/MA/billing visibility only where AURA Note permissions allow, and support-scope limits for operational metadata.

## Standalone-mode behavior

Standalone remains fully supported and cannot become dependent on ClinicOS for core AURA Note v1 workflows. Missing ClinicOS mappings or unavailable ClinicOS services must degrade safely without blocking standalone documentation/finalization/export behavior unless a future approved work order explicitly defines that dependency.

## ClinicOS-integrated behavior

ClinicOS-integrated mode may receive context and publish status through adapters only after future approval. It cannot bypass AURA Note permissions, tenant/site scoping, purpose-of-use checks, human approval gates, AI/PHI policy, audit evidence, reconciliation, or support-access limits.

## AI/PHI/security requirements

No real PHI, credentials, tokens, production URLs, `.env`, private keys, live event-bus calls, raw ClinicOS payload storage, live synchronization, external AI change, autonomous clinical/coding/billing behavior, medical-necessity determination, claim submission, or launch approval.

## Testing requirements

ClinicOS live-review readiness verifier plus ClinicOS integration, post-P11, production, acceptance, status, and whitespace gates.

## Required scripts/gates

- `pnpm clinicos:live-review-readiness`
- `pnpm clinicos:integration-readiness`
- `pnpm post-p11:readiness`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `node scripts/status.js`
- `git diff --check`

## Definition of Done

Decision package exists, `WO-059` is indexed and marked done, `next_work_order` remains `null`, readiness scripts pass, and no live ClinicOS credential, live event-bus delivery, delegated identity bypass, raw ClinicOS payload storage, live synchronization, runtime ClinicOS behavior, autonomous finalization, claim submission, or launch behavior is authorized.

## Stop conditions

Live ClinicOS credential selection, service-account configuration, live event-bus execution, delegated identity policy, raw ClinicOS payload retention, module contract approval, tenant/user mapping policy, replay/reconciliation policy, legal/privacy/security policy, claim/charge submission policy, or production launch approval is required before implementation.

## Risks and deferred decisions

Live ClinicOS module contracts, delegated identity posture, service-account governance, tenant/site/user/patient mapping, event-bus delivery, replay/reconciliation ownership, degraded-mode policy, raw payload retention policy, Data Cloud analytics boundary, support visibility, incident response, and operational ownership remain deferred.

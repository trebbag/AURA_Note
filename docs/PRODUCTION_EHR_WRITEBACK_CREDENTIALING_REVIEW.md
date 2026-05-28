# Production EHR Writeback Credentialing Review

## Purpose

This document is the `WO-058` planning/control intake for future production EHR writeback credentialing and live delivery. It does not enable production EHR credentials, raw EHR payload storage, live writeback delivery, autonomous finalization, claim submission, runtime EHR behavior, or production launch behavior.

The current safe posture remains the `WO-044` metadata-only writeback queue with human approval, idempotency, retry, dead-letter, reconciliation, role-denial, PHI rejection, and audit/event evidence. Any future live EHR work requires a new approved implementation work order with the decisions and evidence below.

## Review scope

### Production athenahealth credentialing and vendor posture

Future implementation must document the selected vendor environment, athenahealth production credential path, sandbox/staging/prod promotion model, vendor account ownership, support escalation, rate limits, allowed writeback targets, and vendor change-control process.

### Vendor-neutral EHR adapter scope

athenahealth remains the first target, but domain logic must continue to use the vendor-neutral EHR adapter boundary. Future work must document which writeback behaviors are generic, which are vendor-specific, and how unsupported vendors safely degrade without bypassing AURA Note permissions.

### Credential source and secret handling

Future live work must define the secret manager, credential rotation cadence, disabled credential behavior, environment separation, least-privilege service account, audit visibility, and operator runbook. Credentials must not be committed, logged, returned to clients, embedded in `.env` files, or used in tests without explicit governed configuration.

### Writeback scope and payload policy

Future implementation must define allowed writeback object types, payload minimization, redaction/normalization, attachment semantics, task/order boundaries, source references, patient identifiers, tenant/site mappings, and prohibited payload fields. Raw EHR payload storage remains disallowed until a separate privacy/security decision authorizes retention, redaction, access, and deletion controls.

### Human approval and role boundaries

Live writeback must require human approval from the correct role before delivery. Future tests must deny unsupported roles, wrong-tenant users, wrong-site users, disabled users, missing purpose-of-use contexts, support users, and ClinicOS delegated contexts that do not satisfy AURA Note permissions.

### Idempotency, retry, dead-letter, and reconciliation

Future live delivery must define idempotency key scope, replay behavior, retry windows, non-retryable error taxonomy, dead-letter ownership, reconciliation cadence, duplicate detection, vendor acknowledgement handling, rollback/support process, and user-visible failed/degraded states.

### Attachment, document, and task semantics

Future implementation must decide whether final notes, patient summaries, payer-readable support language, task handoffs, and attachment exports are delivered as documents, notes, tasks, encounters, messages, or vendor-specific objects. Claim submission, charge finalization, medical-necessity determination, and autonomous coding finalization remain out of scope.

### Sandbox, staging, and production promotion

Future live work must define sandbox test evidence, staging credential approval, production credential approval, release checklist, rollback criteria, monitoring, incident response, and approval evidence before production use.

### Error taxonomy and support operations

Future implementation must define vendor error classes, user-facing error states, support metadata visibility, escalation paths, audit-safe redaction, support access limits, incident severity, and operational dashboards.

### Audit/events and evidence retention

Future implementation must persist audit-safe delivery metadata, vendor acknowledgement references, approval evidence, denial evidence, retry/dead-letter evidence, reconciliation results, incident records, and evidence retention windows without storing raw EHR payloads unless separately approved.

### ClinicOS integration handoff boundaries

ClinicOS-integrated mode may supply context and receive delivery status through adapters, but it cannot bypass AURA Note permissions, tenant/site scope, human approval, idempotency, audit, reconciliation, PHI policy, or support visibility controls.

## Future event inventory

Future live EHR implementation must define DTOs, audit records, and domain events for at least:

- `ehr.vendor_config_reviewed.v1`
- `ehr.credential_configured.v1`
- `ehr.credential_disabled.v1`
- `ehr.writeback_scope_approved.v1`
- `ehr.writeback_payload_prepared.v1`
- `ehr.writeback_approved.v1`
- `ehr.writeback_denied.v1`
- `ehr.writeback_idempotency_replayed.v1`
- `ehr.writeback_request_sent.v1`
- `ehr.writeback_request_failed.v1`
- `ehr.writeback_delivery_confirmed.v1`
- `ehr.writeback_dead_lettered.v1`
- `ehr.writeback_reconciliation_completed.v1`
- `ehr.attachment_exported.v1`
- `ehr.task_handoff_created.v1`
- `ehr.incident_recorded.v1`

## Future acceptance criteria before live use

- Production EHR credentialing, sandbox/staging/prod promotion, credential storage, rotation, disabled credential behavior, and operator ownership are documented and approved.
- Live writeback scope is limited to explicitly approved object types and requires human approval before delivery.
- Vendor-neutral adapter boundaries remain authoritative; athenahealth-specific behavior does not leak into domain logic.
- State-changing writeback operations are tenant/site scoped, permission checked, purpose-of-use checked, idempotent, audit/event emitting, and fail closed when credentials or mappings are missing.
- Cross-tenant, cross-site, disabled-user, wrong-role, support-user, and ClinicOS delegated-denial tests pass before DTO data or vendor status is exposed.
- Retry, dead-letter, reconciliation, rollback/support, incident-response, and monitoring paths are documented and tested with synthetic data.
- Raw EHR payload storage is disabled unless a later privacy/security-approved work order defines payload minimization, redaction, retention, deletion, and support access controls.
- No claim submission, charge finalization, medical-necessity determination, autonomous clinical/coding/billing finalization, or patient-facing financial conclusion is introduced.

## Current safe state

- `WO-058` is planning/control only.
- `next_work_order` remains `null`.
- Production EHR credentials are not enabled.
- Raw EHR payload storage is not enabled.
- Live writeback delivery is not enabled.
- Writeback without human approval is not enabled.
- Claim submission, charge finalization, medical-necessity determination, and autonomous finalization are not enabled.
- Production launch is not approved.

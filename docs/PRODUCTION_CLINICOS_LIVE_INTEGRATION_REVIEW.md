# Production ClinicOS Live Integration Review

## Purpose

This document is the `WO-059` planning/control intake for future ClinicOS live integration. It does not enable live ClinicOS credentials, live ClinicOS event-bus delivery, delegated identity bypass, raw ClinicOS payload storage, live synchronization, runtime ClinicOS behavior, production PHI exchange, claim submission, or production launch behavior.

The current safe posture remains the `WO-045` synthetic/browser/API-testable ClinicOS integration hardening evidence: metadata-only module boundaries, stale/degraded mapping review, failed/degraded publication metadata, service-account and cross-tenant denial, and AURA Note permission-boundary proof. Any future live ClinicOS work requires a new approved implementation work order with the decisions and evidence below.

## Review scope

### Live ClinicOS module contracts

Future implementation must document live module contracts for M03 VisitGraph, M04 WorkOS/tasks, M17 NP Cockpit, M21 Charge Integrity, M23 Copilot Runtime, M24 AI Governance, M25 Integration Hub, and M26 Data Cloud. The contract review must define allowed fields, source ownership, versioning, backward compatibility, degraded-mode behavior, and which system is authoritative for each object.

### Delegated identity and permission boundary

Future live integration must define delegated identity posture, tenant/site/user mapping, disabled-user handling, session expiry, purpose-of-use propagation, support-role limits, service-account boundaries, and no-permission-bypass tests. ClinicOS context must never override AURA Note RBAC/ABAC, human review, tenant/site scope, or audit requirements.

### Tenant, site, user, and patient mapping

Future work must define mapping keys, collision handling, stale mappings, unlinked mappings, cross-tenant denial, cross-site denial, patient linkage behavior, and reconciliation ownership. Raw ClinicOS payload storage remains disallowed unless a separate privacy/security decision defines minimization, redaction, retention, deletion, and support-access rules.

### Event-bus delivery and replay semantics

Future implementation must define event bus, delivery guarantees, idempotency keys, replay windows, ordering expectations, acknowledgement handling, retry, dead-letter, reconciliation, duplicate detection, and operator ownership.

### Module-specific handoff boundaries

Future live work must define boundaries for VisitGraph context, WorkOS tasks, NP Cockpit workspace embedding, Charge Integrity metadata, Copilot Runtime context, AI Governance evidence, Integration Hub routing, and Data Cloud analytics/export metadata without letting any ClinicOS module bypass AURA Note permissions or human-review gates.

### Degraded mode and offline behavior

Future implementation must define unavailable, stale, degraded, replay-needed, reconciliation-needed, permission-denied, and read-only states. Standalone mode must continue to work without ClinicOS for core AURA Note v1 workflows.

### Audit, observability, and incident response

Future live integration must persist audit-safe delivery metadata, correlation IDs, trace IDs, mapping review results, publication attempts, denials, failures, replay/reconciliation outcomes, support evidence, and incident records. Logs must be redacted and must not store raw ClinicOS payloads unless separately approved.

### Data Cloud and analytics boundaries

Future Data Cloud or analytics handoff must define aggregate/de-identified posture, allowed dimensions, tenant controls, user visibility, coaching/billing suppression rules, retention, export limits, and support access before any production analytics exchange.

## Future event inventory

Future live ClinicOS implementation must define DTOs, audit records, and domain events for at least:

- `clinicos.module_contract_reviewed.v1`
- `clinicos.service_account_configured.v1`
- `clinicos.service_account_disabled.v1`
- `clinicos.delegated_identity_reviewed.v1`
- `clinicos.tenant_mapping_reviewed.v1`
- `clinicos.site_mapping_reviewed.v1`
- `clinicos.user_mapping_reviewed.v1`
- `clinicos.patient_mapping_reviewed.v1`
- `clinicos.visitgraph_mapping_reviewed.v1`
- `clinicos.workos_task_mapping_reviewed.v1`
- `clinicos.charge_integrity_mapping_reviewed.v1`
- `clinicos.copilot_context_mapping_reviewed.v1`
- `clinicos.ai_governance_mapping_reviewed.v1`
- `clinicos.integration_hub_mapping_reviewed.v1`
- `clinicos.data_cloud_mapping_reviewed.v1`
- `clinicos.event_publication_authorized.v1`
- `clinicos.event_publication_denied.v1`
- `clinicos.event_publication_failed.v1`
- `clinicos.event_replay_requested.v1`
- `clinicos.reconciliation_completed.v1`
- `clinicos.degraded_mode_entered.v1`
- `clinicos.incident_recorded.v1`

## Future acceptance criteria before live use

- Live ClinicOS module contracts are reviewed, versioned, and approved for the named M03/M04/M17/M21/M23/M24/M25/M26 boundaries.
- Delegated identity, service-account, tenant/site/user/patient mapping, disabled-user, purpose-of-use, and support-role behavior are documented and tested.
- AURA Note remains authoritative for permissions, tenant/site scope, human review, audit, PHI policy, and standalone fallback.
- State-changing integration operations are tenant/site scoped, permission checked, idempotent where replay is plausible, audit/event emitting, and fail closed when mappings or credentials are missing.
- Cross-tenant, cross-site, disabled-user, wrong-role, support-user, stale-mapping, and service-account denial tests pass before payload data or publication status is exposed.
- Event publication, retry, dead-letter, replay, reconciliation, degraded-mode, rollback/support, incident-response, and monitoring paths are documented and tested with synthetic data.
- Raw ClinicOS payload storage is disabled unless a later privacy/security-approved work order defines payload minimization, redaction, retention, deletion, and support access controls.
- No claim submission, charge finalization, medical-necessity determination, autonomous clinical/coding/billing finalization, or patient-facing financial conclusion is introduced.

## Current safe state

- `WO-059` is planning/control only.
- `next_work_order` remains `null`.
- Live ClinicOS credentials are not enabled.
- Live ClinicOS event-bus delivery is not enabled.
- Delegated identity bypass is not enabled.
- Raw ClinicOS payload storage is not enabled.
- Live synchronization and runtime ClinicOS behavior are not enabled.
- Claim submission, charge finalization, medical-necessity determination, autonomous finalization, and production launch are not enabled.

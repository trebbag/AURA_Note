# WO-072 — Observability, SRE, Support, And Incident Operations

## Objective
Prepare commercial operations review without selecting or enabling live telemetry vendors.

## Why This Work Order Exists
Commercial support requires logs, metrics, traces, runbooks, status surfaces, support metadata, and incident operations.

## Prerequisites
- `WO-071`.

## In Scope
- Structured log/metric/trace/audit/support event taxonomy.
- Incident severity taxonomy.
- Runbooks for transcription, EHR, ClinicOS, AI, retention, export, identity, data access, security, and rollback.
- Support/status metadata evidence.
- SIEM/APM placeholders.
- `pnpm ops:commercial-readiness`.

## Out Of Scope
- Live SIEM/APM vendor integration.
- Production on-call staffing.
- Production launch.
- PHI-bearing logs.

## UX Requirements
- Support status route shows operational metadata only with degraded, failed, permission-denied, loading, ready, read-only, and demo states.

## Backend/API Requirements
- Support/status endpoints are permission checked, tenant scoped where applicable, redacted, and trace correlated.

## Data Model/Persistence Requirements
- Durable support/audit metadata only. No PHI in logs or events.

## Event/Audit Requirements
- Emit operational and incident taxonomy events with audit-safe evidence.

## RBAC/ABAC Requirements
- Support access is scoped and denied for PHI-bearing content.

## Standalone-Mode Behavior
- Standalone can be operated and supported without ClinicOS.

## ClinicOS-Integrated Behavior
- ClinicOS operational dependencies are adapter-bound and degraded without permission bypass.

## AI/PHI/Security Requirements
- No PHI in logs. No live telemetry credentials.

## Testing Requirements
- Readiness verifier, support route denial, redaction, incident taxonomy, disabled vendor states.

## Required Scripts/Gates
- `pnpm ops:commercial-readiness`
- Default local gate applicable to touched files.

## Definition Of Done
- Commercial support posture is review-ready with live vendors disabled.

## Stop Conditions
- Live vendor, on-call, SLO, or SLA approval is required.

## Risks And Deferred Decisions
- Vendor choice, alert thresholds, on-call owners, and live telemetry remain deferred.

# WO-043 — Production Observability, Support Operations, And Status Views

## Objective

Complete the P8 production platform candidate by hardening observability, support operations, operational status views, and runbook evidence without enabling live PHI-bearing integrations or production launch claims.

## Why this exists

`WO-041` added identity/config governance and `WO-042` added secure storage/download/retention/restore controls. P8 still needs production-shaped operational visibility: logs, metrics, traces, SIEM/APM adapter boundaries, support status views, incident/support runbooks, feature-flag status, retention/storage status, and safe degraded-mode evidence.

## Prerequisites

- `WO-041` production identity/config governance is complete.
- `WO-042` secure storage/download/retention/restore controls are complete.
- No active `SPEC_GAP` blocks support status, observability, incident triage, support access, or operational evidence retention.

## In Scope

- Production-shaped observability adapter interfaces for structured logs, metrics, traces, SIEM, and APM.
- Deterministic local/in-memory observability sink tests with no vendor credentials.
- Support operations API and browser states for service health, degraded modes, storage/download, retention, restore readiness, identity/config, feature flags, and integration disabled states.
- Incident, access review, retention review, backup/restore evidence, and disabled-integration runbook updates.
- Request/trace correlation and PHI redaction evidence for operational logs.
- P8 checkpoint report after `WO-043` passes local and CI gates.

## Out Of Scope

- Live SIEM/APM vendor connections.
- Production observability credentials, production URLs, `.env` files, private keys, or real PHI logs.
- Production incident certification, production launch approval, live EHR/ClinicOS sync, live AI, live transcription, charge finalization, medical-necessity determination, or claim submission.

## UX Requirements

- Support/admin views expose empty, loading, ready, degraded, failed, permission-denied, storage-disabled, retention-pending, restore-readiness, and demo fixture states.
- Operational status text must not claim HIPAA compliance, launch readiness, or production deployment.
- Critical controls must be keyboard accessible and have accessible names.

## Backend/API Requirements

- Add or harden operational status endpoints for observability sink readiness and support operations evidence.
- Keep all state-changing support actions permission checked, tenant/site scoped, audit logged, and event emitting.
- Ensure support users see operational metadata only and cannot access PHI-bearing artifacts, audit exports, final notes, transcripts, billing details, or coaching outputs.

## Data Model/Persistence Requirements

- Represent observability sink metadata, support status snapshots, incident/runbook evidence, access-review evidence, and degraded-mode status as audit-safe metadata.
- Persisted tenant-owned metadata must remain tenant/site scoped and align with existing RLS/tenant-isolation patterns where persistence is used.
- Do not store raw log payloads containing PHI, secrets, production URLs, or credentials.

## Event/Audit Requirements

- Emit audit/domain evidence for observability status checked, support status checked, incident runbook viewed, degraded mode acknowledged, access review evidence recorded, and operational readiness checked.
- Event payloads must be audit-safe metadata only.

## RBAC/ABAC Requirements

- Support status visibility remains limited to support, service account, clinic manager, compliance/privacy lead, admin, and authorized admin roles.
- Audit export download remains compliance/privacy lead or authorized admin only.
- Support users cannot bypass AURA Note permissions or access PHI-bearing workflow records.

## Standalone-Mode Behavior

- Standalone mode uses AURA Note local observability/config/status metadata and safe degraded-mode records.
- Missing production observability configuration must fail closed and remain browser/API-testable.

## ClinicOS-Integrated Behavior

- ClinicOS-integrated mode may map operational status to ClinicOS/Integration Hub later, but AURA Note remains authoritative for support access, redaction, and PHI boundaries.
- Missing ClinicOS operational delegation must fail closed.

## AI/PHI/Security Requirements

- No raw PHI is sent to external AI or observability vendors.
- Logs must remain redacted and request/trace correlated.
- No real credentials, production URLs, secret values, private keys, PHI samples, or `.env` files may be committed.

## Testing Requirements

- Unit/API tests for observability sink metadata, support status visibility, role denials, PHI redaction, feature-flag/degraded-mode status, and incident/runbook evidence.
- Browser tests for support/status states and permission-denied/degraded-mode views.
- Readiness script for production observability/support operations evidence.
- CI/local gates must pass before P8 checkpoint completion.

## Required Scripts/Gates

- Add `pnpm observability:production-readiness` or equivalent.
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
  - all persistence/storage/retention/identity/config/readiness scripts
  - `pnpm production:readiness`
  - `pnpm acceptance:readiness`
  - `node scripts/status.js`
  - `git diff --check`

## Definition Of Done

- Production-shaped observability/support operations evidence is browser/API-testable with synthetic data.
- Role and PHI boundaries are covered by positive and denial tests.
- Operational readiness scripts pass locally and in CI.
- P8 checkpoint report is updated with completed work orders, tests, open risks, deferred decisions, and next recommended batch.
- `RUN_LOG.md`, `repo_status.json`, relevant docs, scripts, tests, and work-order status are updated.

## Stop Conditions

- Live observability vendor credentials, production SIEM/APM endpoint details, PHI-bearing log samples, production incident certification, or production launch approval is required.
- Missing or contradictory policy for support access, incident evidence retention, access review, or operational status exposure blocks safe implementation.

## Risks And Deferred Decisions

- SIEM/APM vendor selection, retention windows, incident response ownership, access-review cadence, support break-glass process, and production monitoring SLOs require founder/security/privacy review before launch readiness.

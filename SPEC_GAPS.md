# SPEC_GAPS

This file tracks missing, conflicting, unsafe, or deliberately deferred product and technical decisions discovered during implementation.

## Active gaps

No active gaps as of post-`WO-053` production identity/account lifecycle review intake on 2026-05-28.

The repo remains not production-ready. The items below are deferred production decisions rather than active blockers for the current post-`WO-053` planning/control scope.

## Deferred production decisions

These items must stay visible and must be resolved before the related production work can be declared complete. They are not blockers for the completed `WO-053` planning/control tranche because the active work remains synthetic/local and explicitly excludes legal certification claims, production deployment, production launch approval, live SIEM/APM vendors, production observability credentials, PHI-bearing logs, live Azure credentials, PHI-bearing object payloads, live destructive deletion, production restore execution, live IdP credentials, live OIDC/SAML, live ClinicOS delegation, live ClinicOS event-bus sync, raw ClinicOS payload storage, live EHR/ClinicOS synchronization, production EHR credentials, raw EHR payload storage, live EHR writeback delivery, live transcription credentials, live external AI credentials, production prompt stores, autonomous billing, charge finalization, medical-necessity determination, claim submission, denial automation, payment posting, patient-facing financial conclusions, and production launch behavior.

### Deferred Decision — Production SIEM/APM vendor and operational monitoring posture

- **Related future work:** post-`WO-043` security/privacy/founder review before live use; `WO-049`
- **Status:** deferred
- **Decision needed before live use:** SIEM/APM vendor selection, production exporter endpoints, credential source, log/metric/trace retention windows, alert thresholds, on-call ownership, SLO/SLA targets, incident severity taxonomy, support break-glass policy, and access-review cadence.
- **Safe current posture:** `WO-043` adds local redacted logs/metrics/traces, disabled SIEM/APM placeholders, support operational evidence, and readiness metadata only; no live observability vendor, PHI-bearing log, production credential, or production launch approval is enabled.

### Deferred Decision — Production identity provider and account lifecycle

- **Related future work:** `WO-053`; future approved identity implementation work order before live use
- **Status:** deferred
- **Decision needed before live use:** production IdP selection, OIDC/SAML/ClinicOS delegation posture, MFA expectations, account recovery, tenant/user/site administration ownership, disabled-user handling, and access-review cadence.
- **Safe current posture:** `WO-041` adds fail-closed local synthetic identity and adapter boundaries only; `WO-053` captures the live-readiness intake and future acceptance criteria. Delegated modes remain denied until configured by a later approved implementation work order and no raw tokens or secret values are returned.

### Deferred Decision — Production PHI persistence and database operations

- **Related future work:** `WO-034` through `WO-037`
- **Status:** deferred
- **Decision needed before live use:** production database roles, RLS coverage review, backup/restore operations, migration approval/rollback process, PHI storage policy, and tenant data isolation review.
- **Safe current posture:** local synthetic PostgreSQL evidence only; broad workflow runtime still migrates in controlled work orders.

### Deferred Decision — Production Azure Blob storage and destructive deletion

- **Related future work:** post-`WO-042` security/privacy/founder review before live use
- **Status:** deferred
- **Decision needed before live use:** Azure account/container policy, credential source, customer-managed keys, private networking, legal hold, soft-delete/versioning configuration, backup/restore drill cadence, deletion approval authority, recovery window, and evidence retention.
- **Safe current posture:** `WO-042` adds production-shaped adapter boundary, deterministic fake storage tests, server-mediated token validation, recovery-window-gated deletion evidence, and restore-readiness metadata only; no PHI-bearing production object delivery, public URLs, destructive production deletion, or production restore execution.

### Deferred Decision — Live transcription provider and PHI-bearing audio transport

- **Related future work:** post-`WO-040` provider governance, `WO-042`, `WO-046`
- **Status:** deferred
- **Decision needed before live use:** transcription vendor, BAA/privacy review, audio transport constraints, diarization support, confidence metadata, correction retention, and failure-handling policy.
- **Safe current posture:** browser permission UX, metadata-only recording chunks, deterministic mock transcription, and correction history only; no live provider calls and no raw PHI audio payload storage.

### Deferred Decision — External AI provider and PHI governance

- **Related future work:** post-`WO-046` founder/security/privacy/vendor review before live use
- **Status:** deferred
- **Decision needed before live use:** private/BAA model path, de-identification policy, source-freshness rules, model/prompt approval, evaluation thresholds, monitoring, drift response, live credential source, and incident response.
- **Safe current posture:** `WO-046` adds prompt/model metadata, deterministic local evaluation cases, source-linked output validation, unsafe output rejection, human-review-required evidence, and stronger PHI redaction/rejection. External AI remains disabled by default; no live model credential, production prompt store, raw PHI transfer, autonomous finalization, medical-necessity determination, charge finalization, or claim submission is enabled.

### Deferred Decision — Production EHR credentialing and live writeback delivery

- **Related future work:** post-`WO-044` founder/security/privacy/vendor review before live use
- **Status:** deferred
- **Decision needed before live use:** production athenahealth credentialing, sandbox credential source if live sandbox calls are required, approved writeback target scope, vendor error taxonomy, reconciliation ownership, retry/dead-letter policy, rollback/support process, and launch approval.
- **Safe current posture:** `WO-044` adds a vendor-neutral, athenahealth-first sandbox-ready adapter path plus metadata-only writeback queue lifecycle evidence. Human approval, idempotency replay, retry, dead-letter, reconciliation, role denial, PHI rejection, and audit/domain events are tested; no production credential, raw EHR payload storage, or live writeback delivery is enabled.

### Deferred Decision — ClinicOS live integration contracts and event-bus delivery

- **Related future work:** post-`WO-045` founder/security/privacy/ClinicOS review before live use
- **Status:** deferred
- **Decision needed before live use:** live ClinicOS module contracts, tenant/user mapping, delegated identity posture, VisitGraph/WorkOS/Charge Integrity/Copilot/Governance/Integration/Data Cloud event schemas, event-bus delivery semantics, replay/reconciliation ownership, and operational ownership.
- **Safe current posture:** `WO-045` adds metadata-only module boundaries, mapping review, stale/degraded mapping states, failed/degraded publication metadata, service-account/cross-tenant denial, and AURA Note permission-boundary evidence. Standalone remains authoritative; ClinicOS mock/integration scaffolds cannot bypass AURA Note permissions and no raw ClinicOS payload storage or live event delivery is enabled.

### Deferred Decision — Revenue estimates and patient-facing financial content

- **Related future work:** `WO-039`, `WO-051`
- **Status:** deferred
- **Decision needed before live use:** tenant estimate source data, caveat language, patient-facing permission, payer/fee/payment data governance, and compliance review.
- **Safe current posture:** no patient-facing revenue by default; estimates show unavailable/caveat language unless configured.

### Deferred Decision — Claim submission, clearinghouse, payer integration, and denial automation

- **Related future work:** future founder-approved claim/payer implementation work order
- **Status:** deferred
- **Decision needed before implementation:** whether live claim submission belongs in v1 or later, clearinghouse/payer strategy, billing compliance requirements, human approval model, audit model, denial/payment scope, patient-facing financial language, and rollback/void/reversal procedures.
- **Safe current posture:** `WO-051` captured the P11 decision gate. Draft claim preview remains internal and human-reviewed with `submittedClaim = false`; no clearinghouse API, payer API, autonomous charge finalization, medical-necessity determination, claim submission, denial automation, payment posting, or patient-facing financial conclusion is enabled.

## Gap entry format

```md
## SPEC_GAP-YYYY-MM-DD-### — Short title

- **Discovered in work order:** WO-###
- **Severity:** blocking | non-blocking | safety-critical | compliance-critical
- **Affected area:** UX | backend | AI | EHR | ClinicOS | billing | security | testing
- **What is missing/conflicting:**
- **Why Codex cannot safely invent it:**
- **Safe temporary behavior, if any:**
- **Founder question:**
- **Status:** open | answered | implemented | deferred
```

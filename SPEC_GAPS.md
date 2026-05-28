# SPEC_GAPS

This file tracks missing, conflicting, unsafe, or deliberately deferred product and technical decisions discovered during implementation.

## Active gaps

No active gaps as of post-`WO-042` secure storage/download/retention/restore controls review on 2026-05-28.

The repo remains not production-ready. The items below are deferred production decisions rather than active blockers for the current secure storage/download/retention/restore controls scope.

## Deferred production decisions

These items must stay visible and must be resolved before the related production work can be declared complete. They are not blockers for the completed `WO-042` tranche because the active work remains synthetic/local and explicitly excludes live Azure credentials, PHI-bearing object payloads, live destructive deletion, production restore execution, live IdP credentials, live ClinicOS delegation, live EHR/ClinicOS synchronization, live transcription credentials, autonomous billing, and production launch behavior.

### Deferred Decision — Production identity provider and account lifecycle

- **Related future work:** post-`WO-041` security/founder review before live use
- **Status:** deferred
- **Decision needed before live use:** production IdP selection, OIDC/SAML/ClinicOS delegation posture, MFA expectations, account recovery, tenant/user/site administration ownership, disabled-user handling, and access-review cadence.
- **Safe current posture:** `WO-041` adds fail-closed local synthetic identity and adapter boundaries only; delegated modes remain denied until configured and no raw tokens or secret values are returned.

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

- **Related future work:** `WO-046`
- **Status:** deferred
- **Decision needed before live use:** private/BAA model path, de-identification policy, source-freshness rules, model/prompt approval, evaluation thresholds, monitoring, and incident response.
- **Safe current posture:** external AI remains disabled by default; mock-only/draft-only gateway rejects or redacts obvious PHI.

### Deferred Decision — EHR sandbox and production writeback

- **Related future work:** `WO-044`
- **Status:** deferred
- **Decision needed before live use:** athenahealth sandbox credentials, production credentialing, writeback scope, approval roles, reconciliation rules, retry/dead-letter policy, and rollback support.
- **Safe current posture:** adapter scaffolds and writeback queue metadata only; no live writeback.

### Deferred Decision — ClinicOS live integration contracts

- **Related future work:** `WO-045`
- **Status:** deferred
- **Decision needed before live use:** live ClinicOS module contracts, tenant/user mapping, VisitGraph/WorkOS/Charge Integrity/Copilot/Governance/Integration/Data Cloud event schemas, and operational ownership.
- **Safe current posture:** standalone remains authoritative; ClinicOS mock/integration scaffolds cannot bypass AURA Note permissions.

### Deferred Decision — Revenue estimates and patient-facing financial content

- **Related future work:** `WO-039`, `WO-051`
- **Status:** deferred
- **Decision needed before live use:** tenant estimate source data, caveat language, patient-facing permission, payer/fee/payment data governance, and compliance review.
- **Safe current posture:** no patient-facing revenue by default; estimates show unavailable/caveat language unless configured.

### Deferred Decision — Claim submission, clearinghouse, payer integration, and denial automation

- **Related future work:** `WO-051`
- **Status:** deferred
- **Decision needed before implementation:** whether live claim submission belongs in v1 or later, clearinghouse/payer strategy, billing compliance requirements, human approval model, audit model, and rollback/voiding procedures.
- **Safe current posture:** draft claim preview only with `submittedClaim = false`; no autonomous charge finalization or claim submission.

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

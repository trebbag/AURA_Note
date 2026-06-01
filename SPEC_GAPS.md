# SPEC_GAPS

This file tracks missing, conflicting, unsafe, or deliberately deferred product and technical decisions discovered during implementation.

## Active gaps

No active gaps as of post-`WO-065` Figma handoff inventory review on 2026-06-01.

This supersedes the prior marker: No active gaps as of post-`WO-064` primary UI runtime API conversion review. The repo remains not production-ready. The items below are deferred production decisions rather than active blockers for the current post-`WO-065` synthetic/local Figma handoff inventory scope.

## Deferred production decisions

These items must stay visible and must be resolved before the related production work can be declared complete. They are not blockers for the completed `WO-062` synthetic/local API runtime boundary tranche because the active work explicitly excludes legal certification claims, production deployment, production launch approval, live WAF/CDN configuration, live SIEM/APM vendors, production observability credentials, PHI-bearing logs, live Azure credentials, PHI-bearing object payloads, public object URLs, live destructive deletion, production restore execution, PHI-bearing audit exports, live IdP credentials, live OIDC/SAML, live ClinicOS delegation, live ClinicOS event-bus sync, delegated identity bypass, raw ClinicOS payload storage, live EHR/ClinicOS synchronization, production database credentials, production PHI database storage, live migrations, production backup/restore execution, support database access, production EHR credentials, raw EHR payload storage, live EHR writeback delivery, writeback without human approval, live transcription credentials, live transcription provider calls, PHI-bearing audio transport, production raw-audio storage, PHI-bearing support transcript access, live external AI credentials, raw PHI transfer to external AI, live model calls, production prompt stores, support AI PHI content access, autonomous billing, charge finalization, medical-necessity determination, claim submission, denial automation, payment posting, patient-facing financial conclusions, and production launch behavior.

### Deferred Decision — Commercial readiness implementation and launch approval

- **Related future work:** `WO-061` through `WO-075`; any later founder-approved production launch work order
- **Status:** deferred
- **Decision needed before production launch:** founder/clinical/compliance/security/legal approval, beta scope, production environment, credential source, operational owner, incident response, access review, backup/restore, vendor contracts, PHI governance, live integrations, support ownership, launch go/no-go, and rollback authority.
- **Safe current posture:** `WO-060` reopened implementation rails, `WO-061` added synthetic/local runtime persistence evidence, `WO-062` hardened the API request boundary with validation, request correlation, PHI-safe error envelopes, redacted logs, security headers, body-size guardrails, and local throttle scaffolding, `WO-063` added the explicit `AURA_NOTE_AUTH_MODE` identity runtime boundary with local demo/strict synthetic modes and production/preview/delegated fail-closed behavior, `WO-064` converted primary production-intended routes to typed API-backed synthetic/local runtime state, and `WO-065` added read-only Figma handoff inventory docs plus `/aura-note/figma-handoff`. Production launch remains false and no live vendor, credential, PHI, claim, autonomous clinical/coding/billing, or production deployment behavior is enabled.

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

- **Related future work:** `WO-034` through `WO-037`; `WO-054`; future approved database implementation work order before live use
- **Status:** deferred
- **Decision needed before live use:** production database roles, RLS coverage review, backup/restore operations, migration approval/rollback process, PHI storage policy, and tenant data isolation review.
- **Safe current posture:** local synthetic PostgreSQL evidence only; `WO-054` captures the live-readiness intake and future acceptance criteria. No production database host, production credential, live migration, production PHI storage, backup/restore execution, support database access, or launch behavior is enabled.

### Deferred Decision — Production Azure Blob storage and destructive deletion

- **Related future work:** `WO-055`; future approved storage implementation work order before live use
- **Status:** deferred
- **Decision needed before live use:** Azure account/container policy, credential source, customer-managed keys, private networking, legal hold, soft-delete/versioning configuration, backup/restore drill cadence, deletion approval authority, recovery window, and evidence retention.
- **Safe current posture:** `WO-042` adds production-shaped adapter boundary, deterministic fake storage tests, server-mediated token validation, recovery-window-gated deletion evidence, and restore-readiness metadata only. `WO-055` captures the live-readiness intake and future acceptance criteria. No live Azure credential, PHI-bearing production object delivery, public URL, destructive production deletion, PHI-bearing audit export, production restore execution, or launch behavior is enabled.

### Deferred Decision — Live transcription provider and PHI-bearing audio transport

- **Related future work:** `WO-056`; future approved transcription implementation work order before live use
- **Status:** deferred
- **Decision needed before live use:** transcription vendor, BAA/privacy review, audio transport constraints, diarization support, confidence metadata, correction retention, and failure-handling policy.
- **Safe current posture:** browser permission UX, metadata-only recording chunks, deterministic mock transcription, and correction history only. `WO-056` captures the live-readiness intake and future acceptance criteria. No live transcription credential, PHI-bearing audio transport, live provider call, production raw-audio storage, PHI-bearing support transcript access, or launch behavior is enabled.

### Deferred Decision — External AI provider and PHI governance

- **Related future work:** `WO-057`; future approved AI implementation work order before live use
- **Status:** deferred
- **Decision needed before live use:** private/BAA model path, de-identification policy, source-freshness rules, model/prompt approval, evaluation thresholds, monitoring, drift response, live credential source, and incident response.
- **Safe current posture:** `WO-046` adds prompt/model metadata, deterministic local evaluation cases, source-linked output validation, unsafe output rejection, human-review-required evidence, and stronger PHI redaction/rejection. `WO-057` captures the live-readiness intake and future acceptance criteria. External AI remains disabled by default; no live AI credential, production prompt store, raw PHI transfer to external AI, live model call, support AI PHI content access, autonomous finalization, medical-necessity determination, charge finalization, claim submission, or launch behavior is enabled.

### Deferred Decision — Production EHR credentialing and live writeback delivery

- **Related future work:** `WO-058`; future approved EHR implementation work order before live use
- **Status:** deferred
- **Decision needed before live use:** production athenahealth credentialing, sandbox credential source if live sandbox calls are required, approved writeback target scope, vendor error taxonomy, reconciliation ownership, retry/dead-letter policy, rollback/support process, and launch approval.
- **Safe current posture:** `WO-044` adds a vendor-neutral, athenahealth-first sandbox-ready adapter path plus metadata-only writeback queue lifecycle evidence. Human approval, idempotency replay, retry, dead-letter, reconciliation, role denial, PHI rejection, and audit/domain events are tested; `WO-058` captures the live-readiness intake and future acceptance criteria. No production EHR credential, raw EHR payload storage, live writeback delivery, writeback without human approval, runtime EHR behavior, autonomous finalization, claim submission, or production launch behavior is enabled.

### Deferred Decision — ClinicOS live integration contracts and event-bus delivery

- **Related future work:** `WO-059`; future approved ClinicOS implementation work order before live use
- **Status:** deferred
- **Decision needed before live use:** live ClinicOS module contracts, tenant/user mapping, delegated identity posture, VisitGraph/WorkOS/Charge Integrity/Copilot/Governance/Integration/Data Cloud event schemas, event-bus delivery semantics, replay/reconciliation ownership, and operational ownership.
- **Safe current posture:** `WO-045` adds metadata-only module boundaries, mapping review, stale/degraded mapping states, failed/degraded publication metadata, service-account/cross-tenant denial, and AURA Note permission-boundary evidence. `WO-059` captures the live-readiness intake and future acceptance criteria. Standalone remains authoritative; ClinicOS mock/integration scaffolds cannot bypass AURA Note permissions and no live ClinicOS credential, live event-bus delivery, delegated identity bypass, raw ClinicOS payload storage, live synchronization, runtime ClinicOS behavior, or launch behavior is enabled.

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

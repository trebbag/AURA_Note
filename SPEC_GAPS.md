# SPEC_GAPS

This file tracks missing, conflicting, unsafe, or deliberately deferred product and technical decisions discovered during implementation.

## Active gaps

No active gaps as of post-`WO-077` duplicate artifact cleanup and next-sequence rails review on 2026-06-02.

This supersedes the prior marker: No active gaps as of post-`WO-076` post-CR4 launch governance intake review. The repo remains not production-ready. The items below are deferred production decisions rather than active blockers for the current post-`WO-077` cleanup and planned-sequence package.

Founder-provided partial inputs captured on 2026-06-02 identify the founder/operator as the launch owner and approval authority, and identify `/Users/gregorygabbert/Documents/GitHub/Flow` as the reference project for Azure/Microsoft Entra identity, `clinicos1` tenant account lifecycle, Azure PostgreSQL, RLS/encryption, Key Vault, and Azure Blob recovery-posture planning. These inputs reduce ambiguity but do not resolve the AURA Note-specific production configuration, credential-delivery, PHI persistence, storage/deletion/restore, vendor, launch-scope, or live-enablement decisions below.

## Deferred production decisions

These items must stay visible and must be resolved before the related production work can be declared complete. They are not blockers for the completed synthetic/local and post-CR4 cleanup scope because the active work explicitly excludes legal certification claims, production deployment, production launch approval, live WAF/CDN configuration, live SIEM/APM vendors, production observability credentials, PHI-bearing logs, live Azure credentials, PHI-bearing object payloads, public object URLs, live destructive production deletion, production restore execution, PHI-bearing audit exports, live IdP credentials, live OIDC/SAML, live ClinicOS delegation, live ClinicOS event-bus sync, delegated identity bypass, raw ClinicOS payload storage, live EHR/ClinicOS synchronization, production database credentials, production PHI database storage, live migrations, production backup/restore execution, support database access, production EHR credentials, raw EHR payload storage, live EHR writeback delivery, writeback without human approval, live transcription credentials, live transcription provider calls, PHI-bearing audio transport, production raw-audio storage, PHI-bearing support transcript access, live external AI credentials, raw PHI transfer to external AI, live model calls, production prompt stores, support AI PHI content access, autonomous billing, charge finalization, medical-necessity determination, claim submission, denial automation, payment posting, patient-facing financial conclusions, and production launch behavior.

### Deferred Decision — Commercial readiness implementation and launch approval

- **Related future work:** any later founder-approved production launch work order
- **Status:** deferred
- **Partial input captured 2026-06-02:** the founder/operator is the launch owner and approval authority unless a later written decision delegates an approval lane.
- **Decision needed before production launch:** launch scope, tenant/site scope, enabled roles, disabled-feature inventory, production environment, credential source, operational owner, incident response, access review, backup/restore, vendor contracts, PHI governance, live integrations, support ownership, launch go/no-go, rollback authority, and explicit approval to change launch posture.
- **Safe current posture:** `WO-060` reopened implementation rails, `WO-061` through `WO-070` added runtime persistence, API, identity, frontend, standalone, integration, transcription, EHR, ClinicOS, and AI governance evidence, and `WO-071` through `WO-075` packaged CR-4 security/privacy/compliance, observability/support, billing/revenue integrity, beta-pilot, and commercial-readiness decision evidence. Production launch remains false and no live vendor, credential, PHI, claim, autonomous clinical/coding/billing, or production deployment behavior is enabled.

### Deferred Decision — Production SIEM/APM vendor and operational monitoring posture

- **Related future work:** post-`WO-043` security/privacy/founder review before live use; `WO-049`
- **Status:** deferred
- **Decision needed before live use:** SIEM/APM vendor selection, production exporter endpoints, credential source, log/metric/trace retention windows, alert thresholds, on-call ownership, SLO/SLA targets, incident severity taxonomy, support break-glass policy, and access-review cadence.
- **Safe current posture:** `WO-043` adds local redacted logs/metrics/traces, disabled SIEM/APM placeholders, support operational evidence, and readiness metadata only; no live observability vendor, PHI-bearing log, production credential, or production launch approval is enabled.

### Deferred Decision — Production identity provider and account lifecycle

- **Related future work:** `WO-053`; future approved identity implementation work order before live use
- **Status:** deferred
- **Partial input captured 2026-06-02:** use Flow as the reference pattern for Azure/Microsoft Entra, the `clinicos1` tenant, Microsoft redirect login, JWT validation, Entra-linked provisioning, tenant-member-only access, guest/B2B denial, disabled/deleted account denial, and app-owned role/scope authorization.
- **Decision needed before live use:** AURA Note-specific OIDC/SAML/ClinicOS delegation posture, exact non-secret configuration names, approved app registration names, Microsoft Graph access posture, MFA expectations, session/inactivity policy, account recovery, tenant/user/site administration ownership, disabled-user handling, joiner/mover/leaver process, break-glass policy, access-review cadence, audit retention, and secret-store delivery.
- **Safe current posture:** `WO-041` adds fail-closed local synthetic identity and adapter boundaries only; `WO-053` captures the live-readiness intake and future acceptance criteria. Delegated modes remain denied until configured by a later approved implementation work order and no raw tokens or secret values are returned.

### Deferred Decision — Production PHI persistence and database operations

- **Related future work:** `WO-034` through `WO-037`; `WO-054`; future approved database implementation work order before live use
- **Status:** deferred
- **Partial input captured 2026-06-02:** use Flow as the reference pattern for Azure Database for PostgreSQL Flexible Server, local-to-PostgreSQL staging support, separate migration/runtime role posture, RLS evidence, append-only event protection, PHI-at-rest encryption, and documented recovery objectives.
- **Decision needed before live use:** AURA Note-specific database host, region/residency, database roles, RLS coverage review for every tenant-owned table, backup/restore operations, migration approval/rollback process, PHI storage policy, tenant data isolation review, support database access, monitoring requirements, staging policy, and approved secret names.
- **Safe current posture:** local synthetic PostgreSQL evidence only; `WO-054` captures the live-readiness intake and future acceptance criteria. No production database host, production credential, live migration, production PHI storage, backup/restore execution, support database access, or launch behavior is enabled.

### Deferred Decision — Production Azure Blob storage and destructive deletion

- **Related future work:** `WO-055`; future approved storage implementation work order before live use
- **Status:** deferred
- **Partial input captured 2026-06-02:** use Flow as the reference pattern for Azure Key Vault, Azure Blob soft-delete/versioning recovery posture, and private Blob deployment-package usage; the deployment-package Blob posture is not AURA Note PHI-bearing artifact storage approval.
- **Decision needed before live use:** AURA Note-specific Azure account/container policy by artifact class, credential source or managed identity, customer-managed keys, private networking, legal hold, soft-delete/versioning configuration, signed-download expiration, backup/restore drill cadence, deletion approval authority, approval-record source, recovery window, monitoring/alerting, and evidence retention.
- **Safe current posture:** `WO-042` adds production-shaped adapter boundary, deterministic fake storage tests, server-mediated token validation, recovery-window-gated deletion evidence, and restore-readiness metadata only. `WO-055` captures the live-readiness intake and future acceptance criteria. No live Azure credential, PHI-bearing production object delivery, public URL, destructive production deletion, PHI-bearing audit export, production restore execution, or launch behavior is enabled.

### Deferred Decision — Live transcription provider and PHI-bearing audio transport

- **Related future work:** `WO-056`; future approved transcription implementation work order before live use
- **Status:** deferred
- **Decision needed before live use:** transcription vendor, BAA/privacy review, audio transport constraints, diarization support, confidence metadata, correction retention, and failure-handling policy.
- **Safe current posture:** browser permission UX, metadata-only recording chunks, deterministic mock transcription, correction history, server-side provider adapter metadata, retry/dead-letter posture, disabled live-provider fail-closed evidence, one-week raw-audio retention metadata, and indefinite transcript retention only. `WO-056` captures the live-readiness intake and future acceptance criteria, and `WO-068` keeps runtime provider behavior mock-only or disabled. No live transcription credential, PHI-bearing audio transport, live provider call, production raw-audio storage, PHI-bearing support transcript access, or launch behavior is enabled.

### Deferred Decision — External AI provider and PHI governance

- **Related future work:** `WO-057`; future approved AI implementation work order before live use
- **Status:** deferred
- **Decision needed before live use:** private/BAA model path, de-identification policy, source-freshness rules, model/prompt approval, evaluation thresholds, monitoring, drift response, live credential source, and incident response.
- **Safe current posture:** `WO-046` adds prompt/model metadata, deterministic local evaluation cases, source-linked output validation, unsafe output rejection, human-review-required evidence, and stronger PHI redaction/rejection. `WO-057` captures the live-readiness intake and future acceptance criteria. `WO-070` expands the server-side runtime boundary with disabled live model calls, disabled production prompt store, private/BAA placeholder, drift placeholder, source-stale blocking, schema-validation metadata, confidence metadata, prohibited-behavior coverage, and `ai.regression_blocked.v1` evidence. External AI remains disabled by default; no live AI credential, production prompt store, raw PHI transfer to external AI, live model call, support AI PHI content access, autonomous finalization, medical-necessity determination, charge finalization, claim submission, or launch behavior is enabled.

### Deferred Decision — Production EHR credentialing and live writeback delivery

- **Related future work:** `WO-058`; future approved EHR implementation work order before live use
- **Status:** deferred
- **Decision needed before live use:** production athenahealth credentialing, sandbox credential source if live sandbox calls are required, approved writeback target scope, vendor error taxonomy, reconciliation ownership, retry/dead-letter policy, rollback/support process, and launch approval.
- **Safe current posture:** `WO-044` adds a vendor-neutral, athenahealth-first sandbox-ready adapter path plus metadata-only writeback queue lifecycle evidence. Human approval, idempotency replay, retry, dead-letter, reconciliation, role denial, PHI rejection, and audit/domain events are tested; `WO-058` captures the live-readiness intake and future acceptance criteria; `WO-069` adds API/browser-testable runtime boundary metadata, credential-disabled evidence, sandbox patient lookup, appointment import, encounter context, payload-preparation, attempt, acknowledgement, denial, and no-raw-payload evidence. No production EHR credential, raw EHR payload storage, live writeback delivery, writeback without human approval, live runtime EHR calls, autonomous finalization, claim submission, or production launch behavior is enabled.

### Deferred Decision — ClinicOS live integration contracts and event-bus delivery

- **Related future work:** `WO-059`; future approved ClinicOS implementation work order before live use
- **Status:** deferred
- **Decision needed before live use:** live ClinicOS module contracts, tenant/user mapping, delegated identity posture, VisitGraph/WorkOS/Charge Integrity/Copilot/Governance/Integration/Data Cloud event schemas, event-bus delivery semantics, replay/reconciliation ownership, and operational ownership.
- **Safe current posture:** `WO-045` adds metadata-only module boundaries, mapping review, stale/degraded mapping states, failed/degraded publication metadata, service-account/cross-tenant denial, and AURA Note permission-boundary evidence. `WO-067` adds an API ModeResolver and explicit `modeAdapterBoundaries` for schedule source, patient context, VisitGraph, tasks, audit, AI governance, Charge Integrity, EHR, export, and identity seams with `liveDelegationEnabled=false` and `rawPayloadStorageEnabled=false`. `WO-059` captures the live-readiness intake and future acceptance criteria. Standalone remains authoritative; ClinicOS mock/integration scaffolds cannot bypass AURA Note permissions and no live ClinicOS credential, live event-bus delivery, delegated identity bypass, raw ClinicOS payload storage, live synchronization, live runtime ClinicOS behavior, or launch behavior is enabled.

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

## Resolved decisions

### Resolved Decision — Duplicate artifact deletion approval

- **Resolved in work order:** `WO-077`
- **Status:** resolved for the reviewed accidental local duplicate-pattern artifacts only.
- **Decision:** the founder asked Codex to do duplicate artifact adjudication. Codex compared 103 visible duplicate-pattern files, removed 40 byte-identical copies, removed 62 stale historical copies, reviewed the one unique duplicate difference, and rejected that unique script variant because it weakened the committed PostgreSQL/Prisma migration-readiness behavior.
- **Evidence:** `docs/DUPLICATE_ARTIFACT_ADJUDICATION.md`
- **Boundary:** this does not authorize deletion of tracked source, production records, evidence artifacts, PHI, secrets, credentials, or future non-reviewed files.

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

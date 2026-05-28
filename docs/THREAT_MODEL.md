# AURA Note Threat Model

`WO-047` creates this P9 threat model for standalone and ClinicOS-integrated AURA Note. It is a review artifact for security, privacy, compliance, and product-risk remediation. It is not a production launch approval, legal opinion, HIPAA certification, SOC 2 claim, or vendor security attestation.

## Scope

Covered:

- standalone tenant, site, user, patient shell, schedule, note, visit session, transcript, finalization, export, task, coaching, support, and audit workflows;
- ClinicOS-integrated adapter boundaries for M03 VisitGraph, M04 WorkOS/tasks, M17 NP Cockpit, M21 Charge Integrity, M23 Copilot Runtime, M24 AI Governance, M25 Integration Hub, and M26 Data Cloud;
- local PostgreSQL persistence and RLS evidence for currently durable workflow slices;
- production-shaped identity/config, object-storage, retention, observability, EHR, ClinicOS, AI governance, and support controls;
- synthetic/local CI evidence and disabled live-vendor posture.

Out of scope:

- production PHI samples, production credentials, live EHR writeback, live ClinicOS sync, live external AI, live transcription provider calls, production SIEM/APM delivery, production Azure Blob delivery, production deletion, legal/compliance certification, and claim submission.

## Assets

| Asset | Sensitivity | Current protection |
|---|---|---|
| Tenant/site/workforce/session records | Security and operational | Tenant/site scoped request context, disabled/delegated identity fail-closed, purpose-of-use guardrails. |
| Patient shell, chart context, appointments, notes | PHI | Synthetic/local data only, tenant/site filters, RLS evidence for persisted slices, role checks. |
| Visit sessions, recording metadata, transcripts | PHI | Timer gate, transcript role limits, raw-audio one-week retention metadata, transcript non-deletion. |
| Suggestions, selections, compliance, history gaps, tasks | PHI/clinical/billing support | Candidate-only outputs, low-confidence override, blocker-task gates, human review. |
| Final note, patient summary, exports, draft claim preview | PHI/financial | Read-only signed metadata, patient-summary internal-detail exclusion, `submittedClaim=false`, role-limited export. |
| Audit/domain events and support status | Security/compliance evidence | Metadata-only payloads, redacted audit exports, support metadata-only access. |
| EHR, ClinicOS, AI, storage, observability adapter records | Integration/security evidence | Disabled or mock/sandbox-safe boundaries, no raw external payload storage, no live credentials. |

## Trust Boundaries

1. Browser to API: route state must be backed by typed contracts and role-scoped API responses before launch-candidate readiness.
2. API to repository/database: state-changing operations must be tenant/site scoped, permission checked, idempotent where applicable, audit/event emitting, and RLS evidenced when persisted.
3. API/worker to object storage: production storage remains disabled; current evidence uses metadata-only fake Azure semantics and server-mediated downloads.
4. API/worker to EHR/ClinicOS: adapters are metadata-only and disabled/mock/sandbox-safe; live writes require later approval.
5. API/worker to AI/transcription/observability vendors: external calls remain disabled unless a later approved work order provides credentials, governance, BAA/vendor review, and tests.
6. Support/compliance views: operational metadata only; no transcripts, final notes, billing details, coaching outputs, raw prompts, raw EHR/ClinicOS payloads, or PHI-bearing logs.

## Threats And Current Mitigations

| Threat | Impact | Current mitigation | Residual risk |
|---|---|---|---|
| Cross-tenant or cross-site data exposure | Unauthorized PHI/security disclosure | Tenant/site context, repository/API denial tests, local PostgreSQL RLS evidence. | Production database role posture and full external security review remain deferred. |
| Role or purpose escalation | Unauthorized transcript, note, billing, audit, coaching, or admin access | RBAC/ABAC matrix, security tests, API role-denial tests, disabled-user and purpose-of-use fail-closed paths. | Production IdP, MFA, account recovery, and access-review cadence remain deferred. |
| ClinicOS bypass of AURA Note permissions | Integrated mode exposes data or writes state outside AURA Note controls | ClinicOS adapter keeps AURA Note authoritative, service-account scope checks, stale/degraded fail-closed evidence. | Live ClinicOS contracts and event-bus behavior require review before enablement. |
| Live EHR writeback without human approval | Unsupported clinical record writeback | Writeback queue is metadata-only, human-approved, idempotent, retry/dead-letter/reconciled, and live delivery disabled. | Production credentialing and vendor error taxonomy remain deferred. |
| Raw PHI sent to external AI | Privacy breach and governance failure | AI Gateway rejects forbidden PHI by default, redacts only in explicit redaction mode, external AI disabled. | Private/BAA model path and drift/monitoring policy remain deferred. |
| AI autonomous clinical/coding/billing action | Patient safety, billing, and compliance harm | Output validation rejects diagnosis/code/charge/claim/order/medical-necessity/final financial behavior; human review required. | Future AI expansion must keep this guardrail and add live governance approval. |
| Public or wrong-tenant export download | PHI disclosure | Server-mediated signed-download metadata, tenant/site/requester/permission/expiry checks, no public URLs. | Production Azure policy and legal hold remain deferred. |
| Destructive raw-audio deletion without approval/recovery | Evidence loss or policy breach | Deletion requires feature flag, approval token, approval ID, open recovery window, audit-safe evidence; transcript purge count remains zero. | Production deletion authority and restore-drill execution remain deferred. |
| PHI in logs, metrics, traces, audit exports, support evidence | Privacy/security incident | Redaction helpers, PHI lint, observability probes, audit export `includePhi=false`, support metadata-only posture. | SIEM/APM vendor selection and production log retention require review. |
| Claim or charge submission without explicit decision | Financial/compliance harm | Draft claim preview keeps `submittedClaim=false`; no live clearinghouse/payer integration. | P11 claim/payer decision gate remains required. |

## Review Findings

- No new P9 blocker was found in the current synthetic/local scope.
- No implemented path enables live external AI, live EHR writeback, live ClinicOS sync, production storage delivery, production deletion, live transcription, charge finalization, medical-necessity determination, or claim submission.
- No compliance certification or production launch claim is supported by the current repo evidence.

## Required Follow-Up Before Launch

- P10 must implement the Frontend Runtime Integration Gate and prove production-intended screens use typed API clients and persisted backend state.
- Production identity, MFA/account recovery, access review, break-glass, SIEM/APM, Azure Blob policy, backup/restore drills, live EHR/ClinicOS contracts, live AI/transcription provider pathways, and launch approvals require founder/security/privacy/legal/vendor review.
- P11 must capture any future claim/payer strategy without enabling autonomous claim submission by default.

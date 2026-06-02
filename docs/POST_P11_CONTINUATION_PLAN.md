# Post-P11 Continuation Plan

## Current state

AURA Note has completed `WO-000` through `WO-064` as synthetic/local, decision-package, planning/control, commercial-readiness rails, runtime persistence switchover, API runtime request-boundary evidence, identity runtime fail-closed evidence, and primary UI runtime API-backed evidence. CR-2 is in progress, and `WO-065` is the next active implementation target. No production launch, live vendor use, production PHI storage, production database credential use, production identity credential use, live Azure credential use, PHI-bearing object delivery, public object URL, destructive production deletion, production restore execution, live transcription credential use, PHI-bearing audio transport, live provider call, production raw-audio storage, live external AI credential use, raw PHI transfer to external AI, live model call, production prompt store, production EHR credential use, raw EHR payload storage, live writeback delivery, writeback without human approval, live ClinicOS credential use, live ClinicOS event-bus delivery, delegated identity bypass, raw ClinicOS payload storage, live ClinicOS synchronization, live WAF/CDN configuration, live SIEM/APM delivery, live claim submission, clearinghouse integration, payer integration, denial automation, payment posting, charge finalization, medical-necessity determination, or patient-facing financial conclusion is approved or implemented.

`next_work_order` no longer remains `null` because the founder approved the commercial-readiness implementation sequence. `WO-065` is the next runtime implementation work order, while `WO-066` through `WO-075` remain planned.

## Continuation rule

Post-P11 work must start with a named work order and must be one of the following:

- **Planning/control tranche:** may update plans, work-order definitions, readiness scripts, runbooks, and status semantics. It must not implement live behavior.
- **Synthetic implementation tranche:** may add browser/API-testable local behavior using synthetic data and disabled vendor boundaries. It must not claim production readiness.
- **Governed live-integration tranche:** may only begin after founder approval plus the required billing, compliance, privacy, security, legal, vendor, credential, rollback, incident-response, and PHI-governance decisions are documented.

## Candidate future tranche families

### Production identity and account lifecycle live review

- Promoted as `WO-053` for planning/control intake only.
- Required decisions: production IdP, SSO protocol, MFA, account recovery, disabled-user source of truth, session timeout, audit retention, break-glass posture, support role limits, and ClinicOS delegation rules.
- Required evidence before implementation: security/privacy approval, credential-source plan, staging environment, role-denial tests, access-review runbook, and incident-response runbook.
- Safe current posture: production-shaped identity remains synthetic and fail-closed.

### Production PHI persistence and database operations review

- Promoted as `WO-054` for planning/control intake only.
- Required decisions: production database host, encryption/KMS, backup cadence, restore drills, RLS expansion policy, data-retention policy, migration approvals, rollback policy, data export policy, and support access policy.
- Required evidence before implementation: security/privacy approval, backup/restore evidence plan, operational owner, local-to-staging promotion runbook, and tenant-isolation test plan.
- Safe current posture: local PostgreSQL evidence remains synthetic/local; production PHI storage is not enabled.

### Production Azure storage, deletion, and restore review

- Promoted as `WO-055` for planning/control intake only.
- Required decisions: Azure account/container, soft delete/versioning, legal hold, immutability, customer-managed keys, signed download TTLs, recovery windows, deletion approval authority, restore drill cadence, and evidence retention.
- Required evidence before implementation: storage security review, no-public-url tests, deletion-approval tests, backup/restore runbook, and incident escalation path.
- Safe current posture: Azure adapter and deletion behavior are local/fake readiness evidence only.

### Live transcription provider review

- Promoted as `WO-056` for planning/control intake only.
- Required decisions: provider, BAA/private path, audio chunking strategy, raw-audio retention, transcript correction policy, diarization reliability posture, retry/dead-letter policy, user consent/notice requirements, and failure fallback.
- Required evidence before implementation: privacy/security approval, synthetic provider contract tests, no-raw-PHI-leakage tests, retention deletion tests, and operational support path.
- Safe current posture: browser audio and transcription remain metadata-only/mock-provider evidence.

### External AI private/BAA pathway review

- Promoted as `WO-057` for planning/control intake only.
- Required decisions: model/provider, BAA/private deployment path, prompt registry ownership, evaluation thresholds, PHI scrub/de-identification policy, source freshness rules, drift monitoring, incident response, and live credential source.
- Required evidence before implementation: AI governance approval, eval harness thresholds, prompt/model versioning, no-raw-PHI-to-external-AI tests, output validation, and human-review gates.
- Safe current posture: external AI remains disabled; outputs remain draft/candidate/suggestion-only.

### Production EHR writeback credentialing review

- Promoted as `WO-058` for planning/control intake only.
- Required decisions: production athenahealth credentialing, writeback scope, approval role, idempotency key strategy, retry/dead-letter policy, reconciliation owner, rollback/support path, and attachment/task semantics.
- Required evidence before implementation: vendor sandbox approval, staging credentials, writeback payload redaction strategy, permission-denial tests, and audit/event contracts.
- Safe current posture: writeback queue remains metadata-only and no live delivery is enabled.

### ClinicOS live integration review

- Promoted as `WO-059` for planning/control intake only.
- Required decisions: live ClinicOS module contracts, M03/M04/M17/M21/M23/M24/M25/M26 event schemas, delegated identity posture, tenant/user mapping, event-bus delivery, replay/reconciliation owner, and degraded-mode policy.
- Required evidence before implementation: ClinicOS integration approval, service-account governance, adapter contract tests, no-permission-bypass tests, and event audit contracts.
- Safe current posture: ClinicOS mode remains mock/degraded and cannot bypass AURA Note permissions.

### Revenue estimate and patient-facing financial content review

- Required decisions: tenant estimate source data, caveat language, patient-facing permission, payer/fee/payment data governance, internal-only revenue controls, support visibility, and compliance review.
- Required evidence before implementation: billing/compliance/privacy approval, no-patient-facing-internal-revenue tests, source-data provenance, role-denial tests, and audit/event contracts.
- Safe current posture: no patient-facing revenue by default; estimates show unavailable/caveat language unless configured.

### Claim, clearinghouse, payer, denial, and payment review

- Required decisions: whether live claim submission belongs in v1 or later, clearinghouse/payer strategy, claim approval role, billing compliance owner, medical-necessity boundary, denial/payment scope, void/reversal policy, payer acknowledgement/reconciliation, and patient-facing financial language.
- Required evidence before implementation: founder, billing, compliance, privacy, security, and legal approval; no-autonomous-submission tests; human approval workflow; audit/event contracts; rollback/reversal runbook; and payer credential plan.
- Safe current posture: draft claim preview remains internal and `submittedClaim=false`.

## Activation checklist for any future work order

- The work order file exists under `work_orders/`.
- `repo_status.json` marks the work order `todo` or `in_progress` and sets `next_work_order` to that ID.
- The production plan references the work order and includes objective, scope, out-of-scope, UX, API, data, event/audit, RBAC/ABAC, standalone, ClinicOS, AI/PHI/security, testing, gates, definition of done, stop conditions, and risks/deferred decisions.
- `SPEC_GAPS.md` records any unresolved product, legal, clinical, billing, privacy, security, or vendor decision.
- Readiness scripts distinguish planning evidence, synthetic/local readiness, and production launch readiness.
- The tranche does not enable live credentials or live PHI paths until the active work order explicitly requires and governs them.

## Current recommendation

`WO-053` promoted the first candidate family, production identity and account lifecycle live review, into a planning/control intake without enabling live behavior. `WO-054` promoted the second candidate family, production PHI persistence and database operations review, into a planning/control intake without enabling live behavior. `WO-055` promoted the third candidate family, production Azure storage, deletion, and restore review, into a planning/control intake without enabling live behavior. `WO-056` promoted the fourth candidate family, live transcription provider review, into a planning/control intake without enabling live behavior. `WO-057` promoted the fifth candidate family, external AI private/BAA pathway review, into a planning/control intake without enabling live behavior. `WO-058` promoted the sixth candidate family, production EHR writeback credentialing review, into a planning/control intake without enabling live behavior. `WO-059` promoted the seventh candidate family, ClinicOS live integration review, into a planning/control intake without enabling live behavior. `WO-060` reopened the commercial-readiness rails, `WO-061` added the first CR-1 runtime persistence switchover evidence, `WO-062` added the API runtime hardening/request-boundary evidence, and `WO-063` added the identity runtime boundary/fail-closed auth evidence. CR-1 is now ready for review; continue to `WO-064` only after checkpoint rules allow moving into CR-2.

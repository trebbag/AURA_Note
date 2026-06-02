# Commercial Observability, SRE, Support, And Incident Operations

Status: `WO-072` review-ready synthetic evidence. Live SIEM, APM, paging, and production on-call execution remain disabled or unconfigured.

## Scope

This document packages operational evidence for commercial review. It does not connect production telemetry vendors, create PHI-bearing logs, authorize production support access, or approve production launch.

## Event And Telemetry Taxonomy

| Area | Evidence | Launch posture |
| --- | --- | --- |
| Structured logs | Request/trace correlated and PHI redacted by `packages/security` helpers. | local only |
| Metrics | Local synthetic metric probes for API support status and runtime paths. | local only |
| Traces | Local trace probes with audit-safe attributes. | local only |
| Audit events | Domain/audit events exist for support status, audit export, retention, AI, EHR, ClinicOS, billing, and commercial readiness review. | audit-safe metadata |
| SIEM/APM | Placeholder sinks are listed as `disabled_until_configured`. | blocked until vendor/security review |

## Incident Severity Taxonomy

| Severity | Example | Required response |
| --- | --- | --- |
| SEV-1 | Suspected unauthorized PHI exposure, tenant isolation break, or live credential leak. | Stop launch path, preserve evidence, founder/security/privacy review. |
| SEV-2 | Workflow outage affecting documentation, export, AI governance, transcription, EHR, ClinicOS, or billing review. | Use degraded-mode runbooks and record support evidence. |
| SEV-3 | Non-PHI support route issue, synthetic smoke failure, or disabled-vendor status drift. | Triage in normal support queue. |
| SEV-4 | Documentation typo, review packet clarification, or non-runtime planning correction. | Batch into maintenance work. |

## Runbook Coverage

- Failed transcription provider or disabled live transcription.
- Failed EHR sandbox adapter or writeback queue stuck in review.
- ClinicOS degraded/unavailable mode.
- AI Gateway PHI rejection, unsafe output rejection, and live-provider disabled state.
- Storage/download token denial and restore-readiness checks.
- Retention deletion approval/recovery controls.
- Identity/session expiration, disabled users, and purpose-of-use denial.
- Security incident intake and rollback decision support.

## Support Boundary

Support status is metadata-only. Support users cannot access raw transcripts, final notes, billing detail outside support-safe metadata, coaching outputs, raw PHI, production secrets, raw EHR/ClinicOS payloads, raw model prompts, raw model responses, or production logs.

Production launch remains blocked: `productionLaunchReady=false`.

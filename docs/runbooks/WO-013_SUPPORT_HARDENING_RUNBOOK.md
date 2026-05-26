# WO-013 Support Hardening Runbook

This runbook covers the CP-4 hardening scaffold. It is synthetic and local-first; it does not authorize production PHI, live AI, live EHR writeback, production analytics, or destructive retention actions.

## Support Status

- Browser shell: `/aura-note/support/status`.
- API: `GET /api/v1/support/status`.
- Required role: support, service account, clinic manager, compliance/privacy lead, or authorized admin.
- Ordinary clinicians, billing staff, and MAs are denied this operational status endpoint.

Expected status:

- `overallHealth = ok` when external integration feature flags remain disabled.
- Structured logging is enabled in scaffold form with request ID and trace ID correlation.
- PHI redaction mode is `forbidden_keys_and_obvious_text`.
- Audit export download delivery is disabled.

## Feature Flags

Default-off flags:

- `AURA_ENABLE_EXTERNAL_AI`
- `AURA_ENABLE_EHR_WRITEBACK`
- `AURA_ENABLE_CLINICOS_SYNC`
- `AURA_ENABLE_PRODUCTION_ANALYTICS`
- `AURA_ENABLE_AUDIT_EXPORT_DOWNLOAD`

If any flag is enabled during CP-4, treat the status as degraded unless a later work order adds production credential, privacy, and governance evidence. Do not add live vendor credentials or production connection strings to this repository.

## Retention

Raw audio:

- Policy: one week.
- Worker job: `raw_audio_retention_candidate_scan`.
- Current scaffold marks purge eligibility only.
- Destructive purge remains disabled.

Transcripts:

- Policy: indefinite unless future tenant policy changes.
- Worker job: `transcript_retention_indefinite_scan`.
- Purge eligibility should remain zero in the scaffold.

Audit:

- Policy: tenant policy.
- Worker job: `audit_export_bundle_generation`.
- Export records are redacted metadata only.

## Audit Export

- API: `POST /api/v1/support/audit-exports`.
- Required role: compliance/privacy lead or authorized admin.
- Required payload: `format = jsonl`, `includePhi = false`, valid `startAt` and `endAt`.
- Output: redacted JSONL metadata represented in the API response.
- Download delivery remains disabled until a later production storage work order.

## Incident Handling

If a hardening test fails:

1. Confirm the failing package and exact command.
2. Check whether a forbidden PHI key or PHI-like text was added outside `packages/security` tests.
3. Check whether a feature flag default changed from disabled to enabled.
4. Check whether raw-audio retention changed from metadata-only candidate scanning to destructive purge.
5. Check whether audit export now includes PHI or downloadable storage delivery.
6. Re-run the narrow test before running the full gate.

Escalate as a blocker if a production credential, PHI-bearing sample, live vendor call, or destructive deletion behavior is required to proceed.

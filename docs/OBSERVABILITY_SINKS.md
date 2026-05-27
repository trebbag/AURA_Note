# Observability Sinks

This document records the `WO-018` local-first observability foundation. It does not authorize production PHI, live vendor delivery, external AI, EHR writeback, ClinicOS sync, production analytics, audit export download, or destructive retention deletion.

## Local adapters

| Sink | Kind | Local delivery | Production posture |
| --- | --- | --- | --- |
| `structured-log-console-local` | log | console | Vendor/SIEM sink not configured. |
| `metric-memory-local` | metric | in-memory probe | Metrics exporter not configured. |
| `trace-memory-local` | trace | in-memory probe | Trace exporter not configured. |
| `audit-export-metadata-local` | audit export | metadata-only API response | Download/storage delivery not configured. |
| `production-siem-placeholder` | log | none | Disabled until vendor, BAA/security review, and credentials are configured. |

## Redaction requirements

- Every structured log must include `requestId` and `traceId`.
- Observability labels and trace attributes must pass through PHI-safe redaction helpers before exposure.
- Forbidden PHI keys and obvious PHI-like text are redacted before local status output.
- Production sinks must remain disabled until a later work order defines vendor, retention, access, transport, encryption, and failure behavior.

## Probe coverage

The current support status response exposes synthetic probes for:

- API support status latency.
- Worker queue depth.
- Support status trace span.
- Disabled production SIEM/log sink state.

These probes are readiness evidence for adapter boundaries only. They are not production SLO dashboards.

# Launch Operations Readiness

`WO-049` adds synthetic/local operational readiness evidence for the P10 launch-candidate path. This is a launch-operations control package, not a production launch approval. It performs no production deployment, uses no production credentials, touches no live vendors, sends no PHI externally, and keeps `productionLaunchReady=false`.

## local/staging/production environment matrix

| Environment | Purpose | Required promotion evidence | Default posture |
| --- | --- | --- | --- |
| Local | Developer and CI verification with synthetic data. | `pnpm launch:ops-readiness`, existing persistence/storage/retention/security/readiness gates, and browser workflow evidence. | Live vendors disabled, synthetic data only. |
| Preview | Pull-request review with ephemeral synthetic data. | Successful CI, no prohibited launch claims, role-denial checks, failed/degraded route states. | Production credentials unavailable; vendor paths fail closed. |
| Staging | Controlled pre-launch rehearsal after security review. | Migration plan, rollback plan, smoke checks, access review, incident tabletop, backup/restore metadata check. | Requires approved secrets manager and non-production vendor contracts before any live vendor traffic. |
| Production | Limited launch only after founder, clinical, compliance, privacy, and security approval. | Formal signoff, approved tenant, access review, monitored rollback window, support escalation owner, incident response owner. | Blocked by default in this work order. |

## release promotion ladder

1. Build and test: run local and CI gates, including `pnpm launch:ops-readiness`.
2. Migrate rehearsal: use existing Prisma migration evidence and backup/restore metadata checks.
3. Smoke check: verify web, API, worker, persistence, storage, retention, EHR, ClinicOS, AI gateway, and support status degrade safely with live vendors disabled.
4. Review evidence: confirm run log, status, route state inventory, access review, incident drill, and support escalation evidence.
5. Rollback readiness: confirm the rollback target, release owner, migration owner, and recovery window before any live environment promotion.

## rollback rehearsal

Rollback remains rehearsal-only in `WO-049`. A release may roll back by redeploying the last known good artifact, disabling high-risk feature flags, keeping external AI/EHR/ClinicOS/storage delivery disabled, and preserving audit/event evidence. Database rollback requires explicit migration-specific review because destructive schema rollback can affect clinical, billing, and audit records.

## synthetic performance baseline

`pnpm performance:launch-baseline` runs a deterministic local harness across 100 synthetic workflows. It measures schedule-list, finalization, export metadata, and denied-vendor fallback timings against conservative local thresholds. The harness uses synthetic identifiers only, performs no network calls, sends no production traffic, and records no patient data.

## reliability drill catalog

| Drill | Expected behavior | Evidence |
| --- | --- | --- |
| Vendor outage drill | AI, EHR, ClinicOS, transcription, and storage paths fail closed or return metadata-only disabled states. | Support status and existing integration readiness scripts. |
| Export delivery failure | Secure download remains server mediated; expired, wrong-tenant, wrong-role, and missing-object cases are denied. | Storage and secure-download readiness gates. |
| Retention deletion recovery window | Raw-audio deletion requires feature flag, approval token, soft-delete/versioning posture, and recovery evidence. | Retention readiness gates; transcript purge count remains zero. |
| Disabled or expired user | Platform access fails closed before sensitive operational metadata is exposed. | Platform and browser tests. |
| Writeback failure | EHR/ClinicOS writeback remains approval-gated, idempotent, retryable, and dead-lettered without raw payload exposure. | EHR and ClinicOS readiness gates. |

## incident response

Incident response for launch rehearsal is metadata-only. Capture severity, owner, affected synthetic tenant/site, trace ID, feature flags changed, rollback decision, tests rerun, and support notification status. Do not paste PHI, secrets, raw transcripts, final notes, billing details, raw AI prompts, or raw vendor payloads into logs or tickets.

## access review

Access review must prove authorized admin, compliance/privacy, support, clinic manager, billing, clinician, MA, service-account, and delegated ClinicOS states remain role limited. Support users remain metadata-only and cannot access transcripts, final notes, billing details, coaching outputs, raw prompts, writeback payloads, or audit export payloads.

## support escalation

Support escalation must identify:

- release owner;
- clinical workflow owner;
- compliance/privacy owner;
- security owner;
- infrastructure owner;
- rollback decision owner;
- patient-safety escalation path.

These are placeholders until a founder-approved launch package assigns named people. Until then, launch operations remain synthetic and `productionLaunchReady=false`.

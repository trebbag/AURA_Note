# WO-042 — Azure Storage, Secure Downloads, Retention Deletion, Backup, And Restore Controls

## Objective

Move storage delivery and retention deletion from readiness scaffolding to production-shaped executable boundaries with recovery evidence, while keeping all payloads synthetic and all live storage credentials disabled unless explicitly configured later.

## Why this exists

`WO-032` added Azure-oriented storage metadata, fake adapters, signed-download semantics, and retention deletion readiness. Commercial production readiness requires hardened server-mediated download controls, adapter configuration validation, retention deletion approval/recovery behavior, and backup/restore evidence paths that are testable without real PHI or production credentials.

## Prerequisites

- `WO-041` production identity, tenant administration, secrets/config validation, and feature-flag governance is complete.
- High-risk feature flags for production storage and retention deletion default disabled and require approval evidence.
- No active `SPEC_GAP` blocks secure download, object ownership, retention deletion approval, backup, restore, or evidence-retention policy.

## In scope

- Azure Blob storage adapter boundary with safe local/fake execution and production-shaped configuration.
- Server-mediated signed-download/token flow for final note, patient summary, structured export, and audit export artifacts.
- Tenant/site/role/object-ownership checks before token issue or content delivery.
- Expired, wrong-tenant, wrong-role, disabled-feature, and missing-object denial paths.
- Raw-audio deletion job integration over storage object metadata with approval, recovery-window, checksum/eTag, trace, and audit evidence.
- Backup/restore readiness metadata checks for database and object storage posture.
- Documentation for required Azure Blob soft-delete/versioning, database backups, evidence retention, and restore-drill gates.

## Out of scope

- Real Azure credentials, real Blob containers, production object payloads, or `.env` files.
- PHI-bearing production PDF/audio/transcript/export storage.
- Live destructive production deletion.
- Transcript deletion; transcript retention remains indefinite unless a later approved tenant policy changes.
- Live EHR writeback, external AI, claim submission, or charge finalization.

## UX requirements

- Admin/support surfaces must expose download unavailable, ready, expired, denied, storage-disabled, retention-pending, retention-skipped, deletion-approved, recovery-window-open, restore-readiness-ready, and failed states.
- Export/download views must preserve role-specific internal-detail exclusions, including patient-summary exclusion of internal billing/revenue/coaching/confidence details.
- Retention status must make destructive deletion disabled-by-default visible.

## Backend/API requirements

- Add or harden storage adapter interfaces for Azure Blob and deterministic local/fake storage.
- Add secure download endpoints or service methods backed by token validation, object metadata lookup, tenant/site scope, role permission, expiration, and audit events.
- Extend export/audit delivery services so storage-backed delivery metadata is returned only when enabled and permission-checked.
- Extend worker retention behavior so raw-audio object deletion executes only when feature flag and approval token are present in synthetic config.
- Keep API operation names aligned with actual backed behavior and avoid implying launch-ready production storage.

## Data model/persistence requirements

- Persist or represent object metadata, retention class, checksum/eTag, content length, tenant/site ownership, artifact type, token metadata, deletion evidence, approval ID, trace ID, recovery-window state, and restore-readiness evidence.
- Tenant-owned storage metadata must be tenant/site scoped and covered by RLS or tenant-isolation evidence consistent with the P7 pattern.
- No secret values, production URLs, real patient data, raw PHI audio, or PHI-bearing export contents may be committed.

## Event/audit requirements

- Emit audit/domain evidence for download requested, download denied, token issued, token expired, object delivered, storage object missing, raw-audio deletion skipped, raw-audio object deleted, restore-readiness checked, and backup posture checked.
- Event payloads must contain audit-safe metadata only and must not contain secrets, public URLs, raw PHI, transcript content, or production object payloads.

## RBAC/ABAC requirements

- Final-note downloads require final-note export visibility.
- Patient-summary downloads require patient-summary export visibility and internal-detail exclusion.
- Audit-export downloads require compliance/privacy lead or authorized admin.
- Support users cannot request audit exports or access PHI-bearing artifacts.
- ClinicOS-integrated mode cannot bypass AURA Note permissions.

## Standalone-mode behavior

- Standalone mode uses AURA Note tenant storage configuration and local/fake storage in tests.
- Disabled production storage must fall back to metadata-only synthetic delivery without leaking payloads.

## ClinicOS-integrated behavior

- ClinicOS mode may map object metadata and retention evidence through adapter boundaries, but all token, download, deletion, and permission decisions remain enforced by AURA Note.
- Missing ClinicOS storage/delegation config must fail closed.

## AI/PHI/security requirements

- No raw PHI is sent to external AI.
- Download tokens are short-lived, permission checked, server mediated, tenant scoped, and not public URLs.
- Raw audio deletion requires retention deletion feature flag, approval token, backup/restore posture evidence, audit, and recovery-window metadata.
- Transcript purge count remains zero.
- Logs are redacted and request/trace correlated.

## Testing requirements

- Unit and API tests for token issue, token expiry, wrong tenant, wrong site, wrong role, disabled user, missing object, patient-summary internal-detail exclusion, and support denial.
- Adapter tests for fake Azure storage put/head/delete/signed-token metadata and production config validation without real credentials.
- Worker tests for raw-audio deletion approval, skipped deletion without approval, recovery-window evidence, checksum/eTag evidence, and transcript non-deletion.
- Browser tests for secure download and retention/restore status states.
- Readiness tests proving no real credentials, `.env`, production URL, private key, real patient, or PHI-bearing fixture is committed.

## Required scripts/gates

- Add `pnpm storage:secure-download-readiness` or equivalent.
- Add `pnpm retention:production-readiness` or equivalent.
- Run the standard local gate:
  - `pnpm install --frozen-lockfile`
  - `pnpm db:client:generate`
  - `pnpm lint`
  - `pnpm lint:phi`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm test:e2e`
  - `pnpm test:browser`
  - `pnpm build`
  - all applicable persistence/storage/retention/readiness scripts
  - `pnpm identity:production-readiness`
  - `pnpm config:production-readiness`
  - new storage/download/retention readiness scripts
  - `pnpm production:readiness`
  - `pnpm acceptance:readiness`
  - `node scripts/status.js`
  - `git diff --check`

## Definition of Done

- Production-shaped Azure storage/download/retention/backup/restore controls are review-ready using synthetic/local evidence.
- Secure downloads are tenant/site/role/token scoped, server mediated, audit logged, and covered by positive and denial tests.
- Raw-audio storage object deletion requires explicit synthetic approval controls and records audit-safe evidence.
- Transcript objects are not deleted.
- Backup/restore posture and restore-readiness metadata are documented and testable.
- `RUN_LOG.md`, `repo_status.json`, relevant docs, scripts, tests, and work-order status are updated.

## Stop conditions

- Real Azure credentials, production secret stores, PHI-bearing object payloads, production deletion authority, backup/restore policy, restore-drill execution, or production retention approval is required.
- Missing or contradictory policy for production soft-delete/versioning, recovery window, destructive deletion approval, evidence retention, or download authorization blocks safe implementation.
- Any implementation would expose public URLs, secrets, raw PHI, transcripts, billing data, coaching outputs, final notes, autonomous clinical/coding/billing behavior, charge finalization, or claim submission without explicit authorization.

## Risks and deferred decisions

- Production Azure account/container policy, soft-delete/versioning settings, customer-managed keys, backup schedule, restore-drill cadence, legal hold requirements, and evidence-retention windows require founder/security/privacy review and environment access.

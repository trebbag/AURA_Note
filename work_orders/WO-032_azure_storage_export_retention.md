# WO-032 — Azure Blob Export Delivery And Retention Deletion Readiness

## Objective

Add Azure Blob-oriented production storage delivery scaffolding for signed exports, audit export bundles, and raw-audio retention deletion while keeping all evidence synthetic and local.

## Source Trace

- `AGENTS.md` sections 8, 14, 16, and 17.
- `docs/BACKEND_BUILD_SPEC.md` export, retention, audit, and background-job posture.
- `docs/PERSISTENCE_FOUNDATION.md` output/writeback persistence and retention boundaries.
- `docs/DATA_MODEL.md` export artifact and raw-audio retention records.
- `docs/TEST_PLAN.md` post-CP4 readiness gates.

## Scope

- Add `@aura-note/storage` with `ObjectStorageAdapter`, `AzureBlobObjectStorageAdapter`, and `InMemoryObjectStorageAdapter`.
- Add Azure-oriented config names: `AZURE_STORAGE_ACCOUNT_NAME`, `AZURE_STORAGE_CONTAINER_NAME`, and `AZURE_STORAGE_CREDENTIAL_SOURCE`.
- Extend export/audit DTOs with storage provider, key, content length, delivery mode, signed download token, expiry, and checksum metadata.
- Keep signed download semantics as short-lived permission-checked tokens, not public URLs.
- Add API tests for storage-backed final-note, patient-summary, structured export, and audit export metadata.
- Add worker raw-audio storage deletion readiness requiring feature flag plus approval token/ID, with transcript deletion remaining zero.
- Add readiness commands and CI gates:
  - `pnpm storage:azure-adapter-readiness`
  - `pnpm retention:storage-deletion-readiness`

## Out Of Scope

- Real Azure account access or live Azure SDK calls.
- Committed `.env`, credentials, production connection strings, private keys, or PHI-bearing fixtures.
- Production backup/restore execution.
- EHR writeback, live AI, production analytics, charge finalization, medical-necessity determination, claim submission, or autonomous clinical/coding/billing behavior.

## Acceptance Evidence

- Storage adapter unit tests cover Azure request construction, config validation, in-memory object writes, signed token creation, token expiry denial, wrong-tenant denial, and deletion evidence.
- API tests cover storage-backed export and audit export metadata while keeping patient-summary internal-detail exclusion and `includePhi: false`.
- Worker tests cover raw-audio object deletion only with approval controls and prove transcript purge count remains zero.
- Readiness scripts pass locally and in CI.

## Status

Done when local gates and CI pass for the WO-032 PR.

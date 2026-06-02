# Production Azure Storage, Deletion, And Restore Review

## Purpose

This document captures the production decisions required before AURA Note can use Azure Blob Storage for PHI-bearing export delivery, raw-audio storage, destructive deletion, or restore execution.

This is a planning/control artifact only. It does not provision Azure resources, introduce credentials, enable public URLs, deliver PHI-bearing objects, run destructive deletion against production storage, execute restore drills, or approve production launch.

## Current Safe Posture

- `WO-032` and `WO-042` provide production-shaped object-storage, secure-download, deletion-approval, and restore-readiness scaffolding using deterministic local/fake storage evidence.
- Existing storage behavior remains synthetic/local and metadata-oriented unless a later approved implementation work order enables a governed live path.
- Raw-audio deletion remains approval-gated and recovery-window-aware in local evidence only.
- Transcript retention remains indefinite unless a future tenant policy is approved and implemented.

## Founder-Provided Partial Input Captured 2026-06-02

Use the local Flow project at `/Users/gregorygabbert/Documents/GitHub/Flow` as the reference implementation pattern for Azure storage and recovery planning.

Flow evidence to evaluate for AURA Note:

- Azure Key Vault as the secret source for sensitive runtime values.
- Azure Blob soft-delete and versioning as the documented object-storage recovery posture.
- Azure Blob private deployment-package usage for App Service run-from-package delivery.
- Disaster-recovery objectives that include PostgreSQL point-in-time recovery, Key Vault soft-delete/purge protection, and Blob recovery expectations.

This partial input does not approve AURA Note PHI-bearing export, raw-audio, transcript, audit-export, or evidence object storage. The Flow private deployment-package Blob pattern is deployment infrastructure evidence, not AURA Note PHI artifact-storage approval.

## AURA Note Azure Resource Baseline Verified 2026-06-02

Azure CLI verification succeeded for the founder-provided resource group:

- Tenant ID: `b9b1d566-d7ed-44a4-b3cc-cf8786d6a6ed`
- Subscription: `Subscription Malady`
- Subscription ID: `91d0e7fe-e9c6-40a0-af0f-98a9dc07b218`
- Resource group: `AURA_resource_group`
- Resource group location: `eastus`
- Provisioning state: `Succeeded`

This confirms the non-secret Azure tenant/subscription/resource-group baseline for future AURA Note storage planning. It does not create or approve a storage account, containers, managed identity, credentials, private networking, PHI object delivery, destructive deletion, restore execution, or production launch.

## Required Production Decisions

### Azure account and container topology

- Select the production storage account, storage region if different from `eastus`, redundancy tier, and container topology inside the verified AURA Note Azure baseline.
- Define tenant/site object-key partitioning and whether tenants share a storage account with strict prefixes or use isolated accounts/containers.
- Define private-networking, firewall, and managed private endpoint requirements before PHI-bearing storage is enabled.

### Credential source and access model

- Select the credential source, such as managed identity or a secret-manager-mediated credential.
- Prohibit committed credentials, `.env` secrets, shared access keys in source control, and browser-side storage credentials.
- Define least-privilege roles for upload, server-mediated download, deletion, restore-readiness verification, support review, and audit export delivery.

### Encryption and key management

- Decide whether customer-managed keys are required.
- Define key rotation, disabled-key recovery, key access review, and alerting requirements.
- Define whether tenant-level key isolation is required before PHI-bearing object delivery.

### Secure download policy

- Define signed-download TTLs, token audience, tenant/site scoping, role checks, purpose-of-use checks, revocation behavior, and audit requirements.
- Confirm that production downloads are server-mediated and never public container/object URLs.
- Define patient-summary detail exclusions and final-note/transcript/billing/coaching access boundaries before launch readiness.

### Soft delete, versioning, immutability, and legal hold

- Define Azure Blob soft-delete, versioning, point-in-time restore, immutability, and legal-hold posture.
- Define how legal hold or incident hold blocks deletion jobs.
- Define the evidence required to prove an object was recoverable during the documented recovery window.

### Raw-audio retention and deletion authority

- Confirm the one-week raw-audio retention policy and the exact purge eligibility clock.
- Define deletion approval authority, approval-token source, recovery-window handling, skipped/deferred deletion reasons, and emergency suspension controls.
- Confirm that transcript retention remains indefinite and that transcript objects are not deleted by raw-audio retention jobs.

### Backup and restore drills

- Define backup/replication expectations, restore-drill cadence, restore-drill owner, pass/fail evidence, and incident escalation path.
- Define whether restore drills operate against isolated synthetic/staging objects only until a security/privacy review authorizes PHI-bearing drills.
- Define restore-readiness evidence retention and whether restore execution requires separate founder/security/privacy approval.

### Evidence retention and audit export delivery

- Define how download, export, deletion, legal hold, restore-readiness, and support-access evidence is retained.
- Define audit export bundle delivery posture, redaction requirements, storage retention class, and authorized request roles.
- Preserve `includePhi=false` unless a later approved privacy/legal work order explicitly governs PHI-bearing audit exports.

### Incident response

- Define escalation for suspected public exposure, credential compromise, failed deletion, failed restore-readiness, unexpected object access, and legal-hold conflicts.
- Define who can pause deletion workers and how the pause is audited.

## Future Acceptance Criteria

A later implementation work order may enable production Azure storage only when all of the following are true:

- Azure account/container topology and private-network posture are approved.
- Credential source, managed identity or secret-manager design, and least-privilege roles are approved.
- Encryption/KMS, key rotation, and access-review posture are approved.
- Secure downloads are server-mediated, tenant/site/role/purpose scoped, expiring, revocable, and audit logged.
- No public object URLs or browser-side storage credentials are exposed.
- Soft delete, versioning, immutability, legal hold, recovery-window, and restore-readiness controls are configured and evidenced.
- Raw-audio deletion requires feature flag, approval, recovery-window status, audit evidence, and transcript non-deletion proof.
- Restore drills have a documented cadence, owner, synthetic/staging evidence path, and escalation process.
- Audit export storage delivery remains redacted by default and rejects `includePhi`.
- Role-denial, wrong-tenant, expired-token, legal-hold, failed-delete, and restore-readiness tests pass locally and in CI.

## Future Event And Audit Inventory

Future implementation must define and test these events before live use:

- `storage.azure_config_reviewed.v1`
- `storage.object_upload_authorized.v1`
- `storage.object_upload_denied.v1`
- `storage.download_token_requested.v1`
- `storage.download_token_denied.v1`
- `storage.object_download_delivered.v1`
- `storage.public_url_rejected.v1`
- `storage.raw_audio_deletion_approved.v1`
- `storage.raw_audio_deletion_skipped.v1`
- `storage.raw_audio_deleted.v1`
- `storage.transcript_retention_preserved.v1`
- `storage.legal_hold_applied.v1`
- `storage.legal_hold_blocked_deletion.v1`
- `storage.restore_readiness_verified.v1`
- `storage.restore_drill_completed.v1`
- `storage.incident_recorded.v1`

## Standalone Mode Requirements

Standalone mode must use AURA Note tenant/site storage configuration, AURA Note permissions, AURA Note audit events, AURA Note retention policy, and AURA Note support-access controls. Storage object keys must remain tenant/site scoped and must not rely on ClinicOS identifiers for authorization.

## ClinicOS-Integrated Mode Requirements

ClinicOS-integrated mode may map storage delivery and evidence to ClinicOS or Integration Hub identifiers only through adapter boundaries. ClinicOS must not bypass AURA Note tenant/site scoping, role checks, purpose-of-use checks, legal hold, retention policy, audit evidence, or download-token enforcement.

## Deferred Until Future Work Order

- Production Azure resource provisioning.
- Production storage credentials, managed identity binding, or secret-manager integration.
- PHI-bearing object upload/download delivery.
- Live Azure SDK execution against production resources.
- Public-network/private-network policy verification against a real account.
- Destructive production deletion.
- Production restore execution.
- PHI-bearing audit export delivery.
- Production launch approval.

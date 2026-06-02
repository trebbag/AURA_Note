# Production Azure Storage, Deletion, And Restore Review

## Purpose

This document captures the production decisions and no-PHI infrastructure evidence required before AURA Note can use Azure Blob Storage for PHI-bearing export delivery, raw-audio storage, destructive deletion, or restore execution.

This is not a production activation artifact. It now records that no-PHI Azure infrastructure has been provisioned, but it does not introduce production runtime credentials, enable public URLs, deliver PHI-bearing objects, run destructive deletion against production storage, execute restore drills, or approve production launch.

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

This confirmed the non-secret Azure tenant/subscription/resource-group baseline used for the later no-PHI storage provisioning evidence. It did not by itself approve PHI object delivery, destructive deletion, restore execution, or production launch.

## AURA Note Storage Decisions Captured 2026-06-02

The founder/operator confirmed that `eastus` is acceptable and authorized Codex to make the remaining non-secret production Azure storage, deletion, and restore choices for planning purposes.

`docs/PRODUCTION_AZURE_STORAGE_DECISION_RECORD.md` now records:

- storage account `auranoteeastus91d0`, which Azure reported as available during `az storage account check-name` before creation on 2026-06-02;
- one `StorageV2` account in `eastus`, `Standard ZRS`, `Hot` tier, TLS 1.2 or later, secure transfer required, public blob access disabled, shared key access disabled, and managed-identity access;
- managed identity `aura-note-storage-mi` and Key Vault reference `aura-note-kv-91d0`;
- containers for final note PDFs, patient summary PDFs, structured exports, redacted audit export bundles, raw audio, transcripts, storage evidence, and restore-drill evidence;
- tenant/site object-key prefixing, private endpoint requirement, server-mediated download tokens, TTLs, role/tenant/site/purpose checks, patient-summary internal-detail exclusions, and redacted audit export posture;
- raw-audio 7-day purge eligibility, transcript indefinite retention, 14-day Blob and container soft delete, versioning, legal-hold deletion blocking, evidence retention, restore-readiness cadence, and monitoring/alerting requirements.

This removed ambiguity for future `WO-081` implementation and was followed by no-PHI Azure infrastructure provisioning evidence in `docs/PRODUCTION_AZURE_STORAGE_PROVISIONING_EVIDENCE.md`. It still does not enable PHI-bearing production object storage, public URLs, destructive production deletion, restore drills, or launch.

## AURA Note No-PHI Azure Provisioning Evidence Captured 2026-06-02

After the founder/operator confirmed `eastus` and delegated the remaining non-secret choices, Codex provisioned the safe no-PHI Azure foundation:

- storage account `auranoteeastus91d0`;
- private artifact containers listed in the decision record;
- managed identity `aura-note-storage-mi`;
- storage-account-scoped `Storage Blob Data Contributor` role assignment for the managed identity;
- Key Vault boundary `aura-note-kv-91d0`;
- VNet `aura-note-vnet-eastus`;
- private endpoint subnet `aura-note-private-endpoints`;
- private DNS zone and VNet link for `privatelink.blob.core.windows.net`;
- Blob private endpoint `aura-note-storage-blob-pe` with approved connection and private DNS record.

Azure CLI verification showed public network access disabled, firewall deny-by-default, shared key access disabled, Blob public access disabled, HTTPS-only traffic, TLS 1.2 minimum, 14-day Blob soft delete, 14-day container soft delete, and Blob versioning enabled.

The provisioning evidence is infrastructure-only. AURA Note still needs approved runtime config/secret-store references, runtime private-network integration, synthetic no-PHI object-level tests, legal-hold/deletion/restore-readiness execution evidence, and explicit production flags before PHI storage or deletion behavior can be enabled.

## Required Production Decisions

### Azure account and container topology

- Selected and provisioned for no-PHI activation evidence: storage account `auranoteeastus91d0`, `eastus`, `StorageV2`, `Standard ZRS`, `Hot`, shared-account with strict tenant/site prefixes, and artifact-class containers listed in `docs/PRODUCTION_AZURE_STORAGE_DECISION_RECORD.md`.
- Production object keys must use tenant/site prefixes and activation should add date partitioning without weakening the current tenant-scoped key invariant.
- Private endpoint, private DNS, deny-by-default firewall, and no public Blob access remain required before PHI-bearing storage is enabled.

### Credential source and access model

- Selected credential source: managed identity.
- Prohibit committed credentials, `.env` secrets, shared access keys in source control, and browser-side storage credentials.
- Managed identity: `aura-note-storage-mi`; Key Vault reference: `aura-note-kv-91d0`.
- Future activation must define least-privilege roles for upload, server-mediated download, deletion, restore-readiness verification, support review, and audit export delivery.

### Encryption and key management

- Current default: Microsoft-managed encryption at rest until a later customer-managed-key requirement is explicitly approved.
- Define key rotation, disabled-key recovery, key access review, and alerting requirements.
- Tenant-level key isolation is deferred; tenant/site object-key partitioning and RBAC/ABAC remain required before PHI-bearing object delivery.

### Secure download policy

- Signed-download TTLs are selected in `docs/PRODUCTION_AZURE_STORAGE_DECISION_RECORD.md`: 10 minutes for final note PDF, patient summary PDF, and structured export; 15 minutes for redacted audit export bundles; 5 minutes for support or restore evidence metadata.
- Confirm that production downloads are server-mediated and never public container/object URLs.
- Define patient-summary detail exclusions and final-note/transcript/billing/coaching access boundaries before launch readiness.

### Soft delete, versioning, immutability, and legal hold

- Selected posture: 14-day Blob soft delete, 14-day container soft delete, Blob versioning enabled, legal hold supported and deletion-blocking, and scoped immutability for evidence/incident/legal-hold objects only.
- Legal hold or incident hold blocks deletion jobs.
- Define the evidence required to prove an object was recoverable during the documented recovery window.

### Raw-audio retention and deletion authority

- Confirmed planning default: raw audio is purge-eligible after 7 days from recording upload completion or recording stop, whichever is later.
- Selected planning default: deletion requires `AZURE_STORAGE_RETENTION_DELETION_ENABLED=true`, a persisted deletion approval record, recovery-window evidence, no legal hold, skipped/deferred deletion reason handling, emergency suspension controls, and audit-safe trace evidence.
- Confirm that transcript retention remains indefinite and that transcript objects are not deleted by raw-audio retention jobs.

### Backup and restore drills

- Selected cadence: quarterly synthetic restore-readiness drill plus one staging restore-readiness drill before any production PHI storage activation.
- Restore drills operate against isolated synthetic/staging objects until a security/privacy review authorizes PHI-bearing drills.
- Production PHI restore execution requires separate founder/security/privacy approval.

### Evidence retention and audit export delivery

- Selected evidence posture: audit export bundles and storage evidence retain at least 7 years unless a longer tenant/legal policy applies.
- Audit export bundle delivery remains redacted by default and requires authorized compliance/privacy lead or authorized admin roles.
- Preserve `includePhi=false` unless a later approved privacy/legal work order explicitly governs PHI-bearing audit exports.

### Incident response

- Selected alert set is listed in `docs/PRODUCTION_AZURE_STORAGE_DECISION_RECORD.md`, including public access, shared key, TLS, firewall, private endpoint/DNS, soft-delete/versioning, legal-hold, deletion, restore-readiness, wrong-tenant/download-denial, high-egress, Key Vault, managed identity, and role-assignment changes.
- Future activation must wire deletion-worker pause authority to founder/operator, compliance/privacy lead, or security incident authority and audit the pause.

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

- Production runtime credential delivery, managed identity config-store binding, or secret-manager integration.
- PHI-bearing object upload/download delivery.
- Live Azure SDK execution against production resources from the AURA Note runtime.
- Object-level upload/download/delete/readiness verification through the private runtime path.
- Destructive production deletion.
- Production restore execution.
- PHI-bearing audit export delivery.
- Production launch approval.

## Future Activation Evidence Now Narrowed By Decision Record

`WO-081` no longer needs to invent the storage account/container names, `eastus` region decision, basic redundancy tier, credential source, download TTLs, raw-audio retention window, transcript retention posture, Blob soft-delete/versioning window, restore-readiness cadence, or initial no-PHI Azure infrastructure. It still must bind approved runtime configuration, connect the app through the private network, verify live Azure object behavior with synthetic no-PHI objects, prove deletion/legal-hold/restore-readiness controls, wire monitoring, and keep production PHI/deletion/restore/launch flags disabled until the activation gate passes.

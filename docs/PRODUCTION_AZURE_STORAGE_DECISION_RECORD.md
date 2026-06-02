# Production Azure Storage Decision Record

## Purpose

This record captures the non-secret AURA Note Azure Blob Storage choices that can be made from the founder-approved `eastus` posture and the verified AURA Note Azure resource baseline.

This is not a live production storage activation. No Azure storage account, container, managed identity, private endpoint, credential, PHI object, public URL, destructive deletion, or restore execution is provisioned or enabled by this record.

## Decision Authority And Date

- Decision date: 2026-06-02
- Decision authority: founder/operator approval to use `eastus` and let Codex make the remaining non-secret storage, deletion, and restore choices.
- Evidence type: planning/control and future activation defaults.

## Verified Azure Baseline

- Tenant ID: `b9b1d566-d7ed-44a4-b3cc-cf8786d6a6ed`
- Subscription: `Subscription Malady`
- Subscription ID: `91d0e7fe-e9c6-40a0-af0f-98a9dc07b218`
- Resource group: `AURA_resource_group`
- Region/residency: `eastus`
- Provisioning state verified for resource group: `Succeeded`

## Storage Account Decision

- Candidate storage account name: `auranoteeastus91d0`
- Azure name availability evidence: `az storage account check-name --name auranoteeastus91d0` returned `nameAvailable: true` on 2026-06-02.
- Account kind: `StorageV2`
- Performance tier: `Standard`
- Redundancy: `Standard ZRS` for production where available in `eastus`
- Access tier: `Hot`
- Minimum TLS: `TLS1_2`
- Secure transfer: required
- Public blob access disabled: required
- Shared key access disabled: required
- Browser-side storage credentials: prohibited
- Production credential source: `managed_identity`
- User-assigned managed identity candidate name: `aura-note-storage-mi`
- Key Vault candidate name for non-runtime secret/config references: `aura-note-kv-91d0`

If the candidate storage account name is no longer available when provisioning occurs, use the same naming policy with a short deterministic suffix derived from the subscription or approved deployment environment, and record a fresh `az storage account check-name` result before creation.

## Container Topology

Use one production storage account with separate private containers by artifact class. Authorization is enforced by AURA Note tenant/site/RBAC checks, server-side token issuance, and tenant/site object-key prefixes. Do not expose containers publicly.

| Artifact class | Container |
| --- | --- |
| Final note PDFs | `aura-final-note-pdfs` |
| Patient summary PDFs | `aura-patient-summary-pdfs` |
| Structured exports | `aura-structured-exports` |
| Redacted audit export bundles | `aura-audit-export-bundles` |
| Raw audio | `aura-raw-audio` |
| Transcripts | `aura-transcripts` |
| Deletion/download/export evidence | `aura-storage-evidence` |
| Restore-readiness evidence | `aura-restore-drill-evidence` |

Production object keys must be tenant/site scoped:

```text
tenants/{tenantId}/sites/{siteId}/{artifactClass}/{yyyy}/{mm}/{dd}/{recordId}/{fileName}
```

The existing synthetic storage adapter already proves tenant-scoped keys. The production activation work order should add date partitioning without weakening the required `tenants/{tenantId}/sites/{siteId}/...` prefix.

## Private Networking And Access Model

- Private endpoint required before PHI-bearing object storage is enabled.
- Private DNS required for application runtime access.
- Storage account firewall should be deny-by-default for production PHI storage.
- Any temporary public-network access during provisioning or diagnostics must remain non-PHI, time-boxed, audited, and disabled before production PHI delivery.
- App runtime must access Blob Storage through server-side code only.
- Download responses must be server-mediated; AURA Note must not return public Blob URLs.
- Support users may access metadata only unless a later approved support-access work order grants narrower evidence access.

## Configuration Names

Approved non-secret configuration names:

- `AZURE_STORAGE_ACCOUNT_NAME`
- `AZURE_STORAGE_CREDENTIAL_SOURCE`
- `AZURE_STORAGE_MANAGED_IDENTITY_CLIENT_ID`
- `AZURE_STORAGE_CONTAINER_FINAL_NOTE_PDFS`
- `AZURE_STORAGE_CONTAINER_PATIENT_SUMMARY_PDFS`
- `AZURE_STORAGE_CONTAINER_STRUCTURED_EXPORTS`
- `AZURE_STORAGE_CONTAINER_AUDIT_EXPORT_BUNDLES`
- `AZURE_STORAGE_CONTAINER_RAW_AUDIO`
- `AZURE_STORAGE_CONTAINER_TRANSCRIPTS`
- `AZURE_STORAGE_CONTAINER_STORAGE_EVIDENCE`
- `AZURE_STORAGE_CONTAINER_RESTORE_DRILL_EVIDENCE`
- `AZURE_STORAGE_PRIVATE_ENDPOINT_REQUIRED`
- `AZURE_STORAGE_PUBLIC_NETWORK_DISABLED`
- `AZURE_STORAGE_SHARED_KEY_DISABLED`
- `AZURE_BLOB_SOFT_DELETE_ENABLED`
- `AZURE_BLOB_VERSIONING_ENABLED`
- `AZURE_BLOB_CONTAINER_SOFT_DELETE_ENABLED`
- `AZURE_STORAGE_LEGAL_HOLD_SUPPORTED`
- `AZURE_STORAGE_RETENTION_DELETION_ENABLED`

No secret values, storage account keys, SAS tokens, connection strings, private keys, or `.env` values may be committed.

## Secure Download Policy

All downloads are permission-checked and server-mediated. Tokens are AURA Note internal download tokens, not public Blob signed URLs.

| Artifact | Token TTL |
| --- | --- |
| Final note PDF | 10 minutes |
| Patient summary PDF | 10 minutes |
| Structured export | 10 minutes |
| Redacted audit export bundle | 15 minutes |
| Support or restore evidence metadata | 5 minutes |

Token rules:

- Tenant, site, object key, artifact class, requesting user, role, purpose-of-use, and permission must be bound to the token.
- Expired, revoked, wrong-tenant, wrong-site, wrong-user, wrong-role, wrong-purpose, and finalized/read-only mismatch requests must be denied before Blob access.
- Patient summary downloads must continue excluding internal billing, revenue, coaching, confidence, and transcript details.
- Audit export delivery remains redacted by default and must reject `includePhi=true`.

## Retention And Deletion Policy

- Raw audio: purge-eligible after 7 days from recording upload completion or recording stop, whichever is later.
- Raw-audio deletion requires `AZURE_STORAGE_RETENTION_DELETION_ENABLED=true`, a persisted deletion approval record, recovery-window evidence, no legal hold, and audit-safe trace evidence.
- Transcript objects: indefinite retention unless a later tenant policy is approved and implemented.
- Final note PDFs, patient summary PDFs, and structured exports: clinical-record-linked retention; do not auto-delete until the tenant clinical-record retention policy is approved.
- Audit export bundles and storage evidence: retain at least 7 years unless a longer tenant/legal policy applies.
- Blob soft delete: 14 days.
- Container soft delete: 14 days.
- Blob versioning: enabled.
- Legal hold: supported and must block deletion jobs.
- Immutability: use for evidence or incident/legal-hold scoped objects only; do not apply a blanket immutability policy that would conflict with the one-week raw-audio deletion rule.

Raw-audio deletion may remove the active object after the 7-day retention point, but Blob soft delete/versioning can keep recoverable versions during the documented 14-day recovery window. The deletion job must record that distinction.

## Backup, Restore, And Evidence

- Quarterly synthetic restore-readiness drill required before launch claim.
- One staging restore-readiness drill required before any production PHI storage activation.
- Production PHI restore execution requires separate founder/security/privacy approval.
- Restore-readiness evidence must include object key, artifact class, tenant/site scope, checksum/eTag metadata, recovery-window status, trace ID, drill owner, drill result, and escalation path.
- Database backup readiness and object-storage restore readiness must be checked together for workflows that join persisted metadata to Blob objects.

## Monitoring And Alerting Requirements

Alert on:

- public blob access enabled;
- shared key access enabled;
- secure transfer disabled;
- TLS policy weakened;
- private endpoint or private DNS failure;
- storage firewall opened unexpectedly;
- soft delete disabled;
- versioning disabled;
- legal hold conflict;
- raw-audio deletion failure or skipped deletion;
- deletion attempted without approval;
- restore-readiness drill failure;
- unexpected high egress;
- repeated wrong-tenant, wrong-site, expired-token, or permission-denied download attempts;
- Key Vault, managed identity, or role-assignment changes.

## Event And Audit Requirements

Future activation must emit or persist audit-safe evidence for:

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

## Remaining WO-081 Activation Work

The remaining work is implementation and evidence, not product-policy invention:

- create the storage account and containers if WO-081 is promoted;
- create or bind the managed identity;
- configure private endpoint, private DNS, firewall, public-access denial, shared-key denial, TLS, soft delete, container soft delete, versioning, and legal-hold support;
- assign least-privilege Blob roles to the app identity;
- record actual managed identity client ID and resource IDs in approved secret/config stores, not source control;
- update activation tests to verify the live Azure configuration with synthetic, non-PHI objects only;
- keep live PHI object delivery, destructive production deletion, PHI restore execution, and production launch disabled until the WO-081 activation gate passes.

No live Azure resource was provisioned by this decision record.

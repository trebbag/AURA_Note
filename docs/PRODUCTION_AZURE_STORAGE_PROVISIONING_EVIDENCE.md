# Production Azure Storage Provisioning Evidence

## Purpose

This file records the no-PHI Azure infrastructure that was provisioned after the founder/operator confirmed `eastus` and authorized Codex to make the remaining non-secret storage, deletion, and restore choices.

This is infrastructure evidence only. It does not enable PHI-bearing object delivery, production credentials in the repository, browser-side storage access, public object URLs, destructive production deletion, production restore execution, claim submission, autonomous clinical/coding/billing behavior, or production launch.

## Provisioning Authority And Boundary

- Evidence date: 2026-06-02
- Azure tenant: `b9b1d566-d7ed-44a4-b3cc-cf8786d6a6ed`
- Subscription: `Subscription Malady`
- Resource group: `AURA_resource_group`
- Region: `eastus`
- Data posture: synthetic/no-PHI only
- Runtime launch posture: disabled

No secrets, storage keys, SAS tokens, connection strings, private keys, `.env` values, production PHI, real patient data, or production runtime credentials were committed.

## Provisioned Resources

| Resource | Name | Evidence |
| --- | --- | --- |
| Storage account | `auranoteeastus91d0` | `StorageV2`, `Standard_ZRS`, `Hot`, `Succeeded` |
| Blob containers | `aura-final-note-pdfs`, `aura-patient-summary-pdfs`, `aura-structured-exports`, `aura-audit-export-bundles`, `aura-raw-audio`, `aura-transcripts`, `aura-storage-evidence`, `aura-restore-drill-evidence` | all private, `publicAccess=None` |
| User-assigned managed identity | `aura-note-storage-mi` | created in `eastus` for future server-side Blob access |
| Storage RBAC assignment | `Storage Blob Data Contributor` | scoped only to `auranoteeastus91d0` for `aura-note-storage-mi` |
| Key Vault boundary | `aura-note-kv-91d0` | RBAC enabled, soft delete enabled, purge protection enabled, public network access disabled |
| Virtual network | `aura-note-vnet-eastus` | `10.81.0.0/16` |
| Private endpoint subnet | `aura-note-private-endpoints` | `10.81.1.0/24`, private endpoint network policies disabled |
| Private DNS zone | `privatelink.blob.core.windows.net` | linked to `aura-note-vnet-eastus` |
| Blob private endpoint | `aura-note-storage-blob-pe` | approved, `Succeeded` |
| Blob private DNS record | `auranoteeastus91d0.privatelink.blob.core.windows.net` | points to private IP `10.81.1.4` |

Actual resource IDs, role assignment IDs, managed identity client IDs, and future runtime configuration references must be stored in approved Azure/config records, not copied into source as production runtime configuration.

## Verified Storage Security Properties

Azure CLI verification on 2026-06-02 showed:

- public network access: `Disabled`;
- network default action: `Deny`;
- network bypass: `None`;
- Blob public access: disabled;
- shared key access: disabled;
- secure transfer: required;
- minimum TLS: `TLS1_2`;
- private endpoint count: `1`;
- Blob soft delete: enabled for 14 days;
- container soft delete: enabled for 14 days;
- Blob versioning: enabled.

## Evidence Commands Run

The following non-secret Azure CLI checks were run locally:

- `az account show`
- `az group show --name AURA_resource_group`
- `az storage account check-name --name auranoteeastus91d0`
- `az storage account create ... --public-network-access Disabled --default-action Deny --allow-blob-public-access false --allow-shared-key-access false`
- `az storage account blob-service-properties update ... --enable-delete-retention true --delete-retention-days 14 --enable-container-delete-retention true --container-delete-retention-days 14 --enable-versioning true`
- `az rest ... /blobServices/default/containers/{container}?api-version=2023-01-01`
- `az identity create --name aura-note-storage-mi`
- `az role assignment create ... --role "Storage Blob Data Contributor" --scope .../storageAccounts/auranoteeastus91d0`
- `az keyvault create --name aura-note-kv-91d0 --enable-rbac-authorization true --enable-purge-protection true --public-network-access Disabled`
- `az network vnet create --name aura-note-vnet-eastus --subnet-name aura-note-private-endpoints`
- `az network private-dns zone create --name privatelink.blob.core.windows.net`
- `az network private-endpoint create --name aura-note-storage-blob-pe --group-id blob`
- `az network private-endpoint dns-zone-group create --endpoint-name aura-note-storage-blob-pe`
- `az network private-dns link vnet create --name aura-note-blob-dns-link`
- `az resource list --resource-group AURA_resource_group`
- `az storage account show`
- `az storage account blob-service-properties show`
- `az network private-endpoint show`
- `az network private-endpoint dns-zone-group show`
- `az role assignment list --scope .../storageAccounts/auranoteeastus91d0`
- `az keyvault show --name aura-note-kv-91d0`

## Not Yet Activated

The following remain intentionally disabled or deferred:

- PHI-bearing object upload/download delivery;
- production runtime credential delivery;
- committed secrets or `.env` files;
- server-mediated download tokens backed by live Azure objects;
- object-level upload/download/delete tests from an AURA Note runtime hosted inside the private network;
- destructive production deletion;
- production restore execution;
- legal-hold workflow execution against real objects;
- PHI-bearing audit export delivery;
- production launch approval.

## Remaining WO-081 Scope

`WO-081` no longer needs to create the initial no-PHI storage account, private containers, managed identity, storage-account-scoped Blob role assignment, Key Vault boundary, VNet, private DNS zone/link, or Blob private endpoint.

`WO-081` still must implement and evidence:

- approved secret/config-store references for the managed identity and runtime environment;
- app/runtime integration through the private network;
- synthetic no-PHI upload, server-mediated download-token, wrong-tenant denial, expired-token denial, deletion-block, legal-hold, and restore-readiness tests against the configured Azure resource;
- backup/restore and evidence-retention operating procedures tied to the actual runtime;
- production monitoring/alert wiring for storage, Key Vault, private endpoint/DNS, deletion, restore, and wrong-tenant access attempts;
- explicit founder/operator approval before PHI-bearing object delivery, destructive deletion, PHI restore execution, or launch flags can change.

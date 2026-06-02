# Production PHI Persistence And Database Operations Review

## Purpose

This document is the `WO-054` planning/control intake for production PHI persistence and database operations. It does not enable production PHI storage, production database credentials, live migrations, runtime repository changes, backup/restore execution, support database access, or production launch behavior.

## Current Safe Posture

- PostgreSQL, Prisma, tenant-isolation, and RLS evidence remains synthetic/local.
- Runtime production PHI storage is not enabled.
- No production `DATABASE_URL`, `.env`, private key, database credential, or real patient data is committed.
- Broad runtime behavior remains governed by existing synthetic/local adapters unless a completed work order explicitly changes it.
- Production backup/restore execution and support database access remain blocked.

## Founder-Provided Partial Input Captured 2026-06-02

Use the local Flow project at `/Users/gregorygabbert/Documents/GitHub/Flow` as the reference implementation pattern for Azure database and PHI-at-rest planning.

Flow evidence to evaluate for AURA Note:

- Azure Database for PostgreSQL Flexible Server as the production/pilot-shaped database host.
- Separate migration/admin and runtime connection posture where configured.
- PostgreSQL RLS evidence using application session scope.
- Append-only event-table protection through grants and policy evidence.
- PHI-at-rest protection posture using Azure Key Vault-sourced column encryption plus database encryption-at-rest.
- Backup/restore objectives and disaster-recovery drill posture.

This partial input does not approve AURA Note production PHI persistence, production connection-string secret names, AURA Note table-by-table RLS coverage, migration approval workflow, backup schedule, RTO/RPO, support database access, or live migration execution.

## AURA Note Azure Resource Baseline Verified 2026-06-02

Azure CLI verification succeeded for the founder-provided resource group:

- Tenant ID: `b9b1d566-d7ed-44a4-b3cc-cf8786d6a6ed`
- Subscription: `Subscription Malady`
- Subscription ID: `91d0e7fe-e9c6-40a0-af0f-98a9dc07b218`
- Resource group: `AURA_resource_group`
- Resource group location: `eastus`
- Provisioning state: `Succeeded`

This confirms the non-secret Azure tenant/subscription/resource-group baseline for future AURA Note database planning. It does not select or approve a production database host, connection-string secret, migration execution, PHI persistence, backup/restore operation, support database access, or production launch.

## Required Decisions Before Live Implementation

- Production database host and region.
- Encryption/KMS posture, including customer-managed key expectations.
- Database role model and credential source.
- Migration approval authority, promotion path, rollback policy, and emergency-change path.
- Backup cadence, retention, encryption, immutability, and restore drill cadence.
- RLS expansion policy for every tenant-owned PHI table.
- Tenant/site isolation test plan and evidence retention.
- Data retention, tenant export, and tenant offboarding policy.
- Support database access policy, approval authority, duration, scope, redaction, and post-event review.
- Production log redaction and query-observability posture.
- Incident response for data integrity, unauthorized access, migration failure, restore failure, and tenant-isolation failure.

## Future Implementation Acceptance Criteria

- Production database credentials are sourced from an approved secret manager and never committed.
- Migration plans include approval evidence, generated SQL, rollback evidence, and environment promotion controls.
- Backups are encrypted, monitored, retention-governed, and restore-drill evidence is recorded.
- Every tenant-owned PHI table has tenant/site enforcement and RLS or documented equivalent evidence.
- Cross-tenant and cross-site persisted-record denial tests pass at repository, API, and database-policy layers.
- Support database access is time-bound, purpose-bound, approval-gated, tenant/site scoped, audit-logged, and post-reviewed.
- Tenant export and offboarding are human-approved, audit-safe, and do not bypass retention/legal hold.
- Logs, traces, metrics, and migration output do not expose PHI, tokens, credentials, or raw patient data.
- Failure modes fail closed when database connectivity, migration approval, support scope, tenant context, or RLS session settings are missing.

## Required Future Audit/Event Contracts

- `database.migration_approved.v1`
- `database.migration_applied.v1`
- `database.migration_rolled_back.v1`
- `database.backup_completed.v1`
- `database.restore_drill_completed.v1`
- `database.rls_policy_verified.v1`
- `database.tenant_isolation_verified.v1`
- `database.support_access_opened.v1`
- `database.support_access_closed.v1`
- `database.data_export_approved.v1`
- `database.data_export_completed.v1`
- `database.retention_policy_changed.v1`
- `database.incident_recorded.v1`

## Standalone Mode Requirements

Standalone mode must support tenant onboarding, site-scoped persistence, user-scoped operational evidence, backup/restore posture, tenant export, tenant offboarding, support access, and incident response without requiring ClinicOS.

## ClinicOS-Integrated Mode Requirements

ClinicOS-integrated mode may synchronize or map data only through adapter boundaries. AURA Note must still enforce local tenant/site isolation, RLS posture, support access controls, audit logging, data-retention policy, and fail-closed behavior for stale mappings or missing tenant context.

## Deferred Until A Future Work Order

- Selecting or configuring a production database host.
- Committing or using production database credentials.
- Enabling production PHI storage.
- Executing live migrations.
- Replacing runtime repositories for production operation.
- Expanding runtime RLS beyond existing synthetic/local evidence.
- Executing production backup or restore operations.
- Enabling support database access.
- Claiming production launch readiness.

# WO-054 — Production PHI Persistence And Database Operations Review Intake

## Objective

Promote the post-P11 production PHI persistence and database operations candidate into a reviewable planning/control work order without enabling production PHI storage, production database credentials, live migrations, runtime repository changes, or production launch behavior.

## Why This Work Order Exists

AURA Note already has broad synthetic/local PostgreSQL, Prisma, tenant-isolation, and RLS evidence. Production PHI persistence requires a separate governance package before any live database host, production credentials, PHI-bearing data, backup/restore operation, migration process, support access, or destructive data path can be safely implemented.

## Prerequisites

- `WO-053` is complete and merged.
- P11 remains the current checkpoint.
- `next_work_order` is `null` before this tranche is promoted.
- No active SPEC_GAP blocks planning/control work.

## In Scope

- Production PHI persistence and database operations review document.
- Required decisions for production database host, encryption/KMS, backups, restores, RLS expansion, migration approvals, rollback, support access, data export, tenant isolation, retention, and incident response.
- Future acceptance criteria for production PHI storage and database operations.
- Event/audit inventory for future database operations.
- Readiness verifier proving this tranche is planning/control only.
- Status, run-log, SPEC_GAPS, production plan, continuation plan, work-order index, package script, and CI updates.

## Out Of Scope

- Production database provisioning.
- Production `DATABASE_URL`, credentials, secrets, or `.env` files.
- Live migration execution.
- Runtime repository replacement or new Prisma-backed runtime behavior.
- Production PHI storage or real patient data.
- New RLS policies beyond documentation/intake.
- Backup/restore execution.
- Production launch approval.

## UX Requirements

- No new production UX route is required.
- Future database operations UX must expose environment, migration, backup, restore, tenant-isolation, support-access, degraded, failed, and read-only states through authorized operational surfaces before launch readiness can be claimed.

## Backend/API Requirements

- No new runtime endpoint is implemented in this work order.
- Future production database work must keep all state-changing operations tenant-scoped, permission-checked, idempotent where repeated submissions are plausible, and audit/event emitting.
- Future operational endpoints must fail closed when production credentials, database connectivity, migration approval, support scope, or purpose-of-use evidence is missing.

## Data Model/Persistence Requirements

- No schema or migration change is required in this work order.
- Future work must define production database roles, migration approval records, migration run evidence, rollback evidence, backup metadata, restore drill evidence, tenant-isolation evidence, RLS policy coverage, support-access evidence, data export evidence, and retention policy records before implementation.
- Every persisted tenant-owned table that can contain PHI must have tenant isolation and RLS or explicitly documented equivalent evidence before production readiness can be claimed.

## Event/Audit Requirements

- No runtime event is emitted in this work order.
- Future work must define audit/event contracts for migration approved, migration applied, migration rolled back, backup completed, restore drill completed, RLS policy verified, tenant isolation verified, support database access opened, support database access closed, data export approved, data export completed, retention policy changed, and database incident recorded.

## RBAC/ABAC Requirements

- Current permissions remain unchanged.
- Future work must limit production database operations to authorized admins, compliance/privacy leads, and approved support/operations roles with purpose-of-use, tenant/site scope, time-bound access, and post-event review.
- Ordinary clinicians, MAs, billing staff, and support users without explicit approved scope must not gain database-operational access.

## Standalone-Mode Behavior

- Standalone mode remains local/synthetic for PHI persistence until a future approved implementation work order enables production database operation.
- Future standalone production database work must support tenant onboarding, site scoping, user scoping, backup/restore, tenant export, and tenant offboarding evidence without requiring ClinicOS.

## ClinicOS-Integrated Behavior

- ClinicOS-integrated mode remains adapter-scoped and cannot bypass AURA Note database permissions, tenant/site isolation, RLS posture, audit, support-access controls, or retention policy.
- Future ClinicOS data synchronization must define ownership, replay, reconciliation, stale mapping, and PHI retention boundaries before implementation.

## AI/PHI/Security Requirements

- No real PHI, credentials, private keys, production URLs, `.env` files, raw patient data, or production connection strings may be committed.
- No external AI behavior is changed.
- Future work must document encryption at rest, encryption in transit, KMS/customer-managed key posture, secret rotation, production logging redaction, backup encryption, restore authorization, support access controls, and incident-response evidence.

## Testing Requirements

- Add and run a deterministic readiness verifier for the production PHI persistence/database operations intake.
- Run post-P11, production, acceptance, status, and whitespace gates.
- CI must run the new verifier.
- No database, browser, API, or migration tests are required unless runtime behavior changes; this tranche intentionally does not change runtime behavior.

## Required Scripts/Gates

- `pnpm persistence:phi-db-review-readiness`
- `pnpm post-p11:readiness`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `node scripts/status.js`
- `git diff --check`

## Definition Of Done

- Production PHI persistence/database operations intake document exists.
- `WO-054` is indexed, represented in `repo_status.json`, and marked done only after readiness evidence exists.
- `next_work_order` remains `null` after completion.
- Readiness scripts pass locally and in CI.
- `SPEC_GAPS.md` records no active gap for planning/control scope and keeps production PHI persistence/database operations as deferred before live use.
- No production PHI storage, production database credential, live migration, runtime database change, backup/restore execution, support database access, or production launch behavior is introduced.

## Stop Conditions

- A future implementation request requires selecting a real database host, handling real credentials, storing PHI, executing live migrations, or defining legal/security/privacy policy not present in the repo.
- A higher-priority spec conflicts with tenant isolation, RLS, backup/restore, support access, or PHI retention posture.
- Readiness scripts cannot distinguish this planning/control work from production PHI database implementation.

## Risks And Deferred Decisions

- Production database host, encryption/KMS, backup cadence, restore drills, RLS expansion, migration approvals, rollback policy, tenant export/offboarding, support access, retention policy, and incident response remain deferred until a future approved implementation work order.
- This work order is not production PHI storage approval and not launch approval.

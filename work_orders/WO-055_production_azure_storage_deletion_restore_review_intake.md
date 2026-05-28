# WO-055 — Production Azure Storage, Deletion, And Restore Review Intake

## Objective

Promote production Azure Blob storage, deletion, and restore review into a planning/control decision package without enabling live Azure credentials, PHI-bearing object delivery, destructive production deletion, production restore execution, or launch behavior.

## Why This Work Order Exists

`WO-032` and `WO-042` established Azure-oriented adapter boundaries, secure-download metadata, raw-audio deletion readiness, and backup/restore evidence scaffolding. Commercial use requires explicit decisions for Azure account topology, credentials, encryption/KMS, secure downloads, soft delete/versioning, legal hold, deletion authority, restore drills, incident response, and evidence retention before any live production storage path is enabled.

## Prerequisites

- `WO-054` complete and merged.
- P11 remains the current checkpoint.
- No active `SPEC_GAP` blocks planning/control work.
- Existing storage and retention readiness scripts remain green.

## In Scope

- Add a production Azure storage/deletion/restore review document.
- Capture required future decisions, acceptance criteria, event/audit inventory, standalone requirements, and ClinicOS-integrated requirements.
- Add a readiness verifier proving the tranche remains planning/control only.
- Update `repo_status.json`, `work_orders/README.md`, `docs/PRODUCTION_BUILD_PLAN.md`, `docs/POST_P11_CONTINUATION_PLAN.md`, `docs/POST_CP4_PRODUCTIONIZATION_BACKLOG.md`, `SPEC_GAPS.md`, `CHECKPOINT_REPORT.md`, `RUN_LOG.md`, `package.json`, and CI.

## Out Of Scope

- Azure resource provisioning.
- Production Azure credentials, managed identities, or secret-manager integration.
- `.env` files, private keys, production URLs, or real tenant storage configuration.
- PHI-bearing object upload/download delivery.
- Live Azure SDK execution against production resources.
- Public URLs or browser-side storage credentials.
- Destructive production deletion.
- Production restore execution.
- PHI-bearing audit export delivery.
- Runtime product behavior, schema changes, migrations, or launch approval.

## UX Requirements

No new product route is required. Future operational UX must expose storage configuration, secure-download status, legal hold, deletion approval, recovery-window, restore-readiness, degraded, failed, permission-denied, and read-only states through authorized surfaces before launch readiness.

## Backend/API Requirements

No new endpoint is required. Future storage operations must be tenant/site scoped, permission checked, purpose-of-use checked, server mediated, audit/event emitting, fail closed when approval or credentials are missing, and tested for wrong-tenant, wrong-role, expired-token, public-url, legal-hold, failed-delete, and restore-readiness cases.

## Data Model/Persistence Requirements

No schema change is required for this planning tranche. Future implementation must define object metadata, storage provider metadata, retention class, signed-download token metadata, legal-hold evidence, deletion approval evidence, deletion result evidence, restore-readiness evidence, incident evidence, and evidence-retention records.

## Event/Audit Requirements

Inventory future storage events including Azure config reviewed, object upload authorized/denied, download token requested/denied, object download delivered, public URL rejected, raw-audio deletion approved/skipped/deleted, transcript retention preserved, legal hold applied, legal hold blocked deletion, restore readiness verified, restore drill completed, and storage incident recorded.

## RBAC/ABAC Requirements

Preserve existing role boundaries. Future implementation must require authorized-admin, compliance/privacy, support-scope, export-authorized, and retention-operator permissions as appropriate, and must deny ordinary clinicians, MAs, billing staff, unscoped support users, wrong-tenant users, and wrong-site users.

## Standalone-Mode Behavior

Standalone mode remains synthetic/local for production storage until a future approved implementation work order enables production Azure operation. AURA Note remains the source of tenant/site storage policy, retention policy, download permissions, audit, and support controls.

## ClinicOS-Integrated Behavior

ClinicOS-integrated mode may map storage evidence to ClinicOS/Integration Hub identifiers only through adapters. ClinicOS must not bypass AURA Note storage permissions, tenant/site scoping, purpose-of-use checks, legal holds, retention controls, download token enforcement, audit evidence, or incident response.

## AI/PHI/Security Requirements

Use synthetic data only. Do not introduce real PHI, credentials, tokens, production URLs, `.env` files, private keys, live Azure calls, PHI-bearing object payloads, public URLs, destructive production deletion, production restore execution, external AI changes, or launch approval.

## Testing Requirements

- Add `pnpm storage:live-review-readiness`.
- Preserve and run storage/retention readiness gates.
- Run post-P11, production, acceptance, status, and whitespace gates.
- The readiness verifier must fail if the repo claims live Azure credentials, public URLs, PHI object payload delivery, destructive production deletion, production restore execution, PHI-bearing audit exports, or production launch approval.

## Required Scripts/Gates

- `pnpm storage:live-review-readiness`
- `pnpm post-p11:readiness`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `node scripts/status.js`
- `git diff --check`

## Definition Of Done

- Review document exists and names required production storage decisions.
- `WO-055` is indexed and marked done.
- `next_work_order` remains `null`.
- Readiness scripts pass locally and in CI.
- `SPEC_GAPS.md`, `RUN_LOG.md`, and `CHECKPOINT_REPORT.md` record the planning/control evidence.
- No live Azure credential, PHI-bearing object delivery, public URL, destructive production deletion, production restore execution, PHI-bearing audit export, runtime storage behavior, or launch behavior is authorized.

## Stop Conditions

Stop if implementation requires real Azure resource selection, live credentials, PHI-bearing object storage, live SDK execution, public networking policy, legal hold policy, destructive production deletion, restore execution, incident-response/legal/privacy decision, or production launch approval.

## Risks And Deferred Decisions

Azure account/container topology, private networking, credential source, customer-managed keys, tenant key isolation, signed download TTLs, token revocation, legal hold, immutability, backup/restore cadence, deletion approval authority, recovery window, evidence retention, support-access posture, and incident response remain deferred.

# Post-CR4 Launch Governance Intake

## Status

- **Work order:** `WO-076`
- **Checkpoint context:** post-CR4 governance intake after the CR-4 commercial readiness review candidate.
- **productionLaunchReady=false**
- **productionLaunchApproved=false**
- **livePhiEnabled=false**
- **liveVendorEnabled=false**
- **claimSubmissionEnabled=false**
- **duplicateSourceDeletionApproved=true for reviewed accidental local duplicate-pattern artifacts only**
- **duplicateSourceDeletionCompleted=true**

This document does not approve production launch, real beta execution, live PHI, live vendors, production credentials, claim submission, charge finalization, medical-necessity determination, or autonomous clinical/coding/billing behavior. `WO-077` approved and completed deletion only for reviewed accidental local duplicate-pattern artifacts; it did not authorize deletion of tracked source, production evidence, credentials, PHI, or runtime behavior.

## Founder-Provided Governance Inputs Captured 2026-06-02

The founder/operator supplied these partial production-decision inputs after `WO-077`:

- The founder/operator is the launch owner and the approver for founder, clinical, compliance/privacy, security, legal/risk, and commercial go/no-go decisions unless a later written decision delegates one of those approval lanes.
- Identity and account lifecycle planning should use the local Flow project at `/Users/gregorygabbert/Documents/GitHub/Flow` as the reference implementation pattern.
- The Flow pattern includes Azure/Microsoft Entra, the `clinicos1` Entra tenant, Microsoft redirect login, SPA/API app-registration separation, backend JWT validation, Entra-linked user provisioning, tenant-member account restriction, guest/B2B denial, disabled/deleted directory identity denial, and app-owned role/scope enforcement.
- The Flow pattern also provides Azure PostgreSQL, RLS/encryption, backup/restore, Key Vault, and Azure Blob recovery-posture evidence that can inform AURA Note production database and storage planning.
- Azure CLI verified the AURA Note Azure resource baseline: tenant `b9b1d566-d7ed-44a4-b3cc-cf8786d6a6ed`, subscription `Subscription Malady` (`91d0e7fe-e9c6-40a0-af0f-98a9dc07b218`), resource group `AURA_resource_group`, location `eastus`, provisioning state `Succeeded`.

These inputs are partial. They do not provide AURA Note-specific non-secret resource names, secret-store delivery paths, production launch scope, production credential approval, live PHI approval, live vendor approval, or storage/deletion/restore approval.

## Founder-Provided Launch Governance Inputs Captured 2026-06-03

The founder/operator supplied these additional `WO-078` launch-governance inputs:

- Launch scope: internal only.
- Tenant/site scope: Azure tenant scope only. No site-specific scope is approved yet.
- Roles enabled at launch: founder answered `No`; recorded conservatively as no expanded role set approved yet, not as a usable role matrix.
- Rollback procedure owner: founder/operator.
- Support hours and escalation path: none.
- Incident commander: founder/operator. Backup incident commander is not specified.
- Access review cadence: none.
- Launch communications owner: founder/operator.

These inputs narrow the launch-governance dossier but do not promote `WO-078`. The following remain unresolved before `WO-078` can become active: exact enabled roles or explicit no-role observer posture, disabled-feature inventory acceptance, go/no-go criteria, backup/restore drill acceptance criteria, backup incident commander or explicit no-backup risk acceptance, and explicit written approval if any launch flag is intended to change. The `None` support and access-review answers are acceptable only as documented internal-only risk posture unless replaced before beta, limited production, or general availability.

## GitHub PR State

- Local branch at intake: `codex/wo-066-standalone-workflow-completion`.
- Local pre-intake commit: `09688fb feat: add cr4 commercial readiness gates`.
- Branch-specific PR lookup before this work order returned no open PR for this branch.
- PR #67 was marked ready and merged to `main`.
- mergedAt: 2026-06-02T18:26:23Z.
- Merge commit: `015b03102abd4da8a3b0b95a393fa9380351a27b`.
- Follow-up after merge: `WO-077` created the cleanup and next-work-order rails branch.

## Duplicate Artifact Inventory

The worktree had untracked copied artifacts with names ending in ` 2` or ` 3`. A local inventory found 141 duplicate-pattern files before ignore-rule cleanup:

- 43 files were byte-identical to a candidate tracked original.
- 98 files differed from their candidate tracked original or lacked an exact original path.
- Some differing files were nested generated output under app/package build folders.
- Some differing files were source, docs, scripts, Prisma, or test files and must not be deleted without review.

`WO-076` adds recursive ignore rules for nested generated build output:

- `**/.next/`
- `**/dist/`

`WO-077` completed the follow-up cleanup. After the recursive ignore-rule cleanup, 103 visible duplicate-pattern files were reviewed:

- 40 files were byte-identical to a tracked original.
- 62 files were stale historical copies already represented in tracked Git history.
- 1 file had unique differences: `scripts/verify-local-postgres-migration 2.js`.

The unique duplicate was rejected rather than merged because it weakened the committed readiness script by replacing `pg_isready` with container state checks and removing the Prisma empty-migration allowance. All 103 reviewed duplicate-pattern files were removed. `docs/DUPLICATE_ARTIFACT_ADJUDICATION.md` records the cleanup evidence.

## Cleanup Decision Rules

- Byte-identical duplicates may be deleted after confirming they are not needed as evidence.
- Non-identical duplicates must be reviewed before deletion.
- Generated build artifacts should remain ignored, not committed.
- No `.env`, credential, private key, production URL, real PHI, or patient data should be committed.
- Cleanup must not change runtime behavior unless a later work order explicitly scopes and tests that change.

## Launch Decision Intake

The following decisions remain outside `WO-076` and must be handled by later founder-approved work:

- production launch approval;
- beta tenant scope and onboarding execution;
- live identity provider and account lifecycle;
- production PHI database posture;
- production Azure storage/deletion/restore posture;
- live transcription provider and PHI-bearing audio transport;
- external AI private/BAA pathway;
- live EHR writeback credentialing and reconciliation ownership;
- live ClinicOS integration contracts and event-bus delivery;
- support/on-call ownership and incident response;
- backup/restore drills;
- access review;
- legal/compliance/privacy/security approval;
- deployment approval;
- claim/payer strategy.

Partial decisions now recorded:

- launch owner and approval authority are identified as the founder/operator;
- launch scope is internal only;
- tenant/site launch scope is Azure tenant scope only, with no site-specific launch scope approved yet;
- no expanded launch role set is approved yet because the founder answered `No` for roles enabled at launch;
- rollback procedure owner, incident commander, and launch communications owner are identified as the founder/operator;
- support hours/escalation path and access review cadence are recorded as none for internal-only planning only;
- identity/account lifecycle should reference the Flow project's Azure/Microsoft Entra and `clinicos1` tenant pattern;
- production PHI database planning should evaluate the Flow Azure PostgreSQL, RLS, PHI encryption, and backup/restore pattern for AURA Note-specific adoption, using the verified `AURA_resource_group` baseline unless a later decision selects a different resource group or region;
- production Azure storage planning should evaluate the Flow Azure Key Vault, Blob soft-delete/versioning, and recovery posture, while separately deciding AURA Note PHI artifact-storage accounts, containers, retention, deletion, restore, and monitoring.

## Verification

Required local gates for this governance intake:

- `pnpm post-cr4:launch-governance`
- `pnpm post-cr4:next-work-orders`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `node scripts/status.js`
- `git diff --check`

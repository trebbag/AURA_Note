# Post-CR4 Launch Governance Intake

## Status

- **Work order:** `WO-076`
- **Checkpoint context:** post-CR4 governance intake after the CR-4 commercial readiness review candidate.
- **productionLaunchReady=false**
- **productionLaunchApproved=false**
- **livePhiEnabled=false**
- **liveVendorEnabled=false**
- **claimSubmissionEnabled=false**
- **duplicateSourceDeletionApproved=false**

This document does not approve production launch, real beta execution, live PHI, live vendors, production credentials, claim submission, charge finalization, medical-necessity determination, autonomous clinical/coding/billing behavior, or deletion of non-identical copied source files.

## GitHub PR State

- Local branch at intake: `codex/wo-066-standalone-workflow-completion`.
- Local pre-intake commit: `09688fb feat: add cr4 commercial readiness gates`.
- Branch-specific PR lookup before this work order returned no open PR for this branch.
- Required follow-up after this commit: push the branch, open or update a draft PR into `main`, and inspect GitHub Actions.
- CI result is not recorded inside this document until the branch is pushed and GitHub Actions runs.

## Duplicate Artifact Inventory

The worktree had untracked copied artifacts with names ending in ` 2` or ` 3`. A local inventory found 141 duplicate-pattern files before ignore-rule cleanup:

- 43 files were byte-identical to a candidate tracked original.
- 98 files differed from their candidate tracked original or lacked an exact original path.
- Some differing files were nested generated output under app/package build folders.
- Some differing files were source, docs, scripts, Prisma, or test files and must not be deleted without review.

`WO-076` adds recursive ignore rules for nested generated build output:

- `**/.next/`
- `**/dist/`

The remaining visible untracked duplicate source/doc/script files are treated as review-required artifacts. They should be handled by a later explicit cleanup work order that decides merge, archive, or delete file-by-file.

## Cleanup Decision Rules

- Byte-identical duplicates may be deleted in a later cleanup pass only after confirming they are not needed as evidence.
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

## Verification

Required local gates for this governance intake:

- `pnpm post-cr4:launch-governance`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `node scripts/status.js`
- `git diff --check`

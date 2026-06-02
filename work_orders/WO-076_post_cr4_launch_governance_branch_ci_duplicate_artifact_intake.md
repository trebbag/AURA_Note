# WO-076 — Post-CR4 Launch Governance, Branch/CI, And Duplicate Artifact Intake

## Objective

Convert the post-CR4 stop state into an explicit launch-governance intake without enabling production behavior.

## Why this work order exists

After `WO-075`, the repo intentionally stopped with `next_work_order: null`. The founder asked Codex to continue with the recommended post-CR4 work order, so the next safe tranche is governance, branch/PR/CI follow-up, and duplicate artifact triage rather than new product behavior or production launch.

## Prerequisites

- `WO-071` through `WO-075` complete.
- CR-4 checkpoint evidence present.
- No active SPEC_GAP for the synthetic/local CR-4 review package.

## In scope

- Post-CR4 launch governance intake document.
- Duplicate artifact inventory for untracked files ending in ` 2` or ` 3`.
- Recursive ignore rules for nested generated build output such as package-level `dist/` and app-level `.next/`.
- Readiness validator and package/CI script hook.
- `repo_status.json`, `work_orders/README.md`, `RUN_LOG.md`, `CHECKPOINT_REPORT.md`, `SPEC_GAPS.md`, and production build plan updates.
- Branch/PR/CI follow-up instructions and evidence capture.

## Out of scope

- Production launch approval.
- Real beta launch execution.
- Live PHI, live vendor credentials, production deployment, live EHR/writeback, live transcription, live AI, live ClinicOS sync, live Azure PHI storage, claim submission, charge finalization, or medical-necessity determination.
- Deleting non-byte-identical source/doc/script duplicates without review.

## UX requirements

No product UX route changes. Existing CR-4 support/commercial readiness surfaces remain the visible review posture.

## Backend/API requirements

No API behavior changes. This work order is documentation, readiness-script, status, and repository hygiene evidence only.

## Data model/persistence requirements

No schema, migration, or persistence behavior changes.

## Event/audit requirements

No runtime event changes. Governance evidence is recorded in `RUN_LOG.md`, `CHECKPOINT_REPORT.md`, and `docs/POST_CR4_LAUNCH_GOVERNANCE_INTAKE.md`.

## RBAC/ABAC requirements

No permission expansion. Support/commercial readiness access remains governed by existing API roles and denials.

## Standalone-mode behavior

Standalone mode remains the safe default and is unchanged.

## ClinicOS-integrated behavior

ClinicOS-integrated mode remains adapter-bound and safely disabled/degraded for live delegation and event-bus behavior until a later approved work order.

## AI/PHI/security requirements

No real PHI, live AI, raw PHI to external AI, credentials, claim submission, autonomous clinical/coding/billing behavior, certification claim, or production launch behavior is introduced.

## Testing requirements

- `pnpm post-cr4:launch-governance`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `node scripts/status.js`
- `git diff --check`

## Required scripts/gates

- `pnpm post-cr4:launch-governance`

## Definition of Done

- `WO-076` is present in the production plan, work-order index, status file, run log, checkpoint report, and readiness scripts.
- Duplicate artifact inventory is recorded without deleting non-identical source/doc/script files.
- Nested generated build outputs are ignored recursively.
- The branch/PR/CI follow-up state is documented.
- Production launch remains false and no live behavior is enabled.

## Stop conditions

Stop if the next step requires deleting non-identical duplicates, approving launch, enabling production credentials, processing live PHI, calling live vendors, submitting claims, or deploying production without explicit founder/clinical/compliance/security/legal authorization.

## Risks and deferred decisions

- Non-identical duplicate files may contain useful work and require review before deletion.
- GitHub Actions results require branch push/PR execution.
- Production launch, beta execution, live credentials, vendor contracts, support ownership, incident response, and deployment approval remain deferred.

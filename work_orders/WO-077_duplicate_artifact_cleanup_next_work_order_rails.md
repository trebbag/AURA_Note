# WO-077 — Duplicate Artifact Cleanup And Post-CR4 Next-Work-Order Rails

## Objective

Adjudicate the duplicate-pattern local artifacts left after `WO-076`, remove accidental copied files without changing runtime behavior, and establish the next planned post-CR4 production decision sequence.

## Why this exists

`WO-076` intentionally inventoried duplicate artifacts but did not delete them. The founder then explicitly asked Codex to do the cleanup and create the next post-CR4 work-order sequence. The repo also needs the next sequence to remain planned until the production decision inputs are available.

## Prerequisites

- `WO-076` complete.
- PR #67 merged to `main`.
- No active SPEC_GAP for the cleanup/planning scope.

## In scope

- Compare duplicate-pattern files against tracked originals.
- Remove byte-identical copied files.
- Remove stale historical copied files.
- Inspect and document any unique differences before removal.
- Add duplicate cleanup evidence.
- Add planned `WO-078` through `WO-089` sequence.
- Add exact production decision input checklist.
- Update status, run log, checkpoint report, readiness scripts, CI, and source-of-truth docs.

## Out of scope

- Runtime product behavior.
- Production launch approval.
- Live vendor enablement.
- Production credentials.
- Real PHI.
- Claim submission.
- Autonomous clinical, coding, billing, or medical-necessity behavior.
- Promoting planned post-CR4 work orders to `todo`.

## UX requirements

No product UX change. Existing commercial readiness and support routes remain unchanged.

## Backend/API requirements

No backend/API behavior change. This is source hygiene, documentation, status, and readiness evidence only.

## Data model/persistence requirements

No schema or migration change.

## Event/audit requirements

No runtime event change. Governance evidence is recorded in `RUN_LOG.md`, `CHECKPOINT_REPORT.md`, and the post-CR4 docs.

## RBAC/ABAC requirements

No permission expansion. Existing support/commercial readiness access posture remains unchanged.

## Standalone-mode behavior

Unchanged. Standalone remains the safe default and does not require ClinicOS.

## ClinicOS-integrated behavior

Unchanged. ClinicOS live delegation/event-bus behavior remains disabled until a later planned work order is promoted and approved.

## AI/PHI/security requirements

No secrets, credentials, real PHI, private keys, production URLs, live AI calls, live vendor calls, claim submission, or autonomous finalization may be introduced.

## Testing requirements

- Duplicate-pattern files absent after cleanup.
- `WO-077` marked done.
- `WO-078` through `WO-089` remain planned.
- `next_work_order` remains null until a planned item is promoted.
- Launch/live/autonomy false posture remains intact.

## Required scripts/gates

- `pnpm post-cr4:next-work-orders`
- `pnpm post-cr4:launch-governance`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `node scripts/status.js`
- `git diff --check`

## Definition of Done

- PR #67 is merged to `main`.
- Duplicate artifacts are reviewed and removed.
- Unique duplicate differences are documented and not silently merged.
- The next post-CR4 sequence is documented and status-tracked as planned.
- Readiness scripts and CI include the new gate.
- No production launch/live/autonomy posture changes are introduced.

## Stop conditions

- A duplicate file contains behavior that appears newer and cannot be safely classified.
- Cleanup would require changing product behavior.
- A production decision requires live credentials, legal/compliance approval, vendor contracts, or PHI.
- A gate remains broken after three focused repair attempts.

## Risks and deferred decisions

Future production launch, identity, PHI persistence, Azure storage, transcription, AI, EHR, ClinicOS, observability, revenue-estimate, claim/payer, and beta execution decisions remain planned and input-gated.

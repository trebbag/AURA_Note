# WO-060 — Commercial Readiness Rebaseline And Runtime Implementation Rails

## Objective

Reopen the build after P11 with a commercial-readiness implementation plan that moves AURA Note from synthetic/local scaffold toward production-intended runtime architecture without enabling live PHI, live vendors, claim submission, autonomous clinical/coding/billing behavior, or production launch.

## Why This Work Order Exists

`WO-052` through `WO-059` were post-P11 planning/control intake tranches. They deliberately left `next_work_order` as `null`. Founder approval now authorizes a new implementation sequence beginning at `WO-060`, but not production launch or live regulated behavior.

## Prerequisites

- `WO-000` through `WO-059` complete on `main`.
- P11 checkpoint recorded.
- No active `SPEC_GAP` blocking planning/control work.
- Founder approval to open the commercial-readiness sequence.

## In Scope

- Add CR-0 through CR-4 checkpoints.
- Add `WO-060` through `WO-075` to planning/status documents.
- Create commercial-readiness roadmap, definition of done, synthetic-to-runtime gap register, and Figma handoff plan.
- Update `repo_status.json`, `RUN_LOG.md`, `CHECKPOINT_REPORT.md`, and `SPEC_GAPS.md`.
- Extend readiness scripts and CI with `pnpm commercial:readiness-plan`.
- Create the active next work-order file for `WO-061`.

## Out Of Scope

- Runtime product behavior changes.
- Live PHI, real patient data, real payer data, real EHR data, production credentials, `.env` files, private keys, production URLs, live vendor calls, live storage, live EHR, live ClinicOS, live external AI, live transcription provider, claim submission, charge finalization, medical-necessity determination, autonomous clinical/coding/billing behavior, or production launch approval.

## UX Requirements

- Document the CR-2 and Figma handoff path.
- Preserve the Frontend Runtime Integration Gate.
- Do not claim final Figma fidelity.

## Backend/API Requirements

- Add planning/readiness validation only.
- Do not add new endpoints or runtime service behavior.
- Keep future backend work requirements explicit: validation, tenant/site scope, RBAC/ABAC, idempotency where needed, audit/events, and redaction.

## Data Model/Persistence Requirements

- No schema or migration change.
- Identify remaining synthetic-to-runtime persistence gaps and future RLS expectations.

## Event/Audit Requirements

- No runtime event catalog changes.
- Record CR-0 evidence in `RUN_LOG.md` and `CHECKPOINT_REPORT.md`.
- Require future state-changing operations to preserve audit/domain events.

## RBAC/ABAC Requirements

- Preserve role, tenant, site, purpose-of-use, relationship, support, billing, transcript, final-note, coaching, and admin boundaries.
- Future work must include denial tests for sensitive surfaces.

## Standalone-Mode Behavior

Standalone remains the default product posture. Later CR work must make standalone daily-use workflows complete without ClinicOS.

## ClinicOS-Integrated Behavior

ClinicOS remains adapter-bound and disabled/degraded unless a later approved work order enables governed live behavior. ClinicOS must never bypass AURA Note permissions.

## AI/PHI/Security Requirements

- AI remains draft/candidate/suggestion-only.
- No raw PHI to external AI.
- No live credentials or real PHI.
- No launch, HIPAA certification, SOC 2 certification, or general availability claim.

## Testing Requirements

- `pnpm commercial:readiness-plan`
- `pnpm production:readiness`
- `pnpm acceptance:readiness`
- `pnpm lint`
- `pnpm typecheck`
- `git diff --check`

## Required Scripts/Gates

- Add `pnpm commercial:readiness-plan`.
- Wire it into CI before `pnpm post-p11:readiness`, `pnpm production:readiness`, and `pnpm acceptance:readiness`.

## Definition Of Done

- `WO-060` through `WO-075` exist in planning files.
- `WO-060` is recorded complete.
- `WO-061` is the next active work order and has a work-order file.
- `next_work_order` is not `null`.
- `current_checkpoint` is `CR-0`.
- Current state is explicitly not commercial production-ready.
- Runtime gaps are identified.
- No live vendor, PHI, claim, production launch, or autonomous clinical/billing behavior is introduced.
- Required gates pass.

## Stop Conditions

- Founder requests live PHI, live vendor credentials, autonomous diagnosis/coding/billing, claim submission, charge finalization, medical-necessity determination, or launch approval without a future approved work order and required governance decisions.
- Readiness scripts cannot distinguish synthetic/local readiness from commercial production readiness.
- A safety/compliance conflict blocks safe planning.

## Risks And Deferred Decisions

- Runtime persistence, auth, API hardening, UI API conversion, Figma design, live vendors, production database/storage/identity, security/privacy review, beta pilot, and launch approval remain future work.
- Production launch remains false until a later founder-approved launch work order changes it.

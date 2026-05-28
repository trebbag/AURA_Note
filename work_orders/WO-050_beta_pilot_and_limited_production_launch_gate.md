# WO-050 — Beta Pilot And Limited Production Launch Gate

## Objective

Prepare beta-pilot and limited-launch governance evidence after `WO-049` without claiming general availability or production deployment.

## Why this exists

P10 cannot be complete until technical launch rehearsal is paired with tenant onboarding, training, support escalation, monitoring, rollback criteria, and founder/clinical/compliance/security approval evidence. `WO-050` is the decision gate that determines whether AURA Note can enter a limited pilot.

## Prerequisites

- `WO-049` is complete and merged.
- Frontend runtime integration, launch operations readiness, security review, EHR/ClinicOS/AI governance, retention, storage, and production-readiness gates pass.
- No real PHI, production credentials, live vendors, or production deployment authority are required unless explicitly approved.

## In Scope

- Tenant onboarding/provisioning checklist.
- Pilot role-training checklist for clinician, MA, billing, admin, compliance/privacy, support, and service-account contexts.
- Disabled feature inventory and launch caveats.
- First-week monitoring plan and support escalation path.
- Rollback criteria and go/no-go checklist.
- Evidence that production-intended screens are typed-API backed or explicitly deferred/disabled before pilot use.
- Founder/clinical/compliance/security approval placeholders and stop conditions.

## Out of Scope

- Unrestricted general availability.
- Production launch without signoff.
- Real PHI migration, live vendor credentialing, live EHR writeback, live ClinicOS sync, live external AI, live transcription, charge finalization, autonomous claim submission, or clearinghouse integration.

## UX Requirements

- Pilot users must see clear disabled/degraded/permission-denied/read-only states for unavailable production features.
- Patient-facing surfaces must not expose internal billing, revenue, coaching, confidence, payer-strategy, or unsupported estimate details.
- Launch checklist and support paths must be browser-testable with synthetic/demo data.

## Backend/API Requirements

- Tenant provisioning and launch smoke evidence must use typed API clients or documented launch mocks.
- Any launch evidence recording must be tenant/site scoped, permission checked, audit-safe, and event documented.
- Launch smoke must preserve `submittedClaim=false`, human-review gates, and disabled live-vendor paths.

## Data Model/Persistence Requirements

- Pilot launch evidence may use synthetic metadata records only unless a later decision authorizes production launch persistence.
- No PHI-bearing launch records, raw transcripts, final notes, billing details, raw prompts, or raw vendor payloads may be committed or logged.

## Event/Audit Requirements

- Launch signoff, onboarding checklist, access review, rollback criteria, first-week monitoring, and support escalation evidence must have audit-safe event stubs or documented records.
- Event payloads must remain metadata-only and redacted.

## RBAC/ABAC Requirements

- Launch readiness views are limited to authorized admin, compliance/privacy lead, clinic manager, support, or service-account roles as appropriate.
- Support remains metadata-only.
- ClinicOS-integrated mode cannot bypass AURA Note launch, tenant, role, purpose-of-use, or PHI controls.

## Standalone-Mode Behavior

- Standalone pilot setup must be possible without ClinicOS.
- Standalone schedule, documentation, finalization/export, support, and operational readiness flows must have pilot smoke evidence.

## ClinicOS-Integrated Behavior

- Integrated pilot setup remains optional and adapter-bound.
- Missing ClinicOS delegated identity, event bus, mapping, or operational status must fail closed and cannot block standalone pilot operation.

## AI/PHI/Security Requirements

- No raw PHI may be sent to external AI.
- AI, coding, billing, coaching, patient summary, and payer support outputs remain draft/candidate/human-review-required.
- Production PHI, live credentials, live vendors, destructive deletion, and production deployment remain blocked unless explicitly approved with evidence.

## Testing Requirements

- Add launch/pilot readiness scripts and browser tests for onboarding checklist, disabled feature inventory, support escalation, first-week monitoring, rollback criteria, approval placeholders, role denial, and seeded API-backed smoke evidence.
- Preserve `pnpm frontend:runtime-integration-readiness` and `pnpm launch:ops-readiness`.

## Required Scripts/Gates

- `pnpm pilot:readiness` or equivalent.
- `pnpm launch:readiness` or equivalent if separate from pilot readiness.
- `pnpm frontend:runtime-integration-readiness`.
- `pnpm launch:ops-readiness`.
- Full current local and CI gate.

## Definition of Done

- P10 checkpoint can support a limited-launch decision without overclaiming readiness.
- Tenant onboarding, role training, support escalation, monitoring, rollback, disabled-feature, and approval evidence are documented and testable.
- `CHECKPOINT_REPORT.md`, `RUN_LOG.md`, `repo_status.json`, `SPEC_GAPS.md`, and relevant docs are updated.
- CI/local gates pass.

## Stop Conditions

- Founder, clinical, compliance/privacy, or security approval is missing for any production launch claim.
- Live production credentials, real PHI, live vendor traffic, production deployment, or destructive deletion is required.
- A launch policy decision is missing or safety-critical.
- Three focused repair attempts fail to resolve a build, test, browser, or runtime blocker.

## Risks And Deferred Decisions

- Pilot tenant identity, support owner, named on-call path, production hosting target, launch date, privacy/security approvals, and production PHI policy remain deferred until explicitly approved.

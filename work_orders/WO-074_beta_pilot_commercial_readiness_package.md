# WO-074 — Beta Pilot Commercial Readiness Package

## Objective
Prepare a controlled beta pilot package without production launch approval.

## Why This Work Order Exists
Founder review needs onboarding, support, training, rollback, disabled-feature, retention, privacy/security, and metrics evidence.

## Prerequisites
- `WO-073`.

## In Scope
- Beta onboarding and tenant setup checklist.
- Clinician/admin/billing/MA/support/compliance training checklists.
- Pilot support plan.
- Disabled-features inventory.
- Retention explanation.
- Privacy/security artifacts.
- Rollback plan.
- Success metrics.
- Synthetic standalone pilot smoke.
- `pnpm beta:pilot-package-readiness`.

## Out Of Scope
- Production launch approval.
- Real tenant onboarding.
- Live PHI.
- Live vendors.
- Production deployment execution.

## UX Requirements
- Beta-facing support surfaces identify disabled/degraded features, support paths, known limitations, and permission states.

## Backend/API Requirements
- Pilot smoke uses synthetic API-backed workflow only and preserves disabled live integrations.

## Data Model/Persistence Requirements
- Pilot evidence metadata and metrics definitions only unless existing runtime records support the smoke test.

## Event/Audit Requirements
- Pilot smoke actions record audit-safe evidence. No real PHI.

## RBAC/ABAC Requirements
- Training and role views cover clinician, admin, billing, MA, support, compliance/privacy, and authorized admin.

## Standalone-Mode Behavior
- Pilot package supports standalone-first beta operation.

## ClinicOS-Integrated Behavior
- ClinicOS pilot remains optional/degraded unless future approval exists.

## AI/PHI/Security Requirements
- `productionLaunchApproved=false`.
- No live PHI, live vendor, claim, or autonomous behavior.

## Testing Requirements
- Synthetic pilot smoke and package readiness verifier.

## Required Scripts/Gates
- `pnpm beta:pilot-package-readiness`
- Default local gate applicable to touched files.

## Definition Of Done
- Founder can review a beta pilot package with production launch still false.

## Stop Conditions
- Real beta tenant, live data, live vendor, or launch approval is requested.

## Risks And Deferred Decisions
- Pilot participants, support owners, legal/privacy approvals, and launch timing remain deferred.

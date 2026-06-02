# WO-075 — Commercial Readiness Decision Gate

## Objective
Create the final commercial-readiness decision gate for founder, clinical, compliance/privacy, and security review.

## Why This Work Order Exists
The repo needs an honest review packet stating what is runtime-ready, synthetic, disabled, Figma-ready, beta-ready, and not launch-ready.

## Prerequisites
- `WO-074`.

## In Scope
- `docs/COMMERCIAL_READINESS_REVIEW_PACKET.md`.
- Readiness matrix.
- Disabled/live-vendor/founder-decision inventory.
- Figma and beta readiness summary.
- Final `pnpm commercial:readiness` gate.
- CR-4 checkpoint report.

## Out Of Scope
- Production launch approval.
- Live vendor enablement.
- Live PHI.
- Claim submission.
- Final certification claims.

## UX Requirements
- Commercial readiness/review status is visible and does not hide disabled or unsafe-to-enable features.

## Backend/API Requirements
- `/support/commercial-readiness` exposes review metadata only and remains permission checked.

## Data Model/Persistence Requirements
- No schema change unless future review metadata requires durable evidence.

## Event/Audit Requirements
- Decision packet records evidence sources and emits audit-safe review events.

## RBAC/ABAC Requirements
- Review packet preserves role-limited sensitive details and minimum-necessary posture.

## Standalone-Mode Behavior
- Packet states standalone readiness accurately.

## ClinicOS-Integrated Behavior
- Packet states ClinicOS adapter/readiness limitations accurately.

## AI/PHI/Security Requirements
- Production launch stays false unless a later founder-approved work order changes it.
- Live PHI, live vendors, claim submission, and autonomous behavior remain disabled.

## Testing Requirements
- All relevant gates, commercial readiness verifier, no-launch-claim posture checks.

## Required Scripts/Gates
- `pnpm commercial:readiness`
- Default local gate applicable to touched files.

## Definition Of Done
- CR-4 checkpoint report exists.
- Repo clearly states Figma readiness, beta-pilot package readiness, commercial-review readiness, and production-launch-ready false.

## Stop Conditions
- Founder asks to flip launch/live behavior without required clinical/compliance/security/legal/vendor approval evidence.

## Risks And Deferred Decisions
- Final approval, contracts, real pilot scope, live credentials, and production deployment remain decision-gated.

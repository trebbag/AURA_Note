# WO-073 — Billing, Revenue Integrity, Claim-Decision, And Compliance Boundary Completion

## Objective
Complete v1 billing-support and revenue-integrity workflow evidence without claim submission.

## Why This Work Order Exists
Commercial billing support must be coherent while preserving human review and prohibiting autonomous claim behavior.

## Prerequisites
- `WO-072`.
- Current claim/payer decision gate.

## In Scope
- Candidate-only CPT, HCPCS, ICD-10, HCC, E/M, quality, risk, and draft claim preview evidence.
- Clinical-first Patient Opportunity Analysis boundaries.
- Internal configurable revenue impact with caveats.
- Patient summary internal-detail exclusions.
- Billing review triggers.
- Billing transcript access only in triggered context.
- `submittedClaim=false`.
- `pnpm billing:revenue-integrity-readiness`.

## Out Of Scope
- Live claim submission.
- Clearinghouse or payer APIs.
- Denial automation.
- Payment posting.
- Autonomous charge/coding/medical-necessity decisions.
- Patient-facing financial conclusions.

## UX Requirements
- Billing/revenue surfaces show human-review-required, candidate-only, internal-only, blocked, disabled, permission-denied, and read-only states.

## Backend/API Requirements
- Billing actions are permission checked, tenant/site scoped, audit/event emitting, idempotent where needed, and enforce `submittedClaim=false`.

## Data Model/Persistence Requirements
- Billing review, draft claim preview, attestation, revenue-config, and evidence records are durable where production-intended.

## Event/Audit Requirements
- Billing review, candidate, claim-preview, attestation, patient-summary exclusion, and submission-blocked evidence remains audit safe.

## RBAC/ABAC Requirements
- Billing detail/transcript access is restricted to role and trigger context.
- Patient-facing views exclude internal details.

## Standalone-Mode Behavior
- Standalone billing-support flow works without ClinicOS/M21.

## ClinicOS-Integrated Behavior
- M21 handoff remains adapter scoped and cannot submit or finalize claims.

## AI/PHI/Security Requirements
- AI suggestions remain draft/candidate only.
- No medical-necessity determination or autonomous billing.

## Testing Requirements
- Candidate-only tests, patient-summary exclusion, transcript trigger restriction, `submittedClaim=false`, claim submission disabled.

## Required Scripts/Gates
- `pnpm billing:revenue-integrity-readiness`
- Default local gate applicable to touched files.

## Definition Of Done
- Billing support is commercially coherent and non-autonomous.

## Stop Conditions
- Live claim, clearinghouse, payer, or patient-facing financial policy is required.

## Risks And Deferred Decisions
- Future claim submission strategy remains founder/legal/compliance gated.

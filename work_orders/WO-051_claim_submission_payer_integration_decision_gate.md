# WO-051 — Claim Submission And Payer Integration Decision Gate

## Objective

Capture the v1 claim submission, clearinghouse, payer integration, denial automation, and payment workflow strategy without implementing live claim submission by default.

## Why this exists

AURA Note v1 currently supports draft claim preview and billing review only. Live claim submission, payer connectivity, denial automation, and payment workflows are high-risk billing/compliance areas that require explicit founder, billing, compliance, privacy, security, and legal strategy before implementation.

## Prerequisites

- P10 beta-pilot launch decision package is complete or the founder explicitly requests the decision package earlier.
- Current draft claim preview behavior still proves `submittedClaim=false`.
- Billing review remains human-controlled and role-limited.

## In Scope

- Decision package for claim submission strategy.
- Clearinghouse/payer integration option analysis.
- Human approval and audit requirements for any future submission.
- Required billing/compliance/legal questions.
- Future implementation criteria if live claims are approved later.
- Tests/readiness evidence proving the current default remains no live submission.

## Out of Scope

- Live claim submission.
- Autonomous charge finalization.
- Autonomous denial management.
- Payment posting.
- Patient financial conclusions.
- Medical-necessity determination.
- Clearinghouse or payer API implementation.

## UX Requirements

- Existing draft claim preview remains labeled internal, candidate-only, and `submittedClaim=false`.
- Billing review remains human-controlled.
- Patient-facing views must not expose internal revenue, payer strategy, unsupported estimates, coaching, confidence, or draft claim details.

## Backend/API Requirements

- No live payer API is implemented in this work order.
- Any decision evidence remains metadata-only.
- Existing APIs must continue rejecting or omitting live claim-submission behavior.
- Future operation IDs, if documented, must be contract seeds only unless implemented and tested.

## Data Model/Persistence Requirements

- Document future data needs for claim submission, clearinghouse routing, payer responses, denial worklists, payment state, void/reversal, and reconciliation.
- Do not add PHI-bearing payer persistence or production credentials.

## Event/Audit Requirements

- Document future audit/event requirements for claim preview, human approval, submission, payer acknowledgement, denial, resubmission, void/reversal, and payment/reconciliation.
- Preserve current audit-safe evidence that draft claim preview does not submit.

## RBAC/ABAC Requirements

- Billing strategy review is limited to authorized admin, billing lead, compliance/privacy, and security/founder contexts.
- Clinicians may review clinical documentation support but do not submit claims autonomously through AURA Note.
- Support remains metadata-only.

## Standalone-Mode Behavior

- Standalone mode keeps draft claim preview and billing review internal and human-controlled.
- Live payer submission remains disabled unless later approved.

## ClinicOS-Integrated Behavior

- Any future ClinicOS/M21 Charge Integrity or clearinghouse handoff must remain adapter-scoped and cannot bypass AURA Note permissions, human approval, audit, or `submittedClaim=false` default behavior.

## AI/PHI/Security Requirements

- AI cannot determine medical necessity, finalize codes, finalize charges, submit claims, manage denials autonomously, or create final patient financial conclusions.
- No raw PHI is sent to external AI.
- No production payer credentials, endpoints, private keys, or real patient/payer payloads are committed.

## Testing Requirements

- Tests must prove draft claim preview remains `submittedClaim=false`.
- Tests must prove patient-facing summaries exclude internal billing/revenue/payer strategy.
- Tests must prove claim-submission paths remain disabled unless a later approved work order changes that posture.

## Required Scripts/Gates

- `pnpm claim-decision:readiness` if added.
- `pnpm production:readiness`.
- `pnpm acceptance:readiness`.
- Full current local and CI gate.

## Definition of Done

- P11 checkpoint records the default v1 posture, prohibited behavior, deferred decisions, and future approval criteria.
- No live claim submission, payer integration, denial automation, or payment workflow is implemented.
- `RUN_LOG.md`, `repo_status.json`, `SPEC_GAPS.md`, and `CHECKPOINT_REPORT.md` are updated.
- CI/local gates pass.

## Stop Conditions

- Founder requests live claim submission without explicit clearinghouse/payer, legal, billing, compliance, privacy, and security decisions.
- Implementation would require guessing medical-necessity, charge-finalization, claim-submission, denial, payment, or patient financial policy.
- Real payer credentials, real patient data, production endpoints, or production secrets are required.
- Three focused repair attempts fail to resolve a build, test, browser, or runtime blocker.

## Risks And Deferred Decisions

- Clearinghouse selection, payer scope, claim status reconciliation, denial automation, payment posting, void/reversal behavior, patient-facing financial language, medical-necessity governance, and billing compliance ownership remain deferred until explicitly approved.

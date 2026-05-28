# Claim/Payer Decision Gate

`WO-051` closes P11 by capturing the claim submission, clearinghouse, payer integration, denial automation, and payment workflow strategy as a decision package only.

This document is not an implementation approval. AURA Note v1 remains draft-claim-preview and billing-review only by default.

## Current v1 posture

- `submittedClaim=false`
- `claimSubmissionEnabled=false`
- `chargeFinalizationEnabled=false`
- `medicalNecessityDeterminationEnabled=false`
- `denialAutomationEnabled=false`
- `paymentPostingEnabled=false`
- `patientFinancialConclusionEnabled=false`

The product may prepare draft claim previews, payer-readable support language, documentation evidence, and billing review tasks for human review. It must not submit claims, finalize charges, determine medical necessity, automate denials, post payments, or create final patient financial conclusions without a later founder-approved work order and legal/compliance/billing/security review.

## Strategy options

### Option A: Keep claim submission out of AURA Note v1

- AURA Note continues to produce draft claim preview and support evidence.
- Billing users review the preview and use existing billing systems outside AURA Note.
- AURA Note can export human-reviewed evidence, but does not create or submit electronic claims.
- This is the recommended current posture because it preserves the existing safety boundary and avoids clearinghouse/payer credentialing risk.

### Option B: Future clearinghouse adapter

- A later work order may add a clearinghouse adapter boundary after vendor selection, BAA/legal review, credential-source design, test-payer certification, and rollback/void/reversal procedures.
- Submission would require human billing approval, final clinician signature where applicable, compliance checks, tenant configuration, idempotency, durable audit, claim status reconciliation, and disabled-by-default feature flags.
- This option must remain unavailable until explicit approval exists.

### Option C: ClinicOS/M21 Charge Integrity handoff

- AURA Note may hand off approved metadata to ClinicOS/M21 through an adapter boundary if ClinicOS is the system responsible for claim generation or charge integrity.
- ClinicOS cannot bypass AURA Note permissions, human review, audit, or the default `submittedClaim=false` behavior.
- This option requires live ClinicOS contract approval and mapping review before implementation.

### Option D: Direct payer integration

- Direct payer integration is deferred.
- It requires payer-specific credentialing, transaction rules, acknowledgement/rejection handling, denial workflow design, remittance/payment strategy, and formal billing/legal/compliance approval.
- This option is not recommended for default v1 implementation.

## Required decisions before any live submission implementation

- Whether claim submission belongs in v1 or a later release.
- Clearinghouse, ClinicOS handoff, or direct payer strategy.
- Human approval model and authorized roles.
- Tenant configuration and feature-flag governance.
- Billing compliance owner and legal review owner.
- Claim status, acknowledgement, rejection, denial, appeal, void, reversal, and reconciliation lifecycle.
- Medical-necessity governance and prohibited automation language.
- Payment posting scope, if any.
- Patient-facing financial language and estimate boundaries.
- Data retention, audit, evidence retention, and backup/restore requirements.
- Production credential source and secret rotation model.
- Test-payer certification or sandbox acceptance plan.

## Future implementation criteria

Any later live claim work order must prove all of the following before it can be marked done:

- Live submission is disabled by default and enabled only by explicit tenant configuration and approval evidence.
- A human billing approver is required before submission.
- Clinician signature and final note prerequisites are enforced where applicable.
- Every claim-affecting action is tenant/site scoped, permission checked, idempotent, audited, and event emitting.
- Claim payloads are durable, redacted in logs, and never exposed to unauthorized support users.
- Patient-facing outputs exclude internal billing/revenue/payer strategy unless separately approved.
- AI output remains suggestion-only and cannot determine medical necessity, finalize codes, finalize charges, submit claims, manage denials, or create patient financial conclusions.
- Test coverage proves submitted claims cannot be created accidentally, replayed across tenants, or submitted without approval.

## Prohibited current behavior

- No live claim submission.
- No clearinghouse API call.
- No payer API call.
- No autonomous charge finalization.
- No autonomous denial management.
- No payment posting.
- No medical-necessity determination.
- No patient-facing financial conclusion.
- No production payer credentials, endpoints, private keys, `.env` files, or real payer/patient payloads.

## P11 decision result

P11 records that AURA Note v1 keeps claim activity at human-reviewed draft claim preview and billing review only. Future claim submission, clearinghouse, payer, denial, and payment workflows require a new founder-approved work order and explicit legal, billing, compliance, privacy, and security decisions.

# WO-051 Claim/Payer Decision Runbook

## limited decision entry criteria

- P10 beta-pilot decision package is complete.
- Draft claim preview still records `submittedClaim=false`.
- Billing review remains human-controlled and role-limited.
- No live clearinghouse, payer, denial, payment, or production credential path is configured.

## review participants

- Founder or delegated product owner.
- Billing/revenue-cycle lead.
- Compliance/privacy lead.
- Security lead.
- Legal counsel or delegated legal reviewer.
- Clinical lead for documentation/signature prerequisites.

## decision checklist

- Decide whether claim submission belongs in v1 or a later release.
- Select preferred path: no v1 submission, future clearinghouse adapter, ClinicOS/M21 handoff, or direct payer integration.
- Confirm human approval model and prohibited automation.
- Confirm medical-necessity governance and final charge responsibility.
- Confirm denial, void, reversal, payment, and reconciliation lifecycle ownership.
- Confirm patient-facing financial language boundaries.
- Confirm credential, audit, retention, backup/restore, and incident-response requirements.

## current safe default

- `submittedClaim=false`
- `claimSubmissionEnabled=false`
- `chargeFinalizationEnabled=false`
- `medicalNecessityDeterminationEnabled=false`
- `denialAutomationEnabled=false`
- `paymentPostingEnabled=false`

## stop conditions

- A live claim path is requested without clearinghouse/payer selection, legal approval, billing approval, compliance/privacy approval, security approval, and founder approval.
- Implementation would require guessing medical-necessity, charge-finalization, denial, payment, or patient financial policy.
- Real payer credentials, production endpoints, real patient data, or production secrets are required.
- Any UI or API path could submit a claim without explicit human approval and audit evidence.

## follow-up work order criteria

If live claim submission is approved later, the follow-up work order must define the vendor/adapter path, DTOs, durable data model, event catalog, idempotency keys, RBAC/ABAC rules, audit evidence, denial/retry/reconciliation behavior, patient-facing exclusions, PHI/security controls, test-payer certification, and rollback/void/reversal controls before implementation begins.

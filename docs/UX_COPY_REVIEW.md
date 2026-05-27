# UX Copy Review

`WO-019` records the first copy-review package for the synthetic AURA Note web shell. This is review evidence, not legal, compliance, clinical, billing, or production launch certification.

## Required Copy Boundaries

| Surface | Required posture | Must not imply |
| --- | --- | --- |
| Clinical documentation | Draft/supportive, clinician-reviewed, timer-gated. | Autonomous diagnosis, medical-necessity determination, final clinical authority by AI. |
| Billing and attest | Draft claim preview, payer-readable support, human attestation. | Claim submission, final charge, guaranteed reimbursement. |
| Patient summary | Patient-facing, plain-language, internal details excluded. | Internal revenue, coding logic, coaching score, audit/support detail. |
| Coaching | Own-clinician or aggregate admin view only. | Patient-facing coaching, disciplinary scoring, billing pressure. |
| Audit/support | Redacted metadata, permissioned operational status. | Unredacted PHI download, production sink delivery, unlimited support access. |
| Integration status | Disabled or mock unless configured. | Live EHR writeback, production ClinicOS sync, external AI availability by default. |

## Current Evidence

- Finalized note viewer copy states that the editor cannot reopen signed records.
- Patient summary copy/PDF actions state internal billing and revenue logic are excluded.
- Coaching route states patient views are excluded and billing staff are denied.
- Support status states live PHI, AI, EHR, analytics, storage delivery, and destructive retention side effects are guarded.
- Browser tests check core routes and mobile overflow on schedule, workspace, and finalized-note shells.

## Deferred Review

- Final wording still requires founder, clinical, compliance/privacy, security, and design review.
- Final visual hierarchy and component naming should be reconciled with Figma or a selected design system in a later work order.
- Patient-facing summary templates require separate clinical and health-literacy review before production use.

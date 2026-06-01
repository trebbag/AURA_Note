# Billing, Revenue Integrity, Claim Decision, And Compliance Boundary

Status: `WO-073` review-ready synthetic evidence. This package completes v1 billing-support boundaries without enabling live claim submission.

## Scope

AURA Note may generate candidate-only CPT, HCPCS, ICD-10, HCC, E/M, quality, risk, and draft claim preview support for human review. It must not submit claims, finalize charges, determine medical necessity, automate denial management, post payments, or create patient-facing financial conclusions.

## Runtime Boundary

| Boundary | Evidence | Required posture |
| --- | --- | --- |
| Draft claim preview | `DraftClaimPreviewDto.submittedClaim=false` and API/e2e tests. | human review only |
| Billing review queue | Billing review can be triggered and routed; transcript access is role and context limited. | permission checked |
| Candidate codes/items | Suggestions, selections, and rules catalog remain draft/candidate/human-review-required. | no autonomous finalization |
| Patient summary | Internal revenue, billing detail, confidence, and coaching details remain excluded. | patient-safe output |
| Revenue estimates | Internal estimates require configuration and caveats; patient-facing estimates remain disabled. | no financial conclusion |
| ClinicOS/M21 handoff | Adapter-scoped only and cannot bypass AURA Note permissions. | no claim submission |

## Disabled Capabilities

- `claimSubmissionEnabled=false`
- `submittedClaim=false`
- Clearinghouse and payer APIs disabled.
- Denial automation disabled.
- Payment posting disabled.
- Charge finalization disabled.
- Medical-necessity determination disabled.
- Patient-facing financial conclusions disabled.

## Review Checklist

| Item | Evidence | Status |
| --- | --- | --- |
| Draft claim preview is internal only | `apps/api/src/schedule/schedule.service.test.ts`, `apps/api/src/operations/operations.e2e.test.ts` | ready_synthetic |
| Billing transcript access is trigger scoped | `apps/api/src/operations/operations.service.ts` | ready_synthetic |
| Patient summary excludes internal details | Finalized viewer/export tests and docs | ready_synthetic |
| Rules catalog requires human review | `apps/api/src/operations/operations.service.ts` | ready_synthetic |
| Future claim submission decision remains gated | `docs/CLAIM_PAYER_DECISION_GATE.md` | blocked_until_approval |

Production launch remains blocked: `productionLaunchReady=false`.

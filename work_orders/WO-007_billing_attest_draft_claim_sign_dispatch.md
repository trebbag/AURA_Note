# WO-007 — Billing Attest Draft Claim Sign Dispatch

## Objective

Build Wizard Step 5 and Step 6.

## Scope

Billing & Attest shows claim-readiness, selected codes/items, payer-readable justification, draft claim preview, estimate caveats, billing review routing, and clinician attestation. Sign & Dispatch finalizes outputs only when gates pass.

## Suggested files/areas

Billing module, draft claim preview, attestation, sign/dispatch service, tests.

## Acceptance criteria

Open blocker tasks block signing. Billing review triggers transcript permission. Draft claim preview is visible. Sign creates final note and patient summary records.

## Definition of done

- Meets this work order's acceptance criteria.
- Meets the global definition of done in `AGENTS.md`.
- Updates relevant docs and tests.
- Updates `repo_status.json` and `RUN_LOG.md`.
- Adds `SPEC_GAPS.md` entries for unresolved gaps.

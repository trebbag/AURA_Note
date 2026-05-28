# WO-050 Beta Pilot Runbook

This runbook supports the P10 beta-pilot and limited-launch decision package. It does not approve production deployment, production PHI, live vendor traffic, live AI, live EHR/ClinicOS sync, live transcription, destructive deletion, charge finalization, medical-necessity determination, autonomous coding/billing, or claim submission.

## limited pilot entry criteria

Run `pnpm launch:readiness`, confirm GitHub Actions, confirm `CHECKPOINT_REPORT.md` P10 evidence, and confirm the go/no-go checklist remains marked as decision-package evidence only. A live pilot cannot begin until founder, clinical, compliance/privacy, and security owners explicitly approve it outside this synthetic work order.

## tenant onboarding

Verify tenant, site, role, feature-flag, support, and rollback placeholders. Standalone mode must work without ClinicOS. ClinicOS-integrated mode must remain optional and fail closed if delegated identity, mappings, or event delivery are unavailable.

## role training

Training must cover clinician, MA, billing, authorized admin, compliance/privacy, support, and service-account contexts. Support users remain metadata-only. Billing staff only see transcript/final note context when a review is triggered and authorized. Patient-facing surfaces must not expose internal billing, revenue, coaching, confidence, payer-strategy, or unsupported estimate details.

## first-week monitoring

Review access denials, workflow errors, export failures, disabled vendor path hits, support escalations, retention/deletion guards, and rollback triggers daily during the first week. Evidence must be metadata-only and redacted.

## rollback criteria

Rollback or pilot hold is required for smoke-check failure, unauthorized access, privacy incident, vendor misroute, data-integrity issue, unsupported production credential use, missing audit evidence, or patient-safety escalation. Destructive database rollback is not allowed without migration-owner, compliance/privacy, and security approval.

## approval placeholders

Founder, clinical, compliance/privacy, and security approvals are required before any live launch claim. `WO-050` records placeholders, not approvals. Production launch remains blocked until the actual approval package is signed.

## stop conditions

Stop immediately if real PHI, production credentials, live vendors, live claim submission, live charge finalization, live medical-necessity behavior, or destructive production deletion becomes necessary to proceed. Create or update `SPEC_GAPS.md` if a safety-critical launch policy is missing.

# Pilot Launch Readiness

`WO-050` adds the P10 beta-pilot and limited-launch decision package. This is not production launch approval. It uses synthetic metadata only, keeps `productionLaunchApproved=false`, keeps `submittedClaim=false`, performs no production deployment, and touches no live PHI, live EHR, live ClinicOS, live AI, live transcription, live storage delivery, clearinghouse, payer, charge-finalization, medical-necessity, or claim-submission path.

## tenant onboarding/provisioning checklist

| Area | Required evidence before a pilot decision | Current posture |
| --- | --- | --- |
| Tenant record | Synthetic tenant/site/context is available for smoke evidence. | Ready for decision package; no live tenant created. |
| Standalone mode | Schedule, documentation, finalization/export, support, and operations paths have synthetic smoke coverage. | Ready synthetic. |
| ClinicOS-integrated mode | Delegation and mapping remain optional, adapter-bound, and fail closed when unavailable. | Documented mock/degraded mode only. |
| Identity | OIDC/SAML/ClinicOS delegation requires later approved credentials. | Blocked for live use. |
| Feature flags | High-risk live integrations remain disabled unless approved. | Disabled by default. |

## role-training checklist

Pilot training evidence must cover clinician, medical assistant, billing staff, authorized admin, compliance/privacy lead, support, and service-account contexts. Support remains metadata-only. Training must explicitly teach that AI, coding, billing, patient summary, payer support, coaching, and draft claim outputs are human-review-required and cannot autonomously diagnose, code, determine medical necessity, finalize charges, or submit claims.

## disabled feature inventory

The pilot decision package preserves these disabled or deferred features:

- live external AI;
- live EHR writeback;
- live ClinicOS synchronization;
- live transcription provider;
- production PHI object storage delivery;
- destructive production deletion;
- production restore execution;
- patient-facing revenue estimates;
- charge finalization;
- claim submission;
- clearinghouse, payer, denial, and payment automation.

Each disabled path must render as permission-denied, read-only, failed, documented mock, or fail-closed metadata according to its route and adapter boundary.

## first-week monitoring plan

The first-week monitoring plan remains synthetic until owners and production sinks are approved. Required review items are access denials, workflow errors, export failures, disabled vendor path hits, support escalations, retention/deletion guards, and rollback criteria. Evidence must remain metadata-only and must not include PHI, secrets, raw transcripts, final notes, billing details, raw prompts, raw EHR/ClinicOS payloads, or storage object payloads.

## support escalation path

Support escalation requires a release owner, clinical workflow owner, compliance/privacy owner, security owner, infrastructure owner, rollback decision owner, and patient-safety escalation path. These remain placeholders until founder-approved launch staffing exists.

## rollback criteria

Rollback or pilot hold is required for smoke-check failure, unauthorized access, privacy incident, vendor misroute, data-integrity issue, unsupported production credential use, or patient-safety escalation. Database rollback still requires migration-owner, compliance/privacy, and security review because clinical, billing, and audit records may be affected.

## go/no-go checklist

Go/no-go evidence requires:

- local and CI gates passing, including `pnpm launch:readiness`;
- `pnpm frontend:runtime-integration-readiness` proving the seeded backend-backed appointment-to-finalization/export workflow;
- tenant onboarding/provisioning checklist reviewed;
- role-training checklist reviewed;
- disabled feature inventory reviewed;
- support escalation and first-week monitoring placeholders reviewed;
- rollback criteria reviewed;
- founder/clinical/compliance/security approval placeholders recorded.

## founder/clinical/compliance/security approval

`WO-050` records approval placeholders only. It does not supply live production approvals. Any claim that AURA Note is production-launched, HIPAA-compliant, generally available, live against production PHI, live against vendors, or ready to submit claims remains prohibited until later evidence and explicit approvals exist.

## frontend runtime integration evidence

P10 depends on the Frontend Runtime Integration Gate. The current P10 evidence includes typed API-client usage, documented mocks, and a Playwright workflow that creates a backend-backed appointment, reloads/refetches persisted schedule state, starts documentation/finalization, signs with `submittedClaim=false`, and generates export metadata. Synthetic local React state remains allowed only in documented demo/scaffold surfaces or tests.

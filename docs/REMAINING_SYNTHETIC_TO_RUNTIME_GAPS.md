# Remaining Synthetic To Runtime Gaps

## Purpose

This register keeps the post-P11 implementation gap visible. It is not a defect list for completed synthetic/local work. It is the commercial-readiness backlog that `WO-061` through `WO-075` must close or explicitly defer.

## Gap summary

| Gap | Current posture after `WO-061` | Closing work order |
| --- | --- | --- |
| Main API runtime in-memory state | `WO-061` moved the schedule/notes runtime behind explicit repository and storage ports and added local Prisma core-workflow service-recreation evidence. `WO-062` added the shared API request boundary. `WO-063` added the identity runtime boundary and explicit local/demo auth posture. `WO-064` converted primary production-intended UI routes to typed API-backed state. | `WO-061` through `WO-064` complete; continue `WO-065` |
| API request boundary | `WO-062` added consistent request validation, PHI-safe error envelopes, redacted structured runtime logs, request/trace IDs, body-size guardrails, local CORS/security headers, and local throttle scaffolding. Production gateway/WAF/SIEM policies remain deferred. | `WO-062` complete; production gateway policies deferred |
| Production auth fail-closed behavior | `WO-063` makes synthetic headers impossible to trust outside explicit `AURA_NOTE_AUTH_MODE=local_demo` or `AURA_NOTE_AUTH_MODE=local_synthetic`; preview/production/delegated modes fail closed while adapters are unconfigured. Live OIDC/SAML/ClinicOS delegated identity remains deferred. | `WO-063` complete; live identity deferred |
| Primary route local fixtures | Primary production-intended routes now use typed API clients and backend-backed state; remaining local React state is transient control/form/tab state or documented disabled/demo adapter presentation. | `WO-064` complete |
| Figma product map | `WO-065` added the Figma-ready screen, component, state, role, workflow, data/API, copy, and interaction inventory. Final Figma visual design remains deferred. | `WO-065` complete |
| Standalone daily-use workflow | `WO-066` proved a coherent synthetic/local standalone workflow that does not require ClinicOS. | `WO-066` complete |
| Runtime mode resolution | `WO-067` added a shared API `ModeResolver` and explicit adapter-boundary evidence for standalone and ClinicOS contexts. Live ClinicOS contracts and event-bus semantics remain deferred. | `WO-067` complete; live ClinicOS deferred |
| Transcription provider boundary | Browser/audio/transcription path needs provider-ready runtime boundaries while live calls remain disabled. | `WO-068` |
| EHR sandbox runtime boundary | Athenahealth-first and vendor-neutral EHR runtime paths need hardened sandbox, queue, approval, retry, and reconciliation evidence. | `WO-069` |
| AI governance runtime evidence | Prompt/model/eval/source/human-review governance needs expansion without live external AI. | `WO-070` |
| Security/privacy runtime review | Threat model, privacy checklist, minimum necessary, support scope, PHI redaction, and route denial evidence need commercial packaging. | `WO-071` |
| Operations and support readiness | Observability taxonomy, SRE/support runbooks, incident operations, and status surfaces need review-ready evidence. | `WO-072` |
| Billing and revenue integrity boundary | Candidate-only billing, patient-summary exclusion, triggered transcript access, and claim-disabled posture need completion. | `WO-073` |
| Beta pilot package | Controlled pilot onboarding, training, support, rollback, metrics, and synthetic smoke evidence need packaging. | `WO-074` |
| Commercial decision packet | Final readiness matrix and decision gate need an honest review packet. | `WO-075` |

## Explicitly not authorized

These gaps are not closed by enabling live behavior directly:

- live PHI database/storage;
- production identity credentials;
- live Azure PHI object delivery;
- live transcription provider calls;
- live external AI calls;
- production EHR writeback;
- live ClinicOS synchronization;
- clearinghouse or payer APIs;
- claim submission;
- charge finalization;
- medical-necessity determination;
- patient-facing financial conclusions;
- production launch.

Each item remains deferred unless a later founder-approved work order explicitly authorizes it with required governance evidence.

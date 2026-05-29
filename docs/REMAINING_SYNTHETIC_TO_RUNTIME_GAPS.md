# Remaining Synthetic To Runtime Gaps

## Purpose

This register keeps the post-P11 implementation gap visible. It is not a defect list for completed synthetic/local work. It is the commercial-readiness backlog that `WO-061` through `WO-075` must close or explicitly defer.

## Gap summary

| Gap | Current posture after `WO-061` | Closing work order |
| --- | --- | --- |
| Main API runtime in-memory state | `WO-061` moved the schedule/notes runtime behind explicit repository and storage ports and added local Prisma core-workflow service-recreation evidence. `WO-062` added the shared API request boundary. Remaining runtime auth fail-closed work continues in CR-1. | `WO-061` and `WO-062` complete; continue `WO-063` |
| API request boundary | `WO-062` added consistent request validation, PHI-safe error envelopes, redacted structured runtime logs, request/trace IDs, body-size guardrails, local CORS/security headers, and local throttle scaffolding. Production gateway/WAF/SIEM policies remain deferred. | `WO-062` complete; production gateway policies deferred |
| Production auth fail-closed behavior | Synthetic headers must be impossible to trust outside explicit local/demo mode. | `WO-063` |
| Primary route local fixtures | Many production-intended routes still use local fixture arrays or local React state as authoritative screen data. | `WO-064` |
| Figma product map | Figma needs complete screen, component, state, role, workflow, data/API, copy, and interaction inventory. | `WO-065` |
| Standalone daily-use workflow | Standalone mode needs one coherent end-to-end workflow that does not require ClinicOS. | `WO-066` |
| Runtime mode resolution | Runtime services need an explicit `ModeResolver` and adapter use for standalone and ClinicOS contexts. | `WO-067` |
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

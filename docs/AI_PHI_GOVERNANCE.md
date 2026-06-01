# AI, PHI, and Governance

## AI allowed actions

AI may:

- summarize;
- draft;
- suggest;
- score confidence;
- explain rationale;
- identify missing evidence;
- create candidate codes/items;
- create candidate plan tasks;
- draft patient summaries;
- draft payer-readable justifications;
- create coaching feedback;
- route items for human review.

## AI prohibited actions

AI must not independently:

- diagnose;
- finalize diagnoses;
- finalize codes;
- finalize charges;
- submit claims;
- determine medical necessity;
- place orders;
- deny care;
- override compliance or safety protocols;
- create final patient financial conclusions.

## PHI boundary

No raw PHI may be sent to external AI. AI-bound context must be scrubbed or transformed by `packages/ai-gateway`.

## AI request package

AI requests should include structured, minimized context:

- de-identified visit type;
- de-identified clinical facts;
- relevant note text after PHI scrub;
- transcript-derived content after PHI scrub;
- source references without raw identifiers;
- current selections;
- allowed code families;
- rules/policy summaries;
- output schema;
- safety instructions.

## AI response validation

AI responses must be rejected if they:

- fail schema validation;
- contain unsupported final determinations;
- invent facts not present in sources;
- include prohibited raw PHI;
- exceed allowed action scope;
- do not include required rationale/confidence for high-impact suggestions.

## Governance events

AI invocation, output generation, review, approval, rejection, prompt version changes, and model configuration changes must emit audit-safe governance events.

## WO-013 hardening posture

`WO-013` adds explicit default-off feature flags for external AI and production analytics. Structured logs use request ID and trace ID correlation and redact forbidden PHI keys plus obvious PHI-like text before log payloads are considered safe. Audit exports are redacted metadata-only bundles with `includePhi = false`; they do not deliver downloadable files or expose raw clinical payloads in CP-4.

## Post-WO-032 production AI governance rails

`WO-033` preserves external AI as disabled and re-sequences production AI work into `WO-046`. That future work order must add prompt registry/versioning, model configuration records, evaluation harnesses, PHI scrubber/de-identification hardening, output schema validation, source-linked evidence, durable AI governance events, and regression tests proving no raw PHI is sent to external AI.

Live external AI with PHI remains blocked until private/BAA model pathway, privacy/security review, tenant policy, source freshness rules, monitoring, and incident response are approved and implemented. AI outputs remain draft/candidate/suggestion-only.

## WO-041 feature-flag governance

`WO-041` adds a governed high-risk feature-flag model that keeps `AURA_ENABLE_EXTERNAL_AI` disabled by default. Enabling the flag in synthetic admin evidence requires approval metadata and still results in `metadata_only_no_live_execution`; it does not call external AI or authorize PHI transfer.

External AI remains blocked until `WO-046` adds production AI gateway governance, model/prompt configuration records, evaluation harnesses, PHI-scrubber hardening, output schema validation, source-linked evidence, durable governance events, and explicit private/BAA model approval.

## WO-042 storage and PHI posture

`WO-042` does not change the external AI boundary. Storage-backed export, audit export, raw-audio deletion, and restore-readiness evidence remain synthetic/local and do not authorize PHI-bearing object storage or PHI transfer to AI.

- Secure download tokens are server mediated and never public URLs.
- Audit export bundles remain redacted with `includePhi=false`.
- Patient-summary downloads preserve internal-detail exclusion evidence.
- Raw-audio deletion evidence contains object metadata, checksums/eTags, approval ID, recovery-window status, and trace ID only.
- Transcript objects are not deleted and transcript content is not sent to external AI.
## WO-043 observability PHI boundary

`WO-043` extends PHI governance to operational observability and support evidence. Structured log entries, metric labels, trace attributes, operational readiness payloads, and operational evidence records must remain metadata-only, request/trace correlated, and PHI-safe. The support service rejects obvious PHI in operational evidence notes and continues to expose only redacted operational metadata to support users.

No raw PHI is sent to external AI, SIEM, APM, EHR, ClinicOS, or storage vendors as part of `WO-043`. Production observability vendor selection, log retention, and alert routing remain deferred security/privacy decisions.

## WO-044 EHR writeback PHI boundary

`WO-044` keeps EHR writeback queue behavior metadata-only. Writeback action evidence is scanned for forbidden PHI keys and obvious PHI-like text before approval, retry, dead-letter, or reconciliation metadata is recorded. Support users receive redacted operational metadata and cannot view raw writeback payloads or external job identifiers.

No raw PHI is sent to external AI or live EHR vendors as part of `WO-044`. No production EHR credential, production patient record, raw EHR payload, final-note payload, transcript text, billing detail, live writeback delivery, medical-necessity determination, charge finalization, or claim submission is introduced.

## WO-045 ClinicOS AI/PHI boundary

`WO-045` maps ClinicOS M23 Copilot Runtime and M24 AI Governance as metadata-only module boundaries. AI/governance delegation remains disabled for live use; AURA Note remains authoritative for PHI scrubbing, purpose-of-use, source freshness, role checks, and human-review gates. ClinicOS status, mapping, and publication records must keep `payloadStored=false` and must not include raw prompts, transcripts, final notes, billing details, coaching output, or raw ClinicOS messages.

No raw PHI is sent to ClinicOS, external AI, EHR vendors, analytics vendors, or storage vendors as part of `WO-045`. Live M23/M24 delegation, live event-bus delivery, private/BAA model configuration, model evaluation thresholds, and AI governance operations remain deferred to `WO-046` and later security/privacy/founder review.

## WO-046 AI Gateway governance and evaluation harness

`WO-046` hardens the AI Gateway as synthetic/local production-review evidence without enabling live external AI. The gateway now records prompt registry metadata, model configuration records for mock/private-BAA-placeholder/external-disabled modes, deterministic evaluation cases for suggestions, note drafting, patient summaries, billing-preview candidates, and coaching feedback, plus output validation metadata.

The AI Gateway rejects unsafe output shapes that attempt autonomous diagnosis, final code/charge behavior, claim submission, order placement, medical-necessity determination, or patient-facing financial conclusions. All accepted AI output remains draft/candidate/suggestion-only, source-linked, confidence/risk labeled where applicable, and `humanReviewRequired=true`.

PHI handling remains fail-closed: forbidden PHI keys, obvious PHI-like free text, nested payloads, and evidence excerpts are rejected by default or redacted only in explicit redaction mode before mock invocation. Events and evaluation evidence store metadata only: prompt/model versions, context package IDs, source evidence IDs, redacted/rejected paths, validation status, and trace IDs. They do not store raw prompt text, raw note text, raw transcript text, raw EHR/ClinicOS payloads, real model output, production chart data, patient identifiers, secrets, or production endpoint URLs.

External AI remains disabled until a later private/BAA model pathway, tenant policy, live credential source, monitoring, drift response, and security/privacy/founder approval are implemented.

## WO-047 security/privacy/compliance review

`WO-047` reviewed the P9 AI/PHI boundary together with EHR, ClinicOS, storage, retention, observability, audit, and support surfaces. No new P9 AI/PHI blocker was found in the current synthetic/local scope. The review confirms that live external AI remains disabled, raw PHI remains rejected by default, explicit redaction mode remains metadata-only/mock-only, and unsafe output validation continues to reject autonomous diagnosis, final coding/charging, claim submission, orders, medical-necessity determination, and patient-facing financial conclusions.

The review does not approve live AI use. Private/BAA model selection, live credential source, tenant policy, evaluation thresholds, monitoring, drift response, incident response, and founder/security/privacy approval remain deferred production decisions.

## WO-062 API request-boundary PHI posture

`WO-062` adds a general API request-boundary PHI guard for implemented public endpoints. Ordinary request bodies that include forbidden PHI-like keys/text, raw transcript fields, raw audio fields, or production credential fields are rejected before service mutation and returned as PHI-safe `ApiErrorEnvelope` responses. Runtime logs use structured redaction and do not retain raw request bodies.

AI Gateway invocation payloads remain governed by the AI Gateway policy instead of the generic boundary so explicit `reject` and `redact` behavior continues to generate AI-specific audit/domain evidence such as `ai.phi_rejected.v1`, `ai.context_scrubbed.v1`, and `ai.request_prepared.v1`. `WO-062` does not enable external AI, live model calls, raw-PHI-to-external-AI transfer, production prompt stores, or support access to AI PHI content.

## WO-063 identity runtime PHI posture

`WO-063` adds the explicit `AURA_NOTE_AUTH_MODE` identity runtime boundary. Local synthetic/demo identity headers are accepted only in explicit local modes, and preview/production/delegated auth postures fail closed while live adapters are unconfigured. Identity accepted/denied logs contain audit-safe metadata only: auth mode, identity source, failure reason, request ID, trace ID, and `liveCredentialPresent=false`. They do not contain raw tokens, SAML assertions, OIDC claims payloads, ClinicOS delegated identity payloads, credentials, secrets, or PHI.

`WO-063` does not change AI behavior or authorize PHI access. External AI remains disabled, raw PHI remains blocked from external AI, and all AI/coding/billing/coaching/patient-summary/payer-support outputs remain draft/candidate/human-review-required.

## WO-068 transcription runtime PHI posture

`WO-068` keeps transcription production-shaped but local/synthetic. No raw PHI audio leaves the governed local path, no live transcription vendor is called, and no external AI is invoked for transcription. Recording chunks remain metadata-only with `rawPhiAudioStored=false`; provider status records `rawAudioPayloadStorageEnabled=false`; raw-audio retention remains one week; transcript retention remains indefinite; support users remain metadata-only.

The disabled live-provider path fails closed until vendor, BAA, credential, consent, PHI transport, monitoring, and security/privacy approvals exist. Transcript corrections continue to reject forbidden PHI-like keys/text before mutation. Event payloads are audit-safe metadata and must not include raw audio, credentials, live provider payloads, production URLs, autonomous diagnosis/coding/billing evidence, charge finalization, medical-necessity determinations, or claim submission evidence.

## WO-069 EHR runtime PHI posture

`WO-069` keeps EHR runtime behavior production-shaped but local/synthetic. No raw EHR payload is stored, no live EHR API is called, no live writeback is delivered, and no EHR payload is sent to external AI. Runtime boundary, patient lookup, appointment import, encounter context, and writeback lifecycle responses contain synthetic metadata only with `rawPayloadStorageEnabled=false`, `liveApiCallsEnabled=false`, and `liveWritebackEnabled=false`.

Writeback action reasons continue to pass PHI/credential boundary checks before mutation. Support users remain operational metadata only. Event payloads are audit-safe metadata and must not include raw vendor responses, credentials, production URLs, final-note text, transcript text, billing details, autonomous diagnosis/coding/billing evidence, charge finalization, medical-necessity determinations, or claim submission evidence.

## WO-070 AI runtime governance boundary

`WO-070` expands the AI Gateway runtime boundary and evaluation harness while keeping live external AI disabled. `/ai-gateway/runtime-boundary` returns `server_side_ai_gateway` metadata with `liveModelCallsEnabled=false`, `liveModelCredentialPresent=false`, `rawPhiToExternalAiAllowed=false`, `productionPromptStoreEnabled=false`, `privateBaaPathwayApproved=false`, and `driftMonitoringStatus=placeholder_disabled`.

The deterministic evaluation harness now rejects prohibited finalization behaviors for diagnosis, codes, charges, claims, medical necessity, orders, patient-facing financial conclusions, unsupported payer language, and unsafe coaching. It also rejects stale-source output through `source_stale` blocked-behavior metadata. Output validation records schema-validation status, source freshness, confidence, risk label, blocked behavior, and human-review-required state before any user-facing adoption.

PHI handling remains fail-closed: raw PHI is rejected before any model boundary, explicit redaction records scrubbed context evidence, and both paths remain mock/local only. Event payloads are audit-safe metadata only and may include prompt/model versions, context package IDs, source evidence IDs, rejected/redacted paths, validation status, source freshness, blocked behavior, trace ID, and `liveModelCalled=false`; they must not include raw prompts, raw note text, raw transcript text, raw EHR/ClinicOS payloads, production chart data, real model output, credentials, production URLs, final clinical/coding/billing decisions, medical-necessity determinations, orders, claim submissions, or patient financial conclusions.

## WO-049 launch operations PHI boundary

`WO-049` launch operations readiness uses synthetic operational metadata only. Performance baselines, rollback rehearsal, reliability drills, incident response, access review, and support escalation evidence must not include PHI, secrets, production URLs, raw transcripts, final notes, billing details, coaching output, raw prompts, raw EHR/ClinicOS payloads, storage object payloads, medical-necessity determinations, charge finalization, or claim submission evidence.

## WO-050 beta pilot launch gate

`WO-050` does not add AI behavior. Pilot decision evidence remains synthetic metadata only; live external AI stays disabled, no raw PHI is sent to external AI, all AI/coding/billing/coaching/patient-summary/payer-support outputs remain draft/candidate/human-review-required, and `productionLaunchApproved=false` until founder, clinical, compliance/privacy, and security approvals exist.

## WO-051 claim/payer decision gate

`WO-051` does not add AI behavior or payer connectivity. AI remains prohibited from determining medical necessity, finalizing codes, finalizing charges, submitting claims, managing denials autonomously, posting payments, or creating patient-facing financial conclusions. Draft payer-readable support language and draft claim-preview support may remain human-review-required only. No raw PHI, payer payload, production credential, claim payload, denial evidence, or payment data is sent to external AI.

## WO-071 through WO-075 CR-4 commercial readiness PHI boundary

CR-4 is a commercial readiness review package only. `/support/commercial-readiness`, `docs/COMMERCIAL_READINESS_REVIEW_PACKET.md`, and the CR-4 gates expose metadata about security/privacy/compliance, operations, billing/revenue integrity, beta-pilot readiness, and final decision posture. They do not add AI behavior, live PHI processing, live vendor calls, raw prompts, raw transcripts, final-note text, billing detail payloads, coaching output, claim payloads, production credentials, or production launch approval.

The CR-4 packet preserves `productionLaunchReady=false`, `liveVendorEnabled=false`, `submittedClaim=false`, no certification claim, no autonomous clinical/coding/billing behavior, and no raw PHI transfer to external AI.

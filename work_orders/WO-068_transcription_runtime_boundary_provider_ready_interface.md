# WO-068 — Transcription Runtime Boundary And Provider-Ready Interface

## Objective

Make transcription production-shaped while keeping live provider calls disabled until a later approved provider/governance decision.

## Why This Work Order Exists

Browser recording and mock transcription evidence exist, but commercial readiness requires a clean runtime boundary for future transcription providers, audio metadata, retention policy, retry/error states, and role-limited transcript access without introducing live PHI-bearing provider traffic.

## Prerequisites

- `WO-067` ModeResolver and adapter runtime wiring complete.
- Current browser audio/transcription scaffold, raw-audio retention metadata, transcript retention behavior, API contracts, security helpers, and worker retention jobs.
- Current `docs/BACKEND_BUILD_SPEC.md`, `docs/API_EVENT_CONTRACTS.md`, `docs/DATA_MODEL.md`, `docs/RBAC_ABAC_MATRIX.md`, and `docs/AI_PHI_GOVERNANCE.md`.

## In Scope

- Server-side transcription provider adapter interface.
- Deterministic mock transcription provider for CI/local tests.
- Disabled live-provider placeholder that fails closed without credentials.
- Browser/device/permission/interruption/retry/long-visit/pause/resume/no-audio/provider-unavailable/correction-history states.
- Raw-audio one-week retention metadata and transcript indefinite-retention evidence.
- Transcript confidence, source, speaker-label/diarization placeholder, and correction history metadata where feasible.
- `pnpm transcription:runtime-boundary-readiness`.

## Out Of Scope

- Live transcription credentials.
- PHI-bearing audio payload transport to a real provider.
- Live provider calls.
- Production raw-audio object storage beyond existing storage-boundary scaffolding.
- Final provider/vendor selection or BAA approval.

## UX Requirements

- Browser-visible states for microphone permission denied, device unavailable, upload interrupted, provider unavailable, low confidence, diarization unsupported/degraded, correction history, approved recording exception, read-only finalized transcript, failed, loading, empty, ready, saving, and demo fixture.
- UI must not imply normal recording occurred when the approved recording-exception path is used.
- Transcript states remain role-limited and finalized/read-only where applicable.

## Backend/API Requirements

- Provider boundary is server-side and tenant/site scoped.
- Live provider execution fails closed unless explicitly configured by a later work order.
- Chunk/recording metadata actions are permission checked, idempotent where retries are plausible, audit logged, and event emitting.
- Transcript correction/retrieval honors existing transcript/final-note/billing/support visibility rules.
- Provider status and job lifecycle APIs return metadata only and never expose credentials.

## Data Model/Persistence Requirements

- Recording chunk metadata, transcription jobs, transcript segment provider metadata, confidence/source/speaker labels, correction history, retry/dead-letter state, and retention evidence are represented consistently with the current data model.
- Raw audio remains one-week retention; transcripts remain indefinite unless a later tenant policy work order changes that.
- No production provider payloads, real PHI, credentials, private keys, or production URLs are persisted.

## Event/Audit Requirements

- Record consent/exception, chunk authorized/denied, job requested/denied, provider disabled/unavailable, segment received, correction recorded, raw-audio retention, and transcript-retention evidence as audit-safe metadata.
- Event payloads must exclude raw audio, transcript text unless specifically allowed by existing transcript DTO policy, credentials, production provider payloads, medical-necessity determinations, charge finalization, or claim submission evidence.

## RBAC/ABAC Requirements

- Transcript visibility follows clinician, billing, admin, authorized-admin, support, linked-visit, linked-patient, and billing-review-trigger rules.
- Support remains metadata-only.
- Billing staff transcript access remains allowed only through the existing billing-review trigger and minimum-necessary posture.
- ClinicOS-integrated mode cannot bypass AURA Note transcript, recording, retention, or correction permissions.

## Standalone-Mode Behavior

- Standalone uses mock/local transcription provider behavior until governed live-provider approval.
- Standalone recording/transcript workflow remains testable without ClinicOS.

## ClinicOS-Integrated Behavior

- ClinicOS may provide visit context and receive status metadata through adapter boundaries.
- Missing or degraded ClinicOS delegation cannot block standalone transcription workflow and cannot bypass AURA Note permissions.

## AI/PHI/Security Requirements

- No raw PHI leaves the governed local path.
- No live external AI is called.
- Logs are redacted and request/trace correlated.
- Synthetic fixtures only; no real patient audio, transcripts, identifiers, credentials, or production connection strings.

## Testing Requirements

- Unit/integration tests for mock provider, disabled live provider, provider-unavailable state, device/permission/interruption states, retry/dead-letter metadata, correction history, transcript retention, and raw-audio retention.
- Role-denial tests for transcript access and correction actions.
- Browser/e2e tests for the core recording/transcription state path with synthetic data.
- Regression tests proving approved recording exceptions do not imply normal recording and transcript purge count remains zero.

## Required Scripts/Gates

- `pnpm transcription:runtime-boundary-readiness`
- `pnpm audio:transcription-readiness`
- `pnpm mode:adapter-readiness`
- Default local gate applicable to touched files.
- `pnpm production:readiness`
- `node scripts/status.js`

## Definition Of Done

- Runtime transcription boundary is provider-ready without making live provider calls.
- Mock provider path is deterministic and CI-safe.
- Live provider path fails closed without credentials and governance approval.
- Retention, correction-history, confidence/source, role visibility, audit/event, docs, status, and run-log evidence are updated.
- No live PHI, real audio, production provider credential, live AI, claim submission, charge finalization, medical-necessity determination, or production launch behavior is introduced.

## Stop Conditions

- Provider selection, BAA, consent/legal policy, live audio transport policy, or production audio storage policy is required to proceed.
- A transcription path would weaken tenant/site scope, RBAC/ABAC, PHI redaction, raw-audio retention, transcript retention, or human-review boundaries.
- Three focused repair attempts fail.

## Risks And Deferred Decisions

- Live transcription provider, diarization reliability, production audio storage, consent/legal policy, provider retry taxonomy, and production monitoring remain deferred.

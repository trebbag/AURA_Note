# WO-040 — Browser Audio Capture And Transcription Candidate

## Objective

Implement the P8.5 audio and transcription candidate: timer-controlled browser recording UX, recording transport scaffolding, raw-audio object metadata, transcription provider boundary, mock transcription worker behavior, transcript retention metadata, correction history, and provider-governance controls.

## Why this exists

P7.5 proves standalone product operation without ClinicOS dependency. The next high-risk product capability is audio capture and transcription. It must be implemented behind safe browser/API/worker boundaries before any live provider, production PHI storage, or production deletion behavior is considered.

## Prerequisites

- `WO-038` and `WO-039` are complete and merged.
- P7 durable runtime evidence remains intact.
- No active `SPEC_GAP` blocks browser microphone consent, recording transport, transcription-provider governance, raw-audio retention, transcript correction history, or PHI storage boundaries.

## In scope

- Browser microphone capture path with explicit user action, visible permission-denied/unsupported states, and timer-controlled recording controls.
- Recording transport scaffold using synthetic/local chunk metadata or equivalent, without committing audio payloads or real PHI.
- Raw-audio object metadata linked to visit session/note with one-week retention policy and deletion eligibility state.
- Transcript retention remains indefinite unless later tenant policy changes.
- Transcription provider adapter interface and deterministic mock provider for CI.
- Optional real provider boundary only as disabled/config-gated metadata; no live provider call without later governance.
- Mock transcription worker path that accepts synthetic chunk metadata, creates transcript segments, and records provider/source/confidence metadata.
- Transcript confidence/source metadata and diarization/speaker-label placeholder where provider support is absent.
- Transcript correction/edit history if feasible within the current slice.
- Browser/API/worker tests for start/pause/resume/stop, exception path, permission denial, mock transcription, retention metadata, correction history, and role-limited transcript visibility.

## Out of scope

- Live transcription provider calls.
- Real microphone audio persistence containing PHI.
- Production object storage approval for raw audio payloads.
- Production deletion execution.
- Production backup/restore execution.
- Live AI summarization over transcript content.
- Live EHR/ClinicOS synchronization.
- Autonomous diagnosis, coding, charge finalization, medical-necessity determination, claim submission, or patient-facing financial conclusions.

## UX requirements

- Extend the documentation workspace or a focused audio route with microphone capture controls that support empty, loading, ready, recording, paused, stopping, blocked, failed, permission-denied, unsupported, read-only/finalized, and demo fixture states.
- Recording controls must be keyboard accessible and have accessible names.
- Timer state and editor lock state must remain visibly aligned.
- Approved recording exception must allow documentation without implying normal recording occurred.
- Transcript panel must display mock segment source, confidence, speaker label placeholder, correction state, and retention status.
- No UI may imply that production PHI audio storage, live transcription, or external AI is enabled by default.

## Backend/API requirements

- Add or harden API endpoints for recording session state, chunk metadata append, transcription job queue, transcript segment retrieval, transcript correction, and retention metadata retrieval.
- Every state-changing endpoint must validate input, enforce tenant/site scope, enforce permissions, emit audit/event evidence, and be idempotent where duplicate chunk submissions are plausible.
- Provider adapters must be interfaces with mock implementation used by tests/CI.
- Real provider configuration must remain disabled until a later governance work order authorizes it.

## Data model/persistence requirements

- Use existing durable `VisitSession`, `RecordingAsset`, `Transcript`, and `TranscriptSegment` schema/adapters where available.
- Add local synthetic persistence evidence only where the current schema safely supports it.
- Raw-audio metadata must include retention class, capture timestamp, purge-after timestamp, storage provider/key metadata when applicable, checksum/eTag when available, and deletion eligibility.
- Transcript metadata must preserve indefinite retention and not be deleted by raw-audio deletion paths.
- Tenant-owned persisted rows must have tenant/site enforcement and RLS evidence or documented safe fallback.

## Event/audit requirements

- Emit audit/domain evidence for microphone permission state, recording started/paused/resumed/stopped, recording exception approval, chunk metadata received, transcription job queued/processed/failed, transcript segment added, transcript corrected, raw-audio retention scheduled, and audit event recorded.
- Events must remain audit-safe metadata and synthetic-only.

## RBAC/ABAC requirements

- Treating clinicians can control recording for linked visits.
- MAs may view task-related transcript excerpts only where already allowed by spec and role.
- Billing staff can access transcript only when billing review is triggered and linked to the visit.
- Admin/authorized-admin access remains permission-checked.
- Support users must not gain chart, transcript, billing, coaching, or final note access through audio/transcription surfaces.

## Standalone-mode behavior

- Standalone owns the recording session, chunk metadata, transcription job, transcript, correction history, and retention metadata.
- All behavior must work without ClinicOS.

## ClinicOS-integrated behavior

- ClinicOS mode remains adapter-bound and must not bypass AURA Note permissions.
- Mapping to M17/M23/M24/M25/M26 remains safe-degraded unless later work orders explicitly implement synchronization.

## AI/PHI/security requirements

- Use synthetic fixtures only.
- No raw PHI is sent to external AI.
- No live transcription provider is called unless an explicit later work order authorizes provider credentials, BAA/private pathway, governance, and audit evidence.
- Logs must redact forbidden PHI keys/text and include request/trace correlation.
- Raw audio retention remains one week; transcript retention remains indefinite.

## Testing requirements

- Unit tests for recording state transitions, chunk metadata idempotency, mock provider output, transcript retention, correction history, and raw-audio deletion non-interference with transcripts.
- API tests for role denial, tenant/site denial, validation, idempotency, audit/event evidence, and permission-denied transcript access.
- Worker tests for mock transcription queue processing and retention metadata.
- Browser tests for microphone permission states, timer-controlled controls, approved exception path, transcript display, correction state, and responsive layout.
- PHI/security tests proving forbidden keys remain rejected/redacted.

## Required scripts/gates

- Add `pnpm audio:transcription-readiness` or equivalent.
- Run the standard local gate:
  - `pnpm install --frozen-lockfile`
  - `pnpm db:client:generate`
  - `pnpm lint`
  - `pnpm lint:phi`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm test:e2e`
  - `pnpm test:browser`
  - `pnpm build`
  - all applicable persistence/storage/retention/readiness scripts
  - `pnpm standalone:patient-schedule-readiness`
  - `pnpm standalone:operations-readiness`
  - `pnpm audio:transcription-readiness`
  - `pnpm production:readiness`
  - `pnpm acceptance:readiness`
  - `node scripts/status.js`
  - `git diff --check`

## Definition of Done

- Browser microphone/recording/transcription workflow is browser/API/worker-testable with synthetic data.
- Mock transcription provider and worker path are deterministic and covered by CI.
- Recording exception path is explicit and does not imply normal recording occurred.
- Raw-audio metadata uses one-week retention; transcript retention remains indefinite.
- Transcript correction history is represented or a non-blocking deferred decision is documented.
- Role denial and billing-review transcript restrictions are covered.
- State changes are tenant/site scoped, permission checked, audited, and backed by local synthetic persistence where required.
- `RUN_LOG.md`, `repo_status.json`, relevant docs, scripts, and work-order status are updated.

## Stop conditions

- Missing or contradictory policy for microphone consent, recording retention, transcript correction history, live provider governance, or production PHI audio storage.
- Any implementation path requiring live transcription credentials, production PHI storage approval, production deletion execution, live ClinicOS sync, live EHR writeback, autonomous clinical/coding/billing/medical-necessity decisions, charge finalization, claim submission, or patient-facing financial conclusions.

## Risks and deferred decisions

- Live transcription-provider choice, BAA/private pathway, production audio storage, production retention deletion execution, diarization quality guarantees, and transcript correction audit depth remain deferred until later governance and security/privacy review.

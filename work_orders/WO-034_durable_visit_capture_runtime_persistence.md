# WO-034 — Durable Visit Capture Runtime Persistence

## Objective

Move visit session, recording asset, transcript, and transcript segment runtime state from in-memory/local synthetic state to Prisma-backed local PostgreSQL while preserving timer gates, recording exception behavior, raw-audio retention metadata, and indefinite transcript retention.

## Why this work order exists

`WO-004` made timer, recording-gate, raw-audio metadata, and mock transcript behavior browser/API-testable. `WO-024` added schema-level relationships, and `WO-029` through `WO-031` proved local PostgreSQL, the first schedule adapter, tenant/site query enforcement, and core RLS evidence. The visit capture runtime is still not durable and must be migrated before production readiness can be claimed.

## Prerequisites

- `WO-033` complete.
- `WO-030` Prisma schedule adapter evidence complete.
- `WO-031` tenant/site query and core RLS evidence complete.
- Existing visit/session/transcript schema relation coverage from `WO-024`.

## In scope

- Repository ports and Prisma-backed local adapters for `VisitSession`, `RecordingAsset`, `Transcript`, and `TranscriptSegment`.
- Durable start, pause, resume, stop, approved recording exception, raw-audio metadata, and mock transcript append/retrieval behavior.
- Transaction and error-path tests for session state changes and transcript segment append.
- Tenant and optional site query filters for every persisted visit capture read/write.
- Cross-tenant and cross-site denial tests at repository and API-harness layers.
- RLS SQL artifact and local PostgreSQL evidence for visit capture tables.
- Readiness script `pnpm persistence:visit-capture-adapter`.

## Out of scope

- Browser microphone capture.
- Chunk upload or live recording transport.
- Live transcription provider.
- Production PHI persistence.
- Production object storage execution.
- Production raw-audio deletion.
- External AI invocation.
- Live EHR or ClinicOS synchronization.

## UX requirements

- Existing workspace Start, Pause, Resume, Stop, approved exception, locked editor, and mock transcript states must continue to pass browser tests.
- Reloaded durable state must preserve clear active, paused, stopped, exception, transcript-ready, empty, blocked, failed, and permission-denied states where applicable.

## Backend/API requirements

- Visit control operations must validate input, enforce tenant/site scope, enforce permissions, and emit audit/event evidence.
- Transcript append/retrieval must be tenant/site scoped and role-gated.
- Duplicate or stale session transitions must fail safely or replay idempotently where appropriate.
- The broad API runtime may remain in-memory unless this work order deliberately switches only the visit capture slice through a testable adapter boundary.

## Data model/persistence requirements

- Persist `VisitSession`, `RecordingAsset`, `Transcript`, and `TranscriptSegment` rows through Prisma/local PostgreSQL.
- Preserve raw-audio one-week retention metadata.
- Preserve transcript indefinite-retention metadata.
- Preserve semantic source references separately from persisted UUID primary keys if needed.
- Add query indexes or constraints needed for tenant/site and note/session lookup.

## Event/audit requirements

- Persist or emit audit-safe evidence for:
  - `visit.started.v1`
  - `visit.paused.v1`
  - `visit.resumed.v1`
  - `visit.stopped.v1`
  - `recording.started.v1`
  - `recording.exception_approved.v1`
  - `recording.stopped.v1`
  - `raw_audio.retention_scheduled.v1`
  - `transcript.segment_appended.v1`
- Event payloads must not include raw transcript text unless the existing contract explicitly permits safe synthetic/local content.

## RBAC/ABAC requirements

- Treating clinician and authorized admin can operate visit controls where linked and permitted.
- Transcript visibility remains role-limited.
- Billing staff transcript access remains denied unless billing review is triggered.
- Cross-tenant and cross-site reads/writes are denied before DTO exposure.

## Standalone-mode behavior

- Standalone mode owns visit sessions, recording metadata, transcript records, and transcript segment records.
- The workflow must work without ClinicOS, EHR, live transcription, or live object storage.

## ClinicOS-integrated behavior

- Persisted records must remain mappable to ClinicOS visit identifiers through adapter boundaries.
- ClinicOS context must not bypass AURA Note tenant/site/RBAC/ABAC checks.
- Live ClinicOS event publication remains deferred unless explicitly implemented by a later work order.

## AI/PHI/security requirements

- No raw PHI may be sent to external AI.
- Logs must be redacted and correlated.
- Transcript and recording metadata must be treated as sensitive.
- Production PHI storage remains deferred until later production database/security/privacy review.

## Testing requirements

- Unit tests for repository mapping and transition invariants.
- Local PostgreSQL integration tests for persisted start/pause/resume/stop/exception/transcript append/reload behavior.
- Cross-tenant and cross-site denial tests.
- RLS read, insert, and update denial tests.
- API-harness tests proving denied persisted records are not exposed as DTOs.
- Browser/e2e regression for current workspace timer/editor/transcript behavior.

## Required scripts/gates

- `pnpm persistence:visit-capture-adapter`
- `pnpm persistence:tenant-isolation`
- `pnpm acceptance:readiness`
- `pnpm production:readiness`
- Full standard local gate from `docs/PRODUCTION_BUILD_PLAN.md`.

## Definition of Done

- Visit capture state is locally durable through Prisma/PostgreSQL.
- Tenant/site repository and API-harness denial tests pass.
- Visit capture RLS policy artifact and evidence tests pass.
- Existing workspace UX remains browser-testable.
- Raw-audio retention metadata and transcript indefinite retention remain correct.
- No production PHI storage, live transcription, live AI, live EHR, live ClinicOS, or production deletion is introduced.
- `RUN_LOG.md`, `repo_status.json`, relevant docs, and readiness scripts are updated.
- CI passes before merge.

## Stop conditions

- Missing/unsafe policy for transcript persistence blocks implementation.
- RLS or tenant/site enforcement cannot be proven after three focused repair attempts.
- A schema/API conflict would require guessing clinical, privacy, or retention behavior.

## Risks and deferred decisions

- Production PHI database policy remains deferred.
- Live transcription provider, browser recording transport, audio object storage, and production deletion are deferred to later work orders.
- This work order should not claim full durable application runtime; it covers the visit capture slice only.

# WO-024 — Visit, Recording, and Transcript Prisma Relationship Readiness

## Objective

Extend the post-CP4 persistence schema relationship evidence from the core schedule/note graph into the visit-session, recording-asset, transcript, and transcript-segment graph without enabling live database writes.

## Source of truth

- `AGENTS.md`
- `docs/BACKEND_BUILD_SPEC.md`
- `docs/DATA_MODEL.md`
- `docs/PERSISTENCE_FOUNDATION.md`
- `packages/contracts/prisma/schema.prisma`
- `scripts/validate-persistence-runtime-readiness.js`

## Scope

- Add Prisma relation fields for:
  - `VisitSession` to `Tenant`, `Site`, and `Note`;
  - `RecordingAsset` to `Tenant`, `Site`, `Note`, and `VisitSession`;
  - `Transcript` to `Tenant`, `Site`, `Note`, and `VisitSession`;
  - `TranscriptSegment` to `Tenant`, `Site`, `Transcript`, and `Note`.
- Add inverse relation fields on `Tenant`, `Site`, and `Note` where needed.
- Extend migration SQL-generation readiness checks for the generated foreign-key fragments.
- Keep runtime behavior on the existing in-memory synthetic adapter.

## Out of scope

- Prisma Client runtime usage.
- Applying migrations to a local, shared, staging, or production database.
- Local PostgreSQL orchestration.
- Row-level security policies.
- Transaction behavior and error-path coverage.
- Production PHI persistence.
- Recording storage vendors, microphone capture, external transcription, live AI, EHR writeback, ClinicOS sync, analytics export, audit export delivery, storage deletion, claim submission, or billing finalization.

## Acceptance criteria

- `pnpm db:schema:validate` passes.
- `pnpm persistence:foundation` passes.
- `pnpm persistence:runtime-readiness` verifies generated forward SQL includes visit, recording, transcript, and transcript-segment foreign keys.
- `pnpm persistence:adapter-readiness` continues to pass with Prisma runtime mode disabled.
- `pnpm acceptance:readiness` includes `WO-024` as done.
- Full local gate passes before PR merge.

## Status

Done as schema and SQL-generation readiness only.

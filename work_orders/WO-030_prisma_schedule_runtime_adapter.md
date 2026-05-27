# WO-030 — Prisma Schedule Runtime Adapter

## Status

Done.

## Objective

Replace the first repository slice with a Prisma-backed local runtime adapter for the standalone appointment-to-note lifecycle while preserving the existing in-memory runtime as the default broad application adapter until the remaining workflow state can be made durable safely.

## Source of truth

- `AGENTS.md`
- `docs/LOCKED_DECISIONS.md`
- `docs/specs/AURA_NOTE_V1_CANONICAL_BUILD_SPEC.md`
- `docs/BACKEND_BUILD_SPEC.md`
- `docs/DATA_MODEL.md`
- `docs/PERSISTENCE_FOUNDATION.md`
- `packages/contracts/prisma/schema.prisma`
- `apps/api/src/schedule/schedule.repository.ts`
- `packages/persistence/src/index.ts`

## Scope

- Add a Prisma-backed async repository adapter for schedule appointment and note shell state.
- Persist and retrieve the one appointment-to-one note relationship through local synthetic PostgreSQL.
- Preserve semantic synthetic appointment and note IDs through `sourceRef` fields while storing deterministic UUID primary keys.
- Add durable tenant-scoped idempotency replay records for the Prisma schedule adapter.
- Add local PostgreSQL integration coverage for create, list, lookup by appointment, lookup by note, one-to-one remapping blocks, and idempotency remapping blocks.
- Generate Prisma Client during CI before typecheck because this tranche introduces compiled Prisma Client imports.
- Keep synthetic data only.

## Out of scope

- Switching the full `ScheduleService` and every clinical workflow endpoint to Prisma by default.
- Durable persistence for visit sessions, transcripts, suggestions, selections, compliance review, finalization, exports, writeback, coaching, support, or audit export workflows.
- Row-level security policy implementation.
- Production database migration execution.
- Production PHI persistence.
- Production credentials or `.env` files.
- Live AI, EHR, ClinicOS, storage, analytics, or claim-submission behavior.

## Acceptance evidence

- `pnpm db:client:generate` passes.
- `pnpm --filter @aura-note/api typecheck` passes.
- `pnpm persistence:prisma-schedule-adapter` passes against local synthetic PostgreSQL.
- `pnpm db:schema:validate` passes.
- `pnpm persistence:runtime-readiness` includes `IdempotencyRecord` and source-reference schema evidence.
- `pnpm acceptance:readiness` includes the WO-030 adapter evidence.
- Full local gate passes before PR merge.

## Notes

This tranche intentionally stops at the appointment/note repository slice. The existing synchronous API service remains on the in-memory adapter for broader workflow state until a later work order converts service methods and controller paths to async database-backed behavior without partial persistence loss.

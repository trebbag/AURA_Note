# WO-031 — Tenant Isolation And Core RLS Evidence

## Objective

Add live local PostgreSQL evidence that the current Prisma schedule adapter enforces tenant and site boundaries, and adopt core-table PostgreSQL row-level security for the currently persisted schedule/note slice.

## Source Trace

- `AGENTS.md` sections 14, 16, and 17.
- `docs/BACKEND_BUILD_SPEC.md` tenant-scoped backend posture.
- `docs/PERSISTENCE_FOUNDATION.md` PostgreSQL persistence foundation.
- `docs/DATA_MODEL.md` core schedule/note persistence model.
- `apps/api/src/schedule/prisma-schedule.repository.ts`.

## Scope

- Extend the Prisma schedule adapter from tenant-only scope to tenant plus optional site scope.
- Add live PostgreSQL tests for same-tenant access, cross-tenant denial, cross-site denial, semantic ID reuse across tenants, idempotency isolation, and a test-only API access-context harness.
- Add `packages/contracts/prisma/rls-core-schedule.sql` for `Tenant`, `Site`, `User`, `Patient`, `Appointment`, `Note`, and `IdempotencyRecord`.
- Add `pnpm persistence:tenant-isolation` and run it in CI.
- Update status, run-log, persistence, backend, data model, and test-plan docs.

## Out Of Scope

- Production database migration execution.
- Production PHI persistence.
- RLS on tables outside the current persisted schedule/note slice.
- Broad API runtime conversion from in-memory state to Prisma.
- Live AI, live EHR writeback, production storage delivery, analytics, charge finalization, claim submission, or medical-necessity determination.

## Acceptance Evidence

- `pnpm persistence:tenant-isolation` starts local synthetic PostgreSQL, applies generated Prisma SQL, seeds two tenants, verifies repository/API tenant-site denial, applies core RLS, verifies tenant-session read behavior, and verifies denied cross-tenant or missing-session writes.
- `pnpm persistence:prisma-schedule-adapter` continues to pass.
- `pnpm acceptance:readiness` includes the tenant-isolation verifier, RLS SQL artifact, and integration test file.

## Status

Done when local gates and CI pass for the WO-031 PR.

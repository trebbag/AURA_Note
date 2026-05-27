# WO-029 — Local PostgreSQL Migration Apply And Rollback Evidence

## Objective

Prove the Prisma schema can apply and roll back against the local synthetic PostgreSQL target created in `WO-028`.

## Source of truth

- `AGENTS.md`
- `docs/BACKEND_BUILD_SPEC.md`
- `docs/PERSISTENCE_FOUNDATION.md`
- `docs/DATA_MODEL.md`
- `docs/POST_CP4_PRODUCTIONIZATION_BACKLOG.md`
- `docker-compose.yml`
- `packages/contracts/prisma/schema.prisma`

## Scope

- Add `scripts/verify-local-postgres-migration.js`.
- Add `pnpm persistence:local-db:migrate-evidence`.
- Generate forward SQL from empty to the Prisma datamodel and execute it against the local synthetic PostgreSQL container.
- Verify the applied local database has no schema drift against the Prisma datamodel.
- Generate rollback SQL from the Prisma datamodel to empty and execute it against the same local PostgreSQL container.
- Verify the rolled-back local database has no schema drift against empty.
- Run the verifier in CI after the existing persistence readiness checks.
- Update persistence docs, test plan, backlog, work-order index, run log, and status.

## Out of scope

- Replacing the in-memory runtime adapter.
- Prisma Client runtime usage.
- Production database migration apply/rollback.
- Row-level security policy implementation.
- Tenant-scoped live query tests.
- Transaction and error-path repository tests.
- Storing production PHI or production clinical data.
- Adding `.env`, production connection strings, credentials, private keys, or PHI-bearing seeds.
- Enabling live AI, EHR writeback, ClinicOS sync, storage delivery, retention deletion, analytics export, audit export delivery, charge finalization, medical-necessity determination, or claim submission.

## Acceptance criteria

- `pnpm persistence:local-db:migrate-evidence` starts the local synthetic PostgreSQL service, applies generated SQL, verifies no drift, rolls back, verifies empty rollback state, and tears down the synthetic volume.
- The verifier refuses non-synthetic database configuration.
- Existing persistence, acceptance, browser, test, and build gates continue to pass.
- CI runs the local PostgreSQL migration evidence command.
- `repo_status.json` marks `WO-029` done only after local gate evidence supports it.

## Status

Done when merged through a passing PR.

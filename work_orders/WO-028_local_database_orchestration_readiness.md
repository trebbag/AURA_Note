# WO-028 — Local Database Orchestration Readiness

## Objective

Add a local PostgreSQL orchestration contract and verifier so later persistence work can run migration apply/rollback and repository-adapter tests against a known local database target.

## Source of truth

- `AGENTS.md`
- `docs/BACKEND_BUILD_SPEC.md`
- `docs/PERSISTENCE_FOUNDATION.md`
- `docs/DATA_MODEL.md`
- `docs/POST_CP4_PRODUCTIONIZATION_BACKLOG.md`
- `package.json`
- `packages/contracts/prisma/schema.prisma`

## Scope

- Add `docker-compose.yml` for a local PostgreSQL service using the existing synthetic `DATABASE_URL` shape.
- Add `scripts/validate-local-database-readiness.js`.
- Add `pnpm persistence:local-db-readiness`.
- Update acceptance readiness so `WO-028` is included in the completed work-order evidence.
- Update persistence docs, test plan, run log, backlog, work-order index, and status.

## Out of scope

- Starting Docker or requiring Docker in CI.
- Applying migrations to a live database.
- Running rollback against a live database.
- Generating or using Prisma Client at runtime.
- Replacing the in-memory runtime adapter.
- Enabling row-level security policies.
- Running tenant-scoped live query tests.
- Storing production PHI or production clinical data.
- Adding `.env`, credentials, production connection strings, private keys, or PHI-bearing seeds.
- Enabling live AI, EHR writeback, ClinicOS sync, storage delivery, retention deletion, analytics export, audit export delivery, charge finalization, medical-necessity determination, or claim submission.

## Acceptance criteria

- `docker-compose.yml` defines a local PostgreSQL service with synthetic database, user, password, port, volume, and healthcheck.
- `.env.example`, Prisma schema, package scripts, and compose contract agree on the local PostgreSQL target.
- `pnpm persistence:local-db-readiness` passes without touching a live database.
- Existing persistence, acceptance, browser, test, and build gates continue to pass.
- `repo_status.json` marks `WO-028` done only after local gate evidence supports it.

## Status

Done when merged through a passing PR.

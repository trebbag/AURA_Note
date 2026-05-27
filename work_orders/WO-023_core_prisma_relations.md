# WO-023 — Core Prisma Relationship Readiness

## Status

Done.

## Objective

Add schema-level relationship evidence for the core schedule and note persistence path before any runtime Prisma adapter is enabled.

## Scope

- Add Prisma relation fields for the core `Tenant`, `Site`, `User`, `Patient`, `Appointment`, and `Note` graph.
- Preserve the one appointment to one note uniqueness invariant.
- Extend migration SQL readiness checks so generated SQL must include core foreign-key constraints.
- Keep runtime repositories on the in-memory synthetic adapter.
- Keep all persistence validation SQL-generation-only with no live database connection.

## Out of scope

- Full 35-model relation graph completion.
- Prisma Client runtime usage.
- Connecting to PostgreSQL.
- Applying migrations to a live database.
- Row-level security policy implementation.
- Production PHI persistence.
- Full Prisma-backed repository replacement.
- Production identity, EHR, ClinicOS, AI, analytics, audit export delivery, storage deletion, charge submission, or claim submission.

## Acceptance criteria

- `pnpm db:schema:validate` passes.
- `pnpm persistence:foundation` passes.
- `pnpm persistence:runtime-readiness` verifies generated forward SQL includes core foreign-key constraints.
- Existing persistence adapter projection tests still pass.
- Full repository gate and GitHub Actions pass before merge.
- Documentation clearly states this is core schema relationship readiness, not live database persistence.

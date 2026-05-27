# WO-015 — Persistence Migration Foundation

## Objective

Establish the first post-CP4 durable persistence foundation for AURA Note without replacing runtime repositories or enabling production data paths.

## Scope

Create a PostgreSQL/Prisma schema foundation, validation commands, environment contract, and documentation for the core AURA Note v1 entities. This work order is a migration foundation only. It does not connect the API to a live database, does not store production PHI, and does not change clinical workflow behavior.

## Source traceability

- `AGENTS.md` section 12 requires a TypeScript-first modular monorepo with contracts, domain, security, API, web, worker, adapter, and testing packages.
- `docs/BACKEND_BUILD_SPEC.md` recommends PostgreSQL with row-level security where practical and Prisma or equivalent schema/migration tooling.
- `docs/DATA_MODEL.md` defines the core entities and invariants that must be represented.
- `docs/POST_CP4_PRODUCTIONIZATION_BACKLOG.md` defines P5-01 Durable Persistence And Migration Foundation.

## Implementation requirements

- Expand the existing Prisma schema seed under `packages/contracts/prisma/schema.prisma`.
- Represent core entities needed for:
  - tenants, sites, users, roles, patients, and patient linkage;
  - appointments and one-to-one note shells;
  - visit sessions, recording assets, transcripts, and transcript segments;
  - chart context snapshots;
  - suggestions, Visit Selections, Compliance issues, History Gap questions, and tasks;
  - finalization runs, step decisions, enhanced note versions, patient summary versions, billing attestations, and draft claim previews;
  - export artifacts and EHR writeback jobs;
  - templates and dot phrases;
  - coaching reports;
  - audit events, domain events, integration connections, mode mappings, feature flags, and support status snapshots.
- Add root commands for schema validation and migration SQL diff generation without requiring committed secrets.
- Add a persistence-foundation validator that checks the schema/environment contract.
- Keep `.env.example` synthetic and do not commit `.env` or real connection strings.
- Update docs, run log, and status metadata for `WO-015`.

## Out of scope

- Replacing process-local repositories with Prisma-backed runtime repositories.
- Applying migrations to a live database in CI.
- Adding production database credentials, secrets, or `.env` files.
- Enabling live EHR, ClinicOS, AI, analytics, storage, audit export delivery, or retention deletion.
- Storing real PHI or production clinical content.
- Changing user-facing clinical workflows.

## Acceptance criteria

- `pnpm db:schema:validate` passes.
- `pnpm db:migration:diff` generates PostgreSQL SQL from the schema without requiring a live database connection.
- `pnpm persistence:foundation` passes.
- Existing CP-4 readiness remains green.
- `repo_status.json` records `WO-015` completion only if the above evidence passes.
- `RUN_LOG.md` records files changed, tests run, out-of-scope behavior, accepted risks, and next step.

## Definition of done

- Meets this work order's acceptance criteria.
- Meets the global definition of done in `AGENTS.md` for the scoped persistence foundation.
- Updates relevant docs and tests.
- Updates `repo_status.json` and `RUN_LOG.md`.
- Adds `SPEC_GAPS.md` entries for unresolved blockers.

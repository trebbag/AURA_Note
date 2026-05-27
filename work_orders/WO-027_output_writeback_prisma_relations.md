# WO-027 — Output and Writeback Prisma Relationship Readiness

## Objective

Extend post-CP4 persistence schema relationship evidence into signed output artifact and EHR writeback queue records without enabling live database writes, production storage, or live EHR writeback.

## Source of truth

- `AGENTS.md`
- `docs/BACKEND_BUILD_SPEC.md`
- `docs/DATA_MODEL.md`
- `docs/API_EVENT_CONTRACTS.md`
- `docs/PERSISTENCE_FOUNDATION.md`
- `work_orders/WO-008_exports_pdf_copy_final_note_viewer.md`
- `packages/contracts/prisma/schema.prisma`
- `scripts/validate-persistence-runtime-readiness.js`

## Scope

- Add Prisma relation fields for:
  - `ExportArtifact` to `Tenant`, `Site`, `Note`, and optional generating `User`;
  - `EhrWritebackJob` to `Tenant`, `Site`, and `Note`.
- Add inverse relation fields where needed on `Tenant`, `Site`, `Note`, and `User`.
- Extend migration SQL-generation readiness checks for the generated foreign-key fragments.
- Keep runtime behavior on the existing in-memory synthetic adapter.

## Out of scope

- Prisma Client runtime usage.
- Applying migrations to a local, shared, staging, or production database.
- Local PostgreSQL orchestration.
- Row-level security policies.
- Transaction behavior and error-path coverage.
- Production PHI persistence.
- Production object storage or PDF delivery.
- Live EHR writeback, live EHR credentials, ClinicOS live sync, live AI, analytics export, audit export delivery, storage deletion, charge finalization, medical-necessity determination, or claim submission.

## Acceptance criteria

- `pnpm db:schema:validate` passes.
- `pnpm persistence:foundation` passes.
- `pnpm persistence:runtime-readiness` verifies generated forward SQL includes output and writeback foreign keys.
- `pnpm persistence:adapter-readiness` continues to pass with Prisma runtime mode disabled.
- `pnpm acceptance:readiness` includes `WO-027` as done.
- Full local gate passes before PR merge.

## Status

Done as schema and SQL-generation readiness only.

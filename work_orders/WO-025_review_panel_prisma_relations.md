# WO-025 — Review Panel Prisma Relationship Readiness

## Objective

Extend post-CP4 persistence schema relationship evidence into the WO-005 review-panel graph without enabling live database writes or changing clinical workflow behavior.

## Source of truth

- `AGENTS.md`
- `docs/BACKEND_BUILD_SPEC.md`
- `docs/DATA_MODEL.md`
- `docs/API_EVENT_CONTRACTS.md`
- `docs/PERSISTENCE_FOUNDATION.md`
- `work_orders/WO-005_suggestions_visit_selections_compliance_history_gap.md`
- `packages/contracts/prisma/schema.prisma`
- `scripts/validate-persistence-runtime-readiness.js`

## Scope

- Add Prisma relation fields for:
  - `Suggestion` to `Tenant`, `Site`, `Note`, and source-linked `VisitSelection` rows;
  - `VisitSelection` to `Tenant`, `Site`, `Note`, and optional source `Suggestion`;
  - `ComplianceIssue` to `Tenant`, `Site`, and `Note`;
  - `HistoryGapQuestion` to `Tenant`, `Site`, `Note`, and optional linked blocker `Task`;
  - `Task` to `Tenant`, `Site`, optional `Note`, optional `Patient`, optional owner `User`, and linked History Gap questions.
- Add inverse relation fields where needed on `Tenant`, `Site`, `Note`, `Patient`, and `User`.
- Extend migration SQL-generation readiness checks for the generated foreign-key fragments.
- Keep runtime behavior on the existing in-memory synthetic adapter.

## Out of scope

- Prisma Client runtime usage.
- Applying migrations to a local, shared, staging, or production database.
- Local PostgreSQL orchestration.
- Row-level security policies.
- Transaction behavior and error-path coverage.
- Production PHI persistence.
- Autonomous suggestion, diagnosis, coding, billing, medical-necessity, charge, or claim finalization.
- External AI, EHR writeback, ClinicOS live sync, analytics export, audit export delivery, storage deletion, or claim submission.

## Acceptance criteria

- `pnpm db:schema:validate` passes.
- `pnpm persistence:foundation` passes.
- `pnpm persistence:runtime-readiness` verifies generated forward SQL includes review-panel foreign keys.
- `pnpm persistence:adapter-readiness` continues to pass with Prisma runtime mode disabled.
- `pnpm acceptance:readiness` includes `WO-025` as done.
- Full local gate passes before PR merge.

## Status

Done as schema and SQL-generation readiness only.

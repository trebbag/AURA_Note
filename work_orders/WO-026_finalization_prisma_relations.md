# WO-026 — Finalization Prisma Relationship Readiness

## Objective

Extend post-CP4 persistence schema relationship evidence into the finalization wizard and draft claim preview graph without enabling live database writes or changing finalization behavior.

## Source of truth

- `AGENTS.md`
- `docs/BACKEND_BUILD_SPEC.md`
- `docs/DATA_MODEL.md`
- `docs/API_EVENT_CONTRACTS.md`
- `docs/PERSISTENCE_FOUNDATION.md`
- `work_orders/WO-006_finalization_wizard_steps_1_through_4.md`
- `work_orders/WO-007_billing_attest_draft_claim_sign_dispatch.md`
- `packages/contracts/prisma/schema.prisma`
- `scripts/validate-persistence-runtime-readiness.js`

## Scope

- Add Prisma relation fields for:
  - `FinalizationRun` to `Tenant`, `Site`, `Note`, wizard decisions, enhanced note versions, patient summary versions, billing attestations, and draft claim previews;
  - `WizardStepDecision` to `Tenant`, `Site`, `FinalizationRun`, `Note`, and optional actor `User`;
  - `EnhancedNoteVersion` to `Tenant`, `Site`, `Note`, `FinalizationRun`, and optional approving `User`;
  - `PatientSummaryVersion` to `Tenant`, `Site`, `Note`, `FinalizationRun`, and optional approving `User`;
  - `BillingAttestation` to `Tenant`, `Site`, `Note`, `FinalizationRun`, and optional attesting `User`;
  - `DraftClaimPreview` to `Tenant`, `Site`, `Note`, `FinalizationRun`, and optional generating `User`.
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
- Autonomous diagnosis, coding, billing, medical-necessity, charge, or claim finalization.
- Live claim submission, live EHR writeback, live AI, ClinicOS live sync, analytics export, audit export delivery, or storage deletion.

## Acceptance criteria

- `pnpm db:schema:validate` passes.
- `pnpm persistence:foundation` passes.
- `pnpm persistence:runtime-readiness` verifies generated forward SQL includes finalization foreign keys.
- `pnpm persistence:adapter-readiness` continues to pass with Prisma runtime mode disabled.
- `pnpm acceptance:readiness` includes `WO-026` as done.
- Full local gate passes before PR merge.

## Status

Done as schema and SQL-generation readiness only.

# WO-021 — Prisma Adapter Scaffold

## Source trace

- `AGENTS.md` source-of-truth, no-liberty, and safety rules.
- `docs/PERSISTENCE_FOUNDATION.md` WO-020 runtime readiness update.
- `docs/BACKEND_BUILD_SPEC.md` persistence and adapter boundary requirements.
- `docs/DATA_MODEL.md` WO-020 persistence runtime readiness status.
- `docs/POST_CP4_PRODUCTIONIZATION_BACKLOG.md` P6 persistence follow-on risks.

## Objective

Add a disabled Prisma adapter scaffold that proves schedule/note DTOs can be mapped into persistence-safe row shapes while preserving the in-memory runtime default. This work order prepares for a later database-backed repository adapter without connecting to a database or storing PHI.

## In scope

- Add a `packages/persistence` package.
- Define persistence adapter readiness planning for `in_memory` and future `prisma` modes.
- Map appointment/note DTOs into deterministic synthetic Prisma row projections.
- Reject mismatched appointment-note mappings and forbidden PHI key material before projection.
- Add package tests, workspace path wiring, CI coverage, and documentation.

## Out of scope

- Prisma Client runtime usage or generation.
- Database connections, migrations applied to a live database, row-level security, backup/restore, or production credential handling.
- Replacing the API runtime repository with a Prisma-backed adapter.
- Storing real PHI, production clinical data, production identifiers, or PHI-bearing seed data.
- New API routes, UI behavior, clinical workflow, EHR/ClinicOS/AI integrations, audit export delivery, storage deletion, or claim submission.

## Acceptance criteria

- `@aura-note/persistence` tests prove the in-memory adapter remains enabled and Prisma remains disabled until later evidence exists.
- Projection tests prove appointment/note one-to-one matching and PHI-key rejection.
- `pnpm persistence:adapter-readiness` runs locally and in CI.
- Full local gate passes before PR.
- `RUN_LOG.md` and `repo_status.json` are updated only after test evidence supports completion.

## Required checks

- `pnpm --filter @aura-note/persistence test`
- `pnpm --filter @aura-note/persistence typecheck`
- `pnpm persistence:adapter-readiness`
- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm lint:phi`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm test:browser`
- `pnpm build`
- `pnpm acceptance:readiness`
- `pnpm persistence:foundation`
- `pnpm persistence:runtime-readiness`
- `node scripts/status.js`
- `git diff --check`

## Definition of done

- The Prisma adapter scaffold is package-tested and CI-tested.
- The runtime default remains in-memory.
- No production persistence claim is made.

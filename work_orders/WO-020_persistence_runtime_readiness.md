# WO-020 — Persistence Runtime Readiness

## Source trace

- `AGENTS.md` post-CP4 autonomy and safety rules.
- `docs/PERSISTENCE_FOUNDATION.md` next persistence tranche.
- `docs/BACKEND_BUILD_SPEC.md` persistence deferral notes.
- `docs/DATA_MODEL.md` persistence foundation status.
- `docs/POST_CP4_PRODUCTIONIZATION_BACKLOG.md` P5-01 deferred runtime repository replacement.

## Objective

Introduce the first runtime persistence seam without enabling production database storage. The schedule/note runtime state must use an explicit repository port with the current in-memory adapter as the default, and the repo must produce deterministic Prisma forward/rollback SQL evidence for local review.

## In scope

- Extract schedule/note process-local state into a named repository interface and in-memory adapter.
- Preserve appointment-to-note one-to-one lookup and idempotency replay invariants in repository tests.
- Add a local migration readiness verifier that validates the Prisma schema and generates forward plus rollback SQL from the datamodel.
- Add CI coverage for the migration readiness verifier.
- Update persistence, backend, data-model, test-plan, run-log, and repo-status evidence.

## Out of scope

- Connecting the API, worker, or web app to a live database.
- Applying migrations to a production, staging, shared, or PHI-bearing database.
- Committing `.env`, secrets, credentials, production connection strings, private keys, or PHI-bearing seed data.
- Enabling row-level security policies.
- Replacing all process-local repositories with Prisma-backed adapters.
- Live AI, EHR, ClinicOS, analytics, audit export delivery, storage deletion, or claim submission.

## Acceptance criteria

- Existing schedule, workspace, finalization, export, coaching, support, browser, acceptance, and persistence gates still pass.
- Schedule repository unit tests prove one appointment maps to one note and idempotency keys cannot be remapped.
- `pnpm persistence:runtime-readiness` validates the Prisma schema, generates forward SQL, generates rollback SQL, and checks key CP-4 tables plus the `Note.appointmentId` unique index.
- `RUN_LOG.md` records commands run, files changed, out-of-scope behavior, accepted risks, and next step.
- `repo_status.json` marks `WO-020` done only after local checks and GitHub Actions pass.

## Required checks

- `pnpm --filter @aura-note/api test`
- `pnpm --filter @aura-note/api typecheck`
- `pnpm persistence:runtime-readiness`
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
- `node scripts/status.js`
- `git diff --check`

## Definition of done

- The repository seam is committed and covered by tests.
- Migration SQL generation evidence is committed as a repeatable verifier, not as environment-specific SQL output.
- CI runs the runtime readiness verifier.
- No production persistence claim is made.

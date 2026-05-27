# Test Plan

Codex should add tests as implementation proceeds.

## Unit tests

- Domain invariants.
- Note state machine.
- Appointment-note one-to-one invariant.
- Timer/editor gating.
- Low-confidence diagnosis override.
- Task blocker logic.
- Finalization wizard step requirements.
- Signed-output artifact readiness.
- EHR writeback queue readiness states.
- Coaching own-report and aggregate dashboard privacy.
- Support status and audit export permission boundaries.
- RBAC/ABAC decisions.
- PHI scrubber.
- Structured log redaction.
- Feature flag defaults for external integrations.
- AI response validation.
- Raw audio retention job.
- Transcript indefinite retention job.
- Audit export metadata generation.

## Integration tests

- Create appointment creates note shell.
- Start Visit activates timer/editor/recording/transcription.
- Suggestions evaluation updates Suggestions panel and Visit Selections.
- History Gap question routes to MA task.
- Open blocker task blocks signing.
- Finalization steps complete in order.
- Billing review triggers transcript access for billing staff.
- Sign & Dispatch creates final note/patient summary/export artifacts.
- EHR writeback queue behaves correctly in mock mode.
- Export/copy/PDF actions are blocked before signing.
- Patient summary exports reject internal billing/revenue details.
- Coaching own report denies billing staff and keeps patient-facing exclusions.
- Coaching aggregate dashboard hides clinician identifiers unless full-admin mode is explicitly authorized.
- Support status denies ordinary clinicians and exposes feature flags/retention posture to support users.
- Audit export request is compliance/admin-only, redacted, metadata-only, and excludes PHI.

## Browser / Playwright journeys

1. Standalone appointment to final dispatch.
2. Recording exception path.
3. Low-confidence diagnosis override.
4. MA follow-up blocker prevents signing until adjudicated.
5. Billing review triggers transcript access for billing staff.
6. Final note viewer is read-only after dispatch.
7. Patient summary PDF download flow.
8. Copy/export/writeback failure states remain visible in Finalized Notes.
9. Admin template and dot phrase creation.
10. Coaching own-scorecard visibility.
11. ClinicOS mode mock context loads without changing core UX.
12. Support hardening status route shows feature flags, retention posture, audit export posture, and failure states.
13. CP-4 route sweep renders Schedule, Draft Notes, Workspace, Finalization, Finalized Notes, Coaching, and Support hardening routes with synthetic data.

## Security tests

- Cross-tenant access denied.
- Unlinked staff final-note access denied.
- Billing transcript access denied unless billing review triggered.
- External AI rejects raw PHI fields.
- Logs redact forbidden keys.
- Support status does not grant audit export.
- External integration feature flags default to disabled.

## CP-4 acceptance readiness

`WO-014` adds `pnpm acceptance:readiness`, backed by `scripts/acceptance-readiness.js`. The validator checks:

- all defined work orders are marked `done` in `repo_status.json`;
- there are no active `SPEC_GAP` entries;
- browser route files exist for the implemented clinical, finalization, coaching, and support shells;
- API e2e files cover standalone, ClinicOS mock, AI PHI boundary, EHR scaffold, coaching, support, and finalization/export journeys;
- package-level unit tests exist for domain, contracts, security, AI gateway, EHR adapter, ClinicOS adapter, worker, and fixtures;
- OpenAPI paths and audit/event names exist for CP-1 through CP-4 behaviors;
- `CHECKPOINT_REPORT.md`, `RUN_LOG.md`, and `docs/CP4_ACCEPTANCE_READINESS.md` contain the CP-4 evidence needed for review.

## Post-CP4 persistence foundation

`WO-015` adds schema/tooling checks for the first durable persistence foundation:

- `pnpm db:schema:validate` validates the PostgreSQL Prisma schema using a synthetic local `DATABASE_URL` value;
- `pnpm db:migration:diff` generates PostgreSQL SQL from the Prisma datamodel without connecting to a live database;
- `pnpm persistence:foundation` runs schema validation plus `scripts/validate-persistence-foundation.js`;
- runtime repository replacement and database-backed e2e tests are deferred to a later numbered work order.

## Post-CP4 tenant identity and access foundation

`WO-016` adds local synthetic identity/access checks:

- `pnpm --filter @aura-note/security test` covers local synthetic session creation, cross-tenant denial, delegated-provider denial, and tenant-scoped resource authorization;
- `pnpm --filter @aura-note/contracts test` covers `LocalAuthSession` and `TenantScopeDecision` contract seeds;
- `pnpm --filter @aura-note/api test` covers cross-tenant denial for schedule, AI Gateway, EHR adapter, coaching, and support service paths, plus disabled delegated identity mode for ClinicOS;
- `pnpm --filter @aura-note/api test:e2e` covers cross-tenant schedule denial through the HTTP boundary;
- production SSO/MFA/provider tests are deferred because production identity integration is intentionally out of scope.

## Post-CP4 browser E2E and accessibility foundation

`WO-017` adds committed Playwright route and accessibility-oriented checks:

- `pnpm test:browser` runs the root Chromium browser suite;
- `pnpm --filter @aura-note/web test:e2e` runs the same suite through the web package and Turbo;
- CI installs Chromium before running `pnpm test:browser`;
- route checks cover Status, Schedule, Draft Notes, Documentation Workspace, Finalization, Finalized Notes, finalized viewer, Coaching, and Support hardening;
- semantic checks cover main landmarks, H1 headings, section navigation, accessible form labels, accessible button names, named regions, blocked/disabled workspace states, read-only finalized-note tabs, coaching permission states, and support degraded-mode states;
- visual regression and screenshot baselines remain deferred until design-system work lands.

## Post-CP4 observability and deployment runbook foundation

`WO-018` adds local-first operational readiness checks:

- `packages/security/src/index.test.ts` covers PHI-safe metric and trace probes plus disabled production sink status;
- `apps/api/src/support/support.service.test.ts` covers support status observability sinks, deployment matrix, and runbook index evidence;
- `apps/api/src/support/support.e2e.test.ts` covers the expanded `GET /api/v1/support/status` contract through HTTP;
- `pnpm test:browser` checks that the support route exposes observability, deployment, and runbook states;
- production observability vendors, deployment automation, audit export download delivery, destructive retention purge, and live external integrations remain deferred.

## Post-CP4 design system and review package foundation

`WO-019` adds UI and browser hardening checks:

- `pnpm --filter @aura-note/ui test` covers design tokens and review-surface copy boundaries;
- `pnpm test:browser` includes mobile overflow coverage for Schedule, Documentation Workspace, and finalized-note viewer shells;
- compliance/security/privacy review evidence lives in `docs/COMPLIANCE_SECURITY_PRIVACY_REVIEW_PACKAGE.md`;
- UX copy review evidence lives in `docs/UX_COPY_REVIEW.md`;
- final Figma fidelity, visual regression baselines, compliance certification, and production launch approval remain deferred.

## Post-CP4 persistence runtime readiness

`WO-020` adds repository-seam and migration SQL evidence checks:

- `apps/api/src/schedule/schedule.repository.test.ts` covers appointment-to-note lookup in both directions, duplicate note remapping rejection, and idempotency-key remapping rejection;
- existing schedule service and API e2e tests continue to exercise runtime behavior through the in-memory repository adapter;
- `pnpm persistence:runtime-readiness` validates the Prisma schema and checks generated forward plus rollback SQL for key tables, tenant/site indexes, and the `Note.appointmentId` unique index;
- live database apply/rollback, row-level security tests, PHI-bearing persistence, and full Prisma-backed adapter replacement remain deferred.

## Post-CP4 Prisma adapter scaffold

`WO-021` adds disabled adapter and mapping checks:

- `pnpm --filter @aura-note/persistence test` covers in-memory/default adapter planning, disabled Prisma mode, production PHI persistence blocking, appointment/note projection, one-to-one mismatch rejection, and forbidden PHI key rejection;
- `pnpm persistence:adapter-readiness` runs persistence package tests plus typecheck locally and in CI;
- database-backed repository integration tests remain deferred until a later work order introduces local database orchestration.

## Post-CP4 persistence UUID projection readiness

`WO-022` extends the persistence adapter scaffold checks:

- `pnpm --filter @aura-note/persistence test` proves projected `@db.Uuid` row IDs and appointment/note reference fields are UUID-shaped;
- deterministic UUID tests prove the same synthetic natural key maps to the same projected ID and a different key maps to a different ID;
- projection tests verify appointment rows reference the projected patient UUID and note rows reference the projected appointment UUID;
- one-to-one mismatch rejection and forbidden PHI-key rejection continue to pass;
- runtime database writes, live PostgreSQL, row-level security, and full Prisma-backed repository tests remain deferred.

## Post-CP4 core Prisma relationship readiness

`WO-023` extends schema SQL-generation checks:

- `pnpm db:schema:validate` proves the Prisma relation fields are valid;
- `pnpm persistence:foundation` continues to verify the schema foundation;
- `pnpm persistence:runtime-readiness` now checks generated forward SQL includes core foreign-key constraints for Site, Patient, Appointment, and Note relationships;
- full runtime database tests, row-level security tests, transaction tests, and complete 35-model relation coverage remain deferred.

## Post-CP4 visit, recording, and transcript Prisma relationship readiness

`WO-024` extends schema SQL-generation checks:

- `pnpm db:schema:validate` proves the visit, recording, transcript, and transcript-segment Prisma relation fields are valid;
- `pnpm persistence:foundation` continues to verify the schema foundation;
- `pnpm persistence:runtime-readiness` now checks generated forward SQL includes foreign-key constraints for `VisitSession`, `RecordingAsset`, `Transcript`, and `TranscriptSegment` relationships;
- `pnpm persistence:adapter-readiness` confirms the runtime adapter remains disabled for Prisma writes;
- full runtime database tests, row-level security tests, transaction tests, retention deletion against durable storage, and complete 35-model relation coverage remain deferred.

## Post-CP4 review panel Prisma relationship readiness

`WO-025` extends schema SQL-generation checks:

- `pnpm db:schema:validate` proves the suggestion, Visit Selection, compliance issue, History Gap question, and task Prisma relation fields are valid;
- `pnpm persistence:foundation` continues to verify the schema foundation;
- `pnpm persistence:runtime-readiness` now checks generated forward SQL includes foreign-key constraints for `Suggestion`, `VisitSelection`, `ComplianceIssue`, `HistoryGapQuestion`, and `Task` relationships;
- `pnpm persistence:adapter-readiness` confirms the runtime adapter remains disabled for Prisma writes;
- full runtime database tests, row-level security tests, transaction tests, tenant-scoped query tests, and complete 35-model relation coverage remain deferred.

## Post-CP4 finalization Prisma relationship readiness

`WO-026` extends schema SQL-generation checks:

- `pnpm db:schema:validate` proves the finalization run, wizard decision, enhanced note version, patient summary version, billing attestation, and draft claim preview Prisma relation fields are valid;
- `pnpm persistence:foundation` continues to verify the schema foundation;
- `pnpm persistence:runtime-readiness` now checks generated forward SQL includes foreign-key constraints for finalization relationships;
- `pnpm persistence:adapter-readiness` confirms the runtime adapter remains disabled for Prisma writes;
- full runtime database tests, row-level security tests, transaction tests, tenant-scoped query tests, claim-submission tests, and complete 35-model relation coverage remain deferred.

## Post-CP4 output and writeback Prisma relationship readiness

`WO-027` extends schema SQL-generation checks:

- `pnpm db:schema:validate` proves the export artifact and EHR writeback job Prisma relation fields are valid;
- `pnpm persistence:foundation` continues to verify the schema foundation;
- `pnpm persistence:runtime-readiness` now checks generated forward SQL includes foreign-key constraints for output and writeback relationships;
- `pnpm persistence:adapter-readiness` confirms the runtime adapter remains disabled for Prisma writes;
- full runtime database tests, row-level security tests, transaction tests, tenant-scoped query tests, production storage/PDF delivery tests, live EHR writeback tests, and complete 35-model relation coverage remain deferred.

## Post-CP4 local database orchestration readiness

`WO-028` adds static local database orchestration checks:

- `pnpm persistence:local-db-readiness` validates `docker-compose.yml`, `.env.example`, `package.json`, and the Prisma provider without starting Docker or touching a live database;
- CI runs `pnpm persistence:local-db-readiness` after the existing persistence gates;
- existing full gate commands continue to cover lint, PHI lint, typecheck, unit tests, browser tests, build, acceptance readiness, Prisma schema validation, runtime-readiness SQL generation, and adapter-readiness tests;
- live migration apply/rollback tests, row-level security tests, transaction tests, tenant-scoped query tests, and full Prisma-backed runtime repository tests remain deferred.

## Post-CP4 local PostgreSQL migration apply and rollback evidence

`WO-029` adds live local schema checks:

- `pnpm persistence:local-db:migrate-evidence` starts the local synthetic PostgreSQL service, applies generated Prisma forward SQL, verifies no drift against the datamodel, applies generated rollback SQL, verifies empty database state, and tears down the synthetic volume;
- CI runs `pnpm persistence:local-db:migrate-evidence` after static local DB readiness;
- runtime repository behavior still uses the in-memory adapter;
- Prisma Client runtime tests, row-level security tests, tenant-scoped live query tests, transaction/error-path tests, and full database-backed workflow tests remain deferred.

## Post-CP4 Prisma schedule runtime adapter

`WO-030` adds the first local PostgreSQL-backed runtime adapter test:

- `pnpm db:client:generate` generates Prisma Client from `packages/contracts/prisma/schema.prisma`;
- `pnpm persistence:prisma-schedule-adapter` runs `apps/api/src/schedule/prisma-schedule.repository.integration.test.ts`;
- the integration test starts the synthetic local PostgreSQL compose service, applies generated Prisma SQL, persists appointment and note shell state, reloads by appointment and note IDs, verifies tenant-scoped idempotency replay, rejects appointment-to-note remaps, and tears down the synthetic volume;
- CI runs the adapter test after local DB readiness and migration apply/rollback evidence.

Broad workflow database tests, row-level security tests, production migration tests, and PHI-bearing persistence tests remain deferred.

## Post-CP4 tenant isolation and core RLS evidence

`WO-031` adds `pnpm persistence:tenant-isolation`:

- generates Prisma Client and starts the synthetic local PostgreSQL service;
- applies generated Prisma SQL to a fresh local database;
- runs `apps/api/src/schedule/prisma-schedule.tenant-isolation.integration.test.ts`;
- verifies same semantic appointment/note/idempotency keys can be persisted independently for two synthetic tenants;
- verifies tenant-scoped appointment lookup, note lookup, list, and idempotency replay do not expose another tenant's records;
- verifies site-scoped repository/API harness access denies another site inside the same tenant;
- applies `packages/contracts/prisma/rls-core-schedule.sql`;
- verifies RLS tenant-session reads, missing-session denial, cross-tenant insert denial, cross-tenant update denial, and missing-session idempotency write denial.

CI runs the tenant-isolation evidence after the existing local PostgreSQL migration and Prisma schedule adapter gates. Broader workflow RLS and production PHI-bearing persistence tests remain deferred until those repository slices become durable.

## Post-CP4 Azure storage and retention deletion readiness

`WO-032` adds storage and retention gates:

- `pnpm storage:azure-adapter-readiness` runs `@aura-note/storage` unit tests, storage package typecheck, and a static verifier for Azure config names and no-live-Azure posture;
- `pnpm retention:storage-deletion-readiness` runs worker tests and verifies approval-gated raw-audio object deletion readiness;
- API unit tests verify storage-backed final-note and patient-summary export metadata, patient-summary internal-detail exclusion, and storage-backed audit export metadata;
- storage unit tests verify in-memory object writes, signed-token creation, wrong-tenant denial, expiry denial, and delete evidence;
- worker tests verify destructive raw-audio deletion requires approval controls and transcript purge count remains zero.

CI runs these after the persistence gates and before acceptance readiness. Production Azure credentials, production backup/restore execution, and PHI-bearing object payload tests remain deferred.

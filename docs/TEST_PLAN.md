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

## Frontend runtime integration launch gate

Before P10 launch-candidate readiness can be claimed, browser coverage must move beyond route-render scaffolds and prove production-intended screens are driven by typed API clients and persisted backend state:

- every production-intended route must be inventoried as API-backed, documented-mock-backed, Storybook/demo-only, or blocked;
- API-backed routes must use typed clients generated from or validated against `packages/contracts` and `packages/contracts/openapi/aura-note.v1.yaml`;
- synthetic local React state is allowed only for Storybook, fixture-only demo mode, unit/component tests, or explicitly documented mocks;
- each affected route must expose loading, empty, ready, saving, failed, permission-denied, and read-only states through API responses, persisted records, or documented mocks;
- state-changing browser actions must call backend operations that are tenant/site scoped, permission checked, audit/event emitting, and idempotent where duplicate submissions are plausible;
- `pnpm frontend:runtime-integration-readiness` or an equivalent named gate must fail if a production-intended route still relies on unapproved local-only React state;
- Playwright must exercise at least one seeded backend-backed workflow from appointment creation through documentation/finalization/export, including reload or refetch evidence proving the browser is reading persisted backend records rather than only in-page state.

This gate does not authorize live EHR writeback, live AI, live transcription, production PHI storage, charge finalization, medical-necessity determination, or claim submission.

`WO-048` implements the first synthetic/local version of this gate. `pnpm frontend:runtime-integration-readiness` verifies the route inventory, typed web API client, API-backed `/aura-note/runtime-integration` evidence route, Playwright backend workflow, CI wiring, and no-launch-claim posture. Playwright now starts the local API alongside Next.js and exercises a synthetic appointment from creation through visit start, finalization, sign/dispatch, final-note PDF export, finalized-note API refetch, and browser reload evidence. Existing production-intended scaffold routes remain documented mocks until later P10 work converts them to typed API runtime behavior or explicitly defers them for launch review.

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

## P7.5 standalone patient and schedule readiness

`WO-038` adds standalone patient, chart-context, and schedule completion checks:

- `apps/api/src/schedule/schedule.e2e.test.ts` covers standalone patient shell create/search/edit, billing-only denial, chart-context snapshot access, appointment edit, check-in, cancel, and no-show status transitions.
- `apps/web/e2e/aura-note-routes.spec.ts` covers the patient shell, chart freshness warning, day/week schedule views, and visible appointment status behavior on `/aura-note/schedule`.
- `packages/contracts/prisma/rls-core-schedule.sql` now applies core RLS to `PatientLinkage` and `ChartContextSnapshot`.
- `apps/api/src/schedule/prisma-schedule.tenant-isolation.integration.test.ts` verifies `ChartContextSnapshot` RLS read/write behavior with local synthetic PostgreSQL.
- `pnpm standalone:patient-schedule-readiness` checks that the WO-038 contracts, permissions, routes, browser shell, RLS artifact, and test hooks are present.

`WO-039` adds standalone operations completion checks:

- `pnpm --filter @aura-note/api test` includes operations service coverage for task/blocker adjudication, billing-review transcript restrictions, patient-facing estimate rejection, PHI-bearing template rejection, and rules-catalog human-review attestation;
- `pnpm --filter @aura-note/api test:e2e` includes standalone operations API coverage for worklists, role denial, billing transcript restrictions, support denial, settings/integration updates, template/dot phrase safety, estimate caveats, and rules catalog publication;
- `pnpm test:browser` covers `/aura-note/operations` and verifies task inbox, MA follow-up, billing review, settings, templates, estimates, rules catalog, state labels, and mobile overflow behavior;
- `pnpm standalone:operations-readiness` checks the WO-039 contracts, events, permissions, routes, browser shell, tests, and P7.5 checkpoint evidence.

P7.5 remains synthetic/local readiness. Production identity, live payer data, certified coding rules, live ClinicOS synchronization, production PHI storage, medical-necessity determination, charge finalization, and claim submission remain deferred.

The gate remains synthetic/local evidence only. It does not approve production PHI storage, live EHR patient matching, live ClinicOS synchronization, patient portal behavior, charge finalization, medical-necessity determination, or claim submission.

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

## WO-036 durable finalization/output runtime persistence

`WO-036` adds live local PostgreSQL adapter evidence:

- `pnpm persistence:finalization-output-adapter` generates Prisma Client, starts the synthetic PostgreSQL service through the integration test, applies generated schema SQL, and executes `apps/api/src/schedule/prisma-finalization-output.repository.integration.test.ts`;
- positive coverage proves persisted reload for finalization runs, wizard decisions, signed final note and patient summary records, billing attestations, draft claim previews, storage-backed export metadata, and EHR writeback failure metadata;
- negative coverage proves submitted claim payloads are rejected, signed final-note text cannot be mutated after approval/signature evidence exists, and wrong-tenant/wrong-site repository/API-harness reads return no DTO data before exposure;
- RLS coverage applies `packages/contracts/prisma/rls-finalization-output.sql` and proves tenant-scoped reads, missing tenant-session denial, cross-tenant insert denial, and cross-tenant update denial for the finalization/output slice.

This test evidence remains synthetic/local. It does not test live EHR writeback, live claim submission, clearinghouse/payer integration, production PHI database approval, production storage credentials, charge finalization, or medical-necessity determination.

## WO-037 durable runtime metadata and broad RLS persistence

`WO-037` adds live local PostgreSQL adapter evidence for the remaining P7 tenant-owned metadata:

- `pnpm persistence:durable-runtime-readiness` generates Prisma Client, starts the synthetic PostgreSQL service through the integration test, applies generated schema SQL, and executes `apps/api/src/schedule/prisma-runtime-metadata.repository.integration.test.ts`;
- positive coverage proves persisted reload for audit events, domain events, support status snapshots, feature flags, templates, dot phrases, coaching reports, integration connections, and mode mappings;
- negative coverage proves wrong-tenant/wrong-site repository/API-harness reads return no DTO data and support/audit/coaching/admin metadata access respects role permissions;
- broad RLS coverage applies `packages/contracts/prisma/rls-runtime-metadata.sql` and proves tenant-scoped reads, missing tenant-session denial, cross-tenant insert denial, and cross-tenant update denial for the remaining metadata slice.

This closes P7 as synthetic/local durable runtime evidence. It does not test production observability sinks, production database role approval, production PHI storage, live EHR/ClinicOS synchronization, live AI, live transcription, production analytics, charge finalization, or claim submission.

## WO-061 runtime persistence switchover evidence

`WO-061` adds the CR-1 core workflow runtime persistence gate:

- `pnpm --filter @aura-note/api test` covers explicit runtime persistence mode selection and verifies the existing schedule service still works through injected repository/storage ports;
- `pnpm runtime:persistence-readiness` generates Prisma Client, starts the synthetic PostgreSQL service through the integration test, applies generated schema SQL, and executes `apps/api/src/schedule/runtime-persistence.repository.integration.test.ts`;
- positive coverage persists a synthetic appointment/note, visit session, transcript segment, Visit Selections, finalization session, draft claim preview, export artifact metadata, writeback metadata, audit event, and domain event through the composed Prisma core workflow repository;
- restart/service-recreation coverage reloads the persisted synthetic workflow through fresh repository instances;
- negative coverage proves same semantic workflow IDs can exist across tenants while wrong-tenant and wrong-site repository/API-harness reads return no DTO data;
- `pnpm commercial:readiness-plan` now checks the `runtime:persistence-readiness` script, CI wiring, and run-log evidence when `WO-061` is marked done.

This remains synthetic/local runtime evidence. It does not test production database credentials, production PHI persistence, production migration operations, live vendors, live AI, live EHR/ClinicOS synchronization, charge finalization, medical-necessity determination, claim submission, or production launch.

## WO-062 API runtime hardening evidence

`WO-062` adds the CR-1 API runtime request-boundary gate:

- `pnpm --filter @aura-note/api test:runtime-hardening` executes `apps/api/src/runtime/runtime-boundary.e2e.test.ts`;
- runtime-boundary e2e coverage verifies request/trace correlation headers, security headers, missing-role fail-closed behavior, invalid-role rejection, cross-tenant denial, invalid JSON body shape rejection, forbidden PHI-like payload rejection, oversized body rejection, PHI-safe error envelopes, and redacted structured runtime logs;
- `pnpm --filter @aura-note/api test:e2e` now boots every API e2e suite through shared `configureAuraApi` wiring instead of ad hoc `setGlobalPrefix` setup;
- AI Gateway e2e coverage verifies governed mock invocation still owns explicit PHI reject/redact behavior and preserves `ai.phi_rejected.v1` evidence while the general API boundary rejects PHI-like payloads for ordinary endpoint bodies;
- `pnpm api:runtime-hardening-readiness` runs the runtime-boundary e2e test and validates the boundary files, package scripts, CI wiring, contracts/OpenAPI error envelope, docs, status, run-log, and no-launch/no-live-vendor posture.

This remains synthetic/local API request-boundary evidence. It does not test production WAF/CDN configuration, live SIEM/APM delivery, production identity providers, production PHI storage, live vendor credentials, charge finalization, medical-necessity determination, claim submission, or production launch.

## WO-063 identity runtime boundary evidence

`WO-063` adds the CR-1 production fail-closed identity runtime gate:

- `pnpm --filter @aura-note/api test:identity-runtime` executes `apps/api/src/runtime/identity-runtime.e2e.test.ts`;
- e2e coverage verifies `AURA_NOTE_AUTH_MODE=local_demo` accepts and labels local demo synthetic headers;
- strict `AURA_NOTE_AUTH_MODE=local_synthetic` requires role, user, session, and purpose headers before controller execution;
- preview/production OIDC, production SAML, and ClinicOS delegated modes reject synthetic headers and fail closed while live adapters are unconfigured;
- disabled-user, expired-session, wrong-tenant/site, wrong-purpose, missing-identity, invalid-identity, and delegated-not-configured states return PHI-safe error envelopes;
- support users remain denied for audit export/PHI-sensitive paths, and billing transcript access remains limited to triggered billing-review context;
- `pnpm identity:runtime-boundary-readiness` runs the identity e2e suite and validates runtime files, package scripts, CI wiring, contracts/OpenAPI DTO seeds, docs, status, run-log, checkpoint evidence, and no-live-credential/no-launch posture.

This remains synthetic/local identity-boundary evidence. It does not test live OIDC, live SAML, live ClinicOS delegated identity, MFA, SCIM, account recovery, production token validation, break-glass access, production PHI access, claim submission, or production launch.

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

## Post-WO-032 durable visit capture runtime evidence

`WO-034` adds `pnpm persistence:visit-capture-adapter`:

- generates Prisma Client for the synthetic local database;
- starts the local PostgreSQL compose service through the integration test;
- applies generated Prisma SQL;
- seeds synthetic schedule/note records through the existing Prisma schedule adapter;
- persists and reloads visit start, pause, resume, stop, approved recording exception, raw-audio retention metadata, transcript records, and mock transcript segments;
- verifies wrong-tenant and wrong-site repository/API-harness reads do not expose persisted DTO data;
- verifies transcript segment sequence remapping is blocked transactionally;
- applies core schedule RLS plus `rls-visit-capture.sql` and verifies read, insert, and update denial behavior for visit capture tables.

CI now runs `pnpm persistence:visit-capture-adapter` after tenant-isolation evidence. Review-panel persistence, finalization/output/writeback persistence, durable audit/event repositories, production PHI storage approval, live transcription, live EHR/ClinicOS, live AI, and claim submission remain deferred.

## Post-WO-034 durable review-panel runtime evidence

`WO-035` adds `pnpm persistence:review-panel-adapter`:

- generates Prisma Client for the synthetic local database;
- starts the local PostgreSQL compose service through the integration test;
- applies generated Prisma SQL;
- seeds synthetic schedule/note records through the Prisma schedule adapter;
- persists and reloads suggestions, accepted and removed suggestion status, Visit Selections, manual additions, compliance hard blocks, History Gap questions, and MA-owned blocker tasks;
- verifies accepted low-confidence diagnosis suggestions are rejected when persisted override evidence is missing;
- verifies blocker-task adjudication and compliance hard-block state round-trip through durable records;
- verifies wrong-tenant and wrong-site repository/API-harness reads do not expose persisted DTO data;
- applies `rls-review-panel.sql` and verifies read, insert, and update denial behavior for review-panel tables.

CI now runs `pnpm persistence:review-panel-adapter` after visit-capture persistence evidence. Finalization/output/writeback persistence, durable audit/event repositories, production PHI storage approval, live AI suggestion generation, live EHR/ClinicOS task synchronization, medical-necessity determination, charge finalization, and claim submission remain deferred.

## Post-CP4 Azure storage and retention deletion readiness

`WO-032` adds storage and retention gates:

- `pnpm storage:azure-adapter-readiness` runs `@aura-note/storage` unit tests, storage package typecheck, and a static verifier for Azure config names and no-live-Azure posture;
- `pnpm retention:storage-deletion-readiness` runs worker tests and verifies approval-gated raw-audio object deletion readiness;
- API unit tests verify storage-backed final-note and patient-summary export metadata, patient-summary internal-detail exclusion, and storage-backed audit export metadata;
- storage unit tests verify in-memory object writes, signed-token creation, wrong-tenant denial, expiry denial, and delete evidence;
- worker tests verify destructive raw-audio deletion requires approval controls and transcript purge count remains zero.

## WO-040 audio/transcription candidate tests

`WO-040` adds the `pnpm audio:transcription-readiness` gate and extends package-level coverage:

- contracts cover microphone permission, metadata-only recording chunks, mock transcription jobs, transcript confidence/source metadata, and correction history;
- domain tests cover metadata-only chunk validation and transcript correction constraints;
- security tests cover recording/transcription/correction permissions and forbidden PHI text checks;
- API service and E2E tests cover permission recording, chunk append idempotency, approved-exception recording denial, mock provider processing, transcript correction, support-role denial, and transcript indefinite retention;
- worker tests cover deterministic mock transcription from accepted metadata-only chunks with no live provider call;
- browser tests cover audio candidate status, permission-denied demo state, chunk append, mock transcription display, confidence metadata, and correction state.

These tests prove synthetic P8.5 readiness only. Live microphones with payload persistence, live transcription vendors, production object storage, production deletion execution, external AI transcript processing, and production PHI use remain outside the test scope until later work orders authorize them.

CI runs these after the persistence gates and before acceptance readiness. Production Azure credentials, production backup/restore execution, and PHI-bearing object payload tests remain deferred.

## WO-041 production identity/config tests

`WO-041` adds the `pnpm identity:production-readiness` and `pnpm config:production-readiness` gates:

- contracts cover platform admin, session evaluation, secret-source metadata, config validation, and governed high-risk feature flags;
- security tests cover platform identity/config/feature-flag permissions plus disabled-user, missing-purpose, spoofed tenant/site, expired-session, and delegated-identity fail-closed decisions;
- API service and E2E tests cover platform admin visibility, clinician/support denial, session evaluation denial states, workforce user disabling, production missing-secret validation, high-risk flag approval requirements, and metadata-only enablement;
- browser tests cover `/aura-note/platform` identity/session, config/secret, feature-flag, permission, disabled-user, expired-session, unsafe-config, and approval-required states;
- readiness scripts verify DTOs, permissions, routes, tests, OpenAPI operations, status/run-log evidence, no live identity provider, no raw token return, no secret-value return, no `.env` files, and no high-risk live execution.

These tests prove synthetic P8 identity/config governance readiness only. Production SSO, production secret manager integration, live ClinicOS delegation, production account recovery, live vendor execution, and PHI-bearing production identity linkage remain outside the test scope until later approval.

## WO-042 secure storage, retention, and restore tests

`WO-042` adds the `pnpm storage:secure-download-readiness` and `pnpm retention:production-readiness` gates:

- storage adapter tests cover tenant/site/requester/permission scoped server-mediated download delivery, wrong-site/wrong-permission denial, no public URLs, Azure config validation, and backup/restore readiness metadata;
- API unit and e2e tests cover finalized export download delivery, patient-summary internal-detail exclusion, wrong-role denial, audit-export download delivery, support denial, and backup/restore readiness responses;
- worker tests cover raw-audio deletion approval, recovery-window blocking, deletion evidence, and transcript non-deletion;
- browser tests cover support status states for secure downloads, deletion approval, recovery-window evidence, and restore-readiness blocked posture;
- readiness scripts verify server-mediated delivery, public URL denial, no live Azure execution, recovery-window controls, soft-delete/versioning posture, and production restore execution disabled.

These tests prove synthetic P8 storage/retention/restore control evidence only. They do not enable real Azure credentials, PHI-bearing object storage, live destructive deletion, transcript deletion, production restore execution, charge finalization, or claim submission.

## WO-043 production observability/support operations readiness

Required focused evidence:

- `pnpm --filter @aura-note/security test` covers SIEM/APM placeholder metadata, PHI-safe observability probes, and support-operations permission checks.
- `pnpm --filter @aura-note/contracts test` covers P8 operational readiness and support evidence DTOs/events.
- `pnpm --filter @aura-note/api test` covers support status P8 evidence, operational readiness, operational evidence recording, role denial, and PHI rejection.
- `pnpm --filter @aura-note/api test:e2e` covers support status, operational readiness, operational evidence, and denial paths through HTTP.
- `pnpm --filter @aura-note/web test:e2e` covers support/status operational evidence states and no-launch posture.
- `pnpm observability:production-readiness` is the WO-043 readiness gate.

These tests prove synthetic P8 observability/support operations evidence only. They do not enable live SIEM/APM vendors, production observability credentials, PHI-bearing logs, production launch approval, live EHR/ClinicOS synchronization, live AI, charge finalization, medical-necessity determination, or claim submission.

## WO-044 EHR sandbox integration/writeback readiness

`WO-044` adds the `pnpm ehr:integration-readiness` gate:

- contracts tests cover EHR writeback queue DTOs, action responses, and new lifecycle event types;
- security tests cover `ehr_writeback:view`, `ehr_writeback:approve`, and `ehr_writeback:manage` role boundaries;
- EHR adapter tests prove athenahealth sandbox writeback requires human approval and remains disabled-safe without credentials;
- API service and e2e tests cover writeback queue inspection, approval, idempotency replay, retry, dead-letter, reconciliation, support-role denial, and PHI-bearing evidence rejection;
- browser tests cover `/aura-note/integrations/ehr` sandbox queue lifecycle, permission/payload boundaries, and demo fixture states;
- the readiness script verifies contracts, OpenAPI, routes, tests, status/run-log evidence, and no live EHR credential or production writeback markers.

These tests prove synthetic P9 EHR sandbox/writeback queue readiness only. They do not enable production EHR credentials, raw EHR payload storage, live writeback delivery, autonomous note submission, charge finalization, medical-necessity determination, or claim submission.

## WO-045 ClinicOS integration hardening readiness

`WO-045` adds the `pnpm clinicos:integration-readiness` gate:

- ClinicOS adapter tests cover host-mode resolution, disabled/unavailable/degraded behavior, M03 through M26 module boundaries, mapping records, publication status, and AURA Note permission-boundary metadata;
- contracts tests cover ClinicOS status, module boundaries, stale mapping DTOs, failed publication DTOs, and new event types;
- security tests cover ClinicOS adapter visibility for operational metadata, mapping-write denial for ordinary clinicians/support users, and service-account scoping;
- API service and e2e tests cover status, mapping upsert/review, stale mapping detection, failed publication metadata, permission denial, delegated identity denial, and cross-tenant service-account denial;
- browser tests cover `/aura-note/integrations/clinicos` module boundaries, stale mapping review, failed publication state, permission-denied/read-only/demo states, and safety messaging;
- the readiness script verifies contracts, OpenAPI, routes, tests, status/run-log evidence, no live ClinicOS credentials, no raw payload storage, and no prohibited clinical/billing behavior.

These tests prove synthetic P9 ClinicOS integration-hardening readiness only. They do not enable production ClinicOS credentials, live event-bus delivery, raw ClinicOS payload storage, live delegated identity, live EHR/writeback through ClinicOS, charge finalization, medical-necessity determination, or claim submission.

## WO-046 AI Gateway governance readiness

`WO-046` adds the `pnpm ai:governance-readiness` gate:

- AI Gateway package tests cover prompt/model governance metadata, nested PHI rejection/redaction, evidence excerpt redaction, deterministic evaluation cases, unsafe output validation, external-disabled provider behavior, source-linked evidence, and human-review-required labels;
- contracts tests cover AI status DTO extensions, model configuration metadata, evaluation run DTOs, output validation DTOs, and new event types;
- API service and e2e tests cover prompt/model/evaluation status, deterministic evaluation runs, unsafe output rejection, role denial for support users, cross-tenant denial, and no-live-model/no-raw-PHI-to-external-AI evidence;
- browser tests cover `/aura-note/ai-governance` prompt, model, evaluation, validation, permission-denied, disabled, read-only, evaluation-failed, unsafe-output-rejected, and demo states;
- the readiness script verifies contracts, OpenAPI, routes, tests, status/run-log evidence, no live model credential, no raw PHI, no production prompt store, no prohibited autonomous behavior, and external AI disabled by default.

These tests prove synthetic P9 AI governance readiness only. They do not enable live external AI, production model credentials, production prompt stores, PHI-bearing model payloads, medical-necessity determination, charge finalization, autonomous coding/billing, claim submission, or production launch approval.

## WO-047 security/privacy/compliance review readiness

`WO-047` adds the `pnpm security:review-readiness` gate:

- verifies the P9 review package and threat model exist and preserve no-certification/no-launch wording;
- verifies RBAC/ABAC and AI/PHI governance docs record the P9 review boundary;
- verifies `repo_status.json`, `RUN_LOG.md`, `SPEC_GAPS.md`, `CHECKPOINT_REPORT.md`, `work_orders/README.md`, and CI include the security review evidence;
- runs package security tests and API tests before the static verifier.

This gate proves synthetic/local P9 review readiness only. It does not certify HIPAA compliance, SOC 2 readiness, legal compliance, production security approval, production privacy approval, production launch approval, live vendor readiness, or production PHI handling.

## WO-048 frontend runtime integration readiness

`WO-048` adds `pnpm frontend:runtime-integration-readiness`:

- the web typed API client is validated against contract DTOs;
- `/aura-note/runtime-integration` renders API-backed schedule and finalized-note evidence;
- Playwright creates an appointment through the API, starts the visit, completes finalization, generates a draft claim preview with `submittedClaim=false`, signs/dispatches, generates a final-note PDF artifact, reloads the route, and confirms persisted read-only evidence remains visible;
- `docs/FRONTEND_RUNTIME_INTEGRATION.md` inventories routes as API-backed, documented mocks, or static/read shells.

This gate proves synthetic/local frontend runtime integration evidence only. Existing production-intended scaffold routes must be converted to typed API runtime behavior or explicitly deferred before launch-candidate readiness is claimed.

## WO-064 primary UI runtime API conversion

`WO-064` adds `pnpm frontend:primary-runtime-readiness`:

- the primary production-intended AURA Note routes use the typed web API client for route loaders and state-changing actions;
- Playwright seeds backend records through the API for schedule, workspace, finalized-note, and frontend runtime integration flows;
- browser checks cover loading, empty, ready, saving, failed, permission-denied, read-only, blocked, degraded, disabled, and documented demo/fixture states where relevant;
- route actions for schedule, visit timer, recording metadata, transcript correction, History Gap blocker creation, finalization, export/copy/download/writeback, operations, platform, EHR, ClinicOS, AI governance, coaching, and support status refetch typed API-backed state after mutation;
- ClinicOS browser calls use typed mode headers and the API CORS boundary permits those headers for local synthetic evidence.

This gate proves synthetic/local primary route runtime evidence only. It does not enable live EHR, ClinicOS, AI, transcription, storage, payer, claim, production identity, production PHI, or production launch behavior.

## WO-065 Figma handoff readiness

`WO-065` adds `pnpm figma:handoff-readiness`:

- Playwright opens `/aura-note/figma-handoff` and verifies the read-only handoff route exposes the screen inventory, route states, role views, workflow map, ClinicOS adapter-boundary copy, and AI suggestions remain draft-only safety copy.
- `scripts/validate-figma-handoff-readiness.js` verifies the eight Figma handoff docs, required screen surfaces, required states, role views, typed API and documented mock mappings, content copy constraints, CI wiring, status/run-log evidence, and no-launch safety posture.
- The gate preserves `pnpm frontend:primary-runtime-readiness` and `pnpm frontend:runtime-integration-readiness` so design handoff inventory does not replace backend-backed route evidence.

This gate is design-handoff evidence only. It does not enable live PHI, live EHR, live ClinicOS, live AI, live transcription, live storage, claim submission, autonomous clinical/coding/billing behavior, medical-necessity determination, charge finalization, production design approval, or production launch.

## WO-066 standalone workflow completion

`WO-066` adds `pnpm standalone:workflow-readiness`:

- Playwright seeds a backend-backed standalone appointment, drives the API finalization/export workflow, and verifies browser-visible standalone continuity through runtime home, schedule, finalized note, operations, and ClinicOS adapter-boundary routes.
- The route checks prove the workflow does not require ClinicOS, finalized artifacts are read-only, claim submission remains disabled, and ClinicOS cannot bypass AURA Note permissions.
- `scripts/validate-standalone-workflow-readiness.js` checks route evidence, docs/status/run-log/checkpoint evidence, next-work-order rails, and the no-live/no-launch posture.
- The gate preserves `pnpm figma:handoff-readiness`, `pnpm frontend:primary-runtime-readiness`, and `pnpm frontend:runtime-integration-readiness`.

This gate closes CR-2 as synthetic/local product UX runtime evidence only. It does not enable live PHI, live EHR, live ClinicOS, live AI, live transcription, live storage, claim submission, autonomous clinical/coding/billing behavior, medical-necessity determination, charge finalization, or production launch.

## WO-049 launch operations readiness

`WO-049` adds synthetic/local deployment, performance, reliability, and operational drill evidence:

- `pnpm performance:launch-baseline` runs a deterministic 100-workflow synthetic performance harness without production traffic, PHI, or live vendors.
- `pnpm launch:ops-readiness` runs the performance baseline, the web Playwright route suite, and the launch operations verifier.
- Browser tests assert `/aura-note/support/status` exposes Launch Ops Drills, rollback rehearsal, synthetic_load_baseline, vendor outage, access review, disabled-vendor, and no-production-traffic states.
- `scripts/validate-launch-ops-readiness.js` checks docs, runbooks, CI wiring, support status UI, status advancement, run-log evidence, and safety boundaries.

This gate is operational rehearsal only. It does not approve production deployment, production PHI, live vendor use, charge finalization, medical-necessity determination, autonomous clinical/coding/billing behavior, or claim submission.

## WO-050 beta pilot and limited launch gate

`WO-050` adds the P10 beta-pilot decision package. Verification includes `pnpm pilot:readiness`, `pnpm launch:readiness`, support-status browser assertions for Pilot Launch Gate, Tenant Onboarding, Role Training, Disabled Feature Inventory, First-Week Monitoring, Go/No-Go Approvals, `productionLaunchApproved=false`, and `submittedClaim=false`. The gate also reruns `pnpm frontend:runtime-integration-readiness` so the seeded backend-backed appointment-through-finalization/export workflow remains part of launch review evidence.

## WO-051 claim/payer decision gate

`WO-051` adds `pnpm claim-decision:readiness` as the P11 decision gate. Verification includes decision-package docs, the WO-051 runbook, support-status browser assertions for Claim/Payer Decision Gate, Draft Claim Boundary, No Live Clearinghouse, No Payer API, No Denial Automation, No Payment Posting, `submittedClaim=false`, and `claimSubmissionEnabled=false`. Existing schedule/finalization tests continue proving draft claim preview remains unsubmitted and patient-facing summaries exclude internal billing/revenue details.

This gate must fail if any current document/status evidence claims live claim submission, payer API calls, clearinghouse integration, denial automation, payment posting, charge finalization, medical-necessity determination, or patient financial conclusions are enabled.

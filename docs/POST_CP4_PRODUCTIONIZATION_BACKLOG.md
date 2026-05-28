# Post-CP4 productionization backlog

## Purpose

CP-4 closes the defined AURA Note v1 synthetic, local-first work-order package. This backlog converts the CP-4 checkpoint risks into controlled productionization tranches. These are not marked complete, not active runtime behavior, and not production launch claims.

Before any tranche below becomes implementation work, promote it into a numbered `work_orders/WO-###` file and update `repo_status.json` deliberately.

The sequential post-`WO-032` production build plan is maintained in `docs/PRODUCTION_BUILD_PLAN.md`. That plan defines `WO-033` through `WO-051`, checkpoint gates, per-work-order completion criteria, and overall launch-readiness criteria. `WO-033` is the re-rail/control work order; `WO-034` adds durable local visit capture runtime evidence; `WO-035` adds durable local review-panel runtime evidence; `WO-036` adds durable local finalization/output/writeback runtime evidence; `WO-037` closes P7 durable runtime metadata and broad RLS evidence; `WO-038` adds standalone patient, chart context, and schedule completion; `WO-039` closes P7.5 with standalone worklists, billing review, settings/admin/integrations, templates/dot phrases, estimate configuration, and rules catalog; `WO-040` closes P8.5 with browser audio capture and mock transcription candidate evidence; `WO-041` adds production-shaped identity/config governance; `WO-042` adds secure storage, retention deletion approval/recovery, and backup/restore readiness; `WO-043` closes P8 with production observability/support operations evidence. P10 now includes a Frontend Runtime Integration Gate requiring typed API clients, persisted backend state, documented mocks where live dependencies are disabled, and Playwright evidence for at least one seeded backend-backed appointment-to-finalization/export workflow before launch-candidate readiness can be claimed. The next active production-build tranche is `WO-044`.

## Safety boundary

All post-CP4 work must preserve the existing prohibitions:

- no autonomous diagnosis;
- no autonomous ICD-10, CPT, HCPCS, HCC, E/M, modifier, quality-measure, charge, claim, or medical-necessity finalization;
- no live claim submission;
- no live EHR writeback without explicit configuration, audit, permission, and human approval gates;
- no production PHI sent to external AI;
- no production storage deletion until retention controls, approvals, and rollback behavior are specified and tested;
- no patient-facing revenue estimate unless tenant policy and source data authorize it.

## Tranche P5-01 — Durable Persistence And Migration Foundation

**Promotion status:** Promoted to `WO-015` as a schema/tooling-only persistence foundation. Runtime repository replacement remains deferred to a later numbered work order.

**Objective:** Move the current process-local synthetic repositories toward durable, tenant-scoped persistence without changing clinical behavior.

**Candidate scope:**

- Add database choice and environment contract.
- Introduce migration tooling and rollback guidance.
- Persist tenant, site, appointment, note shell, visit session, transcript metadata, selected items, finalization session, final note, patient summary, export artifact metadata, task, audit event, feature flag, and support status records.
- Preserve synthetic seed data and local-only defaults.
- Keep external AI, EHR, ClinicOS, storage, and analytics disabled.

**Acceptance evidence:**

- Migration apply/rollback commands work locally.
- Unit/integration tests prove one appointment maps to one note shell after persistence.
- Existing e2e flows pass against the persistent repository adapter.
- No `.env`, credential, production connection string, or PHI-bearing seed enters the repo.

**Known risks:**

- Persistence schema choices affect all later deployment, compliance, retention, and audit work.
- A production database decision may require founder/architecture review before implementation.

## Tranche P5-02 — Tenant Identity And Access Foundation

**Promotion status:** Promoted to `WO-016` as a local synthetic tenant identity and access foundation. Production SSO, MFA, account administration, persistent identity storage, and real ClinicOS/OIDC delegation remain deferred to later numbered work orders.

**Objective:** Replace header-only scaffold identity with an authenticated tenant/user/session boundary while preserving RBAC/ABAC behavior.

**Candidate scope:**

- Define tenant, user, role, site, clinician-linkage, and purpose-of-use identity models.
- Add local auth/session scaffold for development and test.
- Add adapter boundary for future ClinicOS or external identity provider delegation.
- Enforce tenant scope on implemented API routes.
- Add cross-tenant denial tests.

**Acceptance evidence:**

- API and UI routes continue to work with synthetic local auth.
- Cross-tenant reads and writes are denied.
- Linked clinician, billing review, support status, audit export, coaching, final-note, transcript, and export permissions remain explicit.

**Known risks:**

- Production identity provider choice is not yet specified.
- Real SSO, MFA, account recovery, and organization administration require separate security review.

## Tranche P5-03 — Committed Browser E2E And Accessibility Suite

**Promotion status:** Promoted to `WO-017` as a committed Playwright Chromium browser E2E and accessibility-oriented route regression suite. Visual regression and final design-system fidelity remain deferred to later numbered work orders.

**Objective:** Convert manual/browser route-sweep evidence into committed browser regression tests with accessibility checks.

**Candidate scope:**

- Add Playwright or equivalent browser test harness.
- Cover Schedule, Draft Notes, Documentation Workspace, Finalization, Finalized Notes, finalized viewer, Coaching, and Support hardening routes.
- Add keyboard navigation and accessible-name checks for key controls.
- Keep browser fixtures synthetic.

**Acceptance evidence:**

- Browser tests run in CI.
- Route screenshots or traces are available on failure.
- Accessibility checks cover core route landmarks, headings, controls, and permission-denied/blocked states.

**Known risks:**

- Browser tests can become flaky if selectors are not stabilized.
- High-fidelity visual regression should wait until design-system work lands.

## Tranche P5-04 — Observability, Deployment, And Support Runbooks

**Promotion status:** Promoted to `WO-018` as a local-first observability, deployment matrix, and support runbook foundation. Production log/SIEM/APM vendors, production deployment automation, production audit download delivery, and destructive retention deletion remain deferred to later numbered work orders.

**Objective:** Prepare deployable operational scaffolding without connecting production sinks or vendors prematurely.

**Candidate scope:**

- Define structured log, metric, trace, and audit-export sink interfaces.
- Add local/development observability adapters.
- Extend support runbooks for deploy, rollback, incident triage, audit export request handling, retention review, and external integration disabled-state review.
- Define deployment environment matrix and secret requirements without committing secrets.

**Acceptance evidence:**

- Local structured logs remain redacted and request-correlated.
- Support status shows disabled/missing integration states clearly.
- Runbooks cover rollback, incident severity, audit export handling, and retention-job review.

**Known risks:**

- Production log, trace, SIEM, and audit storage vendors are not specified.
- Retention deletion remains disabled until storage, approval, and recovery behavior are specified.

## Tranche P5-05 — Design System, UX Hardening, And Compliance Review Package

**Promotion status:** Promoted to `WO-019` as an initial design-token, responsive browser hardening, UX copy review, and compliance/security/privacy review package. Final Figma fidelity, visual regression baselines, compliance certification, and production launch approval remain deferred to later review work.

**Objective:** Prepare AURA Note for human review as a commercial product surface without changing clinical authority boundaries.

**Candidate scope:**

- Establish design-system tokens and reusable components.
- Stabilize dense operational layouts for clinician, billing, support, compliance, and admin roles.
- Add UX copy review for clinical, billing, patient-summary, coaching, audit, and support states.
- Prepare compliance/security/privacy review package from existing docs, contracts, run logs, and test evidence.

**Acceptance evidence:**

- Screens remain browser-testable and responsive.
- No patient-facing view exposes internal billing/revenue/coaching details.
- Review package clearly separates implemented, synthetic, disabled, deferred, and prohibited behavior.

**Known risks:**

- Final visual design requires founder and design-system review.
- Compliance/security/privacy review may create new SPEC_GAP entries or re-sequence productionization work.

## Promotion rule

Do not implement these tranches directly from this backlog. Promote one tranche at a time into `work_orders/WO-###_*.md`, update `work_orders/README.md`, and update `repo_status.json` only when the tranche is ready to become active implementation work.

## Follow-on Tranche P6-01 — Persistence Runtime Readiness

**Promotion status:** Promoted to `WO-020` as a repository-seam and migration-readiness tranche. Runtime still defaults to an in-memory adapter; live database connection and full Prisma-backed repository replacement remain deferred.

**Objective:** Move from schema-only persistence toward replaceable runtime repositories and repeatable migration SQL evidence without storing production data.

**Candidate scope:**

- Extract current process-local schedule/note state behind a repository port.
- Keep the in-memory adapter as the only enabled runtime adapter.
- Add tests for appointment-note one-to-one lookup and idempotency replay at the repository boundary.
- Add deterministic Prisma forward/rollback SQL generation evidence.

**Acceptance evidence:**

- Existing API, browser, acceptance, and persistence gates continue to pass.
- Runtime repository tests prove one appointment maps to one note.
- Migration readiness command validates schema and generates forward plus rollback SQL without connecting to a live database.

**Known risks:**

- This does not yet persist runtime data.
- Full Prisma-backed adapter replacement will touch broad API workflows and should remain a later, reviewable work order.

## Follow-on Tranche P6-02 — Prisma Adapter Scaffold

**Promotion status:** Promoted to `WO-021` as a disabled Prisma adapter and mapper scaffold. Runtime database writes remain disabled.

**Objective:** Prove the schedule/note DTO boundary can be projected into Prisma-compatible synthetic row shapes before replacing any runtime repository.

**Candidate scope:**

- Add a persistence package for adapter readiness planning.
- Keep in-memory runtime as the only enabled adapter.
- Keep future Prisma mode disabled until database, migration, rollback, tenant-scope, and PHI-storage evidence exists.
- Add appointment/note projection tests and PHI-key rejection tests.

**Acceptance evidence:**

- Persistence package tests pass in CI.
- Full repo gates still pass.
- Docs preserve the distinction between scaffold mapping and live persistence.

**Known risks:**

- Projection tests are not database integration tests.
- The next database-backed work order will still need local database orchestration and transaction/error-path coverage.

## Follow-on Tranche P6-03 — Persistence UUID Projection Readiness

**Promotion status:** Promoted to `WO-022` as deterministic UUID projection hardening for the disabled Prisma adapter scaffold. Runtime database writes remain disabled.

**Objective:** Ensure the disabled Prisma row projection uses UUID-shaped primary keys and reference fields that match the PostgreSQL Prisma schema before any later work order enables local database writes.

**Candidate scope:**

- Add deterministic UUID projection for synthetic natural keys.
- Preserve semantic fixture identifiers as natural keys or safe references.
- Align appointment and note projected field names with the current Prisma schema.
- Add a synthetic clinician `User` projection row because appointment and note clinician references are UUID fields.
- Keep in-memory runtime as the only enabled adapter.

**Acceptance evidence:**

- Persistence package tests prove projected identifiers are UUID-shaped and deterministic.
- Appointment and note row references point to projected UUIDs rather than semantic fixture IDs.
- One appointment to one note and PHI-key rejection tests continue to pass.
- CI runs `pnpm persistence:adapter-readiness`.

**Known risks:**

- Deterministic UUID projection is readiness scaffolding, not final production ID policy.
- Local database orchestration, transaction behavior, row-level security, foreign-key enforcement, and full Prisma-backed repository replacement remain later work.

## Follow-on Tranche P6-04 — Core Prisma Relationship Readiness

**Promotion status:** Promoted to `WO-023` as core Prisma relation and generated foreign-key SQL evidence. Runtime database writes remain disabled.

**Objective:** Add schema-level relationship constraints for the core schedule/note graph before enabling any local database adapter.

**Candidate scope:**

- Add Prisma relation fields for `Tenant`, `Site`, `User`, `Patient`, `Appointment`, and `Note`.
- Preserve one appointment to one note uniqueness.
- Extend SQL-generation readiness checks for core foreign-key fragments.
- Keep in-memory runtime as the only enabled adapter.

**Acceptance evidence:**

- Prisma schema validation passes.
- Persistence runtime readiness checks generated forward SQL for core foreign keys.
- Existing repository, browser, acceptance, and persistence adapter gates continue to pass.

**Known risks:**

- This is core relationship readiness, not full 35-model relationship completion.
- Local database orchestration, row-level security, transaction/error-path behavior, and full Prisma-backed repository replacement remain later work.

## Follow-on Tranche P6-05 — Visit, Recording, And Transcript Prisma Relationship Readiness

**Promotion status:** Promoted to `WO-024` as visit documentation capture relation and generated foreign-key SQL evidence. Runtime database writes remain disabled.

**Objective:** Extend schema-level relationship constraints from the core schedule/note graph into the visit-session, recording, transcript, and transcript-segment records needed before any local database-backed adapter can be enabled.

**Candidate scope:**

- Add Prisma relation fields for `VisitSession`, `RecordingAsset`, `Transcript`, and `TranscriptSegment`.
- Preserve raw-audio one-week retention and transcript indefinite-retention semantics.
- Extend SQL-generation readiness checks for visit, recording, transcript, and transcript-segment foreign-key fragments.
- Keep in-memory runtime as the only enabled adapter.

**Acceptance evidence:**

- Prisma schema validation passes.
- Persistence runtime readiness checks generated forward SQL for visit, recording, transcript, and transcript-segment foreign keys.
- Existing repository, browser, acceptance, and persistence adapter gates continue to pass.

**Known risks:**

- This is visit/transcript relationship readiness, not full 35-model relationship completion.
- Local database orchestration, row-level security, transaction/error-path behavior, retention deletion against durable storage, and full Prisma-backed repository replacement remain later work.

## Follow-on Tranche P6-06 — Review Panel Prisma Relationship Readiness

**Promotion status:** Promoted to `WO-025` as review-panel relation and generated foreign-key SQL evidence. Runtime database writes remain disabled.

**Objective:** Extend schema-level relationship constraints into suggestions, Visit Selections, compliance issues, History Gap questions, and blocker tasks before any local database-backed adapter can be enabled.

**Candidate scope:**

- Add Prisma relation fields for `Suggestion`, `VisitSelection`, `ComplianceIssue`, `HistoryGapQuestion`, and `Task`.
- Preserve draft-only, human-review-required suggestion and blocker semantics.
- Extend SQL-generation readiness checks for review-panel foreign-key fragments.
- Keep in-memory runtime as the only enabled adapter.

**Acceptance evidence:**

- Prisma schema validation passes.
- Persistence runtime readiness checks generated forward SQL for review-panel foreign keys.
- Existing repository, browser, acceptance, and persistence adapter gates continue to pass.

**Known risks:**

- This is review-panel relationship readiness, not full 35-model relationship completion or durable workflow behavior.
- Local database orchestration, row-level security, transaction/error-path behavior, tenant-scoped query tests, and full Prisma-backed repository replacement remain later work.

## Follow-on Tranche P6-07 — Finalization Prisma Relationship Readiness

**Promotion status:** Promoted to `WO-026` as finalization relation and generated foreign-key SQL evidence. Runtime database writes remain disabled.

**Objective:** Extend schema-level relationship constraints into finalization runs, wizard decisions, enhanced note versions, patient summary versions, billing attestations, and draft claim previews before any local database-backed adapter can be enabled.

**Candidate scope:**

- Add Prisma relation fields for `FinalizationRun`, `WizardStepDecision`, `EnhancedNoteVersion`, `PatientSummaryVersion`, `BillingAttestation`, and `DraftClaimPreview`.
- Preserve human-review-required finalization and `submittedClaim = false` draft claim semantics.
- Extend SQL-generation readiness checks for finalization foreign-key fragments.
- Keep in-memory runtime as the only enabled adapter.

**Acceptance evidence:**

- Prisma schema validation passes.
- Persistence runtime readiness checks generated forward SQL for finalization foreign keys.
- Existing repository, browser, acceptance, and persistence adapter gates continue to pass.

**Known risks:**

- This is finalization relationship readiness, not full durable finalization workflow behavior.
- Local database orchestration, row-level security, transaction/error-path behavior, tenant-scoped query tests, and full Prisma-backed repository replacement remain later work.

## Follow-on Tranche P6-08 — Output And Writeback Prisma Relationship Readiness

**Promotion status:** Promoted to `WO-027` as output/writeback relation and generated foreign-key SQL evidence. Runtime database writes and live writeback remain disabled.

**Objective:** Extend schema-level relationship constraints into signed export artifacts and EHR writeback jobs before any local database-backed adapter can be enabled.

**Candidate scope:**

- Add Prisma relation fields for `ExportArtifact` and `EhrWritebackJob`.
- Preserve signed-version-locked export metadata and conservative writeback queue status semantics.
- Extend SQL-generation readiness checks for output/writeback foreign-key fragments.
- Keep in-memory runtime as the only enabled adapter.

**Acceptance evidence:**

- Prisma schema validation passes.
- Persistence runtime readiness checks generated forward SQL for output/writeback foreign keys.
- Existing repository, browser, acceptance, and persistence adapter gates continue to pass.

**Known risks:**

- This is output/writeback relationship readiness, not production storage, PDF delivery, or live EHR writeback.
- Local database orchestration, row-level security, transaction/error-path behavior, tenant-scoped query tests, production storage policy, and full Prisma-backed repository replacement remain later work.

## Follow-on Tranche P6-09 — Local Database Orchestration Readiness

**Promotion status:** Promoted to `WO-028` as a local PostgreSQL orchestration contract and static readiness verifier. Runtime database writes remain disabled.

**Objective:** Add the local database orchestration contract needed before any later migration apply/rollback or Prisma-backed adapter work can run against PostgreSQL.

**Candidate scope:**

- Add a local-only PostgreSQL compose contract using the existing synthetic `DATABASE_URL` shape.
- Add a deterministic verifier that checks the compose contract, synthetic `.env.example` database URL, and Prisma PostgreSQL provider without touching a live database.
- Keep runtime on the in-memory adapter.
- Keep migration apply/rollback, Prisma Client usage, row-level security, transaction behavior, and tenant-scoped query tests deferred to later work orders.

**Acceptance evidence:**

- `pnpm persistence:local-db-readiness` passes without requiring Docker to be installed or running.
- Existing Prisma validation, persistence readiness, adapter readiness, acceptance readiness, browser, test, and build gates continue to pass.
- No `.env`, credential, production connection string, or PHI-bearing seed enters the repo.

**Known risks:**

- This is orchestration readiness, not a live database integration test.
- A later work order still needs to run migrations against a local PostgreSQL instance, test rollback, enable tenant-scoped query checks, and prove transaction/error-path behavior before runtime persistence can be claimed.

## Follow-on Tranche P6-10 — Local PostgreSQL Migration Apply And Rollback Evidence

**Promotion status:** Promoted to `WO-029` as live local PostgreSQL apply/rollback evidence. Runtime database writes remain disabled.

**Objective:** Prove the current Prisma schema can apply and roll back against the local synthetic PostgreSQL target before any Prisma-backed runtime adapter is enabled.

**Candidate scope:**

- Start the local PostgreSQL service from `docker-compose.yml`.
- Generate forward SQL from empty to the current Prisma datamodel and execute it against the local database.
- Verify the local database has no schema drift against the Prisma datamodel.
- Generate rollback SQL from the Prisma datamodel to empty and execute it against the same local database.
- Verify the rolled-back database has no schema drift against empty.
- Tear down the synthetic local volume after the evidence run.

**Acceptance evidence:**

- `pnpm persistence:local-db:migrate-evidence` passes locally and in CI.
- The verifier refuses non-synthetic database configuration.
- Existing Prisma validation, persistence readiness, adapter readiness, acceptance readiness, browser, test, and build gates continue to pass.

**Known risks:**

- This proves schema apply/rollback only. It does not replace the in-memory runtime adapter.
- Tenant-scoped live query tests, row-level security, transaction/error-path behavior, and full Prisma-backed repository replacement remain later work.

## Follow-on Tranche P6-11 — Prisma Schedule Runtime Adapter

**Promotion status:** Promoted to `WO-030` as the first local Prisma-backed runtime adapter slice for schedule appointment and note shell state.

**Objective:** Prove the schedule/note repository seam can use Prisma Client against the synthetic local PostgreSQL database before broad workflow runtime persistence is enabled.

**Candidate scope:**

- Add a Prisma-backed async schedule repository adapter.
- Persist and retrieve standalone appointment and note shell rows through local PostgreSQL.
- Preserve semantic synthetic appointment/note IDs through source-reference fields while using UUID primary keys.
- Add durable tenant-scoped idempotency records.
- Add local PostgreSQL integration tests for lookup, one-to-one remapping blocks, and idempotency replay behavior.
- Keep the broad API runtime on the in-memory adapter until visit/session, transcript, review-panel, finalization, export, writeback, coaching, and audit state can be persisted together.

**Acceptance evidence:**

- `pnpm persistence:prisma-schedule-adapter` passes locally and in CI.
- Prisma schema validation and runtime readiness checks pass.
- The full local gate continues to pass.

**Known risks:**

- This is the first adapter slice, not a full application persistence switch.
- Row-level security, production migration execution, transaction/error-path coverage, and broad workflow repository replacement remain later work.

## Follow-on Tranche P6-12 — Tenant Isolation And Core RLS Evidence

**Promotion status:** Promoted to `WO-031` as live local PostgreSQL tenant/site query evidence and core RLS policy evidence for the persisted schedule/note slice.

**Objective:** Prove the current Prisma schedule adapter enforces tenant and site boundaries against persisted rows, and add committed PostgreSQL RLS policies for the core persisted tables currently exercised by that adapter.

**Candidate scope:**

- Extend the Prisma schedule adapter to accept optional site scope.
- Add persisted-record tests for same semantic IDs across tenants, cross-tenant denial, cross-site denial, idempotency isolation, and API access-context denial before DTO exposure.
- Add a core RLS SQL artifact for `Tenant`, `Site`, `User`, `Patient`, `Appointment`, `Note`, and `IdempotencyRecord`.
- Add a tenant-isolation verifier command and run it in CI after Prisma schedule adapter evidence.
- Keep broad workflow runtime persistence and broader-table RLS deferred.

**Acceptance evidence:**

- `pnpm persistence:tenant-isolation` passes locally and in CI.
- Existing Prisma schedule adapter, local database migration evidence, acceptance readiness, browser, test, and build gates continue to pass.
- No production database URL, secret, PHI-bearing fixture, live EHR/AI/storage integration, charge finalization, or claim submission is introduced.

**Known risks:**

- RLS coverage is intentionally limited to the current persisted schedule/note slice.
- Remaining workflow tables still require RLS and repository evidence as they are migrated to durable persistence.

## Follow-on Tranche P6-13 — Azure Blob Export Delivery And Retention Deletion Readiness

**Promotion status:** Promoted to `WO-032` as Azure Blob-oriented storage adapter, signed export/audit delivery metadata, and approval-gated raw-audio storage deletion readiness.

**Objective:** Move export and retention deletion from inline-only scaffold behavior to production-shaped storage metadata and local fake-storage evidence without live credentials or PHI-bearing payloads.

**Candidate scope:**

- Add object storage adapter interfaces and Azure Blob config validation.
- Add deterministic in-memory storage tests for signed tokens, wrong-tenant denial, expiry denial, and object deletion.
- Extend final-note, patient-summary, structured export, and audit export DTOs with storage-backed delivery metadata.
- Add worker deletion readiness for raw audio only, with approval evidence and transcript non-deletion.
- Document Azure Blob soft-delete/versioning and backup/restore expectations.

**Acceptance evidence:**

- `pnpm storage:azure-adapter-readiness` passes locally and in CI.
- `pnpm retention:storage-deletion-readiness` passes locally and in CI.
- Full local gate continues to pass.

**Known risks:**

- Azure SDK execution, production container policy validation, production backup/restore drills, and PHI-bearing object delivery remain blocked until security/privacy review.

## Follow-on Tranche P8-01 — Production Identity And Config Governance

**Promotion status:** Promoted to `WO-041` as production-shaped identity, tenant administration, secrets/config validation, and governed high-risk feature-flag evidence.

**Objective:** Add fail-closed identity/session/config controls without enabling live SSO, live ClinicOS delegation, production secret stores, or high-risk live execution.

**Candidate scope:**

- Add OIDC, SAML, and ClinicOS delegated identity adapter status DTOs.
- Add synthetic tenant/site/user/session/config/feature-flag admin API and browser surfaces.
- Deny disabled users, expired sessions, missing purpose-of-use, spoofed tenant/site, unsupported delegated identity, and unauthorized admin operations.
- Validate secret-source metadata without returning secret values.
- Keep high-risk flags default disabled and require approval evidence before metadata-only enablement.

**Acceptance evidence:**

- `pnpm identity:production-readiness` passes locally and in CI.
- `pnpm config:production-readiness` passes locally and in CI.
- Full local gate continues to pass.

**Known risks:**

- Production IdP selection, MFA, account recovery, access reviews, production secret manager selection, live ClinicOS delegation, and live feature enablement require founder/security review.

## Follow-on Tranche P8-02 — Secure Storage, Retention, Backup, And Restore Controls

**Promotion status:** Promoted to `WO-042` as server-mediated secure download, Azure Blob adapter boundary, raw-audio deletion approval/recovery control, and backup/restore readiness evidence.

**Objective:** Harden storage-backed delivery and retention deletion controls without enabling live Azure credentials, PHI-bearing object payloads, live destructive deletion, or production restore execution.

**Candidate scope:**

- Add tenant/site/requester/permission scoped server-mediated download validation.
- Keep download URLs non-public and metadata-only in tests.
- Require patient-summary internal-detail exclusion before patient-summary download delivery.
- Require feature flag, approval token, approval ID, and recovery-window evidence before raw-audio object deletion.
- Preserve indefinite transcript retention.
- Add backup/restore readiness metadata for Azure soft-delete/versioning, database backups, restore drills, and evidence retention.

**Acceptance evidence:**

- `pnpm storage:secure-download-readiness` passes locally and in CI.
- `pnpm retention:production-readiness` passes locally and in CI.
- Full local gate continues to pass.

**Known risks:**

- Production Azure account/container policy, customer-managed keys, legal hold, real backup schedule, production restore-drill execution, and PHI-bearing object delivery require founder/security/privacy review.

## Follow-on Tranche P8-03 — Production Observability And Support Operations

**Promotion status:** Promoted to `WO-043` and completed as synthetic P8 evidence.

**Objective:** Harden production-shaped observability, support operations, operational status views, and runbook evidence without enabling live SIEM/APM vendors, PHI-bearing log payloads, or production launch claims.

**Acceptance evidence:**

- `pnpm observability:production-readiness` passes locally and in CI.
- Support status includes P8, local redacted logs/metrics/traces, disabled SIEM/APM placeholders, operational readiness, operational evidence, and no-launch posture.
- Full local gate continues to pass.

**Known risks:**

- SIEM/APM vendor selection, production exporter endpoints, credential source, log retention, alert thresholds, on-call ownership, support break-glass, and production launch approval require founder/security/privacy review.

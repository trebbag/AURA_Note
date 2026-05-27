# Post-CP4 productionization backlog

## Purpose

CP-4 closes the defined AURA Note v1 synthetic, local-first work-order package. This backlog converts the CP-4 checkpoint risks into controlled productionization tranches. These are not marked complete, not active runtime behavior, and not production launch claims.

Before any tranche below becomes implementation work, promote it into a numbered `work_orders/WO-###` file and update `repo_status.json` deliberately.

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

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

# AURA Note production build plan

## Purpose

This document converts the remaining post-`WO-032` productionization work into a sequential, reviewable work-order plan. It is a planning artifact only. It does not promote any new work order, change `repo_status.json`, or claim production readiness.

The current implemented baseline is:

- all numbered work orders through `WO-032` are complete;
- local synthetic CP-4 and post-CP4 readiness gates pass;
- the schedule/note slice has local PostgreSQL, tenant/site query evidence, and core RLS evidence;
- Azure Blob-oriented storage, signed delivery metadata, and raw-audio deletion behavior exist as synthetic/local readiness scaffolding;
- the broad runtime still uses in-memory or local synthetic state for most workflow areas;
- real production PHI storage, real Azure storage execution, live EHR writeback, live external AI with PHI, production identity, claim submission, and autonomous clinical/coding/billing behavior remain disabled or out of scope.

## Safety boundaries for every work order

Every work order below must preserve these boundaries unless a later founder-approved specification explicitly changes them:

- no autonomous diagnosis;
- no autonomous ICD-10, CPT, HCPCS, HCC, E/M, modifier, quality-measure, charge, claim, or medical-necessity finalization;
- no live claim submission;
- no live EHR writeback without explicit configuration, audit, permission, idempotency, rollback/recovery, and human approval gates;
- no production PHI sent to external AI until business associate, privacy, security, governance, and tenant-policy requirements are approved and implemented;
- no production storage deletion until retention controls, approvals, backup/restore, soft-delete/versioning, and recovery evidence are complete;
- no patient-facing revenue estimate unless tenant policy and source data authorize it;
- no `.env`, real credential, private key, production connection string, or real patient data may be committed.

## Standard gate for each implementation work order

Unless a work order states otherwise, completion requires:

- implementation traced to `AGENTS.md`, locked decisions, specs, data model, contracts, events, RBAC/ABAC, and the active work order;
- unit, integration, contract, security, and browser/e2e coverage appropriate to the changed surface;
- OpenAPI/DTO/event/data-model documentation updates when public behavior changes;
- `RUN_LOG.md`, `repo_status.json`, and relevant docs updated;
- no new active `SPEC_GAP` remains unless the work order explicitly stops at a documented decision gate;
- CI passes on a reviewable PR before the work order is marked done.

The default local gate is:

```bash
pnpm install --frozen-lockfile
pnpm db:client:generate
pnpm lint
pnpm lint:phi
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm test:browser
pnpm build
pnpm persistence:foundation
pnpm persistence:runtime-readiness
pnpm persistence:adapter-readiness
pnpm persistence:local-db-readiness
pnpm persistence:local-db:migrate-evidence
pnpm persistence:prisma-schedule-adapter
pnpm persistence:tenant-isolation
pnpm storage:azure-adapter-readiness
pnpm retention:storage-deletion-readiness
pnpm acceptance:readiness
node scripts/status.js
git diff --check
```

Additional gates must be added as new production surfaces are introduced.

## Checkpoint sequence

- **P7 Durable Runtime Candidate:** `WO-033` through `WO-036`. Goal: broad workflow state is Prisma-backed locally with tenant/site query enforcement, RLS evidence, and durable audit/event records.
- **P8 Production Platform Candidate:** `WO-037` through `WO-041`. Goal: production identity, secrets/config, Azure storage execution, retention deletion controls, and observability are ready for security/privacy review.
- **P9 Integration And AI Candidate:** `WO-042` through `WO-045`. Goal: EHR, ClinicOS, and AI production paths are sandboxed, governed, audited, and externally reviewable without weakening human-review boundaries.
- **P10 Launch Candidate:** `WO-046` through `WO-050`. Goal: UX/accessibility polish, deployment automation, operational drills, beta readiness, and limited launch governance are complete.
- **Decision Gate:** `WO-051`. Goal: claim-submission and payer integration decisions are captured without implementing prohibited billing behavior by default.

## WO-033 — Durable Visit Capture Runtime Persistence

**Objective:** Move visit session, recording asset, transcript, and transcript segment runtime state from in-memory/local synthetic state to Prisma-backed local PostgreSQL while preserving timer gates, recording exception behavior, raw-audio retention metadata, and indefinite transcript retention.

**Scope:**

- Add repository ports and Prisma adapters for `VisitSession`, `RecordingAsset`, `Transcript`, and `TranscriptSegment`.
- Persist start, pause, resume, stop, recording-exception, and mock transcript append/retrieval behavior.
- Add transaction boundaries for session state changes and transcript segment append.
- Add tenant/site-scoped query filters and cross-tenant/site denial tests.
- Add RLS policy artifacts and tests for the visit capture tables.
- Keep production PHI storage disabled unless explicitly configured for synthetic/local tests.

**Completion criteria:**

- API and worker tests prove persisted visit/session state reloads after adapter recreation.
- Cross-tenant and cross-site persisted records are denied before DTO exposure.
- Timer/editor gate behavior remains unchanged in browser/e2e tests.
- RLS read, insert, and update denial tests pass for the new tables.
- Raw-audio retention metadata persists, and transcript purge count remains zero.
- Full standard gate and new `pnpm persistence:visit-capture-adapter` gate pass locally and in CI.

## WO-034 — Durable Review Panels, Selections, Compliance, And Task Persistence

**Objective:** Move suggestions, Visit Selections, compliance issues, History Gap questions, and blocker tasks to Prisma-backed local PostgreSQL while preserving draft-only, human-review-required behavior.

**Scope:**

- Add repository ports and Prisma adapters for `Suggestion`, `VisitSelection`, `ComplianceIssue`, `HistoryGapQuestion`, and `Task`.
- Persist suggestion filtering, accept/remove/manual-add actions, low-confidence override metadata, compliance hard blocks, and MA follow-up blocker tasks.
- Add transaction boundaries for accept/remove operations and blocker task creation.
- Add tenant/site query tests and RLS policy evidence for the review-panel tables.
- Preserve deterministic mock suggestion behavior; do not add live AI.

**Completion criteria:**

- Persisted suggestion and selection state reloads correctly.
- Diagnosis suggestions below 75 percent still require override metadata before acceptance.
- Blocker tasks prevent finalization preparation after reload.
- Cross-tenant/site denial and RLS read/write denial tests pass.
- Browser tests prove panels still expose empty, ready, blocked, permission-denied, and demo fixture states.
- Full standard gate and new `pnpm persistence:review-panel-adapter` gate pass locally and in CI.

## WO-035 — Durable Finalization, Output Metadata, And Writeback Queue Persistence

**Objective:** Move finalization runs, wizard decisions, enhanced note versions, patient summary versions, billing attestations, draft claim previews, export artifact metadata, and EHR writeback queue records to Prisma-backed local PostgreSQL.

**Scope:**

- Add repository ports and Prisma adapters for the finalization/output/writeback graph.
- Persist all six Finalization Wizard steps and immutable signed output metadata.
- Persist draft claim previews with `submittedClaim = false`.
- Persist writeback queue status without enabling live EHR writeback.
- Add transaction boundaries for finalization decisions and Sign & Dispatch preparation.
- Add tenant/site query tests and RLS policy evidence for finalization, output, and writeback tables.

**Completion criteria:**

- A note can proceed through finalization, export metadata creation, and writeback queue preparation using the Prisma-backed local adapter.
- Read-only final note and patient summary versions reload after adapter recreation.
- Draft claim previews remain non-submitted and human-review-required.
- Cross-tenant/site denial and RLS read/write denial tests pass.
- Existing finalization, finalized viewer, export/copy/PDF, and writeback e2e tests pass unchanged.
- Full standard gate and new `pnpm persistence:finalization-output-adapter` gate pass locally and in CI.

## WO-036 — Durable Audit, Domain Events, Support Status, And Broad RLS Completion

**Objective:** Persist audit events, domain events, support status snapshots, feature flags, integration connections, templates, dot phrases, coaching reports, and remaining core records, then complete RLS evidence for every table that is locally persisted.

**Scope:**

- Add durable repositories for audit/event/support/config/coaching records.
- Ensure every state-changing operation emits durable audit/event evidence.
- Expand RLS policy artifacts to all persisted runtime tables.
- Add tenant/site query tests for support, audit export metadata, coaching visibility, and configuration access.
- Add migration and rollback evidence after full persistence expansion.
- Update acceptance readiness so it distinguishes local durable runtime readiness from production launch readiness.

**Completion criteria:**

- All local runtime workflow state has a Prisma-backed local adapter or a documented reason it remains intentionally in-memory.
- Every persisted table has tenant/site query tests or a documented non-tenant-scoped rationale.
- Every tenant-owned persisted table has RLS `USING` and `WITH CHECK` policy evidence.
- Audit/event persistence is durable and queryable for support/compliance roles without exposing PHI improperly.
- Full standard gate and new `pnpm persistence:durable-runtime-readiness` gate pass locally and in CI.
- P7 checkpoint report documents completed persistence scope, remaining production limitations, and open risks.

## WO-037 — Production Identity, SSO, Session, And Tenant Administration Foundation

**Objective:** Replace local header/session scaffolding with a production-shaped identity boundary while preserving existing RBAC/ABAC and tenant/site isolation.

**Scope:**

- Add an identity provider adapter interface for OIDC/SAML/ClinicOS delegation.
- Add production-shaped session validation middleware and local fake IdP tests.
- Persist tenant, site, user, role assignment, clinician linkage, purpose-of-use, and account status behavior.
- Add tenant administration APIs or admin scaffolds only where specified.
- Add MFA/account recovery decision records as explicit deferred or implemented controls.

**Completion criteria:**

- API and browser routes work through the identity boundary in local fake-IdP mode.
- Cross-tenant identity spoofing attempts are denied.
- Role-limited transcript, final note, billing, coaching, support, and audit access still passes tests.
- Session expiration, disabled user, wrong tenant, wrong site, and missing purpose-of-use denial tests pass.
- No real IdP secrets are committed.
- Full standard gate and new `pnpm identity:production-readiness` gate pass locally and in CI.

## WO-038 — Production Secrets, Configuration, And Feature-Flag Governance

**Objective:** Define and enforce production configuration rules for database, storage, identity, observability, EHR, ClinicOS, AI, retention, and feature flags without committing secrets.

**Scope:**

- Add typed configuration validation and startup failure modes.
- Add environment matrix checks for local, test, staging, and production.
- Add secret-source placeholders and prohibited-inline-secret detection.
- Add feature-flag governance for live AI, live EHR writeback, production storage delivery, and destructive deletion.
- Add runbooks for configuration rotation and emergency disablement.

**Completion criteria:**

- Missing or unsafe production config fails closed.
- Local/test config continues to run with synthetic defaults.
- CI proves no `.env`, credential, private key, or production connection string is committed.
- High-risk features cannot be enabled without required approval/config evidence.
- Full standard gate and new `pnpm config:production-readiness` gate pass locally and in CI.

## WO-039 — Azure Blob Live Adapter And Secure Download Service

**Objective:** Implement a real Azure Blob adapter path and secure download service while keeping PHI-bearing payloads disabled until security/privacy review approves production use.

**Scope:**

- Add Azure SDK-backed adapter behind explicit configuration.
- Add emulator or controlled test path where feasible; keep deterministic fake adapter for CI.
- Implement signed download token validation as a server-mediated, permission-checked path.
- Validate tenant/site/object ownership before download metadata or content access.
- Add content checksum, length, content type, retention class, and audit evidence for every artifact.
- Preserve patient-summary internal-detail exclusion.

**Completion criteria:**

- Fake adapter tests and Azure request-construction tests pass in CI.
- Optional local emulator tests are documented and runnable without production credentials.
- Expired, wrong-tenant, wrong-site, wrong-role, and wrong-artifact tokens are denied.
- Audit export, final note, patient summary, copy, and structured export metadata paths work through the storage boundary.
- No public Blob URLs are returned.
- Full standard gate and new `pnpm storage:secure-download-readiness` gate pass locally and in CI.

## WO-040 — Production Retention Deletion, Backup, Restore, And Evidence Controls

**Objective:** Prepare retention deletion for production review by proving backup/restore readiness, approval controls, recovery windows, and audit-safe evidence before any destructive production deletion is allowed.

**Scope:**

- Add raw-audio deletion job integration with the storage adapter.
- Add approval token, approval ID, trace ID, recovery window, and deletion evidence persistence.
- Add Azure Blob soft-delete/versioning policy checks or documented manual evidence requirements.
- Add database backup and restore-readiness checks for metadata.
- Add restore drill documentation and local synthetic restore validation.
- Keep transcript retention indefinite and transcript deletion disabled.

**Completion criteria:**

- Deletion does not run without destructive feature flag and approval evidence.
- Deletion results persist object key, checksum/eTag, approval ID, trace ID, recovery-window status, and outcome.
- Transcript purge count remains zero in tests and DTOs.
- Backup/restore readiness checks pass locally and in CI.
- Runbooks define recovery and emergency stop procedures.
- Full standard gate and new `pnpm retention:production-readiness` gate pass locally and in CI.

## WO-041 — Production Observability, SIEM/APM, And Support Operations Integration

**Objective:** Connect the local observability model to production-shaped log, metric, trace, alert, and support workflows without exposing PHI.

**Scope:**

- Add adapter boundaries for production log, metric, trace, and SIEM sinks.
- Add redaction and structured logging enforcement at API, worker, and adapter boundaries.
- Add request/trace correlation across API, worker, storage, persistence, AI, EHR, and ClinicOS events.
- Add support status views backed by durable operational evidence.
- Add alert taxonomy, severity mapping, and incident runbook hooks.

**Completion criteria:**

- Logs and traces are redacted and correlated in tests.
- Failure states for database, storage, identity, AI, EHR, ClinicOS, and retention jobs are visible to authorized support roles.
- Support users cannot access unauthorized PHI, billing, transcript, or coaching data.
- Local fake observability sink and static production-config verifier pass.
- Full standard gate and new `pnpm observability:production-readiness` gate pass locally and in CI.

## WO-042 — EHR Sandbox Integration And Writeback Queue Hardening

**Objective:** Move from mock EHR adapter behavior to sandbox-ready EHR integration with conservative writeback queue controls and human approval.

**Scope:**

- Add credentialed sandbox configuration boundary without committing credentials.
- Harden athenahealth-first adapter request/response contracts.
- Add idempotent writeback queue processing, retry, dead-letter, and reconciliation evidence.
- Add human approval and permission checks before any writeback leaves AURA Note.
- Add audit events for queued, approved, sent, failed, retried, dead-lettered, and reconciled states.
- Keep live production writeback disabled.

**Completion criteria:**

- Sandbox-mode tests can run with fake credentials and documented optional real-sandbox setup.
- Writeback queue is durable, idempotent, auditable, and recoverable.
- Unauthorized or unapproved writeback attempts are denied.
- Final note and patient summary writeback preserve signed-version linkage.
- Full standard gate and new `pnpm ehr:sandbox-readiness` gate pass locally and in CI.

## WO-043 — ClinicOS Integration Hardening

**Objective:** Harden ClinicOS adapter behavior for tenant identity, VisitGraph/workflow mappings, Charge Integrity/Copilot/Data Cloud boundaries, and embedded-mode operation.

**Scope:**

- Add durable mapping records and tenant/site/user reconciliation behavior.
- Add inbound/outbound event validation and idempotency.
- Add failure, stale mapping, disabled integration, and permission-denied states.
- Add embedded-mode browser/API tests.
- Preserve AURA Note authorization even when ClinicOS supplies identity/context.

**Completion criteria:**

- Standalone and ClinicOS-integrated modes both pass route/API tests.
- Mapping conflicts, stale VisitGraph references, disabled integration, and cross-tenant delegation attempts are denied or safely degraded.
- ClinicOS outbound events are durable, auditable, and retryable.
- Full standard gate and new `pnpm clinicos:integration-readiness` gate pass locally and in CI.

## WO-044 — AI Gateway Production Governance And Evaluation Harness

**Objective:** Prepare the AI gateway for production review with policy enforcement, evaluation coverage, prompt/model governance, and PHI controls. This does not automatically authorize production PHI transfer to external AI.

**Scope:**

- Add prompt registry, model policy registry, and output schema validation for all AI-assisted surfaces.
- Add purpose-of-use, source freshness, tenant policy, role, and feature-flag checks.
- Add evaluation fixtures for unsafe diagnosis, coding, billing, medical-necessity, and unsupported-output refusal.
- Add audit-safe model metadata persistence.
- Add optional external provider boundary that remains disabled without approved configuration.

**Completion criteria:**

- AI outputs remain draft/candidate/suggestion only.
- Unsafe autonomous diagnosis, coding, billing, charge, claim, medical-necessity, or order behavior is rejected in tests.
- PHI scrubber/redaction/rejection tests pass before any provider invocation boundary.
- Prompt/model/version metadata is audit-safe and durable.
- Full standard gate and new `pnpm ai:governance-readiness` gate pass locally and in CI.

## WO-045 — Security, Privacy, Compliance, And Threat-Model Remediation

**Objective:** Convert the implementation evidence into a security/privacy/compliance review package and remediate findings that block limited production readiness.

**Scope:**

- Produce threat model for identity, persistence, storage, AI, EHR, ClinicOS, support, audit, and retention deletion.
- Review RBAC/ABAC matrix against implemented checks.
- Review data retention, PHI boundaries, audit evidence, backup/restore, and vendor dependencies.
- Add remediation work for high-priority gaps.
- Document any founder/legal/security decisions required before launch.

**Completion criteria:**

- Review package separates implemented, synthetic, disabled, deferred, prohibited, and decision-required behavior.
- High-severity remediation items are fixed or tracked as blocking `SPEC_GAP`s.
- No production launch claim is made if compliance-critical gaps remain.
- Full standard gate and new `pnpm security:review-readiness` gate pass locally and in CI.
- P9 checkpoint report documents external-review readiness and blockers.

## WO-046 — Final UX, Design-System, Accessibility, And Visual Regression Hardening

**Objective:** Move the browser-testable operational shell toward production-quality UX, accessibility, and visual stability.

**Scope:**

- Align UI with final design-system tokens and Figma decisions when available.
- Add visual regression baselines for critical routes.
- Expand accessibility checks beyond smoke coverage.
- Harden keyboard navigation, focus management, empty/loading/failed/blocked/permission-denied states, and mobile layouts.
- Review patient-facing, clinician-facing, billing-facing, support-facing, and admin-facing copy.

**Completion criteria:**

- Critical routes pass visual regression and accessibility gates.
- No patient-facing screen exposes internal billing, coaching, audit, or revenue details.
- Controls are keyboard-operable and screen-reader-labeled.
- Browser tests cover responsive layouts without horizontal overflow.
- Full standard gate and new `pnpm ux:production-readiness` gate pass locally and in CI.

## WO-047 — Deployment Automation, Environment Promotion, And Release Controls

**Objective:** Add production-shaped deployment automation and controlled environment promotion without embedding secrets in the repo.

**Scope:**

- Define infrastructure-as-code or deployment manifests for staging and production.
- Add deployment smoke tests and rollback procedures.
- Add release versioning, changelog, migration ordering, and feature-flag rollout controls.
- Add environment-specific health checks.
- Add release approval gates and emergency disablement instructions.

**Completion criteria:**

- Staging deployment can be built and validated from CI/CD without production secrets in source control.
- Rollback and migration rollback procedures are tested in staging or documented as blocked.
- Health checks cover API, web, worker, database, storage, identity, and integration disabled states.
- Full standard gate and new `pnpm deployment:readiness` gate pass locally and in CI.

## WO-048 — Operational Tabletop, Support Playbooks, And Incident Drill Evidence

**Objective:** Prove that support, privacy, security, and engineering operations can handle likely production incidents.

**Scope:**

- Run tabletop scenarios for database outage, storage outage, identity outage, failed retention deletion, wrong-tenant access attempt, audit export request, EHR writeback failure, and unsafe AI output.
- Add or update support runbooks with detection, triage, containment, recovery, communication, and evidence steps.
- Add synthetic incident fixtures and support dashboard states.
- Add post-incident evidence and audit export examples using synthetic data.

**Completion criteria:**

- Runbooks cover each tabletop scenario with owner, severity, response steps, and rollback/recovery path.
- Support surfaces show safe degraded states.
- Incident evidence contains no real PHI or credentials.
- Full standard gate and new `pnpm ops:tabletop-readiness` gate pass locally and in CI.

## WO-049 — Beta Pilot Readiness Package

**Objective:** Prepare a limited beta/pilot readiness package for a controlled tenant using synthetic or sandbox-only data until production approvals are complete.

**Scope:**

- Define pilot tenant setup checklist.
- Define user roles, training flows, disabled feature list, and support escalation path.
- Add pilot smoke tests and acceptance scripts.
- Add data-handling and no-real-PHI guardrails if the pilot is still synthetic/sandbox.
- Add go/no-go checklist with explicit founder and security/privacy approvals.

**Completion criteria:**

- Pilot package identifies enabled, disabled, deferred, and prohibited capabilities.
- Smoke tests pass in the target environment.
- Support and rollback contacts are documented.
- No pilot uses production PHI unless all earlier security/privacy/storage/identity/database approvals are complete.
- Full standard gate and new `pnpm pilot:readiness` gate pass locally and in CI.

## WO-050 — Limited Production Launch Gate And Post-Launch Monitoring

**Objective:** Establish the final controlled launch gate for a limited production release after all required security, privacy, operational, and technical approvals are complete.

**Scope:**

- Add production launch checklist and signoff artifact.
- Confirm all high-risk feature flags are configured safely.
- Confirm backup/restore, retention, audit export, support, observability, and incident response are operational.
- Add post-launch monitoring dashboard and rollback criteria.
- Add first-week production support plan.

**Completion criteria:**

- All P7 through P10 checkpoint criteria are met or explicitly waived by the founder with documented risk.
- Security/privacy/compliance blockers are closed.
- Production deployment, rollback, backup/restore, retention, identity, storage, observability, support, and incident-response evidence is complete.
- No prohibited autonomous clinical, coding, billing, claim, or medical-necessity behavior is enabled.
- Launch signoff is documented in a release report.

## WO-051 — Claim Submission And Payer Integration Decision Gate

**Objective:** Decide whether live claim submission or payer integration belongs in AURA Note v1. This is a decision and specification gate, not an implementation authorization.

**Scope:**

- Document current draft-claim-preview behavior and human-review boundaries.
- Identify payer integration, claim submission, medical necessity, denial management, and charge finalization requirements if the founder wants them in a later release.
- Produce legal/compliance/security/billing questions that must be answered before any implementation.
- Create `SPEC_GAP` entries for missing decisions if live billing behavior is requested.

**Completion criteria:**

- The decision package clearly states whether live claim submission remains prohibited, deferred, or approved for a later separately scoped work order.
- No live claim submission code is added by this work order.
- Any approved future billing work has explicit human approval, audit, compliance, and rollback requirements before implementation.

## Overall completion criteria

AURA Note can be considered production-launch-ready only when all of the following are true:

- All promoted work orders through the selected launch gate are complete, merged, and passing CI.
- Local and staging gates prove durable persistence for every production runtime workflow.
- Tenant/site isolation is enforced at API, repository, and database/RLS layers for every tenant-owned persisted table.
- Production identity, session, role, purpose-of-use, and site-scope controls are implemented and tested.
- Production storage delivery uses secure, permission-checked, non-public download paths with audit evidence.
- Raw-audio deletion is approval-gated, recoverable within the documented window, audited, and backed by tested backup/restore procedures.
- Transcripts retain indefinitely unless an approved tenant policy changes that behavior.
- Audit events and domain events are durable, queryable by authorized roles, and redacted appropriately.
- Observability, support, incident response, and runbooks are connected to production-ready evidence.
- EHR and ClinicOS integrations are sandboxed or production-approved with disabled states, retry behavior, auditability, and human approval where required.
- AI remains draft-only and human-review-required, with PHI, model governance, evaluation, and refusal controls in place.
- Accessibility, responsive behavior, visual regression, and UX copy have production review evidence.
- Security, privacy, compliance, backup/restore, vendor, and BAA requirements are reviewed and blockers are closed.
- No autonomous diagnosis, coding finalization, charge finalization, medical-necessity determination, claim submission, or prohibited patient-facing financial conclusion is enabled.

## Promotion instructions

To begin implementation, promote only the next work order:

1. Create `work_orders/WO-033_durable_visit_capture_persistence.md`.
2. Add `WO-033` to `work_orders/README.md`.
3. Add `WO-033: todo` to `repo_status.json` and set `next_work_order` to `WO-033`.
4. Implement only `WO-033` until its completion criteria pass.
5. Update `RUN_LOG.md`, `repo_status.json`, and relevant docs.
6. Open a reviewable PR and merge only after local gates and GitHub Actions pass.

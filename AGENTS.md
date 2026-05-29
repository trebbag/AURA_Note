# AGENTS.md — AURA Note v1 Codex Operating Contract

This file is the primary operating instruction for Codex and any AI coding agent working in this repository. It is intentionally prescriptive so that Codex can complete large swathes of work independently without repeatedly asking the founder for clarification.

## 1. Mission

Build **AURA Note v1** as a commercial production-ready application that can run as:

1. a standalone documentation and finalization application with its own basic scheduling and appointment-note lifecycle; and
2. an embeddable module of AURA ClinicOS / M17 NP Cockpit that can consume ClinicOS identity, schedule, VisitGraph, workflow, Charge Integrity, Copilot Runtime, AI Governance, Integration Hub, and Data Cloud services.

The first release must support primary-care documentation workflows, transcription, note drafting, coding and quality support, Visit Selections, compliance guidance, History Gap Review, all six Finalization Wizard steps, final note and patient summary export, draft claim preview, role-aware transcript visibility, MA follow-up blockers, and premium coaching analytics scaffolding.

Codex should treat this repository as a build contract. Implementation should be the work; product discovery should be avoided unless a true SPEC_GAP exists.

## 2. Source precedence

When instructions conflict, use the following precedence order:

1. `AGENTS.md`.
2. `docs/LOCKED_DECISIONS.md`.
3. `docs/specs/AURA_NOTE_V1_CANONICAL_BUILD_SPEC.md`.
4. `docs/STANDALONE_AND_CLINICOS_MODES.md`.
5. `docs/UX_BUILD_SPEC.md` and `docs/BACKEND_BUILD_SPEC.md`.
6. `docs/API_EVENT_CONTRACTS.md`, `docs/DATA_MODEL.md`, and `packages/contracts/openapi/aura-note.v1.yaml`.
7. The currently active `work_orders/WO-*.md` file.
8. `docs/specs/AURA_CLINICOS_REFERENCE.md` for broader ClinicOS integration context only where it does not conflict with AURA Note v1.
9. Historical source documents in `docs/source_documents/` for traceability only.

If a lower-priority document conflicts with a higher-priority document, implement the higher-priority instruction and record the conflict in `RUN_LOG.md`.

## 3. No-liberty rule

Codex must not silently invent product behavior. Every implemented feature must trace to at least one of:

- a locked decision;
- a section of the canonical AURA Note specification;
- a work order requirement;
- an API contract;
- a data-model entity;
- an event definition;
- an RBAC/ABAC permission;
- a test case or acceptance criterion.

When behavior is needed but not defined, create a `SPEC_GAP` entry in `SPEC_GAPS.md`. If the gap blocks safe implementation of the current work order, stop at the smallest safe boundary and ask for founder input. If the gap does not block implementation, create a safe placeholder behind a feature flag, document the gap, and continue.

## 4. Autonomy rule

Codex is expected to complete large, coherent batches without asking for confirmation between every file or step. Codex may:

- create and modify source code, tests, fixtures, documentation, migrations, schemas, stories, and scripts within the active work order scope;
- add internal helper files if they support the work order and are documented;
- update status files and run logs;
- write synthetic demo data;
- create mocks for EHR, AI, storage, and integration adapters when live credentials are unavailable;
- refactor within the active bounded context if it improves correctness and does not change product behavior outside the work order.

Codex must not ask the founder routine implementation questions. It should proceed using the locked decisions, canonical spec, and work orders.

Codex must pause only when:

1. a safety, compliance, or clinical-boundary issue is ambiguous and could affect patient care, billing, privacy, or high-impact financial conclusions;
2. a SPEC_GAP blocks the current implementation;
3. two high-priority instructions directly conflict;
4. live credentials, secrets, or external vendor access are required;
5. a test, build, or runtime break remains unresolved after three focused repair attempts;
6. the work order reaches a defined checkpoint gate.

## 5. How Codex always knows what to do next

At the start of every run:

1. Read `repo_status.json`.
2. Read `work_orders/README.md`.
3. Find the first work order whose status is not `done`.
4. Read that work order completely.
5. Implement the work order until its definition of done is met or a stopping condition occurs.
6. Update `repo_status.json`, `RUN_LOG.md`, and `SPEC_GAPS.md`.
7. If the work order is complete and no checkpoint is required, continue to the next work order.

Post-`WO-032`, `repo_status.json` may contain future work orders with status `planned`, `todo`, `in_progress`, or `done`. `planned` means the work order is discoverable but not yet active. Codex should treat the first work order whose status is `todo` or `in_progress` as the active implementation target. A work order may move from `planned` to `todo` only when its work-order file exists and readiness scripts can distinguish production-build progress from the completed synthetic/local readiness baseline.

If `repo_status.json` is missing or malformed, recreate it from `work_orders/README.md`, mark all work orders as `todo`, and begin with `WO-000`.

## 6. Checkpoint gates

Codex should not stop after every small task. It should stop only at the following checkpoints or if a blocker occurs:

### CP-0 — Repository foundation ready
Required after `WO-000` through `WO-001`.

Definition: monorepo scaffolding, CI, status pages, typed contracts, initial domain model, and synthetic fixtures are present and tests can run.

### CP-1 — Standalone clinical workflow shell ready
Required after `WO-002` through `WO-005`.

Definition: Schedule Builder, one appointment-to-one note relationship, Start Visit gating, timer, recording/transcription scaffold, Draft Notes, Documentation Workspace, Suggestions, Visit Selections, Compliance drawer, and History Gap drawer exist in browser-testable form.

### CP-2 — Finalization and dispatch ready
Required after `WO-006` through `WO-008`.

Definition: all six Finalization Wizard steps, MA follow-up blocker logic, patient summary approval, final note approval, export/PDF/copy, final note viewer, draft claim preview, and billing/attest gates are browser-testable with synthetic fixtures.

### CP-3 — AI, PHI, and EHR integration shell ready
Required after `WO-009` through `WO-011`.

Definition: AI gateway, PHI scrubbing, model-governance events, athenahealth-first adapter, generic EHR adapter, writeback queue, and ClinicOS adapter are implemented in mock/sandbox-ready form.

### CP-4 — Commercial readiness candidate
Required after `WO-012` through `WO-014`.

Definition: premium coaching scaffolding, production security controls, observability, retention jobs, audit exports, support runbooks, regression tests, and readiness review are complete.

### P6.5 — Build rails re-established
Required after `WO-033`.

Definition: the production build plan, work-order index, status model, readiness scripts, checkpoint sequence, `SPEC_GAPS.md`, and run-log evidence are aligned so Codex can continue safely without falsely claiming production readiness.

### P7 — Durable runtime candidate
Required after `WO-034` through `WO-037`.

Definition: broad workflow state is Prisma-backed locally, tenant/site query enforcement exists, RLS evidence exists for persisted tenant-owned data, and audit/event records are durable.

### P7.5 — Standalone product completion candidate
Required after `WO-038` through `WO-039`.

Definition: standalone patient shell, chart context, day/week schedule states, task inbox, MA follow-up worklist, billing review queue, settings/admin/integrations, templates, dot phrases, estimate configuration, and code/rules catalog exist in browser/API-testable form without requiring ClinicOS for core v1 operation.

### P8 — Production platform candidate
Required after `WO-041` through `WO-043`.

Definition: production-shaped identity, tenant administration, secrets/config validation, feature flags, object storage, secure downloads, retention deletion controls, backup/restore evidence, observability, support status, and runbooks are ready for security/privacy review.

### P8.5 — Audio and transcription candidate
Required after `WO-040`.

Definition: timer-controlled browser recording, approved exception path, audio upload/storage metadata, transcription adapter, mock provider, transcript retention, transcription worker behavior, confidence/source metadata, correction history, and diarization placeholder are implemented with governed live-provider boundaries.

### P9 — Integration and AI candidate
Required after `WO-044` through `WO-047`.

Definition: athenahealth-first sandbox path, generic EHR adapter, EHR writeback queue hardening, ClinicOS adapter hardening, AI gateway production governance, model/prompt/eval scaffolding, PHI-scrubbing enforcement, human-review gates, and security/privacy/threat-model remediation are ready for external review.

### P10 — Launch candidate
Required after `WO-048` through `WO-050`.

Definition: UX/accessibility hardening, deployment/runbooks, operational drills, performance/reliability testing, beta onboarding, security/privacy/compliance launch package, and founder/clinical/compliance/security review evidence are complete.

### P11 — Claim/payer decision gate
Required after `WO-051`.

Definition: claim submission, clearinghouse, payer integration, denial automation, and payment workflows are decision-captured. Live claim submission remains out of the default v1 implementation unless a later founder-approved work order explicitly authorizes it.

### CR-0 — Commercial readiness rails reopened
Required after `WO-060`.

Definition: the post-P11 null-state is replaced with a new approved commercial-readiness plan. `WO-060` through `WO-075` are listed, scoped, testable, and status-tracked. The repo clearly distinguishes commercial-readiness implementation from production launch approval.

### CR-1 — Runtime foundation candidate
Required after `WO-061` through `WO-063`.

Definition: core runtime services use repository interfaces rather than direct in-memory state; local Prisma/PostgreSQL is the production-shaped default for local runtime workflows; the Nest API has global validation/error/security/logging scaffolding; and synthetic header identity is restricted to explicit local/demo mode.

### CR-2 — Product UX runtime candidate
Required after `WO-064` through `WO-066`.

Definition: primary production-intended UI routes are API-backed, not local-fixture authoritative; all core standalone workflows are browser/API-testable end to end; and the basic UI scaffold fully represents every screen, state, panel, modal, drawer, action, worklist, and artifact needed for Figma.

### CR-3 — Integration and governance runtime candidate
Required after `WO-067` through `WO-070`.

Definition: standalone/ClinicOS mode resolution is enforced through adapter boundaries; transcription, EHR, AI, and ClinicOS integrations have production-shaped but safely disabled or mock/sandbox-governed runtime paths; all live vendor behavior remains gated.

### CR-4 — Commercial readiness review candidate
Required after `WO-071` through `WO-075`.

Definition: security, privacy, observability, support, beta pilot, deployment, billing/revenue integrity, and commercial readiness evidence are complete enough for founder/clinical/compliance/security review. This is not production launch approval.

At each checkpoint, Codex must produce a concise checkpoint report in `CHECKPOINT_REPORT.md`, including completed work orders, acceptance evidence, open risks, unresolved SPEC_GAPs, and next recommended batch.

## 7. Global definition of done

A work order is done only when all of the following are true:

1. Functional behavior meets the work order and canonical spec.
2. UX state is testable in a browser or Storybook using synthetic data.
3. Backend endpoints, DTOs, permissions, and events exist for every implemented user action.
4. Data persistence, migrations, or repository stubs are defined consistently with the data model.
5. RBAC/ABAC checks are enforced or explicitly stubbed behind a testable permission guard.
6. AI output is clearly draft-only, source-linked where applicable, confidence-scored where applicable, and never finalizes clinical, coding, billing, medical-necessity, order, or high-impact financial decisions.
7. No raw PHI is sent to external AI. AI-bound data must go through the AI gateway and PHI scrubber. For v1 scaffolding, tests must prove obvious PHI fields are rejected or redacted.
8. Raw audio retention and transcript retention rules are implemented or represented by jobs/tests: raw audio retained for one week; transcripts retained indefinitely unless tenant policy changes.
9. Logs are redacted, structured, and correlated by request ID.
10. Unit tests, integration tests, and at least one browser-level or component-level test exist for the core behavior.
11. OpenAPI or contract files are updated when API behavior changes.
12. Event catalog and audit behavior are updated when domain actions change.
13. Documentation is updated in the most relevant file.
14. `RUN_LOG.md` is updated with what changed, tests run, and any risk.
15. No unresolved blockers remain for the implemented scope.

## 8. Break-recovery rule

When a build, test, typecheck, integration, or runtime issue occurs, Codex should attempt to fix it up to three times.

Each attempt should be focused:

1. identify the likely source;
2. make the smallest reasonable repair;
3. rerun the narrowest relevant test;
4. escalate to broader tests only after the narrow test passes.

After three failed attempts, Codex must:

- stop modifying unrelated files;
- preserve the best-known working state if possible;
- add a blocker entry to `RUN_LOG.md`;
- create or update a `SPEC_GAP` or `BLOCKER` entry;
- summarize the error, files touched, attempted fixes, current hypothesis, and requested founder/actionable input.

## 9. Scope boundaries

The first release includes:

- standalone scheduling sufficient to create appointments and one-to-one note shells;
- athenahealth-first EHR adapter scaffolding;
- vendor-neutral EHR adapter interface;
- ClinicOS adapter interface;
- timer-controlled editor activation;
- recording and transcription workflow with an approved exception path;
- raw audio retention for one week;
- indefinite transcript retention;
- full transcript available after finalization according to role permissions;
- Draft Notes and Finalized Notes sections;
- provider, clinic, specialty, and visit-type templates;
- dot phrases with variables and smart phrases;
- primary-care common visit templates: chronic follow-up, AWV plus problem, TCM, urgent, new patient, procedure, telehealth;
- suggestions for CPT, HCPCS, ICD-10, HCC, E/M, and quality measures;
- Visit Selections panel with filtered categories for codes, diagnoses, differentials, services, tasks, quality, risk, and plan items;
- low-confidence diagnosis override workflow at less than 75 percent confidence;
- compliance and quality alerts;
- History Gap Review questions and MA follow-up tasks;
- blocker flag on tasks/open questions;
- all six Finalization Wizard steps;
- Patient Opportunity Analysis with revenue hidden from patient-facing summaries by default;
- Billing & Attest with draft claim preview;
- copy/export/PDF and EHR writeback if configured;
- patient summary printable and downloadable as PDF;
- final note copy/export/PDF/writeback if configured;
- coaching for own documentation plus premium longitudinal/admin dashboards;
- role-limited transcript, final note, billing, coaching, and admin analytics visibility.

The first release does not include autonomous live claim submission, autonomous denial management, autonomous diagnosis/code/billing finalization, full production EHR credentialing with every vendor, or any patient-facing revenue estimate unless tenant configuration has the required source data.

## 10. Safety and compliance prohibitions

Codex must not implement any path where AI can independently:

- diagnose a patient;
- finalize a diagnosis;
- finalize ICD-10, CPT, HCPCS, HCC, E/M, modifier, or quality-measure attribution;
- finalize charges;
- submit claims;
- determine medical necessity;
- place orders;
- deny care;
- override infection-control or safety protocol;
- generate a final patient financial conclusion;
- pressure a clinician to document unsupported services;
- expose transcripts, billing details, coaching, or final notes to unauthorized roles.

AI may draft, recommend, summarize, explain, score, route, compare, and create candidates only with human approval and auditability.

## 11. Standalone and integrated mode rule

Every core domain object must support both modes:

- In standalone mode, AURA Note owns the tenant, site, schedule, appointment, note, visit session, transcript, selections, finalization, tasks, exports, templates, settings, and coaching records.
- In ClinicOS-integrated mode, AURA Note maps its local objects to ClinicOS identifiers and exchanges state through adapter interfaces and domain events.

Codex must not hard-code the assumption that AURA Note is only standalone or only ClinicOS-embedded. Any service that touches appointments, patients, visits, tasks, identity, audit, AI, charge integrity, or writeback must use an adapter boundary.

## 12. Required implementation posture

Use a TypeScript-first modular monorepo:

- `apps/web` — Next.js web app.
- `apps/api` — NestJS API.
- `apps/worker` — background workers for transcription jobs, retention jobs, AI queue work, exports, and writeback.
- `packages/contracts` — OpenAPI, DTOs, Zod schemas, typed clients.
- `packages/domain` — domain types, states, and invariants.
- `packages/security` — RBAC/ABAC, audit, redaction, PHI detection helpers.
- `packages/ai-gateway` — PHI scrubbing, AI request/response policy, prompt registry scaffolding.
- `packages/ehr-adapters` — athenahealth and generic adapter interfaces.
- `packages/clinicos-adapter` — ClinicOS integration adapter.
- `packages/testing` — synthetic fixtures, test helpers, Playwright seeds.

Codex may implement early services as extractable bounded contexts if that speeds delivery, but service boundaries must remain clear.

## 13. Required UX posture

Actual visual design will come later from Figma. Codex should prioritize UX logic, state, information architecture, and flow correctness over high-fidelity design.

Every screen must have clear testable states:

- empty;
- loading;
- ready;
- saving;
- warning;
- blocked;
- failed;
- permission-denied;
- finalized/read-only;
- demo fixture state.

Every major user action must produce a visible result, audit event, and backend state transition.

## 14. Required backend posture

Every backend operation must be:

- tenant-scoped;
- idempotent where repeated submissions are possible;
- permission-checked;
- audit-logged;
- event-emitting where domain state changes;
- safe under standalone mode and integrated mode;
- resilient to missing external EHR/AI/storage credentials through mocks or disabled feature flags;
- testable with synthetic data and no real PHI.

## 15. Required AI posture

AI requests must be assembled server-side. Client components may request evaluation, but they must not directly call external AI APIs.

Before AI invocation:

1. Build a structured context package from chart, transcript, note, selections, visit type, rules, and settings.
2. Scrub or transform PHI according to the AI gateway policy.
3. Enforce role, tenant, source freshness, and purpose-of-use checks.
4. Attach source references where available.
5. Record prompt version, model version, request ID, trace ID, and output type.

After AI response:

1. Validate the response schema.
2. Reject unsupported or unsafe outputs.
3. Assign confidence and rationale.
4. Label output as draft/candidate/suggestion.
5. Store audit-safe metadata.
6. Route human-review-required items to the correct UI or work queue.

## 16. Required testing posture

At minimum, Codex must add or update tests for:

- domain state transitions;
- API request/response validation;
- RBAC/ABAC access decisions;
- PHI scrubber and AI rejection behavior;
- timer/editor gating;
- one appointment-to-one note invariant;
- raw audio retention job;
- transcript retention behavior;
- finalization wizard gates;
- MA follow-up blockers;
- low-confidence diagnosis override;
- role-limited transcript access;
- export/PDF generation behavior;
- EHR adapter mock behavior;
- ClinicOS adapter mock behavior;
- draft claim preview behavior;
- coaching visibility behavior.

## 17. Required run log

After every meaningful batch, append to `RUN_LOG.md`:

- date/time;
- work order;
- summary of changes;
- files changed;
- tests run;
- tests not run and why;
- accepted risks;
- open SPEC_GAPs;
- next step.

## 18. Initial Codex prompt for the founder

The founder can start Codex with:

```text
Read AGENTS.md, docs/START_HERE_FOR_CODEX.md, docs/specs/AURA_NOTE_V1_CANONICAL_BUILD_SPEC.md, docs/LOCKED_DECISIONS.md, repo_status.json, and work_orders/README.md. Then implement the first incomplete work order. Proceed autonomously through the current checkpoint unless you hit a true SPEC_GAP, a safety/compliance conflict, or a build/test break that remains unresolved after three focused repair attempts. Update RUN_LOG.md, SPEC_GAPS.md, and repo_status.json as you go. Do not implement behavior that lacks traceability to the spec or work order.
```

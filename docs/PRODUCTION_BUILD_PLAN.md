# AURA Note production build plan

## Purpose

This document is the post-`WO-032` production build rail for AURA Note. It converts the remaining work into sequential, reviewable work orders with explicit safety boundaries, checkpoint gates, completion criteria, and stop conditions.

This is not a production-readiness claim. The current baseline is strong synthetic/local-first scaffolding with local PostgreSQL and storage readiness evidence for bounded slices. AURA Note is not yet commercially production-ready, not yet fully durable across the workflow, and not yet live against production identity, production object storage, production EHR, production AI, production PHI storage, or production claim submission.

## Current baseline

- `WO-000` through `WO-032` are complete and must not be renumbered.
- The schedule/note slice has local Prisma/PostgreSQL adapter evidence, tenant/site scoped query tests, and core RLS evidence.
- Storage-backed export/audit metadata and raw-audio deletion behavior are synthetic/local readiness scaffolds only.
- Most workflow state still uses in-memory/local synthetic repositories.
- `acceptance:readiness` proves CP-4/post-CP4 synthetic readiness. It must not be used as a production launch readiness claim.
- Future production work must be promoted deliberately through numbered work orders and status updates.

## Universal safety boundaries

Every future work order must preserve these boundaries:

- AI may draft, summarize, suggest, score confidence, identify missing evidence, create candidate items/tasks, draft patient summaries, draft payer-readable support language, route work for human review, create draft claim previews, and create coaching feedback.
- AI and automation must not diagnose, finalize diagnoses/codes/charges/claims, submit claims, determine medical necessity, place orders, deny care, override safety/compliance protocols, or create final patient financial conclusions.
- No raw PHI may be sent to external AI.
- No production storage deletion may run without approved retention, backup, restore, soft-delete/versioning, approval, recovery, and audit evidence.
- ClinicOS context must never bypass AURA Note permissions.
- athenahealth must remain behind a vendor-neutral EHR adapter boundary.
- No real credential, `.env`, private key, production connection string, or real patient data may be committed.

## Standard work-order gate

Unless a work order states otherwise, completion requires:

- implementation traced to `AGENTS.md`, locked decisions, canonical specs, work order, data model, API/event contracts, and RBAC/ABAC;
- positive and negative unit/integration tests;
- browser/e2e coverage where UX or route behavior changes;
- OpenAPI/DTO/event/data-model updates when public behavior changes;
- tenant/site scoping and permission checks for state-changing operations;
- audit/domain event evidence for state-changing operations;
- idempotency where duplicate submissions are plausible;
- PHI/security tests for sensitive data paths;
- standalone mode preserved;
- ClinicOS-integrated mode supported through adapters or safely degraded;
- `RUN_LOG.md`, `repo_status.json`, `CHECKPOINT_REPORT.md` at checkpoints, and relevant docs updated;
- CI and the relevant local gates passing before a work order is marked done.

Default local gate:

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
pnpm production:readiness
pnpm acceptance:readiness
node scripts/status.js
git diff --check
```

## Checkpoint sequence

- **P6.5 — Build Rails Re-established:** required after `WO-033`.
- **P7 — Durable Runtime Candidate:** required after `WO-034` through `WO-037`.
- **P7.5 — Standalone Product Completion Candidate:** required after `WO-038` through `WO-039`.
- **P8 — Production Platform Candidate:** required after `WO-041` through `WO-043`.
- **P8.5 — Audio and Transcription Candidate:** required after `WO-040`.
- **P9 — Integration and AI Candidate:** required after `WO-044` through `WO-047`.
- **P10 — Launch Candidate:** required after `WO-048` through `WO-050`.
- **P11 — Claim/Payer Decision Gate:** required after `WO-051`.
- **CR-0 — Commercial Readiness Rails Reopened:** required after `WO-060`.
- **CR-1 — Runtime Foundation Candidate:** required after `WO-061` through `WO-063`.
- **CR-2 — Product UX Runtime Candidate:** required after `WO-064` through `WO-066`.
- **CR-3 — Integration and Governance Runtime Candidate:** required after `WO-067` through `WO-070`.
- **CR-4 — Commercial Readiness Review Candidate:** required after `WO-071` through `WO-075`.

Checkpoint reports must list completed work orders, evidence, tests, open risks, active and deferred `SPEC_GAP`s, and the next recommended batch.

## Frontend Runtime Integration Gate

This is a P10 launch-blocking gate. AURA Note cannot claim launch-candidate readiness until every production-intended browser route has been converted from scaffold/demo-local state to typed API-client runtime behavior backed by persisted backend state.

Requirements:

- Every production-intended screen must use typed API clients generated from or validated against `packages/contracts` and `packages/contracts/openapi/aura-note.v1.yaml`.
- Production routes must read and mutate persisted backend state through the API. Synthetic local React state is allowed only in Storybook, fixture-only demo routes, unit/component tests, or explicitly labeled demo mode.
- Each affected route must expose `loading`, `empty`, `ready`, `saving`, `failed`, `permission-denied`, and `read-only` states backed by API responses, persisted records, or documented mocks when a live vendor dependency is intentionally disabled.
- Any documented mock used for a route state must specify why the live dependency is unavailable, the production adapter boundary it stands in for, and the later work order or approval needed to replace it.
- State-changing UI actions must call backend operations that are tenant/site scoped, permission checked, audit/event emitting, and idempotent where duplicate submissions are plausible.
- Playwright coverage must exercise at least one seeded backend-backed workflow from appointment creation through documentation/finalization/export before P10 can be claimed. The test must prove browser state is driven by persisted backend records after reload or API refetch, not only by in-page React state.
- `pnpm frontend:runtime-integration-readiness` or an equivalent named gate must be added before P10 and run in CI before `pnpm launch:readiness`.

This gate does not authorize live EHR writeback, live AI, live transcription, production PHI storage, charge finalization, medical-necessity determination, or claim submission. Those remain governed by their own work orders and safety gates.

## WO-033 — Production Build Rails And Readiness Controls

- **Objective:** Put the remainder of the build back on rails without implementing new product behavior.
- **Why this exists:** The repo completed `WO-032`, but future work was still mostly planning-only and the readiness scripts treated synthetic readiness as the terminal state.
- **Prerequisites:** `WO-000` through `WO-032` complete on `main`.
- **In scope:** update `AGENTS.md`, `work_orders/README.md`, `repo_status.json`, `SPEC_GAPS.md`, `CHECKPOINT_REPORT.md`, `RUN_LOG.md`, this plan, and readiness scripts so future work orders are discoverable and synthetic readiness is separated from production-build readiness.
- **Out of scope:** runtime product changes, production credentials, live vendor integrations, durable workflow expansion.
- **UX requirements:** none beyond documenting UX coverage expectations for future work.
- **Backend/API requirements:** add readiness-script guardrails only.
- **Data model/persistence requirements:** no schema changes.
- **Event/audit requirements:** no runtime events; document run-log evidence.
- **RBAC/ABAC requirements:** preserve existing matrix and future enforcement requirements.
- **Standalone-mode behavior:** unchanged.
- **ClinicOS-integrated behavior:** unchanged.
- **AI/PHI/security requirements:** preserve prohibitions and deferred production decisions.
- **Testing requirements:** planning/readiness script tests plus current full gate.
- **Required scripts/gates:** `pnpm production:readiness`, `pnpm acceptance:readiness`, default local gate.
- **Definition of Done:** future work orders `WO-034` through `WO-051` are sequenced; `WO-034` is the next incomplete work order; scripts tolerate future planned/todo work without false production claims; `SPEC_GAPS.md` reflects post-`WO-032` state.
- **Stop conditions:** script conflict that would break completed readiness evidence; safety/compliance conflict in future sequencing.
- **Risks and deferred decisions:** future work depends on later security/privacy/vendor reviews and may create active `SPEC_GAP`s when implementation reaches live identity, AI, EHR, storage, or claim strategy.

## WO-034 — Durable Visit Capture Runtime Persistence

- **Objective:** Persist visit sessions, recording assets, transcripts, and transcript segments through Prisma/local PostgreSQL.
- **Why this exists:** Timer, recording, and transcript scaffolds are browser/API-testable but not durable.
- **Prerequisites:** `WO-033`; existing visit/session schema and local PostgreSQL evidence.
- **In scope:** repository ports/adapters; start/pause/resume/stop persistence; recording exception persistence; transcript segment append/retrieval; transaction and error-path tests; tenant/site query tests; RLS for visit capture tables.
- **Out of scope:** browser microphone capture, live transcription provider, production PHI storage, production deletion.
- **UX requirements:** current timer/editor/transcript states continue to work after adapter recreation.
- **Backend/API requirements:** persisted API harness for visit controls and transcript state; idempotent session writes where applicable.
- **Data model/persistence requirements:** `VisitSession`, `RecordingAsset`, `Transcript`, `TranscriptSegment` durable repositories.
- **Event/audit requirements:** durable metadata for visit and transcript state changes.
- **RBAC/ABAC requirements:** treating clinician/admin access; transcript visibility remains role-limited.
- **Standalone-mode behavior:** standalone owns visit capture records.
- **ClinicOS-integrated behavior:** adapter-safe local records map to ClinicOS visit identifiers without permission bypass.
- **AI/PHI/security requirements:** no raw PHI to external AI; logs redacted; transcript payloads remain local synthetic unless future approved.
- **Testing requirements:** reload, transaction, cross-tenant/site denial, RLS read/write denial, browser regression.
- **Required scripts/gates:** `pnpm persistence:visit-capture-adapter` plus default gate.
- **Definition of Done:** visit capture state is locally durable and tenant/RLS-evidenced; current UX behavior unchanged.
- **Stop conditions:** unresolved schema mismatch or PHI persistence ambiguity.
- **Risks and deferred decisions:** production PHI database policy and live transcription remain deferred.

## WO-035 — Durable Review Panels, Selections, Compliance, And Task Persistence

- **Objective:** Persist Suggestions, Visit Selections, Compliance issues, History Gap questions, and blocker Tasks.
- **Why this exists:** Review-panel workflow currently uses synthetic process state.
- **Prerequisites:** `WO-034`; review-panel Prisma schema relations.
- **In scope:** durable repositories, accept/remove/manual-add transactions, low-confidence override persistence, blocker task creation/adjudication, tenant/site tests, RLS.
- **Out of scope:** live AI suggestion generation, autonomous diagnosis/coding/billing finalization.
- **UX requirements:** panels preserve empty/loading/ready/blocked/permission-denied/demo states after reload.
- **Backend/API requirements:** idempotent review actions, validation, permission gates.
- **Data model/persistence requirements:** `Suggestion`, `VisitSelection`, `ComplianceIssue`, `HistoryGapQuestion`, `Task`.
- **Event/audit requirements:** durable events for evaluated suggestions, selection changes, compliance issues, history-gap routing, blocker changes.
- **RBAC/ABAC requirements:** MA task access minimum necessary; billing/coaching flags restricted.
- **Standalone-mode behavior:** standalone owns review and task records.
- **ClinicOS-integrated behavior:** tasks can map to M04 WorkOS through adapter boundaries.
- **AI/PHI/security requirements:** suggestions remain draft/candidate; evidence is source-linked and PHI-safe.
- **Testing requirements:** reload, low-confidence override, blocker signing denial, cross-tenant/site denial, RLS.
- **Required scripts/gates:** `pnpm persistence:review-panel-adapter` plus default gate.
- **Definition of Done:** review-panel state is locally durable with tenant/RLS evidence and no autonomy creep.
- **Stop conditions:** unsafe ambiguity around diagnosis or medical-necessity language.
- **Risks and deferred decisions:** production code/rules catalog still lands later.

## WO-036 — Durable Finalization, Output Metadata, And Writeback Queue Persistence

- **Objective:** Persist finalization runs, wizard decisions, note versions, patient summaries, billing attestations, draft claim previews, exports, and writeback queue metadata.
- **Why this exists:** Finalization and output state must survive process restarts before production readiness can be claimed.
- **Prerequisites:** `WO-035`.
- **In scope:** durable finalization/output/writeback repositories; transaction boundaries; immutable signed-version metadata; tenant/site tests; RLS.
- **Out of scope:** live EHR writeback, live claim submission, charge finalization.
- **UX requirements:** finalized viewer and wizard reload read-only/signed states correctly.
- **Backend/API requirements:** idempotent finalize/export/writeback-queue operations and safe failure states.
- **Data model/persistence requirements:** `FinalizationRun`, `WizardStepDecision`, `EnhancedNoteVersion`, `PatientSummaryVersion`, `BillingAttestation`, `DraftClaimPreview`, `ExportArtifact`, `EhrWritebackJob`.
- **Event/audit requirements:** durable finalization, export, billing, and writeback queue events.
- **RBAC/ABAC requirements:** billing staff transcript access only when triggered; final-note access requires linkage.
- **Standalone-mode behavior:** standalone owns final records and export metadata.
- **ClinicOS-integrated behavior:** writeback queue uses EHR/ClinicOS adapters and keeps AURA Note permissions authoritative.
- **AI/PHI/security requirements:** patient summary excludes internal billing/revenue/coaching/confidence details.
- **Testing requirements:** reload, immutable signed outputs, claim preview `submittedClaim=false`, cross-tenant/site denial, RLS.
- **Required scripts/gates:** `pnpm persistence:finalization-output-adapter` plus default gate.
- **Definition of Done:** finalization/output/writeback metadata is locally durable without live writeback or claim submission.
- **Stop conditions:** ambiguity around legal/billing attestation or claim behavior.
- **Risks and deferred decisions:** clearinghouse/payer strategy deferred to `WO-051`.

## WO-037 — Durable Audit, Events, Support, Configuration, Coaching, And Broad RLS Completion

- **Objective:** Complete durable local runtime persistence and RLS coverage for remaining tenant-owned tables.
- **Why this exists:** Production auditability requires durable events, support snapshots, flags, configuration, templates, and coaching evidence.
- **Prerequisites:** `WO-036`.
- **In scope:** audit/event repositories, support snapshots, feature flags, templates, dot phrases, coaching reports, integration connections, mode mappings, remaining tenant-owned RLS.
- **Out of scope:** production observability sinks and production launch signoff.
- **UX requirements:** support/coaching/settings surfaces reload durable metadata.
- **Backend/API requirements:** durable audit/event writes for all implemented state changes.
- **Data model/persistence requirements:** all remaining local runtime tables either durable or explicitly documented as intentionally in-memory.
- **Event/audit requirements:** every state-changing operation has durable audit/event evidence.
- **RBAC/ABAC requirements:** support, audit, coaching, and admin visibility remain restricted.
- **Standalone-mode behavior:** standalone owns all local config and audit records.
- **ClinicOS-integrated behavior:** mode mappings and outbound events are durable without bypassing permissions.
- **AI/PHI/security requirements:** audit exports remain redacted unless later approved.
- **Testing requirements:** broad RLS, tenant/site denial, durable audit query tests, support/coaching role-denial tests.
- **Required scripts/gates:** `pnpm persistence:durable-runtime-readiness` plus default gate.
- **Definition of Done:** P7 checkpoint can prove broad local durable runtime readiness.
- **Stop conditions:** RLS policy gaps that cannot be safely resolved.
- **Risks and deferred decisions:** production database roles/backups still require P8 controls.

## WO-038 — Standalone Patient, Chart Context, And Schedule Completion

- **Objective:** Complete standalone patient shell, chart context snapshot, and Schedule Builder production workflow coverage.
- **Why this exists:** Standalone mode must not depend on ClinicOS for core v1 operation.
- **Prerequisites:** P7 complete.
- **In scope:** patient create/search/edit shell, safe identifiers, patient linkage, chart context snapshots, source freshness warnings, day/week schedule, appointment edit/cancel/no-show/check-in states.
- **Out of scope:** live EHR patient merge, production MPI, full patient portal.
- **UX requirements:** patient/search/schedule screens include empty/loading/ready/saving/blocked/failed/permission-denied/read-only/demo states.
- **Backend/API requirements:** patient and schedule CRUD APIs with validation, tenant/site scope, idempotency where applicable.
- **Data model/persistence requirements:** durable `Patient`, `PatientLinkage`, `ChartContextSnapshot`, and appointment status updates.
- **Event/audit requirements:** patient shell and appointment lifecycle events.
- **RBAC/ABAC requirements:** scheduler/front desk/clinician/admin boundaries; patient linkage enforced.
- **Standalone-mode behavior:** standalone owns patient and schedule records.
- **ClinicOS-integrated behavior:** external schedule/patient context maps in through adapters.
- **AI/PHI/security requirements:** chart context source freshness and PHI boundaries preserved.
- **Testing requirements:** patient/schedule API, browser flows, cross-tenant denial.
- **Required scripts/gates:** `pnpm standalone:patient-schedule-readiness` plus default gate.
- **Definition of Done:** standalone patients and schedule workflow are browser/API-testable and durable.
- **Stop conditions:** missing safe patient identifier policy.
- **Risks and deferred decisions:** production patient matching/merge remains deferred unless specified.

## WO-039 — Standalone Worklists, Settings, Templates, Estimates, And Rules Catalog

- **Objective:** Complete standalone operational areas needed for daily use.
- **Why this exists:** Tasks, billing review, settings/admin, templates, dot phrases, estimate configuration, and code/rules catalog are required commercial product surfaces.
- **Prerequisites:** `WO-038`.
- **In scope:** task inbox/MA follow-up worklist, billing review queue, settings/admin/integrations center, templates, dot phrases with variables/smart phrases, estimate config/caveats, rules catalog for CPT/HCPCS/ICD-10/HCC/E/M/quality/visit-type/confidence/source evidence.
- **Out of scope:** autonomous billing decisions, patient-facing revenue estimates by default.
- **UX requirements:** role-specific worklists and settings screens with all required states.
- **Backend/API requirements:** CRUD and review APIs with permission and audit gates.
- **Data model/persistence requirements:** durable templates, dot phrases, rules/config, tasks, billing review records.
- **Event/audit requirements:** template/dot phrase/rules/config/task/billing review events.
- **RBAC/ABAC requirements:** clinicians/admins can create templates where allowed; billing queue role-limited.
- **Standalone-mode behavior:** standalone owns settings and rules.
- **ClinicOS-integrated behavior:** settings may delegate to ClinicOS modules via adapter mappings.
- **AI/PHI/security requirements:** rules drive suggestions but do not finalize decisions.
- **Testing requirements:** browser worklists/settings, rule validation, patient-facing exclusion tests.
- **Required scripts/gates:** `pnpm standalone:operations-readiness` plus default gate.
- **Definition of Done:** P7.5 checkpoint can prove standalone core product completion without ClinicOS dependency.
- **Stop conditions:** ambiguity in estimate display or patient-facing revenue policy.
- **Risks and deferred decisions:** payer-specific rules may require later legal/billing review.

## WO-040 — Browser Audio Capture And Transcription Candidate

- **Objective:** Implement timer-controlled browser recording, upload/transport scaffolding, transcription adapter, and transcript metadata workflow.
- **Why this exists:** Recording/transcription is MVP-critical but currently mock-only.
- **Prerequisites:** durable visit capture from `WO-034`.
- **In scope:** browser microphone path, timer-controlled recording, approved exception path, chunk upload or equivalent transport, raw-audio object metadata, mock transcription provider, optional governed real-provider boundary, confidence/source metadata, correction/edit history, diarization placeholder.
- **Out of scope:** production transcription credentials, guaranteed provider accuracy, autonomous clinical decisions.
- **UX requirements:** permission prompts, unavailable mic, upload progress, recording paused/stopped, exception, transcript correction states.
- **Backend/API requirements:** chunk/session APIs, storage metadata, transcription job APIs, provider adapter boundary.
- **Data model/persistence requirements:** recording chunks/objects metadata, transcript confidence/source/correction records.
- **Event/audit requirements:** recording/upload/transcription/correction events.
- **RBAC/ABAC requirements:** transcript visibility by role/purpose; correction history audit-limited.
- **Standalone-mode behavior:** standalone owns capture and transcription jobs.
- **ClinicOS-integrated behavior:** transcript events can publish through ClinicOS adapters without permission bypass.
- **AI/PHI/security requirements:** transcripts do not go to external AI unless scrubbed/governed.
- **Testing requirements:** browser mock mic/transport tests, provider mock tests, retention tests, role denial.
- **Required scripts/gates:** `pnpm audio:transcription-readiness` plus default gate.
- **Definition of Done:** P8.5 checkpoint proves mock-provider audio/transcription workflow and governed live-provider boundary.
- **Stop conditions:** browser permission/storage policy ambiguity that could expose PHI.
- **Risks and deferred decisions:** live provider, BAA, and audio quality decisions remain deferred.

## WO-041 — Production Identity, Tenant Administration, Secrets, Configuration, And Feature Flags

- **Objective:** Implement production-shaped identity and configuration governance.
- **Why this exists:** Header/local identity and loose config are not production controls.
- **Prerequisites:** P7.5 or approved parallelization.
- **In scope:** OIDC/SAML/ClinicOS identity adapters, session expiration, disabled user handling, purpose-of-use, tenant/site/user/role administration, typed config validation, secret-source placeholders, feature-flag governance.
- **Out of scope:** real IdP credentials, production account recovery operations.
- **UX requirements:** admin/user/session disabled and permission-denied states.
- **Backend/API requirements:** identity middleware, admin APIs, fail-closed config validation.
- **Data model/persistence requirements:** durable identity/session/admin/config/flag records where required.
- **Event/audit requirements:** login/session/admin/flag/config events.
- **RBAC/ABAC requirements:** tenant/site/user/role and purpose enforcement.
- **Standalone-mode behavior:** standalone workforce identity works with configured IdP or local safe dev adapter.
- **ClinicOS-integrated behavior:** ClinicOS delegated identity maps through adapter and cannot bypass AURA Note checks.
- **AI/PHI/security requirements:** secrets never logged or committed; high-risk flags require approval evidence.
- **Testing requirements:** disabled user, expired session, spoofed tenant, missing purpose, unsafe config tests.
- **Required scripts/gates:** `pnpm identity:production-readiness`, `pnpm config:production-readiness`, default gate.
- **Definition of Done:** production-shaped identity/config boundary is ready for security review.
- **Stop conditions:** missing IdP decision blocks live integration; use fake adapter and document deferral.
- **Risks and deferred decisions:** IdP vendor, MFA, and account recovery need founder/security review.

## WO-042 — Azure Storage, Secure Downloads, Retention Deletion, Backup, And Restore Controls

- **Objective:** Move storage delivery and retention deletion from readiness scaffolding to production-shaped executable boundaries with recovery evidence.
- **Why this exists:** `WO-032` added metadata and fake storage, not production storage execution.
- **Prerequisites:** `WO-041` config governance.
- **In scope:** Azure SDK adapter boundary, emulator/optional live-safe path, server-mediated downloads, object ownership checks, raw-audio deletion job integration, approval/recovery/evidence persistence, soft-delete/versioning checks, backup/restore readiness.
- **Out of scope:** PHI-bearing production payloads before security/privacy review.
- **UX requirements:** download unavailable/expired/denied states and retention status visibility.
- **Backend/API requirements:** secure download endpoint, storage adapter config, retention delete controls.
- **Data model/persistence requirements:** object metadata, signed token metadata, deletion evidence, restore-readiness evidence.
- **Event/audit requirements:** download requested/denied/delivered, object deleted/skipped/restored-readiness events.
- **RBAC/ABAC requirements:** final-note/patient-summary/audit export permissions enforced before token/content access.
- **Standalone-mode behavior:** standalone uses tenant storage config.
- **ClinicOS-integrated behavior:** integration mode may map storage/evidence to ClinicOS/Integration Hub without bypass.
- **AI/PHI/security requirements:** no public URLs; no production credentials committed; transcript purge remains zero.
- **Testing requirements:** wrong tenant/site/role/token expiry, deletion approval, backup/restore metadata checks.
- **Required scripts/gates:** `pnpm storage:secure-download-readiness`, `pnpm retention:production-readiness`, default gate.
- **Definition of Done:** production-shaped storage and deletion controls are review-ready with no PHI-bearing launch claim.
- **Stop conditions:** missing Azure credential/recovery policy; document and stop before live use.
- **Risks and deferred decisions:** production Blob policies and restore drills require environment access.

## WO-043 — Production Observability, Support Operations, And Status Views

- **Objective:** Connect local observability and support scaffolds to production-shaped operational evidence.
- **Why this exists:** Commercial operation requires redacted logs, metrics, traces, SIEM/APM boundaries, and support procedures.
- **Prerequisites:** `WO-041`.
- **In scope:** log/metric/trace/SIEM adapters, redaction enforcement, request/trace correlation, support status backed by durable evidence, alert taxonomy, support runbook hooks.
- **Out of scope:** real vendor credentials unless configured.
- **UX requirements:** support/admin operational status surfaces for degraded/failure/permission states.
- **Backend/API requirements:** observability sink interfaces and support-status APIs.
- **Data model/persistence requirements:** durable support snapshots and operational event metadata.
- **Event/audit requirements:** support viewed, incident flag, sink failure, status snapshot events.
- **RBAC/ABAC requirements:** support cannot access unauthorized PHI/transcript/billing/coaching details.
- **Standalone-mode behavior:** standalone support status works without external vendors.
- **ClinicOS-integrated behavior:** ClinicOS status can be mapped through adapters.
- **AI/PHI/security requirements:** log payloads redacted and correlated.
- **Testing requirements:** redaction, role denial, sink failure, support degraded-mode tests.
- **Required scripts/gates:** `pnpm observability:production-readiness` plus default gate.
- **Definition of Done:** P8 checkpoint can prove platform readiness for security/privacy review.
- **Stop conditions:** observability vendor decision missing for live sink.
- **Risks and deferred decisions:** vendor-specific SIEM/APM setup may remain deferred.

## WO-044 — EHR Sandbox Integration And Writeback Queue Hardening

- **Objective:** Harden athenahealth-first and generic EHR integration with sandbox-ready writeback controls.
- **Why this exists:** Current EHR behavior is mock/sandbox scaffold only.
- **Prerequisites:** durable output/writeback metadata and config governance.
- **In scope:** athenahealth sandbox contract hardening, generic adapter preservation, idempotent writeback queue, retry/dead-letter/reconciliation, human approval before writeback, audit.
- **Out of scope:** production EHR credentials and autonomous writeback.
- **UX requirements:** writeback pending/approved/sent/failed/retry/dead-letter states.
- **Backend/API requirements:** queue worker, approval API, adapter errors, reconciliation APIs.
- **Data model/persistence requirements:** durable writeback attempts and reconciliation evidence.
- **Event/audit requirements:** queued/approved/sent/failed/retried/dead-lettered/reconciled events.
- **RBAC/ABAC requirements:** only permitted roles approve writeback; billing cannot bypass.
- **Standalone-mode behavior:** EHR disabled/not-configured path remains safe.
- **ClinicOS-integrated behavior:** can route through M25 Integration Hub while preserving AURA Note approval.
- **AI/PHI/security requirements:** no raw EHR payload logs; no AI bypass.
- **Testing requirements:** fake sandbox, idempotency, unauthorized approval denial, retry/dead-letter.
- **Required scripts/gates:** `pnpm ehr:integration-readiness` plus default gate.
- **Definition of Done:** EHR integration is sandbox-review-ready without live production writeback.
- **Stop conditions:** missing vendor credentials for live sandbox; fake mode remains.
- **Risks and deferred decisions:** athenahealth credentialing and production writeback review deferred.

**Implementation status as of `WO-044`:** complete as synthetic/browser/API-testable EHR sandbox and writeback queue evidence. The implemented gate is `pnpm ehr:integration-readiness`. API behavior includes metadata-only queue inspection, human approval, idempotency replay, retry scheduling, dead-letter, reconciliation, support redaction, PHI evidence rejection, and audit/domain events. The browser route `/aura-note/integrations/ehr` exposes sandbox lifecycle states. Live production EHR credentials, raw EHR payload storage, and live writeback delivery remain deferred.

## WO-045 — ClinicOS Integration Hardening

- **Objective:** Harden embedded-mode integration with AURA ClinicOS modules.
- **Why this exists:** AURA Note must be one product that supports standalone and ClinicOS-integrated modes.
- **Prerequisites:** durable events, identity, and config governance.
- **In scope:** durable mode mappings, M03/M04/M17/M21/M23/M24/M25/M26 mapping validation, inbound/outbound idempotency, stale mapping/failure states, embedded-mode tests.
- **Out of scope:** building ClinicOS modules inside AURA Note.
- **UX requirements:** embedded-mode context, disabled/degraded integration states.
- **Backend/API requirements:** adapter validation, outbox/inbox handling, reconciliation.
- **Data model/persistence requirements:** `ModeMapping`, integration connection, and outbox records.
- **Event/audit requirements:** mapping recorded, event published/skipped/failed, stale mapping events.
- **RBAC/ABAC requirements:** ClinicOS service context never bypasses AURA Note permissions.
- **Standalone-mode behavior:** standalone remains fully functional with ClinicOS disabled.
- **ClinicOS-integrated behavior:** maps to M03 VisitGraph, M04 tasks, M17 cockpit, M21 charge, M23/M24 AI/governance, M25 integration, M26 data cloud.
- **AI/PHI/security requirements:** ClinicOS AI/governance delegation still uses AURA Note PHI boundary.
- **Testing requirements:** standalone/integrated parity, stale mapping, cross-tenant delegation denial.
- **Required scripts/gates:** `pnpm clinicos:integration-readiness` plus default gate.
- **Definition of Done:** ClinicOS integration is externally reviewable and permission-safe.
- **Stop conditions:** missing ClinicOS contract detail blocks a mapping; add `SPEC_GAP`.
- **Risks and deferred decisions:** live ClinicOS availability and module contracts may evolve.

**Implementation status as of `WO-045`:** complete as synthetic/browser/API-testable ClinicOS integration hardening evidence. The implemented gate is `pnpm clinicos:integration-readiness`. API behavior includes metadata-only module boundaries, mapping upsert/review, stale mapping detection, failed/degraded publication metadata, support/service-account role boundaries, cross-tenant denial, and audit/domain events. The browser route `/aura-note/integrations/clinicos` exposes disabled, degraded, failed, stale mapping, permission-denied, read-only, and demo states. Live ClinicOS credentials, production event-bus delivery, raw ClinicOS payload storage, and live delegated identity remain deferred.

## WO-046 — AI Gateway Production Governance And Evaluation Harness

- **Objective:** Prepare AI gateway for production review without enabling raw PHI to external AI.
- **Why this exists:** AI safety requires prompt/model governance, evals, schema validation, and persistent governance events.
- **Prerequisites:** durable audit/events and config governance.
- **In scope:** prompt registry/versioning, model config records, evaluation harness, PHI scrubber/de-identification hardening, output schema validation, source-linked evidence, human-review gates, governance event persistence.
- **Out of scope:** live external AI with PHI unless later governance approves.
- **UX requirements:** AI unavailable, rejected, draft-only, source-evidence, confidence, and human-review states.
- **Backend/API requirements:** provider boundary disabled by default, policy checks, eval commands.
- **Data model/persistence requirements:** prompt/model/governance/eval metadata.
- **Event/audit requirements:** request prepared, rejected, output recorded, eval failed, prompt/model changed.
- **RBAC/ABAC requirements:** purpose-of-use and role checks before AI context assembly.
- **Standalone-mode behavior:** standalone uses local governance config.
- **ClinicOS-integrated behavior:** can delegate to M23/M24 via adapter without bypass.
- **AI/PHI/security requirements:** regression tests prove no raw PHI to external AI and no autonomous finalization.
- **Testing requirements:** unsafe-output refusal, PHI rejection/redaction, schema validation, source freshness.
- **Required scripts/gates:** `pnpm ai:governance-readiness` plus default gate.
- **Definition of Done:** AI pathway is governance-review-ready and still draft-only.
- **Stop conditions:** PHI/model/BAA decision required for live provider use.
- **Risks and deferred decisions:** private/BAA model path requires legal/security/vendor approval.

**Implementation status as of `WO-046`:** complete as synthetic/browser/API-testable AI Gateway governance hardening evidence. The implemented gate is `pnpm ai:governance-readiness`. API behavior includes prompt registry metadata, mock/private-BAA-placeholder/external-disabled model configuration records, deterministic evaluation runs, source-linked output validation, unsafe-output rejection, support-role denial for governance actions, cross-tenant denial, and audit/domain events. The browser route `/aura-note/ai-governance` exposes disabled, permission-denied, read-only, evaluation-failed, unsafe-output-rejected, and demo states. Live external AI, production prompt stores, production model credentials, raw PHI model payloads, autonomous finalization, medical-necessity determination, charge finalization, and claim submission remain deferred.

## WO-047 — Security, Privacy, Compliance, And Threat-Model Remediation

- **Objective:** Convert implementation evidence into security/privacy/compliance review artifacts and fix blocking findings.
- **Why this exists:** Production launch requires formal risk review beyond passing tests.
- **Prerequisites:** P8/P8.5/P9 implementation evidence.
- **In scope:** threat model, RBAC/ABAC review, data retention review, vendor/BAA inventory, access review, remediation of high-priority gaps.
- **Out of scope:** legal certification claims.
- **UX requirements:** any compliance-required permission/warning states added to UI.
- **Backend/API requirements:** remediate security findings in APIs/workers/adapters.
- **Data model/persistence requirements:** review persistence/retention evidence.
- **Event/audit requirements:** review/audit evidence package.
- **RBAC/ABAC requirements:** matrix reconciled with implemented checks.
- **Standalone-mode behavior:** standalone risks documented and remediated.
- **ClinicOS-integrated behavior:** integrated-mode risks documented and remediated.
- **AI/PHI/security requirements:** no unresolved compliance-critical PHI/AI gaps for launch candidate.
- **Testing requirements:** security regression tests for remediations.
- **Required scripts/gates:** `pnpm security:review-readiness` plus default gate.
- **Definition of Done:** P9 checkpoint can document external-review readiness and blockers.
- **Stop conditions:** compliance-critical unresolved gap.
- **Risks and deferred decisions:** external counsel/security review may add blockers.

**Implementation status as of `WO-047`:** complete as synthetic/local P9 security/privacy/compliance review evidence. The implemented gate is `pnpm security:review-readiness`. The repo now includes an updated `docs/COMPLIANCE_SECURITY_PRIVACY_REVIEW_PACKAGE.md`, a P9 `docs/THREAT_MODEL.md`, RBAC/ABAC and AI/PHI review notes, and P9 checkpoint evidence. No new P9 blocker was found in the current synthetic/local scope, and no legal certification, production launch approval, production PHI, live credentials, live external AI, live EHR/ClinicOS sync, live storage delivery, destructive production deletion, autonomous clinical/coding/billing behavior, medical-necessity determination, charge finalization, or claim submission was introduced.

## WO-048 — UX, Accessibility, Responsive, And Visual Regression Hardening

- **Objective:** Harden production UX and accessibility across required role workflows.
- **Why this exists:** Browser-testable scaffolds need production-quality flow correctness, and launch review must distinguish API-backed runtime screens from Storybook/demo-only local React state.
- **Prerequisites:** P7.5 product surfaces.
- **In scope:** route/state coverage, typed API-client integration inventory, keyboard controls, accessible names, responsive hardening, visual regression, patient-facing exclusion review, clinician/MA/billing/admin/support workflows.
- **Out of scope:** final design signoff if Figma is unavailable.
- **UX requirements:** every required screen has empty/loading/ready/saving/blocked/failed/permission-denied/read-only/demo states; production-intended route state must come from typed API responses or documented mocks, not unlabelled local-only React fixtures.
- **Backend/API requirements:** no new APIs unless needed for UX state fidelity; any route that cannot be API-backed must be explicitly documented as demo/Storybook-only or blocked by a later dependency.
- **Data model/persistence requirements:** none unless state tracking is required; identify routes whose current state is not yet backed by persisted records and assign remediation before P10.
- **Event/audit requirements:** user actions retain existing audit coverage.
- **RBAC/ABAC requirements:** role-denied UX tests for sensitive views.
- **Standalone-mode behavior:** standalone workflows complete.
- **ClinicOS-integrated behavior:** embedded workflows safely degrade.
- **AI/PHI/security requirements:** no patient-facing internal billing/revenue/coaching/confidence details.
- **Testing requirements:** Playwright accessibility/responsive/visual tests plus frontend-runtime integration inventory tests that distinguish API-backed runtime screens from documented mocks.
- **Required scripts/gates:** `pnpm ux:production-readiness`, `pnpm frontend:runtime-integration-readiness`, plus default gate.
- **Definition of Done:** UX/accessibility evidence is ready for launch review and the Frontend Runtime Integration Gate has an inventory with no unapproved production local-state screens.
- **Stop conditions:** design requirement conflict with safety/compliance.
- **Risks and deferred decisions:** final Figma fidelity may require separate design review.

**Implementation status as of `WO-048`:** complete as synthetic/local frontend runtime-integration evidence. The repo now includes `docs/FRONTEND_RUNTIME_INTEGRATION.md`, a typed web API client validated against `packages/contracts`, an API-backed `/aura-note/runtime-integration` evidence route, Playwright coverage from appointment creation through finalization/export with reload/refetch proof, and `pnpm frontend:runtime-integration-readiness`. Existing production-intended scaffold routes remain inventoried as documented mocks until later P10 work converts them to typed API runtime behavior or explicitly defers them before launch-candidate review. No production launch approval, production PHI, live credentials, live vendors, autonomous clinical/coding/billing behavior, medical-necessity determination, charge finalization, or claim submission was introduced.

## WO-049 — Deployment, Environment Promotion, Performance, Reliability, And Operational Drills

- **Objective:** Add deployment and operational readiness evidence.
- **Why this exists:** Commercial readiness requires deployment controls, load/failure evidence, runbooks, and incident drills.
- **Prerequisites:** P9 review evidence.
- **In scope:** local/staging/production environment matrix, deployment automation/runbooks, release controls, health checks, performance/load tests, reliability/failure drills, incident response, access review runbook, support playbooks.
- **Out of scope:** production deployment without approvals.
- **UX requirements:** health/status and support surfaces reflect degraded modes.
- **Backend/API requirements:** smoke/health checks and operational endpoints.
- **Data model/persistence requirements:** backup/restore and operational evidence checks.
- **Event/audit requirements:** deployment/incident/access-review evidence events or docs.
- **RBAC/ABAC requirements:** operational access is role-limited and audited.
- **Standalone-mode behavior:** standalone deployment path documented.
- **ClinicOS-integrated behavior:** embedded deployment dependencies documented.
- **AI/PHI/security requirements:** load/failure tests use synthetic data only.
- **Testing requirements:** deployment smoke, load/perf, failure drills.
- **Required scripts/gates:** `pnpm performance:launch-baseline`, `pnpm launch:ops-readiness`, default gate.
- **Definition of Done:** launch operations evidence is complete enough for beta decision.
- **Stop conditions:** missing production environment or secrets blocks live deployment; document as blocker.
- **Risks and deferred decisions:** hosting platform and production SLOs may require founder decision.

**Implementation status as of `WO-049`:** complete as synthetic/local launch-operations readiness evidence. The repo now includes `docs/LAUNCH_OPERATIONS_READINESS.md`, `docs/runbooks/WO-049_LAUNCH_OPS_RUNBOOK.md`, a deterministic synthetic performance baseline, support-status launch operations drill states, and `pnpm launch:ops-readiness`. This work proves operational rehearsal controls only: no production deployment, no production credentials, no live PHI, no live vendors, no launch approval, no autonomous clinical/coding/billing behavior, no medical-necessity determination, no charge finalization, and no claim submission.

## WO-050 — Beta Pilot And Limited Production Launch Gate

- **Objective:** Prepare beta and limited launch governance after technical/security readiness.
- **Why this exists:** Launch requires onboarding, training, support, monitoring, rollback, frontend runtime integration evidence, and approval evidence.
- **Prerequisites:** `WO-049`.
- **In scope:** tenant onboarding/provisioning, pilot setup checklist, role training, disabled feature list, support escalation, launch checklist, first-week monitoring, rollback criteria, Frontend Runtime Integration Gate evidence, founder/clinical/compliance/security approvals.
- **Out of scope:** unrestricted general availability.
- **UX requirements:** onboarding and support paths clear for pilot users; production-intended screens use typed API clients with loading/empty/ready/saving/failed/permission-denied/read-only states backed by API responses or documented mocks.
- **Backend/API requirements:** tenant provisioning checks and launch smoke tests; launch smoke must include at least one backend-backed seeded browser workflow from appointment creation through finalization/export.
- **Data model/persistence requirements:** launch tenant/config evidence plus persisted workflow-state evidence for the seeded browser journey.
- **Event/audit requirements:** launch signoff and onboarding evidence.
- **RBAC/ABAC requirements:** access review complete before launch.
- **Standalone-mode behavior:** standalone pilot path ready.
- **ClinicOS-integrated behavior:** integrated pilot path documented if used.
- **AI/PHI/security requirements:** production PHI only if all prior approvals are complete.
- **Testing requirements:** pilot smoke, rollback, monitoring validation, and Playwright backend-backed workflow coverage from appointment creation through finalization/export.
- **Required scripts/gates:** `pnpm frontend:runtime-integration-readiness`, `pnpm pilot:readiness`, `pnpm launch:readiness`, default gate.
- **Definition of Done:** P10 checkpoint can support limited launch decision without overclaiming readiness, and launch evidence proves production screens are API-backed or explicitly documented as mocks/demo-only.
- **Stop conditions:** missing founder/clinical/compliance/security approval.
- **Risks and deferred decisions:** pilot scope and real tenant readiness must be approved.

**Implementation status as of `WO-050`:** complete as synthetic/local beta-pilot and limited-launch decision-package evidence. The repo now includes `docs/PILOT_LAUNCH_READINESS.md`, `docs/runbooks/WO-050_BETA_PILOT_RUNBOOK.md`, support-status pilot launch gate states, a deterministic synthetic pilot smoke harness, `pnpm pilot:readiness`, and `pnpm launch:readiness`. This closes P10 as a decision package only: `productionLaunchApproved=false`, `productionLaunchReady=false`, `submittedClaim=false`, no production deployment, no production credentials, no live PHI, no live vendors, no charge finalization, no medical-necessity determination, and no claim submission are enabled.

## WO-051 — Claim Submission And Payer Integration Decision Gate

- **Objective:** Capture claim submission, clearinghouse, payer, denial, and payment strategy decisions without implementing autonomous submission.
- **Why this exists:** v1 includes draft claim preview and billing review, not live claim submission.
- **Prerequisites:** P10 launch evidence or founder request.
- **In scope:** decision package, current boundary review, required legal/compliance/billing questions, future work-order criteria if live submission is approved later.
- **Out of scope:** live claim submission, autonomous charge finalization, autonomous denial management.
- **UX requirements:** preserve human-controlled draft-claim and billing-review language.
- **Backend/API requirements:** no live payer API implementation.
- **Data model/persistence requirements:** document any future data model needs only.
- **Event/audit requirements:** decision evidence and any future audit requirements documented.
- **RBAC/ABAC requirements:** billing and claim strategy roles documented.
- **Standalone-mode behavior:** draft claim preview remains internal.
- **ClinicOS-integrated behavior:** any future M21/clearinghouse integration remains adapter-scoped.
- **AI/PHI/security requirements:** no AI medical-necessity or claim finalization.
- **Testing requirements:** tests continue proving `submittedClaim=false`.
- **Required scripts/gates:** `pnpm claim-decision:readiness` if added; otherwise docs/status gate.
- **Definition of Done:** P11 checkpoint clearly records prohibited/deferred/approved future claim strategy.
- **Stop conditions:** founder requests live claims without legal/compliance details; create blocking `SPEC_GAP`.
- **Risks and deferred decisions:** clearinghouse/payer/denial automation is high-risk and must be separately authorized.

**Implementation status as of `WO-051`:** complete as a synthetic/local P11 decision package. The repo now includes `docs/CLAIM_PAYER_DECISION_GATE.md`, `docs/runbooks/WO-051_CLAIM_PAYER_DECISION_RUNBOOK.md`, support-status claim/payer decision gate states, and `pnpm claim-decision:readiness`. This closes P11 as a decision gate only: `submittedClaim=false`, `claimSubmissionEnabled=false`, no clearinghouse API, no payer API, no denial automation, no payment posting, no charge finalization, no medical-necessity determination, and no patient-facing financial conclusion are enabled. Any future live claim work requires a new founder-approved work order plus billing, compliance, privacy, security, and legal decisions.

## WO-052 — Post-P11 Continuation Rails And Tranche Intake

- **Objective:** Establish post-P11 continuation rails and candidate tranche intake criteria without activating a new implementation work order.
- **Why this exists:** P11 intentionally stops with `next_work_order: null`; continuing safely requires a planning/control layer before future live or production-facing work is promoted.
- **Prerequisites:** `WO-051` complete and merged; P11 checkpoint recorded; no active blockers for completed synthetic/local scope.
- **In scope:** `docs/POST_P11_CONTINUATION_PLAN.md`, post-P11 candidate tranche families, activation checklist, readiness verifier, status/index/run-log/checkpoint updates.
- **Out of scope:** live production behavior, live vendor behavior, production PHI storage, live claim/payer work, production launch approval, or runtime product behavior.
- **UX requirements:** no new UX route; preserve the Frontend Runtime Integration Gate for any later production-intended screen work.
- **Backend/API requirements:** no new endpoint; future backend work must be tenant-scoped, permission-checked, audit/event emitting, and idempotent where needed.
- **Data model/persistence requirements:** no schema change; future data work must name affected tables, RLS posture, rollback, backup/restore, and synthetic/live boundary.
- **Event/audit requirements:** no new runtime event; future state-changing behavior must add audit/event contracts before completion.
- **RBAC/ABAC requirements:** no matrix change; future work must name roles, permissions, purpose-of-use, tenant/site scope, and denial tests.
- **Standalone-mode behavior:** standalone remains authoritative and cannot become dependent on ClinicOS without a defined degraded mode.
- **ClinicOS-integrated behavior:** future ClinicOS work remains adapter-scoped and cannot bypass AURA Note permissions, audit, human review, or tenant/site isolation.
- **AI/PHI/security requirements:** no raw PHI, production credentials, external AI, real payer data, real patient data, production connection string, `.env`, private key, or autonomous clinical/coding/billing behavior.
- **Testing requirements:** post-P11 readiness verifier plus production readiness, acceptance readiness, status output, and whitespace checks.
- **Required scripts/gates:** `pnpm post-p11:readiness`; `pnpm production:readiness`; `pnpm acceptance:readiness`; `node scripts/status.js`; `git diff --check`.
- **Definition of Done:** post-P11 continuation plan exists; `WO-052` is indexed and marked done; `next_work_order` remains `null`; readiness scripts pass; no live production, vendor, claim, PHI, or launch behavior is authorized.
- **Stop conditions:** a requested future implementation lacks required founder/compliance/security/legal/vendor decisions or would imply production readiness without evidence.
- **Risks and deferred decisions:** future implementation still depends on deferred decisions in `SPEC_GAPS.md`; this work order organizes intake only and is not approval to implement live behavior.

**Implementation status as of `WO-052`:** complete as a planning/control tranche only. The repo now includes `docs/POST_P11_CONTINUATION_PLAN.md`, `work_orders/WO-052_post_p11_continuation_rails.md`, and `pnpm post-p11:readiness`. `next_work_order` remains `null`; no live production, vendor, claim, PHI, or launch behavior is authorized.

## WO-053 — Production Identity And Account Lifecycle Review Intake

- **Objective:** Promote production identity and account lifecycle live review into a planning/control decision package without enabling runtime identity behavior.
- **Why this exists:** Production identity must be governed before live PHI, vendor, storage, EHR, AI, or payer work can be safely implemented.
- **Prerequisites:** `WO-052` complete and merged; P11 retained; no active SPEC_GAP blocks planning/control work.
- **In scope:** production identity review document, live-readiness decision inventory, OIDC/SAML/ClinicOS delegation considerations, MFA/session/disabled-user/account-recovery/break-glass/support/access-review criteria, readiness verifier, CI/status/docs updates.
- **Out of scope:** live OIDC/SAML, production IdP credentials, real user directory sync, ClinicOS live delegated identity, production PHI access, break-glass runtime implementation, or production launch approval.
- **UX requirements:** no new route; future identity UX must expose fail-closed, permission-denied, disabled-user, expired-session, missing-purpose, delegated-denied, support, break-glass, and access-review states through typed API clients before launch readiness.
- **Backend/API requirements:** no new endpoint; future live identity work must use adapter boundaries and enforce tenant/site scope, permissions, purpose-of-use, idempotency where needed, and audit/event evidence.
- **Data model/persistence requirements:** no schema change; future work must define durable tenant/site/user/role/session/delegated-mapping/break-glass/support/access-review records and RLS or equivalent tenant-isolation evidence.
- **Event/audit requirements:** inventory future identity events including user provisioned/disabled, role assigned/removed, session expired, purpose-of-use recorded, delegated identity linked/denied, break-glass opened/closed, support access opened/closed, and access review completed.
- **RBAC/ABAC requirements:** preserve current role boundaries and require future role-denial/cross-tenant/support/delegated-identity tests.
- **Standalone-mode behavior:** standalone remains authoritative for tenant/site/user/role administration until a future approved implementation work order changes it.
- **ClinicOS-integrated behavior:** ClinicOS delegated identity remains disabled/fail-closed; future delegation cannot bypass AURA Note permissions, tenant/site mapping, patient linkage, purpose-of-use, or audit.
- **AI/PHI/security requirements:** no raw PHI, credentials, tokens, production URLs, `.env`, private keys, live IdP calls, live ClinicOS delegation, or external AI change.
- **Testing requirements:** identity live-review readiness verifier plus post-P11, production, acceptance, status, and whitespace gates.
- **Required scripts/gates:** `pnpm identity:live-review-readiness`; `pnpm post-p11:readiness`; `pnpm production:readiness`; `pnpm acceptance:readiness`; `node scripts/status.js`; `git diff --check`.
- **Definition of Done:** decision package exists, `WO-053` is indexed and marked done, `next_work_order` remains `null`, readiness scripts pass, and no live identity, credential, PHI, ClinicOS delegation, or launch behavior is authorized.
- **Stop conditions:** real IdP selection, live credentials, legal/security/privacy policy, or ClinicOS delegation decisions are required before implementation.
- **Risks and deferred decisions:** production IdP, MFA, account recovery, session policy, break-glass, support access, access review, tenant administration ownership, and ClinicOS delegation rules remain deferred.

**Implementation status as of `WO-053`:** complete as a planning/control tranche only. The repo now includes `docs/PRODUCTION_IDENTITY_ACCOUNT_LIFECYCLE_REVIEW.md`, `work_orders/WO-053_production_identity_account_lifecycle_review_intake.md`, and `pnpm identity:live-review-readiness`. `next_work_order` remains `null`; no live OIDC/SAML, production IdP credential, ClinicOS delegated identity, production PHI access, runtime identity behavior, or production launch behavior is authorized.

## WO-054 — Production PHI Persistence And Database Operations Review Intake

- **Objective:** Promote production PHI persistence and database operations review into a planning/control decision package without enabling production PHI storage or runtime database changes.
- **Why this exists:** Production PHI persistence requires governed database host, encryption, migration, backup/restore, tenant-isolation, RLS, support-access, and incident-response decisions before live implementation.
- **Prerequisites:** `WO-053` complete and merged; P11 retained; no active SPEC_GAP blocks planning/control work.
- **In scope:** production PHI database operations review document, database host/encryption/KMS/backup/restore/RLS/migration/support-access/data-export/retention/incident decisions, future acceptance criteria, event/audit inventory, readiness verifier, CI/status/docs updates.
- **Out of scope:** production database provisioning, production credentials, `.env` files, live migrations, runtime repository replacement, production PHI storage, new runtime RLS policies, backup/restore execution, support database access, or production launch approval.
- **UX requirements:** no new route; future operational UX must expose environment, migration, backup, restore, tenant-isolation, support-access, degraded, failed, and read-only states through authorized surfaces before launch readiness.
- **Backend/API requirements:** no new endpoint; future database operations must be tenant-scoped, permission-checked, purpose-bound, idempotent where needed, audit/event emitting, and fail-closed when context/approval/credentials are missing.
- **Data model/persistence requirements:** no schema change; future work must define production database roles, migration approval/run/rollback evidence, backup/restore evidence, tenant-isolation evidence, RLS coverage, support-access evidence, data export evidence, and retention records.
- **Event/audit requirements:** inventory future database events including migration approved/applied/rolled back, backup completed, restore drill completed, RLS policy verified, tenant isolation verified, support database access opened/closed, data export approved/completed, retention policy changed, and database incident recorded.
- **RBAC/ABAC requirements:** preserve current role boundaries and require future authorized-admin/compliance/privacy/support-scope controls plus denial tests for ordinary clinicians, MAs, billing staff, and unscoped support users.
- **Standalone-mode behavior:** standalone remains synthetic/local for PHI persistence until a future approved implementation work order enables production database operation.
- **ClinicOS-integrated behavior:** ClinicOS-integrated mode cannot bypass AURA Note database permissions, tenant/site isolation, RLS posture, audit, support-access controls, or retention policy.
- **AI/PHI/security requirements:** no real PHI, credentials, tokens, production URLs, `.env`, private keys, production database calls, backup/restore execution, or external AI change.
- **Testing requirements:** PHI database review readiness verifier plus post-P11, production, acceptance, status, and whitespace gates.
- **Required scripts/gates:** `pnpm persistence:phi-db-review-readiness`; `pnpm post-p11:readiness`; `pnpm production:readiness`; `pnpm acceptance:readiness`; `node scripts/status.js`; `git diff --check`.
- **Definition of Done:** decision package exists, `WO-054` is indexed and marked done, `next_work_order` remains `null`, readiness scripts pass, and no production PHI storage, production database credential, live migration, runtime database change, support database access, backup/restore execution, or launch behavior is authorized.
- **Stop conditions:** real database host selection, live credentials, PHI storage, live migration, backup/restore execution, support access, or legal/security/privacy policy is required before implementation.
- **Risks and deferred decisions:** production database host, encryption/KMS, backup cadence, restore drills, RLS expansion, migration approvals, rollback policy, tenant export/offboarding, support access, retention policy, and incident response remain deferred.

**Implementation status as of `WO-054`:** complete as a planning/control tranche only. The repo now includes `docs/PRODUCTION_PHI_PERSISTENCE_DATABASE_OPERATIONS_REVIEW.md`, `work_orders/WO-054_production_phi_persistence_database_ops_review_intake.md`, and `pnpm persistence:phi-db-review-readiness`. `next_work_order` remains `null`; no production PHI storage, production database credential, live migration, runtime repository replacement, support database access, backup/restore execution, or production launch behavior is authorized.

## WO-055 — Production Azure Storage, Deletion, And Restore Review Intake

- **Objective:** Promote production Azure Blob storage, deletion, and restore review into a planning/control decision package without enabling live Azure credentials, PHI-bearing object delivery, destructive production deletion, production restore execution, or launch behavior.
- **Why this exists:** Production object storage requires governed Azure account/container topology, credentials, encryption/KMS, secure downloads, soft delete/versioning, legal hold, deletion authority, restore drills, incident response, and evidence-retention decisions before live implementation.
- **Prerequisites:** `WO-054` complete and merged; P11 retained; no active SPEC_GAP blocks planning/control work.
- **In scope:** production Azure storage/deletion/restore review document, Azure account/container/private-network/credential/KMS/download/legal-hold/deletion/restore/evidence/incident decisions, future acceptance criteria, event/audit inventory, readiness verifier, CI/status/docs updates.
- **Out of scope:** Azure resource provisioning, production Azure credentials, `.env` files, live Azure SDK execution, PHI-bearing object delivery, public URLs, browser-side storage credentials, destructive production deletion, production restore execution, PHI-bearing audit export delivery, runtime storage behavior, schema changes, migrations, or production launch approval.
- **UX requirements:** no new route; future operational UX must expose storage configuration, secure download, legal hold, deletion approval, recovery window, restore readiness, degraded, failed, permission-denied, and read-only states through authorized surfaces before launch readiness.
- **Backend/API requirements:** no new endpoint; future storage operations must be tenant/site scoped, permission checked, purpose-of-use checked, server mediated, audit/event emitting, fail closed when approval/credentials/context are missing, and reject public URLs or browser-side storage credentials.
- **Data model/persistence requirements:** no schema change; future work must define object metadata, storage provider metadata, retention class, signed-token metadata, legal-hold evidence, deletion approval/result evidence, restore-readiness evidence, incident evidence, and evidence-retention records.
- **Event/audit requirements:** inventory future storage events including Azure config reviewed, object upload authorized/denied, download token requested/denied, object download delivered, public URL rejected, raw-audio deletion approved/skipped/deleted, transcript retention preserved, legal hold applied, legal hold blocked deletion, restore readiness verified, restore drill completed, and storage incident recorded.
- **RBAC/ABAC requirements:** preserve current role boundaries and require future authorized-admin/compliance/privacy/support-scope/export-authorized/retention-operator controls plus denial tests for ordinary clinicians, MAs, billing staff, unscoped support users, wrong-tenant users, and wrong-site users.
- **Standalone-mode behavior:** standalone remains synthetic/local for production storage until a future approved implementation work order enables production Azure operation; AURA Note remains the source of tenant/site storage, retention, download, audit, and support policies.
- **ClinicOS-integrated behavior:** ClinicOS-integrated mode may map storage/evidence to ClinicOS/Integration Hub identifiers only through adapters and cannot bypass AURA Note permissions, tenant/site scoping, purpose-of-use checks, legal holds, retention controls, token enforcement, audit, or incident response.
- **AI/PHI/security requirements:** no real PHI, credentials, tokens, production URLs, `.env`, private keys, live Azure calls, PHI-bearing object payloads, public URLs, destructive production deletion, production restore execution, external AI change, or launch approval.
- **Testing requirements:** storage live-review readiness verifier plus storage/retention, post-P11, production, acceptance, status, and whitespace gates.
- **Required scripts/gates:** `pnpm storage:live-review-readiness`; `pnpm post-p11:readiness`; `pnpm production:readiness`; `pnpm acceptance:readiness`; `node scripts/status.js`; `git diff --check`.
- **Definition of Done:** decision package exists, `WO-055` is indexed and marked done, `next_work_order` remains `null`, readiness scripts pass, and no live Azure credential, PHI-bearing object delivery, public URL, destructive production deletion, production restore execution, PHI-bearing audit export, runtime storage behavior, or launch behavior is authorized.
- **Stop conditions:** real Azure resource selection, live credentials, PHI-bearing object storage, live SDK execution, public networking policy, legal hold policy, destructive production deletion, restore execution, incident-response/legal/privacy policy, or production launch approval is required before implementation.
- **Risks and deferred decisions:** Azure account/container topology, private networking, credential source, customer-managed keys, tenant key isolation, signed download TTLs, token revocation, legal hold, immutability, backup/restore cadence, deletion approval authority, recovery window, evidence retention, support access, and incident response remain deferred.

**Implementation status as of `WO-055`:** complete as a planning/control tranche only. The repo now includes `docs/PRODUCTION_AZURE_STORAGE_DELETION_RESTORE_REVIEW.md`, `work_orders/WO-055_production_azure_storage_deletion_restore_review_intake.md`, and `pnpm storage:live-review-readiness`. `next_work_order` remains `null`; no live Azure credential, PHI-bearing object delivery, public URL, destructive production deletion, production restore execution, PHI-bearing audit export, runtime storage behavior, or production launch behavior is authorized.

## WO-056 — Live Transcription Provider Review Intake

- **Objective:** Promote live transcription provider review into a planning/control decision package without enabling live transcription credentials, PHI-bearing audio transport, live provider calls, production raw-audio storage, or production launch behavior.
- **Why this exists:** Commercial transcription requires governed provider, BAA/private path, credential, consent, audio transport, raw-audio retention, transcript retention, diarization, confidence/source metadata, retry/dead-letter, support, privacy/security, and audit decisions before live implementation.
- **Prerequisites:** `WO-055` complete and merged; P11 retained; no active SPEC_GAP blocks planning/control work.
- **In scope:** production transcription provider review document, provider/BAA/private-path/credential/consent/audio-transport/retention/diarization/confidence/retry/support/privacy/audit decisions, future acceptance criteria, event/audit inventory, readiness verifier, CI/status/docs updates.
- **Out of scope:** provider selection, contracting approval, live transcription credentials, `.env` files, secret-manager integration, PHI-bearing audio transport, production raw-audio storage, live provider SDK/API calls, real diarization production behavior, PHI-bearing support transcript access, runtime transcription behavior, schema changes, migrations, or production launch approval.
- **UX requirements:** no new route; future operational UX must expose provider disabled/configured/degraded/failed states, browser permission, consent/notice, recording refusal, approved recording exception, low-confidence transcript, diarization unsupported/degraded, correction history, retry/dead-letter, permission-denied, and read-only finalized transcript states before launch readiness.
- **Backend/API requirements:** no new endpoint; future transcription operations must be tenant/site scoped, permission checked, consent/purpose-of-use checked, server mediated, idempotent where retries are plausible, audit/event emitting, fail closed when credentials/consent/context are missing, and reject raw-PHI leakage outside governed provider paths.
- **Data model/persistence requirements:** no schema change; future work must define provider configuration metadata, credential reference metadata, consent/notice evidence, recording chunk metadata, transcription job records, transcript segment provider metadata, confidence/source metadata, diarization/speaker-label metadata, correction history, retry/dead-letter records, retention evidence, support-access evidence, and incident records.
- **Event/audit requirements:** inventory future transcription events including provider config reviewed, credential configured/disabled, consent recorded/denied, recording exception used, chunk upload authorized/denied, transcription job requested/denied, provider request sent/failed, segment received, segment low confidence, correction recorded, dead-lettered, replay requested, raw-audio retention purged, transcript retention preserved, and transcription incident recorded.
- **RBAC/ABAC requirements:** preserve current role boundaries and require future clinician/authorized delegate controls for recording/correction, authorized-admin/integration-admin controls for provider configuration, compliance/privacy controls for review, and support-scope limits for operational metadata.
- **Standalone-mode behavior:** standalone remains mock/local for live transcription until a future approved implementation work order enables a governed provider path; AURA Note remains the source of tenant/site transcription configuration, consent/notice policy, recording exception policy, retention policy, transcript visibility, audit, and support controls.
- **ClinicOS-integrated behavior:** ClinicOS-integrated mode may receive visit/session context and publish transcription status through adapters but cannot bypass AURA Note permissions, consent policy, recording exception rules, tenant/site scoping, purpose-of-use checks, retention controls, audit evidence, or support-access limits.
- **AI/PHI/security requirements:** no real PHI, credentials, tokens, production URLs, `.env`, private keys, live provider calls, PHI-bearing audio payloads, production raw-audio storage, external AI change, autonomous clinical/coding/billing behavior, or launch approval.
- **Testing requirements:** transcription live-review readiness verifier plus audio, storage/retention, post-P11, production, acceptance, status, and whitespace gates.
- **Required scripts/gates:** `pnpm transcription:live-review-readiness`; `pnpm post-p11:readiness`; `pnpm production:readiness`; `pnpm acceptance:readiness`; `node scripts/status.js`; `git diff --check`.
- **Definition of Done:** decision package exists, `WO-056` is indexed and marked done, `next_work_order` remains `null`, readiness scripts pass, and no live transcription credential, PHI-bearing audio transport, live provider call, production raw-audio storage, PHI-bearing support transcript access, runtime transcription behavior, or launch behavior is authorized.
- **Stop conditions:** provider selection, BAA/private-path approval, live credentials, PHI-bearing audio payloads, live SDK/API execution, production raw-audio storage, consent/legal/privacy policy, support transcript access policy, or production launch approval is required before implementation.
- **Risks and deferred decisions:** provider selection, BAA/private deployment path, region, credential source, consent/notice policy, audio transport design, raw-audio retention execution, transcript correction/version retention, diarization reliability, retry/dead-letter policy, support visibility, incident response, and operational ownership remain deferred.

**Implementation status as of `WO-056`:** complete as a planning/control tranche only. The repo now includes `docs/PRODUCTION_TRANSCRIPTION_PROVIDER_REVIEW.md`, `work_orders/WO-056_live_transcription_provider_review_intake.md`, and `pnpm transcription:live-review-readiness`. `next_work_order` remains `null`; no live transcription credential, PHI-bearing audio transport, live provider call, production raw-audio storage, PHI-bearing support transcript access, runtime transcription behavior, or production launch behavior is authorized.

## WO-057 — External AI Private/BAA Pathway Review Intake

- **Objective:** Promote external AI private/BAA pathway review into a planning/control decision package without enabling live AI credentials, raw PHI transfer to external AI, live model calls, production prompt stores, autonomous finalization, or production launch behavior.
- **Why this exists:** Commercial AI use requires governed provider, BAA/private path, credential, prompt registry, model configuration, PHI scrub/de-identification, source freshness, output validation, evaluation, human-review, role-boundary, observability, audit, and incident-response decisions before live implementation.
- **Prerequisites:** `WO-056` complete and merged; P11 retained; no active SPEC_GAP blocks planning/control work.
- **In scope:** production AI private/BAA pathway review document, provider/BAA/private-path/credential/prompt-registry/model-configuration/PHI-scrub/source-freshness/output-validation/evaluation/human-review/role/audit decisions, future acceptance criteria, event/audit inventory, readiness verifier, CI/status/docs updates.
- **Out of scope:** provider selection, contracting approval, live AI credentials, `.env` files, private endpoint setup, secret-manager integration, raw PHI transfer to external AI, live model SDK/API calls, production prompt registry implementation, production model evaluation execution beyond synthetic/local evidence, PHI-bearing support AI content access, runtime AI behavior, schema changes, migrations, autonomous finalization, or production launch approval.
- **UX requirements:** no new route; future operational UX must expose provider disabled/configured/degraded/failed states, prompt/model version states, source freshness, PHI scrub/rejection, output validation failed, unsafe-output rejection, evaluation-blocked release, human-review-required, permission-denied, and read-only audit states before launch readiness.
- **Backend/API requirements:** no new endpoint; future AI operations must be tenant/site scoped, permission checked, purpose-of-use checked, server mediated, AI Gateway enforced, PHI scrubber enforced, source-freshness checked, schema validated, audit/event emitting, fail closed when credentials/purpose/context are missing, and reject autonomous finalization behavior.
- **Data model/persistence requirements:** no schema change; future work must define provider configuration metadata, credential reference metadata, prompt registry records, prompt version records, model configuration records, context package metadata, PHI scrub decisions, request metadata, output validation records, evaluation run records, human-review records, override records, support-access evidence, and incident records.
- **Event/audit requirements:** inventory future AI governance events including provider config reviewed, credential configured/disabled, prompt approved/published/rolled back, model config approved, context package created, PHI scrubbed/rejected, request authorized/denied, provider request sent/failed, output schema validated/rejected, suggestion created, human review recorded, override recorded, evaluation run completed, regression blocked release, and AI incident recorded.
- **RBAC/ABAC requirements:** preserve current role boundaries and require future clinician/authorized delegate controls for clinical suggestion review, billing controls for billing-review candidates, compliance/privacy controls for governance review, authorized-admin/AI-governance controls for prompt/model/provider configuration, and support-scope limits for operational metadata.
- **Standalone-mode behavior:** standalone remains mock/local for live AI until a future approved implementation work order enables a governed provider path; AURA Note remains the source of tenant/site AI policy, prompt registry, model configuration, source freshness, PHI policy, human-review gates, audit, evaluation evidence, and support controls.
- **ClinicOS-integrated behavior:** ClinicOS-integrated mode may provide source context and receive AI governance status through adapters but cannot bypass AURA Note AI Gateway policy, PHI scrubber, tenant/site scoping, role checks, purpose-of-use checks, human-review gates, evaluation thresholds, audit evidence, or support-access limits.
- **AI/PHI/security requirements:** no real PHI, credentials, tokens, production URLs, `.env`, private keys, live model calls, raw PHI transfer to external AI, production prompt stores, production AI output persistence beyond existing synthetic evidence, autonomous diagnosis/coding/billing/finalization behavior, medical-necessity determination, claim submission, or launch approval.
- **Testing requirements:** AI live-review readiness verifier plus AI Gateway, security, post-P11, production, acceptance, status, and whitespace gates.
- **Required scripts/gates:** `pnpm ai:live-review-readiness`; `pnpm post-p11:readiness`; `pnpm production:readiness`; `pnpm acceptance:readiness`; `node scripts/status.js`; `git diff --check`.
- **Definition of Done:** decision package exists, `WO-057` is indexed and marked done, `next_work_order` remains `null`, readiness scripts pass, and no live AI credential, raw-PHI-to-external-AI path, live model call, production prompt store, support AI PHI content access, autonomous finalization, runtime AI behavior, or launch behavior is authorized.
- **Stop conditions:** provider selection, BAA/private-path approval, live credentials, raw PHI transfer, live SDK/API execution, prompt registry implementation, production model evaluation, support AI content access policy, autonomous finalization policy, or production launch approval is required before implementation.
- **Risks and deferred decisions:** provider selection, private/BAA deployment path, region, credential source, prompt registry ownership, model configuration approval, PHI scrub/de-identification policy, source freshness rules, evaluation thresholds, monitoring, drift response, incident response, support visibility, and operational ownership remain deferred.

**Implementation status as of `WO-057`:** complete as a planning/control tranche only. The repo now includes `docs/PRODUCTION_AI_PRIVATE_BAA_PATHWAY_REVIEW.md`, `work_orders/WO-057_external_ai_private_baa_pathway_review_intake.md`, and `pnpm ai:live-review-readiness`. `next_work_order` remains `null`; no live AI credential, raw-PHI-to-external-AI path, live model call, production prompt store, support AI PHI content access, autonomous finalization, runtime AI behavior, or production launch behavior is authorized.

## WO-058 — Production EHR Writeback Credentialing Review Intake

- **Objective:** Promote production EHR writeback credentialing review into a planning/control decision package without enabling production EHR credentials, raw EHR payload storage, live writeback delivery, autonomous finalization, claim submission, or production launch behavior.
- **Why this exists:** `WO-044` created a metadata-only EHR sandbox integration and writeback queue hardening path. Commercial live EHR delivery requires governed credentialing, vendor-neutral adapter boundaries, human approval, idempotency, retry/dead-letter, reconciliation, support, and audit decisions before implementation.
- **Prerequisites:** `WO-057` complete and merged; P11 retained; no active SPEC_GAP blocks planning/control work.
- **In scope:** production EHR writeback credentialing review document, vendor credentialing/credential-source/adapter/writeback-scope/human-approval/idempotency/retry/dead-letter/reconciliation/support/audit decision inventory, future acceptance criteria, readiness verifier, CI/status/docs updates.
- **Out of scope:** production EHR credentials, `.env` files, private keys, secret-manager integration, live vendor API calls, raw EHR payload storage, live writeback delivery, writeback without human approval, runtime EHR behavior, schema changes, migrations, claim submission, charge finalization, medical-necessity determination, autonomous clinical/coding/billing finalization, or production launch approval.
- **UX requirements:** no new route; future operational UX must expose disabled/configured/degraded/failed, approval-required, denied, pending-delivery, delivered, dead-lettered, reconciliation-needed, permission-denied, and read-only states through typed API clients and persisted backend state before launch readiness.
- **Backend/API requirements:** no new endpoint; future live EHR operations must be tenant/site scoped, permission checked, purpose-of-use checked, server mediated, idempotent where retries are plausible, audit/event emitting, fail closed when credentials/mappings/context are missing, and preserve human approval before delivery.
- **Data model/persistence requirements:** no schema change; future work must define vendor configuration metadata, credential reference metadata, writeback scope approvals, payload preparation metadata, human approval/denial records, delivery attempts, vendor acknowledgements, retry/dead-letter records, reconciliation records, attachment/task handoff metadata, support evidence, and incident records.
- **Event/audit requirements:** inventory future EHR events including vendor config reviewed, credential configured/disabled, writeback scope approved, payload prepared, writeback approved/denied, idempotency replayed, request sent/failed, delivery confirmed, dead-lettered, reconciliation completed, attachment exported, task handoff created, and incident recorded.
- **RBAC/ABAC requirements:** preserve current role boundaries and require future clinician/authorized approver controls for writeback approval, authorized-admin/integration-admin controls for vendor configuration, compliance/privacy controls for review, billing controls only where billing review is triggered, and support-scope limits for operational metadata.
- **Standalone-mode behavior:** standalone remains metadata-only/mock for live EHR delivery until a future approved implementation work order enables a governed vendor path; AURA Note remains the source of tenant/site writeback configuration, approval policy, idempotency, audit, reconciliation, and support controls.
- **ClinicOS-integrated behavior:** ClinicOS-integrated mode may provide context and receive writeback status through adapters, but cannot bypass AURA Note permissions, tenant/site scoping, purpose-of-use checks, human approval, idempotency, PHI policy, audit evidence, reconciliation, or support-access limits.
- **AI/PHI/security requirements:** no real PHI, credentials, tokens, production URLs, `.env`, private keys, live vendor calls, raw EHR payload storage, live writeback delivery, external AI change, autonomous clinical/coding/billing behavior, medical-necessity determination, claim submission, or launch approval.
- **Testing requirements:** EHR live-review readiness verifier plus EHR integration, post-P11, production, acceptance, status, and whitespace gates.
- **Required scripts/gates:** `pnpm ehr:live-review-readiness`; `pnpm ehr:integration-readiness`; `pnpm post-p11:readiness`; `pnpm production:readiness`; `pnpm acceptance:readiness`; `node scripts/status.js`; `git diff --check`.
- **Definition of Done:** decision package exists, `WO-058` is indexed and marked done, `next_work_order` remains `null`, readiness scripts pass, and no production EHR credential, raw EHR payload storage, live writeback delivery, writeback without human approval, runtime EHR behavior, autonomous finalization, claim submission, or launch behavior is authorized.
- **Stop conditions:** production credential selection, live vendor credential, live SDK/API execution, raw EHR payload retention, writeback without human approval, vendor contracting, legal/privacy/security policy, rollback/reconciliation policy, claim/charge submission policy, or production launch approval is required before implementation.
- **Risks and deferred decisions:** production athenahealth credentialing, credential source, vendor-neutral adapter scope, approved writeback object types, raw payload retention policy, human approval role, idempotency strategy, retry/dead-letter policy, reconciliation ownership, vendor acknowledgement handling, attachment/task semantics, support visibility, incident response, and operational ownership remain deferred.

**Implementation status as of `WO-058`:** complete as a planning/control tranche only. The repo now includes `docs/PRODUCTION_EHR_WRITEBACK_CREDENTIALING_REVIEW.md`, `work_orders/WO-058_production_ehr_writeback_credentialing_review_intake.md`, and `pnpm ehr:live-review-readiness`. `next_work_order` remains `null`; no production EHR credential, raw EHR payload storage, live writeback delivery, writeback without human approval, autonomous finalization, runtime EHR behavior, claim submission, or production launch behavior is authorized.

## WO-059 — ClinicOS Live Integration Review Intake

- **Objective:** Promote ClinicOS live integration review into a planning/control decision package without enabling live ClinicOS credentials, live ClinicOS event-bus delivery, delegated identity bypass, raw ClinicOS payload storage, live synchronization, runtime ClinicOS behavior, or production launch behavior.
- **Why this exists:** `WO-045` created synthetic/browser/API-testable ClinicOS integration hardening evidence. Commercial embedded use requires governed live module contracts, delegated identity posture, service-account governance, tenant/user mapping, event-bus delivery, replay/reconciliation, degraded-mode, audit, and support decisions before implementation.
- **Prerequisites:** `WO-058` complete and merged; P11 retained; no active SPEC_GAP blocks planning/control work.
- **In scope:** production ClinicOS live integration review document, M03/M04/M17/M21/M23/M24/M25/M26 module contract inventory, delegated identity/service-account/tenant-site-user-patient mapping/event-bus/replay/reconciliation/degraded-mode/support/audit decision inventory, future acceptance criteria, readiness verifier, CI/status/docs updates.
- **Out of scope:** live ClinicOS credentials, `.env` files, private keys, secret-manager integration, live event-bus calls, live synchronization, raw ClinicOS payload storage, delegated identity bypass, runtime ClinicOS behavior, schema changes, migrations, external AI change, EHR writeback delivery, claim submission, charge finalization, medical-necessity determination, autonomous clinical/coding/billing finalization, or production launch approval.
- **UX requirements:** no new route; future embedded UX must expose standalone, embedded, unavailable, stale, degraded, replay-needed, reconciliation-needed, permission-denied, approval-required, failed-publication, and read-only states through typed API clients and persisted backend state before any launch claim.
- **Backend/API requirements:** no new endpoint; future live ClinicOS operations must be tenant/site scoped, permission checked, purpose-of-use checked, server mediated, idempotent where replay is plausible, audit/event emitting, fail closed when credentials/mappings/context are missing, and preserve AURA Note permissions as authoritative.
- **Data model/persistence requirements:** no schema change; future work must define module contract metadata, service-account reference metadata, delegated identity mappings, tenant/site/user/patient mappings, source freshness records, publication attempts, acknowledgements, retry/dead-letter records, replay requests, reconciliation records, degraded-mode records, support evidence, and incident records.
- **Event/audit requirements:** inventory future ClinicOS events including module contract reviewed, service account configured/disabled, delegated identity reviewed, tenant/site/user/patient mapping reviewed, VisitGraph/WorkOS/Charge Integrity/Copilot/Governance/Integration Hub/Data Cloud mapping reviewed, event publication authorized/denied/failed, replay requested, reconciliation completed, degraded mode entered, and incident recorded.
- **RBAC/ABAC requirements:** preserve current role boundaries and require future authorized-admin/integration-admin controls for live configuration, service-account controls for publication only within least-privilege scope, compliance/privacy controls for review, clinician/MA/billing visibility only where AURA Note permissions allow, and support-scope limits for operational metadata.
- **Standalone-mode behavior:** standalone remains fully supported and cannot become dependent on ClinicOS for core AURA Note v1 workflows. Missing ClinicOS mappings or unavailable ClinicOS services must degrade safely without blocking standalone documentation/finalization/export behavior unless a future approved work order explicitly defines that dependency.
- **ClinicOS-integrated behavior:** ClinicOS-integrated mode may receive context and publish status through adapters only after future approval. It cannot bypass AURA Note permissions, tenant/site scoping, purpose-of-use checks, human approval gates, AI/PHI policy, audit evidence, reconciliation, or support-access limits.
- **AI/PHI/security requirements:** no real PHI, credentials, tokens, production URLs, `.env`, private keys, live event-bus calls, raw ClinicOS payload storage, live synchronization, external AI change, autonomous clinical/coding/billing behavior, medical-necessity determination, claim submission, or launch approval.
- **Testing requirements:** ClinicOS live-review readiness verifier plus ClinicOS integration, post-P11, production, acceptance, status, and whitespace gates.
- **Required scripts/gates:** `pnpm clinicos:live-review-readiness`; `pnpm clinicos:integration-readiness`; `pnpm post-p11:readiness`; `pnpm production:readiness`; `pnpm acceptance:readiness`; `node scripts/status.js`; `git diff --check`.
- **Definition of Done:** decision package exists, `WO-059` is indexed and marked done, `next_work_order` remains `null`, readiness scripts pass, and no live ClinicOS credential, live event-bus delivery, delegated identity bypass, raw ClinicOS payload storage, live synchronization, runtime ClinicOS behavior, autonomous finalization, claim submission, or launch behavior is authorized.
- **Stop conditions:** live ClinicOS credential selection, service-account configuration, live event-bus execution, delegated identity policy, raw ClinicOS payload retention, module contract approval, tenant/user mapping policy, replay/reconciliation policy, legal/privacy/security policy, claim/charge submission policy, or production launch approval is required before implementation.
- **Risks and deferred decisions:** live ClinicOS module contracts, delegated identity posture, service-account governance, tenant/site/user/patient mapping, event-bus delivery, replay/reconciliation ownership, degraded-mode policy, raw payload retention policy, Data Cloud analytics boundary, support visibility, incident response, and operational ownership remain deferred.

**Implementation status as of `WO-059`:** complete as a planning/control tranche only. The repo now includes `docs/PRODUCTION_CLINICOS_LIVE_INTEGRATION_REVIEW.md`, `work_orders/WO-059_clinicos_live_integration_review_intake.md`, and `pnpm clinicos:live-review-readiness`. `next_work_order` remains `null`; no live ClinicOS credential, live event-bus delivery, delegated identity bypass, raw ClinicOS payload storage, live synchronization, runtime ClinicOS behavior, autonomous finalization, claim submission, or production launch behavior is authorized.

## WO-060 — Commercial Readiness Rebaseline And Runtime Implementation Rails

- **Objective:** Reopen the build with a commercial-readiness implementation sequence from synthetic/local scaffold toward production-intended runtime architecture.
- **Why this exists:** `WO-052` through `WO-059` were planning/control intake tranches and left the repo intentionally stopped at P11 with `next_work_order: null`.
- **Prerequisites:** `WO-000` through `WO-059` complete on `main`; founder approval to reopen implementation after P11.
- **In scope:** CR-0 through CR-4 checkpoints; `WO-060` through `WO-075` planning; commercial readiness roadmap; definition of done; remaining synthetic-to-runtime gaps; Figma handoff plan; status, run-log, SPEC_GAPS, checkpoint, package, CI, and readiness-script updates.
- **Out of scope:** runtime product behavior, production credentials, live PHI, live EHR, live ClinicOS, live transcription vendor, live external AI, claim submission, charge finalization, medical-necessity determination, autonomous clinical/coding/billing behavior, or production launch approval.
- **UX requirements:** document the complete future UI/Figma handoff path without claiming final Figma fidelity or production UI completion.
- **Backend/API requirements:** add planning/readiness validation only; no new endpoint or runtime service behavior.
- **Data model/persistence requirements:** no schema or migration change; identify future persistence gaps and RLS expectations.
- **Event/audit requirements:** no runtime event change; record plan/run-log evidence and require future state changes to keep audit/domain events.
- **RBAC/ABAC requirements:** preserve existing role boundaries and require future work to keep tenant/site/purpose/relationship enforcement.
- **Standalone-mode behavior:** standalone remains default and must become fully usable without ClinicOS through later CR work.
- **ClinicOS-integrated behavior:** ClinicOS remains adapter-bound and disabled/degraded unless future approved work enables governed live behavior.
- **AI/PHI/security requirements:** preserve no raw PHI to external AI, draft-only AI, no live credentials, no real PHI, and no launch/certification claims.
- **Testing requirements:** validate plan/status/checkpoints/no-launch-claim posture and run the required planning gates.
- **Required scripts/gates:** `pnpm commercial:readiness-plan`; `pnpm production:readiness`; `pnpm acceptance:readiness`; `pnpm lint`; `pnpm typecheck`; `git diff --check`.
- **Definition of Done:** `WO-060` through `WO-075` are discoverable and scoped; `WO-060` is recorded complete; `WO-061` is the next active work order; CR-0 checkpoint is recorded; current state is explicitly not commercial production-ready; no live vendor/PHI/claim/launch/autonomous behavior is introduced.
- **Stop conditions:** a requested launch, credential, live PHI, live vendor, autonomous diagnosis/coding/billing, claim submission, or compliance claim lacks explicit future approval.
- **Risks and deferred decisions:** commercial readiness still depends on runtime persistence, identity, UI API conversion, Figma design, live-vendor governance, security/privacy review, beta approval, and final launch approval.

**Implementation status as of `WO-060`:** complete as CR-0 planning/control rails. The repo now includes commercial-readiness roadmap, definition-of-done, synthetic-to-runtime gap tracking, Figma handoff planning, `work_orders/WO-060_commercial_readiness_rebaseline_runtime_rails.md`, `work_orders/WO-061_runtime_persistence_switchover_core_workflow.md`, and `pnpm commercial:readiness-plan`. `WO-061` is the next active runtime implementation target. No live vendor, live PHI, production credential, autonomous clinical/coding/billing behavior, claim submission, or production launch approval is enabled.

## WO-061 — Runtime Persistence Switchover For Core Workflow

- **Objective:** Move core runtime behavior away from direct in-memory state and toward repository interfaces with local Prisma/PostgreSQL as the production-shaped local runtime adapter.
- **Why this exists:** P7 persistence evidence exists in packages and adapters, but the main API runtime still uses in-memory/synthetic state in key areas.
- **Prerequisites:** `WO-060`; existing Prisma schema, repository adapters, local PostgreSQL evidence, and RLS foundations.
- **In scope:** dependency-injected repository ports for schedule, appointment, note, visit session, transcript, selections, suggestions, compliance, history gaps, tasks, finalization, exports, writeback, templates, dot phrases, rules catalog, settings, coaching, audit events, and domain events; explicit demo/test in-memory adapters; `AURA_NOTE_RUNTIME_PERSISTENCE=prisma_local`; process-restart persistence evidence.
- **Out of scope:** production PHI database enablement, production database credentials, live migrations, live vendor calls, or schema redesign beyond missing persistence methods required by the work order.
- **UX requirements:** existing core flows must survive API/service recreation and reload while preserving loading, ready, saving, failed, permission-denied, read-only, blocked, degraded, and demo states where already exposed.
- **Backend/API requirements:** main services use repository ports rather than direct `createInMemory...` construction for production-intended paths; writes remain tenant/site scoped, permission checked, idempotent where plausible, and audit/event emitting.
- **Data model/persistence requirements:** Prisma/local PostgreSQL becomes the production-shaped local runtime path for core workflow state; in-memory remains explicit demo/test only; cross-tenant and cross-site persisted operations are denied.
- **Event/audit requirements:** persisted state-changing operations write durable audit/domain event evidence or explicitly documented temporary stubs.
- **RBAC/ABAC requirements:** role, tenant, site, purpose-of-use, relationship, support, and billing-review boundaries remain enforced before repository access.
- **Standalone-mode behavior:** standalone owns durable workflow records locally.
- **ClinicOS-integrated behavior:** ClinicOS identifiers map through adapter boundaries and cannot bypass AURA Note persistence permissions.
- **AI/PHI/security requirements:** no production PHI persistence; synthetic/local data only; logs redacted; AI output remains draft/candidate.
- **Testing requirements:** process-restart persistence for appointment, visit, selection, finalization, export, and audit/domain events; negative cross-tenant/site tests; API/browser E2E survival evidence.
- **Required scripts/gates:** `pnpm runtime:persistence-readiness`; default local gate; `pnpm commercial:readiness-plan`.
- **Definition of Done:** main runtime services use repository ports; local Prisma runtime persists core workflow across service recreation; demo/test in-memory usage is explicit; tenant/site/RBAC/audit/idempotency evidence passes.
- **Stop conditions:** production PHI storage, database credential, migration approval, or unresolved schema policy ambiguity is required.
- **Risks and deferred decisions:** production database host, migration operations, backup/restore, and live PHI approval remain deferred.

**Implementation status as of `WO-061`:** complete as the first CR-1 runtime foundation tranche. `ScheduleService` now receives explicit repository and object-storage adapters instead of directly constructing hidden in-memory state, the in-memory schedule adapter is labeled as demo/test only, `AURA_NOTE_RUNTIME_PERSISTENCE=prisma_local` is resolved through a fail-closed local PostgreSQL configuration check, and `createPrismaCoreWorkflowRuntimeRepository` composes the existing Prisma schedule, visit-capture, review-panel, finalization/output, and runtime-metadata adapters. `pnpm runtime:persistence-readiness` starts synthetic local PostgreSQL, applies generated Prisma schema SQL, persists a full synthetic core workflow, and reloads it through fresh repository instances with cross-tenant and cross-site denial evidence. This remains synthetic/local evidence, not production PHI database approval; broad request-boundary hardening remains `WO-062`.

## WO-062 — API Runtime Hardening And Request Boundary

- **Objective:** Harden the NestJS runtime boundary with validation, errors, logging, redaction, security headers, request limits, and consistent response behavior.
- **Why this exists:** A commercial runtime cannot rely on minimal bootstrap behavior or inconsistent endpoint validation.
- **Prerequisites:** `WO-061`; current DTO/OpenAPI and security helpers.
- **In scope:** global validation pipe, global exception filter, request/trace ID middleware, structured redacted logging, body-size limits, CORS/security header posture, rate-limit/throttle scaffold, schema coverage for implemented public endpoints, OpenAPI updates as needed.
- **Out of scope:** raw audio upload transport, live WAF/CDN configuration, production SIEM/APM vendor integration, or launch approval.
- **UX requirements:** API errors map to clear route states without leaking PHI or stack traces.
- **Backend/API requirements:** all public endpoints pass through the same request boundary and return standard AURA Note envelopes or documented safe exceptions.
- **Data model/persistence requirements:** no schema change unless request-boundary evidence needs persisted audit metadata already in scope.
- **Event/audit requirements:** denied and failed state-changing operations produce audit-safe evidence where required.
- **RBAC/ABAC requirements:** missing/invalid role/session/tenant/site contexts fail closed.
- **Standalone-mode behavior:** local standalone API remains usable with explicit local/demo config.
- **ClinicOS-integrated behavior:** delegated/ClinicOS contexts remain fail-closed unless configured and still pass AURA Note guards.
- **AI/PHI/security requirements:** logs exclude raw PHI, transcript/final-note text, billing detail, raw audio, tokens, secrets, and EHR payloads.
- **Testing requirements:** invalid body, oversized body, missing context, cross-tenant request, forbidden PHI-like payload, redacted logs, and standard envelope tests.
- **Required scripts/gates:** `pnpm api:runtime-hardening-readiness`; default local gate.
- **Definition of Done:** API bootstrap is production-shaped; all implemented public endpoints validate consistently; negative and redaction tests pass.
- **Stop conditions:** security policy ambiguity about accepted payload size, CORS origins, or production auth requirements blocks safe defaulting.
- **Risks and deferred decisions:** production WAF, gateway, and observability vendor policies remain deferred.

**Implementation status as of `WO-062`:** complete as the second CR-1 runtime foundation tranche. The Nest API now uses shared `configureAuraApi` bootstrap wiring in both `main.ts` and API e2e tests; implemented public endpoints pass through global JSON-object validation, PHI/credential/raw-audio/raw-transcript boundary checks, request/trace correlation headers, security headers, body-size guardrails, local rate-limit headers, PHI-safe standard error envelopes, and redacted in-memory structured runtime logs. Governed AI mock-invocation payloads still pass to the AI Gateway so its explicit reject/redact policy, audit metadata, and `ai.phi_rejected.v1` evidence remain authoritative. `pnpm api:runtime-hardening-readiness` verifies the boundary files, contracts, CI wiring, docs/status/run-log evidence, and negative tests. This remains synthetic/local request-boundary evidence only; production WAF/CDN, live SIEM/APM, production identity, production PHI storage, live vendors, autonomous clinical/coding/billing behavior, claim submission, and production launch remain disabled.

## WO-063 — Identity Runtime Boundary And Production Fail-Closed Auth Scaffold

- **Objective:** Prevent synthetic header identity from becoming accidental production auth.
- **Why this exists:** Local synthetic headers are useful in tests but unsafe if trusted in preview or production modes.
- **Prerequisites:** `WO-062`; identity and RBAC/ABAC helpers from prior work.
- **In scope:** identity adapter interface; local demo adapter; local synthetic test adapter; production OIDC, SAML, and ClinicOS delegated placeholders; fail-closed auth guard; purpose-of-use, session expiration, disabled-user, and access-review scaffolding; frontend client labeling of test/demo headers.
- **Out of scope:** live OIDC/SAML, production IdP credentials, real user directory sync, live ClinicOS delegated identity, runtime break-glass access.
- **UX requirements:** frontend routes expose permission-denied, expired-session, disabled-user, missing-purpose, delegated-denied, and read-only/degraded states where relevant.
- **Backend/API requirements:** synthetic role/tenant/user headers are allowed only for `AURA_NOTE_AUTH_MODE=local_demo` or `AURA_NOTE_AUTH_MODE=local_synthetic`; production/preview fail closed unless an auth adapter is configured.
- **Data model/persistence requirements:** add or reuse session/user/access-review metadata only if required by the scaffold; no production identity store is enabled.
- **Event/audit requirements:** identity accepted, denied, expired, disabled-user, missing-purpose, and delegated-denied events are audit-safe.
- **RBAC/ABAC requirements:** arbitrary client headers cannot spoof role, tenant, site, user, purpose, or relationship outside local/demo mode.
- **Standalone-mode behavior:** standalone local synthetic identity remains explicit for development and tests.
- **ClinicOS-integrated behavior:** ClinicOS delegated identity remains disabled/fail-closed until configured and cannot bypass AURA Note permissions.
- **AI/PHI/security requirements:** no tokens, secrets, credentials, raw PHI, or live identity claims are committed or exposed.
- **Testing requirements:** local synthetic accepted, synthetic rejected in production mode, disabled user denied, expired session denied, wrong tenant/site denied, support PHI denial, billing transcript access only when billing review is triggered.
- **Required scripts/gates:** `pnpm identity:runtime-boundary-readiness`; default local gate.
- **Definition of Done:** production auth cannot trust client-provided role headers by accident; local tests continue through explicit local synthetic mode.
- **Stop conditions:** live IdP or delegated identity policy is required.
- **Risks and deferred decisions:** production IdP, MFA, account recovery, access review, and break-glass remain deferred.

**Implementation status as of `WO-063`:** complete as the third CR-1 runtime foundation tranche. The Nest API now has a shared identity runtime boundary after request correlation and before controller execution. `AURA_NOTE_AUTH_MODE=local_demo` labels and normalizes local browser/demo synthetic headers; `AURA_NOTE_AUTH_MODE=local_synthetic` requires explicit role, user, session, and purpose headers. Preview OIDC, production OIDC, production SAML, and ClinicOS delegated auth postures reject synthetic headers and fail closed while live adapters remain unconfigured. Runtime denial states cover missing identity context, invalid identity context, disabled user, expired session, wrong tenant/site, wrong purpose, delegated-not-configured, and synthetic-headers-forbidden. `pnpm identity:runtime-boundary-readiness` verifies the runtime files, tests, contracts/OpenAPI DTO seed, docs/status/run-log/checkpoint evidence, CI wiring, and no-live-credential/no-launch posture. This remains synthetic/local identity evidence only; live OIDC/SAML/ClinicOS delegation, raw token validation, MFA, SCIM, account recovery, break-glass, production PHI access, claim submission, and production launch remain disabled.

## WO-064 — Primary UI Runtime API Conversion

- **Objective:** Convert primary production-intended AURA Note screens from authoritative local React fixture state to typed API-backed runtime state.
- **Why this exists:** The Frontend Runtime Integration Gate currently has one API-backed evidence route while many primary routes still use local fixture state.
- **Prerequisites:** CR-1 complete; typed API client and persisted backend runtime state for core flows.
- **In scope:** `/aura-note`, `/aura-note/schedule`, `/aura-note/drafts`, `/aura-note/workspace/[appointmentId]`, `/aura-note/finalization/[noteId]`, `/aura-note/finalized`, `/aura-note/finalized/[noteId]`, `/aura-note/operations`, `/aura-note/platform`, `/aura-note/integrations/ehr`, `/aura-note/integrations/clinicos`, `/aura-note/ai-governance`, `/aura-note/coaching`, and `/aura-note/support/status`; typed loaders/actions; documented demo-only fixtures.
- **Out of scope:** final Figma styling, live vendors, production PHI, browser storage credentials, or client-side auth trust.
- **UX requirements:** every affected route exposes loading, empty, ready, saving, failed, permission-denied, read-only, and where relevant blocked, degraded, disabled, and demo states backed by API responses or documented mocks.
- **Backend/API requirements:** missing screen data/actions get typed client methods and API support or documented disabled/mock adapter responses.
- **Data model/persistence requirements:** production-intended route state reads/mutates persisted backend records unless the work order documents a disabled vendor mock.
- **Event/audit requirements:** state-changing UI actions call audit/event-emitting backend operations.
- **RBAC/ABAC requirements:** route-level permission-denial states are backed by API denial paths, not only hidden UI.
- **Standalone-mode behavior:** standalone route flow works without ClinicOS.
- **ClinicOS-integrated behavior:** ClinicOS routes use adapter-backed state or degraded/disabled mocks without permission bypass.
- **AI/PHI/security requirements:** no patient-facing route exposes internal revenue, billing, confidence, coaching, audit, or PHI beyond role permissions.
- **Testing requirements:** Playwright seeds through API and verifies each primary route renders from backend state after reload.
- **Required scripts/gates:** `pnpm frontend:primary-runtime-readiness`; `pnpm frontend:runtime-integration-readiness`; default local gate.
- **Definition of Done:** primary screens no longer use local fixture arrays as authoritative product data; route data sources are updated in `docs/FRONTEND_RUNTIME_INTEGRATION.md`.
- **Stop conditions:** backend support is missing for a high-risk route and cannot be safely stubbed behind documented disabled mode.
- **Risks and deferred decisions:** visual design remains deferred to Figma; live vendors remain gated.

**Implementation status as of `WO-064`:** complete as synthetic/local CR-2 primary UI runtime evidence. The primary AURA Note routes now use `apps/web/lib/aura-note-api-client.ts` for typed API loaders/actions, and Playwright seeds backend-backed workflows for schedule, workspace, finalized-note, and appointment-through-finalization/export reload evidence. Local React state remains only for transient controls, form text, tabs, and documented disabled/demo adapter presentation. `pnpm frontend:primary-runtime-readiness` verifies route files, typed-client expansion, ClinicOS mode header support, route inventory, test evidence, status/run-log evidence, and no-live/no-launch posture. This does not enable live vendors, production PHI, production credentials, autonomous clinical/coding/billing behavior, claim submission, or production launch.

## WO-065 — Figma-Ready Basic UI Scaffold And Screen Inventory

- **Objective:** Ensure the basic UI contains every product surface, workflow, state, panel, modal, drawer, table, form, action, and artifact Figma must design later.
- **Why this exists:** Figma needs a complete product map before high-fidelity design, not polished partial screens.
- **Prerequisites:** `WO-064`; current UX build spec and frontend runtime inventory.
- **In scope:** `docs/FIGMA_SCREEN_INVENTORY.md`, `docs/FIGMA_COMPONENT_INVENTORY.md`, `docs/FIGMA_STATE_MATRIX.md`, `docs/FIGMA_WORKFLOW_MAP.md`, `docs/FIGMA_ROLE_AND_PERMISSION_VIEWS.md`, `docs/FIGMA_DATA_AND_API_MAP.md`, `docs/FIGMA_CONTENT_COPY_GUIDE.md`, `docs/FIGMA_HANDOFF_CHECKLIST.md`, `/aura-note/figma-handoff`, semantic placeholders for all required product surfaces and states.
- **Out of scope:** final Figma visual fidelity, brand system finalization, production design approval, or new product behavior beyond visible placeholders.
- **UX requirements:** simple accessible layouts; clear sections/tables/panels/drawers/tabs/modals/banners; visible placeholders for roles, disabled commercial features, high-risk actions, states, responsive notes, and accessibility notes.
- **Backend/API requirements:** document API sources for each screen/action; use documented mocks only where live dependencies remain disabled.
- **Data model/persistence requirements:** inventory visible data objects and persistence source for each screen; no schema change unless needed by route inventory.
- **Event/audit requirements:** inventory high-risk/state-changing actions and their audit/event expectations.
- **RBAC/ABAC requirements:** role-specific views and permission-denied/read-only states are included.
- **Standalone-mode behavior:** Figma handoff includes standalone entry points and daily-use workflows.
- **ClinicOS-integrated behavior:** Figma handoff includes embedded/degraded/unavailable adapter states.
- **AI/PHI/security requirements:** copy guide preserves draft-only AI, PHI boundaries, no patient-facing internal revenue/coaching/confidence leakage, and no launch/certification claims.
- **Testing requirements:** inventory verifier; route/browser check for `/aura-note/figma-handoff`; accessibility semantics for critical controls.
- **Required scripts/gates:** `pnpm figma:handoff-readiness`; default local gate.
- **Definition of Done:** Figma can design the complete app without guessing screens, states, actions, permissions, or data sources.
- **Stop conditions:** a screen/action requires unspecified product policy or high-risk workflow behavior.
- **Risks and deferred decisions:** final visual design, exact component library, and brand polish remain deferred.

## WO-066 — Standalone Workflow Completion

- **Objective:** Make standalone AURA Note usable end to end without ClinicOS.
- **Why this exists:** AURA Note is standalone-first and cannot rely on ClinicOS for core v1 daily operation.
- **Prerequisites:** `WO-065`; CR-1 runtime foundation and API-backed primary routes.
- **In scope:** standalone patient shell/search/edit; schedule day/week and appointment lifecycle; appointment-to-note shell lifecycle; timer/editor gate; recording exception; metadata-only transcription and correction history; Suggestions, Visit Selections, Compliance, History Gap, MA blockers; all six Finalization Wizard steps; final note, patient summary, copy/export/PDF metadata, disabled/mock writeback; operations queues; templates, dot phrases, rules catalog, estimate config; coaching scaffolds; complete standalone E2E journey.
- **Out of scope:** live ClinicOS, live EHR writeback, live transcription provider, live AI, production PHI storage, claim submission, charge finalization, or final visual design.
- **UX requirements:** complete clinician/admin/scheduler/MA/billing/support standalone flow with empty, loading, ready, saving, blocked, failed, permission-denied, read-only, disabled/degraded, and demo states.
- **Backend/API requirements:** every user-facing action has API support or documented safe disabled/mock behavior.
- **Data model/persistence requirements:** workflow state is durable in local Prisma/PostgreSQL where work order requires; temporary demo state is isolated.
- **Event/audit requirements:** patient, schedule, visit, transcript, review, task, finalization, billing, export, coaching, and disabled-writeback actions emit audit/domain evidence.
- **RBAC/ABAC requirements:** role-denial and minimum-necessary visibility for clinicians, MAs, billing, admins, support, and authorized admins.
- **Standalone-mode behavior:** standalone is complete for core v1 operation.
- **ClinicOS-integrated behavior:** ClinicOS remains optional and degraded safely when unavailable.
- **AI/PHI/security requirements:** suggestions are candidate-only; no claim submission; no autonomous finalization; synthetic data only.
- **Testing requirements:** complete standalone E2E journey from admin setup through appointment, documentation, finalization, export metadata, read-only final note, and coaching signal.
- **Required scripts/gates:** `pnpm standalone:e2e-readiness`; default local gate.
- **Definition of Done:** standalone app has a coherent v1 daily-use workflow and proves no claim submission or autonomous finalization.
- **Stop conditions:** product policy is missing for a required standalone action or finalization/billing boundary.
- **Risks and deferred decisions:** production patient matching, live vendors, and final Figma design remain deferred.

## WO-067 — ModeResolver And Adapter Runtime Wiring

- **Objective:** Implement the application-level mode resolver and enforce standalone-vs-ClinicOS adapter boundaries in runtime code.
- **Why this exists:** The product must be built once and support both modes without hard-coded standalone assumptions.
- **Prerequisites:** CR-2 complete; current adapter contracts.
- **In scope:** `ModeResolver`; `ScheduleSourceAdapter`, `PatientContextAdapter`, `VisitGraphAdapter`, `TaskAdapter`, `AuditAdapter`, `AIGovernanceAdapter`, `ChargeIntegrityAdapter`, `EhrAdapter`, `ExportAdapter`, and `IdentityAdapter`; standalone, ClinicOS scaffold, and mock/demo implementations.
- **Out of scope:** live ClinicOS credentials, live event bus, raw ClinicOS payload storage, or production synchronization.
- **UX requirements:** visible standalone, embedded, unavailable, stale, degraded, replay-needed, reconciliation-needed, permission-denied, approval-required, failed-publication, and read-only states where relevant.
- **Backend/API requirements:** runtime services call adapters for appointments, patients, visits, tasks, identity, audit, AI, charge integrity, writeback, and exports.
- **Data model/persistence requirements:** mode mappings and adapter metadata are durable where required; no raw live payload storage.
- **Event/audit requirements:** mode resolution, adapter calls, degraded states, denied delegation, and publication attempts are audit-safe.
- **RBAC/ABAC requirements:** ClinicOS cannot bypass AURA Note permissions, human review, tenant/site isolation, purpose-of-use, or PHI policy.
- **Standalone-mode behavior:** standalone remains default and fully usable.
- **ClinicOS-integrated behavior:** ClinicOS mode can be exercised in mock/degraded tests and fails safely when disabled/unavailable.
- **AI/PHI/security requirements:** no live ClinicOS, live AI, live EHR, live writeback, or raw payload behavior.
- **Testing requirements:** standalone default, ClinicOS disabled, ClinicOS degraded, mock adapter success, cross-tenant/service-account denial.
- **Required scripts/gates:** `pnpm mode:adapter-readiness`; default local gate.
- **Definition of Done:** services use `ModeResolver` where required; standalone works; ClinicOS mock/degraded paths are testable and permission-bound.
- **Stop conditions:** live module contract or delegated identity behavior is required.
- **Risks and deferred decisions:** live ClinicOS contracts and event-bus semantics remain deferred.

## WO-068 — Transcription Runtime Boundary And Provider-Ready Interface

- **Objective:** Make transcription production-shaped while keeping live provider calls disabled until future approval.
- **Why this exists:** Browser recording and mock transcription exist, but future provider integration needs a clean runtime boundary.
- **Prerequisites:** `WO-067`; current audio/transcription candidate.
- **In scope:** transcription provider adapter interface, deterministic mock provider, disabled live-provider placeholders, browser/device/permission/interruption/retry/long-visit/pause/resume/no-audio/provider-unavailable/correction-history states, raw-audio one-week and transcript indefinite retention evidence.
- **Out of scope:** live transcription credentials, PHI-bearing audio payload transport, live provider calls, production raw-audio storage, or provider selection.
- **UX requirements:** permission denied, device unavailable, upload interrupted, provider unavailable, low-confidence, diarization unsupported/degraded, correction history, exception path, read-only finalized transcript.
- **Backend/API requirements:** provider boundary is server-side, fail-closed, tenant/site scoped, permission checked, idempotent for retries, and audit/event emitting.
- **Data model/persistence requirements:** recording chunk metadata, transcription jobs, transcript segment provider metadata, confidence/source/speaker labels, correction history, retry/dead-letter, retention evidence.
- **Event/audit requirements:** consent/exception, chunk authorized/denied, job requested/denied, provider disabled/unavailable, segment received, correction recorded, purge/transcript-retention evidence.
- **RBAC/ABAC requirements:** transcript visibility follows clinician/billing/admin/support rules and billing-review trigger.
- **Standalone-mode behavior:** standalone uses mock/local provider until governed live provider approval.
- **ClinicOS-integrated behavior:** ClinicOS may provide visit context and receive status through adapters without bypassing AURA Note rules.
- **AI/PHI/security requirements:** no raw PHI leaves governed local path; no live external AI; logs redacted.
- **Testing requirements:** all provider/device/error states, correction history, transcript non-deletion, raw-audio retention metadata, role-denial.
- **Required scripts/gates:** `pnpm transcription:runtime-boundary-readiness`; default local gate.
- **Definition of Done:** runtime boundary is provider-ready, no live call is made, and retention/visibility evidence passes.
- **Stop conditions:** provider selection, BAA, consent policy, or live audio transport policy is required.
- **Risks and deferred decisions:** live provider, diarization reliability, production audio storage, and consent/legal policy remain deferred.

## WO-069 — Athenahealth Sandbox And Vendor-Neutral EHR Runtime Boundary

- **Objective:** Harden the EHR adapter path around athenahealth-first sandbox readiness while preserving vendor-neutral interfaces.
- **Why this exists:** Commercial EHR use needs sandbox-shaped behavior, human approval, retry/dead-letter, reconciliation, and disabled credential handling.
- **Prerequisites:** `WO-068`; current EHR adapter and writeback queue evidence.
- **In scope:** patient lookup, appointment import, encounter context, chart context slices, note/patient-summary writeback queue, retry/dead-letter/reconciliation, disabled credential behavior, human approval gates, generic EHR adapter preservation.
- **Out of scope:** production EHR credentials, raw EHR payload storage, live writeback without later approval, hard-coded athenahealth domain logic.
- **UX requirements:** disabled/configured/degraded/failed, approval-required, denied, pending, delivered, dead-lettered, reconciliation-needed, permission-denied, and read-only states.
- **Backend/API requirements:** EHR calls are adapter-mediated, tenant/site scoped, permission checked, purpose-of-use checked, idempotent, audit/event emitting, and fail-closed without credentials.
- **Data model/persistence requirements:** configuration metadata, credential reference metadata, writeback approval/denial, attempts, acknowledgements, dead-letter, reconciliation, support evidence.
- **Event/audit requirements:** config reviewed, credential disabled, payload prepared, approval/denial, delivery attempt, failure, dead-letter, reconciliation, incident.
- **RBAC/ABAC requirements:** only authorized clinicians/admins approve writeback; support sees operational metadata only.
- **Standalone-mode behavior:** EHR can remain disabled without blocking standalone documentation/export.
- **ClinicOS-integrated behavior:** future M25 routing is adapter-bound and cannot bypass AURA Note writeback approval.
- **AI/PHI/security requirements:** no raw EHR payload storage, no autonomous finalization, no claim submission.
- **Testing requirements:** sandbox adapter contracts, disabled credentials, approval gates, retry/dead-letter/reconciliation, role denial, no raw payload logging.
- **Required scripts/gates:** `pnpm ehr:sandbox-runtime-readiness`; default local gate.
- **Definition of Done:** EHR sandbox path is production-shaped and safely disabled/mockable.
- **Stop conditions:** production credentialing, live vendor calls, or writeback payload policy is required.
- **Risks and deferred decisions:** production credentialing, vendor acknowledgements, and legal/privacy review remain deferred.

## WO-070 — AI Governance Runtime Boundary And Evaluation Harness Expansion

- **Objective:** Prepare AI governance for future private/BAA model use without enabling live external AI.
- **Why this exists:** Commercial AI requires prompt/model governance, evaluations, source evidence, human review, and unsafe output rejection.
- **Prerequisites:** `WO-069`; current AI Gateway governance evidence.
- **In scope:** prompt registry governance, model/provider configuration records, evaluation cases for unsupported diagnosis/code/charge/medical-necessity/claim/patient-financial outputs, PHI rejection/redaction, patient-summary exclusion, billing candidate-only behavior, coaching visibility, source-evidence/confidence, human-approval audit, drift placeholder.
- **Out of scope:** live model calls, live credentials, production prompt store, autonomous finalization, raw PHI to external AI.
- **UX requirements:** AI governance route exposes disabled/configured/degraded/failed, prompt/model version, source freshness, scrub/rejection, output validation failed, unsafe-output rejected, human-review-required, permission-denied, and read-only states.
- **Backend/API requirements:** AI requests remain server-side through AI Gateway; purpose, role, source freshness, PHI scrubber, schema validation, and human-review gates are enforced.
- **Data model/persistence requirements:** model config, prompt version, eval run, context package metadata, PHI scrub decision, output validation, human review, override, and incident metadata as required.
- **Event/audit requirements:** prompt/model approved/rolled back, context package created, PHI scrubbed/rejected, request denied, output validated/rejected, human review, override, eval run, regression block, incident.
- **RBAC/ABAC requirements:** clinician/billing/admin/compliance/support visibility follows existing matrix and minimum necessary rules.
- **Standalone-mode behavior:** standalone uses deterministic local/mock AI evidence.
- **ClinicOS-integrated behavior:** ClinicOS AI governance is adapter-bound and cannot bypass AURA Note AI Gateway policy.
- **AI/PHI/security requirements:** live model calls disabled; no raw PHI to external AI; all outputs draft/candidate/suggestion-only.
- **Testing requirements:** evaluation fixture suite, unsafe output rejection, no raw PHI external path, source/confidence requirement, human-review gates.
- **Required scripts/gates:** `pnpm ai:runtime-governance-readiness`; default local gate.
- **Definition of Done:** AI Gateway is review-ready for future private/BAA pathway with live calls still disabled.
- **Stop conditions:** model/provider selection, BAA/private path, or live credential is required.
- **Risks and deferred decisions:** private model pathway, eval thresholds, and drift response remain deferred.

## WO-071 — Security, Privacy, Compliance, And Threat-Model Runtime Hardening

- **Objective:** Move from scaffold safety to review-ready runtime security posture.
- **Why this exists:** Commercial review needs threat modeling, privacy controls, audit completeness, PHI redaction, and role-denial evidence.
- **Prerequisites:** CR-3 complete.
- **In scope:** threat model update, privacy checklist, HIPAA-readiness checklist without certification claims, audit trail completeness, minimum-necessary checks, support-access restrictions, disabled break-glass placeholder, PHI log redaction tests, dependency/security scan placeholders, route/endpoint negative tests.
- **Out of scope:** HIPAA/SOC 2 certification claims, external audit completion, live break-glass, or production launch approval.
- **UX requirements:** visible permission-denied, support-scope, break-glass-disabled, compliance-review, read-only, and failed states.
- **Backend/API requirements:** sensitive endpoints fail closed, redact logs, enforce minimum necessary, and audit denied/sensitive access.
- **Data model/persistence requirements:** durable audit/support/security evidence where in scope; no schema change unless needed for evidence.
- **Event/audit requirements:** security/privacy/compliance events for access denial, support access, break-glass disabled, audit export, redaction, scan status, and incident placeholders.
- **RBAC/ABAC requirements:** negative tests across primary roles and routes.
- **Standalone-mode behavior:** standalone has review-ready security posture.
- **ClinicOS-integrated behavior:** ClinicOS cannot bypass AURA Note controls and must fail closed on delegated security ambiguity.
- **AI/PHI/security requirements:** no certification claims; no PHI leakage; no autonomous high-risk behavior.
- **Testing requirements:** PHI redaction, role denial, route denial, audit completeness, dependency scan placeholder, support restrictions.
- **Required scripts/gates:** `pnpm security:commercial-readiness`; default local gate.
- **Definition of Done:** security/privacy/compliance package is ready for formal review without claiming certification.
- **Stop conditions:** legal/security/privacy decision required for a high-risk behavior.
- **Risks and deferred decisions:** formal compliance review and production security approval remain deferred.

## WO-072 — Observability, SRE, Support, And Incident Operations

- **Objective:** Prepare commercial operations without selecting live vendors.
- **Why this exists:** Commercial support requires clear logs, metrics, traces, runbooks, status surfaces, and incident operations.
- **Prerequisites:** `WO-071`.
- **In scope:** structured log/metric/trace/audit/support event taxonomy, SLO/SLA placeholders, incident severity taxonomy, runbooks for failed transcription/EHR/ClinicOS/AI/retention/export/identity/data access/security/rollback, support metadata dashboards/routes, SIEM/APM placeholders.
- **Out of scope:** live SIEM/APM vendor integration, production on-call staffing, production launch, PHI-bearing logs.
- **UX requirements:** support status routes show operational metadata only with degraded/failed/permission-denied/read-only states.
- **Backend/API requirements:** support/status endpoints are permission checked, tenant scoped where applicable, redacted, and trace correlated.
- **Data model/persistence requirements:** durable support event/status metadata where needed; no PHI in logs or events.
- **Event/audit requirements:** operational and incident event taxonomy with audit-safe evidence.
- **RBAC/ABAC requirements:** support access is scoped and denied for PHI-bearing content.
- **Standalone-mode behavior:** standalone can be operated and supported without ClinicOS.
- **ClinicOS-integrated behavior:** ClinicOS operational dependencies are adapter-bound/degraded without permission bypass.
- **AI/PHI/security requirements:** no PHI in logs; no live vendor credentials.
- **Testing requirements:** runbook/readiness verifier, support route denial, redaction, incident taxonomy, disabled vendor states.
- **Required scripts/gates:** `pnpm ops:commercial-readiness`; default local gate.
- **Definition of Done:** commercial support posture is review-ready with live vendors disabled.
- **Stop conditions:** live vendor or on-call/SLO approval is required.
- **Risks and deferred decisions:** vendor choice, alert thresholds, on-call owners, and live telemetry remain deferred.

## WO-073 — Billing, Revenue Integrity, Claim-Decision, And Compliance Boundary Completion

- **Objective:** Complete v1 billing-support and revenue-integrity workflow without claim submission.
- **Why this exists:** Commercial billing support must be coherent while preserving human review and prohibiting autonomous claim behavior.
- **Prerequisites:** `WO-072`; current claim/payer decision gate.
- **In scope:** candidate-only CPT, HCPCS, ICD-10, HCC, E/M, quality, risk, and draft claim preview behavior; clinical-first Patient Opportunity Analysis; internal configurable revenue impact; patient summary exclusions; billing review triggers; billing transcript access only in triggered context; `submittedClaim=false`.
- **Out of scope:** live claim submission, clearinghouse/payer APIs, denial automation, payment posting, autonomous charge/coding/medical-necessity decisions, patient-facing financial conclusions.
- **UX requirements:** billing/revenue surfaces show human-review-required, candidate-only, internal-only, blocked, disabled, permission-denied, and read-only states.
- **Backend/API requirements:** billing actions are permission checked, tenant/site scoped, audit/event emitting, idempotent where needed, and enforce `submittedClaim=false`.
- **Data model/persistence requirements:** billing review, draft claim preview, attestation, revenue-config, and evidence records are durable where production-intended.
- **Event/audit requirements:** billing review triggered/resolved, candidate accepted/removed, claim preview generated, attestation recorded, patient-summary exclusion verified, submission blocked.
- **RBAC/ABAC requirements:** billing detail/transcript access is restricted to role and trigger context; patient-facing views exclude internal details.
- **Standalone-mode behavior:** standalone billing-support flow works without ClinicOS/M21.
- **ClinicOS-integrated behavior:** any M21 handoff remains adapter-scoped and cannot submit or finalize claims.
- **AI/PHI/security requirements:** AI suggestions remain draft/candidate; no medical-necessity determination or autonomous billing.
- **Testing requirements:** candidate-only tests, patient-summary exclusion, transcript trigger restriction, `submittedClaim=false`, claim submission disabled.
- **Required scripts/gates:** `pnpm billing:revenue-integrity-readiness`; default local gate.
- **Definition of Done:** billing support is commercially coherent and non-autonomous.
- **Stop conditions:** live claim/clearinghouse/payer behavior or patient-facing financial policy is required.
- **Risks and deferred decisions:** future claim submission strategy remains founder/legal/compliance gated.

## WO-074 — Beta Pilot Commercial Readiness Package

- **Objective:** Prepare a controlled beta pilot package without production launch approval.
- **Why this exists:** Founder review needs onboarding, support, training, rollback, disabled-feature, retention, privacy/security, and metrics evidence.
- **Prerequisites:** `WO-073`.
- **In scope:** beta onboarding, tenant setup, clinician/admin/billing/MA training checklists, pilot support plan, disabled-features inventory, retention explanation, privacy/security artifacts, rollback plan, success metrics, synthetic standalone pilot smoke.
- **Out of scope:** production launch approval, real tenant onboarding, live PHI, live vendors, or production deployment execution.
- **UX requirements:** beta-facing surfaces clearly identify disabled/degraded features, support paths, known limitations, and permission states.
- **Backend/API requirements:** pilot smoke uses synthetic API-backed workflow only and preserves disabled live integrations.
- **Data model/persistence requirements:** pilot evidence metadata and metrics definitions only unless existing runtime records support the smoke test.
- **Event/audit requirements:** pilot smoke actions record audit-safe evidence; no real PHI.
- **RBAC/ABAC requirements:** training and role views cover clinician, admin, billing, MA, support, compliance/privacy.
- **Standalone-mode behavior:** pilot package supports standalone-first beta operation.
- **ClinicOS-integrated behavior:** ClinicOS pilot remains optional/degraded unless future approval exists.
- **AI/PHI/security requirements:** `productionLaunchApproved=false`; no live PHI/vendor/claim/autonomy.
- **Testing requirements:** synthetic pilot smoke and package readiness verifier.
- **Required scripts/gates:** `pnpm beta:pilot-package-readiness`; default local gate.
- **Definition of Done:** founder can review a beta pilot package with production launch still false.
- **Stop conditions:** real beta tenant, live data, live vendor, or launch approval is requested.
- **Risks and deferred decisions:** pilot participants, support owners, legal/privacy approvals, and launch timing remain deferred.

## WO-075 — Commercial Readiness Decision Gate

- **Objective:** Create the final commercial-readiness decision gate for founder/clinical/compliance/security review.
- **Why this exists:** The repo needs an honest review packet that says what is runtime-ready, synthetic, disabled, Figma-ready, beta-ready, and not launch-ready.
- **Prerequisites:** `WO-074`.
- **In scope:** `docs/COMMERCIAL_READINESS_REVIEW_PACKET.md`, readiness matrix, disabled/live-vendor/founder-decision inventory, Figma and beta readiness summary, final `pnpm commercial:readiness` gate.
- **Out of scope:** production launch approval, live vendor enablement, live PHI, claim submission, final certification claims.
- **UX requirements:** commercial readiness/review status is visible and does not hide disabled or unsafe-to-enable features.
- **Backend/API requirements:** no new runtime endpoint unless needed for review metadata; all existing gates must pass.
- **Data model/persistence requirements:** no schema change unless review metadata requires durable evidence.
- **Event/audit requirements:** decision packet records evidence sources; no runtime event change required.
- **RBAC/ABAC requirements:** review packet preserves role-limited sensitive details and minimum-necessary posture.
- **Standalone-mode behavior:** packet states standalone readiness accurately.
- **ClinicOS-integrated behavior:** packet states ClinicOS adapter/readiness limitations accurately.
- **AI/PHI/security requirements:** production launch stays false unless a later founder-approved work order changes it; live PHI/vendor/claim/autonomy remains disabled.
- **Testing requirements:** all relevant gates, commercial readiness verifier, no-launch-claim posture checks.
- **Required scripts/gates:** `pnpm commercial:readiness`; default local gate.
- **Definition of Done:** CR-4 checkpoint report exists; repo clearly states Figma readiness, beta-pilot package readiness, commercial-review readiness, and production-launch-ready false.
- **Stop conditions:** founder asks to flip launch/live behavior without required clinical/compliance/security/legal/vendor approval evidence.
- **Risks and deferred decisions:** final approval, contracts, real pilot scope, live credentials, and production deployment remain decision-gated.

## Overall production-launch criteria

AURA Note can be called production-launch-ready only when all of the following are true:

- all work orders through the selected launch gate are complete, merged, and passing CI;
- durable persistence covers every production runtime workflow;
- tenant/site isolation is enforced at API, repository, and database/RLS layers for every tenant-owned persisted table;
- standalone mode works without ClinicOS for core v1 workflows;
- ClinicOS-integrated mode works through adapter boundaries without permission bypass;
- production identity, session, purpose-of-use, role, and tenant/site admin controls are implemented and tested;
- production storage uses secure server-mediated downloads and non-public object access;
- retention deletion is approval-gated, auditable, recoverable within the documented window, and backed by tested backup/restore controls;
- transcript retention remains indefinite unless an approved tenant policy changes it;
- observability, support, incident response, and access review runbooks are backed by evidence;
- EHR, ClinicOS, AI, and storage live paths are either disabled, sandbox-approved, or production-approved with documented controls;
- production-intended frontend screens use typed API clients and persisted backend state, with synthetic local React state limited to Storybook/demo mode;
- production routes expose loading, empty, ready, saving, failed, permission-denied, and read-only states through API-backed responses or documented mocks;
- Playwright proves at least one seeded backend-backed browser workflow from appointment creation through finalization/export before launch-candidate readiness is claimed;
- AI remains draft/candidate/suggestion-only and never sends raw PHI to external AI;
- patient-facing views exclude internal billing, revenue, confidence, coaching, and payer-optimization details unless explicitly approved by tenant policy and source data;
- security/privacy/compliance review blockers are closed or formally waived;
- no autonomous diagnosis, coding finalization, charge finalization, medical-necessity determination, claim submission, denial management, or patient financial conclusion is enabled by default.

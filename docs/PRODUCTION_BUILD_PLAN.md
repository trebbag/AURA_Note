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

Checkpoint reports must list completed work orders, evidence, tests, open risks, active and deferred `SPEC_GAP`s, and the next recommended batch.

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
- **Required scripts/gates:** `pnpm ehr:sandbox-readiness` plus default gate.
- **Definition of Done:** EHR integration is sandbox-review-ready without live production writeback.
- **Stop conditions:** missing vendor credentials for live sandbox; fake mode remains.
- **Risks and deferred decisions:** athenahealth credentialing and production writeback review deferred.

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

## WO-048 — UX, Accessibility, Responsive, And Visual Regression Hardening

- **Objective:** Harden production UX and accessibility across required role workflows.
- **Why this exists:** Browser-testable scaffolds need production-quality flow correctness.
- **Prerequisites:** P7.5 product surfaces.
- **In scope:** route/state coverage, keyboard controls, accessible names, responsive hardening, visual regression, patient-facing exclusion review, clinician/MA/billing/admin/support workflows.
- **Out of scope:** final design signoff if Figma is unavailable.
- **UX requirements:** every required screen has empty/loading/ready/saving/blocked/failed/permission-denied/read-only/demo states.
- **Backend/API requirements:** no new APIs unless needed for UX state fidelity.
- **Data model/persistence requirements:** none unless state tracking is required.
- **Event/audit requirements:** user actions retain existing audit coverage.
- **RBAC/ABAC requirements:** role-denied UX tests for sensitive views.
- **Standalone-mode behavior:** standalone workflows complete.
- **ClinicOS-integrated behavior:** embedded workflows safely degrade.
- **AI/PHI/security requirements:** no patient-facing internal billing/revenue/coaching/confidence details.
- **Testing requirements:** Playwright accessibility/responsive/visual tests.
- **Required scripts/gates:** `pnpm ux:production-readiness` plus default gate.
- **Definition of Done:** UX/accessibility evidence is ready for launch review.
- **Stop conditions:** design requirement conflict with safety/compliance.
- **Risks and deferred decisions:** final Figma fidelity may require separate design review.

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
- **Required scripts/gates:** `pnpm deployment:readiness`, `pnpm performance:readiness`, `pnpm ops:tabletop-readiness`, default gate.
- **Definition of Done:** launch operations evidence is complete enough for beta decision.
- **Stop conditions:** missing production environment or secrets blocks live deployment; document as blocker.
- **Risks and deferred decisions:** hosting platform and production SLOs may require founder decision.

## WO-050 — Beta Pilot And Limited Production Launch Gate

- **Objective:** Prepare beta and limited launch governance after technical/security readiness.
- **Why this exists:** Launch requires onboarding, training, support, monitoring, rollback, and approval evidence.
- **Prerequisites:** `WO-049`.
- **In scope:** tenant onboarding/provisioning, pilot setup checklist, role training, disabled feature list, support escalation, launch checklist, first-week monitoring, rollback criteria, founder/clinical/compliance/security approvals.
- **Out of scope:** unrestricted general availability.
- **UX requirements:** onboarding and support paths clear for pilot users.
- **Backend/API requirements:** tenant provisioning checks and launch smoke tests.
- **Data model/persistence requirements:** launch tenant/config evidence.
- **Event/audit requirements:** launch signoff and onboarding evidence.
- **RBAC/ABAC requirements:** access review complete before launch.
- **Standalone-mode behavior:** standalone pilot path ready.
- **ClinicOS-integrated behavior:** integrated pilot path documented if used.
- **AI/PHI/security requirements:** production PHI only if all prior approvals are complete.
- **Testing requirements:** pilot smoke, rollback, monitoring validation.
- **Required scripts/gates:** `pnpm pilot:readiness`, `pnpm launch:readiness`, default gate.
- **Definition of Done:** P10 checkpoint can support limited launch decision without overclaiming readiness.
- **Stop conditions:** missing founder/clinical/compliance/security approval.
- **Risks and deferred decisions:** pilot scope and real tenant readiness must be approved.

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
- AI remains draft/candidate/suggestion-only and never sends raw PHI to external AI;
- patient-facing views exclude internal billing, revenue, confidence, coaching, and payer-optimization details unless explicitly approved by tenant policy and source data;
- security/privacy/compliance review blockers are closed or formally waived;
- no autonomous diagnosis, coding finalization, charge finalization, medical-necessity determination, claim submission, denial management, or patient financial conclusion is enabled by default.

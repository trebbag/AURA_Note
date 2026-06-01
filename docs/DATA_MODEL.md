# Data Model

This file gives Codex a concrete starting point. The canonical implementation may use Prisma or another ORM, but these entities and invariants must exist.

## Core entities

- `Tenant`
- `Site`
- `User`
- `RoleAssignment`
- `Patient`
- `PatientLinkage`
- `Appointment`
- `Note`
- `VisitSession`
- `RecordingAsset`
- `Transcript`
- `TranscriptSegment`
- `ChartContextSnapshot`
- `Suggestion`
- `VisitSelection`
- `ComplianceIssue`
- `HistoryGapQuestion`
- `Task`
- `FinalizationRun`
- `WizardStepDecision`
- `EnhancedNoteVersion`
- `PatientSummaryVersion`
- `BillingAttestation`
- `DraftClaimPreview`
- `ExportArtifact`
- `EhrWritebackJob`
- `Template`
- `DotPhrase`
- `CoachingReport`
- `AuditEvent`
- `DomainEvent`
- `IntegrationConnection`
- `ModeMapping`

## Required invariants

- Each appointment has exactly one note.
- A note belongs to exactly one appointment.
- A note cannot be edited unless a visit session timer is active or an approved exception is active.
- A recording starts and stops with the timer unless an approved exception is active.
- Raw audio deletion job must purge after seven days.
- Transcripts are retained indefinitely.
- Sign & Dispatch cannot occur with unresolved blocker tasks/questions.
- Sign & Dispatch cannot occur without approved final note and approved patient summary.
- Low-confidence diagnosis overrides require reason and create billing/coaching flags.
- Billing staff transcript access requires billing review trigger.
- Final note access requires patient/visit linkage and permission.
- All AI outputs are draft/candidate/suggestion until approved by the correct human role.

## Note states

- `shell_created`
- `draft_not_started`
- `visit_active`
- `visit_paused`
- `documentation_in_progress`
- `ready_to_finalize`
- `finalization_code_review`
- `finalization_suggestion_review`
- `finalization_compose`
- `finalization_compare_edit`
- `finalization_billing_attest`
- `finalization_sign_dispatch`
- `blocked_compliance`
- `blocked_history_gap`
- `blocked_billing_review`
- `finalized`
- `exported`
- `writeback_pending`
- `writeback_complete`
- `writeback_failed`

## Appointment states

- `scheduled`
- `checked_in`
- `in_room`
- `visit_started`
- `visit_paused`
- `visit_completed`
- `finalization_in_progress`
- `finalized`
- `cancelled`
- `no_show`

## Visit selection categories

- `cpt`
- `hcpcs`
- `icd10`
- `hcc`
- `em`
- `quality_measure`
- `diagnosis`
- `differential`
- `service`
- `procedure`
- `appointment_to_schedule`
- `plan_item`
- `staff_task`

## Compliance issue severities

- `info`
- `warning`
- `soft_block`
- `hard_block`

## Task blocker behavior

A task/open question has:

- `blocksSigning: boolean`
- `adjudicationStatus: open | answered | closed | assigned | deferred`
- `ownerRole`
- `ownerUserId?`
- `dueAt?`
- `resolutionReason?`

Signing is blocked if any task linked to the note has `blocksSigning = true` and is not adjudicated.

## CP-0 domain skeleton status

The CP-0 tranche implements the core invariant logic in `packages/domain` without creating live clinical workflows:

- appointment and note references must be reciprocal for the one-to-one invariant;
- editor access requires a running timer or an approved recording exception;
- recording exceptions are represented separately from active recording;
- low-confidence diagnosis candidates below 75 percent require override metadata before billing/coaching flags are created;
- blocker tasks prevent Sign & Dispatch until adjudicated as answered, closed, or assigned;
- finalization wizard steps are ordered as Code Review, Suggestion Review, Compose, Compare & Edit, Billing & Attest, and Sign & Dispatch.

Persistence remains schema-level scaffolding at CP-0. Repository methods, migrations, and runtime data access belong to later work orders unless explicitly required by the active work order.

## WO-002 runtime scaffold status

`WO-002` adds an in-memory standalone repository for the Schedule Builder and appointment-note lifecycle. It is intentionally synthetic and process-local until database migrations/repositories are introduced in a later backend persistence tranche.

Implemented runtime invariants:

- creating a standalone appointment creates exactly one inactive note shell;
- idempotent appointment creation replays the existing appointment/note pair instead of creating a duplicate shell;
- schedule rows expose appointment status, note status, note shell ID, and whether the note is visible in Draft Notes;
- billing-only users cannot create appointments;
- only linked clinicians or authorized admins can start visits;
- Start Visit activates the note shell into Draft Notes and creates a visit-session scaffold, while timer/recording/transcription depth remains deferred to `WO-004`.

## WO-003 notes and workspace shell status

`WO-003` adds typed CP-1 shell views over the existing synthetic appointment-note repository:

- `DraftNoteSummary` rows derive from active appointment-linked note shells;
- `FinalizedNoteSummary` rows are read-only placeholders until finalization work orders create final artifacts;
- `DocumentationWorkspace` is an appointment-linked view over the note, visit-session gate, and required workspace panels.

The shell preserves the appointment-to-note one-to-one relationship and adds explicit panel states for empty, loading, ready, saving, warning, blocked, failed, permission-denied, finalized read-only, and demo fixture states. It does not introduce durable persistence beyond the existing synthetic process-local repository.

## WO-004 timer, recording, transcript, and retention scaffold status

`WO-004` extends the synthetic visit-session record with timer controls and recording state:

- Start Visit creates a running timer, normal recording scaffold, raw-audio retention metadata, and an empty mock transcript record;
- Pause locks the editor and pauses normal recording;
- Resume unlocks the editor and resumes normal recording;
- Stop ends the normal recording scaffold and locks the editor unless a documented exception gate is active;
- approved recording exceptions are separate from normal recording and do not create raw-audio metadata;
- mock transcript segments are synthetic, source-marked as `mock_transcription`, and retained indefinitely.

Raw audio metadata is classified as `audio_ephemeral` with a one-week purge window. The worker has a retention candidate scan scaffold that marks records purge-eligible when `purgeAfter` is reached; it does not connect to production storage.

## WO-005 review panel scaffold status

`WO-005` adds deterministic synthetic review state for:

- draft-only `Suggestion` candidates with confidence, rationale, supporting evidence, missing evidence, and status;
- `VisitSelection` records created only through human accept/manual add actions;
- `ComplianceIssue` and `ComplianceReview` records that can disable Finalize-facing actions when hard blockers exist;
- `HistoryGapQuestion` records that can create MA-owned blocker tasks;
- `Task` records linked to the note with signing blocker state.

Diagnosis/ICD suggestions below 75 percent require override metadata before they can move into Visit Selections. No suggestion is treated as a final diagnosis, final code, final bill, medical-necessity determination, or claim submission.

## WO-006 finalization steps 1-4 scaffold status

`WO-006` adds a synthetic in-memory `FinalizationRun`/`FinalizationSession` shape over the active note:

- finalization starts from a frozen snapshot of original note text, Visit Selections, final-pass suggestions, transcript segment count, and History Gap count;
- Step 1 Code Review records a keep/remove/convert/follow-up decision for each selected item before the wizard can advance;
- removed selected items and removed final-pass suggestions are preserved in an unused audit list;
- Step 2 Suggestion Review includes deterministic final-pass suggestions above 50 percent confidence and does not expose raw transcript text;
- Step 3 Compose records progress phases and creates deterministic draft enhanced-note and patient-summary outputs;
- Compose output is rejected if the patient summary contains internal billing, coding, confidence, revenue, payer, or coaching details;
- Step 4 Compare & Edit can mark the enhanced output stale when the original-side note changes, requires Re-beautify before approval, and requires separate final-note and patient-summary approvals.

Completing Step 4 moves the note to `finalization_billing_attest` and sets `readyForBillingAttest = true`; Billing & Attest, Sign & Dispatch, final records, exports, PDFs, and writeback remain scoped to `WO-007` and `WO-008`.

## WO-007 Billing & Attest and Sign & Dispatch scaffold status

`WO-007` adds synthetic finalization Step 5 and Step 6 records:

- `DraftClaimPreview` is an internal draft/readiness object with selected candidate items, payer-readable support, missing evidence, denial risk flags, estimate caveat language, billing review status, and `submittedClaim = false`;
- `BillingAttestation` records required clinician acknowledgements, estimate caveat acknowledgement, billing review routing, actor, and timestamp;
- billing review routing grants billing staff transcript access only for the routed visit and only through the existing transcript permission gate;
- `FinalNoteRecord` and `PatientSummaryRecord` are created by Sign & Dispatch after Billing & Attest, final note approval, patient summary approval, and blocker checks pass;
- signing moves the note and appointment to `finalized` and removes the note from Draft Notes while making it available in Finalized Notes.

The `WO-007` scaffold does not create PDFs, exports, copy artifacts, claim submissions, charge submissions, EHR writeback jobs, or autonomous billing decisions. Those output actions remain scoped to `WO-008`.

## WO-008 export, PDF, copy, and finalized viewer scaffold status

`WO-008` adds signed-output artifact records over the finalized note:

- `ExportArtifact` records represent final-note PDF, patient-summary PDF, final-note copy, patient-summary copy, and structured export artifacts generated from the signed read-only version;
- PDF artifacts include deterministic synthetic PDF-safe payload text with clinic, patient-safe identifier, visit, clinician, generated timestamp, document type, and signed-source timestamp metadata;
- patient-summary artifacts are blocked if internal billing, coding, confidence, payer, revenue, or coaching details are detected;
- export/copy/PDF actions are disabled until Sign & Dispatch creates `FinalNoteRecord` and `PatientSummaryRecord`;
- `EhrWritebackQueue` records represent conservative statuses: `disabled`, `not_configured`, `pending_approval`, `queued`, `failed`, and `unsupported_by_vendor`;
- EHR writeback defaults to `not_configured` after signing and never marks writeback complete in the scaffold.

Finalized-note detail views include the read-only final note, patient summary, draft claim preview reference, export artifact list, writeback status, and role-derived available actions. `WO-008` still uses process-local synthetic data and does not connect to object storage, EHR vendors, claim submission, external AI, or production PHI paths.

## WO-009 AI Gateway PHI boundary scaffold status

`WO-009` adds typed AI gateway records and DTOs for mock-only AI invocation:

- `AiContextPackage` represents the deidentified, source-linked clinical package that may be sent to the mock provider. It stores safe tenant/site/patient/note references, structured clinical facts, evidence nodes, source IDs, redacted paths, rejected paths, PHI handling mode, and creation time.
- `AiEvidenceNode` represents the source-link anchor used by suggestions, draft compose output, patient summary drafts, billing-preview candidates, and coaching feedback. Evidence nodes carry source system, source reference, display label, freshness, source quality, PHI classification, and allowed roles.
- `AiSafetyPolicy` and prompt registry records identify policy mode, prompt ID/version, output type, private/BAA requirement, source-link requirement, and human-review requirement.

The current implementation rejects raw forbidden PHI keys and obvious PHI-like free-text patterns by default. Explicit redaction mode is available for mock invocation and records the redacted paths. All AI outputs remain draft/candidate/suggestion-only and human-review-required. No browser, API, worker, or package code calls an external AI provider in `WO-009`.

## WO-010 EHR adapter athenahealth-first scaffold status

`WO-010` adds vendor-neutral EHR adapter records and DTOs:

- `EhrAdapterStatus` records vendor, mode, connectivity, tenant/site scope, health, and warning metadata. Default API behavior is athenahealth disabled mode so standalone operation remains safe without credentials.
- `EhrWritebackCapabilityMatrix` records whether final-note, patient-summary, task, and attachment writeback are supported/configured. Unconfigured and unsupported paths remain explicit and never mark writeback complete.
- `EhrChartContextPackage` records source-linked synthetic chart context by safe patient ID, external encounter reference, source system, requested slices, normalized slices, stale-slice count, and warnings.
- `EhrChartContextSlice` stores normalized slice metadata for problems, medications, allergies, labs, documents, and future chart-context families. Each slice carries source system, source record reference, freshness, source quality, PHI classification, allowed purposes, and evidence IDs for AI grounding.

The package includes `DisabledEhrAdapter`, `MockEhrAdapter`, and isolated `AthenahealthAdapter` sandbox scaffolding. No live athenahealth API calls, production credentials, raw EHR payload storage, or production writeback are introduced.

## WO-011 ClinicOS integration adapter scaffold status

`WO-011` adds typed ClinicOS integration records:

- `ClinicOsModeContext` records host mode, availability, tenant/site scope, module context IDs for M03 VisitGraph, M04 WorkOS, M17 NP Cockpit, M21 Charge Integrity, M23 Copilot Runtime, M24 AI Governance, M25 Integration Hub, and M26 Data Cloud, plus warnings.
- `ClinicOsMappingRecord` records local AURA Note object IDs mapped to ClinicOS module object IDs, source-of-truth mode, status, and timestamp.
- `ClinicOsPublishedEvent` records adapter outbox status for AURA Note events targeted to ClinicOS module families.

Standalone mode remains the default and does not require ClinicOS tables or services. ClinicOS mock mode stores synthetic mappings and outbox records only. Unavailable ClinicOS mode degrades safely by skipping mappings and marking event publication failed/unavailable. AURA Note permission checks remain authoritative before ClinicOS context is returned or mappings are written.

## WO-012 coaching and premium analytics scaffold status

`WO-012` adds synthetic coaching records and aggregate analytics projections:

- `CoachingSignal` records represent deterministic documentation-quality and revenue-integrity learning signals derived from already-approved synthetic note artifacts, selections, transcript metadata, and billing-support metadata;
- signal categories cover documentation completeness, billing optimization, patient-voice fidelity, communication clarity, clinical reasoning, history-taking depth, and E/M justification;
- `CoachingReport` is limited to the treating clinician's own note and is marked `patientFacingExcluded = true`;
- recording-exception visits mark transcript-dependent coaching as unavailable instead of pretending normal transcript fidelity exists;
- `CoachingDashboardProjection` supports authorized-admin dashboard views and defaults to `aggregate_only`, which hides individual clinician identifiers;
- full-admin mode can expose clinician identifiers only to authorized admins and remains internal/non-patient-facing.

The scaffold does not perform live AI coaching analysis, punitive productivity scoring, patient-facing coaching display, billing surveillance, claim submission, or medical-necessity determination.

## WO-013 production hardening, observability, retention, and audit scaffold status

`WO-013` adds synthetic hardening records and DTOs without introducing production connectivity:

- `FeatureFlagDecision` records default-off switches for external AI, live EHR writeback, ClinicOS live sync, production analytics warehouse export, and audit export download delivery;
- `StructuredLogEntry` records service, level, request ID, trace ID, event name, timestamp, redacted payload, redacted paths, and `phiSafe = true`;
- `RetentionPolicyStatus` records raw-audio one-week retention, transcript indefinite retention, audit tenant-policy retention, candidate counts, purge-eligible counts, and `destructivePurgeEnabled = false`;
- `SupportStatus` aggregates feature flags, structured-log posture, retention policy status, safe degraded failure states, and CI runtime evidence;
- `AuditExport` represents a redacted metadata-only JSONL bundle with `includePhi = false`, `redacted = true`, `downloadEnabled = false`, and audit-retained records.

The worker now has a tested retention job summary for raw-audio purge eligibility and transcript indefinite retention. The support API and browser support status page expose current scaffold health and safe degraded states. `WO-013` does not enable live audit file delivery, destructive deletion from object storage, production logging sinks, production analytics warehousing, live AI, live EHR writeback, or PHI-bearing support payloads.

## WO-015 persistence migration foundation status

`WO-015` promotes the first post-CP4 productionization tranche into schema and migration-tooling work:

- PostgreSQL is the durable database target, matching `docs/BACKEND_BUILD_SPEC.md`;
- Prisma is the migration/schema validation tool for the first foundation pass;
- `packages/contracts/prisma/schema.prisma` now represents the core data-model families from this document;
- `Note.appointmentId` is unique to preserve the one appointment to one note invariant at the persistence layer;
- raw audio, transcript, audit, and export metadata carry explicit retention classes;
- draft claim previews default to `submittedClaim = false`;
- coaching reports default to `patientFacingExcluded = true`;
- integration connections and feature flags default to disabled.

This is not runtime persistence. The API still uses the existing synthetic process-local repositories until a later work order introduces Prisma-backed repository adapters and runs the existing e2e flows against a local database.

## WO-016 tenant identity and access foundation status

`WO-016` adds local synthetic identity and tenant-access records at the security/contract layer:

- `AccessContext` now carries tenant ID, site ID, actor user ID, session ID, purpose-of-use, and identity-provider mode metadata in addition to role and linkage flags;
- `LocalAuthSession` contract seeds represent development/test sessions only and are marked local synthetic rather than production SSO;
- `TenantScopeDecision` contract seeds represent allow/deny outcomes for tenant-scoped access checks;
- `local_synthetic` is the only enabled identity-provider mode;
- `clinicos_delegate` and `oidc_delegate` are represented as future adapter modes and denied until configured by later work orders;
- cross-tenant and cross-site requests are denied before API services perform clinical, billing, AI, integration, coaching, support, audit, or export behavior.

This is not persistent identity management. User administration, SSO/MFA, account recovery, SCIM, ClinicOS identity delegation, and production identity-provider configuration remain deferred.

## WO-020 persistence runtime readiness status

`WO-020` adds the first runtime repository seam while preserving the synthetic in-memory runtime:

- schedule/note state is accessed through a repository port with an in-memory adapter;
- appointment-to-note one-to-one lookup is enforced at the repository boundary;
- idempotency keys cannot be remapped to a different appointment;
- Prisma forward and rollback SQL generation is verified by `pnpm persistence:runtime-readiness`.

The data model is still not a live production store. Migrations are not applied to a database, PostgreSQL is not used by API requests, row-level security is not enabled, and no production PHI is stored.

## WO-021 Prisma adapter scaffold status

`WO-021` adds `@aura-note/persistence` to represent the next persistence boundary:

- adapter planning distinguishes the enabled local in-memory adapter from disabled future Prisma mode;
- schedule/note DTOs can be projected into synthetic rows for `Tenant`, `Site`, `User`, `Patient`, `Appointment`, and `Note`;
- projection keeps patient identity at `safePatientId` level and rejects forbidden PHI key material;
- mismatched appointment/note references are rejected before any persistence row projection is created.

The package does not connect to PostgreSQL, generate Prisma Client, apply migrations, or replace API runtime storage.

## WO-022 persistence UUID projection readiness status

`WO-022` aligns the disabled projection more closely to the current Prisma schema:

- projected `@db.Uuid` IDs and reference fields are deterministic UUID-shaped values derived from synthetic natural keys;
- semantic fixture IDs are preserved as natural keys or safe external references instead of being used directly as database primary keys;
- appointment rows now reference projected patient and clinician UUIDs using schema field names;
- note rows now reference projected appointment, patient, and clinician UUIDs using schema field names;
- the projection includes a synthetic clinician `User` row needed by appointment and note clinician references.

This remains projection-only evidence. It is not a live database adapter, does not create production ID policy, and does not store PHI.

## WO-023 core Prisma relationship readiness status

`WO-023` adds schema-level relation coverage for the core schedule and note graph:

- `Tenant`, `Site`, `User`, `Patient`, `Appointment`, and `Note` now have Prisma relation fields for their core parent/child relationships;
- generated migration SQL includes foreign-key constraints for site-to-tenant, patient-to-tenant/site, appointment-to-tenant/site/patient/clinician, and note-to-tenant/site/appointment/patient/clinician;
- the one appointment to one note persistence invariant remains represented by `Note.appointmentId` uniqueness;
- `scripts/validate-persistence-runtime-readiness.js` now checks those generated foreign-key fragments.

This is still not runtime database persistence. The relation graph is intentionally limited to the core schedule/note path; full 35-model relationship completion, RLS policy implementation, live migration apply/rollback, and Prisma-backed repository replacement remain deferred.

## WO-024 visit, recording, and transcript Prisma relationship readiness status

`WO-024` adds schema-level relation coverage for the visit documentation capture graph:

- `VisitSession` now relates to `Tenant`, `Site`, `Note`, `RecordingAsset`, and `Transcript`;
- `RecordingAsset` now relates to `Tenant`, `Site`, `Note`, and `VisitSession`;
- `Transcript` now relates to `Tenant`, `Site`, `Note`, `VisitSession`, and `TranscriptSegment`;
- `TranscriptSegment` now relates to `Tenant`, `Site`, `Transcript`, and `Note`;
- generated migration SQL includes foreign-key constraints for those visit, recording, transcript, and transcript-segment relationships;
- raw-audio retention and transcript-retention semantics remain unchanged from the existing domain/worker scaffolds.

This is still not runtime database persistence. It does not apply migrations, connect Prisma Client, enable row-level security, store production PHI, connect recording/transcription vendors, or replace the in-memory synthetic repositories.

## WO-025 review panel Prisma relationship readiness status

`WO-025` adds schema-level relation coverage for the WO-005 review-panel graph:

- `Suggestion` now relates to `Tenant`, `Site`, `Note`, and source-linked `VisitSelection` rows;
- `VisitSelection` now relates to `Tenant`, `Site`, `Note`, and optional source `Suggestion`;
- `ComplianceIssue` now relates to `Tenant`, `Site`, and `Note`;
- `HistoryGapQuestion` now relates to `Tenant`, `Site`, `Note`, and optional linked blocker `Task`;
- `Task` now relates to `Tenant`, `Site`, optional `Note`, optional `Patient`, optional owner `User`, and linked History Gap questions;
- generated migration SQL includes foreign-key constraints for those review-panel relationships;
- draft-only suggestion, low-confidence override, hard-block, and blocker-task semantics remain enforced by the existing domain/API scaffolds rather than by this schema-only tranche.

This is still not runtime database persistence. It does not apply migrations, connect Prisma Client, enable row-level security, store production PHI, autonomously finalize diagnoses/codes/billing, or replace the in-memory synthetic repositories.

## WO-026 finalization Prisma relationship readiness status

`WO-026` adds schema-level relation coverage for the finalization wizard and draft claim preview graph:

- `FinalizationRun` now relates to `Tenant`, `Site`, `Note`, wizard decisions, enhanced note versions, patient summary versions, billing attestations, and draft claim previews;
- `WizardStepDecision` now relates to `Tenant`, `Site`, `FinalizationRun`, `Note`, and optional actor `User`;
- `EnhancedNoteVersion` now relates to `Tenant`, `Site`, `Note`, `FinalizationRun`, and optional approving `User`;
- `PatientSummaryVersion` now relates to `Tenant`, `Site`, `Note`, `FinalizationRun`, and optional approving `User`;
- `BillingAttestation` now relates to `Tenant`, `Site`, `Note`, `FinalizationRun`, and optional attesting `User`;
- `DraftClaimPreview` now relates to `Tenant`, `Site`, `Note`, `FinalizationRun`, and optional generating `User`;
- generated migration SQL includes foreign-key constraints for those finalization relationships;
- draft-claim previews remain internal candidate/readiness objects with `submittedClaim = false` by default.

This is still not runtime database persistence. It does not apply migrations, connect Prisma Client, enable row-level security, store production PHI, submit claims, finalize charges, finalize codes, determine medical necessity, or replace the in-memory synthetic repositories.

## WO-027 output and writeback Prisma relationship readiness status

`WO-027` adds schema-level relation coverage for signed output artifacts and EHR writeback queue records:

- `ExportArtifact` now relates to `Tenant`, `Site`, `Note`, and optional generating `User`;
- `EhrWritebackJob` now relates to `Tenant`, `Site`, and `Note`;
- generated migration SQL includes foreign-key constraints for those output and writeback relationships;
- export artifacts remain signed-version-locked metadata records, and writeback jobs remain conservative queue/status records.

This is still not runtime database persistence. It does not apply migrations, connect Prisma Client, enable row-level security, store production PHI, deliver PDFs from production object storage, perform live EHR writeback, submit claims, or replace the in-memory synthetic repositories.

## WO-028 local database orchestration readiness status

`WO-028` adds the local PostgreSQL orchestration contract needed before live migration apply/rollback and Prisma-backed repository-adapter tests can be introduced:

- `docker-compose.yml` defines the local PostgreSQL target that matches `.env.example`;
- `scripts/validate-local-database-readiness.js` statically checks the compose contract, synthetic database URL, package script, and Prisma PostgreSQL provider;
- CI runs `pnpm persistence:local-db-readiness` without requiring Docker or touching a live database.

This remains readiness scaffolding. It does not apply migrations, run rollback, use Prisma Client at runtime, replace the in-memory repositories, enable row-level security, run tenant-scoped live queries, or store production PHI.

## WO-029 local PostgreSQL migration evidence status

`WO-029` proves the current Prisma datamodel can apply and roll back against the local synthetic PostgreSQL target:

- `scripts/verify-local-postgres-migration.js` generates forward SQL, applies it to local PostgreSQL, and verifies no schema drift against the datamodel;
- the same verifier generates rollback SQL, applies it, and verifies the local database is back to empty state;
- the verifier refuses non-synthetic configuration and removes the synthetic local volume after the evidence run;
- CI runs `pnpm persistence:local-db:migrate-evidence`.

This remains schema evidence. It does not use Prisma Client at runtime, replace the in-memory repositories, enable row-level security, run tenant-scoped live queries, or store production PHI.

## WO-030 Prisma schedule runtime adapter status

`WO-030` extends the local persistence model from schema proof into the first tested Prisma Client adapter slice:

- `Appointment.sourceRef` stores the semantic synthetic appointment ID while `Appointment.id` remains a deterministic UUID primary key;
- `Note.sourceRef` stores the semantic synthetic note ID while `Note.id` remains a deterministic UUID primary key;
- tenant-scoped unique indexes on appointment and note source references prevent remapping one semantic appointment or note across persisted records;
- `IdempotencyRecord` relates to `Tenant` and `Appointment` and enforces one replay key per tenant;
- the Prisma schedule adapter persists and reloads the `Tenant`/`Site`/`User`/`Patient`/`Appointment`/`Note` graph through local PostgreSQL;
- integration tests verify appointment-to-note lookup in both directions and reject appointment-note/idempotency remapping.

This is not a full durable application switch. Visit sessions, recording/transcript state, suggestions, Visit Selections, compliance review, History Gap tasks, finalization, exports, writeback, coaching, support status, and audit export state still require later repository migration before the in-memory runtime can be retired.

## WO-031 tenant isolation and RLS status

`WO-031` adds live enforcement evidence around the current persisted core graph:

- repository queries now scope `Appointment` reads by tenant and optional site;
- appointment lookup, note lookup, list, and idempotency replay tests use persisted records for two synthetic tenants;
- tenant A and tenant B can reuse the same synthetic appointment ID, note ID, and idempotency key because persisted UUIDs and unique indexes are tenant-scoped;
- same-tenant cross-site reads are denied when the repository/API access context carries a site scope;
- core RLS SQL covers `Tenant`, `Site`, `User`, `Patient`, `Appointment`, `Note`, and `IdempotencyRecord` with `app.current_tenant_id` policies and `WITH CHECK` write protection.

This does not add RLS to the remaining workflow tables yet. The deferred model work is to add equivalent policy artifacts and persisted-record evidence as each workflow slice moves from in-memory state to Prisma-backed repositories.

## WO-032 storage delivery and retention deletion status

`WO-032` extends output and retention DTOs with storage-delivery metadata:

- `ExportArtifact` may include storage provider, storage key, content length, delivery mode, signed token metadata, retention class, and checksum evidence;
- `AuditExport` may include the same storage delivery metadata while preserving `includePhi: false`;
- `RawAudioRetentionMetadata` may include storage provider, storage key, checksum, and content length for purge-eligible raw-audio objects;
- `RetentionJobResult` may include deletion evidence with object key, checksum/eTag, approval ID, deletion result, recovery-window status, trace ID, and `transcriptPurgeCount: 0`.

These are metadata contracts and local fake-storage tests. They do not authorize production Azure credentials, PHI-bearing object payloads, or production backup/restore execution.

## Post-WO-032 production data model rails

`WO-033` does not change the Prisma schema. It re-sequences the remaining data-model implementation work:

- `WO-034` persists visit capture runtime records: `VisitSession`, `RecordingAsset`, `Transcript`, and `TranscriptSegment`;
- `WO-035` persists review-panel runtime records: `Suggestion`, `VisitSelection`, `ComplianceIssue`, `HistoryGapQuestion`, and `Task`;
- `WO-036` persists finalization/output/writeback runtime records: `FinalizationRun`, `WizardStepDecision`, `EnhancedNoteVersion`, `PatientSummaryVersion`, `BillingAttestation`, `DraftClaimPreview`, `ExportArtifact`, and `EhrWritebackJob`;
- `WO-037` completes durable audit/event/support/config/coaching/mode-mapping persistence and broad tenant-owned RLS coverage;
- `WO-038` through `WO-039` complete standalone patient/chart/schedule/worklist/settings/template/estimate/rules-catalog records needed for daily product operation.

No table should be treated as production-ready merely because it exists in the schema. Production readiness requires runtime adapter use, tenant/site repository tests, RLS or documented non-tenant rationale, audit evidence, backup/restore posture, and relevant UX/API tests.

## WO-034 durable visit capture runtime status

`WO-034` moves the visit capture slice from schema readiness to local durable runtime evidence:

- `VisitSession`, `RecordingAsset`, `Transcript`, and `TranscriptSegment` now have a Prisma-backed repository adapter for synthetic local PostgreSQL;
- persisted visit capture records preserve timer state, recording state, editor lock state, approved recording exceptions, raw-audio one-week retention metadata, transcript indefinite retention, and mock transcript segment ordering;

## WO-040 audio/transcription candidate model notes

The P8.5 audio candidate keeps raw audio payloads out of the repo/runtime while adding typed metadata needed for later production review:

## WO-043 observability and support operations metadata status

`WO-043` keeps production observability/support operations as audit-safe metadata. The modeled records are:

- observability sink status for local logs, metrics, traces, audit-export metadata, and disabled SIEM/APM placeholders;
- operational readiness evidence with `vendorSinksConfigured=false` and `productionLaunchReady=false`;
- support operational evidence for incident runbook viewed, degraded-mode acknowledged, and access-review recorded actions;
- support status snapshots with request/trace correlation and PHI-safe log/metric/trace probes.

No raw log stream, PHI-bearing payload, production credential, production URL, private key, final note, transcript, billing detail, coaching output, or writeback payload is stored for this work order. Future production observability persistence and vendor retention windows require security/privacy/founder review.

- `RecordingPermission` records browser support, permission state, explicit user gesture evidence, capture mode, `liveAudioCaptureEnabled = false`, and `rawPhiAudioStored = false`;
- `RecordingChunkMetadata` records sequence, capture window, duration, checksum, synthetic storage key, retention class, source trace, and `transportMode = metadata_only_synthetic`;
- `TranscriptionProviderStatus` records the deterministic mock provider as active and real providers as disabled/config-gated;
- `TranscriptionJob` records queued/processed mock job state, source chunk linkage, provider name, and `liveProviderCalled = false`;
- transcript segments may include confidence, source chunk, speaker-label placeholder, provider name, and correction state;
- `TranscriptCorrection` records previous text, corrected text, reason, timestamp, actor, and audit-safe status.

Transcript retention remains indefinite and raw-audio metadata remains one-week retention. Production PHI audio storage, live provider payloads, and production deletion execution remain outside the model's enabled runtime behavior.
- tenant/site scoped repository and API-harness tests deny wrong-tenant and wrong-site access before DTO exposure;
- `rls-visit-capture.sql` adds local PostgreSQL RLS policies for the visit capture tables using `app.current_tenant_id` and `WITH CHECK` write enforcement;
- `pnpm persistence:visit-capture-adapter` is the durable evidence gate for this slice.

This is not full durable application runtime and is not production PHI database approval. Review panels land in `WO-035`; finalization/output/writeback lands in `WO-036`; audit/event/support/config/coaching, standalone patient/settings/rules catalog, live transcription, browser recording transport, production storage/deletion, live EHR/ClinicOS, live AI, and claim submission remain future work.

## WO-035 durable review-panel runtime status

`WO-035` moves the review-panel slice from schema readiness to local durable runtime evidence:

- `Suggestion`, `VisitSelection`, `ComplianceIssue`, `HistoryGapQuestion`, and `Task` now have a Prisma-backed repository adapter for synthetic local PostgreSQL;
- review-panel records preserve semantic DTO IDs in `sourceRef` columns while database IDs remain deterministic UUIDs;
- `Suggestion.rationale`, `VisitSelection.overrideReason`, `HistoryGapQuestion.supportsItem`, and `HistoryGapQuestion.confidenceImpact` are persisted so synthetic review-panel DTOs can round-trip without losing evidence or low-confidence override context;
- persisted review-panel records preserve accepted/removed suggestion status, selected/manual Visit Selection status, compliance hard-block state, History Gap status, linked MA blocker tasks, and task adjudication state;
- tenant/site scoped repository and API-harness tests deny wrong-tenant and wrong-site access before DTO exposure;
- `rls-review-panel.sql` adds local PostgreSQL RLS policies for review-panel tables using `app.current_tenant_id` and `WITH CHECK` write enforcement;
- `pnpm persistence:review-panel-adapter` is the durable evidence gate for this slice.

This is not full durable application runtime and is not production PHI database approval. Finalization/output/writeback lands in `WO-036`; audit/event/support/config/coaching, broad tenant-owned RLS completion, standalone patient/settings/rules catalog, live AI suggestion generation, live EHR/ClinicOS task synchronization, production code/rules catalogs, production storage/deletion, medical-necessity determination, charge finalization, and claim submission remain future work.

## WO-036 durable finalization/output runtime status

`WO-036` moves the finalization/output/writeback slice from schema readiness to local durable runtime evidence:

- `FinalizationRun`, `WizardStepDecision`, `EnhancedNoteVersion`, `PatientSummaryVersion`, `BillingAttestation`, `DraftClaimPreview`, `ExportArtifact`, and `EhrWritebackJob` now have a Prisma-backed repository adapter for synthetic local PostgreSQL;
- finalization/output records preserve semantic DTO IDs in `sourceRef` columns while database IDs remain deterministic UUIDs;
- `FinalizationRun` preserves step statuses, frozen snapshot, decisions, compose phases/output, patient opportunities, and approval/attestation/sign-dispatch booleans as structured JSON/columns;
- `EnhancedNoteVersion` and `PatientSummaryVersion` persist signed output text and signed DTO snapshots, with adapter tests proving approved/signed text cannot be mutated by a later save;
- `BillingAttestation` persists required and accepted statements, estimate caveat acknowledgement, billing review route state, and attestation timestamp;
- `DraftClaimPreview` persists the synthetic draft-claim payload while enforcing `submittedClaim=false`;
- `ExportArtifact` persists storage-backed delivery metadata, content/checksum, retention class, signed download metadata, and signed-version lock evidence;
- `EhrWritebackJob` persists disabled/failure/queue metadata without executing live writeback;
- tenant/site scoped repository and API-harness tests deny wrong-tenant and wrong-site access before DTO exposure;
- `rls-finalization-output.sql` adds local PostgreSQL RLS policies for finalization/output/writeback tables using `app.current_tenant_id` and `WITH CHECK` write enforcement;
- `pnpm persistence:finalization-output-adapter` is the durable evidence gate for this slice.

This is not full durable application runtime and is not production PHI database approval. Durable audit/event/support/config/coaching and broad tenant-owned RLS completion land in `WO-037`; standalone patient/settings/rules catalog, live EHR writeback, live claim submission, clearinghouse/payer integration, medical-necessity determination, charge finalization, and claim submission remain future work.

## WO-038 standalone patient/chart/schedule status

`WO-038` makes the existing standalone patient and schedule data model browser/API-testable:

- `Patient` is represented through safe synthetic `safePatientId` shells only. No real patient names, MRNs, DOBs, insurance IDs, contact data, addresses, production patient identifiers, or production PHI are introduced.
- `PatientLinkage` is represented in the API/domain scaffold for appointment, note, chart-context, task, and finalization linkage boundaries. Linkage must be active before chart context or note-detail exposure.
- `Appointment` supports edit, check-in, cancel, and no-show status transitions while preserving the one appointment to one note invariant.
- `ChartContextSnapshot` carries synthetic/local source metadata, source freshness, warnings, and explicit `productionPhiStorageApproved=false` and `aiPackagingAllowed=false` flags for this tranche.
- Core schedule RLS evidence now includes `PatientLinkage` and `ChartContextSnapshot` policies alongside `Tenant`, `Site`, `User`, `Patient`, `Appointment`, `Note`, and `IdempotencyRecord`.

The in-memory runtime remains the broad API default for browser workflow coverage. The Prisma schedule adapter persists the current schedule/note/patient/chart-context slice for local PostgreSQL evidence. Live EHR patient matching, production MPI, merge/unmerge, live insurance eligibility, production PHI database approval, patient portal behavior, live ClinicOS synchronization, medical-necessity determination, charge finalization, and claim submission remain deferred.

## WO-039 standalone operations status

`WO-039` makes the remaining standalone operating model browser/API-testable with synthetic data:

- task inbox and MA follow-up worklist rows carry safe patient IDs, note/appointment linkage, owner role, due metadata, blocker status, adjudication status, and source metadata;
- billing review queue rows link to draft claim preview metadata and preserve `submittedClaim=false`;
- transcript access in billing review is represented as a context-limited decision, not broad transcript visibility;
- settings/admin/integrations expose tenant/site/user/role, feature flag, disabled/mock integration, disabled-user, and safe-degraded ClinicOS mapping metadata;
- templates and dot phrases use safe variable placeholders and reject obvious PHI;
- estimate configuration is internal-only and caveated, with patient-facing estimates disabled;
- rules catalog entries include category, code/key, source evidence, effective date, status, human-review-required, autonomous-finalization-disabled, and medical-necessity-determination-disabled metadata.

The runtime implementation for `WO-039` is synthetic/local. It reuses the P7 durable metadata model shape for `Task`, `Template`, `DotPhrase`, `FeatureFlag`, `IntegrationConnection`, and related configuration evidence but does not approve production PHI storage, production payer/pricing catalogs, certified coding rules, live ClinicOS task synchronization, charge finalization, medical-necessity determination, or claim submission.

## WO-037 durable runtime metadata and broad RLS status

`WO-037` moves the remaining P7 tenant-owned runtime metadata slice to local durable runtime evidence:

- `AuditEvent`, `DomainEvent`, `SupportStatusSnapshot`, `FeatureFlag`, `Template`, `DotPhrase`, `CoachingReport`, `IntegrationConnection`, and `ModeMapping` now have a Prisma-backed repository adapter for synthetic local PostgreSQL evidence;
- persisted rows preserve audit-safe event metadata, support snapshot payloads, disabled feature flag decisions, template and dot phrase metadata, own-clinician coaching report payloads, disabled/mock integration connection metadata, and ClinicOS mode mappings;
- tenant/site scoped repository and API-harness tests deny wrong-tenant, wrong-site, and wrong-role access before DTO exposure;
- `rls-runtime-metadata.sql` adds local PostgreSQL RLS policies for the remaining P7 metadata tables using `app.current_tenant_id` and `WITH CHECK` write enforcement;
- `pnpm persistence:durable-runtime-readiness` is the broad durable runtime evidence gate.

P7 is now complete as local synthetic durable runtime evidence. This is not production database approval and does not enable production PHI storage, live vendor synchronization, live AI, medical-necessity determination, charge finalization, or claim submission.

## WO-061 core workflow runtime persistence status

`WO-061` does not add new Prisma tables because `WO-034` through `WO-037` already introduced the core tenant-owned workflow and metadata models. It changes how those model slices are exercised:

- `ScheduleService` now uses explicit repository and storage ports rather than hidden process-local construction;
- `ScheduleRuntimePersistencePlan` distinguishes `demo_memory`, `test_memory`, and local-only `prisma_local` posture without authorizing production PHI persistence;
- `CoreWorkflowRuntimeSnapshot` composes `Appointment`/`Note`, `VisitSession`, `RecordingAsset`, `Transcript`, `TranscriptSegment`, `Suggestion`, `VisitSelection`, `ComplianceIssue`, `HistoryGapQuestion`, `Task`, `FinalizationRun`, wizard decisions, enhanced note/patient summary versions, billing attestation, draft claim preview, export artifact, writeback job, audit event, and domain event persistence evidence;
- the local PostgreSQL integration test proves the composed model survives fresh repository instances and denies cross-tenant/cross-site access.

This remains synthetic/local data-model evidence. It is not a production database approval, does not enable real PHI storage, and does not change the prohibition on autonomous diagnosis, code finalization, charge finalization, medical-necessity determination, or claim submission.

## WO-062 API runtime boundary model status

`WO-062` does not add Prisma tables or persisted columns. It adds typed runtime boundary evidence around existing API payloads and contracts:

- `ApiErrorEnvelope` and `ApiErrorDetail` are seeded in `packages/contracts` and OpenAPI for validation, permission-denied, blocked, read-only, oversized, throttled, and failed states;
- request/trace IDs are normalized at the Nest boundary and are available to controllers, logs, audit metadata, and e2e assertions;
- redacted structured runtime logs stay in local in-memory evidence for tests and do not become PHI-bearing durable log records;
- request-boundary validation rejects PHI-like fields/text for ordinary endpoint bodies and rejects raw transcript, raw audio, production connection string, private key, secret, or password fields before service mutation.

This is synthetic/local API contract evidence only. It does not authorize production log retention, production PHI persistence, SIEM/APM delivery, production auth tokens, live vendor payloads, or launch behavior.

## WO-041 production identity/config model status

`WO-041` represents the production platform control plane as typed DTOs and synthetic runtime records:

- `IdentityAdapterStatusView` covers local dev, OIDC, SAML, and ClinicOS delegated identity adapter posture, including configured status, disabled reason, and `liveCredentialPresent=false`.
- `WorkforceUserAdmin` covers tenant/site user role, active/disabled status, allowed purposes of use, and disabled-user fail-closed behavior.
- `SessionEvaluation` records fail-closed session decisions without returning raw tokens.
- `SecretSourceStatus` records source metadata only for IdP, Azure storage, transcription, and other high-risk capability prerequisites, with `valueReturned=false`.
- `GovernedFeatureFlag` records default-disabled high-risk capability state, approval requirements, metadata-only runtime effect, and `liveExecutionEnabled=false`.

These records are synthetic/local control-plane evidence. Production identity/session/config persistence, production secret manager records, live IdP credentials, live ClinicOS identity delegation, production PHI identity linkage, and account recovery operations remain deferred until founder/security review.

## WO-042 storage and restore model status

`WO-042` extends the storage/export/retention model with production-shaped metadata only:

- `ExportArtifactDto` storage-backed records carry `storageProvider`, `storageKey`, `contentLengthBytes`, checksum, retention class, signed-download availability, and expiry metadata.
- `AuditExportDto` carries the same storage metadata while preserving `includePhi: false` and redacted JSONL semantics.
- `SecureDownloadDeliveryDto` records server-mediated delivery evidence: tenant/site-scoped storage key, content type, checksum/eTag, permission, expiry, `publicUrl: null`, and trace ID.
- `StorageDeletionEvidenceDto` records raw-audio deletion result, approval ID, checksum/eTag, recovery-window status, trace ID, and deletion timestamp. Transcript deletion remains out of scope.
- `BackupRestoreReadinessDto` records required Azure Blob soft-delete/versioning, database backup, restore-drill, and evidence-retention posture without enabling production restore execution.

These are synthetic/local records. Production Azure account policy, customer-managed keys, legal hold, real backup schedules, production restore drills, and PHI-bearing payload storage remain deferred.

## WO-044 EHR writeback queue model status

`WO-044` extends the EHR/writeback model as metadata-only runtime evidence:

- `EhrWritebackQueueItemDto` records writeback job ID, note ID, target, vendor, external encounter reference, lifecycle status, configured state, human approval state, retry/dead-letter/reconciliation metadata, idempotency key, trace ID, and audit-safe flags.
- Queue records explicitly carry `liveDeliveryEnabled=false` and `payloadStored=false`.
- `EhrWritebackQueueViewDto` records queue lifecycle states, sandbox mode, `liveProductionWritebackEnabled=false`, `payloadsExcluded=true`, and warnings that live production delivery remains disabled.
- `EhrWritebackQueueActionRequestDto` and response DTOs represent approval, retry, dead-letter, and reconciliation evidence without raw payload content.

These records remain synthetic/local API metadata. `WO-044` does not add new production database approval, raw EHR payload storage, production EHR credentials, live writeback delivery, autonomous note submission, charge finalization, medical-necessity determination, or claim submission.

## WO-045 ClinicOS mapping and publication model status

`WO-045` extends the ClinicOS metadata model without adding raw payload persistence:

- `ClinicOsModuleBoundaryDto` records the M03/M04/M17/M21/M23/M24/M25/M26 module boundary, source-of-truth posture, delegation flag, and `permissionBoundary='aura_note_authoritative'`.
- `ClinicOsMappingRecordDto` now records mapping status across active, pending, stale, degraded, unavailable, and failed states with trace ID, last-checked timestamp, optional stale/degraded reason, and optional last-published timestamp.
- `ClinicOsPublishedEventDto` records target modules and publication status across queued, sent-mock, skipped-disabled, failed-unavailable, and degraded states with `payloadStored=false` and `permissionBoundaryEnforced=true`.
- `ClinicOsIntegrationStatusDto` records screen states, `rawPayloadsStored=false`, `liveClinicOsSyncEnabled=false`, and explicit AURA Note permission-boundary evidence.

These records remain synthetic/local API metadata mapped to the existing P7 `ModeMapping`, `IntegrationConnection`, and `DomainEvent` shape. `WO-045` does not add live ClinicOS credentials, production event-bus payload persistence, raw ClinicOS message storage, live delegated identity, production patient data, charge finalization, medical-necessity determination, or claim submission.

## WO-046 AI governance and evaluation model status

`WO-046` extends AI Gateway metadata contracts without adding live model payload persistence:

- `AiPromptRegistryEntryDto` records prompt ID, version, purpose, output type, schema version, risk label, active state, source-link requirement, and human-review requirement.
- `AiModelConfigurationDto` records mock/private-BAA-placeholder/external-disabled mode, model version, policy mode, credential source metadata, approval state, and `liveInvocationEnabled=false`.
- `AiEvaluationCaseDto` and `AiEvaluationResultDto` record deterministic synthetic eval case IDs, purpose, output type, prompt/model metadata, source evidence IDs, validation status, risk label, unsafe reasons, trace ID, and `liveModelCalled=false`.
- `AiOutputValidationResultDto` records accepted/rejected status, risk label, prohibited-action detection, raw-PHI detection, unsafe reasons, and `humanReviewRequired=true`.

These records remain synthetic/local API metadata mapped to audit/domain-event evidence. `WO-046` does not add production prompt stores, raw prompt persistence, raw model response persistence, production model credentials, raw PHI transfer to AI, live external AI execution, autonomous finalization, medical-necessity determination, charge finalization, or claim submission.

## WO-047 security/privacy/compliance data review

`WO-047` reviews the P9 data posture and adds `docs/THREAT_MODEL.md` as evidence. No new P9 blocker was found in the current synthetic/local scope. The data model remains production-incomplete until P10/P11 and later launch work close deferred decisions for production database roles, migration approval/rollback, backup/restore drills, PHI storage policy, live vendor payload policy, formal access-review evidence, and launch signoff.

## WO-048 frontend runtime integration data status

`WO-048` adds no new persistence model. It proves that one browser workflow can use typed API clients and backend-backed state from appointment creation through finalization/export and refetch evidence. Existing documented mock routes still require later conversion or explicit launch deferral.

## WO-049 launch operations data status

`WO-049` adds no new PHI-bearing persistence and no production database writes. Launch operations evidence is represented as synthetic metadata in docs, support status UI, deterministic performance results, and existing audit/support event categories. Production launch remains blocked until formal deployment, backup/restore, migration approval, access-review, and operational owner evidence is approved.

## WO-050 beta pilot launch data status

`WO-050` adds no PHI-bearing persistence. Pilot launch readiness evidence is synthetic metadata only: tenant/site placeholders, role-training checklist status, disabled feature inventory, support escalation placeholders, first-week monitoring placeholders, rollback criteria, approval placeholders, and seeded frontend runtime integration evidence. No production tenant, production PHI, raw transcript, final note, billing detail, raw prompt, production credential, live vendor payload, charge-finalization record, medical-necessity record, or submitted claim is persisted by this work order.

## WO-051 claim/payer decision data status

`WO-051` adds no claim-submission persistence, clearinghouse payload tables, payer response tables, denial automation tables, payment posting tables, production payer credentials, or PHI-bearing payer records. The decision package documents future data needs only: claim submission request/approval, clearinghouse routing, payer acknowledgement/rejection, denial worklists, void/reversal, payment reconciliation, and audit evidence. Current draft claim preview persistence continues enforcing `submittedClaim=false`.

## WO-063 identity runtime boundary data status

`WO-063` adds no production identity store, token persistence, SAML assertion persistence, OIDC claims persistence, ClinicOS delegated identity payload persistence, or PHI-bearing identity record. It adds `IdentityRuntimeBoundaryDecisionDto` and OpenAPI schema metadata for audit-safe boundary decisions: allowed state, `AURA_NOTE_AUTH_MODE`, identity source, failure reason, `liveCredentialPresent=false`, `delegatedIdentityConfigured=false`, `rawTokenReturned=false`, and synthetic-header acceptance state.

Identity accepted/denied evidence remains local structured runtime log metadata. Durable tenant-owned identity-boundary event persistence remains deferred until a later audit/runtime work order promotes request-boundary decisions into persisted audit/event records.

## WO-067 ModeResolver adapter-boundary data status

`WO-067` adds no new production tables and no raw ClinicOS payload persistence. It extends the ClinicOS DTO/OpenAPI model with `AuraModeAdapterBoundaryDto` and `modeAdapterBoundaries` evidence for schedule source, patient context, VisitGraph, tasks, audit, AI governance, Charge Integrity, EHR, export, and identity seams.

The metadata records source-of-truth posture, adapter status, optional ClinicOS module ID, `permissionBoundary='aura_note_authoritative'`, `liveDelegationEnabled=false`, `rawPayloadStorageEnabled=false`, `humanReviewRequired=true`, and fail-closed write state for degraded/unavailable ClinicOS mode. Existing `ModeMapping`, `IntegrationConnection`, domain-event, and audit-event shapes remain the durability path where prior work orders already require persisted adapter metadata. Broader live ClinicOS event-bus payloads, delegated identity payloads, production synchronization records, and raw module payload storage remain deferred.

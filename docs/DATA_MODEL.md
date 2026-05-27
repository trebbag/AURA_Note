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

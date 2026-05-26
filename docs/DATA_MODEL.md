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

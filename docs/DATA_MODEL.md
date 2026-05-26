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

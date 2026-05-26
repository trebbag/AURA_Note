# API and Event Contracts

The OpenAPI seed lives at `packages/contracts/openapi/aura-note.v1.yaml`. This file describes the required contract families.

## API families

1. Health/status.
2. Tenant/site/settings.
3. Users and permissions.
4. Schedule and appointments.
5. Patient and chart context.
6. Notes and visit sessions.
7. Recording/transcription.
8. Suggestions and AI evaluation.
9. Visit Selections.
10. Compliance & Quality Review.
11. History Gap Review.
12. Tasks and blockers.
13. Finalization Wizard.
14. Billing & Attest / draft claim preview.
15. Exports/PDF/copy.
16. EHR writeback.
17. Templates and dot phrases.
18. Coaching.
19. ClinicOS adapter.
20. Audit and events.

## Standard event envelope

```ts
type AuraNoteEvent<TPayload> = {
  eventId: string;
  eventType: string;
  schemaVersion: 'v1';
  tenantId: string;
  siteId: string;
  patientIdHash?: string;
  appointmentId?: string;
  noteId?: string;
  visitSessionId?: string;
  producer: string;
  eventTime: string;
  traceId: string;
  idempotencyKey: string;
  sensitivity: 'non_phi' | 'phi_reference' | 'restricted';
  retentionClass: 'standard' | 'audit' | 'transcript' | 'audio_ephemeral';
  payload: TPayload;
};
```

## Required domain events

- `appointment.created.v1`
- `note.shell_created.v1`
- `visit.started.v1`
- `visit.paused.v1`
- `visit.resumed.v1`
- `visit.stopped.v1`
- `recording.started.v1`
- `recording.exception_approved.v1`
- `recording.stopped.v1`
- `transcript.segment_added.v1`
- `transcript.finalized.v1`
- `suggestions.evaluated.v1`
- `visit_selection.added.v1`
- `visit_selection.removed.v1`
- `low_confidence_diagnosis.override_recorded.v1`
- `compliance.issue_created.v1`
- `compliance.issue_resolved.v1`
- `history_gap.question_created.v1`
- `history_gap.question_routed_to_ma.v1`
- `task.created.v1`
- `task.blocker_changed.v1`
- `task.adjudicated.v1`
- `finalization.started.v1`
- `finalization.step_completed.v1`
- `finalization.compose_requested.v1`
- `finalization.compose_completed.v1`
- `final_note.approved.v1`
- `patient_summary.approved.v1`
- `billing_review.triggered.v1`
- `draft_claim_preview.generated.v1`
- `note.signed.v1`
- `note.dispatched.v1`
- `export.generated.v1`
- `ehr_writeback.queued.v1`
- `ehr_writeback.completed.v1`
- `ehr_writeback.failed.v1`
- `coaching.report_generated.v1`
- `audit.event_recorded.v1`

## API implementation rule

Every state-changing API must emit an audit event. Domain-significant state changes must emit a domain event as well.

## Implementation status

The CP-0 tranche implemented typed contract seeds. `WO-002` adds the first implemented Schedule Builder lifecycle endpoints:

- `GET /api/v1/schedule/appointments`
- `POST /api/v1/schedule/appointments`
- `POST /api/v1/schedule/appointments/{appointmentId}/start-visit`

The remaining OpenAPI operation IDs are retained as contract seeds for later work orders and must not be described as runtime-complete until their owning work order adds handlers, permission checks, audit emission, and tests.

CP-0 adds TypeScript DTOs and tests for:

- `AppointmentDto`
- `NoteDto`
- `VisitSessionDto`
- `TaskDto`
- `WizardStepDecisionDto`
- `AuditEventDto`
- `AuraNoteEvent<TPayload>`

The CP-0 event scaffold covers the first state-transition families needed by `WO-001`: appointment creation, note shell creation, visit start/pause/resume/stop, recording start/stop/exception, task blocker changes, low-confidence override recording, finalization start/step completion, and audit recording.

`WO-002` emits `appointment.created.v1`, `note.shell_created.v1`, and `visit.started.v1` from the in-memory standalone API implementation. The deeper timer, recording, and transcription lifecycle remains scoped to `WO-004`.

`WO-003` implements read-only/query CP-1 shells for Draft Notes, Finalized Notes, and Documentation Workspace. These endpoints do not introduce new state-changing operations, so no additional domain events are required for `WO-003`. Future state-changing editor updates remain contract seeds until timer/editing behavior is implemented in `WO-004`.

`WO-004` implements timer, recording-gate, raw-audio retention metadata, and mock transcript state changes. The CP-1 API emits `visit.paused.v1`, `visit.resumed.v1`, `visit.stopped.v1`, `recording.started.v1`, `recording.exception_approved.v1`, `recording.stopped.v1`, `raw_audio.retention_scheduled.v1`, and `transcript.segment_appended.v1` from the synthetic standalone implementation. These events are audit-safe metadata events and do not represent live audio capture or external transcription.

`WO-005` implements deterministic mock review-panel state changes. The CP-1 API emits `suggestions.evaluated.v1`, `suggestion.accepted.v1`, `suggestion.removed.v1`, `visit_selection.added.v1`, `compliance.evaluated.v1`, `history_gap.task_created.v1`, and `task.blocker_changed.v1`. These events represent draft/candidate workflow state only; they do not autonomously diagnose, code, bill, determine medical necessity, finalize charges, or submit claims.

`WO-006` implements the first four Finalization Wizard steps over a frozen synthetic snapshot. The CP-2 API adds implemented endpoints for starting finalization, recording Step 1 selected-item decisions, completing Code Review, recording Step 2 final-pass suggestion decisions, completing Suggestion Review, running deterministic mock Compose, updating the Compare & Edit source note, Re-beautify, approving the final note, and approving the patient summary. It emits `finalization.started.v1`, `finalization.selection_decided.v1`, `finalization.suggestion_decided.v1`, `finalization.compose_requested.v1`, `finalization.compose_completed.v1`, `finalization.compare_edit_updated.v1`, `finalization.compose_rebeautified.v1`, `final_note.approved.v1`, `patient_summary.approved.v1`, and `finalization.step_completed.v1`. These events represent human-reviewed wizard state only; Billing & Attest, signing, dispatch, final records, export/PDF/copy, and EHR writeback remain contract seeds until `WO-007` and `WO-008`.

`WO-007` implements Billing & Attest, draft claim preview, and Sign & Dispatch over the synthetic finalization session. The API emits `draft_claim_preview.generated.v1`, `billing_review.triggered.v1`, `billing_attestation.completed.v1`, `note.signed.v1`, `final_note.created.v1`, `patient_summary.finalized.v1`, `note.dispatched.v1`, and `finalization.step_completed.v1`. Draft claim preview events are internal candidate/readiness events only: they do not submit claims, finalize charges, finalize coding, or determine medical necessity. Export/PDF/copy and EHR writeback remain scoped to `WO-008`.

`WO-008` implements signed-output artifact actions and finalized-note detail state. The API emits `export.generated.v1` for final-note PDF, patient-summary PDF, final-note copy, patient-summary copy, and structured export artifact creation. It emits `ehr_writeback.queued.v1` only for the explicit mock-queue scaffold path and `ehr_writeback.failed.v1` for not-configured, unsupported, or simulated-failure writeback states. These events are audit-safe workflow metadata only: they do not perform live EHR writeback, submit claims, finalize charges, or connect to production storage.

`WO-009` implements the AI Gateway PHI boundary in mock-only mode. The API emits `ai.phi_rejected.v1` when forbidden PHI keys or obvious PHI-like free-text patterns are rejected before model invocation. It emits `ai.context_scrubbed.v1` when explicit redaction mode removes forbidden PHI values, `ai.request_prepared.v1` when a typed context package is accepted, and `ai.response_recorded.v1` when the mock provider returns a draft/candidate/suggestion-only response. These events contain governance metadata, prompt/model versions, source evidence IDs, and context package IDs; they do not contain raw note text, raw transcript text, production chart data, or live model output. External AI remains disabled by default.

`WO-010` implements the EHR adapter scaffold with an athenahealth-first path. The API emits `ehr.adapter_status_checked.v1` when adapter status is checked and `ehr.chart_context_loaded.v1` when source-linked synthetic chart context is loaded through the adapter boundary. Events include vendor, mode, health, chart context package ID, requested slice names, slice counts, stale slice count, and validation warnings. They do not contain raw EHR payloads, production patient identifiers, live athenahealth responses, or writeback content. Live EHR credentials and production writeback remain disabled.

`WO-011` implements the ClinicOS integration adapter scaffold. The API emits `clinicos.mode_resolved.v1` for standalone/ClinicOS mode checks, `clinicos.mapping_recorded.v1` when mock VisitGraph/M17 mappings are recorded, `clinicos.event_published.v1` when AURA Note events are queued or safely skipped for ClinicOS module targets, and `clinicos.unavailable.v1` when ClinicOS mock mode is configured but unavailable. These events preserve AURA Note as the owner of the note lifecycle and explicitly record that AURA Note permissions remain enforced; they do not grant ClinicOS context a permission bypass.

`WO-012` implements coaching and premium analytics scaffolding. The API emits `coaching.report_generated.v1` when a treating clinician views their own synthetic coaching report and `coaching.dashboard_viewed.v1` when an authorized admin views the premium dashboard scaffold. `coaching.signal_created.v1` is added as the event contract seed for future asynchronous signal generation. Coaching events are restricted audit metadata only; they are not patient-facing, do not expose revenue details to patients, and do not grant billing staff access to coaching outputs.

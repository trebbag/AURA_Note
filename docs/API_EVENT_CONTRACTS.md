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

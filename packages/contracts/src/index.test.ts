import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createApiEnvelope,
  createEventEnvelope,
  isStateChangingEvent,
  type DocumentationWorkspaceDto,
  type DraftNoteSummaryDto,
  type ScheduleAppointmentDto
} from './index';

describe('API envelope', () => {
  it('wraps data with request metadata', () => {
    const envelope = createApiEnvelope(
      { status: 'ok' },
      {
        requestId: 'req-001',
        traceId: 'trace-001',
        mode: 'standalone',
        generatedAt: '2026-05-26T00:00:00.000Z'
      }
    );

    assert.equal(envelope.data.status, 'ok');
    assert.equal(envelope.meta.mode, 'standalone');
    assert.equal(envelope.warnings, undefined);
  });
});

describe('event envelope', () => {
  it('adds the schema version and event timestamp to a CP-0 domain event', () => {
    const event = createEventEnvelope({
      eventId: 'evt-001',
      eventType: 'appointment.created.v1',
      tenantId: 'tenant-001',
      siteId: 'site-001',
      appointmentId: 'appt-001',
      noteId: 'note-001',
      producer: 'aura-note-api',
      traceId: 'trace-001',
      idempotencyKey: 'idem-001',
      sensitivity: 'phi_reference',
      retentionClass: 'audit',
      payload: { appointmentId: 'appt-001', noteId: 'note-001' }
    });

    assert.equal(event.schemaVersion, 'v1');
    assert.equal(event.eventType, 'appointment.created.v1');
    assert.match(event.eventTime, /^\d{4}-\d{2}-\d{2}T/);
  });

  it('treats domain events as state-changing and audit recording as non-domain state change', () => {
    assert.equal(isStateChangingEvent('task.blocker_changed.v1'), true);
    assert.equal(isStateChangingEvent('audit.event_recorded.v1'), false);
  });
});

describe('schedule contracts', () => {
  it('represents note shell status on schedule appointment cards', () => {
    const card: ScheduleAppointmentDto = {
      appointmentId: 'appt-001',
      tenantId: 'tenant-001',
      siteId: 'site-001',
      safePatientId: 'safe-patient-001',
      clinicianId: 'clinician-001',
      noteId: 'note-001',
      state: 'scheduled',
      startsAt: '2026-05-26T14:00:00.000Z',
      durationMinutes: 30,
      visitType: 'Chronic follow-up',
      modality: 'in_person',
      source: 'standalone',
      mode: 'standalone',
      noteStatus: 'shell_created',
      noteVisibleInDrafts: false,
      startVisitEnabled: true,
      ehrSchedulingEnabled: false,
      clinicOsSchedulingEnabled: false
    };

    assert.equal(card.noteStatus, 'shell_created');
    assert.equal(card.startVisitEnabled, true);
    assert.equal(card.ehrSchedulingEnabled, false);
    assert.equal(card.clinicOsSchedulingEnabled, false);
  });
});

describe('documentation workspace contracts', () => {
  it('represents Draft Notes summaries without exposing a final note', () => {
    const draft: DraftNoteSummaryDto = {
      noteId: 'note-001',
      appointmentId: 'appt-001',
      safePatientId: 'safe-patient-001',
      clinicianId: 'clinician-001',
      visitType: 'Chronic follow-up',
      startsAt: '2026-05-26T14:00:00.000Z',
      noteStatus: 'visit_active',
      appointmentStatus: 'visit_started',
      workflowStatusLabel: 'Visit active',
      editorLocked: false
    };

    assert.equal(draft.noteStatus, 'visit_active');
    assert.equal(draft.editorLocked, false);
  });

  it('seeds all WO-003 workspace regions as explicit panel states', () => {
    const workspace: DocumentationWorkspaceDto = {
      appointment: {
        appointmentId: 'appt-001',
        tenantId: 'tenant-001',
        siteId: 'site-001',
        safePatientId: 'safe-patient-001',
        clinicianId: 'clinician-001',
        noteId: 'note-001',
        state: 'scheduled',
        startsAt: '2026-05-26T14:00:00.000Z',
        durationMinutes: 30,
        visitType: 'Chronic follow-up',
        modality: 'in_person',
        source: 'standalone',
        mode: 'standalone'
      },
      note: {
        noteId: 'note-001',
        appointmentId: 'appt-001',
        tenantId: 'tenant-001',
        siteId: 'site-001',
        safePatientId: 'safe-patient-001',
        clinicianId: 'clinician-001',
        state: 'shell_created',
        mode: 'standalone'
      },
      editorLocked: true,
      editorLockedReason: 'Start Visit and run the timer before documenting.',
      finalizedReadOnly: false,
      availableStates: ['empty', 'loading', 'ready', 'saving', 'warning', 'blocked', 'failed', 'permission_denied', 'finalized_read_only', 'demo_fixture'],
      panels: [
        { panelId: 'visit_context', label: 'Visit Context', state: 'ready', itemCount: 1 },
        { panelId: 'controls', label: 'Visit Controls', state: 'blocked', itemCount: 0 },
        { panelId: 'editor', label: 'Note Editor', state: 'blocked', itemCount: 0 },
        { panelId: 'visit_selections', label: 'Visit Selections', state: 'empty', itemCount: 0 },
        { panelId: 'suggestions', label: 'Suggestions', state: 'empty', itemCount: 0 },
        { panelId: 'transcript', label: 'Transcript', state: 'empty', itemCount: 0 },
        { panelId: 'compliance', label: 'Compliance & Quality Review', state: 'empty', itemCount: 0 },
        { panelId: 'history_gap', label: 'History Gap Review', state: 'empty', itemCount: 0 }
      ]
    };

    assert.deepEqual(
      workspace.panels.map((panel) => panel.panelId),
      ['visit_context', 'controls', 'editor', 'visit_selections', 'suggestions', 'transcript', 'compliance', 'history_gap']
    );
    assert.equal(workspace.availableStates.includes('permission_denied'), true);
  });
});

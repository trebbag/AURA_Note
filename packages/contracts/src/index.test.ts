import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createApiEnvelope,
  createEventEnvelope,
  isStateChangingEvent,
  type ComplianceReviewDto,
  type DocumentationWorkspaceDto,
  type DraftNoteSummaryDto,
  type FinalizationSessionDto,
  type ReviewActionResponseDto,
  type SuggestionDto,
  type TranscriptViewDto,
  type VisitSessionControlResponseDto,
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
    assert.equal(isStateChangingEvent('transcript.segment_appended.v1'), true);
    assert.equal(isStateChangingEvent('suggestion.accepted.v1'), true);
    assert.equal(isStateChangingEvent('finalization.compose_completed.v1'), true);
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

describe('review panel contracts', () => {
  it('represents draft-only suggestions and compliance hard blocks', () => {
    const suggestion: SuggestionDto = {
      suggestionId: 'suggestion-001',
      noteId: 'note-001',
      category: 'icd10',
      label: 'ICD-10 synthetic candidate',
      confidence: 0.74,
      rationale: 'Synthetic low-confidence rationale',
      supportingEvidence: ['Synthetic support'],
      missingEvidence: ['Synthetic missing evidence'],
      status: 'candidate',
      lowConfidenceOverrideRequired: true,
      draftOnly: true
    };
    const compliance: ComplianceReviewDto = {
      noteId: 'note-001',
      issues: [
        {
          complianceIssueId: 'compliance-001',
          noteId: 'note-001',
          severity: 'hard_block',
          title: 'Open blocker',
          detail: 'Synthetic blocker',
          blocksFinalize: true,
          source: 'deterministic_mock'
        }
      ],
      finalizeDisabled: true
    };

    assert.equal(suggestion.draftOnly, true);
    assert.equal(suggestion.lowConfidenceOverrideRequired, true);
    assert.equal(compliance.finalizeDisabled, true);
  });

  it('groups Suggestions, Visit Selections, Compliance, History Gap, and tasks in one review action response', () => {
    const response: ReviewActionResponseDto = {
      suggestions: [],
      visitSelections: [],
      complianceReview: { noteId: 'note-001', issues: [], finalizeDisabled: false },
      historyGaps: [],
      tasks: [],
      auditEvent: {
        auditEventId: 'audit-001',
        tenantId: 'tenant-001',
        action: 'suggestions.evaluate',
        entityType: 'Note',
        entityId: 'note-001',
        traceId: 'trace-001',
        createdAt: '2026-05-26T14:00:00.000Z'
      },
      domainEvents: []
    };

    assert.equal(response.complianceReview.finalizeDisabled, false);
    assert.equal(Array.isArray(response.historyGaps), true);
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

describe('finalization contracts', () => {
  it('represents a WO-006 finalization session with frozen Step 1 and Step 2 review inputs', () => {
    const session: FinalizationSessionDto = {
      finalizationSessionId: 'finalization-001',
      noteId: 'note-001',
      appointmentId: 'appt-001',
      currentStep: 'code_review',
      completedSteps: [],
      stepStatuses: {
        code_review: 'in_progress',
        suggestion_review: 'not_started',
        compose: 'not_started',
        compare_edit: 'not_started',
        billing_attest: 'not_started',
        sign_dispatch: 'not_started'
      },
      frozenSnapshot: {
        originalNoteText: 'Synthetic source note.',
        visitSelections: [
          {
            visitSelectionId: 'selection-001',
            noteId: 'note-001',
            category: 'cpt',
            label: 'CPT 99214 candidate',
            confidence: 0.82,
            humanApproved: true
          }
        ],
        finalPassSuggestions: [
          {
            suggestionId: 'suggestion-001',
            noteId: 'note-001',
            category: 'quality_measure',
            label: 'Quality follow-up',
            confidence: 0.88,
            rationale: 'Synthetic final-pass signal',
            supportingEvidence: ['Synthetic source'],
            missingEvidence: [],
            status: 'candidate',
            lowConfidenceOverrideRequired: false,
            draftOnly: true
          }
        ],
        transcriptSegmentCount: 1,
        historyGapQuestionCount: 0
      },
      selectionDecisions: [],
      suggestionDecisions: [],
      unusedAuditItems: [],
      composePhases: [],
      patientOpportunities: [],
      finalNoteApproved: false,
      patientSummaryApproved: false,
      readyForBillingAttest: false,
      createdAt: '2026-05-26T16:00:00.000Z',
      updatedAt: '2026-05-26T16:00:00.000Z'
    };

    assert.equal(session.frozenSnapshot.visitSelections.length, 1);
    assert.equal(session.frozenSnapshot.finalPassSuggestions[0]?.confidence, 0.88);
    assert.equal(session.stepStatuses.billing_attest, 'not_started');
  });
});

describe('timer and transcript contracts', () => {
  it('represents session control responses with raw audio retention metadata', () => {
    const response: VisitSessionControlResponseDto = {
      appointment: {
        appointmentId: 'appt-001',
        tenantId: 'tenant-001',
        siteId: 'site-001',
        safePatientId: 'safe-patient-001',
        clinicianId: 'clinician-001',
        noteId: 'note-001',
        state: 'visit_started',
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
        state: 'visit_active',
        mode: 'standalone'
      },
      visitSession: {
        visitSessionId: 'visit-session-001',
        noteId: 'note-001',
        timerState: 'running',
        recordingState: 'recording',
        editorUnlocked: true,
        elapsedSeconds: 0
      },
      rawAudioRetention: {
        recordingId: 'recording-001',
        noteId: 'note-001',
        retentionClass: 'audio_ephemeral',
        capturedAt: '2026-05-26T14:00:00.000Z',
        purgeAfter: '2026-06-02T14:00:00.000Z',
        purgeEligible: false
      },
      auditEvent: {
        auditEventId: 'audit-001',
        tenantId: 'tenant-001',
        action: 'visit.start',
        entityType: 'Appointment',
        entityId: 'appt-001',
        traceId: 'trace-001',
        createdAt: '2026-05-26T14:00:00.000Z'
      },
      domainEvents: []
    };

    assert.equal(response.visitSession.editorUnlocked, true);
    assert.equal(response.rawAudioRetention?.retentionClass, 'audio_ephemeral');
  });

  it('represents mock transcript segments with indefinite retention', () => {
    const transcript: TranscriptViewDto = {
      noteId: 'note-001',
      transcriptId: 'transcript-001',
      retentionPolicy: 'indefinite',
      segments: [
        {
          transcriptSegmentId: 'segment-001',
          noteId: 'note-001',
          sequence: 1,
          speakerRole: 'clinician',
          text: 'Synthetic mock transcript segment',
          source: 'mock_transcription',
          createdAt: '2026-05-26T14:00:00.000Z'
        }
      ]
    };

    assert.equal(transcript.retentionPolicy, 'indefinite');
    assert.equal(transcript.segments[0]?.source, 'mock_transcription');
  });
});

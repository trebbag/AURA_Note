import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canCompleteWizardStep,
  canEditNote,
  canSignAndDispatch,
  canStartVisit,
  approveRecordingException,
  createAppointmentLifecycle,
  createAppointmentNoteInvariant,
  createRawAudioRetentionMetadata,
  createTranscriptRetentionMetadata,
  evaluateLowConfidenceOverride,
  getNextWizardStep,
  isLowConfidenceDiagnosis,
  pauseVisitGate,
  recordingExceptionIsActive,
  resumeVisitGate,
  stopVisitGate
} from './index';

describe('appointment-note invariant', () => {
  it('accepts exactly one reciprocal appointment-note relationship', () => {
    const invariant = createAppointmentNoteInvariant(
      { appointmentId: 'appt-001', noteId: 'note-001' },
      { appointmentId: 'appt-001', noteId: 'note-001' }
    );

    assert.equal(invariant.relationship, 'one_to_one');
    assert.equal(invariant.appointmentId, 'appt-001');
    assert.equal(invariant.noteId, 'note-001');
  });

  it('rejects mismatched appointment and note references', () => {
    assert.throws(
      () =>
        createAppointmentNoteInvariant(
          { appointmentId: 'appt-001', noteId: 'note-001' },
          { appointmentId: 'appt-002', noteId: 'note-001' }
        ),
      /one-to-one/
    );
  });
});

describe('appointment lifecycle', () => {
  const appointmentDraft = {
    tenantId: 'tenant-001',
    siteId: 'site-001',
    safePatientId: 'safe-patient-001',
    clinicianId: 'clinician-001',
    visitType: 'Chronic follow-up',
    startsAt: '2026-05-26T14:00:00.000Z',
    durationMinutes: 30,
    modality: 'in_person' as const,
    source: 'standalone' as const,
    reasonForVisit: 'Synthetic follow-up'
  };

  it('creates an inactive note shell when a valid standalone appointment is created', () => {
    assert.deepEqual(createAppointmentLifecycle('appt-001', 'note-001', appointmentDraft), {
      appointmentId: 'appt-001',
      noteId: 'note-001',
      appointmentState: 'scheduled',
      noteState: 'shell_created',
      noteVisibleInDrafts: false
    });
  });

  it('rejects invalid appointment creation input before a note shell is created', () => {
    assert.throws(
      () => createAppointmentLifecycle('appt-001', 'note-001', { ...appointmentDraft, visitType: '', durationMinutes: 0 }),
      /visitType is required/
    );
  });

  it('allows Start Visit only for scheduled active note shells', () => {
    assert.equal(canStartVisit('scheduled', 'shell_created'), true);
    assert.equal(canStartVisit('cancelled', 'shell_created'), false);
    assert.equal(canStartVisit('scheduled', 'visit_active'), false);
  });
});

describe('timer and recording gate', () => {
  it('keeps editing locked until the timer is running', () => {
    assert.equal(
      canEditNote({
        noteId: 'note-001',
        timerState: 'not_started',
        recordingState: 'not_started',
        editorUnlocked: false
      }),
      false
    );
  });

  it('unlocks editing while the timer is running', () => {
    assert.equal(
      canEditNote({
        noteId: 'note-001',
        timerState: 'running',
        recordingState: 'recording',
        editorUnlocked: true
      }),
      true
    );
  });

  it('allows the approved recording exception path without marking normal recording active', () => {
    const gate = {
      noteId: 'note-001',
      timerState: 'stopped' as const,
      recordingState: 'exception_approved' as const,
      editorUnlocked: true,
      exceptionReason: 'Approved no-audio documentation exception for synthetic fixture'
    };

    assert.equal(canEditNote(gate), true);
    assert.equal(recordingExceptionIsActive(gate), true);
    assert.notEqual(gate.recordingState, 'recording');
  });

  it('moves running visits through pause, resume, and stop while enforcing editor access', () => {
    const runningGate = {
      noteId: 'note-001',
      timerState: 'running' as const,
      recordingState: 'recording' as const,
      editorUnlocked: true
    };

    const paused = pauseVisitGate(runningGate);
    assert.equal(paused.timerState, 'paused');
    assert.equal(paused.recordingState, 'paused');
    assert.equal(paused.editorUnlocked, false);

    const resumed = resumeVisitGate(paused);
    assert.equal(resumed.timerState, 'running');
    assert.equal(resumed.recordingState, 'recording');
    assert.equal(resumed.editorUnlocked, true);

    const stopped = stopVisitGate(resumed);
    assert.equal(stopped.timerState, 'stopped');
    assert.equal(stopped.recordingState, 'stopped');
    assert.equal(stopped.editorUnlocked, false);
  });

  it('creates a recording exception gate without implying normal recording', () => {
    const exceptionGate = approveRecordingException(
      {
        noteId: 'note-001',
        timerState: 'paused',
        recordingState: 'paused',
        editorUnlocked: false
      },
      'Synthetic clinician-approved no-audio exception'
    );

    assert.equal(exceptionGate.timerState, 'paused');
    assert.equal(exceptionGate.recordingState, 'exception_approved');
    assert.equal(exceptionGate.editorUnlocked, true);
    assert.equal(recordingExceptionIsActive(exceptionGate), true);
  });
});

describe('retention metadata', () => {
  it('sets raw audio purge eligibility one week after capture', () => {
    const metadata = createRawAudioRetentionMetadata('recording-001', 'note-001', '2026-05-26T15:00:00.000Z');

    assert.equal(metadata.retentionClass, 'audio_ephemeral');
    assert.equal(metadata.purgeAfter, '2026-06-02T15:00:00.000Z');
    assert.equal(metadata.purgeEligible, false);
  });

  it('marks transcript retention as indefinite', () => {
    const metadata = createTranscriptRetentionMetadata('transcript-001', 'note-001');

    assert.equal(metadata.retentionClass, 'transcript');
    assert.equal(metadata.retentionPolicy, 'indefinite');
  });
});

describe('low-confidence diagnosis override', () => {
  it('requires override metadata below 75 percent confidence', () => {
    assert.equal(isLowConfidenceDiagnosis(0.74), true);
    assert.deepEqual(evaluateLowConfidenceOverride({ confidence: 0.74 }), {
      overrideRequired: true,
      accepted: false,
      flagsBillingReview: false,
      flagsCoachingReview: false
    });
  });

  it('flags billing and coaching review only after complete override metadata is present', () => {
    assert.deepEqual(
      evaluateLowConfidenceOverride({
        confidence: 0.42,
        overrideReason: 'Clinician-selected synthetic differential requires follow-up justification',
        supportingEvidence: 'Synthetic chart fact supports consideration',
        nonSupportingEvidence: 'Synthetic chart fact conflicts with certainty',
        uncertaintyExplanation: 'Synthetic data lacks confirming evidence',
        confidenceImprovementPlan: 'Collect follow-up history before final attribution'
      }),
      {
        overrideRequired: true,
        accepted: true,
        flagsBillingReview: true,
        flagsCoachingReview: true
      }
    );
  });
});

describe('finalization gates', () => {
  it('blocks signing for unresolved blocker tasks', () => {
    assert.equal(
      canSignAndDispatch({
        finalNoteApproved: true,
        patientSummaryApproved: true,
        tasks: [{ blocksSigning: true, adjudicationStatus: 'open' }]
      }),
      false
    );
  });

  it('allows signing after required approvals and adjudicated blocker tasks', () => {
    assert.equal(
      canSignAndDispatch({
        finalNoteApproved: true,
        patientSummaryApproved: true,
        tasks: [{ blocksSigning: true, adjudicationStatus: 'assigned' }]
      }),
      true
    );
  });

  it('enforces finalization wizard step order', () => {
    assert.equal(getNextWizardStep([]), 'code_review');
    assert.equal(canCompleteWizardStep([], 'suggestion_review'), false);
    assert.equal(canCompleteWizardStep(['code_review'], 'suggestion_review'), true);
  });
});

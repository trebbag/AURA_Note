import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canCompleteWizardStep,
  canEditNote,
  canSignAndDispatch,
  createAppointmentNoteInvariant,
  evaluateLowConfidenceOverride,
  getNextWizardStep,
  isLowConfidenceDiagnosis,
  recordingExceptionIsActive
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

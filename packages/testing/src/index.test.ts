import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createAppointmentNoteInvariant } from '@aura-note/domain';
import { canViewTranscript } from '@aura-note/security';
import {
  createAccessContext,
  createSyntheticAiEvidenceNode,
  createSyntheticAiInvocationRequest,
  createSyntheticAppointment,
  createSyntheticBlockingTask,
  createSyntheticNote,
  createSyntheticVisitSession
} from './index';

describe('synthetic CP-0 fixtures', () => {
  it('creates appointment and note fixtures that satisfy the one-to-one invariant', () => {
    const appointment = createSyntheticAppointment();
    const note = createSyntheticNote();

    const invariant = createAppointmentNoteInvariant(
      { appointmentId: appointment.appointmentId, noteId: appointment.noteId },
      { appointmentId: note.appointmentId, noteId: note.noteId }
    );

    assert.equal(invariant.relationship, 'one_to_one');
  });

  it('keeps the visit session locked before Start Visit', () => {
    const visitSession = createSyntheticVisitSession();

    assert.equal(visitSession.timerState, 'not_started');
    assert.equal(visitSession.recordingState, 'not_started');
    assert.equal(visitSession.editorUnlocked, false);
  });

  it('creates a signing blocker task fixture', () => {
    const task = createSyntheticBlockingTask();

    assert.equal(task.blocksSigning, true);
    assert.equal(task.adjudicationStatus, 'open');
  });

  it('creates synthetic AI gateway fixtures without raw PHI', () => {
    const evidence = createSyntheticAiEvidenceNode();
    const invocation = createSyntheticAiInvocationRequest({ evidence: [evidence] });

    assert.equal(invocation.safePatientId.startsWith('safe-patient-'), true);
    assert.equal(invocation.clinicalFacts.patientName, undefined);
    assert.equal(invocation.evidence[0]?.phiClassification, 'deidentified');
  });

  it('creates role contexts that exercise transcript visibility rules', () => {
    assert.equal(canViewTranscript(createAccessContext()), true);
    assert.equal(canViewTranscript(createAccessContext({ role: 'billing_staff', treatingClinician: false })), false);
    assert.equal(
      canViewTranscript(
        createAccessContext({
          role: 'billing_staff',
          treatingClinician: false,
          billingReviewTriggered: true
        })
      ),
      true
    );
  });
});

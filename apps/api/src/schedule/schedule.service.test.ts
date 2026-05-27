import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ScheduleService } from './schedule.service';

const createRequest = {
  safePatientId: 'safe-patient-synthetic-wo002',
  clinicianId: 'clinician-synthetic-wo002',
  visitType: 'Chronic follow-up',
  startsAt: '2026-05-26T15:00:00.000Z',
  durationMinutes: 30,
  modality: 'in_person' as const,
  reasonForVisit: 'Synthetic follow-up appointment'
};

const billingStatements = [
  'I have reviewed and accepted the final note.',
  'I have reviewed and accepted the patient summary.',
  'I have reviewed selected codes/items and understand they remain my responsibility.',
  'I have resolved, closed, or assigned open history questions.',
  'I understand the draft claim preview is a support tool and not an automated claim submission.'
];

function completeThroughCompareEdit(service: ScheduleService) {
  const appointment = service
    .createAppointment(createRequest, service.createRequestContext({ 'x-aura-role': 'ma' }))
    .data.appointment;
  const clinician = service.createRequestContext({ 'x-aura-role': 'clinician' });
  service.startVisit(appointment.appointmentId, clinician);
  service.addVisitSelection(appointment.noteId, { category: 'cpt', label: 'CPT 99214 candidate', confidence: 0.82 }, clinician);
  service.appendTranscriptSegment(
    appointment.appointmentId,
    { speakerRole: 'clinician', text: 'Synthetic billing review transcript segment' },
    clinician
  );
  const started = service.startFinalization(appointment.noteId, clinician);
  const selectionId = started.data.finalizationSession.frozenSnapshot.visitSelections[0]?.visitSelectionId ?? 'missing-selection';
  service.decideFinalizationSelection(appointment.noteId, selectionId, { decision: 'keep' }, clinician);
  service.completeCodeReview(appointment.noteId, clinician);
  for (const suggestionId of ['suggestion-demo-cpt-99214', 'suggestion-demo-icd10-e119', 'suggestion-demo-quality-bp']) {
    service.decideFinalizationSuggestion(
      appointment.noteId,
      suggestionId,
      { decision: 'remove', reason: 'Synthetic final-pass removal' },
      clinician
    );
  }
  service.completeSuggestionReview(appointment.noteId, clinician);
  service.composeFinalizationDrafts(appointment.noteId, clinician);
  service.approveFinalNote(
    appointment.noteId,
    { approved: true, attestation: 'I reviewed the current synthetic final note.' },
    clinician
  );
  service.approvePatientSummary(
    appointment.noteId,
    { approved: true, attestation: 'I reviewed the current synthetic patient summary.' },
    clinician
  );
  return { appointment, clinician };
}

function completeThroughSignDispatch(service: ScheduleService) {
  const { appointment, clinician } = completeThroughCompareEdit(service);
  service.generateDraftClaimPreview(appointment.noteId, clinician);
  service.completeBillingAttest(
    appointment.noteId,
    { acceptedStatements: billingStatements, estimateCaveatAcknowledged: true, routeToBillingReview: true },
    clinician
  );
  service.signAndDispatch(appointment.noteId, clinician);
  return { appointment, clinician };
}

describe('ScheduleService', () => {
  it('creates an appointment and exactly one note shell', () => {
    const service = new ScheduleService();
    const context = service.createRequestContext({
      'x-aura-role': 'ma',
      'x-request-id': 'req-wo002-create',
      'x-trace-id': 'trace-wo002-create',
      'idempotency-key': 'idem-wo002-create'
    });

    const response = service.createAppointment(createRequest, context);

    assert.equal(response.data.appointment.noteId, response.data.note.noteId);
    assert.equal(response.data.note.state, 'shell_created');
    assert.equal(response.data.domainEvents.map((event) => event.eventType).join(','), 'appointment.created.v1,note.shell_created.v1');

    const list = service.listAppointments(context);
    assert.equal(list.data.appointments.length, 1);
    assert.equal(list.data.appointments[0]?.noteStatus, 'shell_created');
    assert.equal(list.data.appointments[0]?.noteVisibleInDrafts, false);
  });

  it('replays idempotent appointment creation without creating a duplicate note shell', () => {
    const service = new ScheduleService();
    const context = service.createRequestContext({ 'x-aura-role': 'ma', 'idempotency-key': 'idem-wo002-replay' });

    const first = service.createAppointment(createRequest, context);
    const replay = service.createAppointment({ ...createRequest, visitType: 'Urgent' }, context);

    assert.equal(replay.data.appointment.appointmentId, first.data.appointment.appointmentId);
    assert.equal(replay.data.note.noteId, first.data.note.noteId);
    assert.equal(replay.data.domainEvents.length, 0);
    assert.equal(service.listAppointments(context).data.appointments.length, 1);
  });

  it('denies billing staff appointment creation', () => {
    const service = new ScheduleService();
    const context = service.createRequestContext({ 'x-aura-role': 'billing_staff' });

    assert.throws(() => service.createAppointment(createRequest, context), ForbiddenException);
  });

  it('denies cross-tenant schedule access at the synthetic identity boundary', () => {
    const service = new ScheduleService();

    assert.throws(
      () =>
        service.createRequestContext({
          'x-aura-role': 'ma',
          'x-aura-tenant-id': 'tenant-other'
        }),
      ForbiddenException
    );
  });

  it('rejects invalid appointment input before note shell creation', () => {
    const service = new ScheduleService();
    const context = service.createRequestContext({ 'x-aura-role': 'ma' });

    assert.throws(
      () => service.createAppointment({ ...createRequest, visitType: '', durationMinutes: 0 }, context),
      BadRequestException
    );
    assert.equal(service.listAppointments(service.createRequestContext({ 'x-aura-role': 'ma' })).data.appointments.length, 0);
  });

  it('starts a clinician visit and activates the note shell as a draft', () => {
    const service = new ScheduleService();
    const createContext = service.createRequestContext({ 'x-aura-role': 'ma' });
    const appointment = service.createAppointment(createRequest, createContext).data.appointment;

    const startContext = service.createRequestContext({ 'x-aura-role': 'clinician' });
    const started = service.startVisit(appointment.appointmentId, startContext);

    assert.equal(started.data.appointment.state, 'visit_started');
    assert.equal(started.data.note.state, 'visit_active');
    assert.equal(started.data.visitSession.timerState, 'running');
    assert.equal(started.data.visitSession.recordingState, 'recording');
    assert.equal(started.data.rawAudioRetention?.retentionClass, 'audio_ephemeral');
    assert.equal(started.data.domainEvents[0]?.eventType, 'visit.started.v1');
    assert.equal(started.data.domainEvents.map((event) => event.eventType).includes('recording.started.v1'), true);
    assert.equal(service.listAppointments(startContext).data.appointments[0]?.noteVisibleInDrafts, true);
  });

  it('blocks duplicate Start Visit attempts after the note shell is active', () => {
    const service = new ScheduleService();
    const appointment = service
      .createAppointment(createRequest, service.createRequestContext({ 'x-aura-role': 'ma' }))
      .data.appointment;
    const clinician = service.createRequestContext({ 'x-aura-role': 'clinician' });

    service.startVisit(appointment.appointmentId, clinician);
    assert.throws(() => service.startVisit(appointment.appointmentId, clinician), BadRequestException);
  });

  it('opens a documentation workspace from the schedule with the editor locked before timer activation', () => {
    const service = new ScheduleService();
    const appointment = service
      .createAppointment(createRequest, service.createRequestContext({ 'x-aura-role': 'ma' }))
      .data.appointment;

    const workspace = service.getDocumentationWorkspaceByAppointment(
      appointment.appointmentId,
      service.createRequestContext({ 'x-aura-role': 'clinician' })
    );

    assert.equal(workspace.data.note.noteId, appointment.noteId);
    assert.equal(workspace.data.editorLocked, true);
    assert.match(workspace.data.editorLockedReason ?? '', /Start Visit/);
    assert.equal(workspace.data.panels.some((panel) => panel.panelId === 'history_gap'), true);
    assert.equal(workspace.data.panels.find((panel) => panel.panelId === 'editor')?.state, 'blocked');
  });

  it('lists active notes in Draft Notes after Start Visit', () => {
    const service = new ScheduleService();
    const appointment = service
      .createAppointment(createRequest, service.createRequestContext({ 'x-aura-role': 'ma' }))
      .data.appointment;

    assert.equal(service.listDraftNotes(service.createRequestContext({ 'x-aura-role': 'clinician' })).data.notes.length, 0);
    service.startVisit(appointment.appointmentId, service.createRequestContext({ 'x-aura-role': 'clinician' }));

    const drafts = service.listDraftNotes(service.createRequestContext({ 'x-aura-role': 'clinician' }));

    assert.equal(drafts.data.notes.length, 1);
    assert.equal(drafts.data.notes[0]?.noteStatus, 'visit_active');
    assert.equal(drafts.data.notes[0]?.editorLocked, false);
  });

  it('returns a read-only finalized note placeholder without pretending a final note exists', () => {
    const service = new ScheduleService();
    const appointment = service
      .createAppointment(createRequest, service.createRequestContext({ 'x-aura-role': 'ma' }))
      .data.appointment;

    const finalized = service.getFinalizedNote(
      appointment.noteId,
      service.createRequestContext({ 'x-aura-role': 'clinician' })
    );

    assert.equal(finalized.data.readOnly, true);
    assert.equal(finalized.data.finalNoteAvailable, false);
    assert.equal(finalized.warnings?.[0]?.code, 'FINAL_NOTE_NOT_AVAILABLE');
  });

  it('pauses, resumes, and stops visits while locking and unlocking the editor', () => {
    const service = new ScheduleService();
    const appointment = service
      .createAppointment(createRequest, service.createRequestContext({ 'x-aura-role': 'ma' }))
      .data.appointment;
    const clinician = service.createRequestContext({ 'x-aura-role': 'clinician' });

    service.startVisit(appointment.appointmentId, clinician);
    const paused = service.pauseVisit(appointment.appointmentId, clinician);
    assert.equal(paused.data.visitSession.timerState, 'paused');
    assert.equal(paused.data.visitSession.editorUnlocked, false);
    assert.equal(paused.data.domainEvents[0]?.eventType, 'visit.paused.v1');

    const resumed = service.resumeVisit(appointment.appointmentId, clinician);
    assert.equal(resumed.data.visitSession.timerState, 'running');
    assert.equal(resumed.data.visitSession.editorUnlocked, true);

    const stopped = service.stopVisit(appointment.appointmentId, clinician);
    assert.equal(stopped.data.visitSession.timerState, 'stopped');
    assert.equal(stopped.data.visitSession.editorUnlocked, false);
    assert.equal(stopped.data.domainEvents.map((event) => event.eventType).includes('recording.stopped.v1'), true);
  });

  it('approves a recording exception without treating recording as normal recording', () => {
    const service = new ScheduleService();
    const appointment = service
      .createAppointment(createRequest, service.createRequestContext({ 'x-aura-role': 'ma' }))
      .data.appointment;

    const exception = service.approveRecordingException(
      appointment.appointmentId,
      { exceptionReason: 'Synthetic approved no-audio exception' },
      service.createRequestContext({ 'x-aura-role': 'clinician' })
    );

    assert.equal(exception.data.visitSession.recordingState, 'exception_approved');
    assert.equal(exception.data.visitSession.editorUnlocked, true);
    assert.equal(exception.data.rawAudioRetention, undefined);
    assert.equal(exception.data.domainEvents[0]?.eventType, 'recording.exception_approved.v1');
  });

  it('appends mock transcript segments only while editor gate permits documentation', () => {
    const service = new ScheduleService();
    const appointment = service
      .createAppointment(createRequest, service.createRequestContext({ 'x-aura-role': 'ma' }))
      .data.appointment;
    const clinician = service.createRequestContext({ 'x-aura-role': 'clinician' });

    service.startVisit(appointment.appointmentId, clinician);
    const appended = service.appendTranscriptSegment(
      appointment.appointmentId,
      { speakerRole: 'clinician', text: 'Synthetic mock transcript segment' },
      clinician
    );

    assert.equal(appended.data.transcript?.retentionPolicy, 'indefinite');
    assert.equal(appended.data.transcript?.segments[0]?.source, 'mock_transcription');
    assert.equal(appended.data.domainEvents[0]?.eventType, 'transcript.segment_appended.v1');
  });

  it('evaluates deterministic suggestions and moves accepted cards into Visit Selections', () => {
    const service = new ScheduleService();
    const appointment = service
      .createAppointment(createRequest, service.createRequestContext({ 'x-aura-role': 'ma' }))
      .data.appointment;
    const clinician = service.createRequestContext({ 'x-aura-role': 'clinician' });
    service.startVisit(appointment.appointmentId, clinician);

    const evaluated = service.evaluateSuggestions(appointment.noteId, clinician);
    assert.equal(evaluated.data.suggestions.length, 3);
    assert.equal(evaluated.data.suggestions.every((suggestion) => suggestion.draftOnly), true);

    const accepted = service.acceptSuggestion(appointment.noteId, 'suggestion-demo-cpt-99214', {}, clinician);
    assert.equal(accepted.data.visitSelections.length, 1);
    assert.equal(accepted.data.visitSelections[0]?.category, 'cpt');
    assert.equal(accepted.data.domainEvents.map((event) => event.eventType).includes('visit_selection.added.v1'), true);
  });

  it('requires override metadata for low-confidence diagnosis suggestions below 75 percent', () => {
    const service = new ScheduleService();
    const appointment = service
      .createAppointment(createRequest, service.createRequestContext({ 'x-aura-role': 'ma' }))
      .data.appointment;
    const clinician = service.createRequestContext({ 'x-aura-role': 'clinician' });
    service.startVisit(appointment.appointmentId, clinician);
    service.evaluateSuggestions(appointment.noteId, clinician);

    assert.throws(
      () => service.acceptSuggestion(appointment.noteId, 'suggestion-demo-icd10-e119', {}, clinician),
      BadRequestException
    );

    const accepted = service.acceptSuggestion(
      appointment.noteId,
      'suggestion-demo-icd10-e119',
      {
        overrideReason: 'Synthetic clinician override',
        supportingEvidence: 'Synthetic supporting evidence',
        nonSupportingEvidence: 'Synthetic missing evidence',
        uncertaintyExplanation: 'Synthetic uncertainty',
        confidenceImprovementPlan: 'Synthetic follow-up plan'
      },
      clinician
    );

    assert.equal(accepted.data.visitSelections[0]?.overrideReason, 'Synthetic clinician override');
  });

  it('creates History Gap blocker tasks and compliance hard blocks finalize preparation', () => {
    const service = new ScheduleService();
    const appointment = service
      .createAppointment(createRequest, service.createRequestContext({ 'x-aura-role': 'ma' }))
      .data.appointment;
    const clinician = service.createRequestContext({ 'x-aura-role': 'clinician' });
    service.startVisit(appointment.appointmentId, clinician);
    service.evaluateSuggestions(appointment.noteId, clinician);

    const taskResponse = service.createHistoryGapTask(
      appointment.noteId,
      'history-gap-demo-001',
      { blocksSigning: true, ownerRole: 'ma' },
      clinician
    );

    assert.equal(taskResponse.data.tasks[0]?.blocksSigning, true);
    assert.equal(taskResponse.data.complianceReview.finalizeDisabled, true);
    assert.equal(taskResponse.data.complianceReview.issues.some((issue) => issue.severity === 'hard_block'), true);
  });

  it('starts WO-006 finalization from a frozen snapshot and requires Step 1 decisions', () => {
    const service = new ScheduleService();
    const appointment = service
      .createAppointment(createRequest, service.createRequestContext({ 'x-aura-role': 'ma' }))
      .data.appointment;
    const clinician = service.createRequestContext({ 'x-aura-role': 'clinician' });
    service.startVisit(appointment.appointmentId, clinician);
    service.addVisitSelection(appointment.noteId, { category: 'cpt', label: 'CPT 99214 candidate', confidence: 0.82 }, clinician);

    const started = service.startFinalization(appointment.noteId, clinician);
    const selectionId = started.data.finalizationSession.frozenSnapshot.visitSelections[0]?.visitSelectionId;

    assert.equal(started.data.finalizationSession.currentStep, 'code_review');
    assert.equal(started.data.finalizationSession.frozenSnapshot.finalPassSuggestions.every((suggestion) => suggestion.confidence > 0.5), true);
    assert.equal(started.data.finalizationSession.frozenSnapshot.transcriptSegmentCount, 0);
    assert.throws(() => service.completeCodeReview(appointment.noteId, clinician), BadRequestException);

    service.decideFinalizationSelection(
      appointment.noteId,
      selectionId ?? 'missing-selection',
      { decision: 'keep' },
      clinician
    );
    const completed = service.completeCodeReview(appointment.noteId, clinician);

    assert.equal(completed.data.finalizationSession.currentStep, 'suggestion_review');
    assert.equal(completed.data.finalizationSession.completedSteps.includes('code_review'), true);
  });

  it('requires Step 2 decisions before compose and moves kept suggestions into Visit Selections', () => {
    const service = new ScheduleService();
    const appointment = service
      .createAppointment(createRequest, service.createRequestContext({ 'x-aura-role': 'ma' }))
      .data.appointment;
    const clinician = service.createRequestContext({ 'x-aura-role': 'clinician' });
    service.startVisit(appointment.appointmentId, clinician);
    service.startFinalization(appointment.noteId, clinician);
    service.completeCodeReview(appointment.noteId, clinician);

    assert.throws(() => service.completeSuggestionReview(appointment.noteId, clinician), BadRequestException);
    service.decideFinalizationSuggestion(
      appointment.noteId,
      'suggestion-demo-cpt-99214',
      { decision: 'keep' },
      clinician
    );
    service.decideFinalizationSuggestion(
      appointment.noteId,
      'suggestion-demo-icd10-e119',
      { decision: 'remove', reason: 'Synthetic unsupported final-pass suggestion' },
      clinician
    );
    service.decideFinalizationSuggestion(
      appointment.noteId,
      'suggestion-demo-quality-bp',
      { decision: 'remove', reason: 'Synthetic defer quality item' },
      clinician
    );
    const completed = service.completeSuggestionReview(appointment.noteId, clinician);

    assert.equal(completed.data.finalizationSession.currentStep, 'compose');
    assert.equal(completed.data.finalizationSession.unusedAuditItems.length, 2);
    assert.equal(service.listVisitSelections(appointment.noteId, clinician).data.selections.some((selection) => selection.category === 'cpt'), true);
  });

  it('composes deterministic draft outputs and requires separate note and summary approvals', () => {
    const service = new ScheduleService();
    const appointment = service
      .createAppointment(createRequest, service.createRequestContext({ 'x-aura-role': 'ma' }))
      .data.appointment;
    const clinician = service.createRequestContext({ 'x-aura-role': 'clinician' });
    service.startVisit(appointment.appointmentId, clinician);
    service.startFinalization(appointment.noteId, clinician);
    service.completeCodeReview(appointment.noteId, clinician);
    for (const suggestionId of ['suggestion-demo-cpt-99214', 'suggestion-demo-icd10-e119', 'suggestion-demo-quality-bp']) {
      service.decideFinalizationSuggestion(
        appointment.noteId,
        suggestionId,
        { decision: 'remove', reason: 'Synthetic final-pass removal' },
        clinician
      );
    }
    service.completeSuggestionReview(appointment.noteId, clinician);

    const composed = service.composeFinalizationDrafts(appointment.noteId, clinician);
    assert.equal(composed.data.finalizationSession.currentStep, 'compare_edit');
    assert.equal(composed.data.finalizationSession.composeOutput?.draftOnly, true);
    assert.equal(composed.data.finalizationSession.composeOutput?.patientSummaryInternalDetailsDetected, false);

    service.updateCompareEditOriginal(
      appointment.noteId,
      { originalNoteText: 'Synthetic edited original source note.' },
      clinician
    );
    assert.throws(
      () =>
        service.approveFinalNote(
          appointment.noteId,
          { approved: true, attestation: 'I reviewed the current synthetic final note.' },
          clinician
        ),
      BadRequestException
    );
    const rebeautified = service.rebeautifyFinalization(appointment.noteId, { reason: 'Synthetic source edit' }, clinician);
    assert.equal(rebeautified.data.finalizationSession.composeOutput?.version, 2);

    const noteApproved = service.approveFinalNote(
      appointment.noteId,
      { approved: true, attestation: 'I reviewed the current synthetic final note.' },
      clinician
    );
    assert.equal(noteApproved.data.finalizationSession.finalNoteApproved, true);
    assert.equal(noteApproved.data.finalizationSession.currentStep, 'compare_edit');

    const summaryApproved = service.approvePatientSummary(
      appointment.noteId,
      { approved: true, attestation: 'I reviewed the current synthetic patient summary.' },
      clinician
    );
    assert.equal(summaryApproved.data.finalizationSession.patientSummaryApproved, true);
    assert.equal(summaryApproved.data.finalizationSession.readyForBillingAttest, true);
    assert.equal(summaryApproved.data.finalizationSession.currentStep, 'billing_attest');
    assert.equal(summaryApproved.data.domainEvents.map((event) => event.eventType).includes('finalization.step_completed.v1'), true);
  });

  it('generates a draft claim preview without submitting a claim', () => {
    const service = new ScheduleService();
    const { appointment, clinician } = completeThroughCompareEdit(service);

    const preview = service.generateDraftClaimPreview(appointment.noteId, clinician);

    assert.equal(preview.data.finalizationSession.draftClaimPreview?.status, 'draft_preview');
    assert.equal(preview.data.finalizationSession.draftClaimPreview?.submittedClaim, false);
    assert.equal(preview.data.finalizationSession.draftClaimPreview?.estimateStatus, 'unavailable_caveated');
    assert.equal(preview.data.domainEvents[0]?.eventType, 'draft_claim_preview.generated.v1');
  });

  it('requires Billing & Attest before moving to Sign & Dispatch', () => {
    const service = new ScheduleService();
    const { appointment, clinician } = completeThroughCompareEdit(service);
    service.generateDraftClaimPreview(appointment.noteId, clinician);

    assert.throws(
      () =>
        service.completeBillingAttest(
          appointment.noteId,
          { acceptedStatements: billingStatements.slice(0, 1), estimateCaveatAcknowledged: true, routeToBillingReview: false },
          clinician
        ),
      BadRequestException
    );

    const attested = service.completeBillingAttest(
      appointment.noteId,
      { acceptedStatements: billingStatements, estimateCaveatAcknowledged: true, routeToBillingReview: false },
      clinician
    );

    assert.equal(attested.data.finalizationSession.billingAttested, true);
    assert.equal(attested.data.finalizationSession.currentStep, 'sign_dispatch');
  });

  it('routes billing review and grants billing staff transcript access only after the trigger', () => {
    const service = new ScheduleService();
    const { appointment, clinician } = completeThroughCompareEdit(service);
    const billingStaff = service.createRequestContext({ 'x-aura-role': 'billing_staff' });

    assert.throws(() => service.getTranscriptByAppointment(appointment.appointmentId, billingStaff), ForbiddenException);

    service.generateDraftClaimPreview(appointment.noteId, clinician);
    service.completeBillingAttest(
      appointment.noteId,
      { acceptedStatements: billingStatements, estimateCaveatAcknowledged: true, routeToBillingReview: true },
      clinician
    );

    const transcript = service.getTranscriptByAppointment(appointment.appointmentId, billingStaff);
    assert.equal(transcript.data.segments.length, 1);
  });

  it('blocks Sign & Dispatch when a blocker task opens after Billing & Attest', () => {
    const service = new ScheduleService();
    const { appointment, clinician } = completeThroughCompareEdit(service);
    service.generateDraftClaimPreview(appointment.noteId, clinician);
    service.completeBillingAttest(
      appointment.noteId,
      { acceptedStatements: billingStatements, estimateCaveatAcknowledged: true, routeToBillingReview: false },
      clinician
    );
    service.createHistoryGapTask(
      appointment.noteId,
      'history-gap-demo-001',
      { blocksSigning: true, ownerRole: 'ma' },
      clinician
    );

    assert.throws(() => service.signAndDispatch(appointment.noteId, clinician), BadRequestException);
  });

  it('signs and dispatches final note and patient summary records when gates pass', () => {
    const service = new ScheduleService();
    const { appointment, clinician } = completeThroughCompareEdit(service);
    service.generateDraftClaimPreview(appointment.noteId, clinician);
    service.completeBillingAttest(
      appointment.noteId,
      { acceptedStatements: billingStatements, estimateCaveatAcknowledged: true, routeToBillingReview: false },
      clinician
    );

    const signed = service.signAndDispatch(appointment.noteId, clinician);

    assert.equal(signed.data.finalizationSession.finalNote?.readOnly, true);
    assert.equal(signed.data.finalizationSession.patientSummary?.internalBillingDetailsExcluded, true);
    assert.equal(signed.data.finalizationSession.signedAndDispatched, true);
    assert.equal(signed.data.domainEvents.map((event) => event.eventType).includes('note.dispatched.v1'), true);
    assert.equal(service.listDraftNotes(clinician).data.notes.length, 0);
    assert.equal(service.getFinalizedNote(appointment.noteId, clinician).data.finalNoteAvailable, true);
  });

  it('blocks copy export and PDF actions before Sign & Dispatch', () => {
    const service = new ScheduleService();
    const { appointment, clinician } = completeThroughCompareEdit(service);

    assert.throws(() => service.generateFinalNotePdf(appointment.noteId, clinician), BadRequestException);
    assert.throws(() => service.copyPatientSummary(appointment.noteId, clinician), BadRequestException);
  });

  it('generates signed final note and patient summary export artifacts', () => {
    const service = new ScheduleService();
    const { appointment, clinician } = completeThroughSignDispatch(service);

    const notePdf = service.generateFinalNotePdf(appointment.noteId, clinician);
    const summaryPdf = service.generatePatientSummaryPdf(appointment.noteId, clinician);
    const copySummary = service.copyPatientSummary(appointment.noteId, clinician);
    const structured = service.exportStructuredFinalNote(appointment.noteId, clinician);

    assert.equal(notePdf.data.artifact.mimeType, 'application/pdf');
    assert.match(notePdf.data.artifact.content, /^%PDF-1\.4 synthetic/);
    assert.equal(summaryPdf.data.artifact.patientSummaryInternalDetailsExcluded, true);
    assert.equal(copySummary.data.artifact.mimeType, 'text/plain');
    assert.equal(structured.data.artifact.mimeType, 'application/json');
    assert.equal(notePdf.data.domainEvents[0]?.eventType, 'export.generated.v1');
    assert.equal(notePdf.data.finalizedNote.exportArtifacts.length, 1);
  });

  it('shows finalized note details and enforces linked-staff visibility', () => {
    const service = new ScheduleService();
    const { appointment, clinician } = completeThroughSignDispatch(service);
    const linkedMa = service.createRequestContext({ 'x-aura-role': 'ma', 'x-aura-linked-patient': 'true' });
    const unlinkedMa = service.createRequestContext({ 'x-aura-role': 'ma', 'x-aura-linked-patient': 'false' });

    const finalized = service.getFinalizedNote(appointment.noteId, linkedMa);

    assert.equal(finalized.data.readOnly, true);
    assert.equal(finalized.data.finalNote?.readOnly, true);
    assert.equal(finalized.data.availableActions.copyPatientSummary, true);
    assert.throws(() => service.getFinalizedNote(appointment.noteId, unlinkedMa), ForbiddenException);
    assert.equal(service.listFinalizedNotes(clinician).data.notes[0]?.writebackStatus, 'not_configured');
  });

  it('records EHR writeback disabled, queued, and failure states without marking writeback complete', () => {
    const service = new ScheduleService();
    const { appointment, clinician } = completeThroughSignDispatch(service);

    const notConfigured = service.requestEhrWriteback(
      appointment.noteId,
      { target: 'final_note', humanApproved: true, scaffoldMode: 'not_configured' },
      clinician
    );
    const queued = service.requestEhrWriteback(
      appointment.noteId,
      { target: 'both', humanApproved: true, scaffoldMode: 'mock_queue' },
      clinician
    );
    const failed = service.requestEhrWriteback(
      appointment.noteId,
      { target: 'final_note', humanApproved: true, scaffoldMode: 'simulate_failure' },
      clinician
    );

    assert.equal(notConfigured.data.writeback.status, 'not_configured');
    assert.equal(queued.data.writeback.status, 'queued');
    assert.equal(queued.data.domainEvents[0]?.eventType, 'ehr_writeback.queued.v1');
    assert.equal(failed.data.writeback.status, 'failed');
    assert.equal(failed.data.writeback.retryable, true);
    assert.equal(failed.data.writeback.externalJobId, undefined);
  });
});

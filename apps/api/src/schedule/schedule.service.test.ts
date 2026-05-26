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
});

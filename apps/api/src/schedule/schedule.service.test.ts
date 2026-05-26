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
    assert.equal(started.data.domainEvents[0]?.eventType, 'visit.started.v1');
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
});

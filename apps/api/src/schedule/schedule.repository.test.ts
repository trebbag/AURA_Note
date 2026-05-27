import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createAppointmentLifecycle } from '@aura-note/domain';
import {
  createInMemoryScheduleStateRepository,
  type StoredAppointment
} from './schedule.repository';

function createStoredAppointment(appointmentId: string, noteId: string): StoredAppointment {
  const lifecycle = createAppointmentLifecycle(appointmentId, noteId, {
    tenantId: 'tenant-synthetic-primary',
    siteId: 'site-synthetic-primary',
    safePatientId: 'safe-patient-synthetic',
    clinicianId: 'clinician-synthetic-001',
    visitType: 'Primary care follow-up',
    startsAt: '2026-05-27T14:00:00.000Z',
    durationMinutes: 30,
    modality: 'in_person',
    source: 'standalone'
  });

  return {
    appointment: {
      appointmentId,
      tenantId: 'tenant-synthetic-primary',
      siteId: 'site-synthetic-primary',
      safePatientId: 'safe-patient-synthetic',
      clinicianId: 'clinician-synthetic-001',
      noteId,
      state: lifecycle.appointmentState,
      startsAt: '2026-05-27T14:00:00.000Z',
      durationMinutes: 30,
      visitType: 'Primary care follow-up',
      modality: 'in_person',
      source: 'standalone',
      mode: 'standalone'
    },
    note: {
      noteId,
      appointmentId,
      tenantId: 'tenant-synthetic-primary',
      siteId: 'site-synthetic-primary',
      safePatientId: 'safe-patient-synthetic',
      clinicianId: 'clinician-synthetic-001',
      state: lifecycle.noteState,
      mode: 'standalone'
    },
    lifecycle
  };
}

describe('InMemoryScheduleStateRepository', () => {
  it('persists one appointment-to-one note shell lookup in both directions', () => {
    const repository = createInMemoryScheduleStateRepository();
    const stored = createStoredAppointment('appt-repository-001', 'note-repository-001');

    repository.saveAppointment(stored);

    assert.equal(repository.listAppointments().length, 1);
    assert.equal(repository.getAppointment('appt-repository-001')?.note.noteId, 'note-repository-001');
    assert.equal(repository.getByNoteId('note-repository-001')?.appointment.appointmentId, 'appt-repository-001');
    assert.equal(repository.hasNoteForAppointment('appt-repository-001'), true);
  });

  it('blocks remapping one appointment to a different note', () => {
    const repository = createInMemoryScheduleStateRepository();
    repository.saveAppointment(createStoredAppointment('appt-repository-001', 'note-repository-001'));

    assert.throws(
      () => repository.saveAppointment(createStoredAppointment('appt-repository-001', 'note-repository-002')),
      /appointment-to-multiple-note/
    );
  });

  it('blocks remapping one idempotency key to a different appointment', () => {
    const repository = createInMemoryScheduleStateRepository();
    repository.saveIdempotencyKey('idem-repository-001', 'appt-repository-001');

    assert.equal(repository.getIdempotentAppointmentId('idem-repository-001'), 'appt-repository-001');
    assert.throws(
      () => repository.saveIdempotencyKey('idem-repository-001', 'appt-repository-002'),
      /idempotency key remapping/
    );
  });
});

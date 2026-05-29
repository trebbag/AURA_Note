import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createAppointmentLifecycle } from '@aura-note/domain';
import {
  createInMemoryScheduleStateRepository,
  resolveScheduleRuntimePersistencePlan,
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
  const patient = {
    patientId: 'patient-repository-001',
    tenantId: 'tenant-synthetic-primary',
    siteId: 'site-synthetic-primary',
    safePatientId: 'safe-patient-synthetic',
    status: 'active' as const,
    displayLabel: 'Standalone safe-patient-synthetic',
    createdAt: '2026-05-27T14:00:00.000Z',
    updatedAt: '2026-05-27T14:00:00.000Z',
    mode: 'standalone' as const
  };
  const chartContextSnapshot = {
    chartContextSnapshotId: `chart-context-${appointmentId}`,
    tenantId: 'tenant-synthetic-primary',
    siteId: 'site-synthetic-primary',
    safePatientId: 'safe-patient-synthetic',
    appointmentId,
    noteId,
    sourceSystem: 'standalone_local' as const,
    sourceFreshness: 'recent' as const,
    staleWarning: false,
    slices: [],
    warnings: ['Synthetic standalone chart context only; live EHR completeness is not implied.'],
    aiPackagingAllowed: false as const,
    productionPhiStorageApproved: false as const,
    createdAt: '2026-05-27T14:00:00.000Z',
    mode: 'standalone' as const
  };

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
    patient,
    linkages: [
      {
        patientLinkageId: 'linkage-repository-001',
        tenantId: 'tenant-synthetic-primary',
        siteId: 'site-synthetic-primary',
        safePatientId: 'safe-patient-synthetic',
        appointmentId,
        noteId,
        linkedObjectType: 'appointment',
        linkedObjectId: appointmentId,
        purpose: 'treatment',
        active: true,
        createdAt: '2026-05-27T14:00:00.000Z'
      }
    ],
    chartContextSnapshot,
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
    assert.equal(repository.getPatient('safe-patient-synthetic')?.status, 'active');
    assert.equal(repository.getChartContext('safe-patient-synthetic', 'appt-repository-001')?.sourceSystem, 'standalone_local');
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

  it('resolves explicit runtime persistence modes without production PHI approval', () => {
    assert.deepEqual(resolveScheduleRuntimePersistencePlan({ AURA_NOTE_RUNTIME_PERSISTENCE: 'test_memory' }), {
      mode: 'test_memory',
      localPrismaRuntimeEnabled: false,
      inMemoryAdapterExplicit: true,
      productionPhiStorageApproved: false,
      reason: 'Explicit in-memory test adapter selected.'
    });

    assert.deepEqual(
      resolveScheduleRuntimePersistencePlan({
        AURA_NOTE_RUNTIME_PERSISTENCE: 'prisma_local',
        DATABASE_URL: 'postgresql://aura_note:aura_note@localhost:5432/aura_note_dev'
      }),
      {
        mode: 'prisma_local',
        localPrismaRuntimeEnabled: true,
        inMemoryAdapterExplicit: false,
        productionPhiStorageApproved: false,
        reason: 'Local Prisma/PostgreSQL runtime adapter selected for synthetic persistence evidence.'
      }
    );

    assert.throws(
      () =>
        resolveScheduleRuntimePersistencePlan({
          AURA_NOTE_RUNTIME_PERSISTENCE: 'prisma_local',
          DATABASE_URL: 'postgresql://aura_note:secret@prod.example.com:5432/aura_note'
        }),
      /local PostgreSQL/
    );
  });
});

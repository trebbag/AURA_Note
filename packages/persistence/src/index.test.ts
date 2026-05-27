import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AppointmentDto, NoteDto } from '@aura-note/contracts';
import {
  mapAppointmentNoteToPrismaProjection,
  resolvePersistenceAdapterPlan
} from './index';

const appointment: AppointmentDto = {
  appointmentId: 'appt-persistence-001',
  tenantId: 'tenant-synthetic-primary',
  siteId: 'site-synthetic-primary',
  safePatientId: 'safe-patient-synthetic-001',
  clinicianId: 'clinician-synthetic-001',
  noteId: 'note-persistence-001',
  state: 'scheduled',
  startsAt: '2026-05-27T15:00:00.000Z',
  durationMinutes: 30,
  visitType: 'Primary care follow-up',
  modality: 'in_person',
  source: 'standalone',
  reasonForVisit: 'Synthetic persistence readiness visit',
  mode: 'standalone'
};

const note: NoteDto = {
  noteId: 'note-persistence-001',
  appointmentId: 'appt-persistence-001',
  tenantId: 'tenant-synthetic-primary',
  siteId: 'site-synthetic-primary',
  safePatientId: 'safe-patient-synthetic-001',
  clinicianId: 'clinician-synthetic-001',
  state: 'shell_created',
  mode: 'standalone'
};

describe('persistence adapter plan', () => {
  it('keeps the in-memory adapter enabled as the local synthetic runtime', () => {
    const plan = resolvePersistenceAdapterPlan();

    assert.equal(plan.selectedAdapter, 'in_memory');
    assert.equal(plan.runtimeEnabled, true);
    assert.equal(plan.liveDatabaseConnectionAllowed, false);
    assert.equal(plan.storesProductionPhi, false);
  });

  it('keeps the Prisma adapter disabled without local database and integration evidence', () => {
    const plan = resolvePersistenceAdapterPlan({ requestedAdapter: 'prisma' });

    assert.equal(plan.selectedAdapter, 'prisma');
    assert.equal(plan.runtimeEnabled, false);
    assert.equal(plan.readiness, 'blocked_missing_database_url');
    assert.equal(plan.requiredEvidence.includes('rollback evidence'), true);
  });

  it('blocks production PHI persistence even when Prisma is requested', () => {
    const plan = resolvePersistenceAdapterPlan({
      requestedAdapter: 'prisma',
      databaseUrl: 'postgresql://aura_note:aura_note@localhost:5432/aura_note_dev',
      productionPhiPersistenceApproved: true
    });

    assert.equal(plan.runtimeEnabled, false);
    assert.equal(plan.readiness, 'blocked_production_phi_review');
  });
});

describe('appointment-note Prisma projection', () => {
  it('projects schedule and note DTOs into synthetic row shapes without live database access', () => {
    const projection = mapAppointmentNoteToPrismaProjection({
      appointment,
      note,
      generatedAt: '2026-05-27T15:30:00.000Z'
    });

    assert.equal(projection.adapterKind, 'prisma');
    assert.equal(projection.syntheticOnly, true);
    assert.equal(projection.liveDatabaseConnectionAllowed, false);
    assert.deepEqual(
      projection.rows.map((row) => row.table),
      ['Tenant', 'Site', 'Patient', 'Appointment', 'Note']
    );
    assert.equal(projection.rows.find((row) => row.table === 'Note')?.data.appointmentId, 'appt-persistence-001');
  });

  it('rejects appointment and note mappings that do not preserve one-to-one identity', () => {
    assert.throws(
      () =>
        mapAppointmentNoteToPrismaProjection({
          appointment,
          note: { ...note, appointmentId: 'appt-persistence-other' },
          generatedAt: '2026-05-27T15:30:00.000Z'
        }),
      /one appointment to one note/
    );
  });

  it('rejects forbidden PHI key material before projection', () => {
    const unsafeAppointment = {
      ...appointment,
      externalPatientId: 'unsafe-production-identifier'
    } as AppointmentDto & { externalPatientId: string };

    assert.throws(
      () =>
        mapAppointmentNoteToPrismaProjection({
          appointment: unsafeAppointment,
          note,
          generatedAt: '2026-05-27T15:30:00.000Z'
        }),
      /forbidden PHI keys/
    );
  });
});

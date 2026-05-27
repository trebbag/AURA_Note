import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { AppointmentDto, NoteDto } from '@aura-note/contracts';
import {
  mapAppointmentNoteToPrismaProjection,
  resolvePersistenceAdapterPlan,
  toDeterministicPersistenceUuid
} from './index';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

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

  it('keeps the Prisma adapter disabled without a local database URL', () => {
    const plan = resolvePersistenceAdapterPlan({ requestedAdapter: 'prisma' });

    assert.equal(plan.selectedAdapter, 'prisma');
    assert.equal(plan.runtimeEnabled, false);
    assert.equal(plan.readiness, 'blocked_missing_database_url');
    assert.equal(plan.requiredEvidence.includes('rollback evidence'), true);
  });

  it('enables the Prisma schedule adapter only for the synthetic local database', () => {
    const plan = resolvePersistenceAdapterPlan({
      requestedAdapter: 'prisma',
      databaseUrl: 'postgresql://aura_note:aura_note@localhost:5432/aura_note_dev'
    });

    assert.equal(plan.runtimeEnabled, true);
    assert.equal(plan.liveDatabaseConnectionAllowed, true);
    assert.equal(plan.readiness, 'enabled_local_synthetic_prisma_schedule_adapter');
  });

  it('blocks non-local Prisma database URLs', () => {
    const plan = resolvePersistenceAdapterPlan({
      requestedAdapter: 'prisma',
      databaseUrl: 'postgresql://aura_note:unsafe@example.invalid:5432/aura_note_dev'
    });

    assert.equal(plan.runtimeEnabled, false);
    assert.equal(plan.liveDatabaseConnectionAllowed, false);
    assert.equal(plan.readiness, 'blocked_non_local_database_url');
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
    assert.equal(projection.identifierStrategy, 'deterministic_uuid_scaffold');
    assert.deepEqual(
      projection.rows.map((row) => row.table),
      ['Tenant', 'Site', 'User', 'Patient', 'Appointment', 'Note']
    );
    assert.match(String(projection.rows.find((row) => row.table === 'Tenant')?.data.id), uuidPattern);
    assert.match(String(projection.rows.find((row) => row.table === 'Appointment')?.data.patientId), uuidPattern);
    assert.equal(
      projection.rows.find((row) => row.table === 'Appointment')?.data.patientId,
      projection.rows.find((row) => row.table === 'Patient')?.data.id
    );
    assert.equal(projection.rows.find((row) => row.table === 'Appointment')?.data.sourceRef, appointment.appointmentId);
    assert.equal(
      projection.rows.find((row) => row.table === 'Note')?.data.appointmentId,
      projection.rows.find((row) => row.table === 'Appointment')?.data.id
    );
    assert.equal(projection.rows.find((row) => row.table === 'Note')?.data.sourceRef, note.noteId);
  });

  it('creates stable UUID-shaped identifiers for the same synthetic natural keys', () => {
    const first = toDeterministicPersistenceUuid('appointment', appointment.tenantId, appointment.appointmentId);
    const second = toDeterministicPersistenceUuid('appointment', appointment.tenantId, appointment.appointmentId);
    const other = toDeterministicPersistenceUuid('appointment', appointment.tenantId, 'appt-persistence-other');

    assert.match(first, uuidPattern);
    assert.equal(first, second);
    assert.notEqual(first, other);
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

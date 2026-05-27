import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { createAppointmentLifecycle } from '@aura-note/domain';
import type { StoredAppointment } from './schedule.repository';
import { createPrismaScheduleStateRepository, type AsyncScheduleStateRepository } from './prisma-schedule.repository';

const repoRoot = path.resolve(__dirname, '../../../..');
const schemaPath = path.join(repoRoot, 'packages/contracts/prisma/schema.prisma');
const databaseUrl = 'postgresql://aura_note:aura_note@localhost:5432/aura_note_dev';
const tenantId = 'tenant-synthetic-primary';

function run(command: string, args: string[]): void {
  execFileSync(command, args, {
    cwd: repoRoot,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl
    },
    stdio: 'pipe'
  });
}

function capture(command: string, args: string[]): string {
  return execFileSync(command, args, {
    cwd: repoRoot,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

async function waitForPostgres(): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 30_000) {
    try {
      const status = capture('docker', ['compose', 'ps', '--format', 'json', 'postgres']);
      if (status.includes('"Health":"healthy"') || status.includes('"State":"running"')) {
        return;
      }
    } catch {
      // The compose service can briefly be unavailable while Docker creates it.
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error('local PostgreSQL service did not become healthy');
}

function applySchema(): void {
  const tmp = mkdtempSync(path.join(tmpdir(), 'aura-note-prisma-schedule-'));
  const forwardSqlPath = path.join(tmp, 'forward.sql');

  try {
    const forwardSql = capture('pnpm', [
      'exec',
      'prisma',
      'migrate',
      'diff',
      '--from-empty',
      '--to-schema-datamodel',
      schemaPath,
      '--script'
    ]);
    writeFileSync(forwardSqlPath, forwardSql, 'utf8');
    run('pnpm', ['exec', 'prisma', 'db', 'execute', '--url', databaseUrl, '--file', forwardSqlPath]);
  } finally {
    rmSync(tmp, { force: true, recursive: true });
  }
}

function createStoredAppointment(appointmentId: string, noteId: string): StoredAppointment {
  const lifecycle = createAppointmentLifecycle(appointmentId, noteId, {
    tenantId,
    siteId: 'site-synthetic-primary',
    safePatientId: 'safe-patient-synthetic-prisma-001',
    clinicianId: 'clinician-synthetic-prisma-001',
    visitType: 'Primary care follow-up',
    startsAt: '2026-05-27T15:00:00.000Z',
    durationMinutes: 30,
    modality: 'in_person',
    source: 'standalone',
    reasonForVisit: 'Synthetic Prisma adapter appointment'
  });

  return {
    appointment: {
      appointmentId,
      tenantId,
      siteId: 'site-synthetic-primary',
      safePatientId: 'safe-patient-synthetic-prisma-001',
      clinicianId: 'clinician-synthetic-prisma-001',
      noteId,
      state: lifecycle.appointmentState,
      startsAt: '2026-05-27T15:00:00.000Z',
      durationMinutes: 30,
      visitType: 'Primary care follow-up',
      modality: 'in_person',
      source: 'standalone',
      reasonForVisit: 'Synthetic Prisma adapter appointment',
      mode: 'standalone'
    },
    note: {
      noteId,
      appointmentId,
      tenantId,
      siteId: 'site-synthetic-primary',
      safePatientId: 'safe-patient-synthetic-prisma-001',
      clinicianId: 'clinician-synthetic-prisma-001',
      state: lifecycle.noteState,
      mode: 'standalone'
    },
    lifecycle
  };
}

describe('PrismaScheduleStateRepository', () => {
  let prisma: PrismaClient | undefined;
  let repository: AsyncScheduleStateRepository | undefined;

  before(async () => {
    run('docker', ['compose', 'down', '--volumes', '--remove-orphans']);
    run('docker', ['compose', 'up', '--detach', 'postgres']);
    await waitForPostgres();
    applySchema();
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: databaseUrl
        }
      }
    });
    repository = createPrismaScheduleStateRepository(prisma, { tenantId });
  });

  after(async () => {
    await prisma?.$disconnect();
    run('docker', ['compose', 'down', '--volumes', '--remove-orphans']);
  });

  it('persists and reloads one appointment-to-one note shell through PostgreSQL', async () => {
    const activeRepository = requireRepository(repository);
    await activeRepository.saveAppointment(createStoredAppointment('appt-prisma-001', 'note-prisma-001'));

    const listed = await activeRepository.listAppointments();
    const byAppointment = await activeRepository.getAppointment('appt-prisma-001');
    const byNote = await activeRepository.getByNoteId('note-prisma-001');

    assert.equal(listed.length, 1);
    assert.equal(byAppointment?.note.noteId, 'note-prisma-001');
    assert.equal(byAppointment?.appointment.reasonForVisit, 'Synthetic Prisma adapter appointment');
    assert.equal(byNote?.appointment.appointmentId, 'appt-prisma-001');
    assert.equal(await activeRepository.hasNoteForAppointment('appt-prisma-001'), true);
  });

  it('blocks appointment and note remapping through durable constraints and preflight checks', async () => {
    const activeRepository = requireRepository(repository);
    await activeRepository.saveAppointment(createStoredAppointment('appt-prisma-002', 'note-prisma-002'));

    await assert.rejects(
      () => activeRepository.saveAppointment(createStoredAppointment('appt-prisma-002', 'note-prisma-other')),
      /appointment-to-multiple-note/
    );
    await assert.rejects(
      () => activeRepository.saveAppointment(createStoredAppointment('appt-prisma-other', 'note-prisma-002')),
      /note-to-multiple-appointment/
    );
  });

  it('persists idempotency replay keys without allowing remaps', async () => {
    const activeRepository = requireRepository(repository);
    await activeRepository.saveAppointment(createStoredAppointment('appt-prisma-003', 'note-prisma-003'));
    await activeRepository.saveIdempotencyKey('idem-prisma-003', 'appt-prisma-003');

    assert.equal(await activeRepository.getIdempotentAppointmentId('idem-prisma-003'), 'appt-prisma-003');
    await assert.rejects(
      () => activeRepository.saveIdempotencyKey('idem-prisma-003', 'appt-prisma-001'),
      /idempotency key remapping/
    );
  });
});

function requireRepository(repository: AsyncScheduleStateRepository | undefined): AsyncScheduleStateRepository {
  if (!repository) {
    throw new Error('Prisma schedule repository was not initialized');
  }
  return repository;
}

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { PrismaClient } from '@prisma/client';
import {
  approveRecordingException,
  createAppointmentLifecycle,
  createRawAudioRetentionMetadata,
  createTranscriptRetentionMetadata,
  pauseVisitGate,
  resumeVisitGate,
  startVisitLifecycle,
  stopVisitGate
} from '@aura-note/domain';
import { toDeterministicPersistenceUuid } from '@aura-note/persistence';
import type { AccessContext } from '@aura-note/security';
import { createStandalonePatientScheduleScaffold, type StoredAppointment } from './schedule.repository';
import { createPrismaScheduleStateRepository, type AsyncScheduleStateRepository } from './prisma-schedule.repository';
import {
  createPrismaVisitCaptureRepository,
  getPersistedVisitCaptureForAccessContext,
  type AsyncVisitCaptureRepository
} from './prisma-visit-capture.repository';

const repoRoot = path.resolve(__dirname, '../../../..');
const schemaPath = path.join(repoRoot, 'packages/contracts/prisma/schema.prisma');
const coreRlsPath = path.join(repoRoot, 'packages/contracts/prisma/rls-core-schedule.sql');
const visitRlsPath = path.join(repoRoot, 'packages/contracts/prisma/rls-visit-capture.sql');
const databaseUrl = 'postgresql://aura_note:aura_note@localhost:5432/aura_note_dev';
const rlsAppDatabaseUrl = 'postgresql://aura_note_rls_app:aura_note_rls_app@localhost:5432/aura_note_dev';
const tenantA = 'tenant-synthetic-primary';
const tenantB = 'tenant-synthetic-secondary';
const sitePrimary = 'site-synthetic-primary';
const siteSecondary = 'site-synthetic-secondary';

function run(command: string, args: string[]): void {
  execFileSync(command, args, {
    cwd: repoRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe'
  });
}

function capture(command: string, args: string[]): string {
  return execFileSync(command, args, {
    cwd: repoRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

async function waitForPostgres(): Promise<void> {
  const startedAt = Date.now();
  let lastError = '';
  while (Date.now() - startedAt < 30_000) {
    try {
      capture('docker', ['compose', 'exec', '-T', 'postgres', 'pg_isready', '-U', 'aura_note', '-d', 'aura_note_dev']);
      return;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`local PostgreSQL service did not become healthy: ${lastError}`);
}

function applySchema(): void {
  const tmp = mkdtempSync(path.join(tmpdir(), 'aura-note-visit-capture-'));
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

function applyRls(): void {
  run('pnpm', ['exec', 'prisma', 'db', 'execute', '--url', databaseUrl, '--file', coreRlsPath]);
  run('pnpm', ['exec', 'prisma', 'db', 'execute', '--url', databaseUrl, '--file', visitRlsPath]);
}

function createStoredAppointment(
  tenantId: string,
  siteId: string,
  appointmentId: string,
  noteId: string
): StoredAppointment {
  const lifecycle = createAppointmentLifecycle(appointmentId, noteId, {
    tenantId,
    siteId,
    safePatientId: `safe-patient-${tenantId}-${siteId}`,
    clinicianId: `clinician-${tenantId}-${siteId}`,
    visitType: 'Primary care follow-up',
    startsAt: '2026-05-27T15:00:00.000Z',
    durationMinutes: 30,
    modality: 'in_person',
    source: 'standalone',
    reasonForVisit: 'Synthetic durable visit capture'
  });

  const appointment: StoredAppointment['appointment'] = {
      appointmentId,
      tenantId,
      siteId,
      safePatientId: `safe-patient-${tenantId}-${siteId}`,
      clinicianId: `clinician-${tenantId}-${siteId}`,
      noteId,
      state: lifecycle.appointmentState,
      startsAt: '2026-05-27T15:00:00.000Z',
      durationMinutes: 30,
      visitType: 'Primary care follow-up',
      modality: 'in_person',
      source: 'standalone',
      reasonForVisit: 'Synthetic durable visit capture',
      mode: 'standalone'
  };
  const note: StoredAppointment['note'] = {
      noteId,
      appointmentId,
      tenantId,
      siteId,
      safePatientId: `safe-patient-${tenantId}-${siteId}`,
      clinicianId: `clinician-${tenantId}-${siteId}`,
      state: lifecycle.noteState,
      mode: 'standalone'
  };

  return {
    appointment,
    note,
    ...createStandalonePatientScheduleScaffold(appointment, note),
    lifecycle
  };
}

function startVisitCapture(entry: StoredAppointment): StoredAppointment {
  const startedAt = '2026-05-27T15:02:00.000Z';
  const lifecycle = startVisitLifecycle(entry.lifecycle);
  const transcriptRetention = createTranscriptRetentionMetadata(`transcript-${entry.note.noteId}`, entry.note.noteId);

  return {
    ...entry,
    lifecycle,
    appointment: { ...entry.appointment, state: lifecycle.appointmentState },
    note: { ...entry.note, state: lifecycle.noteState },
    visitSession: {
      visitSessionId: `visit-session-${entry.note.noteId}`,
      noteId: entry.note.noteId,
      timerState: 'running',
      recordingState: 'recording',
      editorUnlocked: true,
      startedAt,
      elapsedSeconds: 0
    },
    rawAudioRetention: createRawAudioRetentionMetadata(`recording-${entry.note.noteId}`, entry.note.noteId, startedAt),
    transcript: {
      noteId: entry.note.noteId,
      transcriptId: transcriptRetention.transcriptId,
      retentionPolicy: transcriptRetention.retentionPolicy,
      segments: []
    }
  };
}

function appendSyntheticSegment(entry: StoredAppointment, text = 'Synthetic mock transcript segment'): StoredAppointment {
  if (!entry.transcript) {
    throw new Error('test requires transcript before appending a segment');
  }

  return {
    ...entry,
    transcript: {
      ...entry.transcript,
      segments: [
        ...entry.transcript.segments,
        {
          transcriptSegmentId: `segment-${entry.note.noteId}-${entry.transcript.segments.length + 1}`,
          noteId: entry.note.noteId,
          sequence: entry.transcript.segments.length + 1,
          speakerRole: 'clinician',
          text,
          source: 'mock_transcription',
          createdAt: '2026-05-27T15:03:00.000Z'
        }
      ]
    }
  };
}

function approveExceptionCapture(entry: StoredAppointment): StoredAppointment {
  const baseGate = {
    visitSessionId: `visit-session-${entry.note.noteId}`,
    noteId: entry.note.noteId,
    timerState: 'not_started' as const,
    recordingState: 'not_started' as const,
    editorUnlocked: false,
    startedAt: '2026-05-27T15:02:00.000Z',
    elapsedSeconds: 0
  };
  const updated = approveRecordingException(baseGate, 'Synthetic approved exception for unavailable recording device.');
  const transcriptRetention = createTranscriptRetentionMetadata(`transcript-${entry.note.noteId}`, entry.note.noteId);

  return {
    ...entry,
    appointment: { ...entry.appointment, state: 'visit_started' },
    note: { ...entry.note, state: 'visit_active' },
    lifecycle: {
      ...entry.lifecycle,
      appointmentState: 'visit_started',
      noteState: 'visit_active',
      noteVisibleInDrafts: true
    },
    visitSession: { ...baseGate, ...updated },
    transcript: {
      noteId: entry.note.noteId,
      transcriptId: transcriptRetention.transcriptId,
      retentionPolicy: transcriptRetention.retentionPolicy,
      segments: []
    }
  };
}

function accessContext(tenantId: string, siteId: string): AccessContext {
  return {
    role: 'clinician',
    tenantId,
    siteId,
    actorUserId: `user-${tenantId}-${siteId}`,
    linkedToPatient: true,
    linkedToVisit: true,
    treatingClinician: true,
    billingReviewTriggered: false,
    authorizedAdmin: false
  };
}

describe('Prisma visit capture runtime persistence', () => {
  let prisma: PrismaClient | undefined;
  let scheduleA: AsyncScheduleStateRepository | undefined;
  let scheduleB: AsyncScheduleStateRepository | undefined;
  let captureA: AsyncVisitCaptureRepository | undefined;
  let captureB: AsyncVisitCaptureRepository | undefined;
  let captureASecondarySite: AsyncVisitCaptureRepository | undefined;

  before(async () => {
    run('docker', ['compose', 'down', '--volumes', '--remove-orphans']);
    run('docker', ['compose', 'up', '--detach', 'postgres']);
    await waitForPostgres();
    applySchema();
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    scheduleA = createPrismaScheduleStateRepository(prisma, { tenantId: tenantA, siteId: sitePrimary });
    scheduleB = createPrismaScheduleStateRepository(prisma, { tenantId: tenantB, siteId: sitePrimary });
    captureA = createPrismaVisitCaptureRepository(prisma, { tenantId: tenantA, siteId: sitePrimary });
    captureB = createPrismaVisitCaptureRepository(prisma, { tenantId: tenantB, siteId: sitePrimary });
    captureASecondarySite = createPrismaVisitCaptureRepository(prisma, { tenantId: tenantA, siteId: siteSecondary });
  });

  after(async () => {
    await prisma?.$disconnect();
    run('docker', ['compose', 'down', '--volumes', '--remove-orphans']);
  });

  it('persists and reloads start, pause, resume, stop, raw-audio metadata, and transcript segments', async () => {
    const scheduleRepo = requireSchedule(scheduleA);
    const captureRepo = requireCapture(captureA);
    const appointment = createStoredAppointment(tenantA, sitePrimary, 'appt-capture-001', 'note-capture-001');

    await scheduleRepo.saveAppointment(appointment);
    let captureEntry = appendSyntheticSegment(startVisitCapture(appointment));
    await captureRepo.saveVisitCapture(captureEntry);

    const started = await captureRepo.getByAppointmentId('appt-capture-001');
    assert.equal(started?.visitSession.timerState, 'running');
    assert.equal(started?.visitSession.recordingState, 'recording');
    assert.equal(started?.rawAudioRetention?.retentionClass, 'audio_ephemeral');
    assert.equal(started?.transcript?.retentionPolicy, 'indefinite');
    assert.equal(started?.transcript?.segments.length, 1);

    const paused = pauseVisitGate(captureEntry.visitSession!);
    captureEntry = {
      ...captureEntry,
      visitSession: { ...captureEntry.visitSession!, ...paused, pausedAt: '2026-05-27T15:04:00.000Z' },
      appointment: { ...captureEntry.appointment, state: 'visit_paused' },
      note: { ...captureEntry.note, state: 'visit_paused' }
    };
    await captureRepo.saveVisitCapture(captureEntry);
    assert.equal((await captureRepo.getByNoteId('note-capture-001'))?.visitSession.timerState, 'paused');

    const resumed = resumeVisitGate(captureEntry.visitSession!);
    const { pausedAt: _pausedAt, ...sessionWithoutPausedAt } = captureEntry.visitSession!;
    captureEntry = {
      ...captureEntry,
      visitSession: { ...sessionWithoutPausedAt, ...resumed },
      appointment: { ...captureEntry.appointment, state: 'visit_started' },
      note: { ...captureEntry.note, state: 'visit_active' }
    };
    await captureRepo.saveVisitCapture(captureEntry);
    assert.equal((await captureRepo.getByAppointmentId('appt-capture-001'))?.visitSession.editorUnlocked, true);

    const stopped = stopVisitGate(captureEntry.visitSession!);
    captureEntry = {
      ...captureEntry,
      visitSession: { ...captureEntry.visitSession!, ...stopped, stoppedAt: '2026-05-27T15:20:00.000Z' },
      appointment: { ...captureEntry.appointment, state: 'visit_completed' },
      note: { ...captureEntry.note, state: 'documentation_in_progress' }
    };
    await captureRepo.saveVisitCapture(captureEntry);
    assert.equal((await captureRepo.getByAppointmentId('appt-capture-001'))?.visitSession.timerState, 'stopped');
  });

  it('persists an approved recording exception without creating normal raw-audio metadata', async () => {
    const scheduleRepo = requireSchedule(scheduleA);
    const captureRepo = requireCapture(captureA);
    const appointment = createStoredAppointment(tenantA, sitePrimary, 'appt-capture-exception', 'note-capture-exception');

    await scheduleRepo.saveAppointment(appointment);
    await captureRepo.saveVisitCapture(approveExceptionCapture(appointment));

    const reloaded = await captureRepo.getByAppointmentId('appt-capture-exception');
    assert.equal(reloaded?.visitSession.recordingState, 'exception_approved');
    assert.equal(reloaded?.visitSession.editorUnlocked, true);
    assert.equal(reloaded?.rawAudioRetention, undefined);
    assert.equal(reloaded?.transcript?.retentionPolicy, 'indefinite');
  });

  it('denies cross-tenant and cross-site repository/API-harness reads before DTO exposure', async () => {
    const scheduleRepoA = requireSchedule(scheduleA);
    const scheduleRepoB = requireSchedule(scheduleB);
    const captureRepoA = requireCapture(captureA);
    const captureRepoB = requireCapture(captureB);
    const wrongSiteCapture = requireCapture(captureASecondarySite);
    const appointmentA = createStoredAppointment(tenantA, sitePrimary, 'appt-capture-shared', 'note-capture-shared');
    const appointmentB = createStoredAppointment(tenantB, sitePrimary, 'appt-capture-shared', 'note-capture-shared');

    await scheduleRepoA.saveAppointment(appointmentA);
    await scheduleRepoB.saveAppointment(appointmentB);
    await captureRepoA.saveVisitCapture(startVisitCapture(appointmentA));
    await captureRepoB.saveVisitCapture(startVisitCapture(appointmentB));

    assert.equal((await captureRepoA.getByAppointmentId('appt-capture-shared'))?.noteId, 'note-capture-shared');
    assert.equal((await captureRepoB.getByAppointmentId('appt-capture-shared'))?.noteId, 'note-capture-shared');
    assert.equal(await wrongSiteCapture.getByAppointmentId('appt-capture-shared'), undefined);

    const activePrisma = requirePrisma(prisma);
    const allowed = await getPersistedVisitCaptureForAccessContext(
      activePrisma,
      accessContext(tenantA, sitePrimary),
      'appt-capture-shared'
    );
    const wrongTenant = await getPersistedVisitCaptureForAccessContext(
      activePrisma,
      accessContext(tenantB, siteSecondary),
      'appt-capture-shared'
    );
    const wrongSite = await getPersistedVisitCaptureForAccessContext(
      activePrisma,
      accessContext(tenantA, siteSecondary),
      'appt-capture-shared'
    );

    assert.equal(allowed?.visitSession.recordingState, 'recording');
    assert.equal(wrongTenant, undefined);
    assert.equal(wrongSite, undefined);
  });

  it('blocks transcript segment sequence remapping in a transaction-safe error path', async () => {
    const captureRepo = requireCapture(captureA);
    const appointment = createStoredAppointment(tenantA, sitePrimary, 'appt-capture-remap', 'note-capture-remap');

    await requireSchedule(scheduleA).saveAppointment(appointment);
    const captureEntry = appendSyntheticSegment(startVisitCapture(appointment), 'Original synthetic segment');
    await captureRepo.saveVisitCapture(captureEntry);

    await assert.rejects(
      () => captureRepo.saveVisitCapture(appendSyntheticSegment(startVisitCapture(appointment), 'Changed synthetic segment')),
      /transcript segment sequence remapping/
    );
    assert.equal((await captureRepo.getByAppointmentId('appt-capture-remap'))?.transcript?.segments[0]?.text, 'Original synthetic segment');
  });

  it('enforces visit capture PostgreSQL RLS read, insert, and update policies', async () => {
    const activePrisma = requirePrisma(prisma);
    applyRls();
    await createRlsAppRole(activePrisma);
    const rlsPrisma = new PrismaClient({ datasources: { db: { url: rlsAppDatabaseUrl } } });
    const tenantAUuid = toDeterministicPersistenceUuid('tenant', tenantA);
    const tenantBUuid = toDeterministicPersistenceUuid('tenant', tenantB);
    const siteBUuid = toDeterministicPersistenceUuid('site', tenantB, sitePrimary);
    const noteBUuid = toDeterministicPersistenceUuid('note', tenantB, 'note-capture-shared');

    try {
      assert.equal((await countVisitSessionsForTenantSession(rlsPrisma, tenantAUuid)) >= 3, true);
      assert.equal(await countVisitSessionsForTenantSession(rlsPrisma, tenantBUuid), 1);
      assert.equal(await countVisitSessionsWithoutTenantSession(rlsPrisma), 0);
      await assert.rejects(
        () =>
          rlsPrisma.$transaction(async (tx) => {
            await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantAUuid}, true)`;
            await tx.$executeRaw`
              INSERT INTO "VisitSession" (
                "id", "tenantId", "siteId", "noteId", "timerState", "recordingState", "editorUnlocked"
              ) VALUES (
                CAST(${toDeterministicPersistenceUuid('visit-session', tenantB, 'visit-session-denied')} AS uuid),
                CAST(${tenantBUuid} AS uuid),
                CAST(${siteBUuid} AS uuid),
                CAST(${noteBUuid} AS uuid),
                'running',
                'recording',
                true
              )
            `;
          }),
        /row-level security|violates/
      );
      await assert.rejects(
        () =>
          rlsPrisma.$transaction(async (tx) => {
            await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantAUuid}, true)`;
            await tx.$executeRaw`
              UPDATE "VisitSession"
              SET "timerState" = 'paused'
              WHERE "id" = CAST(${toDeterministicPersistenceUuid('visit-session', tenantB, 'visit-session-note-capture-shared')} AS uuid)
            `;
            const rows = await tx.$queryRaw<Array<{ timerState: string }>>`
              SELECT "timerState" FROM "VisitSession"
              WHERE "id" = CAST(${toDeterministicPersistenceUuid('visit-session', tenantB, 'visit-session-note-capture-shared')} AS uuid)
            `;
            assert.equal(rows.length, 1, 'cross-tenant visit capture update should not expose tenant B rows');
          }),
        /cross-tenant visit capture update should not expose tenant B rows/
      );
    } finally {
      await rlsPrisma.$disconnect();
    }
  });
});

async function createRlsAppRole(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'aura_note_rls_app') THEN
        CREATE ROLE aura_note_rls_app LOGIN PASSWORD 'aura_note_rls_app';
      END IF;
    END
    $$;
  `);
  await prisma.$executeRawUnsafe('GRANT USAGE ON SCHEMA public TO aura_note_rls_app');
  await prisma.$executeRawUnsafe('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO aura_note_rls_app');
}

async function countVisitSessionsForTenantSession(prisma: PrismaClient, tenantUuid: string): Promise<number> {
  const rows = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantUuid}, true)`;
    return tx.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS count FROM "VisitSession"`;
  });
  return Number(rows[0]?.count ?? 0n);
}

async function countVisitSessionsWithoutTenantSession(prisma: PrismaClient): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS count FROM "VisitSession"`;
  return Number(rows[0]?.count ?? 0n);
}

function requireSchedule(repository: AsyncScheduleStateRepository | undefined): AsyncScheduleStateRepository {
  if (!repository) {
    throw new Error('Prisma schedule repository was not initialized');
  }
  return repository;
}

function requireCapture(repository: AsyncVisitCaptureRepository | undefined): AsyncVisitCaptureRepository {
  if (!repository) {
    throw new Error('Prisma visit capture repository was not initialized');
  }
  return repository;
}

function requirePrisma(prisma: PrismaClient | undefined): PrismaClient {
  if (!prisma) {
    throw new Error('Prisma client was not initialized');
  }
  return prisma;
}

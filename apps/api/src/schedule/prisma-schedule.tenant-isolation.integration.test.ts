import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { createAppointmentLifecycle } from '@aura-note/domain';
import { toDeterministicPersistenceUuid } from '@aura-note/persistence';
import type { AccessContext } from '@aura-note/security';
import type { StoredAppointment } from './schedule.repository';
import {
  createPrismaScheduleStateRepository,
  getPersistedAppointmentForAccessContext,
  type AsyncScheduleStateRepository
} from './prisma-schedule.repository';

const repoRoot = path.resolve(__dirname, '../../../..');
const schemaPath = path.join(repoRoot, 'packages/contracts/prisma/schema.prisma');
const rlsPath = path.join(repoRoot, 'packages/contracts/prisma/rls-core-schedule.sql');
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
      // The compose service can briefly be unavailable while Docker creates it.
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`local PostgreSQL service did not become healthy: ${lastError}`);
}

function applySchema(): void {
  const tmp = mkdtempSync(path.join(tmpdir(), 'aura-note-tenant-isolation-'));
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
  run('pnpm', ['exec', 'prisma', 'db', 'execute', '--url', databaseUrl, '--file', rlsPath]);
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
    reasonForVisit: 'Synthetic tenant isolation visit'
  });

  return {
    appointment: {
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
      reasonForVisit: 'Synthetic tenant isolation visit',
      mode: 'standalone'
    },
    note: {
      noteId,
      appointmentId,
      tenantId,
      siteId,
      safePatientId: `safe-patient-${tenantId}-${siteId}`,
      clinicianId: `clinician-${tenantId}-${siteId}`,
      state: lifecycle.noteState,
      mode: 'standalone'
    },
    lifecycle
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

describe('Prisma schedule tenant isolation and core RLS evidence', () => {
  let prisma: PrismaClient | undefined;
  let tenantARepository: AsyncScheduleStateRepository | undefined;
  let tenantBRepository: AsyncScheduleStateRepository | undefined;
  let tenantAPrimarySiteRepository: AsyncScheduleStateRepository | undefined;
  let tenantASecondarySiteRepository: AsyncScheduleStateRepository | undefined;

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
    tenantARepository = createPrismaScheduleStateRepository(prisma, { tenantId: tenantA });
    tenantBRepository = createPrismaScheduleStateRepository(prisma, { tenantId: tenantB });
    tenantAPrimarySiteRepository = createPrismaScheduleStateRepository(prisma, {
      tenantId: tenantA,
      siteId: sitePrimary
    });
    tenantASecondarySiteRepository = createPrismaScheduleStateRepository(prisma, {
      tenantId: tenantA,
      siteId: siteSecondary
    });
  });

  after(async () => {
    await prisma?.$disconnect();
    run('docker', ['compose', 'down', '--volumes', '--remove-orphans']);
  });

  it('keeps same semantic appointment, note, and idempotency keys isolated across tenants', async () => {
    const repoA = requireRepository(tenantARepository);
    const repoB = requireRepository(tenantBRepository);

    await repoA.saveAppointment(createStoredAppointment(tenantA, sitePrimary, 'appt-shared', 'note-shared'));
    await repoB.saveAppointment(createStoredAppointment(tenantB, sitePrimary, 'appt-shared', 'note-shared'));
    await repoA.saveIdempotencyKey('idem-shared', 'appt-shared');
    await repoB.saveIdempotencyKey('idem-shared', 'appt-shared');

    assert.equal((await repoA.listAppointments()).length, 1);
    assert.equal((await repoB.listAppointments()).length, 1);
    assert.equal((await repoA.getAppointment('appt-shared'))?.appointment.tenantId, tenantA);
    assert.equal((await repoB.getAppointment('appt-shared'))?.appointment.tenantId, tenantB);
    assert.equal((await repoA.getByNoteId('note-shared'))?.appointment.tenantId, tenantA);
    assert.equal((await repoB.getByNoteId('note-shared'))?.appointment.tenantId, tenantB);
    assert.equal(await repoA.getIdempotentAppointmentId('idem-shared'), 'appt-shared');
    assert.equal(await repoB.getIdempotentAppointmentId('idem-shared'), 'appt-shared');
  });

  it('denies cross-tenant and cross-site repository reads through scoped query filters', async () => {
    const primarySiteRepo = requireRepository(tenantAPrimarySiteRepository);
    const secondarySiteRepo = requireRepository(tenantASecondarySiteRepository);
    const tenantBRepo = requireRepository(tenantBRepository);

    await primarySiteRepo.saveAppointment(createStoredAppointment(tenantA, sitePrimary, 'appt-site-primary', 'note-site-primary'));
    await secondarySiteRepo.saveAppointment(createStoredAppointment(tenantA, siteSecondary, 'appt-site-secondary', 'note-site-secondary'));
    await primarySiteRepo.saveIdempotencyKey('idem-site-primary', 'appt-site-primary');

    assert.equal((await primarySiteRepo.listAppointments()).some((entry) => entry.appointment.appointmentId === 'appt-site-primary'), true);
    assert.equal(await primarySiteRepo.getAppointment('appt-site-secondary'), undefined);
    assert.equal(await primarySiteRepo.getByNoteId('note-site-secondary'), undefined);
    assert.equal(await tenantBRepo.getAppointment('appt-site-primary'), undefined);
    assert.equal(await tenantBRepo.getByNoteId('note-site-primary'), undefined);
    assert.equal(await tenantBRepo.getIdempotentAppointmentId('idem-site-primary'), undefined);
  });

  it('keeps persisted-record API harness reads inside the access context tenant and site', async () => {
    const activePrisma = requirePrisma(prisma);

    const allowed = await getPersistedAppointmentForAccessContext(
      activePrisma,
      accessContext(tenantA, sitePrimary),
      'appt-site-primary'
    );
    const wrongTenant = await getPersistedAppointmentForAccessContext(
      activePrisma,
      accessContext(tenantB, sitePrimary),
      'appt-site-primary'
    );
    const wrongSite = await getPersistedAppointmentForAccessContext(
      activePrisma,
      accessContext(tenantA, siteSecondary),
      'appt-site-primary'
    );

    assert.equal(allowed?.appointment.appointmentId, 'appt-site-primary');
    assert.equal(wrongTenant, undefined);
    assert.equal(wrongSite, undefined);
  });

  it('enforces core PostgreSQL RLS read and write policies for persisted schedule tables', async () => {
    const activePrisma = requirePrisma(prisma);
    applyRls();
    await createRlsAppRole(activePrisma);
    const rlsPrisma = new PrismaClient({
      datasources: {
        db: {
          url: rlsAppDatabaseUrl
        }
      }
    });

    const tenantAUuid = toDeterministicPersistenceUuid('tenant', tenantA);
    const tenantBUuid = toDeterministicPersistenceUuid('tenant', tenantB);
    const siteBUuid = toDeterministicPersistenceUuid('site', tenantB, sitePrimary);
    const patientBUuid = toDeterministicPersistenceUuid('patient', tenantB, `safe-patient-${tenantB}-${sitePrimary}`);
    const clinicianBUuid = toDeterministicPersistenceUuid('user', tenantB, `clinician-${tenantB}-${sitePrimary}`);

    try {
      const sameTenantCount = await countAppointmentsForTenantSession(rlsPrisma, tenantAUuid);
      const otherTenantCount = await countAppointmentsForTenantSession(rlsPrisma, tenantBUuid);
      const missingTenantCount = await countAppointmentsWithoutTenantSession(rlsPrisma);

      assert.equal(sameTenantCount >= 2, true);
      assert.equal(otherTenantCount, 1);
      assert.equal(missingTenantCount, 0);
      await assert.rejects(
        () =>
          rlsPrisma.$transaction(async (tx) => {
            await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantAUuid}, true)`;
            await tx.$executeRaw`
              INSERT INTO "Appointment" (
              "id", "tenantId", "siteId", "patientId", "clinicianId", "visitType", "state", "startsAt", "endsAt", "modality", "sourceSystem", "sourceRef"
            ) VALUES (
                CAST(${toDeterministicPersistenceUuid('appointment', tenantB, 'appt-rls-denied')} AS uuid),
                CAST(${tenantBUuid} AS uuid),
                CAST(${siteBUuid} AS uuid),
                CAST(${patientBUuid} AS uuid),
                CAST(${clinicianBUuid} AS uuid),
                'Primary care follow-up',
                'scheduled',
                ${new Date('2026-05-27T16:00:00.000Z')},
                ${new Date('2026-05-27T16:30:00.000Z')},
                'in_person',
                'standalone',
                'appt-rls-denied'
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
              UPDATE "Appointment"
              SET "visitType" = 'Denied cross-tenant update'
              WHERE "id" = CAST(${toDeterministicPersistenceUuid('appointment', tenantB, 'appt-shared')} AS uuid)
            `;
            const rows = await tx.$queryRaw<Array<{ visitType: string }>>`
              SELECT "visitType" FROM "Appointment"
              WHERE "id" = CAST(${toDeterministicPersistenceUuid('appointment', tenantB, 'appt-shared')} AS uuid)
            `;
            assert.equal(rows.length, 1, 'cross-tenant update should not expose tenant B rows');
          }),
        /cross-tenant update should not expose tenant B rows/
      );
      await assert.rejects(
        () =>
          rlsPrisma.$transaction(async (tx) => {
            await tx.$executeRaw`
            INSERT INTO "IdempotencyRecord" ("tenantId", "idempotencyKey", "appointmentId")
            VALUES (
                CAST(${tenantBUuid} AS uuid),
                'idem-rls-missing-session',
                CAST(${toDeterministicPersistenceUuid('appointment', tenantB, 'appt-shared')} AS uuid)
              )
            `;
          }),
        /row-level security|violates/
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

async function countAppointmentsForTenantSession(prisma: PrismaClient, tenantUuid: string): Promise<number> {
  const rows = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantUuid}, true)`;
    return tx.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS count FROM "Appointment"`;
  });
  return Number(rows[0]?.count ?? 0n);
}

async function countAppointmentsWithoutTenantSession(prisma: PrismaClient): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS count FROM "Appointment"`;
  return Number(rows[0]?.count ?? 0n);
}

function requireRepository(repository: AsyncScheduleStateRepository | undefined): AsyncScheduleStateRepository {
  if (!repository) {
    throw new Error('Prisma schedule repository was not initialized');
  }
  return repository;
}

function requirePrisma(prisma: PrismaClient | undefined): PrismaClient {
  if (!prisma) {
    throw new Error('Prisma client was not initialized');
  }
  return prisma;
}

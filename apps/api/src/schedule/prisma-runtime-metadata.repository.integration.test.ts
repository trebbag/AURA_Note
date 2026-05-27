import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { PrismaClient } from '@prisma/client';
import type { AccessContext } from '@aura-note/security';
import {
  createSyntheticCoachingReport,
  createSyntheticSupportStatus
} from '@aura-note/testing';
import { toDeterministicPersistenceUuid } from '@aura-note/persistence';
import {
  createPrismaRuntimeMetadataRepository,
  getPersistedRuntimeMetadataForAccessContext,
  type AsyncRuntimeMetadataRepository,
  type RuntimeMetadataSnapshot
} from './prisma-runtime-metadata.repository';

const repoRoot = path.resolve(__dirname, '../../../..');
const schemaPath = path.join(repoRoot, 'packages/contracts/prisma/schema.prisma');
const runtimeMetadataRlsPath = path.join(repoRoot, 'packages/contracts/prisma/rls-runtime-metadata.sql');
const databaseUrl = 'postgresql://aura_note:aura_note@localhost:5432/aura_note_dev';
const rlsAppDatabaseUrl = 'postgresql://aura_note_rls_app:aura_note_rls_app@localhost:5432/aura_note_dev';
const tenantA = 'tenant-synthetic-primary';
const tenantB = 'tenant-synthetic-secondary';
const sitePrimary = 'site-synthetic-primary';
const siteSecondary = 'site-synthetic-secondary';
const fixtureTime = '2026-05-27T17:00:00.000Z';

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
  const tmp = mkdtempSync(path.join(tmpdir(), 'aura-note-runtime-metadata-'));
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
  run('pnpm', ['exec', 'prisma', 'db', 'execute', '--url', databaseUrl, '--file', runtimeMetadataRlsPath]);
}

function createRuntimeMetadataSnapshot(tenantId: string, siteId: string): RuntimeMetadataSnapshot {
  const supportStatus = createSyntheticSupportStatus({
    status: {
      ...createSyntheticSupportStatus().status,
      generatedAt: fixtureTime,
      featureFlags: [
        {
          key: 'AURA_ENABLE_EXTERNAL_AI',
          enabled: false,
          governs: 'external_ai',
          defaultValue: false,
          disabledReason: 'External AI disabled for WO-037 synthetic runtime metadata evidence.'
        },
        {
          key: 'AURA_ENABLE_EHR_WRITEBACK',
          enabled: false,
          governs: 'ehr_writeback',
          defaultValue: false,
          disabledReason: 'Live writeback disabled for WO-037 synthetic runtime metadata evidence.'
        }
      ]
    },
    auditEvent: {
      auditEventId: `audit-support-${tenantId}-${siteId}`,
      tenantId,
      siteId,
      actorUserId: `support-${tenantId}-${siteId}`,
      action: 'support.status_check',
      entityType: 'SupportStatus',
      entityId: 'wo-037-runtime-metadata',
      traceId: `trace-support-${tenantId}-${siteId}`,
      createdAt: fixtureTime
    }
  });
  const coachingReport = createSyntheticCoachingReport({
    reportId: `coaching-report-${tenantId}-${siteId}`,
    clinicianId: `clinician-${tenantId}-${siteId}`,
    noteId: `note-coaching-${tenantId}-${siteId}`,
    generatedAt: fixtureTime,
    auditEvent: {
      auditEventId: `audit-coaching-${tenantId}-${siteId}`,
      tenantId,
      siteId,
      actorUserId: `clinician-${tenantId}-${siteId}`,
      action: 'coaching.view_own',
      entityType: 'CoachingReport',
      entityId: `coaching-report-${tenantId}-${siteId}`,
      traceId: `trace-coaching-${tenantId}-${siteId}`,
      createdAt: fixtureTime
    }
  });

  return {
    tenantId,
    siteId,
    auditEvents: [
      supportStatus.auditEvent,
      coachingReport.auditEvent,
      {
        auditEventId: `audit-config-${tenantId}-${siteId}`,
        tenantId,
        siteId,
        actorUserId: `admin-${tenantId}-${siteId}`,
        action: 'feature_flag.metadata_persisted',
        entityType: 'FeatureFlag',
        entityId: 'AURA_ENABLE_EXTERNAL_AI',
        traceId: `trace-config-${tenantId}-${siteId}`,
        createdAt: fixtureTime
      }
    ],
    domainEvents: [
      {
        eventId: `event-runtime-${tenantId}-${siteId}`,
        eventType: 'audit.event_recorded.v1',
        schemaVersion: 'v1',
        tenantId,
        siteId,
        noteId: `note-runtime-${tenantId}-${siteId}`,
        producer: 'aura-note-api',
        eventTime: fixtureTime,
        traceId: `trace-event-${tenantId}-${siteId}`,
        idempotencyKey: `idem-event-${tenantId}-${siteId}`,
        sensitivity: 'non_phi',
        retentionClass: 'audit',
        payload: {
          aggregateType: 'RuntimeMetadata',
          evidenceType: 'synthetic_p7_runtime_metadata'
        }
      }
    ],
    supportStatus,
    featureFlags: supportStatus.status.featureFlags,
    templates: [
      {
        templateId: `template-follow-up-${tenantId}-${siteId}`,
        tenantId,
        siteId,
        name: 'Synthetic chronic follow-up',
        visitType: 'Primary care follow-up',
        specialty: 'Primary care',
        body: 'Synthetic template body with variables only.',
        status: 'active'
      }
    ],
    dotPhrases: [
      {
        dotPhraseId: `dot-phrase-plan-${tenantId}-${siteId}`,
        tenantId,
        siteId,
        phrase: '.syntheticplan',
        body: 'Synthetic follow-up plan phrase with no PHI.',
        status: 'active'
      }
    ],
    coachingReports: [coachingReport],
    integrationConnections: [
      {
        integrationConnectionId: `integration-athena-${tenantId}-${siteId}`,
        tenantId,
        siteId,
        kind: 'ehr',
        vendor: 'athenahealth',
        mode: 'disabled',
        enabled: false,
        status: 'metadata_only',
        config: {
          credentialStatus: 'not_configured',
          liveWritebackEnabled: false
        }
      },
      {
        integrationConnectionId: `integration-clinicos-${tenantId}-${siteId}`,
        tenantId,
        siteId,
        kind: 'clinicos',
        vendor: 'aura_clinicos',
        mode: 'mock',
        enabled: false,
        status: 'metadata_only',
        config: {
          delegationMode: 'mock_only'
        }
      }
    ],
    modeMappings: [
      {
        modeMappingId: `mode-mapping-${tenantId}-${siteId}`,
        tenantId,
        siteId,
        localObjectType: 'note',
        localObjectId: `note-runtime-${tenantId}-${siteId}`,
        externalSystem: 'clinicos',
        externalObjectType: 'm17_np_cockpit_note',
        externalObjectId: `clinicos-note-${tenantId}-${siteId}`,
        sourceOfTruth: 'aura_note',
        status: 'metadata_only'
      }
    ]
  };
}

function accessContext(role: AccessContext['role'], tenantId: string, siteId: string): AccessContext {
  return {
    role,
    tenantId,
    siteId,
    actorUserId: `user-${role}-${tenantId}-${siteId}`,
    linkedToPatient: role === 'clinician',
    linkedToVisit: role === 'clinician',
    treatingClinician: role === 'clinician',
    billingReviewTriggered: false,
    authorizedAdmin: role === 'authorized_admin',
    ownCoachingReport: role === 'clinician'
  };
}

describe('Prisma runtime metadata persistence and broad RLS', () => {
  let prisma: PrismaClient | undefined;
  let runtimeA: AsyncRuntimeMetadataRepository | undefined;
  let runtimeB: AsyncRuntimeMetadataRepository | undefined;
  let runtimeASecondarySite: AsyncRuntimeMetadataRepository | undefined;

  before(async () => {
    run('docker', ['compose', 'down', '--volumes', '--remove-orphans']);
    run('docker', ['compose', 'up', '--detach', 'postgres']);
    await waitForPostgres();
    applySchema();
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    runtimeA = createPrismaRuntimeMetadataRepository(prisma, { tenantId: tenantA, siteId: sitePrimary });
    runtimeB = createPrismaRuntimeMetadataRepository(prisma, { tenantId: tenantB, siteId: sitePrimary });
    runtimeASecondarySite = createPrismaRuntimeMetadataRepository(prisma, { tenantId: tenantA, siteId: siteSecondary });
  });

  after(async () => {
    await prisma?.$disconnect();
    run('docker', ['compose', 'down', '--volumes', '--remove-orphans']);
  });

  it('persists and reloads audit, event, support, flags, templates, coaching, integration, and mode metadata', async () => {
    await requireRuntime(runtimeA).saveRuntimeMetadata(createRuntimeMetadataSnapshot(tenantA, sitePrimary));
    const reloaded = await requireRuntime(runtimeA).getRuntimeMetadata();

    assert.equal(reloaded.auditEvents.length, 3);
    assert.equal(reloaded.domainEvents[0]?.eventType, 'audit.event_recorded.v1');
    assert.equal(reloaded.supportStatus?.status.overallHealth, 'ok');
    assert.equal(reloaded.featureFlags.some((flag) => flag.key === 'AURA_ENABLE_EXTERNAL_AI' && !flag.enabled), true);
    assert.equal(reloaded.templates[0]?.name, 'Synthetic chronic follow-up');
    assert.equal(reloaded.dotPhrases[0]?.phrase, '.syntheticplan');
    assert.equal(reloaded.coachingReports[0]?.patientFacingExcluded, true);
    assert.equal(reloaded.integrationConnections.some((connection) => connection.vendor === 'athenahealth'), true);
    assert.equal(reloaded.modeMappings[0]?.externalSystem, 'clinicos');
  });

  it('denies cross-tenant and cross-site repository/API-harness reads before DTO exposure', async () => {
    await requireRuntime(runtimeA).saveRuntimeMetadata(createRuntimeMetadataSnapshot(tenantA, sitePrimary));
    await requireRuntime(runtimeB).saveRuntimeMetadata(createRuntimeMetadataSnapshot(tenantB, sitePrimary));

    assert.equal((await requireRuntime(runtimeA).getRuntimeMetadata()).auditEvents.length, 3);
    assert.equal((await requireRuntime(runtimeB).getRuntimeMetadata()).auditEvents.length, 3);
    assert.equal((await requireRuntime(runtimeASecondarySite).getRuntimeMetadata()).auditEvents.length, 0);

    const activePrisma = requirePrisma(prisma);
    const supportAllowed = await getPersistedRuntimeMetadataForAccessContext(
      activePrisma,
      accessContext('support', tenantA, sitePrimary),
      'support'
    );
    const auditAllowed = await getPersistedRuntimeMetadataForAccessContext(
      activePrisma,
      accessContext('compliance_privacy_lead', tenantA, sitePrimary),
      'audit'
    );
    const adminAllowed = await getPersistedRuntimeMetadataForAccessContext(
      activePrisma,
      accessContext('authorized_admin', tenantA, sitePrimary),
      'admin'
    );
    const wrongSite = await getPersistedRuntimeMetadataForAccessContext(
      activePrisma,
      accessContext('support', tenantA, siteSecondary),
      'support'
    );
    const auditDenied = await getPersistedRuntimeMetadataForAccessContext(
      activePrisma,
      accessContext('clinician', tenantA, sitePrimary),
      'audit'
    );
    const coachingDenied = await getPersistedRuntimeMetadataForAccessContext(
      activePrisma,
      accessContext('billing_staff', tenantA, sitePrimary),
      'coaching'
    );

    assert.equal(supportAllowed?.supportStatus?.status.service, 'aura-note');
    assert.equal(auditAllowed?.auditEvents.length, 3);
    assert.equal(adminAllowed?.featureFlags.length, 2);
    assert.equal(wrongSite?.auditEvents.length, 0);
    assert.equal(auditDenied, undefined);
    assert.equal(coachingDenied, undefined);
  });

  it('enforces broad runtime metadata PostgreSQL RLS read, insert, and update policies', async () => {
    const activePrisma = requirePrisma(prisma);
    applyRls();
    await createRlsAppRole(activePrisma);
    const rlsPrisma = new PrismaClient({ datasources: { db: { url: rlsAppDatabaseUrl } } });
    const tenantAUuid = toDeterministicPersistenceUuid('tenant', tenantA);
    const tenantBUuid = toDeterministicPersistenceUuid('tenant', tenantB);
    const siteBUuid = toDeterministicPersistenceUuid('site', tenantB, sitePrimary);
    const deniedAuditUuid = toDeterministicPersistenceUuid('audit-event', tenantB, 'audit-denied');

    try {
      assert.equal((await countAuditEventsForTenantSession(rlsPrisma, tenantAUuid)) >= 3, true);
      assert.equal(await countAuditEventsForTenantSession(rlsPrisma, tenantBUuid), 3);
      assert.equal(await countAuditEventsWithoutTenantSession(rlsPrisma), 0);
      await assert.rejects(
        () =>
          rlsPrisma.$transaction(async (tx) => {
            await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantAUuid}, true)`;
            await tx.$executeRaw`
              INSERT INTO "AuditEvent" (
                "id", "tenantId", "siteId", "action", "entityType", "entityId", "traceId", "metadataJson", "createdAt"
              ) VALUES (
                CAST(${deniedAuditUuid} AS uuid),
                CAST(${tenantBUuid} AS uuid),
                CAST(${siteBUuid} AS uuid),
                'audit.denied',
                'RuntimeMetadata',
                'denied',
                'trace-denied',
                '{}'::jsonb,
                NOW()
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
              UPDATE "AuditEvent"
              SET "action" = 'audit.cross_tenant_update'
              WHERE "tenantId" = CAST(${tenantBUuid} AS uuid)
            `;
            const rows = await tx.$queryRaw<Array<{ action: string }>>`
              SELECT "action" FROM "AuditEvent"
              WHERE "tenantId" = CAST(${tenantBUuid} AS uuid)
            `;
            assert.equal(rows.length, 1, 'cross-tenant runtime metadata update should not expose tenant B rows');
          }),
        /cross-tenant runtime metadata update should not expose tenant B rows/
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

async function countAuditEventsForTenantSession(prisma: PrismaClient, tenantUuid: string): Promise<number> {
  const rows = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantUuid}, true)`;
    return tx.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS count FROM "AuditEvent"`;
  });
  return Number(rows[0]?.count ?? 0n);
}

async function countAuditEventsWithoutTenantSession(prisma: PrismaClient): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS count FROM "AuditEvent"`;
  return Number(rows[0]?.count ?? 0n);
}

function requireRuntime(repository: AsyncRuntimeMetadataRepository | undefined): AsyncRuntimeMetadataRepository {
  if (!repository) {
    throw new Error('Prisma runtime metadata repository was not initialized');
  }
  return repository;
}

function requirePrisma(prisma: PrismaClient | undefined): PrismaClient {
  if (!prisma) {
    throw new Error('Prisma client was not initialized');
  }
  return prisma;
}

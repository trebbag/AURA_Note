import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { PrismaClient } from '@prisma/client';
import type { DraftClaimPreviewDto, FinalizationSessionDto } from '@aura-note/contracts';
import { createAppointmentLifecycle } from '@aura-note/domain';
import { toDeterministicPersistenceUuid } from '@aura-note/persistence';
import type { AccessContext } from '@aura-note/security';
import type { StoredAppointment } from './schedule.repository';
import { createPrismaScheduleStateRepository, type AsyncScheduleStateRepository } from './prisma-schedule.repository';
import {
  createPrismaFinalizationOutputRepository,
  getPersistedFinalizationOutputForAccessContext,
  type AsyncFinalizationOutputRepository
} from './prisma-finalization-output.repository';

const repoRoot = path.resolve(__dirname, '../../../..');
const schemaPath = path.join(repoRoot, 'packages/contracts/prisma/schema.prisma');
const finalizationRlsPath = path.join(repoRoot, 'packages/contracts/prisma/rls-finalization-output.sql');
const databaseUrl = 'postgresql://aura_note:aura_note@localhost:5432/aura_note_dev';
const rlsAppDatabaseUrl = 'postgresql://aura_note_rls_app:aura_note_rls_app@localhost:5432/aura_note_dev';
const tenantA = 'tenant-synthetic-primary';
const tenantB = 'tenant-synthetic-secondary';
const sitePrimary = 'site-synthetic-primary';
const siteSecondary = 'site-synthetic-secondary';
const fixtureTime = '2026-05-27T16:00:00.000Z';

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
  const tmp = mkdtempSync(path.join(tmpdir(), 'aura-note-finalization-output-'));
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
  run('pnpm', ['exec', 'prisma', 'db', 'execute', '--url', databaseUrl, '--file', finalizationRlsPath]);
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
    startsAt: fixtureTime,
    durationMinutes: 30,
    modality: 'in_person',
    source: 'standalone',
    reasonForVisit: 'Synthetic durable finalization output'
  });

  return {
    appointment: {
      appointmentId,
      tenantId,
      siteId,
      safePatientId: `safe-patient-${tenantId}-${siteId}`,
      clinicianId: `clinician-${tenantId}-${siteId}`,
      noteId,
      state: 'finalized',
      startsAt: fixtureTime,
      durationMinutes: 30,
      visitType: 'Primary care follow-up',
      modality: 'in_person',
      source: 'standalone',
      reasonForVisit: 'Synthetic durable finalization output',
      mode: 'standalone'
    },
    note: {
      noteId,
      appointmentId,
      tenantId,
      siteId,
      safePatientId: `safe-patient-${tenantId}-${siteId}`,
      clinicianId: `clinician-${tenantId}-${siteId}`,
      state: 'finalized',
      mode: 'standalone'
    },
    lifecycle: {
      ...lifecycle,
      appointmentState: 'finalized',
      noteState: 'finalized',
      noteVisibleInDrafts: false
    }
  };
}

function withFinalizationOutput(entry: StoredAppointment): StoredAppointment {
  const finalization = createFinalizationSession(entry);
  const finalizedEntry: StoredAppointment = {
    ...entry,
    finalization,
    finalNote: finalization.finalNote!,
    patientSummary: finalization.patientSummary!,
    draftClaimPreview: finalization.draftClaimPreview!,
    exportArtifacts: finalization.exportArtifacts,
    writeback: finalization.writeback
  };
  return finalizedEntry;
}

function createFinalizationSession(entry: StoredAppointment): FinalizationSessionDto {
  const finalNoteText = [
    'Signed synthetic final note.',
    'Includes only deterministic clinician-reviewed support language.',
    'No autonomous diagnosis, charge finalization, or claim submission occurred.'
  ].join('\n');
  const patientSummaryText = 'Synthetic patient summary excludes internal billing, revenue, confidence, and coaching details.';
  const draftClaimPreview: DraftClaimPreviewDto = {
    draftClaimPreviewId: `draft-claim-${entry.note.noteId}`,
    noteId: entry.note.noteId,
    status: 'draft_preview',
    claimReadiness: 'needs_billing_review',
    patientReference: entry.appointment.safePatientId,
    encounterDate: fixtureTime.slice(0, 10),
    renderingClinicianId: entry.appointment.clinicianId,
    placeOfService: 'office',
    visitType: entry.appointment.visitType,
    cptCandidates: ['CPT 99214 candidate'],
    hcpcsCandidates: [],
    icd10Candidates: ['ICD-10 E11.9 candidate'],
    emCandidate: 'CPT 99214 candidate',
    diagnosisToServiceLinks: ['ICD-10 E11.9 candidate -> CPT 99214 candidate'],
    payerReadableJustification: 'Synthetic payer-readable support remains human-reviewed.',
    missingEvidence: ['Synthetic billing review route retained.'],
    denialRiskFlags: ['billing_review_required'],
    estimateStatus: 'unavailable_caveated',
    estimateCaveat: 'Synthetic estimate unavailable.',
    billingReviewTriggered: true,
    submittedClaim: false
  };

  return {
    finalizationSessionId: `finalization-${entry.note.noteId}`,
    noteId: entry.note.noteId,
    appointmentId: entry.appointment.appointmentId,
    currentStep: 'sign_dispatch',
    completedSteps: ['code_review', 'suggestion_review', 'compose', 'compare_edit', 'billing_attest', 'sign_dispatch'],
    stepStatuses: {
      code_review: 'completed',
      suggestion_review: 'completed',
      compose: 'completed',
      compare_edit: 'completed',
      billing_attest: 'completed',
      sign_dispatch: 'completed'
    },
    frozenSnapshot: {
      originalNoteText: 'Synthetic frozen source note.',
      visitSelections: [
        {
          visitSelectionId: `selection-${entry.note.noteId}`,
          noteId: entry.note.noteId,
          category: 'cpt',
          label: 'CPT 99214 candidate',
          confidence: 0.82,
          humanApproved: true
        }
      ],
      finalPassSuggestions: [],
      transcriptSegmentCount: 2,
      historyGapQuestionCount: 0
    },
    selectionDecisions: [
      {
        visitSelectionId: `selection-${entry.note.noteId}`,
        decision: 'keep',
        reason: 'Synthetic clinician-reviewed finalization choice.',
        decidedByUserId: entry.appointment.clinicianId,
        decidedAt: fixtureTime
      }
    ],
    suggestionDecisions: [],
    unusedAuditItems: [],
    composePhases: [
      { phase: 'analyzing_content', status: 'completed' },
      { phase: 'enhancing_structure', status: 'completed' },
      { phase: 'beautifying_language', status: 'completed' },
      { phase: 'final_review', status: 'completed' }
    ],
    composeOutput: {
      composeOutputId: `compose-${entry.note.noteId}`,
      noteId: entry.note.noteId,
      version: 1,
      enhancedNoteText: finalNoteText,
      patientSummaryText,
      payerReadableSupportSection: 'Synthetic payer-readable support remains human-reviewed.',
      planTaskMapping: ['Synthetic plan task mapping retained.'],
      sourceIntegrityWarnings: ['Synthetic output; no external AI or PHI path used.'],
      patientSummaryInternalDetailsDetected: false,
      staleDueToEdit: false,
      generatedAt: fixtureTime,
      draftOnly: true
    },
    patientOpportunities: [
      {
        patientOpportunityId: `opportunity-${entry.note.noteId}`,
        noteId: entry.note.noteId,
        category: 'clinical',
        title: 'Confirm follow-up plan',
        detail: 'Synthetic clinical-first opportunity.',
        patientFacingAllowed: true,
        revenueHiddenFromPatient: true
      }
    ],
    draftClaimPreview,
    billingAttestation: {
      billingAttestationId: `billing-attest-${entry.note.noteId}`,
      noteId: entry.note.noteId,
      requiredStatements: ['I reviewed the synthetic draft claim preview.'],
      acceptedStatements: ['I reviewed the synthetic draft claim preview.'],
      estimateCaveatAcknowledged: true,
      billingReviewTriggered: true,
      attestedByUserId: entry.appointment.clinicianId,
      attestedAt: fixtureTime
    },
    finalNote: {
      finalNoteId: `final-note-${entry.note.noteId}`,
      noteId: entry.note.noteId,
      appointmentId: entry.appointment.appointmentId,
      safePatientId: entry.appointment.safePatientId,
      clinicianId: entry.appointment.clinicianId,
      finalNoteText,
      finalizedAt: fixtureTime,
      readOnly: true
    },
    patientSummary: {
      patientSummaryId: `patient-summary-${entry.note.noteId}`,
      noteId: entry.note.noteId,
      patientSummaryText,
      finalizedAt: fixtureTime,
      patientFacing: true,
      internalBillingDetailsExcluded: true
    },
    exportArtifacts: [
      {
        exportArtifactId: `export-final-note-${entry.note.noteId}`,
        noteId: entry.note.noteId,
        artifactType: 'final_note_pdf',
        status: 'generated',
        mimeType: 'application/pdf',
        fileName: `${entry.note.noteId}-final-note.pdf`,
        generatedAt: fixtureTime,
        generatedByUserId: entry.appointment.clinicianId,
        sourceFinalizedAt: fixtureTime,
        signedVersionLocked: true,
        content: `%PDF-1.4 synthetic\n${finalNoteText}\n%%EOF`,
        checksum: `synthetic-checksum-${entry.note.noteId}`,
        retentionClass: 'standard',
        deliveryMode: 'storage_backed',
        storageProvider: 'azure_blob',
        storageKey: `tenants/${entry.appointment.tenantId}/exports/${entry.note.noteId}-final-note.pdf`,
        contentLengthBytes: 128,
        signedDownloadAvailable: true,
        signedDownloadToken: `download-token-${entry.note.noteId}`,
        signedDownloadExpiresAt: '2026-05-27T16:15:00.000Z'
      }
    ],
    writeback: {
      writebackJobId: `writeback-${entry.note.noteId}`,
      noteId: entry.note.noteId,
      target: 'final_note',
      vendor: 'athenahealth',
      status: 'failed',
      configured: true,
      humanApproved: true,
      retryable: true,
      failedAt: fixtureTime,
      failureReason: 'Synthetic writeback failure metadata only.'
    },
    finalNoteApproved: true,
    patientSummaryApproved: true,
    readyForBillingAttest: true,
    billingAttested: true,
    signedAndDispatched: true,
    createdAt: fixtureTime,
    updatedAt: fixtureTime
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

describe('Prisma finalization output runtime persistence', () => {
  let prisma: PrismaClient | undefined;
  let scheduleA: AsyncScheduleStateRepository | undefined;
  let scheduleB: AsyncScheduleStateRepository | undefined;
  let finalizationA: AsyncFinalizationOutputRepository | undefined;
  let finalizationB: AsyncFinalizationOutputRepository | undefined;
  let finalizationASecondarySite: AsyncFinalizationOutputRepository | undefined;

  before(async () => {
    run('docker', ['compose', 'down', '--volumes', '--remove-orphans']);
    run('docker', ['compose', 'up', '--detach', 'postgres']);
    await waitForPostgres();
    applySchema();
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    scheduleA = createPrismaScheduleStateRepository(prisma, { tenantId: tenantA, siteId: sitePrimary });
    scheduleB = createPrismaScheduleStateRepository(prisma, { tenantId: tenantB, siteId: sitePrimary });
    finalizationA = createPrismaFinalizationOutputRepository(prisma, { tenantId: tenantA, siteId: sitePrimary });
    finalizationB = createPrismaFinalizationOutputRepository(prisma, { tenantId: tenantB, siteId: sitePrimary });
    finalizationASecondarySite = createPrismaFinalizationOutputRepository(prisma, { tenantId: tenantA, siteId: siteSecondary });
  });

  after(async () => {
    await prisma?.$disconnect();
    run('docker', ['compose', 'down', '--volumes', '--remove-orphans']);
  });

  it('persists and reloads finalization decisions, signed outputs, billing attestations, draft claim previews, exports, and writeback metadata', async () => {
    const appointment = createStoredAppointment(tenantA, sitePrimary, 'appt-finalization-001', 'note-finalization-001');
    const finalizedEntry = withFinalizationOutput(appointment);

    await requireSchedule(scheduleA).saveAppointment(appointment);
    await requireFinalization(finalizationA).saveFinalizationOutput(finalizedEntry);

    const reloaded = await requireFinalization(finalizationA).getByNoteId('note-finalization-001');
    assert.equal(reloaded?.finalization?.signedAndDispatched, true);
    assert.equal(reloaded?.finalization?.selectionDecisions.length, 1);
    assert.equal(reloaded?.finalNote?.readOnly, true);
    assert.equal(reloaded?.patientSummary?.internalBillingDetailsExcluded, true);
    assert.equal(reloaded?.draftClaimPreview?.submittedClaim, false);
    assert.equal(reloaded?.draftClaimPreview?.billingReviewTriggered, true);
    assert.equal(reloaded?.exportArtifacts[0]?.storageProvider, 'azure_blob');
    assert.equal(reloaded?.exportArtifacts[0]?.signedDownloadAvailable, true);
    assert.equal(reloaded?.writeback?.status, 'failed');
    assert.equal(reloaded?.writeback?.retryable, true);
  });

  it('blocks submitted claims and mutable signed output persistence', async () => {
    const appointment = createStoredAppointment(tenantA, sitePrimary, 'appt-finalization-immutability', 'note-finalization-immutability');
    const finalizedEntry = withFinalizationOutput(appointment);

    await requireSchedule(scheduleA).saveAppointment(appointment);
    await requireFinalization(finalizationA).saveFinalizationOutput(finalizedEntry);

    await assert.rejects(
      () =>
        requireFinalization(finalizationA).saveFinalizationOutput({
          ...finalizedEntry,
          finalization: {
            ...finalizedEntry.finalization!,
            draftClaimPreview: {
              ...finalizedEntry.finalization!.draftClaimPreview!,
              submittedClaim: true
            } as unknown as DraftClaimPreviewDto
          }
        }),
      /submitted claims/
    );

    await assert.rejects(
      () =>
        requireFinalization(finalizationA).saveFinalizationOutput({
          ...finalizedEntry,
          finalization: {
            ...finalizedEntry.finalization!,
            composeOutput: {
              ...finalizedEntry.finalization!.composeOutput!,
              enhancedNoteText: 'Changed after signature should not persist.'
            }
          }
        }),
      /mutable signed final note/
    );
  });

  it('denies cross-tenant and cross-site repository/API-harness reads before DTO exposure', async () => {
    const appointmentA = createStoredAppointment(tenantA, sitePrimary, 'appt-finalization-shared', 'note-finalization-shared');
    const appointmentB = createStoredAppointment(tenantB, sitePrimary, 'appt-finalization-shared', 'note-finalization-shared');

    await requireSchedule(scheduleA).saveAppointment(appointmentA);
    await requireSchedule(scheduleB).saveAppointment(appointmentB);
    await requireFinalization(finalizationA).saveFinalizationOutput(withFinalizationOutput(appointmentA));
    await requireFinalization(finalizationB).saveFinalizationOutput(withFinalizationOutput(appointmentB));

    assert.equal((await requireFinalization(finalizationA).getByNoteId('note-finalization-shared'))?.noteId, 'note-finalization-shared');
    assert.equal((await requireFinalization(finalizationB).getByNoteId('note-finalization-shared'))?.noteId, 'note-finalization-shared');
    assert.equal(await requireFinalization(finalizationASecondarySite).getByNoteId('note-finalization-shared'), undefined);

    const activePrisma = requirePrisma(prisma);
    const allowed = await getPersistedFinalizationOutputForAccessContext(
      activePrisma,
      accessContext(tenantA, sitePrimary),
      'note-finalization-shared'
    );
    const wrongTenant = await getPersistedFinalizationOutputForAccessContext(
      activePrisma,
      accessContext(tenantB, siteSecondary),
      'note-finalization-shared'
    );
    const wrongSite = await getPersistedFinalizationOutputForAccessContext(
      activePrisma,
      accessContext(tenantA, siteSecondary),
      'note-finalization-shared'
    );

    assert.equal(allowed?.finalization?.signedAndDispatched, true);
    assert.equal(wrongTenant, undefined);
    assert.equal(wrongSite, undefined);
  });

  it('enforces finalization-output PostgreSQL RLS read, insert, and update policies', async () => {
    const activePrisma = requirePrisma(prisma);
    applyRls();
    await createRlsAppRole(activePrisma);
    const rlsPrisma = new PrismaClient({ datasources: { db: { url: rlsAppDatabaseUrl } } });
    const tenantAUuid = toDeterministicPersistenceUuid('tenant', tenantA);
    const tenantBUuid = toDeterministicPersistenceUuid('tenant', tenantB);
    const siteBUuid = toDeterministicPersistenceUuid('site', tenantB, sitePrimary);
    const noteBUuid = toDeterministicPersistenceUuid('note', tenantB, 'note-finalization-shared');

    try {
      assert.equal((await countFinalizationRunsForTenantSession(rlsPrisma, tenantAUuid)) >= 2, true);
      assert.equal(await countFinalizationRunsForTenantSession(rlsPrisma, tenantBUuid), 1);
      assert.equal(await countFinalizationRunsWithoutTenantSession(rlsPrisma), 0);
      await assert.rejects(
        () =>
          rlsPrisma.$transaction(async (tx) => {
            await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantAUuid}, true)`;
            await tx.$executeRaw`
              INSERT INTO "FinalizationRun" (
                "id", "tenantId", "siteId", "noteId", "sourceRef", "appointmentSourceRef", "currentStep",
                "completedStepsJson", "stepStatusesJson", "frozenSnapshotJson", "readyForBillingAttest",
                "billingAttested", "signedAndDispatched", "createdAt", "updatedAt"
              ) VALUES (
                CAST(${toDeterministicPersistenceUuid('finalization-run', tenantB, 'finalization-denied')} AS uuid),
                CAST(${tenantBUuid} AS uuid),
                CAST(${siteBUuid} AS uuid),
                CAST(${noteBUuid} AS uuid),
                'finalization-denied',
                'appt-finalization-shared',
                'sign_dispatch',
                '[]'::jsonb,
                '{}'::jsonb,
                '{}'::jsonb,
                true,
                true,
                true,
                NOW(),
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
              UPDATE "FinalizationRun"
              SET "currentStep" = 'code_review'
              WHERE "id" = CAST(${toDeterministicPersistenceUuid('finalization-run', tenantB, 'finalization-note-finalization-shared')} AS uuid)
            `;
            const rows = await tx.$queryRaw<Array<{ currentStep: string }>>`
              SELECT "currentStep" FROM "FinalizationRun"
              WHERE "id" = CAST(${toDeterministicPersistenceUuid('finalization-run', tenantB, 'finalization-note-finalization-shared')} AS uuid)
            `;
            assert.equal(rows.length, 1, 'cross-tenant finalization update should not expose tenant B rows');
          }),
        /cross-tenant finalization update should not expose tenant B rows/
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

async function countFinalizationRunsForTenantSession(prisma: PrismaClient, tenantUuid: string): Promise<number> {
  const rows = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantUuid}, true)`;
    return tx.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS count FROM "FinalizationRun"`;
  });
  return Number(rows[0]?.count ?? 0n);
}

async function countFinalizationRunsWithoutTenantSession(prisma: PrismaClient): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS count FROM "FinalizationRun"`;
  return Number(rows[0]?.count ?? 0n);
}

function requireSchedule(repository: AsyncScheduleStateRepository | undefined): AsyncScheduleStateRepository {
  if (!repository) {
    throw new Error('Prisma schedule repository was not initialized');
  }
  return repository;
}

function requireFinalization(repository: AsyncFinalizationOutputRepository | undefined): AsyncFinalizationOutputRepository {
  if (!repository) {
    throw new Error('Prisma finalization output repository was not initialized');
  }
  return repository;
}

function requirePrisma(prisma: PrismaClient | undefined): PrismaClient {
  if (!prisma) {
    throw new Error('Prisma client was not initialized');
  }
  return prisma;
}

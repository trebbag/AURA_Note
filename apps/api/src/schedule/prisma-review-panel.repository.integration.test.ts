import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { PrismaClient } from '@prisma/client';
import type { SuggestionDto } from '@aura-note/contracts';
import { createAppointmentLifecycle } from '@aura-note/domain';
import { toDeterministicPersistenceUuid } from '@aura-note/persistence';
import type { AccessContext } from '@aura-note/security';
import { createStandalonePatientScheduleScaffold, type StoredAppointment } from './schedule.repository';
import { createPrismaScheduleStateRepository, type AsyncScheduleStateRepository } from './prisma-schedule.repository';
import {
  createPrismaReviewPanelRepository,
  getPersistedReviewPanelForAccessContext,
  type AsyncReviewPanelRepository
} from './prisma-review-panel.repository';

const repoRoot = path.resolve(__dirname, '../../../..');
const schemaPath = path.join(repoRoot, 'packages/contracts/prisma/schema.prisma');
const reviewRlsPath = path.join(repoRoot, 'packages/contracts/prisma/rls-review-panel.sql');
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
  const tmp = mkdtempSync(path.join(tmpdir(), 'aura-note-review-panel-'));
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
  run('pnpm', ['exec', 'prisma', 'db', 'execute', '--url', databaseUrl, '--file', reviewRlsPath]);
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
    reasonForVisit: 'Synthetic durable review panel'
  });

  const appointment: StoredAppointment['appointment'] = {
      appointmentId,
      tenantId,
      siteId,
      safePatientId: `safe-patient-${tenantId}-${siteId}`,
      clinicianId: `clinician-${tenantId}-${siteId}`,
      noteId,
      state: 'visit_started',
      startsAt: '2026-05-27T15:00:00.000Z',
      durationMinutes: 30,
      visitType: 'Primary care follow-up',
      modality: 'in_person',
      source: 'standalone',
      reasonForVisit: 'Synthetic durable review panel',
      mode: 'standalone'
  };
  const note: StoredAppointment['note'] = {
      noteId,
      appointmentId,
      tenantId,
      siteId,
      safePatientId: `safe-patient-${tenantId}-${siteId}`,
      clinicianId: `clinician-${tenantId}-${siteId}`,
      state: 'visit_active',
      mode: 'standalone'
  };

  return {
    appointment,
    note,
    ...createStandalonePatientScheduleScaffold(appointment, note),
    lifecycle: {
      ...lifecycle,
      appointmentState: 'visit_started',
      noteState: 'visit_active',
      noteVisibleInDrafts: true
    }
  };
}

function withReviewPanel(entry: StoredAppointment): StoredAppointment {
  const suggestions = createSuggestions(entry.note.noteId);
  return {
    ...entry,
    suggestions: [
      { ...suggestions[0]!, status: 'accepted' },
      { ...suggestions[1]!, status: 'accepted' },
      { ...suggestions[2]!, status: 'removed' }
    ],
    visitSelections: [
      {
        visitSelectionId: `selection-cpt-${entry.note.noteId}`,
        noteId: entry.note.noteId,
        category: 'cpt',
        label: 'CPT 99214 candidate',
        confidence: 0.82,
        humanApproved: true,
        sourceSuggestionId: 'suggestion-demo-cpt-99214'
      },
      {
        visitSelectionId: `selection-icd-${entry.note.noteId}`,
        noteId: entry.note.noteId,
        category: 'icd10',
        label: 'ICD-10 E11.9 candidate',
        confidence: 0.74,
        humanApproved: true,
        sourceSuggestionId: 'suggestion-demo-icd10-e119',
        overrideReason: 'Synthetic override metadata completed for low-confidence diagnosis candidate.'
      },
      {
        visitSelectionId: `selection-manual-plan-${entry.note.noteId}`,
        noteId: entry.note.noteId,
        category: 'plan_item',
        label: 'Manual plan item for synthetic follow-up',
        humanApproved: true
      }
    ],
    complianceIssues: [
      {
        complianceIssueId: `compliance-hard-block-${entry.note.noteId}`,
        noteId: entry.note.noteId,
        severity: 'hard_block',
        title: 'Open MA History Gap blocker',
        detail: 'Synthetic blocker must be adjudicated before signing.',
        blocksFinalize: true,
        source: 'deterministic_mock'
      }
    ],
    historyGaps: [
      {
        historyGapQuestionId: `history-gap-${entry.note.noteId}`,
        noteId: entry.note.noteId,
        question: 'Confirm whether the synthetic follow-up history supports the selected diagnosis candidate.',
        supportsItem: 'ICD-10 E11.9 candidate',
        category: 'diagnosis_confidence',
        confidenceImpact: 'high',
        status: 'sent_to_ma',
        blockerEligible: true
      }
    ],
    tasks: [
      {
        taskId: `task-history-gap-${entry.note.noteId}`,
        noteId: entry.note.noteId,
        safePatientId: entry.note.safePatientId,
        title: 'Confirm whether the synthetic follow-up history supports the selected diagnosis candidate.',
        blocksSigning: true,
        adjudicationStatus: 'open',
        ownerRole: 'ma'
      }
    ]
  };
}

function createSuggestions(noteId: string): SuggestionDto[] {
  return [
    {
      suggestionId: 'suggestion-demo-cpt-99214',
      noteId,
      category: 'cpt',
      label: 'CPT 99214 candidate',
      confidence: 0.82,
      rationale: 'Synthetic chronic follow-up complexity signal.',
      supportingEvidence: ['Synthetic medication review'],
      missingEvidence: ['Final MDM support not completed'],
      status: 'candidate',
      lowConfidenceOverrideRequired: false,
      draftOnly: true
    },
    {
      suggestionId: 'suggestion-demo-icd10-e119',
      noteId,
      category: 'icd10',
      label: 'ICD-10 E11.9 candidate',
      confidence: 0.74,
      rationale: 'Synthetic diagnosis candidate below locked 75 percent threshold.',
      supportingEvidence: ['Synthetic historical problem list reference'],
      missingEvidence: ['No confirming assessment text in current draft'],
      status: 'candidate',
      lowConfidenceOverrideRequired: true,
      draftOnly: true
    },
    {
      suggestionId: 'suggestion-demo-quality-bp',
      noteId,
      category: 'quality_measure',
      label: 'Quality measure follow-up candidate',
      confidence: 0.88,
      rationale: 'Synthetic quality review signal.',
      supportingEvidence: ['Synthetic vitals review placeholder'],
      missingEvidence: ['Final plan text not completed'],
      status: 'candidate',
      lowConfidenceOverrideRequired: false,
      draftOnly: true
    }
  ];
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

describe('Prisma review panel runtime persistence', () => {
  let prisma: PrismaClient | undefined;
  let scheduleA: AsyncScheduleStateRepository | undefined;
  let scheduleB: AsyncScheduleStateRepository | undefined;
  let reviewA: AsyncReviewPanelRepository | undefined;
  let reviewB: AsyncReviewPanelRepository | undefined;
  let reviewASecondarySite: AsyncReviewPanelRepository | undefined;

  before(async () => {
    run('docker', ['compose', 'down', '--volumes', '--remove-orphans']);
    run('docker', ['compose', 'up', '--detach', 'postgres']);
    await waitForPostgres();
    applySchema();
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    scheduleA = createPrismaScheduleStateRepository(prisma, { tenantId: tenantA, siteId: sitePrimary });
    scheduleB = createPrismaScheduleStateRepository(prisma, { tenantId: tenantB, siteId: sitePrimary });
    reviewA = createPrismaReviewPanelRepository(prisma, { tenantId: tenantA, siteId: sitePrimary });
    reviewB = createPrismaReviewPanelRepository(prisma, { tenantId: tenantB, siteId: sitePrimary });
    reviewASecondarySite = createPrismaReviewPanelRepository(prisma, { tenantId: tenantA, siteId: siteSecondary });
  });

  after(async () => {
    await prisma?.$disconnect();
    run('docker', ['compose', 'down', '--volumes', '--remove-orphans']);
  });

  it('persists and reloads suggestions, accepted/removed selections, compliance, history gaps, and blocker tasks', async () => {
    const appointment = createStoredAppointment(tenantA, sitePrimary, 'appt-review-001', 'note-review-001');
    const reviewEntry = withReviewPanel(appointment);

    await requireSchedule(scheduleA).saveAppointment(appointment);
    await requireReview(reviewA).saveReviewPanel(reviewEntry);

    const reloaded = await requireReview(reviewA).getByNoteId('note-review-001');
    assert.equal(reloaded?.suggestions.length, 3);
    assert.equal(reloaded?.suggestions.find((suggestion) => suggestion.suggestionId === 'suggestion-demo-icd10-e119')?.status, 'accepted');
    assert.equal(reloaded?.suggestions.find((suggestion) => suggestion.suggestionId === 'suggestion-demo-quality-bp')?.status, 'removed');
    assert.equal(reloaded?.visitSelections.length, 3);
    assert.equal(reloaded?.visitSelections.some((selection) => selection.category === 'plan_item'), true);
    assert.equal(reloaded?.complianceReview.finalizeDisabled, true);
    assert.equal(reloaded?.historyGaps[0]?.status, 'sent_to_ma');
    assert.equal(reloaded?.tasks[0]?.blocksSigning, true);

    await requireReview(reviewA).saveReviewPanel({
      ...reviewEntry,
      tasks: reviewEntry.tasks!.map((task) => ({ ...task, adjudicationStatus: 'answered' })),
      complianceIssues: []
    });
    const adjudicated = await requireReview(reviewA).getByNoteId('note-review-001');
    assert.equal(adjudicated?.tasks[0]?.adjudicationStatus, 'answered');
    assert.equal(adjudicated?.complianceReview.finalizeDisabled, false);
  });

  it('blocks low-confidence diagnosis acceptance without persisted override evidence', async () => {
    const appointment = createStoredAppointment(tenantA, sitePrimary, 'appt-review-low-confidence', 'note-review-low-confidence');
    const reviewEntry = withReviewPanel(appointment);

    await requireSchedule(scheduleA).saveAppointment(appointment);
    await assert.rejects(
      () =>
        requireReview(reviewA).saveReviewPanel({
          ...reviewEntry,
          visitSelections: reviewEntry.visitSelections!.map((selection) => {
            if (selection.sourceSuggestionId !== 'suggestion-demo-icd10-e119') {
              return selection;
            }
            const { overrideReason: _overrideReason, ...selectionWithoutOverride } = selection;
            return selectionWithoutOverride;
          })
        }),
      /low-confidence accepted diagnosis/
    );
    const reloaded = await requireReview(reviewA).getByNoteId('note-review-low-confidence');
    assert.equal(reloaded?.suggestions.length, 0);
    assert.equal(reloaded?.visitSelections.length, 0);
  });

  it('denies cross-tenant and cross-site repository/API-harness reads before DTO exposure', async () => {
    const appointmentA = createStoredAppointment(tenantA, sitePrimary, 'appt-review-shared', 'note-review-shared');
    const appointmentB = createStoredAppointment(tenantB, sitePrimary, 'appt-review-shared', 'note-review-shared');

    await requireSchedule(scheduleA).saveAppointment(appointmentA);
    await requireSchedule(scheduleB).saveAppointment(appointmentB);
    await requireReview(reviewA).saveReviewPanel(withReviewPanel(appointmentA));
    await requireReview(reviewB).saveReviewPanel(withReviewPanel(appointmentB));

    assert.equal((await requireReview(reviewA).getByNoteId('note-review-shared'))?.noteId, 'note-review-shared');
    assert.equal((await requireReview(reviewB).getByNoteId('note-review-shared'))?.noteId, 'note-review-shared');
    assert.equal(await requireReview(reviewASecondarySite).getByNoteId('note-review-shared'), undefined);

    const activePrisma = requirePrisma(prisma);
    const allowed = await getPersistedReviewPanelForAccessContext(activePrisma, accessContext(tenantA, sitePrimary), 'note-review-shared');
    const wrongTenant = await getPersistedReviewPanelForAccessContext(
      activePrisma,
      accessContext(tenantB, siteSecondary),
      'note-review-shared'
    );
    const wrongSite = await getPersistedReviewPanelForAccessContext(activePrisma, accessContext(tenantA, siteSecondary), 'note-review-shared');

    assert.equal(allowed?.suggestions.length, 3);
    assert.equal(wrongTenant, undefined);
    assert.equal(wrongSite, undefined);
  });

  it('enforces review-panel PostgreSQL RLS read, insert, and update policies', async () => {
    const activePrisma = requirePrisma(prisma);
    applyRls();
    await createRlsAppRole(activePrisma);
    const rlsPrisma = new PrismaClient({ datasources: { db: { url: rlsAppDatabaseUrl } } });
    const tenantAUuid = toDeterministicPersistenceUuid('tenant', tenantA);
    const tenantBUuid = toDeterministicPersistenceUuid('tenant', tenantB);
    const siteBUuid = toDeterministicPersistenceUuid('site', tenantB, sitePrimary);
    const noteBUuid = toDeterministicPersistenceUuid('note', tenantB, 'note-review-shared');

    try {
      assert.equal((await countSuggestionsForTenantSession(rlsPrisma, tenantAUuid)) >= 3, true);
      assert.equal(await countSuggestionsForTenantSession(rlsPrisma, tenantBUuid), 3);
      assert.equal(await countSuggestionsWithoutTenantSession(rlsPrisma), 0);
      await assert.rejects(
        () =>
          rlsPrisma.$transaction(async (tx) => {
            await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantAUuid}, true)`;
            await tx.$executeRaw`
              INSERT INTO "Suggestion" (
                "id", "tenantId", "siteId", "noteId", "sourceRef", "category", "label", "confidence", "rationale", "status",
                "lowConfidenceOverrideRequired", "draftOnly"
              ) VALUES (
                CAST(${toDeterministicPersistenceUuid('suggestion', tenantB, 'suggestion-denied')} AS uuid),
                CAST(${tenantBUuid} AS uuid),
                CAST(${siteBUuid} AS uuid),
                CAST(${noteBUuid} AS uuid),
                'suggestion-denied',
                'cpt',
                'Denied cross-tenant suggestion',
                0.9,
                'Synthetic denied insert',
                'candidate',
                false,
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
              UPDATE "Suggestion"
              SET "status" = 'removed'
              WHERE "id" = CAST(${toDeterministicPersistenceUuid('suggestion', tenantB, 'suggestion-demo-cpt-99214')} AS uuid)
            `;
            const rows = await tx.$queryRaw<Array<{ status: string }>>`
              SELECT "status" FROM "Suggestion"
              WHERE "id" = CAST(${toDeterministicPersistenceUuid('suggestion', tenantB, 'suggestion-demo-cpt-99214')} AS uuid)
            `;
            assert.equal(rows.length, 1, 'cross-tenant review-panel update should not expose tenant B rows');
          }),
        /cross-tenant review-panel update should not expose tenant B rows/
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

async function countSuggestionsForTenantSession(prisma: PrismaClient, tenantUuid: string): Promise<number> {
  const rows = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantUuid}, true)`;
    return tx.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS count FROM "Suggestion"`;
  });
  return Number(rows[0]?.count ?? 0n);
}

async function countSuggestionsWithoutTenantSession(prisma: PrismaClient): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*)::bigint AS count FROM "Suggestion"`;
  return Number(rows[0]?.count ?? 0n);
}

function requireSchedule(repository: AsyncScheduleStateRepository | undefined): AsyncScheduleStateRepository {
  if (!repository) {
    throw new Error('Prisma schedule repository was not initialized');
  }
  return repository;
}

function requireReview(repository: AsyncReviewPanelRepository | undefined): AsyncReviewPanelRepository {
  if (!repository) {
    throw new Error('Prisma review panel repository was not initialized');
  }
  return repository;
}

function requirePrisma(prisma: PrismaClient | undefined): PrismaClient {
  if (!prisma) {
    throw new Error('Prisma client was not initialized');
  }
  return prisma;
}

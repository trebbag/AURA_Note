import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { PrismaClient } from '@prisma/client';
import {
  createEventEnvelope,
  type DraftClaimPreviewDto,
  type FinalizationSessionDto,
  type SuggestionDto
} from '@aura-note/contracts';
import {
  createAppointmentLifecycle,
  createRawAudioRetentionMetadata,
  createTranscriptRetentionMetadata,
  startVisitLifecycle
} from '@aura-note/domain';
import type { AccessContext } from '@aura-note/security';
import { createStandalonePatientScheduleScaffold, type StoredAppointment } from './schedule.repository';
import {
  createPrismaCoreWorkflowRuntimeRepository,
  getPersistedCoreWorkflowForAccessContext,
  type AsyncCoreWorkflowRuntimeRepository
} from './runtime-persistence.repository';
import type { RuntimeMetadataSnapshot } from './prisma-runtime-metadata.repository';

const repoRoot = path.resolve(__dirname, '../../../..');
const schemaPath = path.join(repoRoot, 'packages/contracts/prisma/schema.prisma');
const databaseUrl = 'postgresql://aura_note:aura_note@localhost:5432/aura_note_dev';
const tenantA = 'tenant-synthetic-primary';
const tenantB = 'tenant-synthetic-secondary';
const sitePrimary = 'site-synthetic-primary';
const siteSecondary = 'site-synthetic-secondary';
const fixtureTime = '2026-05-27T18:00:00.000Z';

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
  const tmp = mkdtempSync(path.join(tmpdir(), 'aura-note-runtime-persistence-'));
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
    reasonForVisit: 'Synthetic core runtime persistence'
  });

  const appointment: StoredAppointment['appointment'] = {
    appointmentId,
    tenantId,
    siteId,
    safePatientId: `safe-patient-${tenantId}-${siteId}`,
    clinicianId: `clinician-${tenantId}-${siteId}`,
    noteId,
    state: lifecycle.appointmentState,
    startsAt: fixtureTime,
    durationMinutes: 30,
    visitType: 'Primary care follow-up',
    modality: 'in_person',
    source: 'standalone',
    reasonForVisit: 'Synthetic core runtime persistence',
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
    ...createStandalonePatientScheduleScaffold(appointment, note, fixtureTime),
    lifecycle
  };
}

function withVisitCapture(entry: StoredAppointment): StoredAppointment {
  const lifecycle = startVisitLifecycle(entry.lifecycle);
  const transcriptRetention = createTranscriptRetentionMetadata(`transcript-${entry.note.noteId}`, entry.note.noteId);
  const rawAudioRetention = {
    ...createRawAudioRetentionMetadata(`recording-${entry.note.noteId}`, entry.note.noteId, fixtureTime),
    storageProvider: 'in_memory' as const,
    storageKey: `tenants/${entry.appointment.tenantId}/raw-audio/${entry.note.noteId}.metadata.json`,
    checksum: `synthetic-audio-${entry.note.noteId}`,
    contentLengthBytes: 0
  };

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
      startedAt: fixtureTime,
      elapsedSeconds: 0
    },
    rawAudioRetention,
    transcript: {
      noteId: entry.note.noteId,
      transcriptId: transcriptRetention.transcriptId,
      retentionPolicy: transcriptRetention.retentionPolicy,
      segments: [
        {
          transcriptSegmentId: `segment-${entry.note.noteId}-001`,
          noteId: entry.note.noteId,
          sequence: 1,
          speakerRole: 'clinician',
          text: 'Synthetic service-recreation transcript segment.',
          source: 'mock_transcription',
          sourceChunkId: `recording-chunk-${entry.note.noteId}-001`,
          confidence: 0.91,
          createdAt: fixtureTime
        }
      ]
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
        sourceSuggestionId: `suggestion-cpt-${entry.note.noteId}`,
        disposition: 'accepted'
      },
      {
        visitSelectionId: `selection-icd-${entry.note.noteId}`,
        noteId: entry.note.noteId,
        category: 'icd10',
        label: 'ICD-10 E11.9 candidate',
        confidence: 0.74,
        humanApproved: true,
        sourceSuggestionId: `suggestion-icd-${entry.note.noteId}`,
        overrideReason: 'Synthetic override metadata completed for low-confidence diagnosis candidate.',
        disposition: 'accepted'
      }
    ],
    complianceIssues: [],
    historyGaps: [
      {
        historyGapQuestionId: `history-gap-${entry.note.noteId}`,
        noteId: entry.note.noteId,
        question: 'Confirm whether the synthetic history supports selected candidates.',
        supportsItem: 'ICD-10 E11.9 candidate',
        category: 'diagnosis_confidence',
        confidenceImpact: 'high',
        status: 'answered',
        blockerEligible: true
      }
    ],
    tasks: [
      {
        taskId: `task-history-gap-${entry.note.noteId}`,
        noteId: entry.note.noteId,
        safePatientId: entry.note.safePatientId,
        title: 'Confirm whether the synthetic history supports selected candidates.',
        blocksSigning: true,
        adjudicationStatus: 'answered',
        ownerRole: 'ma'
      }
    ]
  };
}

function createSuggestions(noteId: string): SuggestionDto[] {
  return [
    {
      suggestionId: `suggestion-cpt-${noteId}`,
      noteId,
      category: 'cpt',
      label: 'CPT 99214 candidate',
      confidence: 0.82,
      rationale: 'Synthetic chronic follow-up complexity signal.',
      supportingEvidence: ['Synthetic medication review'],
      missingEvidence: ['Final MDM support not completed'],
      humanReviewRequired: true,
      status: 'candidate',
      lowConfidenceOverrideRequired: false,
      draftOnly: true
    },
    {
      suggestionId: `suggestion-icd-${noteId}`,
      noteId,
      category: 'icd10',
      label: 'ICD-10 E11.9 candidate',
      confidence: 0.74,
      rationale: 'Synthetic diagnosis candidate below locked threshold.',
      supportingEvidence: ['Synthetic historical problem list reference'],
      missingEvidence: ['No confirming assessment text in current draft'],
      humanReviewRequired: true,
      status: 'candidate',
      lowConfidenceOverrideRequired: true,
      draftOnly: true
    },
    {
      suggestionId: `suggestion-quality-${noteId}`,
      noteId,
      category: 'quality_measure',
      label: 'Quality measure follow-up candidate',
      confidence: 0.88,
      rationale: 'Synthetic quality review signal.',
      supportingEvidence: ['Synthetic vitals review placeholder'],
      missingEvidence: ['Final plan text not completed'],
      humanReviewRequired: true,
      status: 'candidate',
      lowConfidenceOverrideRequired: false,
      draftOnly: true
    }
  ];
}

function withFinalizationOutput(entry: StoredAppointment): StoredAppointment {
  const finalization = createFinalizationSession(entry);
  return {
    ...entry,
    appointment: { ...entry.appointment, state: 'finalized' },
    note: { ...entry.note, state: 'finalized' },
    lifecycle: {
      ...entry.lifecycle,
      appointmentState: 'finalized',
      noteState: 'finalized',
      noteVisibleInDrafts: false
    },
    finalization,
    finalNote: finalization.finalNote!,
    patientSummary: finalization.patientSummary!,
    draftClaimPreview: finalization.draftClaimPreview!,
    exportArtifacts: finalization.exportArtifacts,
    writeback: finalization.writeback
  };
}

function createFinalizationSession(entry: StoredAppointment): FinalizationSessionDto {
  const finalNoteText = 'Signed synthetic final note. No autonomous diagnosis, charge finalization, or claim submission occurred.';
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
      visitSelections: entry.visitSelections ?? [],
      finalPassSuggestions: [],
      transcriptSegmentCount: entry.transcript?.segments.length ?? 0,
      historyGapQuestionCount: entry.historyGaps?.length ?? 0
    },
    selectionDecisions: (entry.visitSelections ?? []).map((selection) => ({
      visitSelectionId: selection.visitSelectionId,
      decision: 'keep' as const,
      reason: 'Synthetic clinician-reviewed finalization choice.',
      decidedByUserId: entry.appointment.clinicianId,
      decidedAt: fixtureTime
    })),
    suggestionDecisions: [],
    unusedAuditItems: [],
    composePhases: [
      { phase: 'analyzing_content', status: 'completed' },
      { phase: 'enhancing_structure', status: 'completed' },
      { phase: 'beautifying_language', status: 'completed' },
      { phase: 'final_review', status: 'completed' }
    ],
    evidenceSpans: [
      {
        evidenceSpanId: `evidence-${entry.note.noteId}-source`,
        sourceType: 'note_content',
        sourceId: entry.note.noteId,
        sectionId: 'section-note-body',
        quote: 'Synthetic frozen source note.',
        startOffset: 0,
        endOffset: 'Synthetic frozen source note.'.length,
        confidence: 1,
        linkedItemId: entry.note.noteId
      }
    ],
    itemStatuses: (entry.visitSelections ?? []).map((selection) => ({
      itemId: selection.visitSelectionId,
      itemType: 'visit_selection' as const,
      step: 'code_review' as const,
      label: selection.label,
      status: 'kept' as const,
      humanReviewRequired: true as const,
      stillValid: true,
      evidenceSpanIds: [`evidence-${entry.note.noteId}-source`],
      updatedAt: fixtureTime
    })),
    editorVariants: [
      {
        variantId: `editor-original-${entry.note.noteId}`,
        variantType: 'original_note',
        status: 'read_only',
        text: 'Synthetic frozen source note.',
        version: 1,
        approvalRequired: false,
        approved: true,
        patientFacing: false,
        internalDetailsExcluded: false,
        evidenceSpanIds: [`evidence-${entry.note.noteId}-source`],
        lastEditedAt: fixtureTime
      },
      {
        variantId: `editor-enhanced-${entry.note.noteId}`,
        variantType: 'enhanced_note',
        status: 'read_only',
        text: finalNoteText,
        version: 1,
        approvalRequired: true,
        approved: true,
        patientFacing: false,
        internalDetailsExcluded: false,
        evidenceSpanIds: [`evidence-${entry.note.noteId}-source`],
        lastEditedAt: fixtureTime
      },
      {
        variantId: `editor-summary-${entry.note.noteId}`,
        variantType: 'patient_summary',
        status: 'read_only',
        text: patientSummaryText,
        version: 1,
        approvalRequired: true,
        approved: true,
        patientFacing: true,
        internalDetailsExcluded: true,
        evidenceSpanIds: [`evidence-${entry.note.noteId}-source`],
        lastEditedAt: fixtureTime
      }
    ],
    patientQuestions: [],
    carePlanItems: [
      {
        carePlanItemId: `care-plan-${entry.note.noteId}`,
        noteId: entry.note.noteId,
        source: 'clinician_added',
        title: 'Confirm follow-up plan',
        detail: 'Synthetic care-plan item remains human-review-required.',
        status: 'accepted',
        ownerRole: 'clinician',
        dueWindow: 'next_visit',
        insertionEligibility: 'eligible_after_clinician_review',
        humanReviewRequired: true,
        evidenceSpanIds: [`evidence-${entry.note.noteId}-source`]
      }
    ],
    patientInsightSnapshot: {
      patientInsightSnapshotId: `patient-insight-${entry.note.noteId}`,
      noteId: entry.note.noteId,
      sourceFreshness: 'unknown',
      allergySummaryStatus: 'unavailable',
      careTeamSummaryStatus: 'unavailable',
      riskStratificationStatus: 'unavailable',
      predictiveInsightsEnabled: false,
      staleWarnings: ['Synthetic persisted fixture has no live chart context.'],
      generatedAt: fixtureTime
    },
    billingValidation: [
      {
        billingValidationId: `billing-validation-${entry.note.noteId}`,
        status: 'ready',
        severity: 'info',
        message: 'Draft claim preview persisted with submittedClaim=false.',
        blocksSignDispatch: false,
        evidenceSpanIds: [`evidence-${entry.note.noteId}-source`]
      }
    ],
    dispatchMetadata: {
      submittedClaim: false,
      patientPortalDeliveryEnabled: false,
      ehrWritebackConfigured: true,
      exportReady: true,
      finalNoteReadOnly: true,
      patientSummaryInternalDetailsExcluded: true,
      dispatchStatus: 'signed_dispatched'
    },
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
    patientOpportunities: [],
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
        signedDownloadExpiresAt: '2026-05-27T18:15:00.000Z'
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

function createRuntimeMetadata(entry: StoredAppointment): RuntimeMetadataSnapshot {
  return {
    tenantId: entry.appointment.tenantId,
    siteId: entry.appointment.siteId,
    auditEvents: [
      {
        auditEventId: `audit-runtime-${entry.note.noteId}`,
        tenantId: entry.appointment.tenantId,
        siteId: entry.appointment.siteId,
        actorUserId: entry.appointment.clinicianId,
        action: 'runtime.core_workflow_persist',
        entityType: 'Note',
        entityId: entry.note.noteId,
        traceId: `trace-runtime-${entry.note.noteId}`,
        createdAt: fixtureTime
      }
    ],
    domainEvents: [
      createEventEnvelope({
        eventId: `event-runtime-${entry.note.noteId}`,
        eventType: 'note.signed.v1',
        tenantId: entry.appointment.tenantId,
        siteId: entry.appointment.siteId,
        appointmentId: entry.appointment.appointmentId,
        noteId: entry.note.noteId,
        ...(entry.visitSession ? { visitSessionId: entry.visitSession.visitSessionId } : {}),
        producer: 'aura-note-api',
        traceId: `trace-runtime-${entry.note.noteId}`,
        idempotencyKey: `idem-runtime-${entry.note.noteId}`,
        sensitivity: 'phi_reference',
        retentionClass: 'audit',
        payload: {
          signedAndDispatched: true,
          submittedClaim: false,
          productionPhiStorageApproved: false
        }
      })
    ],
    featureFlags: [],
    templates: [],
    dotPhrases: [],
    coachingReports: [],
    integrationConnections: [],
    modeMappings: []
  };
}

function accessContext(tenantId: string, siteId: string, role: AccessContext['role'] = 'clinician'): AccessContext {
  return {
    role,
    tenantId,
    siteId,
    actorUserId: `user-${tenantId}-${siteId}`,
    linkedToPatient: true,
    linkedToVisit: true,
    treatingClinician: role === 'clinician',
    billingReviewTriggered: role === 'billing_staff',
    authorizedAdmin: role === 'authorized_admin'
  };
}

describe('Core workflow runtime persistence switchover', () => {
  let prisma: PrismaClient | undefined;
  let runtimeA: AsyncCoreWorkflowRuntimeRepository | undefined;
  let runtimeB: AsyncCoreWorkflowRuntimeRepository | undefined;
  let runtimeASecondarySite: AsyncCoreWorkflowRuntimeRepository | undefined;

  before(async () => {
    run('docker', ['compose', 'down', '--volumes', '--remove-orphans']);
    run('docker', ['compose', 'up', '--detach', 'postgres']);
    await waitForPostgres();
    applySchema();
    prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    runtimeA = createPrismaCoreWorkflowRuntimeRepository(prisma, { tenantId: tenantA, siteId: sitePrimary });
    runtimeB = createPrismaCoreWorkflowRuntimeRepository(prisma, { tenantId: tenantB, siteId: sitePrimary });
    runtimeASecondarySite = createPrismaCoreWorkflowRuntimeRepository(prisma, { tenantId: tenantA, siteId: siteSecondary });
  });

  after(async () => {
    await prisma?.$disconnect();
    run('docker', ['compose', 'down', '--volumes', '--remove-orphans']);
  });

  it('persists appointment, visit, selections, finalization, export, audit, and domain evidence across fresh repository instances', async () => {
    const entry = withFinalizationOutput(
      withReviewPanel(withVisitCapture(createStoredAppointment(tenantA, sitePrimary, 'appt-runtime-001', 'note-runtime-001')))
    );
    await requireRuntime(runtimeA).saveCoreWorkflow(entry, createRuntimeMetadata(entry));

    const freshPrisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    try {
      const freshRuntime = createPrismaCoreWorkflowRuntimeRepository(freshPrisma, {
        tenantId: tenantA,
        siteId: sitePrimary
      });
      const reloaded = await freshRuntime.getByAppointmentId('appt-runtime-001');

      assert.equal(reloaded?.appointment.note.noteId, 'note-runtime-001');
      assert.equal(reloaded?.visitCapture?.visitSession.timerState, 'running');
      assert.equal(reloaded?.visitCapture?.transcript?.segments.length, 1);
      assert.equal(reloaded?.reviewPanel?.visitSelections.some((selection) => selection.category === 'icd10'), true);
      assert.equal(reloaded?.reviewPanel?.tasks[0]?.adjudicationStatus, 'answered');
      assert.equal(reloaded?.finalizationOutput?.finalization?.signedAndDispatched, true);
      assert.equal(reloaded?.finalizationOutput?.draftClaimPreview?.submittedClaim, false);
      assert.equal(reloaded?.finalizationOutput?.exportArtifacts[0]?.deliveryMode, 'storage_backed');
      assert.equal(reloaded?.runtimeMetadata.auditEvents[0]?.action, 'runtime.core_workflow_persist');
      assert.equal(reloaded?.runtimeMetadata.domainEvents[0]?.eventType, 'note.signed.v1');
    } finally {
      await freshPrisma.$disconnect();
    }
  });

  it('denies cross-tenant and cross-site persisted workflow reads before DTO exposure', async () => {
    const entryA = withFinalizationOutput(
      withReviewPanel(withVisitCapture(createStoredAppointment(tenantA, sitePrimary, 'appt-runtime-shared', 'note-runtime-shared')))
    );
    const entryB = withFinalizationOutput(
      withReviewPanel(withVisitCapture(createStoredAppointment(tenantB, sitePrimary, 'appt-runtime-shared', 'note-runtime-shared')))
    );

    await requireRuntime(runtimeA).saveCoreWorkflow(entryA, createRuntimeMetadata(entryA));
    await requireRuntime(runtimeB).saveCoreWorkflow(entryB, createRuntimeMetadata(entryB));

    assert.equal((await requireRuntime(runtimeA).getByAppointmentId('appt-runtime-shared'))?.appointment.note.noteId, 'note-runtime-shared');
    assert.equal((await requireRuntime(runtimeB).getByAppointmentId('appt-runtime-shared'))?.appointment.note.noteId, 'note-runtime-shared');
    assert.equal(await requireRuntime(runtimeASecondarySite).getByAppointmentId('appt-runtime-shared'), undefined);

    const activePrisma = requirePrisma(prisma);
    const allowed = await getPersistedCoreWorkflowForAccessContext(
      activePrisma,
      accessContext(tenantA, sitePrimary),
      'appt-runtime-shared'
    );
    const wrongTenant = await getPersistedCoreWorkflowForAccessContext(
      activePrisma,
      accessContext(tenantB, siteSecondary),
      'appt-runtime-shared'
    );
    const wrongSite = await getPersistedCoreWorkflowForAccessContext(
      activePrisma,
      accessContext(tenantA, siteSecondary),
      'appt-runtime-shared'
    );

    assert.equal(allowed?.finalizationOutput?.finalization?.signedAndDispatched, true);
    assert.equal(wrongTenant, undefined);
    assert.equal(wrongSite, undefined);
  });
});

function requireRuntime(repository: AsyncCoreWorkflowRuntimeRepository | undefined): AsyncCoreWorkflowRuntimeRepository {
  if (!repository) {
    throw new Error('runtime repository not initialized');
  }
  return repository;
}

function requirePrisma(prisma: PrismaClient | undefined): PrismaClient {
  if (!prisma) {
    throw new Error('Prisma client not initialized');
  }
  return prisma;
}

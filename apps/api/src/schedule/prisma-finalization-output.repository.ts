import { Prisma, type PrismaClient } from '@prisma/client';
import type {
  BillingAttestationDto,
  DraftClaimPreviewDto,
  EhrWritebackQueueDto,
  ExportArtifactDto,
  FinalNoteRecordDto,
  FinalizationComposeOutputDto,
  FinalizationSelectionDecisionDto,
  FinalizationSessionDto,
  FinalizationSuggestionDecisionDto,
  PatientSummaryRecordDto
} from '@aura-note/contracts';
import { toDeterministicPersistenceUuid } from '@aura-note/persistence';
import type { AccessContext } from '@aura-note/security';
import type { StoredAppointment } from './schedule.repository';

type TransactionClient = Prisma.TransactionClient;

type FinalizationOutputRecord = Prisma.NoteGetPayload<{
  include: {
    patient: true;
    appointment: true;
    finalizationRuns: {
      include: {
        wizardStepDecisions: true;
        enhancedNoteVersions: true;
        patientSummaryVersions: true;
        billingAttestations: true;
        draftClaimPreviews: true;
      };
    };
    exportArtifacts: true;
    ehrWritebackJobs: true;
  };
}>;

export interface FinalizationOutputSnapshot {
  noteId: string;
  finalization?: FinalizationSessionDto;
  finalNote?: FinalNoteRecordDto;
  patientSummary?: PatientSummaryRecordDto;
  draftClaimPreview?: DraftClaimPreviewDto;
  exportArtifacts: ExportArtifactDto[];
  writeback?: EhrWritebackQueueDto;
}

export interface AsyncFinalizationOutputRepository {
  saveFinalizationOutput(entry: StoredAppointment): Promise<void>;
  getByNoteId(noteId: string): Promise<FinalizationOutputSnapshot | undefined>;
}

export interface PrismaFinalizationOutputRepositoryOptions {
  tenantId: string;
  siteId?: string;
}

export function createPrismaFinalizationOutputRepository(
  prisma: PrismaClient,
  options: PrismaFinalizationOutputRepositoryOptions
): AsyncFinalizationOutputRepository {
  return new PrismaFinalizationOutputRepository(prisma, options);
}

export class PrismaFinalizationOutputRepository implements AsyncFinalizationOutputRepository {
  private readonly tenantUuid: string;
  private readonly siteUuid: string | undefined;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly options: PrismaFinalizationOutputRepositoryOptions
  ) {
    this.tenantUuid = toDeterministicPersistenceUuid('tenant', options.tenantId);
    this.siteUuid = options.siteId ? toDeterministicPersistenceUuid('site', options.tenantId, options.siteId) : undefined;
  }

  async saveFinalizationOutput(entry: StoredAppointment): Promise<void> {
    this.assertScopeMatchesEntry(entry);
    this.assertNoSubmittedClaim(entry);

    await this.prisma.$transaction(async (tx) => {
      const note = await this.getScopedNote(tx, entry.note.noteId);
      if (!note) {
        throw new Error('finalization output persistence requires an existing scoped note');
      }

      if (entry.finalization) {
        const finalizationRun = await this.syncFinalizationRun(tx, note.id, note.siteId, entry);
        await this.syncWizardStepDecisions(tx, note.id, note.siteId, finalizationRun.id, entry.finalization);
        await this.syncEnhancedNoteVersion(tx, note.id, note.siteId, finalizationRun.id, entry.finalization);
        await this.syncPatientSummaryVersion(tx, note.id, note.siteId, finalizationRun.id, entry.finalization);
        await this.syncBillingAttestation(tx, note.id, note.siteId, finalizationRun.id, entry.finalization);
        await this.syncDraftClaimPreview(tx, note.id, note.siteId, finalizationRun.id, entry.finalization.draftClaimPreview ?? entry.draftClaimPreview);
      }

      await this.syncExportArtifacts(tx, note.id, note.siteId, entry.finalization?.exportArtifacts ?? entry.exportArtifacts ?? []);
      await this.syncWriteback(tx, note.id, note.siteId, entry.finalization?.writeback ?? entry.writeback);
    });
  }

  async getByNoteId(noteId: string): Promise<FinalizationOutputSnapshot | undefined> {
    const note = await this.prisma.note.findFirst({
      where: {
        ...this.scopedNoteWhere(),
        OR: [{ id: this.toNoteUuid(noteId) }, { sourceRef: noteId }]
      },
      include: this.includeFinalizationOutput()
    });

    return note ? this.toSnapshot(note) : undefined;
  }

  private async syncFinalizationRun(
    tx: TransactionClient,
    noteId: string,
    siteId: string,
    entry: StoredAppointment & { finalization?: FinalizationSessionDto }
  ) {
    const session = entry.finalization;
    if (!session) {
      throw new Error('finalization run persistence requires finalization session DTO');
    }

    return tx.finalizationRun.upsert({
      where: {
        tenantId_sourceRef: {
          tenantId: this.tenantUuid,
          sourceRef: session.finalizationSessionId
        }
      },
      create: {
        id: this.toFinalizationRunUuid(session.finalizationSessionId),
        tenantId: this.tenantUuid,
        siteId,
        noteId,
        sourceRef: session.finalizationSessionId,
        appointmentSourceRef: session.appointmentId,
        currentStep: session.currentStep,
        completedStepsJson: jsonInput(session.completedSteps),
        stepStatusesJson: jsonInput(session.stepStatuses),
        frozenSnapshotJson: jsonInput(session.frozenSnapshot),
        selectionDecisionsJson: jsonInput(session.selectionDecisions),
        suggestionDecisionsJson: jsonInput(session.suggestionDecisions),
        unusedAuditItemsJson: jsonInput(session.unusedAuditItems),
        composePhasesJson: jsonInput(session.composePhases),
        composeOutputJson: nullableJsonInput(session.composeOutput),
        patientOpportunitiesJson: jsonInput(session.patientOpportunities),
        finalNoteApproved: session.finalNoteApproved,
        patientSummaryApproved: session.patientSummaryApproved,
        readyForBillingAttest: session.readyForBillingAttest,
        billingAttested: session.billingAttested,
        signedAndDispatched: session.signedAndDispatched,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt)
      },
      update: {
        siteId,
        noteId,
        appointmentSourceRef: session.appointmentId,
        currentStep: session.currentStep,
        completedStepsJson: jsonInput(session.completedSteps),
        stepStatusesJson: jsonInput(session.stepStatuses),
        frozenSnapshotJson: jsonInput(session.frozenSnapshot),
        selectionDecisionsJson: jsonInput(session.selectionDecisions),
        suggestionDecisionsJson: jsonInput(session.suggestionDecisions),
        unusedAuditItemsJson: jsonInput(session.unusedAuditItems),
        composePhasesJson: jsonInput(session.composePhases),
        composeOutputJson: nullableJsonInput(session.composeOutput),
        patientOpportunitiesJson: jsonInput(session.patientOpportunities),
        finalNoteApproved: session.finalNoteApproved,
        patientSummaryApproved: session.patientSummaryApproved,
        readyForBillingAttest: session.readyForBillingAttest,
        billingAttested: session.billingAttested,
        signedAndDispatched: session.signedAndDispatched,
        updatedAt: new Date(session.updatedAt)
      }
    });
  }

  private async syncWizardStepDecisions(
    tx: TransactionClient,
    noteId: string,
    siteId: string,
    finalizationRunId: string,
    session: FinalizationSessionDto
  ): Promise<void> {
    const decisions = [...session.selectionDecisions.map(toSelectionDecisionRecord), ...session.suggestionDecisions.map(toSuggestionDecisionRecord)];
    const decisionIds = decisions.map((decision) => this.toWizardDecisionUuid(decision.sourceRef));
    await tx.wizardStepDecision.deleteMany({
      where: {
        tenantId: this.tenantUuid,
        finalizationRunId,
        ...(decisionIds.length > 0 ? { id: { notIn: decisionIds } } : {})
      }
    });

    for (const decision of decisions) {
      await tx.wizardStepDecision.upsert({
        where: {
          tenantId_sourceRef: {
            tenantId: this.tenantUuid,
            sourceRef: decision.sourceRef
          }
        },
        create: {
          id: this.toWizardDecisionUuid(decision.sourceRef),
          tenantId: this.tenantUuid,
          siteId,
          noteId,
          finalizationRunId,
          sourceRef: decision.sourceRef,
          step: decision.step,
          targetType: decision.targetType,
          targetId: decision.targetId,
          decision: decision.decision,
          reason: decision.reason ?? null,
          actorUserId: null,
          createdAt: new Date(decision.decidedAt)
        },
        update: {
          siteId,
          noteId,
          finalizationRunId,
          step: decision.step,
          targetType: decision.targetType,
          targetId: decision.targetId,
          decision: decision.decision,
          reason: decision.reason ?? null
        }
      });
    }
  }

  private async syncEnhancedNoteVersion(
    tx: TransactionClient,
    noteId: string,
    siteId: string,
    finalizationRunId: string,
    session: FinalizationSessionDto
  ): Promise<void> {
    if (!session.composeOutput && !session.finalNote) {
      return;
    }

    const output = session.composeOutput;
    const sourceRef = output?.composeOutputId ?? session.finalNote?.finalNoteId;
    const text = output?.enhancedNoteText ?? session.finalNote?.finalNoteText;
    if (!sourceRef || !text) {
      return;
    }
    const existing = await tx.enhancedNoteVersion.findUnique({
      where: {
        tenantId_sourceRef: {
          tenantId: this.tenantUuid,
          sourceRef
        }
      }
    });
    this.assertSignedTextIsImmutable(existing, text, 'final note');

    await tx.enhancedNoteVersion.upsert({
      where: {
        tenantId_sourceRef: {
          tenantId: this.tenantUuid,
          sourceRef
        }
      },
      create: {
        id: this.toEnhancedNoteVersionUuid(sourceRef),
        tenantId: this.tenantUuid,
        siteId,
        noteId,
        finalizationRunId,
        sourceRef,
        version: output?.version ?? 1,
        text,
        payerReadableSupportSection: output?.payerReadableSupportSection ?? null,
        planTaskMappingJson: jsonInput(output?.planTaskMapping ?? []),
        sourceIntegrityWarningsJson: jsonInput(output?.sourceIntegrityWarnings ?? []),
        patientSummaryInternalDetailsDetected: output?.patientSummaryInternalDetailsDetected ?? false,
        staleDueToEdit: output?.staleDueToEdit ?? false,
        draftOnly: output?.draftOnly ?? false,
        finalNoteRecordJson: nullableJsonInput(session.finalNote),
        approved: session.finalNoteApproved || Boolean(session.finalNote),
        approvedById: null,
        approvedAt: session.finalNote ? new Date(session.finalNote.finalizedAt) : null,
        createdAt: new Date(output?.generatedAt ?? session.updatedAt)
      },
      update: {
        siteId,
        noteId,
        finalizationRunId,
        version: output?.version ?? 1,
        text,
        payerReadableSupportSection: output?.payerReadableSupportSection ?? null,
        planTaskMappingJson: jsonInput(output?.planTaskMapping ?? []),
        sourceIntegrityWarningsJson: jsonInput(output?.sourceIntegrityWarnings ?? []),
        patientSummaryInternalDetailsDetected: output?.patientSummaryInternalDetailsDetected ?? false,
        staleDueToEdit: output?.staleDueToEdit ?? false,
        draftOnly: output?.draftOnly ?? false,
        finalNoteRecordJson: nullableJsonInput(session.finalNote),
        approved: session.finalNoteApproved || Boolean(session.finalNote),
        approvedAt: session.finalNote ? new Date(session.finalNote.finalizedAt) : null
      }
    });
  }

  private async syncPatientSummaryVersion(
    tx: TransactionClient,
    noteId: string,
    siteId: string,
    finalizationRunId: string,
    session: FinalizationSessionDto
  ): Promise<void> {
    if (!session.composeOutput && !session.patientSummary) {
      return;
    }

    const output = session.composeOutput;
    const sourceRef = session.patientSummary?.patientSummaryId ?? (output ? `${output.composeOutputId}:patient-summary` : undefined);
    const text = session.patientSummary?.patientSummaryText ?? output?.patientSummaryText;
    if (!sourceRef || !text) {
      return;
    }
    const existing = await tx.patientSummaryVersion.findUnique({
      where: {
        tenantId_sourceRef: {
          tenantId: this.tenantUuid,
          sourceRef
        }
      }
    });
    this.assertSignedTextIsImmutable(existing, text, 'patient summary');

    await tx.patientSummaryVersion.upsert({
      where: {
        tenantId_sourceRef: {
          tenantId: this.tenantUuid,
          sourceRef
        }
      },
      create: {
        id: this.toPatientSummaryVersionUuid(sourceRef),
        tenantId: this.tenantUuid,
        siteId,
        noteId,
        finalizationRunId,
        sourceRef,
        version: output?.version ?? 1,
        text,
        patientFacing: session.patientSummary?.patientFacing ?? true,
        internalDetailsExcluded: session.patientSummary?.internalBillingDetailsExcluded ?? true,
        patientSummaryRecordJson: nullableJsonInput(session.patientSummary),
        approved: session.patientSummaryApproved || Boolean(session.patientSummary),
        approvedById: null,
        approvedAt: session.patientSummary ? new Date(session.patientSummary.finalizedAt) : null,
        createdAt: new Date(output?.generatedAt ?? session.updatedAt)
      },
      update: {
        siteId,
        noteId,
        finalizationRunId,
        version: output?.version ?? 1,
        text,
        patientFacing: session.patientSummary?.patientFacing ?? true,
        internalDetailsExcluded: session.patientSummary?.internalBillingDetailsExcluded ?? true,
        patientSummaryRecordJson: nullableJsonInput(session.patientSummary),
        approved: session.patientSummaryApproved || Boolean(session.patientSummary),
        approvedAt: session.patientSummary ? new Date(session.patientSummary.finalizedAt) : null
      }
    });
  }

  private async syncBillingAttestation(
    tx: TransactionClient,
    noteId: string,
    siteId: string,
    finalizationRunId: string,
    session: FinalizationSessionDto
  ): Promise<void> {
    const attestation = session.billingAttestation;
    if (!attestation) {
      return;
    }

    await tx.billingAttestation.upsert({
      where: {
        tenantId_sourceRef: {
          tenantId: this.tenantUuid,
          sourceRef: attestation.billingAttestationId
        }
      },
      create: {
        id: this.toBillingAttestationUuid(attestation.billingAttestationId),
        tenantId: this.tenantUuid,
        siteId,
        noteId,
        finalizationRunId,
        sourceRef: attestation.billingAttestationId,
        requiredStatementsJson: jsonInput(attestation.requiredStatements),
        acceptedStatementsJson: jsonInput(attestation.acceptedStatements),
        estimateCaveatAcknowledged: attestation.estimateCaveatAcknowledged,
        routeToBillingReview: attestation.billingReviewTriggered,
        attestedById: null,
        attestedAt: new Date(attestation.attestedAt)
      },
      update: {
        siteId,
        noteId,
        finalizationRunId,
        requiredStatementsJson: jsonInput(attestation.requiredStatements),
        acceptedStatementsJson: jsonInput(attestation.acceptedStatements),
        estimateCaveatAcknowledged: attestation.estimateCaveatAcknowledged,
        routeToBillingReview: attestation.billingReviewTriggered
      }
    });
  }

  private async syncDraftClaimPreview(
    tx: TransactionClient,
    noteId: string,
    siteId: string,
    finalizationRunId: string,
    preview: DraftClaimPreviewDto | undefined
  ): Promise<void> {
    if (!preview) {
      return;
    }
    if (preview.submittedClaim) {
      throw new Error('finalization output persistence rejects submitted claims');
    }

    await tx.draftClaimPreview.upsert({
      where: {
        tenantId_sourceRef: {
          tenantId: this.tenantUuid,
          sourceRef: preview.draftClaimPreviewId
        }
      },
      create: {
        id: this.toDraftClaimPreviewUuid(preview.draftClaimPreviewId),
        tenantId: this.tenantUuid,
        siteId,
        noteId,
        finalizationRunId,
        sourceRef: preview.draftClaimPreviewId,
        status: preview.status,
        submittedClaim: false,
        payloadJson: jsonInput(preview),
        generatedById: null,
        generatedAt: new Date(`${preview.encounterDate}T00:00:00.000Z`)
      },
      update: {
        siteId,
        noteId,
        finalizationRunId,
        status: preview.status,
        submittedClaim: false,
        payloadJson: jsonInput(preview)
      }
    });
  }

  private async syncExportArtifacts(
    tx: TransactionClient,
    noteId: string,
    siteId: string,
    artifacts: ExportArtifactDto[]
  ): Promise<void> {
    const artifactIds = artifacts.map((artifact) => this.toExportArtifactUuid(artifact.exportArtifactId));
    await tx.exportArtifact.deleteMany({
      where: {
        tenantId: this.tenantUuid,
        noteId,
        ...(artifactIds.length > 0 ? { id: { notIn: artifactIds } } : {})
      }
    });

    for (const artifact of artifacts) {
      const existing = await tx.exportArtifact.findUnique({
        where: {
          tenantId_sourceRef: {
            tenantId: this.tenantUuid,
            sourceRef: artifact.exportArtifactId
          }
        }
      });
      this.assertSignedArtifactIsImmutable(existing, artifact);

      await tx.exportArtifact.upsert({
        where: {
          tenantId_sourceRef: {
            tenantId: this.tenantUuid,
            sourceRef: artifact.exportArtifactId
          }
        },
        create: {
          id: this.toExportArtifactUuid(artifact.exportArtifactId),
          tenantId: this.tenantUuid,
          siteId,
          noteId,
          sourceRef: artifact.exportArtifactId,
          artifactType: artifact.artifactType,
          status: artifact.status,
          mimeType: artifact.mimeType,
          fileName: artifact.fileName,
          storageKey: artifact.storageKey ?? null,
          checksum: artifact.checksum,
          contentLengthBytes: artifact.contentLengthBytes ?? null,
          deliveryMode: artifact.deliveryMode ?? null,
          storageProvider: artifact.storageProvider ?? null,
          signedDownloadAvailable: artifact.signedDownloadAvailable ?? false,
          signedDownloadExpiresAt: artifact.signedDownloadExpiresAt ? new Date(artifact.signedDownloadExpiresAt) : null,
          content: artifact.content,
          sourceFinalizedAt: new Date(artifact.sourceFinalizedAt),
          signedVersionLocked: artifact.signedVersionLocked,
          retentionClass: artifact.retentionClass ?? 'standard',
          generatedById: null,
          generatedAt: new Date(artifact.generatedAt),
          metadataJson: jsonInput(artifact)
        },
        update: {
          siteId,
          noteId,
          artifactType: artifact.artifactType,
          status: artifact.status,
          mimeType: artifact.mimeType,
          fileName: artifact.fileName,
          storageKey: artifact.storageKey ?? null,
          checksum: artifact.checksum,
          contentLengthBytes: artifact.contentLengthBytes ?? null,
          deliveryMode: artifact.deliveryMode ?? null,
          storageProvider: artifact.storageProvider ?? null,
          signedDownloadAvailable: artifact.signedDownloadAvailable ?? false,
          signedDownloadExpiresAt: artifact.signedDownloadExpiresAt ? new Date(artifact.signedDownloadExpiresAt) : null,
          content: artifact.content,
          sourceFinalizedAt: new Date(artifact.sourceFinalizedAt),
          signedVersionLocked: artifact.signedVersionLocked,
          retentionClass: artifact.retentionClass ?? 'standard',
          metadataJson: jsonInput(artifact)
        }
      });
    }
  }

  private async syncWriteback(
    tx: TransactionClient,
    noteId: string,
    siteId: string,
    writeback: EhrWritebackQueueDto | undefined
  ): Promise<void> {
    if (!writeback) {
      return;
    }

    await tx.ehrWritebackJob.upsert({
      where: {
        tenantId_sourceRef: {
          tenantId: this.tenantUuid,
          sourceRef: writeback.writebackJobId
        }
      },
      create: {
        id: this.toWritebackUuid(writeback.writebackJobId),
        tenantId: this.tenantUuid,
        siteId,
        noteId,
        sourceRef: writeback.writebackJobId,
        target: writeback.target,
        vendor: writeback.vendor,
        status: writeback.status,
        configured: writeback.configured,
        humanApproved: writeback.humanApproved,
        retryable: writeback.retryable,
        externalJobId: writeback.externalJobId ?? null,
        failureReason: writeback.failureReason ?? null,
        queuedAt: writeback.queuedAt ? new Date(writeback.queuedAt) : null,
        failedAt: writeback.failedAt ? new Date(writeback.failedAt) : null
      },
      update: {
        siteId,
        noteId,
        target: writeback.target,
        vendor: writeback.vendor,
        status: writeback.status,
        configured: writeback.configured,
        humanApproved: writeback.humanApproved,
        retryable: writeback.retryable,
        externalJobId: writeback.externalJobId ?? null,
        failureReason: writeback.failureReason ?? null,
        queuedAt: writeback.queuedAt ? new Date(writeback.queuedAt) : null,
        failedAt: writeback.failedAt ? new Date(writeback.failedAt) : null
      }
    });
  }

  private toSnapshot(record: FinalizationOutputRecord): FinalizationOutputSnapshot {
    const noteId = record.sourceRef ?? record.id;
    const finalizationRun = record.finalizationRuns.sort(byUpdatedAt).at(-1);
    const exportArtifacts = record.exportArtifacts.sort(byGeneratedAt).map(toExportArtifactDto);
    const writeback = record.ehrWritebackJobs.sort(byUpdatedAt).at(-1);
    const finalNote = finalizationRun?.enhancedNoteVersions.sort(byCreatedAt).at(-1);
    const patientSummary = finalizationRun?.patientSummaryVersions.sort(byCreatedAt).at(-1);
    const draftClaimPreview = finalizationRun?.draftClaimPreviews.sort(byGeneratedAt).at(-1);
    const billingAttestation = finalizationRun?.billingAttestations.sort(byAttestedAt).at(-1);
    const finalization = finalizationRun
      ? this.toFinalizationSessionDto({
          record,
          finalizationRun,
          exportArtifacts,
          writeback,
          finalNote,
          patientSummary,
          draftClaimPreview,
          billingAttestation
        })
      : undefined;

    return {
      noteId,
      ...(finalization ? { finalization } : {}),
      ...(finalNote ? { finalNote: toFinalNoteRecordDto(finalNote, record, noteId) } : {}),
      ...(patientSummary ? { patientSummary: toPatientSummaryRecordDto(patientSummary, noteId) } : {}),
      ...(draftClaimPreview ? { draftClaimPreview: toDraftClaimPreviewDto(draftClaimPreview) } : {}),
      exportArtifacts,
      ...(writeback ? { writeback: toWritebackDto(writeback, noteId) } : {})
    };
  }

  private toFinalizationSessionDto(input: {
    record: FinalizationOutputRecord;
    finalizationRun: FinalizationOutputRecord['finalizationRuns'][number];
    exportArtifacts: ExportArtifactDto[];
    writeback: FinalizationOutputRecord['ehrWritebackJobs'][number] | undefined;
    finalNote: FinalizationOutputRecord['finalizationRuns'][number]['enhancedNoteVersions'][number] | undefined;
    patientSummary: FinalizationOutputRecord['finalizationRuns'][number]['patientSummaryVersions'][number] | undefined;
    draftClaimPreview: FinalizationOutputRecord['finalizationRuns'][number]['draftClaimPreviews'][number] | undefined;
    billingAttestation: FinalizationOutputRecord['finalizationRuns'][number]['billingAttestations'][number] | undefined;
  }): FinalizationSessionDto {
    const noteId = input.record.sourceRef ?? input.record.id;
    const finalNote = input.finalNote ? toFinalNoteRecordDto(input.finalNote, input.record, noteId) : undefined;
    const patientSummary = input.patientSummary ? toPatientSummaryRecordDto(input.patientSummary, noteId) : undefined;
    const draftClaimPreview = input.draftClaimPreview ? toDraftClaimPreviewDto(input.draftClaimPreview) : undefined;
    const writeback: EhrWritebackQueueDto = input.writeback
      ? toWritebackDto(input.writeback, noteId)
      : {
          writebackJobId: `writeback-disabled-${noteId}`,
          noteId,
          target: 'final_note' as const,
          vendor: 'athenahealth' as const,
          status: 'disabled' as const,
          configured: false,
          humanApproved: false,
          retryable: false
        };
    const composeOutput = jsonObject<FinalizationComposeOutputDto>(input.finalizationRun.composeOutputJson);

    return {
      finalizationSessionId: input.finalizationRun.sourceRef,
      noteId,
      appointmentId: input.finalizationRun.appointmentSourceRef ?? input.record.appointment.sourceRef ?? input.record.appointment.id,
      currentStep: toWizardStep(input.finalizationRun.currentStep),
      completedSteps: jsonStringArray(input.finalizationRun.completedStepsJson).map(toWizardStep),
      stepStatuses: jsonRecord(input.finalizationRun.stepStatusesJson) as FinalizationSessionDto['stepStatuses'],
      frozenSnapshot: jsonObject<FinalizationSessionDto['frozenSnapshot']>(input.finalizationRun.frozenSnapshotJson) ?? {
        originalNoteText: '',
        visitSelections: [],
        finalPassSuggestions: [],
        transcriptSegmentCount: 0,
        historyGapQuestionCount: 0
      },
      selectionDecisions: jsonArray<FinalizationSelectionDecisionDto>(input.finalizationRun.selectionDecisionsJson),
      suggestionDecisions: jsonArray<FinalizationSuggestionDecisionDto>(input.finalizationRun.suggestionDecisionsJson),
      unusedAuditItems: jsonArray(input.finalizationRun.unusedAuditItemsJson),
      composePhases: jsonArray(input.finalizationRun.composePhasesJson),
      evidenceSpans: [],
      itemStatuses: [],
      editorVariants: [],
      patientQuestions: [],
      carePlanItems: [],
      patientInsightSnapshot: {
        patientInsightSnapshotId: `patient-insight-${noteId}`,
        noteId,
        sourceFreshness: 'unknown',
        allergySummaryStatus: 'unavailable',
        careTeamSummaryStatus: 'unavailable',
        riskStratificationStatus: 'unavailable',
        predictiveInsightsEnabled: false,
        staleWarnings: ['Persisted finalization output rehydrated without live chart context.'],
        generatedAt: input.finalizationRun.updatedAt.toISOString()
      },
      billingValidation: [
        {
          billingValidationId: `billing-validation-claim-${noteId}`,
          status: draftClaimPreview ? 'ready' : 'pending',
          severity: 'info',
          message: draftClaimPreview
            ? 'Draft claim preview persisted with submittedClaim=false.'
            : 'Draft claim preview is not present in persisted output.',
          blocksSignDispatch: false,
          evidenceSpanIds: []
        }
      ],
      dispatchMetadata: {
        submittedClaim: false,
        patientPortalDeliveryEnabled: false,
        ehrWritebackConfigured: writeback.configured,
        exportReady: input.finalizationRun.signedAndDispatched,
        finalNoteReadOnly: Boolean(finalNote?.readOnly),
        patientSummaryInternalDetailsExcluded: Boolean(patientSummary?.internalBillingDetailsExcluded),
        dispatchStatus: input.finalizationRun.signedAndDispatched
          ? 'signed_dispatched'
          : input.finalizationRun.billingAttested && input.finalizationRun.finalNoteApproved && input.finalizationRun.patientSummaryApproved
            ? 'ready'
            : 'not_ready'
      },
      ...(composeOutput ? { composeOutput } : {}),
      patientOpportunities: jsonArray(input.finalizationRun.patientOpportunitiesJson),
      ...(draftClaimPreview ? { draftClaimPreview } : {}),
      ...(input.billingAttestation ? { billingAttestation: toBillingAttestationDto(input.billingAttestation, noteId) } : {}),
      ...(finalNote ? { finalNote } : {}),
      ...(patientSummary ? { patientSummary } : {}),
      exportArtifacts: input.exportArtifacts,
      writeback,
      finalNoteApproved: input.finalizationRun.finalNoteApproved,
      patientSummaryApproved: input.finalizationRun.patientSummaryApproved,
      readyForBillingAttest: input.finalizationRun.readyForBillingAttest,
      billingAttested: input.finalizationRun.billingAttested,
      signedAndDispatched: input.finalizationRun.signedAndDispatched,
      createdAt: input.finalizationRun.createdAt.toISOString(),
      updatedAt: input.finalizationRun.updatedAt.toISOString()
    };
  }

  private async getScopedNote(tx: TransactionClient, noteId: string) {
    return tx.note.findFirst({
      where: {
        OR: [{ id: this.toNoteUuid(noteId) }, { sourceRef: noteId }],
        ...this.scopedNoteWhere()
      },
      include: { appointment: true, patient: true }
    });
  }

  private includeFinalizationOutput() {
    return {
      patient: true,
      appointment: true,
      finalizationRuns: {
        include: {
          wizardStepDecisions: true,
          enhancedNoteVersions: true,
          patientSummaryVersions: true,
          billingAttestations: true,
          draftClaimPreviews: true
        }
      },
      exportArtifacts: true,
      ehrWritebackJobs: true
    } satisfies Prisma.NoteInclude;
  }

  private scopedNoteWhere(): Prisma.NoteWhereInput {
    return {
      tenantId: this.tenantUuid,
      ...(this.siteUuid ? { siteId: this.siteUuid } : {})
    };
  }

  private assertScopeMatchesEntry(entry: StoredAppointment): void {
    if (entry.appointment.tenantId !== this.options.tenantId || entry.note.tenantId !== this.options.tenantId) {
      throw new Error('finalization output adapter blocks cross-tenant persistence');
    }

    if (this.options.siteId && (entry.appointment.siteId !== this.options.siteId || entry.note.siteId !== this.options.siteId)) {
      throw new Error('finalization output adapter blocks cross-site persistence');
    }
  }

  private assertNoSubmittedClaim(entry: StoredAppointment): void {
    const preview = entry.finalization?.draftClaimPreview ?? entry.draftClaimPreview;
    if (preview?.submittedClaim) {
      throw new Error('finalization output persistence rejects submitted claims');
    }
  }

  private assertSignedTextIsImmutable(
    existing: { approved: boolean; text: string } | null,
    nextText: string,
    label: string
  ): void {
    if (existing?.approved && existing.text !== nextText) {
      throw new Error(`finalization output persistence blocks mutable signed ${label}`);
    }
  }

  private assertSignedArtifactIsImmutable(
    existing: { signedVersionLocked: boolean; content: string | null; checksum: string | null; storageKey: string | null } | null,
    artifact: ExportArtifactDto
  ): void {
    if (!existing?.signedVersionLocked) {
      return;
    }
    if (existing.content !== artifact.content || existing.checksum !== artifact.checksum || existing.storageKey !== (artifact.storageKey ?? null)) {
      throw new Error('finalization output persistence blocks mutable signed export artifact');
    }
  }

  private toNoteUuid(noteId: string): string {
    return isUuid(noteId) ? noteId : toDeterministicPersistenceUuid('note', this.options.tenantId, noteId);
  }

  private toFinalizationRunUuid(finalizationSessionId: string): string {
    return isUuid(finalizationSessionId)
      ? finalizationSessionId
      : toDeterministicPersistenceUuid('finalization-run', this.options.tenantId, finalizationSessionId);
  }

  private toWizardDecisionUuid(sourceRef: string): string {
    return isUuid(sourceRef) ? sourceRef : toDeterministicPersistenceUuid('wizard-decision', this.options.tenantId, sourceRef);
  }

  private toEnhancedNoteVersionUuid(sourceRef: string): string {
    return isUuid(sourceRef) ? sourceRef : toDeterministicPersistenceUuid('enhanced-note-version', this.options.tenantId, sourceRef);
  }

  private toPatientSummaryVersionUuid(sourceRef: string): string {
    return isUuid(sourceRef) ? sourceRef : toDeterministicPersistenceUuid('patient-summary-version', this.options.tenantId, sourceRef);
  }

  private toBillingAttestationUuid(sourceRef: string): string {
    return isUuid(sourceRef) ? sourceRef : toDeterministicPersistenceUuid('billing-attestation', this.options.tenantId, sourceRef);
  }

  private toDraftClaimPreviewUuid(sourceRef: string): string {
    return isUuid(sourceRef) ? sourceRef : toDeterministicPersistenceUuid('draft-claim-preview', this.options.tenantId, sourceRef);
  }

  private toExportArtifactUuid(sourceRef: string): string {
    return isUuid(sourceRef) ? sourceRef : toDeterministicPersistenceUuid('export-artifact', this.options.tenantId, sourceRef);
  }

  private toWritebackUuid(sourceRef: string): string {
    return isUuid(sourceRef) ? sourceRef : toDeterministicPersistenceUuid('ehr-writeback-job', this.options.tenantId, sourceRef);
  }
}

export async function getPersistedFinalizationOutputForAccessContext(
  prisma: PrismaClient,
  access: AccessContext,
  noteId: string
): Promise<FinalizationOutputSnapshot | undefined> {
  if (!access.tenantId || !access.siteId) {
    throw new Error('persisted finalization output access requires tenant and site scope');
  }

  const repository = createPrismaFinalizationOutputRepository(prisma, {
    tenantId: access.tenantId,
    siteId: access.siteId
  });
  return repository.getByNoteId(noteId);
}

function toSelectionDecisionRecord(decision: FinalizationSelectionDecisionDto) {
  return {
    sourceRef: `selection:${decision.visitSelectionId}:${decision.decidedAt}`,
    step: 'code_review',
    targetType: 'visit_selection',
    targetId: decision.visitSelectionId,
    decision: decision.decision,
    reason: decision.reason,
    decidedAt: decision.decidedAt
  };
}

function toSuggestionDecisionRecord(decision: FinalizationSuggestionDecisionDto) {
  return {
    sourceRef: `suggestion:${decision.suggestionId}:${decision.decidedAt}`,
    step: 'suggestion_review',
    targetType: 'suggestion',
    targetId: decision.suggestionId,
    decision: decision.decision,
    reason: decision.reason,
    decidedAt: decision.decidedAt
  };
}

function toDraftClaimPreviewDto(record: FinalizationOutputRecord['finalizationRuns'][number]['draftClaimPreviews'][number]): DraftClaimPreviewDto {
  return jsonObject<DraftClaimPreviewDto>(record.payloadJson) ?? {
    draftClaimPreviewId: record.sourceRef,
    noteId: record.noteId,
    status: 'draft_preview',
    claimReadiness: 'blocked',
    patientReference: 'synthetic-unavailable',
    encounterDate: record.generatedAt.toISOString().slice(0, 10),
    renderingClinicianId: 'synthetic-unavailable',
    placeOfService: 'office',
    visitType: 'Synthetic visit',
    cptCandidates: [],
    hcpcsCandidates: [],
    icd10Candidates: [],
    emCandidate: 'E/M level not selected',
    diagnosisToServiceLinks: [],
    payerReadableJustification: 'Synthetic draft claim payload unavailable.',
    missingEvidence: ['Synthetic draft claim payload unavailable.'],
    denialRiskFlags: ['payload_unavailable'],
    estimateStatus: 'unavailable_caveated',
    estimateCaveat: 'Synthetic estimate unavailable.',
    billingReviewTriggered: true,
    submittedClaim: false
  };
}

function toBillingAttestationDto(
  record: FinalizationOutputRecord['finalizationRuns'][number]['billingAttestations'][number],
  noteId: string
): BillingAttestationDto {
  return {
    billingAttestationId: record.sourceRef,
    noteId,
    requiredStatements: jsonStringArray(record.requiredStatementsJson),
    acceptedStatements: jsonStringArray(record.acceptedStatementsJson),
    estimateCaveatAcknowledged: record.estimateCaveatAcknowledged,
    billingReviewTriggered: record.routeToBillingReview,
    attestedByUserId: record.attestedById ?? 'synthetic-actor-unavailable',
    attestedAt: record.attestedAt.toISOString()
  };
}

function toFinalNoteRecordDto(
  record: FinalizationOutputRecord['finalizationRuns'][number]['enhancedNoteVersions'][number],
  note: FinalizationOutputRecord,
  noteId: string
): FinalNoteRecordDto {
  const persisted = jsonObject<FinalNoteRecordDto>(record.finalNoteRecordJson);
  if (persisted) {
    return persisted;
  }
  return {
    finalNoteId: record.sourceRef,
    noteId,
    appointmentId: note.appointment.sourceRef ?? note.appointment.id,
    safePatientId: note.patient.safePatientId,
    clinicianId: note.clinicianId,
    finalNoteText: record.text,
    finalizedAt: (record.approvedAt ?? record.createdAt).toISOString(),
    readOnly: true
  };
}

function toPatientSummaryRecordDto(
  record: FinalizationOutputRecord['finalizationRuns'][number]['patientSummaryVersions'][number],
  noteId: string
): PatientSummaryRecordDto {
  const persisted = jsonObject<PatientSummaryRecordDto>(record.patientSummaryRecordJson);
  if (persisted) {
    return persisted;
  }
  return {
    patientSummaryId: record.sourceRef,
    noteId,
    patientSummaryText: record.text,
    finalizedAt: (record.approvedAt ?? record.createdAt).toISOString(),
    patientFacing: true,
    internalBillingDetailsExcluded: true
  };
}

function toExportArtifactDto(record: FinalizationOutputRecord['exportArtifacts'][number]): ExportArtifactDto {
  const persisted = jsonObject<ExportArtifactDto>(record.metadataJson);
  if (persisted) {
    return persisted;
  }
  const artifact: ExportArtifactDto = {
    exportArtifactId: record.sourceRef,
    noteId: record.noteId,
    artifactType: toExportArtifactType(record.artifactType),
    status: 'generated',
    mimeType: toMimeType(record.mimeType),
    fileName: record.fileName,
    generatedAt: record.generatedAt.toISOString(),
    generatedByUserId: record.generatedById ?? 'synthetic-actor-unavailable',
    sourceFinalizedAt: (record.sourceFinalizedAt ?? record.generatedAt).toISOString(),
    signedVersionLocked: true,
    content: record.content ?? '',
    checksum: record.checksum ?? 'synthetic-checksum-unavailable',
    signedDownloadAvailable: record.signedDownloadAvailable
  };
  if (record.retentionClass) artifact.retentionClass = record.retentionClass;
  if (record.deliveryMode) artifact.deliveryMode = record.deliveryMode as NonNullable<ExportArtifactDto['deliveryMode']>;
  if (record.storageProvider) artifact.storageProvider = record.storageProvider as NonNullable<ExportArtifactDto['storageProvider']>;
  if (record.storageKey) artifact.storageKey = record.storageKey;
  if (record.contentLengthBytes !== null) artifact.contentLengthBytes = record.contentLengthBytes;
  if (record.signedDownloadExpiresAt) artifact.signedDownloadExpiresAt = record.signedDownloadExpiresAt.toISOString();
  return artifact;
}

function toWritebackDto(record: FinalizationOutputRecord['ehrWritebackJobs'][number], noteId: string): EhrWritebackQueueDto {
  return {
    writebackJobId: record.sourceRef,
    noteId,
    target: record.target as EhrWritebackQueueDto['target'],
    vendor: record.vendor as EhrWritebackQueueDto['vendor'],
    status: record.status as EhrWritebackQueueDto['status'],
    configured: record.configured,
    humanApproved: record.humanApproved,
    retryable: record.retryable,
    ...(record.queuedAt ? { queuedAt: record.queuedAt.toISOString() } : {}),
    ...(record.failedAt ? { failedAt: record.failedAt.toISOString() } : {}),
    ...(record.failureReason ? { failureReason: record.failureReason } : {}),
    ...(record.externalJobId ? { externalJobId: record.externalJobId } : {})
  };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function jsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function nullableJsonInput(value: unknown | undefined): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  return value === undefined ? Prisma.JsonNull : jsonInput(value);
}

function jsonObject<T>(value: Prisma.JsonValue | null): T | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : undefined;
}

function jsonArray<T>(value: Prisma.JsonValue | null): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function jsonRecord(value: Prisma.JsonValue | null): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function jsonStringArray(value: Prisma.JsonValue | null): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function byUpdatedAt(left: { updatedAt: Date }, right: { updatedAt: Date }): number {
  return left.updatedAt.getTime() - right.updatedAt.getTime();
}

function byCreatedAt(left: { createdAt: Date }, right: { createdAt: Date }): number {
  return left.createdAt.getTime() - right.createdAt.getTime();
}

function byGeneratedAt(left: { generatedAt: Date }, right: { generatedAt: Date }): number {
  return left.generatedAt.getTime() - right.generatedAt.getTime();
}

function byAttestedAt(left: { attestedAt: Date }, right: { attestedAt: Date }): number {
  return left.attestedAt.getTime() - right.attestedAt.getTime();
}

function toWizardStep(value: string): FinalizationSessionDto['currentStep'] {
  const allowed: FinalizationSessionDto['currentStep'][] = [
    'code_review',
    'suggestion_review',
    'compose',
    'compare_edit',
    'billing_attest',
    'sign_dispatch'
  ];
  return allowed.includes(value as FinalizationSessionDto['currentStep']) ? (value as FinalizationSessionDto['currentStep']) : 'code_review';
}

function toExportArtifactType(value: string): ExportArtifactDto['artifactType'] {
  const allowed: ExportArtifactDto['artifactType'][] = [
    'final_note_pdf',
    'final_note_copy',
    'patient_summary_pdf',
    'patient_summary_copy',
    'structured_export'
  ];
  return allowed.includes(value as ExportArtifactDto['artifactType']) ? (value as ExportArtifactDto['artifactType']) : 'structured_export';
}

function toMimeType(value: string): ExportArtifactDto['mimeType'] {
  return value === 'application/pdf' || value === 'text/plain' || value === 'application/json' ? value : 'application/json';
}

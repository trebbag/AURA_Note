import type { PrismaClient } from '@prisma/client';
import { canPerform, type AccessContext } from '@aura-note/security';
import type { StoredAppointment } from './schedule.repository';
import {
  createPrismaFinalizationOutputRepository,
  type AsyncFinalizationOutputRepository,
  type FinalizationOutputSnapshot
} from './prisma-finalization-output.repository';
import {
  createPrismaReviewPanelRepository,
  type AsyncReviewPanelRepository,
  type ReviewPanelSnapshot
} from './prisma-review-panel.repository';
import {
  createPrismaRuntimeMetadataRepository,
  type AsyncRuntimeMetadataRepository,
  type RuntimeMetadataSnapshot
} from './prisma-runtime-metadata.repository';
import {
  createPrismaScheduleStateRepository,
  type AsyncScheduleStateRepository
} from './prisma-schedule.repository';
import {
  createPrismaVisitCaptureRepository,
  type AsyncVisitCaptureRepository,
  type VisitCaptureSnapshot
} from './prisma-visit-capture.repository';

export interface RuntimePersistenceRepositoryOptions {
  tenantId: string;
  siteId: string;
}

export interface CoreWorkflowRuntimeSnapshot {
  appointment: StoredAppointment;
  visitCapture?: VisitCaptureSnapshot;
  reviewPanel?: ReviewPanelSnapshot;
  finalizationOutput?: FinalizationOutputSnapshot;
  runtimeMetadata: RuntimeMetadataSnapshot;
}

export interface AsyncCoreWorkflowRuntimeRepository {
  saveCoreWorkflow(entry: StoredAppointment, runtimeMetadata: RuntimeMetadataSnapshot): Promise<void>;
  getByAppointmentId(appointmentId: string): Promise<CoreWorkflowRuntimeSnapshot | undefined>;
  getByNoteId(noteId: string): Promise<CoreWorkflowRuntimeSnapshot | undefined>;
}

export function createPrismaCoreWorkflowRuntimeRepository(
  prisma: PrismaClient,
  options: RuntimePersistenceRepositoryOptions
): AsyncCoreWorkflowRuntimeRepository {
  return new PrismaCoreWorkflowRuntimeRepository(prisma, options);
}

class PrismaCoreWorkflowRuntimeRepository implements AsyncCoreWorkflowRuntimeRepository {
  private readonly schedule: AsyncScheduleStateRepository;
  private readonly visitCapture: AsyncVisitCaptureRepository;
  private readonly reviewPanel: AsyncReviewPanelRepository;
  private readonly finalizationOutput: AsyncFinalizationOutputRepository;
  private readonly runtimeMetadata: AsyncRuntimeMetadataRepository;

  constructor(prisma: PrismaClient, private readonly options: RuntimePersistenceRepositoryOptions) {
    this.schedule = createPrismaScheduleStateRepository(prisma, options);
    this.visitCapture = createPrismaVisitCaptureRepository(prisma, options);
    this.reviewPanel = createPrismaReviewPanelRepository(prisma, options);
    this.finalizationOutput = createPrismaFinalizationOutputRepository(prisma, options);
    this.runtimeMetadata = createPrismaRuntimeMetadataRepository(prisma, options);
  }

  async saveCoreWorkflow(entry: StoredAppointment, runtimeMetadata: RuntimeMetadataSnapshot): Promise<void> {
    this.assertScopeMatches(entry, runtimeMetadata);

    await this.schedule.saveAppointment(entry);
    if (entry.visitSession) {
      await this.visitCapture.saveVisitCapture(entry);
    }
    if (entry.suggestions || entry.visitSelections || entry.complianceIssues || entry.historyGaps || entry.tasks) {
      await this.reviewPanel.saveReviewPanel(entry);
    }
    if (entry.finalization || entry.finalNote || entry.patientSummary || entry.draftClaimPreview || entry.exportArtifacts || entry.writeback) {
      await this.finalizationOutput.saveFinalizationOutput(entry);
    }
    await this.runtimeMetadata.saveRuntimeMetadata(runtimeMetadata);
  }

  async getByAppointmentId(appointmentId: string): Promise<CoreWorkflowRuntimeSnapshot | undefined> {
    const appointment = await this.schedule.getAppointment(appointmentId);
    return appointment ? this.snapshotForStoredAppointment(appointment) : undefined;
  }

  async getByNoteId(noteId: string): Promise<CoreWorkflowRuntimeSnapshot | undefined> {
    const appointment = await this.schedule.getByNoteId(noteId);
    return appointment ? this.snapshotForStoredAppointment(appointment) : undefined;
  }

  private async snapshotForStoredAppointment(appointment: StoredAppointment): Promise<CoreWorkflowRuntimeSnapshot> {
    const [visitCapture, reviewPanel, finalizationOutput, runtimeMetadata] = await Promise.all([
      this.visitCapture.getByAppointmentId(appointment.appointment.appointmentId),
      this.reviewPanel.getByNoteId(appointment.note.noteId),
      this.finalizationOutput.getByNoteId(appointment.note.noteId),
      this.runtimeMetadata.getRuntimeMetadata()
    ]);

    return {
      appointment,
      ...(visitCapture ? { visitCapture } : {}),
      ...(reviewPanel ? { reviewPanel } : {}),
      ...(finalizationOutput ? { finalizationOutput } : {}),
      runtimeMetadata
    };
  }

  private assertScopeMatches(entry: StoredAppointment, runtimeMetadata: RuntimeMetadataSnapshot): void {
    if (
      entry.appointment.tenantId !== this.options.tenantId ||
      entry.note.tenantId !== this.options.tenantId ||
      runtimeMetadata.tenantId !== this.options.tenantId
    ) {
      throw new Error('core workflow runtime adapter blocks cross-tenant persistence');
    }
    if (
      entry.appointment.siteId !== this.options.siteId ||
      entry.note.siteId !== this.options.siteId ||
      runtimeMetadata.siteId !== this.options.siteId
    ) {
      throw new Error('core workflow runtime adapter blocks cross-site persistence');
    }
  }
}

export async function getPersistedCoreWorkflowForAccessContext(
  prisma: PrismaClient,
  access: AccessContext,
  appointmentId: string
): Promise<CoreWorkflowRuntimeSnapshot | undefined> {
  if (!access.tenantId || !access.siteId) {
    throw new Error('persisted core workflow access requires tenant and site scope');
  }
  const linkedAccess: AccessContext = {
    ...access,
    linkedToPatient: true,
    linkedToVisit: true
  };
  if (!canPerform('draft_note:view', linkedAccess) && !canPerform('final_note:view', linkedAccess)) {
    return undefined;
  }

  return createPrismaCoreWorkflowRuntimeRepository(prisma, {
    tenantId: access.tenantId,
    siteId: access.siteId
  }).getByAppointmentId(appointmentId);
}

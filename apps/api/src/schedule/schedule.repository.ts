import type {
  AppointmentDto,
  StandaloneChartContextSnapshotDto,
  StandalonePatientDto,
  StandalonePatientLinkageDto,
  ComplianceIssueDto,
  DraftClaimPreviewDto,
  EhrWritebackQueueDto,
  ExportArtifactDto,
  FinalNoteRecordDto,
  FinalizationSessionDto,
  HistoryGapQuestionDto,
  NoteDto,
  PatientSummaryRecordDto,
  RawAudioRetentionMetadataDto,
  SuggestionDto,
  TaskDto,
  TranscriptViewDto,
  VisitSelectionDto,
  VisitSessionDto
} from '@aura-note/contracts';
import type { AppointmentLifecycle } from '@aura-note/domain';

export interface StoredAppointment {
  appointment: AppointmentDto;
  note: NoteDto;
  patient: StandalonePatientDto;
  linkages: StandalonePatientLinkageDto[];
  chartContextSnapshot: StandaloneChartContextSnapshotDto;
  lifecycle: AppointmentLifecycle;
  visitSession?: VisitSessionDto;
  rawAudioRetention?: RawAudioRetentionMetadataDto;
  transcript?: TranscriptViewDto;
  suggestions?: SuggestionDto[];
  visitSelections?: VisitSelectionDto[];
  complianceIssues?: ComplianceIssueDto[];
  historyGaps?: HistoryGapQuestionDto[];
  tasks?: TaskDto[];
  finalization?: FinalizationSessionDto;
  finalNote?: FinalNoteRecordDto;
  patientSummary?: PatientSummaryRecordDto;
  draftClaimPreview?: DraftClaimPreviewDto;
  exportArtifacts?: ExportArtifactDto[];
  writeback?: EhrWritebackQueueDto;
}

export interface ScheduleStateRepository {
  listAppointments(): StoredAppointment[];
  getAppointment(appointmentId: string): StoredAppointment | undefined;
  getByNoteId(noteId: string): StoredAppointment | undefined;
  listPatients(): StandalonePatientDto[];
  getPatient(safePatientId: string): StandalonePatientDto | undefined;
  savePatient(patient: StandalonePatientDto): void;
  saveChartContext(snapshot: StandaloneChartContextSnapshotDto): void;
  getChartContext(safePatientId: string, appointmentId?: string): StandaloneChartContextSnapshotDto | undefined;
  hasNoteForAppointment(appointmentId: string): boolean;
  saveAppointment(entry: StoredAppointment): void;
  getIdempotentAppointmentId(idempotencyKey: string): string | undefined;
  saveIdempotencyKey(idempotencyKey: string, appointmentId: string): void;
}

export class InMemoryScheduleStateRepository implements ScheduleStateRepository {
  private readonly appointments = new Map<string, StoredAppointment>();
  private readonly noteByAppointment = new Map<string, string>();
  private readonly appointmentByNote = new Map<string, string>();
  private readonly idempotencyIndex = new Map<string, string>();
  private readonly patients = new Map<string, StandalonePatientDto>();
  private readonly chartContexts = new Map<string, StandaloneChartContextSnapshotDto>();

  listAppointments(): StoredAppointment[] {
    return [...this.appointments.values()];
  }

  getAppointment(appointmentId: string): StoredAppointment | undefined {
    return this.appointments.get(appointmentId);
  }

  getByNoteId(noteId: string): StoredAppointment | undefined {
    const appointmentId = this.appointmentByNote.get(noteId);
    return appointmentId ? this.appointments.get(appointmentId) : undefined;
  }

  listPatients(): StandalonePatientDto[] {
    return [...this.patients.values()].sort((left, right) => left.safePatientId.localeCompare(right.safePatientId));
  }

  getPatient(safePatientId: string): StandalonePatientDto | undefined {
    return this.patients.get(safePatientId);
  }

  savePatient(patient: StandalonePatientDto): void {
    this.patients.set(patient.safePatientId, patient);
  }

  saveChartContext(snapshot: StandaloneChartContextSnapshotDto): void {
    this.chartContexts.set(this.chartContextKey(snapshot.safePatientId, snapshot.appointmentId), snapshot);
  }

  getChartContext(safePatientId: string, appointmentId?: string): StandaloneChartContextSnapshotDto | undefined {
    return this.chartContexts.get(this.chartContextKey(safePatientId, appointmentId)) ?? this.chartContexts.get(this.chartContextKey(safePatientId));
  }

  hasNoteForAppointment(appointmentId: string): boolean {
    return this.noteByAppointment.has(appointmentId);
  }

  saveAppointment(entry: StoredAppointment): void {
    const existingNoteId = this.noteByAppointment.get(entry.appointment.appointmentId);
    if (existingNoteId && existingNoteId !== entry.note.noteId) {
      throw new Error('repository blocks appointment-to-multiple-note persistence');
    }

    const existingAppointmentId = this.appointmentByNote.get(entry.note.noteId);
    if (existingAppointmentId && existingAppointmentId !== entry.appointment.appointmentId) {
      throw new Error('repository blocks note-to-multiple-appointment persistence');
    }

    this.appointments.set(entry.appointment.appointmentId, entry);
    this.noteByAppointment.set(entry.appointment.appointmentId, entry.note.noteId);
    this.appointmentByNote.set(entry.note.noteId, entry.appointment.appointmentId);
    this.savePatient(entry.patient);
    this.saveChartContext(entry.chartContextSnapshot);
  }

  getIdempotentAppointmentId(idempotencyKey: string): string | undefined {
    return this.idempotencyIndex.get(idempotencyKey);
  }

  saveIdempotencyKey(idempotencyKey: string, appointmentId: string): void {
    const existingAppointmentId = this.idempotencyIndex.get(idempotencyKey);
    if (existingAppointmentId && existingAppointmentId !== appointmentId) {
      throw new Error('repository blocks idempotency key remapping');
    }
    this.idempotencyIndex.set(idempotencyKey, appointmentId);
  }

  private chartContextKey(safePatientId: string, appointmentId?: string): string {
    return appointmentId ? `${safePatientId}:${appointmentId}` : safePatientId;
  }
}

export function createInMemoryScheduleStateRepository(): ScheduleStateRepository {
  return new InMemoryScheduleStateRepository();
}

export function createStandalonePatientScheduleScaffold(
  appointment: AppointmentDto,
  note: NoteDto,
  generatedAt = '2026-05-27T00:00:00.000Z'
): Pick<StoredAppointment, 'patient' | 'linkages' | 'chartContextSnapshot'> {
  const patient: StandalonePatientDto = {
    patientId: `patient-${appointment.safePatientId}`,
    tenantId: appointment.tenantId,
    siteId: appointment.siteId,
    safePatientId: appointment.safePatientId,
    status: 'active',
    displayLabel: `Standalone ${appointment.safePatientId}`,
    createdAt: generatedAt,
    updatedAt: generatedAt,
    mode: appointment.mode
  };
  const chartContextSnapshot: StandaloneChartContextSnapshotDto = {
    chartContextSnapshotId: `chart-context-${appointment.appointmentId}`,
    tenantId: appointment.tenantId,
    siteId: appointment.siteId,
    safePatientId: appointment.safePatientId,
    appointmentId: appointment.appointmentId,
    noteId: note.noteId,
    sourceSystem: 'standalone_local',
    sourceFreshness: 'recent',
    staleWarning: false,
    slices: [],
    warnings: ['Synthetic standalone chart context only; live EHR completeness is not implied.'],
    aiPackagingAllowed: false,
    productionPhiStorageApproved: false,
    createdAt: generatedAt,
    mode: appointment.mode
  };
  return {
    patient,
    linkages: [
      {
        patientLinkageId: `patient-linkage-${appointment.appointmentId}`,
        tenantId: appointment.tenantId,
        siteId: appointment.siteId,
        safePatientId: appointment.safePatientId,
        appointmentId: appointment.appointmentId,
        noteId: note.noteId,
        linkedObjectType: 'appointment',
        linkedObjectId: appointment.appointmentId,
        purpose: 'treatment',
        active: true,
        createdAt: generatedAt
      },
      {
        patientLinkageId: `chart-context-linkage-${appointment.appointmentId}`,
        tenantId: appointment.tenantId,
        siteId: appointment.siteId,
        safePatientId: appointment.safePatientId,
        appointmentId: appointment.appointmentId,
        noteId: note.noteId,
        linkedObjectType: 'chart_context',
        linkedObjectId: chartContextSnapshot.chartContextSnapshotId,
        purpose: 'documentation',
        active: true,
        createdAt: generatedAt
      }
    ],
    chartContextSnapshot
  };
}

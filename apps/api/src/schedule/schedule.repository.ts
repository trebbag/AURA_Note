import type {
  AppointmentDto,
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
}

export function createInMemoryScheduleStateRepository(): ScheduleStateRepository {
  return new InMemoryScheduleStateRepository();
}

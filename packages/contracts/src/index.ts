import type {
  AppMode,
  AppointmentModality,
  AppointmentSource,
  AppointmentState,
  NoteState,
  RecordingState,
  TaskAdjudicationStatus,
  TimerState,
  VisitSelectionCategory,
  WizardStep
} from '@aura-note/domain';

export type Sensitivity = 'non_phi' | 'phi_reference' | 'restricted';
export type RetentionClass = 'standard' | 'audit' | 'transcript' | 'audio_ephemeral';

export type CoreEventType =
  | 'appointment.created.v1'
  | 'note.shell_created.v1'
  | 'visit.started.v1'
  | 'visit.paused.v1'
  | 'visit.resumed.v1'
  | 'visit.stopped.v1'
  | 'recording.started.v1'
  | 'recording.exception_approved.v1'
  | 'recording.stopped.v1'
  | 'raw_audio.retention_scheduled.v1'
  | 'transcript.segment_appended.v1'
  | 'task.blocker_changed.v1'
  | 'low_confidence_diagnosis.override_recorded.v1'
  | 'finalization.started.v1'
  | 'finalization.step_completed.v1'
  | 'audit.event_recorded.v1';

export interface ApiMeta {
  requestId: string;
  traceId: string;
  mode: AppMode;
  generatedAt: string;
}

export interface ApiWarning {
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
}

export interface ApiEnvelope<TData> {
  data: TData;
  meta: ApiMeta;
  warnings?: ApiWarning[];
}

export interface AppointmentDto {
  appointmentId: string;
  tenantId: string;
  siteId: string;
  safePatientId: string;
  clinicianId: string;
  noteId: string;
  state: AppointmentState;
  startsAt: string;
  durationMinutes: number;
  visitType: string;
  modality: AppointmentModality;
  source: AppointmentSource;
  reasonForVisit?: string;
  mode: AppMode;
}

export interface NoteDto {
  noteId: string;
  appointmentId: string;
  tenantId: string;
  siteId: string;
  safePatientId: string;
  clinicianId: string;
  state: NoteState;
  mode: AppMode;
}

export interface VisitSessionDto {
  visitSessionId: string;
  noteId: string;
  timerState: TimerState;
  recordingState: RecordingState;
  editorUnlocked: boolean;
  exceptionReason?: string;
  startedAt?: string;
  pausedAt?: string;
  stoppedAt?: string;
  elapsedSeconds?: number;
}

export interface RecordingExceptionRequestDto {
  exceptionReason: string;
}

export interface RawAudioRetentionMetadataDto {
  recordingId: string;
  noteId: string;
  retentionClass: 'audio_ephemeral';
  capturedAt: string;
  purgeAfter: string;
  purgeEligible: boolean;
}

export interface TranscriptSegmentDto {
  transcriptSegmentId: string;
  noteId: string;
  sequence: number;
  speakerRole: 'clinician' | 'patient' | 'ma' | 'system';
  text: string;
  source: 'mock_transcription';
  createdAt: string;
}

export interface AppendTranscriptSegmentRequestDto {
  speakerRole: TranscriptSegmentDto['speakerRole'];
  text: string;
}

export interface TranscriptViewDto {
  noteId: string;
  transcriptId: string;
  retentionPolicy: 'indefinite';
  segments: TranscriptSegmentDto[];
}

export interface VisitSessionControlResponseDto {
  appointment: AppointmentDto;
  note: NoteDto;
  visitSession: VisitSessionDto;
  rawAudioRetention?: RawAudioRetentionMetadataDto;
  transcript?: TranscriptViewDto;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export interface VisitSelectionDto {
  visitSelectionId: string;
  noteId: string;
  category: VisitSelectionCategory;
  label: string;
  confidence?: number;
  humanApproved: boolean;
}

export interface TaskDto {
  taskId: string;
  noteId?: string;
  safePatientId?: string;
  title: string;
  blocksSigning: boolean;
  adjudicationStatus: TaskAdjudicationStatus;
  ownerRole?: string;
}

export interface WizardStepDecisionDto {
  noteId: string;
  step: WizardStep;
  completedByUserId: string;
  completedAt: string;
  humanApproved: boolean;
}

export interface AuditEventDto {
  auditEventId: string;
  tenantId: string;
  siteId?: string;
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  traceId: string;
  createdAt: string;
}

export interface CreateAppointmentRequestDto {
  safePatientId: string;
  clinicianId: string;
  visitType: string;
  startsAt: string;
  durationMinutes: number;
  modality: AppointmentModality;
  reasonForVisit?: string;
}

export interface ScheduleAppointmentDto extends AppointmentDto {
  noteStatus: NoteState;
  noteVisibleInDrafts: boolean;
  startVisitEnabled: boolean;
  ehrSchedulingEnabled: boolean;
  clinicOsSchedulingEnabled: boolean;
}

export interface CreateAppointmentResponseDto {
  appointment: AppointmentDto;
  note: NoteDto;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export interface StartVisitResponseDto {
  appointment: AppointmentDto;
  note: NoteDto;
  visitSession: VisitSessionDto;
  rawAudioRetention?: RawAudioRetentionMetadataDto;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export interface ScheduleViewDto {
  appointments: ScheduleAppointmentDto[];
  ehrSchedulingEnabled: boolean;
  clinicOsSchedulingEnabled: boolean;
}

export type WorkspacePanelState =
  | 'empty'
  | 'loading'
  | 'ready'
  | 'saving'
  | 'warning'
  | 'blocked'
  | 'failed'
  | 'permission_denied'
  | 'finalized_read_only'
  | 'demo_fixture';

export interface DraftNoteSummaryDto {
  noteId: string;
  appointmentId: string;
  safePatientId: string;
  clinicianId: string;
  visitType: string;
  startsAt: string;
  noteStatus: NoteState;
  appointmentStatus: AppointmentState;
  workflowStatusLabel: string;
  editorLocked: boolean;
  editorLockedReason?: string;
}

export interface FinalizedNoteSummaryDto {
  noteId: string;
  appointmentId: string;
  safePatientId: string;
  clinicianId: string;
  finalizedAt?: string;
  readOnly: true;
  finalNoteAvailable: boolean;
  patientSummaryAvailable: boolean;
  transcriptAvailableForRole: boolean;
}

export interface WorkspacePanelDto {
  panelId:
    | 'visit_context'
    | 'controls'
    | 'editor'
    | 'visit_selections'
    | 'suggestions'
    | 'transcript'
    | 'compliance'
    | 'history_gap';
  label: string;
  state: WorkspacePanelState;
  blockedReason?: string;
  itemCount: number;
}

export interface DocumentationWorkspaceDto {
  appointment: AppointmentDto;
  note: NoteDto;
  visitSession?: VisitSessionDto;
  rawAudioRetention?: RawAudioRetentionMetadataDto;
  transcript?: TranscriptViewDto;
  editorLocked: boolean;
  editorLockedReason?: string;
  finalizedReadOnly: boolean;
  panels: WorkspacePanelDto[];
  availableStates: WorkspacePanelState[];
}

export interface DraftNotesViewDto {
  notes: DraftNoteSummaryDto[];
  emptyState: WorkspacePanelState;
}

export interface FinalizedNotesViewDto {
  notes: FinalizedNoteSummaryDto[];
  emptyState: WorkspacePanelState;
  readOnly: true;
}

export interface AuraNoteEvent<TPayload> {
  eventId: string;
  eventType: CoreEventType;
  schemaVersion: 'v1';
  tenantId: string;
  siteId: string;
  patientIdHash?: string;
  appointmentId?: string;
  noteId?: string;
  visitSessionId?: string;
  producer: string;
  eventTime: string;
  traceId: string;
  idempotencyKey: string;
  sensitivity: Sensitivity;
  retentionClass: RetentionClass;
  payload: TPayload;
}

export function createApiEnvelope<TData>(data: TData, meta: ApiMeta, warnings?: ApiWarning[]): ApiEnvelope<TData> {
  if (warnings?.length) {
    return { data, meta, warnings };
  }
  return { data, meta };
}

export function createEventEnvelope<TPayload>(
  event: Omit<AuraNoteEvent<TPayload>, 'schemaVersion' | 'eventTime'>
): AuraNoteEvent<TPayload> {
  if (!event.eventId || !event.tenantId || !event.siteId || !event.traceId || !event.idempotencyKey) {
    throw new Error('event envelope requires event, tenant, site, trace, and idempotency identifiers');
  }

  return {
    ...event,
    schemaVersion: 'v1',
    eventTime: new Date().toISOString()
  };
}

export function isStateChangingEvent(eventType: CoreEventType): boolean {
  return eventType !== 'audit.event_recorded.v1';
}

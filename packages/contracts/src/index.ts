import type {
  AppMode,
  AppointmentModality,
  AppointmentSource,
  AppointmentState,
  FinalizationSelectionDecision,
  FinalizationSuggestionDecision,
  NoteState,
  RecordingState,
  TaskAdjudicationStatus,
  TimerState,
  VisitSelectionCategory,
  WizardStep,
  WizardStepStatus
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
  | 'suggestions.evaluated.v1'
  | 'suggestion.accepted.v1'
  | 'suggestion.removed.v1'
  | 'visit_selection.added.v1'
  | 'compliance.evaluated.v1'
  | 'history_gap.task_created.v1'
  | 'task.blocker_changed.v1'
  | 'low_confidence_diagnosis.override_recorded.v1'
  | 'finalization.started.v1'
  | 'finalization.selection_decided.v1'
  | 'finalization.suggestion_decided.v1'
  | 'finalization.compose_requested.v1'
  | 'finalization.compose_completed.v1'
  | 'finalization.compare_edit_updated.v1'
  | 'finalization.compose_rebeautified.v1'
  | 'finalization.step_completed.v1'
  | 'final_note.approved.v1'
  | 'patient_summary.approved.v1'
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
  sourceSuggestionId?: string;
  overrideReason?: string;
}

export interface SuggestionDto {
  suggestionId: string;
  noteId: string;
  category: VisitSelectionCategory;
  label: string;
  confidence: number;
  rationale: string;
  supportingEvidence: string[];
  missingEvidence: string[];
  status: 'candidate' | 'accepted' | 'removed';
  lowConfidenceOverrideRequired: boolean;
  draftOnly: true;
}

export interface SuggestionDecisionRequestDto {
  overrideReason?: string;
  supportingEvidence?: string;
  nonSupportingEvidence?: string;
  uncertaintyExplanation?: string;
  confidenceImprovementPlan?: string;
}

export interface SuggestionsViewDto {
  noteId: string;
  suggestions: SuggestionDto[];
}

export interface VisitSelectionsViewDto {
  noteId: string;
  selections: VisitSelectionDto[];
  availableFilters: VisitSelectionCategory[];
}

export interface AddVisitSelectionRequestDto {
  category: VisitSelectionCategory;
  label: string;
  confidence?: number;
}

export interface ComplianceIssueDto {
  complianceIssueId: string;
  noteId: string;
  severity: 'info' | 'warning' | 'soft_block' | 'hard_block';
  title: string;
  detail: string;
  blocksFinalize: boolean;
  source: 'deterministic_mock';
}

export interface ComplianceReviewDto {
  noteId: string;
  issues: ComplianceIssueDto[];
  finalizeDisabled: boolean;
}

export interface HistoryGapQuestionDto {
  historyGapQuestionId: string;
  noteId: string;
  question: string;
  supportsItem: string;
  category: 'diagnosis_confidence' | 'coding_support' | 'care_gap' | 'plan_clarity';
  confidenceImpact: 'low' | 'medium' | 'high';
  status: 'open' | 'sent_to_ma' | 'answered' | 'closed';
  blockerEligible: boolean;
}

export interface CreateHistoryGapTaskRequestDto {
  blocksSigning: boolean;
  ownerRole: 'ma';
}

export interface ReviewActionResponseDto {
  suggestions: SuggestionDto[];
  visitSelections: VisitSelectionDto[];
  complianceReview: ComplianceReviewDto;
  historyGaps: HistoryGapQuestionDto[];
  tasks: TaskDto[];
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
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

export interface FinalizationSelectionDecisionDto {
  visitSelectionId: string;
  decision: FinalizationSelectionDecision;
  reason?: string;
  decidedByUserId: string;
  decidedAt: string;
}

export interface FinalizationSuggestionDecisionDto {
  suggestionId: string;
  decision: FinalizationSuggestionDecision;
  reason?: string;
  decidedByUserId: string;
  decidedAt: string;
}

export interface UnusedAuditItemDto {
  unusedAuditItemId: string;
  noteId: string;
  sourceType: 'visit_selection' | 'suggestion';
  sourceId: string;
  label: string;
  reason?: string;
  recordedAt: string;
}

export interface ComposeProgressPhaseDto {
  phase: 'analyzing_content' | 'enhancing_structure' | 'beautifying_language' | 'final_review';
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface FinalizationComposeOutputDto {
  composeOutputId: string;
  noteId: string;
  version: number;
  enhancedNoteText: string;
  patientSummaryText: string;
  payerReadableSupportSection: string;
  planTaskMapping: string[];
  sourceIntegrityWarnings: string[];
  patientSummaryInternalDetailsDetected: boolean;
  staleDueToEdit: boolean;
  generatedAt: string;
  draftOnly: true;
}

export interface PatientOpportunityDto {
  patientOpportunityId: string;
  noteId: string;
  category: 'clinical' | 'quality' | 'risk' | 'care_gap' | 'internal_revenue';
  title: string;
  detail: string;
  patientFacingAllowed: boolean;
  revenueHiddenFromPatient: true;
}

export interface FinalizationSessionDto {
  finalizationSessionId: string;
  noteId: string;
  appointmentId: string;
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  stepStatuses: Record<WizardStep, WizardStepStatus>;
  frozenSnapshot: {
    originalNoteText: string;
    visitSelections: VisitSelectionDto[];
    finalPassSuggestions: SuggestionDto[];
    transcriptSegmentCount: number;
    historyGapQuestionCount: number;
  };
  selectionDecisions: FinalizationSelectionDecisionDto[];
  suggestionDecisions: FinalizationSuggestionDecisionDto[];
  unusedAuditItems: UnusedAuditItemDto[];
  composePhases: ComposeProgressPhaseDto[];
  composeOutput?: FinalizationComposeOutputDto;
  patientOpportunities: PatientOpportunityDto[];
  finalNoteApproved: boolean;
  patientSummaryApproved: boolean;
  readyForBillingAttest: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FinalizationSelectionDecisionRequestDto {
  decision: FinalizationSelectionDecision;
  reason?: string;
}

export interface FinalizationSuggestionDecisionRequestDto {
  decision: FinalizationSuggestionDecision;
  reason?: string;
}

export interface CompareEditUpdateRequestDto {
  originalNoteText: string;
}

export interface RebeautifyRequestDto {
  reason?: string;
}

export interface ApprovalRequestDto {
  approved: boolean;
  attestation: string;
}

export interface FinalizationActionResponseDto {
  finalizationSession: FinalizationSessionDto;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
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

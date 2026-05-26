import type {
  AppMode,
  AppointmentModality,
  AppointmentSource,
  AppointmentState,
  CoachingSignalCategory,
  CoachingVisibilityMode,
  EhrWritebackStatus,
  ExportArtifactType,
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
  | 'billing_review.triggered.v1'
  | 'draft_claim_preview.generated.v1'
  | 'billing_attestation.completed.v1'
  | 'final_note.created.v1'
  | 'patient_summary.finalized.v1'
  | 'note.signed.v1'
  | 'note.dispatched.v1'
  | 'export.generated.v1'
  | 'ehr_writeback.queued.v1'
  | 'ehr_writeback.failed.v1'
  | 'ehr.adapter_status_checked.v1'
  | 'ehr.patient_matched.v1'
  | 'ehr.chart_context_loaded.v1'
  | 'clinicos.mode_resolved.v1'
  | 'clinicos.mapping_recorded.v1'
  | 'clinicos.event_published.v1'
  | 'clinicos.unavailable.v1'
  | 'ai.request_prepared.v1'
  | 'ai.context_scrubbed.v1'
  | 'ai.phi_rejected.v1'
  | 'ai.response_recorded.v1'
  | 'ai.output_rejected.v1'
  | 'coaching.signal_created.v1'
  | 'coaching.report_generated.v1'
  | 'coaching.dashboard_viewed.v1'
  | 'retention.scan_completed.v1'
  | 'audit.export_requested.v1'
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

export interface DraftClaimPreviewDto {
  draftClaimPreviewId: string;
  noteId: string;
  status: 'draft_preview';
  claimReadiness: 'ready' | 'needs_billing_review' | 'blocked';
  patientReference: string;
  encounterDate: string;
  renderingClinicianId: string;
  placeOfService: string;
  visitType: string;
  cptCandidates: string[];
  hcpcsCandidates: string[];
  icd10Candidates: string[];
  emCandidate: string;
  diagnosisToServiceLinks: string[];
  payerReadableJustification: string;
  missingEvidence: string[];
  denialRiskFlags: string[];
  estimateStatus: 'unavailable_caveated' | 'configured';
  estimateCaveat: string;
  billingReviewTriggered: boolean;
  submittedClaim: false;
}

export interface BillingAttestationDto {
  billingAttestationId: string;
  noteId: string;
  requiredStatements: string[];
  acceptedStatements: string[];
  estimateCaveatAcknowledged: boolean;
  billingReviewTriggered: boolean;
  attestedByUserId: string;
  attestedAt: string;
}

export interface FinalNoteRecordDto {
  finalNoteId: string;
  noteId: string;
  appointmentId: string;
  safePatientId: string;
  clinicianId: string;
  finalNoteText: string;
  finalizedAt: string;
  readOnly: true;
}

export interface PatientSummaryRecordDto {
  patientSummaryId: string;
  noteId: string;
  patientSummaryText: string;
  finalizedAt: string;
  patientFacing: true;
  internalBillingDetailsExcluded: true;
}

export interface ExportArtifactDto {
  exportArtifactId: string;
  noteId: string;
  artifactType: ExportArtifactType;
  status: 'generated';
  mimeType: 'application/pdf' | 'text/plain' | 'application/json';
  fileName: string;
  generatedAt: string;
  generatedByUserId: string;
  sourceFinalizedAt: string;
  signedVersionLocked: true;
  patientSummaryInternalDetailsExcluded?: true;
  content: string;
  checksum: string;
}

export type EhrWritebackTarget = 'final_note' | 'patient_summary' | 'both';
export type EhrWritebackScaffoldMode = 'not_configured' | 'mock_queue' | 'simulate_failure' | 'unsupported_by_vendor';

export interface EhrWritebackQueueDto {
  writebackJobId: string;
  noteId: string;
  target: EhrWritebackTarget;
  vendor: 'athenahealth' | 'generic_mock';
  status: EhrWritebackStatus;
  configured: boolean;
  humanApproved: boolean;
  retryable: boolean;
  queuedAt?: string;
  failedAt?: string;
  failureReason?: string;
  externalJobId?: string;
}

export interface EhrWritebackRequestDto {
  target: EhrWritebackTarget;
  humanApproved: boolean;
  scaffoldMode?: EhrWritebackScaffoldMode;
}

export interface FinalizedNoteDetailDto extends FinalizedNoteSummaryDto {
  finalNote?: FinalNoteRecordDto;
  patientSummary?: PatientSummaryRecordDto;
  draftClaimPreview?: DraftClaimPreviewDto;
  exportArtifacts: ExportArtifactDto[];
  writeback: EhrWritebackQueueDto;
  availableActions: {
    copyFinalNote: boolean;
    copyPatientSummary: boolean;
    downloadFinalNotePdf: boolean;
    downloadPatientSummaryPdf: boolean;
    exportStructured: boolean;
    queueEhrWriteback: boolean;
  };
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
  draftClaimPreview?: DraftClaimPreviewDto;
  billingAttestation?: BillingAttestationDto;
  finalNote?: FinalNoteRecordDto;
  patientSummary?: PatientSummaryRecordDto;
  exportArtifacts: ExportArtifactDto[];
  writeback: EhrWritebackQueueDto;
  finalNoteApproved: boolean;
  patientSummaryApproved: boolean;
  readyForBillingAttest: boolean;
  billingAttested: boolean;
  signedAndDispatched: boolean;
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

export interface BillingAttestRequestDto {
  acceptedStatements: string[];
  estimateCaveatAcknowledged: boolean;
  routeToBillingReview: boolean;
}

export interface FinalizationActionResponseDto {
  finalizationSession: FinalizationSessionDto;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export interface ExportActionResponseDto {
  artifact: ExportArtifactDto;
  finalizedNote: FinalizedNoteDetailDto;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export interface EhrWritebackActionResponseDto {
  writeback: EhrWritebackQueueDto;
  finalizedNote: FinalizedNoteDetailDto;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export type EhrAdapterModeDto = 'disabled' | 'mock' | 'sandbox' | 'production';
export type EhrAdapterHealthDto = 'ok' | 'degraded' | 'disabled' | 'failed';
export type EhrChartContextSliceTypeDto =
  | 'demographics'
  | 'encounter'
  | 'appointment'
  | 'problems'
  | 'diagnoses_history'
  | 'medications'
  | 'allergies'
  | 'immunizations'
  | 'vitals'
  | 'labs'
  | 'documents'
  | 'prior_notes'
  | 'procedures'
  | 'social_history'
  | 'quality'
  | 'payer'
  | 'tasks'
  | 'billing_context';
export type EhrVendorDto = 'athenahealth' | 'epic' | 'eclinicalworks' | 'generic_mock';

export interface EhrAdapterStatusDto {
  vendor: EhrVendorDto;
  connected: boolean;
  mode: EhrAdapterModeDto;
  tenantId: string;
  siteId: string;
  health: EhrAdapterHealthDto;
  warnings: string[];
}

export interface EhrWritebackCapabilityMatrixDto {
  vendor: EhrVendorDto;
  finalNote: boolean;
  patientSummary: boolean;
  tasks: boolean;
  attachments: boolean;
  configured: boolean;
  unsupportedReasons: string[];
}

export interface EhrPatientSearchResultDto {
  safePatientId: string;
  externalPatientRef: string;
  sourceSystem: EhrVendorDto;
  displayLabel: string;
  matchConfidence: number;
  source: 'mock' | 'athenahealth_sandbox';
}

export interface EhrChartContextSliceDto {
  sliceType: EhrChartContextSliceTypeDto;
  sourceSystem: EhrVendorDto;
  sourceRecordRef: string;
  value: Record<string, unknown>;
  effectiveAt: string;
  freshness: 'current_visit' | 'recent' | 'historical' | 'unknown';
  sourceQuality: 'high' | 'medium' | 'low';
  phiClassification: 'phi_reference' | 'restricted';
  allowedPurposes: Array<'care' | 'documentation' | 'billing_review' | 'ai_context_packaging'>;
  evidenceIds: string[];
}

export interface EhrChartContextPackageDto {
  chartContextPackageId: string;
  tenantId: string;
  siteId: string;
  safePatientId: string;
  externalPatientRef: string;
  externalEncounterId: string;
  sourceSystem: EhrVendorDto;
  requestedSlices: EhrChartContextSliceTypeDto[];
  slices: EhrChartContextSliceDto[];
  staleSliceCount: number;
  createdAt: string;
  warnings: string[];
}

export interface EhrIntegrationStatusDto {
  status: EhrAdapterStatusDto;
  capabilities: EhrWritebackCapabilityMatrixDto;
  checkedAt: string;
  standaloneSafe: true;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export interface EhrChartContextResponseDto {
  chartContext: EhrChartContextPackageDto;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export type AuraNoteHostModeDto = 'standalone' | 'clinicos_integrated' | 'ehr_embedded' | 'hybrid_transition';
export type ClinicOsModuleIdDto = 'M03' | 'M04' | 'M17' | 'M21' | 'M23' | 'M24' | 'M25' | 'M26';
export type ClinicOsAvailabilityDto = 'available' | 'disabled' | 'unavailable' | 'degraded';
export type ClinicOsSourceOfTruthDto = 'aura_note' | 'clinicos' | 'ehr' | 'hybrid';
export type ClinicOsMappingStatusDto = 'active' | 'pending' | 'unavailable' | 'failed';

export interface ClinicOsModeContextDto {
  enabled: boolean;
  hostMode: AuraNoteHostModeDto;
  tenantId: string;
  siteId: string;
  availability: ClinicOsAvailabilityDto;
  visitGraphId?: string;
  workOsQueueId?: string;
  npCockpitContextId?: string;
  chargeIntegrityContextId?: string;
  copilotRuntimeContextId?: string;
  governanceContextId?: string;
  integrationHubContextId?: string;
  dataCloudContextId?: string;
  warnings: string[];
}

export interface ClinicOsMappingRecordDto {
  mappingId: string;
  tenantId: string;
  siteId: string;
  localObjectType: 'appointment' | 'note' | 'task' | 'ai_request' | 'charge_preview' | 'event' | 'analytics_signal';
  localObjectId: string;
  clinicosModuleId: ClinicOsModuleIdDto;
  clinicosObjectId: string;
  sourceOfTruth: ClinicOsSourceOfTruthDto;
  status: ClinicOsMappingStatusDto;
  createdAt: string;
}

export interface ClinicOsPublishedEventDto {
  outboxId: string;
  tenantId: string;
  siteId: string;
  eventType: string;
  targetModules: ClinicOsModuleIdDto[];
  status: 'queued' | 'skipped_disabled' | 'failed_unavailable';
  createdAt: string;
}

export interface ClinicOsIntegrationStatusDto {
  modeContext: ClinicOsModeContextDto;
  mappings: ClinicOsMappingRecordDto[];
  publishedEvents: ClinicOsPublishedEventDto[];
  permissionsStillEnforcedByAuraNote: true;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export interface ClinicOsMapVisitRequestDto {
  localAppointmentId: string;
  localNoteId: string;
}

export interface ClinicOsMapVisitResponseDto {
  modeContext: ClinicOsModeContextDto;
  visitGraphId?: string;
  m17ContextId?: string;
  mappings: ClinicOsMappingRecordDto[];
  publishedEvent: ClinicOsPublishedEventDto;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export type AiGatewayPurposeDto = 'suggestions' | 'compose_note' | 'patient_summary' | 'billing_preview' | 'coaching';
export type AiGatewayOutputTypeDto = 'suggestion' | 'draft' | 'candidate' | 'summary' | 'coaching_feedback';
export type AiGatewayModelModeDto = 'mock' | 'private_baa' | 'external_disabled';
export type AiGatewayPolicyModeDto = 'mock_only' | 'external_disabled' | 'private_baa_governed';
export type AiPhiHandlingDto = 'reject' | 'redact';
export type AiHumanReviewStatusDto = 'required' | 'approved_by_human' | 'rejected_by_human';

export interface AiEvidenceNodeDto {
  evidenceId: string;
  evidenceType:
    | 'note_text'
    | 'transcript_segment'
    | 'chart_slice'
    | 'lab'
    | 'vital'
    | 'medication'
    | 'problem'
    | 'diagnosis'
    | 'quality_measure'
    | 'payer_rule'
    | 'staff_answer'
    | 'patient_form'
    | 'task'
    | 'prior_note';
  sourceSystem: 'aura_note' | 'ehr_adapter' | 'clinicos' | 'synthetic_fixture';
  sourceRef: string;
  displayLabel: string;
  excerptOrValue: string;
  freshness: 'current_visit' | 'recent' | 'historical' | 'unknown';
  sourceQuality: 'high' | 'medium' | 'low';
  phiClassification: 'deidentified' | 'phi_reference' | 'restricted';
  allowedRoles: string[];
}

export interface AiPromptRegistryEntryDto {
  promptId: string;
  promptVersion: string;
  purpose: AiGatewayPurposeDto;
  outputType: AiGatewayOutputTypeDto;
  sourceLinkRequired: boolean;
  humanReviewRequired: true;
}

export interface AiSafetyPolicyDto {
  policyId: string;
  mode: AiGatewayPolicyModeDto;
  externalAiEnabled: boolean;
  privateBaaRequired: true;
  humanReviewRequired: true;
  allowedOutputTypes: AiGatewayOutputTypeDto[];
  prohibitedAutonomousActions: string[];
}

export interface AiContextPackageDto {
  contextPackageId: string;
  tenantId: string;
  siteId: string;
  safePatientId: string;
  noteId?: string;
  appointmentId?: string;
  visitType?: string;
  clinicalFacts: Record<string, unknown>;
  evidence: AiEvidenceNodeDto[];
  sourceIds: string[];
  phiHandling: AiPhiHandlingDto;
  redactedPaths: string[];
  rejectedPaths: string[];
  deidentified: boolean;
  createdAt: string;
}

export interface AiGatewayInvocationRequestDto {
  purpose: AiGatewayPurposeDto;
  outputType?: AiGatewayOutputTypeDto;
  phiHandling?: AiPhiHandlingDto;
  safePatientId: string;
  noteId?: string;
  appointmentId?: string;
  visitType?: string;
  clinicalFacts: Record<string, unknown>;
  evidence: AiEvidenceNodeDto[];
}

export interface AiGatewayRequestDto {
  tenantId: string;
  siteId: string;
  purpose: AiGatewayPurposeDto;
  contextPackage: AiContextPackageDto;
  outputType: AiGatewayOutputTypeDto;
  traceId: string;
  promptId: string;
  promptVersion: string;
  modelVersion: string;
  policyMode: AiGatewayPolicyModeDto;
  humanReviewStatus: AiHumanReviewStatusDto;
}

export interface AiGatewayResponseDto {
  output: Record<string, unknown>;
  outputType: AiGatewayOutputTypeDto;
  modelMode: AiGatewayModelModeDto;
  confidence?: number;
  warnings: string[];
  promptId?: string;
  promptVersion?: string;
  modelVersion?: string;
  humanReviewRequired: true;
  sourceEvidenceIds: string[];
  rejected: boolean;
}

export interface AiGatewayStatusDto {
  policy: AiSafetyPolicyDto;
  promptRegistry: AiPromptRegistryEntryDto[];
  providerMode: AiGatewayModelModeDto;
  externalAiEnabled: false;
}

export interface AiGatewayInvocationResponseDto {
  request: AiGatewayRequestDto;
  response: AiGatewayResponseDto;
  contextPackage: AiContextPackageDto;
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

export interface FeatureFlagDecisionDto {
  key: string;
  enabled: boolean;
  governs: 'external_ai' | 'ehr_writeback' | 'clinicos_sync' | 'production_analytics' | 'audit_export_download';
  defaultValue: false;
  disabledReason?: string;
}

export interface StructuredLogEntryDto {
  service: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  requestId: string;
  traceId: string;
  eventName: string;
  timestamp: string;
  payload?: unknown;
  redactedPaths: string[];
  phiSafe: true;
}

export interface RetentionPolicyStatusDto {
  policyId: string;
  recordClass: RetentionClass;
  retentionRule: 'one_week' | 'indefinite' | 'tenant_policy';
  enforcedByJob: string;
  lastEvaluatedAt: string;
  candidateCount: number;
  purgeEligibleCount: number;
  destructivePurgeEnabled: false;
}

export interface RetentionJobResultDto {
  jobRunId: string;
  status: 'completed';
  evaluatedAt: string;
  policies: RetentionPolicyStatusDto[];
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export interface SupportFailureStateDto {
  component:
    | 'external_ai'
    | 'ehr_writeback'
    | 'clinicos_sync'
    | 'audit_export'
    | 'raw_audio_retention'
    | 'transcript_retention'
    | 'structured_logging';
  status: 'ok' | 'disabled' | 'degraded' | 'failed' | 'metadata_only';
  operatorMessage: string;
  safeDegradedMode: string;
}

export interface SupportStatusDto {
  service: 'aura-note';
  checkpoint: 'CP-4';
  mode: AppMode;
  generatedAt: string;
  overallHealth: 'ok' | 'degraded';
  featureFlags: FeatureFlagDecisionDto[];
  logging: {
    structured: true;
    requestCorrelated: true;
    phiRedaction: 'forbidden_keys_and_obvious_text';
    sample: StructuredLogEntryDto;
  };
  retention: RetentionPolicyStatusDto[];
  auditExport: {
    enabled: true;
    downloadEnabled: false;
    format: 'jsonl';
    redactedByDefault: true;
  };
  failureStates: SupportFailureStateDto[];
  ciRuntime: {
    nodeVersion: '20';
    pnpmVersion: '9.12.0';
    node20ActionWarningAcceptedUntil: 'WO-013';
  };
}

export interface AuditExportRequestDto {
  startAt: string;
  endAt: string;
  format: 'jsonl';
  includePhi: false;
  entityTypes?: string[];
}

export interface AuditExportRecordDto {
  auditEvent: AuditEventDto;
  domainEventType?: CoreEventType;
  requestId: string;
  redactedPayload: Record<string, unknown>;
  redactedPaths: string[];
}

export interface AuditExportDto {
  auditExportId: string;
  status: 'ready_synthetic';
  requestedByUserId: string;
  requestedAt: string;
  traceId: string;
  format: 'jsonl';
  includePhi: false;
  redacted: true;
  downloadEnabled: false;
  retentionClass: 'audit';
  recordCount: number;
  records: AuditExportRecordDto[];
}

export interface SupportStatusResponseDto {
  status: SupportStatusDto;
  auditEvent: AuditEventDto;
}

export interface AuditExportResponseDto {
  auditExport: AuditExportDto;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
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
  exportStatus?: 'not_generated' | 'generated' | 'failed';
  patientSummaryStatus?: 'not_available' | 'final';
  billingReviewStatus?: 'not_routed' | 'routed';
  writebackStatus?: EhrWritebackStatus;
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

export interface CoachingSignalDto {
  coachingSignalId: string;
  noteId: string;
  clinicianId?: string;
  category: CoachingSignalCategory;
  score: number;
  title: string;
  detail: string;
  evidenceIds: string[];
  improvementPrompt: string;
  billingRelated: boolean;
  patientFacingExcluded: true;
  generatedAt: string;
}

export interface CoachingReportDto {
  reportId: string;
  clinicianId: string;
  noteId: string;
  generatedAt: string;
  overallScore: number;
  signals: CoachingSignalDto[];
  unavailableReasons: string[];
  privacyLabel: 'own_clinician_only';
  patientFacingExcluded: true;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export interface CoachingDashboardDto {
  dashboardId: string;
  visibilityMode: CoachingVisibilityMode;
  generatedAt: string;
  aggregateOnly: boolean;
  providerCount: number;
  overallAverage: number;
  categoryAverages: Record<CoachingSignalCategory, number>;
  clinicianSummaries: Array<{
    clinicianId?: string;
    signalCount: number;
    averageScore: number;
  }>;
  roiSignals: {
    timeSavedMinutes: number;
    revenueCapturedLabel: 'internal_only_not_patient_facing';
    denialsReducedCount: number;
    trainingImprovementItems: number;
  };
  privacyLabel: 'admin_dashboard' | 'aggregate_only';
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export interface CoachingDashboardRequestDto {
  visibilityMode?: CoachingVisibilityMode;
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

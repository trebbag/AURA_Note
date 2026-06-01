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
export type StorageProviderDto = 'azure_blob' | 'in_memory';
export type StorageDeliveryModeDto = 'inline_synthetic' | 'storage_backed';

export type CoreEventType =
  | 'patient.shell_created.v1'
  | 'patient.updated.v1'
  | 'patient.linkage_recorded.v1'
  | 'appointment.created.v1'
  | 'appointment.updated.v1'
  | 'appointment.checked_in.v1'
  | 'appointment.cancelled.v1'
  | 'appointment.no_show_marked.v1'
  | 'note.shell_created.v1'
  | 'chart_context.snapshot_created.v1'
  | 'chart_context.snapshot_viewed.v1'
  | 'visit.started.v1'
  | 'visit.paused.v1'
  | 'visit.resumed.v1'
  | 'visit.stopped.v1'
  | 'recording.started.v1'
  | 'microphone.permission_recorded.v1'
  | 'recording.chunk_received.v1'
  | 'recording.exception_approved.v1'
  | 'recording.stopped.v1'
  | 'raw_audio.retention_scheduled.v1'
  | 'transcription.provider_status_checked.v1'
  | 'transcription.job_queued.v1'
  | 'transcription.job_processed.v1'
  | 'transcription.job_failed.v1'
  | 'transcript.segment_appended.v1'
  | 'transcript.segment_corrected.v1'
  | 'suggestions.evaluated.v1'
  | 'suggestion.accepted.v1'
  | 'suggestion.removed.v1'
  | 'visit_selection.added.v1'
  | 'compliance.evaluated.v1'
  | 'history_gap.task_created.v1'
  | 'task.adjudicated.v1'
  | 'task.blocker_changed.v1'
  | 'billing_review.status_changed.v1'
  | 'settings.integration_updated.v1'
  | 'identity.adapter_status_checked.v1'
  | 'identity.session_evaluated.v1'
  | 'identity.user_updated.v1'
  | 'config.validation_completed.v1'
  | 'feature_flag.updated.v1'
  | 'template.created.v1'
  | 'template.updated.v1'
  | 'dot_phrase.updated.v1'
  | 'estimate_config.updated.v1'
  | 'rules_catalog.published.v1'
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
  | 'storage.download_requested.v1'
  | 'storage.download_denied.v1'
  | 'storage.object_delivered.v1'
  | 'storage.object_missing.v1'
  | 'backup.posture_checked.v1'
  | 'restore.readiness_checked.v1'
  | 'observability.status_checked.v1'
  | 'support.status_checked.v1'
  | 'incident.runbook_viewed.v1'
  | 'degraded_mode.acknowledged.v1'
  | 'access_review.evidence_recorded.v1'
  | 'operational.readiness_checked.v1'
  | 'ehr_writeback.queued.v1'
  | 'ehr_writeback.failed.v1'
  | 'ehr.adapter_status_checked.v1'
  | 'ehr.patient_matched.v1'
  | 'ehr.chart_context_loaded.v1'
  | 'ehr.writeback_approval_recorded.v1'
  | 'ehr.writeback_retry_scheduled.v1'
  | 'ehr.writeback_dead_lettered.v1'
  | 'ehr.writeback_reconciliation_checked.v1'
  | 'ehr.writeback_disabled.v1'
  | 'clinicos.mode_resolved.v1'
  | 'clinicos.mapping_recorded.v1'
  | 'clinicos.event_published.v1'
  | 'clinicos.event_publication_failed.v1'
  | 'clinicos.mapping_stale_detected.v1'
  | 'clinicos.permission_denied.v1'
  | 'clinicos.unavailable.v1'
  | 'ai.request_prepared.v1'
  | 'ai.context_scrubbed.v1'
  | 'ai.phi_rejected.v1'
  | 'ai.response_recorded.v1'
  | 'ai.output_rejected.v1'
  | 'ai.prompt_config_changed.v1'
  | 'ai.model_config_changed.v1'
  | 'ai.evaluation_run_completed.v1'
  | 'ai.evaluation_run_failed.v1'
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

export type ApiErrorCategory =
  | 'validation'
  | 'permission_denied'
  | 'blocked'
  | 'read_only'
  | 'request_too_large'
  | 'throttled'
  | 'failed';

export interface ApiErrorDetail {
  code: string;
  message: string;
  statusCode: number;
  category: ApiErrorCategory;
  requestId: string;
  traceId: string;
  redacted: true;
  details?: unknown;
}

export interface ApiErrorEnvelope {
  error: ApiErrorDetail;
  meta: ApiMeta;
  warnings?: ApiWarning[];
}

export type IdentityProviderModeDto = 'local_synthetic' | 'clinicos_delegate' | 'oidc_delegate' | 'saml_delegate';
export type PurposeOfUseDto = 'treatment' | 'payment' | 'operations' | 'support' | 'audit' | 'coaching' | 'break_glass';
export type AuraAuthModeDto = 'local_demo' | 'local_synthetic' | 'preview_oidc' | 'production_oidc' | 'production_saml' | 'clinicos_delegate';
export type IdentityRuntimeSourceDto =
  | 'local_demo_headers'
  | 'local_synthetic_headers'
  | 'oidc_adapter'
  | 'saml_adapter'
  | 'clinicos_delegate_adapter'
  | 'none';
export type IdentityRuntimeFailureReasonDto =
  | 'auth_mode_missing'
  | 'auth_mode_invalid'
  | 'identity_context_missing'
  | 'invalid_identity_context'
  | 'synthetic_headers_forbidden'
  | 'delegated_identity_not_configured'
  | 'disabled_user'
  | 'expired_session'
  | 'wrong_tenant_or_site'
  | 'wrong_purpose';

export interface LocalAuthSessionDto {
  tenantId: string;
  siteId: string;
  userId: string;
  role:
    | 'clinician'
    | 'ma'
    | 'billing_staff'
    | 'admin'
    | 'authorized_admin'
    | 'clinic_manager'
    | 'compliance_privacy_lead'
    | 'support'
    | 'service_account';
  sessionId: string;
  identityProviderMode: IdentityProviderModeDto;
  purposeOfUse: PurposeOfUseDto;
  localSyntheticOnly: boolean;
}

export interface IdentityRuntimeBoundaryDecisionDto {
  allowed: boolean;
  authMode: AuraAuthModeDto | 'disabled';
  identitySource: IdentityRuntimeSourceDto;
  failureReason?: IdentityRuntimeFailureReasonDto;
  liveCredentialPresent: false;
  delegatedIdentityConfigured: false;
  rawTokenReturned: false;
  syntheticHeadersAccepted: boolean;
}

export interface TenantScopeDecisionDto {
  allowed: boolean;
  tenantId: string;
  siteId?: string;
  deniedReason?: string;
}

export type PlatformEnvironmentDto = 'local' | 'staging' | 'production';
export type IdentityAdapterKindDto = 'local_dev' | 'oidc' | 'saml' | 'clinicos_delegate';
export type IdentityAdapterStatusDto = 'ready_local' | 'disabled_until_configured' | 'unsupported_without_credentials';
export type WorkforceUserStatusDto = 'active' | 'disabled';
export type SecretSourceKindDto = 'not_configured' | 'environment_reference' | 'secret_manager_reference';
export type HighRiskFeatureFlagGovernanceDto =
  | 'live_transcription'
  | 'external_ai'
  | 'ehr_writeback'
  | 'production_storage'
  | 'retention_deletion'
  | 'patient_facing_estimates'
  | 'claim_submission';

export interface IdentityAdapterStatusViewDto {
  adapterId: string;
  kind: IdentityAdapterKindDto;
  identityProviderMode: IdentityProviderModeDto;
  status: IdentityAdapterStatusDto;
  configured: boolean;
  liveCredentialPresent: false;
  delegatedIdentityAllowed: boolean;
  disabledReason?: string;
}

export interface WorkforceUserAdminDto {
  userId: string;
  tenantId: string;
  siteIds: string[];
  role: LocalAuthSessionDto['role'];
  status: WorkforceUserStatusDto;
  allowedPurposes: PurposeOfUseDto[];
  disabledUserBlocked: boolean;
  syntheticOnly: true;
}

export interface SessionEvaluationRequestDto {
  userId: string;
  sessionId: string;
  tenantId: string;
  siteId: string;
  identityProviderMode: IdentityProviderModeDto;
  purposeOfUse?: PurposeOfUseDto;
  expiresAt: string;
  disabled?: boolean;
}

export interface SessionEvaluationDto {
  allowed: boolean;
  denialReason?: string;
  userId: string;
  sessionId: string;
  identityProviderMode: IdentityProviderModeDto;
  purposeOfUse?: PurposeOfUseDto;
  expiresAt: string;
  evaluatedAt: string;
  failClosed: true;
  rawTokenReturned: false;
}

export interface SecretSourceStatusDto {
  secretName: string;
  source: SecretSourceKindDto;
  configured: boolean;
  valueReturned: false;
  requiredFor: HighRiskFeatureFlagGovernanceDto | 'identity_provider';
}

export interface ProductionConfigValidationRequestDto {
  environment: PlatformEnvironmentDto;
  secretSources: SecretSourceStatusDto[];
  highRiskFlags?: Array<{
    key: string;
    enabled: boolean;
    approvalId?: string;
  }>;
}

export interface ProductionConfigValidationDto {
  environment: PlatformEnvironmentDto;
  valid: boolean;
  failClosed: true;
  errors: string[];
  warnings: string[];
  secretValuesReturned: false;
  productionCredentialsRequired: boolean;
}

export interface GovernedFeatureFlagDto {
  key: string;
  enabled: boolean;
  defaultValue: false;
  governs: HighRiskFeatureFlagGovernanceDto;
  highRisk: true;
  approvalRequired: true;
  approvalId?: string;
  runtimeEffect: 'disabled' | 'metadata_only_no_live_execution';
  liveExecutionEnabled: false;
  visibleToAdmins: true;
}

export interface UpdateWorkforceUserRequestDto {
  status: WorkforceUserStatusDto;
  reason: string;
}

export interface UpdateGovernedFeatureFlagRequestDto {
  enabled: boolean;
  approvalId?: string;
  reason: string;
}

export interface PlatformAdminViewDto {
  tenant: {
    tenantId: string;
    displayName: string;
    standaloneOwned: true;
  };
  sites: Array<{
    siteId: string;
    displayName: string;
    status: 'active';
  }>;
  identityAdapters: IdentityAdapterStatusViewDto[];
  users: WorkforceUserAdminDto[];
  sessionPolicies: {
    expirationEnforced: true;
    disabledUsersFailClosed: true;
    purposeOfUseRequired: true;
    spoofedTenantDenied: true;
  };
  secretSources: SecretSourceStatusDto[];
  featureFlags: GovernedFeatureFlagDto[];
  modeMappings: Array<{
    localObject: string;
    clinicosTarget: string;
    status: 'safe_degraded' | 'not_configured';
  }>;
  states: string[];
  demoFixture: true;
}

export interface PlatformActionResponseDto {
  platform?: PlatformAdminViewDto;
  sessionDecision?: SessionEvaluationDto;
  configValidation?: ProductionConfigValidationDto;
  featureFlag?: GovernedFeatureFlagDto;
  user?: WorkforceUserAdminDto;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
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
  storageProvider?: StorageProviderDto;
  storageKey?: string;
  checksum?: string;
  contentLengthBytes?: number;
}

export type MicrophonePermissionStateDto = 'prompt_required' | 'granted' | 'denied' | 'unsupported';
export type RecordingTransportModeDto = 'metadata_only_synthetic';
export type TranscriptionProviderModeDto = 'mock_only' | 'external_disabled';
export type TranscriptionJobStatusDto = 'queued' | 'processed' | 'failed';

export interface RecordingPermissionDto {
  appointmentId: string;
  noteId: string;
  permissionState: MicrophonePermissionStateDto;
  userGestureConfirmed: boolean;
  browserSupported: boolean;
  liveAudioCaptureEnabled: false;
  rawPhiAudioStored: false;
  recordedAt: string;
}

export interface RecordMicrophonePermissionRequestDto {
  permissionState: MicrophonePermissionStateDto;
  userGestureConfirmed: boolean;
  browserSupported: boolean;
}

export interface RecordingChunkMetadataDto {
  chunkId: string;
  appointmentId: string;
  noteId: string;
  visitSessionId: string;
  sequence: number;
  capturedAt: string;
  durationMs: number;
  contentLengthBytes: number;
  checksum: string;
  transportMode: RecordingTransportModeDto;
  rawPhiAudioStored: false;
  accepted: boolean;
  duplicate: boolean;
  idempotencyKey?: string;
  storageProvider?: StorageProviderDto;
  storageKey?: string;
}

export interface AppendRecordingChunkRequestDto {
  sequence: number;
  durationMs: number;
  contentLengthBytes: number;
  checksum?: string;
}

export interface TranscriptionProviderStatusDto {
  providerId: string;
  mode: TranscriptionProviderModeDto;
  configured: boolean;
  liveProviderCallsEnabled: false;
  baaRequiredBeforeLiveUse: true;
  supportsDiarization: false;
  speakerLabelMode: 'placeholder';
  confidenceMetadataAvailable: true;
  disabledReason?: string;
}

export interface TranscriptionJobDto {
  transcriptionJobId: string;
  appointmentId: string;
  noteId: string;
  providerId: string;
  providerMode: TranscriptionProviderModeDto;
  status: TranscriptionJobStatusDto;
  queuedAt: string;
  processedAt?: string;
  failedReason?: string;
  sourceChunkIds: string[];
  segmentCount: number;
  liveProviderCalled: false;
}

export interface TranscriptCorrectionDto {
  correctionId: string;
  transcriptSegmentId: string;
  noteId: string;
  previousText: string;
  correctedText: string;
  correctionReason: string;
  correctedByUserId: string;
  correctedAt: string;
  auditSafe: true;
}

export interface CorrectTranscriptSegmentRequestDto {
  correctedText: string;
  correctionReason: string;
}

export interface TranscriptSegmentDto {
  transcriptSegmentId: string;
  noteId: string;
  sequence: number;
  speakerRole: 'clinician' | 'patient' | 'ma' | 'system';
  text: string;
  source: 'mock_transcription';
  createdAt: string;
  confidence?: number;
  sourceChunkId?: string;
  speakerLabel?: string;
  providerName?: 'deterministic_mock';
  corrected?: boolean;
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
  corrections?: TranscriptCorrectionDto[];
  providerStatus?: TranscriptionProviderStatusDto;
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

export interface RecordingPermissionResponseDto {
  permission: RecordingPermissionDto;
  providerStatus: TranscriptionProviderStatusDto;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export interface RecordingChunkResponseDto {
  recordingChunk: RecordingChunkMetadataDto;
  rawAudioRetention: RawAudioRetentionMetadataDto;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export interface TranscriptionJobResponseDto {
  transcriptionJob: TranscriptionJobDto;
  providerStatus: TranscriptionProviderStatusDto;
  transcript: TranscriptViewDto;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export interface TranscriptCorrectionResponseDto {
  transcript: TranscriptViewDto;
  correction: TranscriptCorrectionDto;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export interface RecordingRetentionResponseDto {
  rawAudioRetention?: RawAudioRetentionMetadataDto;
  recordingChunks: RecordingChunkMetadataDto[];
  transcriptRetentionPolicy: 'indefinite';
  transcriptPurgeCount: 0;
  rawAudioPayloadStored: false;
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

export interface OperationalTaskDto extends TaskDto {
  tenantId: string;
  siteId: string;
  appointmentId?: string;
  patientDisplayLabel: string;
  dueAt: string;
  priority: 'routine' | 'urgent';
  worklist: 'task_inbox' | 'ma_follow_up';
  source: 'history_gap' | 'compliance' | 'billing_review' | 'manual_synthetic';
  demoFixture: true;
}

export interface TaskWorklistViewDto {
  tasks: OperationalTaskDto[];
  counts: {
    total: number;
    blockers: number;
    maFollowUp: number;
    overdue: number;
  };
  states: Array<'empty' | 'loading' | 'ready' | 'saving' | 'blocked' | 'failed' | 'permission-denied' | 'read-only' | 'demo fixture'>;
}

export interface UpdateOperationalTaskRequestDto {
  adjudicationStatus: TaskAdjudicationStatus;
  blocksSigning?: boolean;
  resolutionNote?: string;
}

export interface OperationalActionResponseDto {
  task?: OperationalTaskDto;
  billingReview?: BillingReviewQueueItemDto;
  template?: TemplateManagementDto;
  dotPhrase?: DotPhraseDto;
  estimateConfig?: EstimateConfigurationDto;
  rulesCatalog?: RulesCatalogViewDto;
  settings?: SettingsAdminViewDto;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export interface BillingReviewQueueItemDto {
  billingReviewId: string;
  tenantId: string;
  siteId: string;
  noteId: string;
  safePatientId: string;
  draftClaimPreviewId: string;
  status: 'triggered' | 'in_review' | 'needs_clinician' | 'cleared';
  transcriptAccess: 'not_requested' | 'allowed_for_triggered_review' | 'denied';
  transcriptAccessReason: string;
  draftClaimPreview: DraftClaimPreviewDto;
  assignedRole: 'billing_staff';
  dueAt: string;
  submittedClaim: false;
}

export interface BillingReviewQueueViewDto {
  items: BillingReviewQueueItemDto[];
  transcriptAccessLimitedToTriggeredReview: true;
  supportUsersDenied: true;
}

export interface UpdateBillingReviewRequestDto {
  status: BillingReviewQueueItemDto['status'];
  requestTranscriptAccess?: boolean;
  noteForClinician?: string;
}

export interface SettingsAdminViewDto {
  tenant: {
    tenantId: string;
    displayName: string;
    standaloneOwned: true;
  };
  sites: Array<{
    siteId: string;
    displayName: string;
    status: 'active';
  }>;
  users: Array<{
    userId: string;
    role: LocalAuthSessionDto['role'];
    status: 'active' | 'disabled';
    disabledUserBlocked: boolean;
  }>;
  featureFlags: FeatureFlagDto[];
  integrations: IntegrationConnectionDto[];
  modeMappings: Array<{
    localObject: string;
    clinicosTarget: string;
    status: 'safe_degraded' | 'not_configured';
  }>;
  demoFixture: true;
}

export interface FeatureFlagDto {
  key: string;
  enabled: boolean;
  governs: string;
  defaultValue: false;
  visibleToAdmins: true;
}

export interface IntegrationConnectionDto {
  integrationId: string;
  vendor: 'athenahealth' | 'clinicos' | 'generic_ehr' | 'payer_clearinghouse';
  status: 'disabled' | 'mock_ready' | 'not_configured';
  configured: boolean;
  liveCredentialPresent: false;
  mode: 'standalone_local' | 'mock_adapter';
}

export interface UpdateIntegrationRequestDto {
  status: 'disabled' | 'mock_ready';
  reason: string;
}

export interface TemplateManagementDto {
  templateId: string;
  tenantId: string;
  siteId: string;
  name: string;
  visitType: string;
  sections: string[];
  variables: string[];
  status: 'draft' | 'active' | 'retired';
  syntheticOnly: true;
}

export interface DotPhraseDto {
  dotPhraseId: string;
  tenantId: string;
  siteId: string;
  trigger: string;
  expansion: string;
  variables: string[];
  smartPhrasePlaceholders: string[];
  status: 'draft' | 'active' | 'retired';
  syntheticOnly: true;
}

export interface TemplatesViewDto {
  templates: TemplateManagementDto[];
  dotPhrases: DotPhraseDto[];
  forbiddenPhiRejected: true;
}

export interface CreateTemplateRequestDto {
  name: string;
  visitType: string;
  sections: string[];
  variables: string[];
}

export interface UpdateDotPhraseRequestDto {
  expansion: string;
  variables?: string[];
  status?: DotPhraseDto['status'];
}

export interface EstimateConfigurationDto {
  estimateConfigId: string;
  tenantId: string;
  siteId: string;
  internalEstimatesEnabled: boolean;
  patientFacingEstimatesEnabled: false;
  sourceDataConfigured: boolean;
  caveatText: string;
  updatedAt: string;
  syntheticOnly: true;
}

export interface UpdateEstimateConfigurationRequestDto {
  internalEstimatesEnabled: boolean;
  patientFacingEstimatesEnabled?: boolean;
  caveatText: string;
}

export interface RulesCatalogEntryDto {
  ruleId: string;
  category: 'cpt' | 'hcpcs' | 'icd10' | 'hcc' | 'em' | 'quality_measure' | 'visit_type' | 'confidence_threshold';
  codeOrKey: string;
  title: string;
  sourceEvidence: string[];
  effectiveDate: string;
  status: 'draft' | 'active';
  humanReviewRequired: true;
  autonomousFinalizationAllowed: false;
  medicalNecessityDeterminationAllowed: false;
}

export interface RulesCatalogViewDto {
  entries: RulesCatalogEntryDto[];
  sourceEvidenceRequired: true;
  certifiedProductionRules: false;
  draftOnly: true;
}

export interface PublishRulesCatalogRequestDto {
  ruleIds: string[];
  attestation: string;
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
  retentionClass?: RetentionClass;
  deliveryMode?: StorageDeliveryModeDto;
  storageProvider?: StorageProviderDto;
  storageKey?: string;
  contentLengthBytes?: number;
  signedDownloadAvailable?: boolean;
  signedDownloadToken?: string;
  signedDownloadExpiresAt?: string;
}

export interface SecureDownloadRequestDto {
  signedDownloadToken: string;
}

export interface SecureDownloadDeliveryDto {
  status: 'delivered_synthetic';
  storageProvider: StorageProviderDto;
  storageKey: string;
  contentType: string;
  contentLengthBytes: number;
  checksum: string;
  eTag: string;
  signedDownloadExpiresAt: string;
  deliveryMode: 'storage_backed';
  serverMediated: true;
  publicUrl: null;
  permission: 'final_note:export' | 'patient_summary:export' | 'audit:export';
  patientSummaryInternalDetailsExcluded?: true;
  traceId: string;
}

export interface SecureDownloadResponseDto {
  download: SecureDownloadDeliveryDto;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
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
export type EhrVendorDto = 'athenahealth' | 'epic' | 'eclinicalworks' | 'generic_mock' | 'standalone_local';

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

export type StandalonePatientStatusDto = 'active' | 'inactive';
export type ChartContextSourceFreshnessDto = 'current_visit' | 'recent' | 'historical' | 'unknown';

export interface StandalonePatientDto {
  patientId: string;
  tenantId: string;
  siteId: string;
  safePatientId: string;
  status: StandalonePatientStatusDto;
  displayLabel: string;
  preferredModality?: AppointmentModality;
  createdAt: string;
  updatedAt: string;
  mode: AppMode;
}

export interface StandalonePatientLinkageDto {
  patientLinkageId: string;
  tenantId: string;
  siteId: string;
  safePatientId: string;
  appointmentId?: string;
  noteId?: string;
  linkedObjectType: 'appointment' | 'note' | 'chart_context' | 'task' | 'finalization';
  linkedObjectId: string;
  purpose: 'treatment' | 'documentation' | 'operations';
  active: boolean;
  createdAt: string;
}

export interface CreateStandalonePatientRequestDto {
  safePatientId: string;
  displayLabel?: string;
  preferredModality?: AppointmentModality;
}

export interface UpdateStandalonePatientRequestDto {
  displayLabel?: string;
  status?: StandalonePatientStatusDto;
  preferredModality?: AppointmentModality;
}

export interface StandalonePatientSearchQueryDto {
  safePatientId?: string;
  status?: StandalonePatientStatusDto;
}

export interface StandalonePatientSearchViewDto {
  patients: StandalonePatientDto[];
  demoFixtureState: true;
  realPhiExcluded: true;
}

export interface StandalonePatientResponseDto {
  patient: StandalonePatientDto;
  linkages: StandalonePatientLinkageDto[];
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export interface StandaloneChartContextSnapshotDto {
  chartContextSnapshotId: string;
  tenantId: string;
  siteId: string;
  safePatientId: string;
  appointmentId?: string;
  noteId?: string;
  sourceSystem: 'standalone_local';
  sourceFreshness: ChartContextSourceFreshnessDto;
  staleWarning: boolean;
  slices: EhrChartContextSliceDto[];
  warnings: string[];
  aiPackagingAllowed: false;
  productionPhiStorageApproved: false;
  createdAt: string;
  mode: AppMode;
}

export interface StandaloneChartContextResponseDto {
  chartContextSnapshot: StandaloneChartContextSnapshotDto;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
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

export type EhrWritebackLifecycleStatusDto =
  | 'disabled'
  | 'pending_approval'
  | 'approved'
  | 'queued'
  | 'retrying'
  | 'failed'
  | 'dead_lettered'
  | 'reconciled';

export type EhrWritebackQueueActionDto = 'approve' | 'retry' | 'dead_letter' | 'reconcile';

export interface EhrWritebackQueueItemDto {
  writebackJobId: string;
  noteId: string;
  target: EhrWritebackTarget;
  vendor: EhrVendorDto;
  externalEncounterId: string;
  status: EhrWritebackLifecycleStatusDto;
  configured: boolean;
  humanApproved: boolean;
  liveDeliveryEnabled: false;
  retryable: boolean;
  retryCount: number;
  maxRetries: number;
  idempotencyKey: string;
  traceId: string;
  auditSafe: true;
  payloadStored: false;
  queuedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  approvalId?: string;
  lastAttemptAt?: string;
  nextRetryAt?: string;
  failedAt?: string;
  failureReason?: string;
  deadLetteredAt?: string;
  deadLetterReason?: string;
  reconciliationId?: string;
  reconciledAt?: string;
  externalJobId?: string;
}

export interface EhrWritebackQueueViewDto {
  items: EhrWritebackQueueItemDto[];
  sandboxMode: 'disabled' | 'mock' | 'sandbox';
  liveProductionWritebackEnabled: false;
  payloadsExcluded: true;
  states: EhrWritebackLifecycleStatusDto[];
  warnings: string[];
}

export interface EhrWritebackQueueResponseDto {
  queue: EhrWritebackQueueViewDto;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export interface EhrWritebackQueueActionRequestDto {
  action: EhrWritebackQueueActionDto;
  approvalId?: string;
  reason?: string;
  reconciliationId?: string;
}

export interface EhrWritebackQueueActionResponseDto {
  writeback: EhrWritebackQueueItemDto;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export type AuraNoteHostModeDto = 'standalone' | 'clinicos_integrated' | 'ehr_embedded' | 'hybrid_transition';
export type ClinicOsModuleIdDto = 'M03' | 'M04' | 'M17' | 'M21' | 'M23' | 'M24' | 'M25' | 'M26';
export type ClinicOsAvailabilityDto = 'available' | 'disabled' | 'unavailable' | 'degraded';
export type ClinicOsSourceOfTruthDto = 'aura_note' | 'clinicos' | 'ehr' | 'hybrid';
export type ClinicOsMappingStatusDto = 'active' | 'pending' | 'stale' | 'degraded' | 'unavailable' | 'failed';
export type ClinicOsPublishedEventStatusDto = 'queued' | 'sent_mock' | 'skipped_disabled' | 'failed_unavailable' | 'degraded';
export type AuraModeAdapterSeamDto =
  | 'scheduleSource'
  | 'patientContext'
  | 'visitGraph'
  | 'tasks'
  | 'audit'
  | 'aiGovernance'
  | 'chargeIntegrity'
  | 'ehr'
  | 'export'
  | 'identity';
export type AuraModeAdapterStatusDto = 'standalone_authoritative' | 'mock_available' | 'mock_degraded' | 'unavailable' | 'disabled';

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
  staleReason?: string;
  degradedReason?: string;
  traceId: string;
  lastCheckedAt: string;
  lastPublishedAt?: string;
  createdAt: string;
}

export interface ClinicOsPublishedEventDto {
  outboxId: string;
  tenantId: string;
  siteId: string;
  eventType: string;
  targetModules: ClinicOsModuleIdDto[];
  status: ClinicOsPublishedEventStatusDto;
  payloadStored: false;
  permissionBoundaryEnforced: true;
  degradedReason?: string;
  failedReason?: string;
  createdAt: string;
}

export interface ClinicOsModuleBoundaryDto {
  moduleId: ClinicOsModuleIdDto;
  moduleName: string;
  maps: string;
  sourceOfTruth: ClinicOsSourceOfTruthDto;
  delegationEnabled: boolean;
  permissionBoundary: 'aura_note_authoritative';
}

export interface AuraModeAdapterBoundaryDto {
  seam: AuraModeAdapterSeamDto;
  displayName: string;
  sourceOfTruth: ClinicOsSourceOfTruthDto;
  adapterStatus: AuraModeAdapterStatusDto;
  permissionBoundary: 'aura_note_authoritative';
  liveDelegationEnabled: false;
  rawPayloadStorageEnabled: false;
  humanReviewRequired: true;
  writesFailClosed: boolean;
  notes: string;
  clinicOsModuleId?: ClinicOsModuleIdDto;
}

export interface ClinicOsIntegrationStatusDto {
  modeContext: ClinicOsModeContextDto;
  moduleBoundaries: ClinicOsModuleBoundaryDto[];
  modeAdapterBoundaries: AuraModeAdapterBoundaryDto[];
  mappings: ClinicOsMappingRecordDto[];
  publishedEvents: ClinicOsPublishedEventDto[];
  permissionsStillEnforcedByAuraNote: true;
  rawPayloadsStored: false;
  liveClinicOsSyncEnabled: false;
  states: string[];
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export interface ClinicOsMapVisitRequestDto {
  localAppointmentId: string;
  localNoteId: string;
}

export interface ClinicOsMapVisitResponseDto {
  modeContext: ClinicOsModeContextDto;
  modeAdapterBoundaries?: AuraModeAdapterBoundaryDto[];
  visitGraphId?: string;
  m17ContextId?: string;
  mappings: ClinicOsMappingRecordDto[];
  publishedEvent: ClinicOsPublishedEventDto;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export interface ClinicOsMappingUpsertRequestDto {
  localObjectType: ClinicOsMappingRecordDto['localObjectType'];
  localObjectId: string;
  clinicosModuleId: ClinicOsModuleIdDto;
  clinicosObjectId?: string;
  sourceOfTruth?: ClinicOsSourceOfTruthDto;
  status?: ClinicOsMappingStatusDto;
  reason?: string;
}

export interface ClinicOsMappingUpsertResponseDto {
  modeContext: ClinicOsModeContextDto;
  modeAdapterBoundaries?: AuraModeAdapterBoundaryDto[];
  mapping: ClinicOsMappingRecordDto;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export interface ClinicOsEventPublishRequestDto {
  eventType: string;
  targetModules?: ClinicOsModuleIdDto[];
  localObjectId?: string;
}

export interface ClinicOsEventPublishResponseDto {
  modeContext: ClinicOsModeContextDto;
  modeAdapterBoundaries?: AuraModeAdapterBoundaryDto[];
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
export type AiValidationStatusDto = 'accepted' | 'rejected';
export type AiRiskLabelDto = 'low' | 'moderate' | 'high' | 'unsafe';

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
  description?: string;
  sourceLinkRequired: boolean;
  humanReviewRequired: true;
  schemaVersion?: string;
  riskLabel?: AiRiskLabelDto;
  active?: boolean;
}

export interface AiModelConfigurationDto {
  modelConfigId: string;
  modelMode: AiGatewayModelModeDto;
  modelVersion: string;
  policyMode: AiGatewayPolicyModeDto;
  credentialSource: 'none' | 'private_baa_placeholder';
  privateBaaApproved: boolean;
  liveInvocationEnabled: false;
  externalEndpointConfigured: false;
  configuredAt: string;
}

export interface AiOutputValidationResultDto {
  validationStatus: AiValidationStatusDto;
  riskLabel: AiRiskLabelDto;
  unsafeReasons: string[];
  prohibitedActionDetected: boolean;
  rawPhiDetected: boolean;
  humanReviewRequired: true;
}

export interface AiEvaluationCaseDto {
  evalCaseId: string;
  purpose: AiGatewayPurposeDto;
  outputType: AiGatewayOutputTypeDto;
  syntheticOnly: true;
  expectedPromptId: string;
  sourceEvidenceIds: string[];
  expectedValidationStatus: AiValidationStatusDto;
}

export interface AiEvaluationResultDto {
  evalCaseId: string;
  purpose: AiGatewayPurposeDto;
  outputType: AiGatewayOutputTypeDto;
  promptId: string;
  promptVersion: string;
  modelVersion: string;
  modelMode: AiGatewayModelModeDto;
  policyMode: AiGatewayPolicyModeDto;
  validationStatus: AiValidationStatusDto;
  riskLabel: AiRiskLabelDto;
  humanReviewRequired: true;
  sourceEvidenceIds: string[];
  unsafeReasons: string[];
  prohibitedActionDetected: boolean;
  rawPhiDetected: boolean;
  liveModelCalled: false;
  passed: boolean;
  traceId: string;
  completedAt: string;
}

export interface AiEvaluationRunRequestDto {
  evalCaseIds?: string[];
}

export interface AiEvaluationRunResponseDto {
  results: AiEvaluationResultDto[];
  allPassed: boolean;
  liveModelCalled: false;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export interface AiOutputValidationRequestDto {
  outputType: AiGatewayOutputTypeDto;
  output: Record<string, unknown>;
  sourceEvidenceIds?: string[];
}

export interface AiOutputValidationResponseDto {
  validation: AiOutputValidationResultDto;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
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
  modelConfigurations?: AiModelConfigurationDto[];
  evaluationCases?: AiEvaluationCaseDto[];
  providerMode: AiGatewayModelModeDto;
  externalAiEnabled: false;
  liveModelCredentialPresent?: false;
  rawPhiToExternalAiAllowed?: false;
  humanReviewRequiredForAllOutputs?: true;
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

export interface ObservabilitySinkStatusDto {
  sinkId: string;
  kind: 'log' | 'metric' | 'trace' | 'audit_export' | 'siem' | 'apm';
  adapter: 'local_development' | 'disabled_production_placeholder';
  status: 'ready_local' | 'disabled_until_configured';
  redacted: true;
  requestCorrelated: true;
  delivery: 'console' | 'in_memory' | 'metadata_only' | 'not_configured';
  disabledReason?: string;
}

export interface MetricProbeDto {
  metricName: string;
  kind: 'counter' | 'gauge' | 'histogram';
  value: number;
  unit: 'count' | 'milliseconds' | 'items';
  labels: Record<string, string>;
  timestamp: string;
  phiSafe: true;
}

export interface TraceProbeDto {
  traceId: string;
  spanId: string;
  service: string;
  name: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  status: 'ok' | 'error';
  attributes: Record<string, string>;
  phiSafe: true;
}

export interface ObservabilityStatusDto {
  sinks: ObservabilitySinkStatusDto[];
  metricProbes: MetricProbeDto[];
  traceProbes: TraceProbeDto[];
}

export interface DeploymentEnvironmentDto {
  environment: 'local' | 'preview' | 'staging' | 'production';
  mode: AppMode;
  readiness: 'ready_local' | 'configuration_required' | 'blocked_until_security_review';
  nodeVersion: '20';
  pnpmVersion: '9.12.0';
  secretsRequired: string[];
  externalIntegrations: Array<'external_ai' | 'ehr_writeback' | 'clinicos_sync' | 'production_analytics' | 'audit_export_download'>;
  productionDataAllowed: false;
}

export interface RunbookIndexItemDto {
  runbookId: string;
  title: string;
  path: string;
  covers: Array<'deploy' | 'rollback' | 'incident_triage' | 'audit_export' | 'retention_review' | 'disabled_integrations'>;
  productionApprovalRequired: boolean;
}

export interface RetentionPolicyStatusDto {
  policyId: string;
  recordClass: RetentionClass;
  retentionRule: 'one_week' | 'indefinite' | 'tenant_policy';
  enforcedByJob: string;
  lastEvaluatedAt: string;
  candidateCount: number;
  purgeEligibleCount: number;
  destructivePurgeEnabled: boolean;
}

export interface RetentionJobResultDto {
  jobRunId: string;
  status: 'completed';
  evaluatedAt: string;
  policies: RetentionPolicyStatusDto[];
  deletionResults?: StorageDeletionEvidenceDto[];
  transcriptPurgeCount?: 0;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export interface StorageDeletionEvidenceDto {
  storageProvider: StorageProviderDto;
  storageKey: string;
  deleted: boolean;
  deletionResult: 'deleted' | 'not_found' | 'blocked_missing_approval' | 'blocked_recovery_window' | 'skipped_not_enabled';
  checksum?: string;
  eTag?: string;
  approvalId?: string;
  recoveryWindowStatus: 'recoverable' | 'not_configured' | 'expired';
  traceId: string;
  deletedAt?: string;
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
  checkpoint: 'CP-4' | 'P8';
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
  observability: ObservabilityStatusDto;
  deployment: DeploymentEnvironmentDto[];
  runbooks: RunbookIndexItemDto[];
  retention: RetentionPolicyStatusDto[];
  auditExport: {
    enabled: true;
    downloadEnabled: boolean;
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
  downloadEnabled: boolean;
  retentionClass: 'audit';
  recordCount: number;
  records: AuditExportRecordDto[];
  deliveryMode?: StorageDeliveryModeDto;
  storageProvider?: StorageProviderDto;
  storageKey?: string;
  contentLengthBytes?: number;
  checksum?: string;
  signedDownloadAvailable?: boolean;
  signedDownloadToken?: string;
  signedDownloadExpiresAt?: string;
}

export interface SupportStatusResponseDto {
  status: SupportStatusDto;
  auditEvent: AuditEventDto;
  domainEvents?: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export type OperationalEvidenceActionDto =
  | 'incident_runbook_viewed'
  | 'degraded_mode_acknowledged'
  | 'access_review_recorded';

export interface OperationalEvidenceRequestDto {
  actionType: OperationalEvidenceActionDto;
  subjectId: string;
  note?: string;
}

export interface OperationalEvidenceDto {
  evidenceId: string;
  actionType: OperationalEvidenceActionDto;
  subjectId: string;
  status: 'recorded_synthetic';
  tenantId: string;
  siteId: string;
  actorUserId: string;
  requestId: string;
  traceId: string;
  recordedAt: string;
  phiSafe: true;
  launchReadinessClaimed: false;
}

export interface OperationalEvidenceResponseDto {
  evidence: OperationalEvidenceDto;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export interface OperationalReadinessDto {
  status: 'ready_synthetic' | 'blocked_review';
  checkpoint: 'P8';
  observabilityReadyLocal: boolean;
  vendorSinksConfigured: false;
  supportOperationsReady: boolean;
  incidentRunbooksReady: boolean;
  accessReviewEvidenceReady: boolean;
  productionLaunchReady: false;
  missing: string[];
  traceId: string;
}

export interface OperationalReadinessResponseDto {
  readiness: OperationalReadinessDto;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export interface AuditExportResponseDto {
  auditExport: AuditExportDto;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export interface BackupRestoreReadinessDto {
  status: 'ready_synthetic' | 'blocked_review';
  objectStorageSoftDeleteRequired: true;
  objectStorageVersioningRequired: true;
  databaseBackupRequired: true;
  restoreExecutionEnabled: false;
  evidenceRetentionDays: number;
  missing: string[];
  traceId: string;
}

export interface BackupRestoreReadinessResponseDto {
  readiness: BackupRestoreReadinessDto;
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

export interface UpdateAppointmentRequestDto {
  clinicianId?: string;
  visitType?: string;
  startsAt?: string;
  durationMinutes?: number;
  modality?: AppointmentModality;
  reasonForVisit?: string;
}

export type AppointmentStatusActionDto = 'check_in' | 'cancel' | 'mark_no_show';

export interface AppointmentStatusActionRequestDto {
  action: AppointmentStatusActionDto;
  reason?: string;
}

export interface ScheduleAppointmentDto extends AppointmentDto {
  noteStatus: NoteState;
  noteVisibleInDrafts: boolean;
  startVisitEnabled: boolean;
  ehrSchedulingEnabled: boolean;
  clinicOsSchedulingEnabled: boolean;
  patientDisplayLabel?: string;
  chartContextFreshness?: ChartContextSourceFreshnessDto;
  chartContextWarnings?: string[];
}

export interface CreateAppointmentResponseDto {
  appointment: AppointmentDto;
  note: NoteDto;
  patient: StandalonePatientDto;
  linkages: StandalonePatientLinkageDto[];
  chartContextSnapshot: StandaloneChartContextSnapshotDto;
  auditEvent: AuditEventDto;
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
}

export interface AppointmentActionResponseDto {
  appointment: AppointmentDto;
  note: NoteDto;
  patient: StandalonePatientDto;
  linkages: StandalonePatientLinkageDto[];
  chartContextSnapshot: StandaloneChartContextSnapshotDto;
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
  viewMode?: 'day' | 'week';
  activeDate?: string;
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

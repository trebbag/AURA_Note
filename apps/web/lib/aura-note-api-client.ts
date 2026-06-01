import type {
  AddVisitSelectionRequestDto,
  AiEvaluationRunRequestDto,
  AiEvaluationRunResponseDto,
  AiGatewayInvocationRequestDto,
  AiGatewayInvocationResponseDto,
  AiGatewayStatusDto,
  AiOutputValidationRequestDto,
  AiOutputValidationResponseDto,
  ApiEnvelope,
  ApprovalRequestDto,
  AppointmentActionResponseDto,
  AppointmentStatusActionRequestDto,
  AppendRecordingChunkRequestDto,
  AppendTranscriptSegmentRequestDto,
  AuditExportRequestDto,
  AuditExportResponseDto,
  BackupRestoreReadinessResponseDto,
  BillingReviewQueueViewDto,
  BillingAttestRequestDto,
  ClinicOsEventPublishRequestDto,
  ClinicOsEventPublishResponseDto,
  ClinicOsIntegrationStatusDto,
  ClinicOsMappingUpsertRequestDto,
  ClinicOsMappingUpsertResponseDto,
  ClinicOsMapVisitRequestDto,
  ClinicOsMapVisitResponseDto,
  CoachingDashboardDto,
  CoachingReportDto,
  ComplianceReviewDto,
  CorrectTranscriptSegmentRequestDto,
  CreateAppointmentRequestDto,
  CreateAppointmentResponseDto,
  CreateHistoryGapTaskRequestDto,
  CreateStandalonePatientRequestDto,
  CreateTemplateRequestDto,
  DocumentationWorkspaceDto,
  DraftNotesViewDto,
  EhrChartContextResponseDto,
  EhrIntegrationStatusDto,
  EhrWritebackActionResponseDto,
  EhrWritebackQueueActionRequestDto,
  EhrWritebackQueueActionResponseDto,
  EhrWritebackQueueResponseDto,
  EhrWritebackRequestDto,
  EstimateConfigurationDto,
  ExportActionResponseDto,
  FinalizationActionResponseDto,
  FinalizationSessionDto,
  FinalizedNoteDetailDto,
  FinalizedNotesViewDto,
  HistoryGapQuestionDto,
  OperationalActionResponseDto,
  OperationalEvidenceRequestDto,
  OperationalEvidenceResponseDto,
  OperationalReadinessResponseDto,
  PlatformActionResponseDto,
  PlatformAdminViewDto,
  ProductionConfigValidationRequestDto,
  PublishRulesCatalogRequestDto,
  RecordMicrophonePermissionRequestDto,
  RecordingChunkResponseDto,
  RecordingExceptionRequestDto,
  RecordingPermissionResponseDto,
  RecordingRetentionResponseDto,
  ReviewActionResponseDto,
  RulesCatalogViewDto,
  ScheduleViewDto,
  SecureDownloadRequestDto,
  SecureDownloadResponseDto,
  SessionEvaluationRequestDto,
  SettingsAdminViewDto,
  StandaloneChartContextResponseDto,
  StandalonePatientResponseDto,
  StandalonePatientSearchViewDto,
  StartVisitResponseDto,
  SuggestionDecisionRequestDto,
  SuggestionsViewDto,
  SupportStatusResponseDto,
  TaskWorklistViewDto,
  TemplatesViewDto,
  TranscriptCorrectionResponseDto,
  TranscriptViewDto,
  TranscriptionJobResponseDto,
  TranscriptionProviderStatusDto,
  UpdateAppointmentRequestDto,
  UpdateBillingReviewRequestDto,
  UpdateDotPhraseRequestDto,
  UpdateEstimateConfigurationRequestDto,
  UpdateGovernedFeatureFlagRequestDto,
  UpdateIntegrationRequestDto,
  UpdateOperationalTaskRequestDto,
  UpdateStandalonePatientRequestDto,
  UpdateWorkforceUserRequestDto,
  VisitSelectionsViewDto,
  VisitSessionControlResponseDto
} from '@aura-note/contracts';

export type AuraNoteRuntimeRole = 'clinician' | 'ma' | 'billing_staff' | 'admin' | 'authorized_admin' | 'compliance_privacy_lead' | 'support';

export interface AuraNoteApiClientOptions {
  baseUrl?: string;
  role?: AuraNoteRuntimeRole;
  userId?: string;
  sessionId?: string;
  tenantId?: string;
  siteId?: string;
  purposeOfUse?: 'treatment' | 'payment' | 'operations' | 'support' | 'audit' | 'coaching' | 'break_glass';
  clinicOsMode?: 'standalone' | 'clinicos_integrated' | 'ehr_embedded' | 'hybrid_transition';
  clinicOsUnavailable?: boolean;
  clinicOsDegraded?: boolean;
}

const defaultBillingAttestationStatements = [
  'I have reviewed and accepted the final note.',
  'I have reviewed and accepted the patient summary.',
  'I have reviewed selected codes/items and understand they remain my responsibility.',
  'I have resolved, closed, or assigned open history questions.',
  'I understand the draft claim preview is a support tool and not an automated claim submission.'
];

export const frontendRuntimeBillingAttestationStatements = defaultBillingAttestationStatements;

export function getAuraNoteApiBaseUrl() {
  return process.env.AURA_NOTE_API_BASE_URL ?? process.env.NEXT_PUBLIC_AURA_NOTE_API_BASE_URL ?? 'http://127.0.0.1:4000/api/v1';
}

export function createAuraNoteApiClient(options: AuraNoteApiClientOptions = {}) {
  const baseUrl = (options.baseUrl ?? getAuraNoteApiBaseUrl()).replace(/\/$/, '');
  const role = options.role ?? 'clinician';
  const userId = options.userId ?? `user-${role}-synthetic-runtime`;
  const sessionId = options.sessionId ?? `session-${role}-synthetic-runtime`;
  const tenantId = options.tenantId ?? 'tenant-synthetic-primary';
  const siteId = options.siteId ?? 'site-synthetic-primary';
  const purposeOfUse = options.purposeOfUse ?? defaultPurposeForRole(role);

  async function request<TData>(path: string, init: RequestInit = {}): Promise<ApiEnvelope<TData>> {
    const headers = new Headers(init.headers);
    headers.set('content-type', headers.get('content-type') ?? 'application/json');
    headers.set('x-aura-role', role);
    headers.set('x-aura-user-id', userId);
    headers.set('x-aura-session-id', sessionId);
    headers.set('x-aura-tenant-id', tenantId);
    headers.set('x-aura-site-id', siteId);
    headers.set('x-aura-purpose-of-use', purposeOfUse);
    headers.set('x-aura-identity-provider', 'local_synthetic');
    if (options.clinicOsMode) headers.set('x-aura-clinicos-mode', options.clinicOsMode);
    if (options.clinicOsUnavailable !== undefined) headers.set('x-aura-clinicos-unavailable', String(options.clinicOsUnavailable));
    if (options.clinicOsDegraded !== undefined) headers.set('x-aura-clinicos-degraded', String(options.clinicOsDegraded));

    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      cache: 'no-store'
    });
    const payload = (await response.json()) as ApiEnvelope<TData> | { message?: string; error?: string };
    if (!response.ok) {
      const envelopeError =
        'error' in payload && payload.error && typeof payload.error === 'object'
          ? (payload.error as { message?: unknown }).message
          : undefined;
      const message =
        'message' in payload && payload.message
          ? payload.message
          : typeof envelopeError === 'string'
            ? envelopeError
            : `AURA Note API request failed: ${response.status}`;
      throw new Error(Array.isArray(message) ? message.join('; ') : message);
    }
    return payload as ApiEnvelope<TData>;
  }

  function post<TData>(path: string, body?: object, idempotencyKey?: string) {
    return request<TData>(path, {
      method: 'POST',
      ...(idempotencyKey ? { headers: { 'idempotency-key': idempotencyKey } } : {}),
      body: body ? JSON.stringify(body) : '{}'
    });
  }

  function patch<TData>(path: string, body: object, idempotencyKey?: string) {
    return request<TData>(path, {
      method: 'PATCH',
      ...(idempotencyKey ? { headers: { 'idempotency-key': idempotencyKey } } : {}),
      body: JSON.stringify(body)
    });
  }

  return {
    searchPatients: (query: { safePatientId?: string; status?: 'active' | 'inactive' } = {}) => {
      const search = new URLSearchParams();
      if (query.safePatientId) search.set('safePatientId', query.safePatientId);
      if (query.status) search.set('status', query.status);
      const suffix = search.size > 0 ? `?${search.toString()}` : '';
      return request<StandalonePatientSearchViewDto>(`/standalone/patients${suffix}`);
    },
    createPatient: (body: CreateStandalonePatientRequestDto, idempotencyKey?: string) =>
      post<StandalonePatientResponseDto>('/standalone/patients', body, idempotencyKey),
    updatePatient: (safePatientId: string, body: UpdateStandalonePatientRequestDto, idempotencyKey?: string) =>
      patch<StandalonePatientResponseDto>(`/standalone/patients/${safePatientId}`, body, idempotencyKey),
    listSchedule: () => request<ScheduleViewDto>('/schedule/appointments'),
    updateAppointment: (appointmentId: string, body: UpdateAppointmentRequestDto, idempotencyKey?: string) =>
      patch<AppointmentActionResponseDto>(`/schedule/appointments/${appointmentId}`, body, idempotencyKey),
    updateAppointmentStatus: (appointmentId: string, body: AppointmentStatusActionRequestDto, idempotencyKey?: string) =>
      post<AppointmentActionResponseDto>(`/schedule/appointments/${appointmentId}/status`, body, idempotencyKey),
    getChartContext: (appointmentId: string) =>
      request<StandaloneChartContextResponseDto>(`/schedule/appointments/${appointmentId}/chart-context`),
    listDraftNotes: () => request<DraftNotesViewDto>('/notes/drafts'),
    listFinalizedNotes: () => request<FinalizedNotesViewDto>('/notes/finalized'),
    getFinalizedNote: (noteId: string) => request<FinalizedNoteDetailDto>(`/notes/finalized/${noteId}`),
    createAppointment: (body: CreateAppointmentRequestDto, idempotencyKey?: string) =>
      post<CreateAppointmentResponseDto>('/schedule/appointments', body, idempotencyKey),
    startVisit: (appointmentId: string) => post<StartVisitResponseDto>(`/schedule/appointments/${appointmentId}/start-visit`),
    getDocumentationWorkspace: (appointmentId: string) =>
      request<DocumentationWorkspaceDto>(`/documentation-workspace/appointments/${appointmentId}`),
    pauseVisit: (appointmentId: string) =>
      post<VisitSessionControlResponseDto>(`/documentation-workspace/appointments/${appointmentId}/visit-session/pause`),
    resumeVisit: (appointmentId: string) =>
      post<VisitSessionControlResponseDto>(`/documentation-workspace/appointments/${appointmentId}/visit-session/resume`),
    stopVisit: (appointmentId: string) =>
      post<VisitSessionControlResponseDto>(`/documentation-workspace/appointments/${appointmentId}/visit-session/stop`),
    approveRecordingException: (appointmentId: string, body: RecordingExceptionRequestDto) =>
      post<VisitSessionControlResponseDto>(`/documentation-workspace/appointments/${appointmentId}/recording-exception`, body),
    recordMicrophonePermission: (appointmentId: string, body: RecordMicrophonePermissionRequestDto) =>
      post<RecordingPermissionResponseDto>(`/documentation-workspace/appointments/${appointmentId}/recording/permission`, body),
    appendRecordingChunk: (appointmentId: string, body: AppendRecordingChunkRequestDto, idempotencyKey?: string) =>
      post<RecordingChunkResponseDto>(`/documentation-workspace/appointments/${appointmentId}/recording/chunks`, body, idempotencyKey),
    getRecordingRetention: (appointmentId: string) =>
      request<RecordingRetentionResponseDto>(`/documentation-workspace/appointments/${appointmentId}/recording/retention`),
    getTranscriptionProviderStatus: (appointmentId: string) =>
      request<TranscriptionProviderStatusDto>(`/documentation-workspace/appointments/${appointmentId}/transcription/provider-status`),
    processMockTranscriptionJob: (appointmentId: string) =>
      post<TranscriptionJobResponseDto>(`/documentation-workspace/appointments/${appointmentId}/transcription/jobs/mock`),
    getTranscript: (appointmentId: string) =>
      request<TranscriptViewDto>(`/documentation-workspace/appointments/${appointmentId}/transcript`),
    appendTranscriptSegment: (appointmentId: string, body: AppendTranscriptSegmentRequestDto, idempotencyKey?: string) =>
      post<VisitSessionControlResponseDto>(`/documentation-workspace/appointments/${appointmentId}/transcript/segments`, body, idempotencyKey),
    correctTranscriptSegment: (appointmentId: string, transcriptSegmentId: string, body: CorrectTranscriptSegmentRequestDto) =>
      post<TranscriptCorrectionResponseDto>(
        `/documentation-workspace/appointments/${appointmentId}/transcript/segments/${transcriptSegmentId}/correction`,
        body
      ),
    listSuggestions: (noteId: string) => request<SuggestionsViewDto>(`/notes/${noteId}/suggestions`),
    evaluateSuggestions: (noteId: string) => post<ReviewActionResponseDto>(`/notes/${noteId}/suggestions/evaluate`),
    acceptSuggestion: (noteId: string, suggestionId: string, body: SuggestionDecisionRequestDto) =>
      post<ReviewActionResponseDto>(`/notes/${noteId}/suggestions/${suggestionId}/accept`, body),
    removeSuggestion: (noteId: string, suggestionId: string) =>
      post<ReviewActionResponseDto>(`/notes/${noteId}/suggestions/${suggestionId}/remove`),
    listVisitSelections: (noteId: string) => request<VisitSelectionsViewDto>(`/notes/${noteId}/visit-selections`),
    addVisitSelection: (noteId: string, body: AddVisitSelectionRequestDto) =>
      post<ReviewActionResponseDto>(`/notes/${noteId}/visit-selections`, body),
    evaluateCompliance: (noteId: string) => request<ComplianceReviewDto>(`/notes/${noteId}/compliance`),
    listHistoryGaps: (noteId: string) => request<{ noteId: string; questions: HistoryGapQuestionDto[] }>(`/notes/${noteId}/history-gaps`),
    createHistoryGapTask: (noteId: string, questionId: string, body: CreateHistoryGapTaskRequestDto) =>
      post<ReviewActionResponseDto>(`/notes/${noteId}/history-gaps/${questionId}/tasks`, body),
    getFinalizationSession: (noteId: string) => request<FinalizationSessionDto>(`/notes/${noteId}/finalization`),
    startFinalization: (noteId: string) => post<FinalizationActionResponseDto>(`/notes/${noteId}/finalization/start`),
    decideFinalizationSelection: (noteId: string, visitSelectionId: string, decision: 'keep' | 'remove') =>
      post<FinalizationActionResponseDto>(`/notes/${noteId}/finalization/code-review/selections/${visitSelectionId}`, { decision }),
    completeCodeReview: (noteId: string) => post<FinalizationActionResponseDto>(`/notes/${noteId}/finalization/code-review/complete`),
    decideFinalizationSuggestion: (noteId: string, suggestionId: string, decision: 'keep' | 'remove', reason?: string) =>
      post<FinalizationActionResponseDto>(`/notes/${noteId}/finalization/suggestion-review/suggestions/${suggestionId}`, {
        decision,
        ...(reason ? { reason } : {})
      }),
    completeSuggestionReview: (noteId: string) =>
      post<FinalizationActionResponseDto>(`/notes/${noteId}/finalization/suggestion-review/complete`),
    composeFinalizationDrafts: (noteId: string) => post<FinalizationActionResponseDto>(`/notes/${noteId}/finalization/compose`),
    approveFinalNote: (noteId: string, body: ApprovalRequestDto) =>
      post<FinalizationActionResponseDto>(`/notes/${noteId}/finalization/compare-edit/approve-note`, body),
    approvePatientSummary: (noteId: string, body: ApprovalRequestDto) =>
      post<FinalizationActionResponseDto>(`/notes/${noteId}/finalization/compare-edit/approve-summary`, body),
    updateCompareEditOriginal: (noteId: string, originalNoteText: string) =>
      post<FinalizationActionResponseDto>(`/notes/${noteId}/finalization/compare-edit/original`, { originalNoteText }),
    rebeautifyFinalization: (noteId: string, reason?: string) =>
      post<FinalizationActionResponseDto>(`/notes/${noteId}/finalization/compare-edit/rebeautify`, reason ? { reason } : {}),
    generateDraftClaimPreview: (noteId: string) =>
      post<FinalizationActionResponseDto>(`/notes/${noteId}/finalization/billing-attest/draft-claim-preview`),
    completeBillingAttest: (noteId: string, body: BillingAttestRequestDto) =>
      post<FinalizationActionResponseDto>(`/notes/${noteId}/finalization/billing-attest/complete`, body),
    signAndDispatch: (noteId: string) => post<FinalizationActionResponseDto>(`/notes/${noteId}/finalization/sign-dispatch`),
    generateFinalNotePdf: (noteId: string) => post<ExportActionResponseDto>(`/notes/${noteId}/exports/final-note-pdf`),
    generatePatientSummaryPdf: (noteId: string) => post<ExportActionResponseDto>(`/notes/${noteId}/exports/patient-summary-pdf`),
    copyFinalNote: (noteId: string) => post<ExportActionResponseDto>(`/notes/${noteId}/exports/final-note-copy`),
    copyPatientSummary: (noteId: string) => post<ExportActionResponseDto>(`/notes/${noteId}/exports/patient-summary-copy`),
    exportStructuredFinalNote: (noteId: string) => post<ExportActionResponseDto>(`/notes/${noteId}/exports/structured`),
    deliverExportDownload: (noteId: string, exportArtifactId: string, body: SecureDownloadRequestDto) =>
      post<SecureDownloadResponseDto>(`/notes/${noteId}/exports/${exportArtifactId}/download`, body),
    requestEhrWriteback: (noteId: string, body: EhrWritebackRequestDto) =>
      post<EhrWritebackActionResponseDto>(`/notes/${noteId}/ehr-writeback`, body),
    listOperationalTasks: () => request<TaskWorklistViewDto>('/standalone/operations/tasks'),
    updateOperationalTask: (taskId: string, body: UpdateOperationalTaskRequestDto) =>
      patch<OperationalActionResponseDto>(`/standalone/operations/tasks/${taskId}`, body),
    listBillingReviews: () => request<BillingReviewQueueViewDto>('/standalone/operations/billing-review'),
    updateBillingReview: (billingReviewId: string, body: UpdateBillingReviewRequestDto) =>
      patch<OperationalActionResponseDto>(`/standalone/operations/billing-review/${billingReviewId}`, body),
    getSettings: () => request<SettingsAdminViewDto>('/standalone/operations/settings'),
    updateIntegration: (integrationId: string, body: UpdateIntegrationRequestDto) =>
      patch<OperationalActionResponseDto>(`/standalone/operations/settings/integrations/${integrationId}`, body),
    listTemplates: () => request<TemplatesViewDto>('/standalone/operations/templates'),
    createTemplate: (body: CreateTemplateRequestDto, idempotencyKey?: string) =>
      post<OperationalActionResponseDto>('/standalone/operations/templates', body, idempotencyKey),
    updateDotPhrase: (dotPhraseId: string, body: UpdateDotPhraseRequestDto) =>
      patch<OperationalActionResponseDto>(`/standalone/operations/dot-phrases/${dotPhraseId}`, body),
    getEstimateConfig: () => request<EstimateConfigurationDto>('/standalone/operations/estimate-config'),
    updateEstimateConfig: (body: UpdateEstimateConfigurationRequestDto) =>
      patch<OperationalActionResponseDto>('/standalone/operations/estimate-config', body),
    listRulesCatalog: () => request<RulesCatalogViewDto>('/standalone/operations/rules-catalog'),
    publishRulesCatalog: (body: PublishRulesCatalogRequestDto, idempotencyKey?: string) =>
      post<OperationalActionResponseDto>('/standalone/operations/rules-catalog/publish', body, idempotencyKey),
    getPlatformAdmin: () => request<PlatformAdminViewDto>('/platform/admin'),
    evaluateSession: (body: SessionEvaluationRequestDto) =>
      post<PlatformActionResponseDto>('/platform/identity/session-evaluations', body),
    updateWorkforceUser: (userId: string, body: UpdateWorkforceUserRequestDto) =>
      patch<PlatformActionResponseDto>(`/platform/identity/users/${userId}`, body),
    validateProductionConfig: (body: ProductionConfigValidationRequestDto) =>
      post<PlatformActionResponseDto>('/platform/config/validate', body),
    updateFeatureFlag: (key: string, body: UpdateGovernedFeatureFlagRequestDto) =>
      patch<PlatformActionResponseDto>(`/platform/feature-flags/${key}`, body),
    getEhrStatus: () => request<EhrIntegrationStatusDto>('/integrations/ehr/status'),
    getEhrChartContext: (safePatientId: string, externalEncounterId: string, slices?: string[]) => {
      const suffix = slices && slices.length > 0 ? `?slices=${encodeURIComponent(slices.join(','))}` : '';
      return request<EhrChartContextResponseDto>(`/integrations/ehr/chart-context/${safePatientId}/${externalEncounterId}${suffix}`);
    },
    listEhrWritebackQueue: () => request<EhrWritebackQueueResponseDto>('/integrations/ehr/writeback-queue'),
    actOnEhrWritebackJob: (writebackJobId: string, body: EhrWritebackQueueActionRequestDto, idempotencyKey?: string) =>
      post<EhrWritebackQueueActionResponseDto>(`/integrations/ehr/writeback-queue/${writebackJobId}/actions`, body, idempotencyKey),
    getClinicOsStatus: () => request<ClinicOsIntegrationStatusDto>('/integrations/clinicos/status'),
    mapClinicOsVisit: (body: ClinicOsMapVisitRequestDto) =>
      post<ClinicOsMapVisitResponseDto>('/integrations/clinicos/map-visit', body),
    upsertClinicOsMapping: (body: ClinicOsMappingUpsertRequestDto) =>
      post<ClinicOsMappingUpsertResponseDto>('/integrations/clinicos/mappings', body),
    publishClinicOsEvent: (body: ClinicOsEventPublishRequestDto) =>
      post<ClinicOsEventPublishResponseDto>('/integrations/clinicos/events/publish', body),
    getAiGatewayStatus: () => request<AiGatewayStatusDto>('/ai-gateway/status'),
    runAiEvaluations: (body: AiEvaluationRunRequestDto) =>
      post<AiEvaluationRunResponseDto>('/ai-gateway/evaluations/run', body),
    validateAiOutput: (body: AiOutputValidationRequestDto) =>
      post<AiOutputValidationResponseDto>('/ai-gateway/outputs/validate', body),
    invokeMockAi: (body: AiGatewayInvocationRequestDto) =>
      post<AiGatewayInvocationResponseDto>('/ai-gateway/mock-invocations', body),
    getOwnCoaching: () => request<CoachingReportDto>('/coaching/own'),
    getCoachingDashboard: (visibilityMode: 'aggregate_only' | 'full_admin' = 'aggregate_only') =>
      request<CoachingDashboardDto>(`/coaching/dashboard?visibilityMode=${visibilityMode}`),
    getSupportStatus: () => request<SupportStatusResponseDto>('/support/status'),
    requestAuditExport: (body: AuditExportRequestDto) =>
      post<AuditExportResponseDto>('/support/audit-exports', body),
    deliverAuditExportDownload: (auditExportId: string, body: SecureDownloadRequestDto) =>
      post<SecureDownloadResponseDto>(`/support/audit-exports/${auditExportId}/download`, body),
    getBackupRestoreReadiness: () => request<BackupRestoreReadinessResponseDto>('/support/backup-restore/readiness'),
    getOperationalReadiness: () => request<OperationalReadinessResponseDto>('/support/operations/readiness'),
    recordOperationalEvidence: (body: OperationalEvidenceRequestDto) =>
      post<OperationalEvidenceResponseDto>('/support/operations/evidence', body)
  };
}

function defaultPurposeForRole(role: AuraNoteRuntimeRole): NonNullable<AuraNoteApiClientOptions['purposeOfUse']> {
  if (role === 'billing_staff') return 'payment';
  if (role === 'support') return 'support';
  if (role === 'authorized_admin' || role === 'admin') return 'operations';
  if (role === 'compliance_privacy_lead') return 'audit';
  return 'treatment';
}

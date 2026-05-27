import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  createApiEnvelope,
  createEventEnvelope,
  type ApiEnvelope,
  type AppointmentDto,
  type AuditEventDto,
  type CoreEventType,
  type CreateAppointmentRequestDto,
  type CreateAppointmentResponseDto,
  type DocumentationWorkspaceDto,
  type DraftNotesViewDto,
  type FinalizedNoteSummaryDto,
  type FinalizedNotesViewDto,
  type NoteDto,
  type AppendTranscriptSegmentRequestDto,
  type AddVisitSelectionRequestDto,
  type RecordingExceptionRequestDto,
  type ComplianceIssueDto,
  type ComplianceReviewDto,
  type CreateHistoryGapTaskRequestDto,
  type ApprovalRequestDto,
  type BillingAttestRequestDto,
  type CompareEditUpdateRequestDto,
  type DraftClaimPreviewDto,
  type EhrWritebackActionResponseDto,
  type EhrWritebackQueueDto,
  type EhrWritebackRequestDto,
  type ExportActionResponseDto,
  type ExportArtifactDto,
  type FinalNoteRecordDto,
  type FinalizedNoteDetailDto,
  type ScheduleAppointmentDto,
  type ScheduleViewDto,
  type FinalizationActionResponseDto,
  type FinalizationComposeOutputDto,
  type FinalizationSelectionDecisionRequestDto,
  type FinalizationSessionDto,
  type FinalizationSuggestionDecisionRequestDto,
  type PatientSummaryRecordDto,
  type ReviewActionResponseDto,
  type RebeautifyRequestDto,
  type SuggestionDecisionRequestDto,
  type SuggestionDto,
  type SuggestionsViewDto,
  type TaskDto,
  type HistoryGapQuestionDto,
  type StartVisitResponseDto,
  type TranscriptSegmentDto,
  type TranscriptViewDto,
  type UnusedAuditItemDto,
  type VisitSelectionDto,
  type VisitSelectionsViewDto,
  type VisitSessionControlResponseDto,
  type VisitSessionDto
} from '@aura-note/contracts';
import {
  approveRecordingException,
  canEditNote,
  canCompleteCodeReview,
  canCompleteCompareEdit,
  canCompleteCompose,
  canCompleteSuggestionReview,
  canCompleteBillingAttest,
  canGenerateFinalArtifact,
  canAcceptSuggestion,
  complianceBlocksFinalize,
  canStartFinalization,
  canSignAndDispatchAfterBilling,
  canStartVisit,
  createAppointmentLifecycle,
  createAppointmentNoteInvariant,
  createRawAudioRetentionMetadata,
  createTranscriptRetentionMetadata,
  pauseVisitGate,
  patientSummaryContainsInternalDetails,
  resolveEhrWritebackStatus,
  resumeVisitGate,
  startVisitLifecycle,
  stopVisitGate,
  validateAppointmentDraft,
  type NoteState
} from '@aura-note/domain';
import {
  canPerform,
  canViewTranscript,
  createSyntheticLocalSession,
  type AccessContext
} from '@aura-note/security';
import { InMemoryObjectStorageAdapter, buildStorageKey } from '@aura-note/storage';
import { createInMemoryScheduleStateRepository, type StoredAppointment } from './schedule.repository';

const TENANT_ID = 'tenant-synthetic-primary';
const SITE_ID = 'site-synthetic-primary';
const APP_MODE = 'standalone' as const;

interface RequestContext {
  requestId: string;
  traceId: string;
  actorUserId: string;
  access: AccessContext;
  idempotencyKey?: string;
}

@Injectable()
export class ScheduleService {
  private sequence = 1;
  private readonly repository = createInMemoryScheduleStateRepository();

  listAppointments(context: RequestContext): ApiEnvelope<ScheduleViewDto> {
    if (!canPerform('schedule:view', context.access)) {
      throw new ForbiddenException('role cannot view schedule');
    }

    return createApiEnvelope(
      {
        appointments: this.repository.listAppointments().map((entry) => this.toScheduleCard(entry)),
        ehrSchedulingEnabled: false,
        clinicOsSchedulingEnabled: false
      },
      this.createMeta(context)
    );
  }

  createAppointment(
    request: CreateAppointmentRequestDto,
    context: RequestContext
  ): ApiEnvelope<CreateAppointmentResponseDto> {
    if (!canPerform('appointment:create', context.access)) {
      throw new ForbiddenException('role cannot create appointments');
    }

    const existingAppointmentId = context.idempotencyKey
      ? this.repository.getIdempotentAppointmentId(context.idempotencyKey)
      : undefined;
    if (existingAppointmentId) {
      const existing = this.getStoredAppointment(existingAppointmentId);
      return createApiEnvelope(this.toCreateResponse(existing, context, true), this.createMeta(context));
    }

    const appointmentId = this.nextId('appt');
    const noteId = this.nextId('note');
    const draft = {
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      safePatientId: request.safePatientId,
      clinicianId: request.clinicianId,
      visitType: request.visitType,
      startsAt: request.startsAt,
      durationMinutes: request.durationMinutes,
      modality: request.modality,
      source: 'standalone' as const,
      ...(request.reasonForVisit ? { reasonForVisit: request.reasonForVisit } : {})
    };

    const validationErrors = validateAppointmentDraft(draft);
    if (validationErrors.length > 0) {
      throw new BadRequestException({ code: 'INVALID_APPOINTMENT', validationErrors });
    }

    const lifecycle = createAppointmentLifecycle(appointmentId, noteId, draft);
    if (this.repository.hasNoteForAppointment(appointmentId)) {
      throw new BadRequestException('duplicate note shell creation is blocked');
    }

    const appointment: AppointmentDto = {
      appointmentId,
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      safePatientId: request.safePatientId,
      clinicianId: request.clinicianId,
      noteId,
      state: lifecycle.appointmentState,
      startsAt: request.startsAt,
      durationMinutes: request.durationMinutes,
      visitType: request.visitType,
      modality: request.modality,
      source: 'standalone',
      ...(request.reasonForVisit ? { reasonForVisit: request.reasonForVisit } : {}),
      mode: APP_MODE
    };

    const note: NoteDto = {
      noteId,
      appointmentId,
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      safePatientId: request.safePatientId,
      clinicianId: request.clinicianId,
      state: lifecycle.noteState,
      mode: APP_MODE
    };

    createAppointmentNoteInvariant(
      { appointmentId: appointment.appointmentId, noteId: appointment.noteId },
      { appointmentId: note.appointmentId, noteId: note.noteId }
    );

    this.repository.saveAppointment({ appointment, note, lifecycle });
    if (context.idempotencyKey) {
      this.repository.saveIdempotencyKey(context.idempotencyKey, appointmentId);
    }

    const stored = this.getStoredAppointment(appointmentId);
    return createApiEnvelope(this.toCreateResponse(stored, context, false), this.createMeta(context));
  }

  startVisit(appointmentId: string, context: RequestContext): ApiEnvelope<StartVisitResponseDto> {
    const stored = this.getStoredAppointment(appointmentId);
    const linkedContext = {
      ...context.access,
      linkedToPatient: true,
      linkedToVisit: true,
      treatingClinician: context.access.role === 'clinician'
    };

    if (!canPerform('visit:start', linkedContext)) {
      throw new ForbiddenException('role cannot start visit');
    }

    if (!canStartVisit(stored.appointment.state, stored.note.state)) {
      throw new BadRequestException('visit cannot be started from current appointment/note state');
    }

    const lifecycle = startVisitLifecycle(stored.lifecycle);
    const startedAt = new Date().toISOString();
    const visitSession: VisitSessionDto = {
      visitSessionId: this.nextId('visit-session'),
      noteId: stored.note.noteId,
      timerState: 'running',
      recordingState: 'recording',
      editorUnlocked: true,
      startedAt,
      elapsedSeconds: 0
    };
    const rawAudioRetention = createRawAudioRetentionMetadata(this.nextId('recording'), stored.note.noteId, startedAt);
    const transcriptRetention = createTranscriptRetentionMetadata(this.nextId('transcript'), stored.note.noteId);
    const transcript: TranscriptViewDto = {
      noteId: stored.note.noteId,
      transcriptId: transcriptRetention.transcriptId,
      retentionPolicy: transcriptRetention.retentionPolicy,
      segments: []
    };

    stored.lifecycle = lifecycle;
    stored.appointment = { ...stored.appointment, state: lifecycle.appointmentState };
    stored.note = { ...stored.note, state: lifecycle.noteState };
    stored.visitSession = visitSession;
    stored.rawAudioRetention = rawAudioRetention;
    stored.transcript = transcript;

    return createApiEnvelope(
      {
        appointment: stored.appointment,
        note: stored.note,
        visitSession,
        rawAudioRetention,
        auditEvent: this.createAuditEvent('visit.start', 'Appointment', stored.appointment.appointmentId, context),
        domainEvents: [
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType: 'visit.started.v1',
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            appointmentId: stored.appointment.appointmentId,
            noteId: stored.note.noteId,
            visitSessionId: visitSession.visitSessionId,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'phi_reference',
            retentionClass: 'audit',
            payload: {
              appointmentState: stored.appointment.state,
              noteState: stored.note.state,
              timerState: visitSession.timerState,
              recordingState: visitSession.recordingState
            }
          }),
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType: 'recording.started.v1',
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            appointmentId: stored.appointment.appointmentId,
            noteId: stored.note.noteId,
            visitSessionId: visitSession.visitSessionId,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'phi_reference',
            retentionClass: 'audit',
            payload: {
              recordingState: visitSession.recordingState
            }
          }),
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType: 'raw_audio.retention_scheduled.v1',
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            appointmentId: stored.appointment.appointmentId,
            noteId: stored.note.noteId,
            visitSessionId: visitSession.visitSessionId,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'phi_reference',
            retentionClass: 'audit',
              payload: { ...rawAudioRetention }
          })
        ]
      },
      this.createMeta(context)
    );
  }

  listDraftNotes(context: RequestContext): ApiEnvelope<DraftNotesViewDto> {
    const linkedContext = this.createLinkedVisitContext(context.access);
    if (!canPerform('draft_note:view', linkedContext)) {
      throw new ForbiddenException('role cannot view draft notes');
    }

    const notes = this.repository
      .listAppointments()
      .filter((entry) => entry.lifecycle.noteVisibleInDrafts && entry.note.state !== 'finalized')
      .map((entry) => {
        const gate = entry.visitSession ?? {
          visitSessionId: 'visit-session-not-started',
          noteId: entry.note.noteId,
          timerState: 'not_started' as const,
          recordingState: 'not_started' as const,
          editorUnlocked: false
        };
        const editorUnlocked = canEditNote(gate);
        return {
          noteId: entry.note.noteId,
          appointmentId: entry.appointment.appointmentId,
          safePatientId: entry.appointment.safePatientId,
          clinicianId: entry.appointment.clinicianId,
          visitType: entry.appointment.visitType,
          startsAt: entry.appointment.startsAt,
          noteStatus: entry.note.state,
          appointmentStatus: entry.appointment.state,
          workflowStatusLabel: this.workflowStatusLabel(entry.note.state),
          editorLocked: !editorUnlocked,
          ...(editorUnlocked ? {} : { editorLockedReason: this.editorLockedReason(gate) })
        };
      });

    return createApiEnvelope(
      {
        notes,
        emptyState: notes.length > 0 ? 'ready' : 'empty'
      },
      this.createMeta(context)
    );
  }

  listFinalizedNotes(context: RequestContext): ApiEnvelope<FinalizedNotesViewDto> {
    if (!canPerform('final_note:view', context.access)) {
      throw new ForbiddenException('role cannot view finalized notes');
    }

    const notes = this.repository
      .listAppointments()
      .filter((entry) => entry.note.state === 'finalized')
      .map((entry) => this.toFinalizedNoteSummary(entry, context.access));

    return createApiEnvelope(
      {
        notes,
        emptyState: notes.length > 0 ? 'ready' : 'empty',
        readOnly: true
      },
      this.createMeta(context)
    );
  }

  getFinalizedNote(noteId: string, context: RequestContext): ApiEnvelope<FinalizedNoteDetailDto> {
    if (!canPerform('final_note:view', context.access)) {
      throw new ForbiddenException('role cannot view finalized notes');
    }

    const stored = this.getStoredByNoteId(noteId);
    if (stored.note.state !== 'finalized') {
      return createApiEnvelope(
        {
          noteId: stored.note.noteId,
          appointmentId: stored.appointment.appointmentId,
          safePatientId: stored.appointment.safePatientId,
          clinicianId: stored.appointment.clinicianId,
          readOnly: true,
          finalNoteAvailable: false,
          patientSummaryAvailable: false,
          transcriptAvailableForRole: false,
          exportStatus: 'not_generated',
          patientSummaryStatus: 'not_available',
          billingReviewStatus: 'not_routed',
          writebackStatus: 'disabled',
          exportArtifacts: [],
          writeback: this.createWritebackQueue(stored, 'final_note', 'disabled', false),
          availableActions: {
            copyFinalNote: false,
            copyPatientSummary: false,
            downloadFinalNotePdf: false,
            downloadPatientSummaryPdf: false,
            exportStructured: false,
            queueEhrWriteback: false
          }
        },
        this.createMeta(context),
        [
          {
            code: 'FINAL_NOTE_NOT_AVAILABLE',
            message: 'Finalized note viewer is read-only; this note is not finalized in the CP-1 shell.',
            severity: 'info'
          }
        ]
      );
    }

    return createApiEnvelope(this.toFinalizedNoteDetail(stored, context.access), this.createMeta(context));
  }

  getDocumentationWorkspaceByAppointment(
    appointmentId: string,
    context: RequestContext
  ): ApiEnvelope<DocumentationWorkspaceDto> {
    const stored = this.getStoredAppointment(appointmentId);
    return createApiEnvelope(this.toDocumentationWorkspace(stored, context), this.createMeta(context));
  }

  pauseVisit(appointmentId: string, context: RequestContext): ApiEnvelope<VisitSessionControlResponseDto> {
    const stored = this.getStartedAppointmentForControl(appointmentId, context);
    const updated = pauseVisitGate(stored.visitSession);
    stored.visitSession = { ...stored.visitSession, ...updated, pausedAt: new Date().toISOString() };
    stored.appointment = { ...stored.appointment, state: 'visit_paused' };
    stored.note = { ...stored.note, state: 'visit_paused' };
    stored.lifecycle = {
      ...stored.lifecycle,
      appointmentState: 'visit_paused',
      noteState: 'visit_paused',
      noteVisibleInDrafts: true
    };

    return this.createVisitControlEnvelope(stored, context, 'visit.pause', ['visit.paused.v1']);
  }

  resumeVisit(appointmentId: string, context: RequestContext): ApiEnvelope<VisitSessionControlResponseDto> {
    const stored = this.getStartedAppointmentForControl(appointmentId, context);
    const updated = resumeVisitGate(stored.visitSession);
    const { pausedAt: _pausedAt, ...previousSession } = stored.visitSession;
    stored.visitSession = { ...previousSession, ...updated };
    stored.appointment = { ...stored.appointment, state: 'visit_started' };
    stored.note = { ...stored.note, state: 'visit_active' };
    stored.lifecycle = {
      ...stored.lifecycle,
      appointmentState: 'visit_started',
      noteState: 'visit_active',
      noteVisibleInDrafts: true
    };

    return this.createVisitControlEnvelope(stored, context, 'visit.resume', ['visit.resumed.v1']);
  }

  stopVisit(appointmentId: string, context: RequestContext): ApiEnvelope<VisitSessionControlResponseDto> {
    const stored = this.getStartedAppointmentForControl(appointmentId, context);
    const updated = stopVisitGate(stored.visitSession);
    stored.visitSession = { ...stored.visitSession, ...updated, stoppedAt: new Date().toISOString() };
    stored.appointment = { ...stored.appointment, state: 'visit_completed' };
    stored.note = { ...stored.note, state: 'documentation_in_progress' };
    stored.lifecycle = {
      ...stored.lifecycle,
      appointmentState: 'visit_completed',
      noteState: 'documentation_in_progress',
      noteVisibleInDrafts: true
    };

    return this.createVisitControlEnvelope(stored, context, 'visit.stop', ['visit.stopped.v1', 'recording.stopped.v1']);
  }

  approveRecordingException(
    appointmentId: string,
    request: RecordingExceptionRequestDto,
    context: RequestContext
  ): ApiEnvelope<VisitSessionControlResponseDto> {
    const stored = this.getStoredAppointment(appointmentId);
    this.assertVisitControlAllowed(context);

    const existingGate = stored.visitSession ?? {
      visitSessionId: this.nextId('visit-session'),
      noteId: stored.note.noteId,
      timerState: 'not_started' as const,
      recordingState: 'not_started' as const,
      editorUnlocked: false,
      startedAt: new Date().toISOString(),
      elapsedSeconds: 0
    };
    const updated = approveRecordingException(existingGate, request.exceptionReason);
    stored.visitSession = { ...existingGate, ...updated };
    stored.appointment = { ...stored.appointment, state: 'visit_started' };
    stored.note = { ...stored.note, state: 'visit_active' };
    stored.lifecycle = {
      ...stored.lifecycle,
      appointmentState: 'visit_started',
      noteState: 'visit_active',
      noteVisibleInDrafts: true
    };
    if (!stored.transcript) {
      const transcriptRetention = createTranscriptRetentionMetadata(this.nextId('transcript'), stored.note.noteId);
      stored.transcript = {
        noteId: stored.note.noteId,
        transcriptId: transcriptRetention.transcriptId,
        retentionPolicy: transcriptRetention.retentionPolicy,
        segments: []
      };
    }

    return this.createVisitControlEnvelope(stored, context, 'recording.exception_approve', [
      'recording.exception_approved.v1'
    ]);
  }

  appendTranscriptSegment(
    appointmentId: string,
    request: AppendTranscriptSegmentRequestDto,
    context: RequestContext
  ): ApiEnvelope<VisitSessionControlResponseDto> {
    const stored = this.getStartedAppointmentForControl(appointmentId, context);
    if (!request.text.trim()) {
      throw new BadRequestException('transcript segment text is required');
    }
    if (!canEditNote(stored.visitSession)) {
      throw new BadRequestException('transcript segments require a running timer or approved exception');
    }

    const transcript = stored.transcript ?? {
      noteId: stored.note.noteId,
      transcriptId: this.nextId('transcript'),
      retentionPolicy: 'indefinite' as const,
      segments: []
    };
    const segment: TranscriptSegmentDto = {
      transcriptSegmentId: this.nextId('transcript-segment'),
      noteId: stored.note.noteId,
      sequence: transcript.segments.length + 1,
      speakerRole: request.speakerRole,
      text: request.text,
      source: 'mock_transcription',
      createdAt: new Date().toISOString()
    };
    stored.transcript = {
      ...transcript,
      segments: [...transcript.segments, segment]
    };

    return this.createVisitControlEnvelope(stored, context, 'transcript.segment_append', [
      'transcript.segment_appended.v1'
    ]);
  }

  getTranscriptByAppointment(appointmentId: string, context: RequestContext): ApiEnvelope<TranscriptViewDto> {
    const stored = this.getStoredAppointment(appointmentId);
    const linkedContext = this.createLinkedVisitContext(context.access);
    const billingReviewContext =
      stored.finalization?.draftClaimPreview?.billingReviewTriggered && context.access.role === 'billing_staff'
        ? { ...linkedContext, billingReviewTriggered: true }
        : linkedContext;
    if (!canPerform('transcript:view', billingReviewContext)) {
      throw new ForbiddenException('role cannot view transcript');
    }

    return createApiEnvelope(
      stored.transcript ?? {
        noteId: stored.note.noteId,
        transcriptId: 'transcript-not-started',
        retentionPolicy: 'indefinite',
        segments: []
      },
      this.createMeta(context)
    );
  }

  evaluateSuggestions(noteId: string, context: RequestContext): ApiEnvelope<ReviewActionResponseDto> {
    const stored = this.getReviewableNote(noteId, context);
    stored.suggestions = this.createDeterministicSuggestions(stored);
    stored.historyGaps = stored.historyGaps ?? this.createDeterministicHistoryGaps(stored);
    stored.complianceIssues = this.evaluateComplianceIssues(stored);

    return this.createReviewActionEnvelope(stored, context, 'suggestions.evaluate', ['suggestions.evaluated.v1']);
  }

  listSuggestions(noteId: string, context: RequestContext): ApiEnvelope<SuggestionsViewDto> {
    const stored = this.getReviewableNote(noteId, context);
    stored.suggestions = stored.suggestions ?? this.createDeterministicSuggestions(stored);
    return createApiEnvelope({ noteId, suggestions: stored.suggestions }, this.createMeta(context));
  }

  acceptSuggestion(
    noteId: string,
    suggestionId: string,
    request: SuggestionDecisionRequestDto,
    context: RequestContext
  ): ApiEnvelope<ReviewActionResponseDto> {
    const stored = this.getReviewableNote(noteId, context);
    stored.suggestions = stored.suggestions ?? this.createDeterministicSuggestions(stored);
    const suggestion = this.getSuggestion(stored, suggestionId);
    const decision = canAcceptSuggestion({
      category: suggestion.category,
      confidence: suggestion.confidence,
      ...request
    });
    if (!decision.accepted) {
      throw new BadRequestException({
        code: 'LOW_CONFIDENCE_OVERRIDE_REQUIRED',
        message: 'Diagnosis suggestions below 75 percent confidence require complete override metadata.'
      });
    }

    stored.suggestions = stored.suggestions.map((candidate) =>
      candidate.suggestionId === suggestionId ? { ...candidate, status: 'accepted' } : candidate
    );
    stored.visitSelections = [
      ...(stored.visitSelections ?? []),
      {
        visitSelectionId: this.nextId('visit-selection'),
        noteId,
        category: suggestion.category,
        label: suggestion.label,
        confidence: suggestion.confidence,
        humanApproved: true,
        sourceSuggestionId: suggestion.suggestionId,
        ...(request.overrideReason ? { overrideReason: request.overrideReason } : {})
      }
    ];
    stored.complianceIssues = this.evaluateComplianceIssues(stored);

    return this.createReviewActionEnvelope(stored, context, 'suggestion.accept', [
      'suggestion.accepted.v1',
      'visit_selection.added.v1'
    ]);
  }

  removeSuggestion(noteId: string, suggestionId: string, context: RequestContext): ApiEnvelope<ReviewActionResponseDto> {
    const stored = this.getReviewableNote(noteId, context);
    stored.suggestions = stored.suggestions ?? this.createDeterministicSuggestions(stored);
    this.getSuggestion(stored, suggestionId);
    stored.suggestions = stored.suggestions.map((candidate) =>
      candidate.suggestionId === suggestionId ? { ...candidate, status: 'removed' } : candidate
    );
    stored.complianceIssues = this.evaluateComplianceIssues(stored);

    return this.createReviewActionEnvelope(stored, context, 'suggestion.remove', ['suggestion.removed.v1']);
  }

  listVisitSelections(noteId: string, context: RequestContext): ApiEnvelope<VisitSelectionsViewDto> {
    const stored = this.getReviewableNote(noteId, context);
    return createApiEnvelope(
      {
        noteId,
        selections: stored.visitSelections ?? [],
        availableFilters: ['cpt', 'hcpcs', 'icd10', 'hcc', 'em', 'quality_measure', 'diagnosis', 'differential', 'service', 'procedure', 'appointment_to_schedule', 'plan_item', 'staff_task']
      },
      this.createMeta(context)
    );
  }

  addVisitSelection(
    noteId: string,
    request: AddVisitSelectionRequestDto,
    context: RequestContext
  ): ApiEnvelope<ReviewActionResponseDto> {
    const stored = this.getReviewableNote(noteId, context);
    if (!request.label.trim()) {
      throw new BadRequestException('visit selection label is required');
    }
    stored.visitSelections = [
      ...(stored.visitSelections ?? []),
      {
        visitSelectionId: this.nextId('visit-selection'),
        noteId,
        category: request.category,
        label: request.label,
        ...(request.confidence === undefined ? {} : { confidence: request.confidence }),
        humanApproved: true
      }
    ];
    stored.complianceIssues = this.evaluateComplianceIssues(stored);

    return this.createReviewActionEnvelope(stored, context, 'visit_selection.add', ['visit_selection.added.v1']);
  }

  evaluateCompliance(noteId: string, context: RequestContext): ApiEnvelope<ComplianceReviewDto> {
    const stored = this.getReviewableNote(noteId, context);
    stored.complianceIssues = this.evaluateComplianceIssues(stored);
    return createApiEnvelope(this.toComplianceReview(stored), this.createMeta(context));
  }

  listHistoryGaps(noteId: string, context: RequestContext): ApiEnvelope<{ noteId: string; questions: HistoryGapQuestionDto[] }> {
    const stored = this.getReviewableNote(noteId, context);
    stored.historyGaps = stored.historyGaps ?? this.createDeterministicHistoryGaps(stored);
    return createApiEnvelope({ noteId, questions: stored.historyGaps }, this.createMeta(context));
  }

  createHistoryGapTask(
    noteId: string,
    questionId: string,
    request: CreateHistoryGapTaskRequestDto,
    context: RequestContext
  ): ApiEnvelope<ReviewActionResponseDto> {
    const stored = this.getReviewableNote(noteId, context);
    stored.historyGaps = stored.historyGaps ?? this.createDeterministicHistoryGaps(stored);
    const question = stored.historyGaps.find((candidate) => candidate.historyGapQuestionId === questionId);
    if (!question) {
      throw new NotFoundException('history gap question not found');
    }

    stored.historyGaps = stored.historyGaps.map((candidate) =>
      candidate.historyGapQuestionId === questionId ? { ...candidate, status: 'sent_to_ma' } : candidate
    );
    stored.tasks = [
      ...(stored.tasks ?? []),
      {
        taskId: this.nextId('task'),
        noteId,
        safePatientId: stored.appointment.safePatientId,
        title: question.question,
        blocksSigning: request.blocksSigning,
        adjudicationStatus: 'open',
        ownerRole: request.ownerRole
      }
    ];
    stored.complianceIssues = this.evaluateComplianceIssues(stored);

    return this.createReviewActionEnvelope(stored, context, 'history_gap.task_create', [
      'history_gap.task_created.v1',
      'task.blocker_changed.v1',
      'compliance.evaluated.v1'
    ]);
  }

  getFinalizationSession(noteId: string, context: RequestContext): ApiEnvelope<FinalizationSessionDto> {
    const stored = this.getReviewableNote(noteId, context);
    this.assertFinalizationManageAllowed(context);
    if (!stored.finalization) {
      throw new NotFoundException('finalization session not found');
    }
    return createApiEnvelope(stored.finalization, this.createMeta(context));
  }

  startFinalization(noteId: string, context: RequestContext): ApiEnvelope<FinalizationActionResponseDto> {
    const stored = this.getReviewableNote(noteId, context);
    this.assertFinalizationManageAllowed(context);
    stored.complianceIssues = this.evaluateComplianceIssues(stored);
    const compliance = this.toComplianceReview(stored);
    const hardBlockCount = compliance.issues.filter((issue) => issue.blocksFinalize || issue.severity === 'hard_block').length;
    const unresolvedBlockerTaskCount = this.countUnresolvedBlockerTasks(stored);

    if (!canStartFinalization({ noteState: stored.note.state, hardBlockCount, unresolvedBlockerTaskCount })) {
      throw new BadRequestException({
        code: 'FINALIZATION_BLOCKED',
        message: 'Finalization cannot start until the note is active and hard blockers are cleared.'
      });
    }

    if (stored.finalization) {
      return this.createFinalizationEnvelope(stored, context, 'finalization.start_replay', []);
    }

    const stoppedVisitForFinalization = Boolean(stored.visitSession && stored.visitSession.timerState !== 'stopped');
    if (stored.visitSession && stored.visitSession.timerState !== 'stopped') {
      const stoppedGate = stopVisitGate(stored.visitSession);
      stored.visitSession = { ...stored.visitSession, ...stoppedGate, stoppedAt: new Date().toISOString() };
    }

    stored.suggestions = stored.suggestions ?? this.createDeterministicSuggestions(stored);
    stored.visitSelections = stored.visitSelections ?? [];
    stored.historyGaps = stored.historyGaps ?? this.createDeterministicHistoryGaps(stored);
    stored.finalization = this.createFinalizationSession(stored);
    stored.appointment = { ...stored.appointment, state: 'finalization_in_progress' };
    stored.note = { ...stored.note, state: 'finalization_code_review' };
    stored.lifecycle = {
      ...stored.lifecycle,
      appointmentState: 'finalization_in_progress',
      noteState: 'finalization_code_review',
      noteVisibleInDrafts: true
    };

    return this.createFinalizationEnvelope(stored, context, 'finalization.start', [
      'finalization.started.v1',
      ...(stoppedVisitForFinalization ? (['visit.stopped.v1', 'recording.stopped.v1'] as CoreEventType[]) : [])
    ]);
  }

  decideFinalizationSelection(
    noteId: string,
    visitSelectionId: string,
    request: FinalizationSelectionDecisionRequestDto,
    context: RequestContext
  ): ApiEnvelope<FinalizationActionResponseDto> {
    const stored = this.getActiveFinalization(noteId, context, 'code_review');
    const session = stored.finalization;
    const selection = session.frozenSnapshot.visitSelections.find((candidate) => candidate.visitSelectionId === visitSelectionId);
    if (!selection) {
      throw new NotFoundException('finalization visit selection not found');
    }
    if (request.decision === 'remove' && !request.reason?.trim()) {
      throw new BadRequestException('removed visit selections require a reason for the unused audit list');
    }

    const decidedAt = new Date().toISOString();
    session.selectionDecisions = [
      ...session.selectionDecisions.filter((decision) => decision.visitSelectionId !== visitSelectionId),
      {
        visitSelectionId,
        decision: request.decision,
        ...(request.reason ? { reason: request.reason } : {}),
        decidedByUserId: context.actorUserId,
        decidedAt
      }
    ];
    if (request.decision === 'remove') {
      session.unusedAuditItems = this.upsertUnusedAuditItem(session, {
        unusedAuditItemId: this.nextId('unused'),
        noteId,
        sourceType: 'visit_selection',
        sourceId: visitSelectionId,
        label: selection.label,
        ...(request.reason ? { reason: request.reason } : {}),
        recordedAt: decidedAt
      });
    }
    session.updatedAt = decidedAt;

    return this.createFinalizationEnvelope(stored, context, 'finalization.selection_decide', [
      'finalization.selection_decided.v1'
    ]);
  }

  completeCodeReview(noteId: string, context: RequestContext): ApiEnvelope<FinalizationActionResponseDto> {
    const stored = this.getActiveFinalization(noteId, context, 'code_review');
    const session = stored.finalization;
    if (
      !canCompleteCodeReview({
        requiredDecisionCount: session.frozenSnapshot.visitSelections.length,
        completedDecisionCount: session.selectionDecisions.length,
        unresolvedBlockerTaskCount: this.countUnresolvedBlockerTasks(stored)
      })
    ) {
      throw new BadRequestException('Code Review requires decisions on all selected items and no unresolved blocker tasks.');
    }

    this.advanceFinalizationStep(stored, 'code_review', 'suggestion_review');
    return this.createFinalizationEnvelope(stored, context, 'finalization.code_review_complete', [
      'finalization.step_completed.v1'
    ]);
  }

  decideFinalizationSuggestion(
    noteId: string,
    suggestionId: string,
    request: FinalizationSuggestionDecisionRequestDto,
    context: RequestContext
  ): ApiEnvelope<FinalizationActionResponseDto> {
    const stored = this.getActiveFinalization(noteId, context, 'suggestion_review');
    const session = stored.finalization;
    const suggestion = session.frozenSnapshot.finalPassSuggestions.find((candidate) => candidate.suggestionId === suggestionId);
    if (!suggestion) {
      throw new NotFoundException('final-pass suggestion not found');
    }

    const decidedAt = new Date().toISOString();
    session.suggestionDecisions = [
      ...session.suggestionDecisions.filter((decision) => decision.suggestionId !== suggestionId),
      {
        suggestionId,
        decision: request.decision,
        ...(request.reason ? { reason: request.reason } : {}),
        decidedByUserId: context.actorUserId,
        decidedAt
      }
    ];
    if (request.decision === 'keep') {
      stored.suggestions = (stored.suggestions ?? []).map((candidate) =>
        candidate.suggestionId === suggestionId ? { ...candidate, status: 'accepted' } : candidate
      );
      if (!(stored.visitSelections ?? []).some((selection) => selection.sourceSuggestionId === suggestionId)) {
        stored.visitSelections = [
          ...(stored.visitSelections ?? []),
          {
            visitSelectionId: this.nextId('visit-selection'),
            noteId,
            category: suggestion.category,
            label: suggestion.label,
            confidence: suggestion.confidence,
            humanApproved: true,
            sourceSuggestionId: suggestion.suggestionId
          }
        ];
      }
    } else {
      stored.suggestions = (stored.suggestions ?? []).map((candidate) =>
        candidate.suggestionId === suggestionId ? { ...candidate, status: 'removed' } : candidate
      );
      session.unusedAuditItems = this.upsertUnusedAuditItem(session, {
        unusedAuditItemId: this.nextId('unused'),
        noteId,
        sourceType: 'suggestion',
        sourceId: suggestionId,
        label: suggestion.label,
        ...(request.reason ? { reason: request.reason } : {}),
        recordedAt: decidedAt
      });
    }
    session.updatedAt = decidedAt;

    return this.createFinalizationEnvelope(stored, context, 'finalization.suggestion_decide', [
      'finalization.suggestion_decided.v1'
    ]);
  }

  completeSuggestionReview(noteId: string, context: RequestContext): ApiEnvelope<FinalizationActionResponseDto> {
    const stored = this.getActiveFinalization(noteId, context, 'suggestion_review');
    const session = stored.finalization;
    if (
      !canCompleteSuggestionReview({
        includedSuggestionCount: session.frozenSnapshot.finalPassSuggestions.length,
        completedDecisionCount: session.suggestionDecisions.length
      })
    ) {
      throw new BadRequestException('Suggestion Review requires a keep/remove decision on every final-pass suggestion.');
    }

    this.advanceFinalizationStep(stored, 'suggestion_review', 'compose');
    return this.createFinalizationEnvelope(stored, context, 'finalization.suggestion_review_complete', [
      'finalization.step_completed.v1'
    ]);
  }

  composeFinalizationDrafts(noteId: string, context: RequestContext): ApiEnvelope<FinalizationActionResponseDto> {
    const stored = this.getActiveFinalization(noteId, context, 'compose');
    const session = stored.finalization;
    const generatedAt = new Date().toISOString();
    session.composePhases = this.completedComposePhases();
    session.composeOutput = this.generateComposeOutput(stored, generatedAt, (session.composeOutput?.version ?? 0) + 1, false);
    if (
      !canCompleteCompose({
        enhancedNoteGenerated: Boolean(session.composeOutput.enhancedNoteText),
        patientSummaryGenerated: Boolean(session.composeOutput.patientSummaryText),
        patientSummaryContainsInternalDetails: session.composeOutput.patientSummaryInternalDetailsDetected
      })
    ) {
      throw new BadRequestException('Compose output failed source integrity or patient-summary safety validation.');
    }

    this.advanceFinalizationStep(stored, 'compose', 'compare_edit', generatedAt);
    return this.createFinalizationEnvelope(stored, context, 'finalization.compose', [
      'finalization.compose_requested.v1',
      'finalization.compose_completed.v1',
      'finalization.step_completed.v1'
    ]);
  }

  updateCompareEditOriginal(
    noteId: string,
    request: CompareEditUpdateRequestDto,
    context: RequestContext
  ): ApiEnvelope<FinalizationActionResponseDto> {
    const stored = this.getActiveFinalization(noteId, context, 'compare_edit');
    if (!request.originalNoteText.trim()) {
      throw new BadRequestException('Compare & Edit original note text is required');
    }
    stored.finalization.frozenSnapshot.originalNoteText = request.originalNoteText;
    if (stored.finalization.composeOutput) {
      stored.finalization.composeOutput = {
        ...stored.finalization.composeOutput,
        staleDueToEdit: true
      };
    }
    stored.finalization.finalNoteApproved = false;
    stored.finalization.patientSummaryApproved = false;
    stored.finalization.updatedAt = new Date().toISOString();

    return this.createFinalizationEnvelope(stored, context, 'finalization.compare_edit_update', [
      'finalization.compare_edit_updated.v1'
    ]);
  }

  rebeautifyFinalization(
    noteId: string,
    _request: RebeautifyRequestDto,
    context: RequestContext
  ): ApiEnvelope<FinalizationActionResponseDto> {
    const stored = this.getActiveFinalization(noteId, context, 'compare_edit');
    if (!stored.finalization.composeOutput) {
      throw new BadRequestException('Compose must complete before Re-beautify');
    }
    const generatedAt = new Date().toISOString();
    stored.finalization.composePhases = this.completedComposePhases();
    stored.finalization.composeOutput = this.generateComposeOutput(
      stored,
      generatedAt,
      stored.finalization.composeOutput.version + 1,
      false
    );
    stored.finalization.finalNoteApproved = false;
    stored.finalization.patientSummaryApproved = false;
    stored.finalization.updatedAt = generatedAt;

    return this.createFinalizationEnvelope(stored, context, 'finalization.rebeautify', [
      'finalization.compose_rebeautified.v1',
      'finalization.compose_completed.v1'
    ]);
  }

  approveFinalNote(
    noteId: string,
    request: ApprovalRequestDto,
    context: RequestContext
  ): ApiEnvelope<FinalizationActionResponseDto> {
    return this.approveCompareEditArtifact(noteId, request, context, 'final_note');
  }

  approvePatientSummary(
    noteId: string,
    request: ApprovalRequestDto,
    context: RequestContext
  ): ApiEnvelope<FinalizationActionResponseDto> {
    return this.approveCompareEditArtifact(noteId, request, context, 'patient_summary');
  }

  generateDraftClaimPreview(noteId: string, context: RequestContext): ApiEnvelope<FinalizationActionResponseDto> {
    const stored = this.getActiveFinalization(noteId, context, 'billing_attest');
    stored.finalization.draftClaimPreview = this.createDraftClaimPreview(stored);
    stored.finalization.updatedAt = new Date().toISOString();

    return this.createFinalizationEnvelope(stored, context, 'billing.draft_claim_preview_generate', [
      'draft_claim_preview.generated.v1',
      ...(stored.finalization.draftClaimPreview.billingReviewTriggered ? (['billing_review.triggered.v1'] as CoreEventType[]) : [])
    ]);
  }

  completeBillingAttest(
    noteId: string,
    request: BillingAttestRequestDto,
    context: RequestContext
  ): ApiEnvelope<FinalizationActionResponseDto> {
    const stored = this.getActiveFinalization(noteId, context, 'billing_attest');
    if (!stored.finalization.draftClaimPreview) {
      stored.finalization.draftClaimPreview = this.createDraftClaimPreview(stored);
    }
    const requiredStatements = this.requiredBillingAttestations();
    const acceptedSet = new Set(request.acceptedStatements);
    const allStatementsAccepted = requiredStatements.every((statement) => acceptedSet.has(statement));
    const unresolvedBlockerTaskCount = this.countUnresolvedBlockerTasks(stored);
    const criticalPayerEvidenceGapCount = stored.finalization.draftClaimPreview.claimReadiness === 'blocked' ? 1 : 0;

    if (
      !canCompleteBillingAttest({
        finalNoteApproved: stored.finalization.finalNoteApproved,
        patientSummaryApproved: stored.finalization.patientSummaryApproved,
        draftClaimPreviewGenerated: Boolean(stored.finalization.draftClaimPreview),
        requiredAttestationsAccepted: allStatementsAccepted,
        estimateCaveatAcknowledged: request.estimateCaveatAcknowledged,
        unresolvedBlockerTaskCount,
        criticalPayerEvidenceGapCount
      })
    ) {
      throw new BadRequestException({
        code: 'BILLING_ATTEST_BLOCKED',
        message: 'Billing & Attest requires all attestations, estimate caveat acknowledgement, draft claim preview, and no open blockers.'
      });
    }

    const now = new Date().toISOString();
    const billingReviewTriggered = request.routeToBillingReview || stored.finalization.draftClaimPreview.billingReviewTriggered;
    stored.finalization.draftClaimPreview = {
      ...stored.finalization.draftClaimPreview,
      billingReviewTriggered,
      claimReadiness: billingReviewTriggered ? 'needs_billing_review' : 'ready'
    };
    stored.finalization.billingAttestation = {
      billingAttestationId: this.nextId('billing-attestation'),
      noteId,
      requiredStatements,
      acceptedStatements: request.acceptedStatements,
      estimateCaveatAcknowledged: request.estimateCaveatAcknowledged,
      billingReviewTriggered,
      attestedByUserId: context.actorUserId,
      attestedAt: now
    };
    stored.finalization.billingAttested = true;
    this.advanceFinalizationStep(stored, 'billing_attest', 'sign_dispatch', now);

    return this.createFinalizationEnvelope(stored, context, 'billing.attest_complete', [
      'billing_attestation.completed.v1',
      ...(billingReviewTriggered ? (['billing_review.triggered.v1'] as CoreEventType[]) : []),
      'finalization.step_completed.v1'
    ]);
  }

  signAndDispatch(noteId: string, context: RequestContext): ApiEnvelope<FinalizationActionResponseDto> {
    const stored = this.getActiveFinalization(noteId, context, 'sign_dispatch');
    if (stored.finalization.signedAndDispatched) {
      throw new BadRequestException('note has already been signed and dispatched');
    }
    if (
      !canSignAndDispatchAfterBilling({
        billingAttested: stored.finalization.billingAttested,
        finalNoteApproved: stored.finalization.finalNoteApproved,
        patientSummaryApproved: stored.finalization.patientSummaryApproved,
        tasks: stored.tasks ?? []
      })
    ) {
      throw new BadRequestException({
        code: 'SIGN_DISPATCH_BLOCKED',
        message: 'Sign & Dispatch requires billing attestation, final note approval, patient summary approval, and no unresolved blockers.'
      });
    }
    if (!stored.finalization.composeOutput) {
      throw new BadRequestException('Sign & Dispatch requires a composed final note and patient summary');
    }

    const finalizedAt = new Date().toISOString();
    stored.finalization.finalNote = this.createFinalNoteRecord(stored, finalizedAt);
    stored.finalization.patientSummary = this.createPatientSummaryRecord(stored, finalizedAt);
    stored.finalization.writeback = this.createWritebackQueue(stored, 'final_note', 'not_configured', false, finalizedAt);
    stored.finalization.completedSteps = Array.from(new Set([...stored.finalization.completedSteps, 'sign_dispatch']));
    stored.finalization.stepStatuses = {
      ...stored.finalization.stepStatuses,
      sign_dispatch: 'completed'
    };
    stored.finalization.signedAndDispatched = true;
    stored.finalization.updatedAt = finalizedAt;
    stored.appointment = { ...stored.appointment, state: 'finalized' };
    stored.note = { ...stored.note, state: 'finalized' };
    stored.lifecycle = {
      ...stored.lifecycle,
      appointmentState: 'finalized',
      noteState: 'finalized',
      noteVisibleInDrafts: false
    };

    return this.createFinalizationEnvelope(stored, context, 'finalization.sign_dispatch', [
      'note.signed.v1',
      'final_note.created.v1',
      'patient_summary.finalized.v1',
      'note.dispatched.v1',
      'finalization.step_completed.v1'
    ]);
  }

  generateFinalNotePdf(noteId: string, context: RequestContext): ApiEnvelope<ExportActionResponseDto> {
    return this.generateExportArtifact(noteId, context, 'final_note_pdf', 'export.final_note_pdf_generate');
  }

  generatePatientSummaryPdf(noteId: string, context: RequestContext): ApiEnvelope<ExportActionResponseDto> {
    return this.generateExportArtifact(noteId, context, 'patient_summary_pdf', 'export.patient_summary_pdf_generate');
  }

  copyFinalNote(noteId: string, context: RequestContext): ApiEnvelope<ExportActionResponseDto> {
    return this.generateExportArtifact(noteId, context, 'final_note_copy', 'export.final_note_copy_prepare');
  }

  copyPatientSummary(noteId: string, context: RequestContext): ApiEnvelope<ExportActionResponseDto> {
    return this.generateExportArtifact(noteId, context, 'patient_summary_copy', 'export.patient_summary_copy_prepare');
  }

  exportStructuredFinalNote(noteId: string, context: RequestContext): ApiEnvelope<ExportActionResponseDto> {
    return this.generateExportArtifact(noteId, context, 'structured_export', 'export.structured_final_note_generate');
  }

  requestEhrWriteback(
    noteId: string,
    request: EhrWritebackRequestDto,
    context: RequestContext
  ): ApiEnvelope<EhrWritebackActionResponseDto> {
    const stored = this.getSignedFinalizedNote(noteId, context);
    if (!canPerform('ehr_writeback:queue', context.access)) {
      throw new ForbiddenException('role cannot queue EHR writeback');
    }

    const mode = request.scaffoldMode ?? 'not_configured';
    const status = this.resolveScaffoldWritebackStatus(stored, request);
    const now = new Date().toISOString();
    const writeback = this.createWritebackQueue(stored, request.target, status, request.humanApproved, now);
    stored.finalization.writeback =
      mode === 'simulate_failure'
        ? {
            ...writeback,
            failedAt: now,
            failureReason: 'Synthetic EHR writeback failure state for WO-008 queue coverage.',
            retryable: true
          }
        : writeback;

    return createApiEnvelope(
      {
        writeback: stored.finalization.writeback,
        finalizedNote: this.toFinalizedNoteDetail(stored, context.access),
        auditEvent: this.createAuditEvent('ehr.writeback_request', 'Note', stored.note.noteId, context),
        domainEvents: [
          this.createDomainEventForNote(
            stored,
            context,
            stored.finalization.writeback.status === 'queued' ? 'ehr_writeback.queued.v1' : 'ehr_writeback.failed.v1',
            {
              status: stored.finalization.writeback.status,
              target: stored.finalization.writeback.target,
              configured: stored.finalization.writeback.configured,
              retryable: stored.finalization.writeback.retryable
            }
          )
        ]
      },
      this.createMeta(context)
    );
  }

  createRequestContext(headers: Record<string, string | string[] | undefined>): RequestContext {
    const session = createSyntheticLocalSession(headers, {
      defaultTenantId: TENANT_ID,
      defaultSiteId: SITE_ID,
      requestId: this.nextId('req'),
      traceId: this.nextId('trace'),
      defaultLinkedToPatient: (role) => role !== 'billing_staff',
      defaultLinkedToVisit: (role) => role === 'clinician'
    });

    if (!session.tenantScopeAllowed) {
      throw new ForbiddenException(session.denialReason ?? 'tenant access denied');
    }

    const context: RequestContext = {
      requestId: session.requestId,
      traceId: session.traceId,
      actorUserId: session.actorUserId,
      access: session.access
    };

    if (session.idempotencyKey) {
      context.idempotencyKey = session.idempotencyKey;
    }

    return context;
  }

  private toScheduleCard(entry: StoredAppointment): ScheduleAppointmentDto {
    return {
      ...entry.appointment,
      noteStatus: entry.note.state,
      noteVisibleInDrafts: entry.lifecycle.noteVisibleInDrafts,
      startVisitEnabled: canStartVisit(entry.appointment.state, entry.note.state),
      ehrSchedulingEnabled: false,
      clinicOsSchedulingEnabled: false
    };
  }

  private createReviewActionEnvelope(
    entry: StoredAppointment,
    context: RequestContext,
    auditAction: string,
    eventTypes: CoreEventType[]
  ): ApiEnvelope<ReviewActionResponseDto> {
    return createApiEnvelope(
      {
        suggestions: entry.suggestions ?? [],
        visitSelections: entry.visitSelections ?? [],
        complianceReview: this.toComplianceReview(entry),
        historyGaps: entry.historyGaps ?? [],
        tasks: entry.tasks ?? [],
        auditEvent: this.createAuditEvent(auditAction, 'Note', entry.note.noteId, context),
        domainEvents: eventTypes.map((eventType) =>
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType,
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            appointmentId: entry.appointment.appointmentId,
            noteId: entry.note.noteId,
            ...(entry.visitSession ? { visitSessionId: entry.visitSession.visitSessionId } : {}),
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'phi_reference',
            retentionClass: 'audit',
            payload: {
              suggestions: entry.suggestions?.length ?? 0,
              visitSelections: entry.visitSelections?.length ?? 0,
              complianceIssues: entry.complianceIssues?.length ?? 0,
              tasks: entry.tasks?.length ?? 0
            }
          })
        )
      },
      this.createMeta(context)
    );
  }

  private requiredBillingAttestations(): string[] {
    return [
      'I have reviewed and accepted the final note.',
      'I have reviewed and accepted the patient summary.',
      'I have reviewed selected codes/items and understand they remain my responsibility.',
      'I have resolved, closed, or assigned open history questions.',
      'I understand the draft claim preview is a support tool and not an automated claim submission.'
    ];
  }

  private createDraftClaimPreview(entry: StoredAppointment & { finalization: FinalizationSessionDto }): DraftClaimPreviewDto {
    const selections = entry.visitSelections ?? [];
    const cptCandidates = selections.filter((selection) => selection.category === 'cpt').map((selection) => selection.label);
    const hcpcsCandidates = selections.filter((selection) => selection.category === 'hcpcs').map((selection) => selection.label);
    const icd10Candidates = selections.filter((selection) => selection.category === 'icd10').map((selection) => selection.label);
    const billingReviewTriggered =
      entry.finalization.unusedAuditItems.length > 0 ||
      selections.some((selection) => selection.category === 'icd10' && Boolean(selection.overrideReason));

    return {
      draftClaimPreviewId: this.nextId('draft-claim'),
      noteId: entry.note.noteId,
      status: 'draft_preview',
      claimReadiness: billingReviewTriggered ? 'needs_billing_review' : 'ready',
      patientReference: entry.appointment.safePatientId,
      encounterDate: entry.appointment.startsAt.slice(0, 10),
      renderingClinicianId: entry.appointment.clinicianId,
      placeOfService: entry.appointment.modality === 'telehealth' ? 'telehealth' : 'office',
      visitType: entry.appointment.visitType,
      cptCandidates: cptCandidates.length > 0 ? cptCandidates : ['No CPT candidate selected in synthetic preview'],
      hcpcsCandidates,
      icd10Candidates,
      emCandidate: cptCandidates.find((candidate) => candidate.includes('99214')) ?? 'E/M level not selected',
      diagnosisToServiceLinks: icd10Candidates.flatMap((diagnosis) =>
        cptCandidates.length > 0 ? cptCandidates.map((code) => `${diagnosis} -> ${code}`) : []
      ),
      payerReadableJustification:
        entry.finalization.composeOutput?.payerReadableSupportSection ??
        'Payer-readable support unavailable until Compose completes.',
      missingEvidence: billingReviewTriggered ? ['Billing review routed because final-pass items or overrides require review.'] : [],
      denialRiskFlags: billingReviewTriggered ? ['billing_review_required'] : [],
      estimateStatus: 'unavailable_caveated',
      estimateCaveat:
        'Estimate unavailable: this clinic has not configured fee schedule, payer contract, or patient responsibility data for this service.',
      billingReviewTriggered,
      submittedClaim: false
    };
  }

  private generateExportArtifact(
    noteId: string,
    context: RequestContext,
    artifactType: ExportArtifactDto['artifactType'],
    auditAction: string
  ): ApiEnvelope<ExportActionResponseDto> {
    const stored = this.getSignedFinalizedNote(noteId, context);
    const permission: 'patient_summary:export' | 'final_note:export' =
      artifactType === 'patient_summary_pdf' || artifactType === 'patient_summary_copy'
        ? 'patient_summary:export'
        : 'final_note:export';
    if (!canPerform(permission, context.access)) {
      throw new ForbiddenException('role cannot export this finalized artifact');
    }
    if (
      !canGenerateFinalArtifact({
        signedAndDispatched: stored.finalization.signedAndDispatched,
        finalNoteAvailable: Boolean(stored.finalization.finalNote),
        patientSummaryAvailable: Boolean(stored.finalization.patientSummary),
        artifactType
      })
    ) {
      throw new BadRequestException('copy/export/PDF actions require signed final note and patient summary records');
    }
    if (artifactType === 'patient_summary_pdf' || artifactType === 'patient_summary_copy') {
      const patientSummaryText = stored.finalization.patientSummary?.patientSummaryText ?? '';
      if (patientSummaryContainsInternalDetails(patientSummaryText)) {
        throw new BadRequestException('patient summary export blocked because internal details were detected');
      }
    }

    const artifact = this.createExportArtifact(stored, artifactType, context);
    stored.finalization.exportArtifacts = [...stored.finalization.exportArtifacts, artifact];
    stored.finalization.updatedAt = artifact.generatedAt;

    return createApiEnvelope(
      {
        artifact,
        finalizedNote: this.toFinalizedNoteDetail(stored, context.access),
        auditEvent: this.createAuditEvent(auditAction, 'Note', stored.note.noteId, context),
        domainEvents: [
          this.createDomainEventForNote(stored, context, 'export.generated.v1', {
            artifactType: artifact.artifactType,
            fileName: artifact.fileName,
            mimeType: artifact.mimeType,
            signedVersionLocked: artifact.signedVersionLocked
          })
        ]
      },
      this.createMeta(context)
    );
  }

  private createExportArtifact(
    entry: StoredAppointment & { finalization: FinalizationSessionDto },
    artifactType: ExportArtifactDto['artifactType'],
    context: RequestContext
  ): ExportArtifactDto {
    if (!entry.finalization.finalNote || !entry.finalization.patientSummary) {
      throw new BadRequestException('export artifact requires signed final records');
    }

    const generatedAt = new Date().toISOString();
    const exportArtifactId = this.nextId('export');
    const fileName = this.exportFileName(entry, artifactType);
    const content = this.exportArtifactContent(entry, artifactType, generatedAt);
    const checksum = this.syntheticChecksum(content);
    const storageDelivery = this.createExportStorageDelivery({
      entry,
      exportArtifactId,
      artifactType,
      fileName,
      content,
      checksum,
      generatedAt,
      context
    });

    return {
      exportArtifactId,
      noteId: entry.note.noteId,
      artifactType,
      status: 'generated',
      mimeType: artifactType.endsWith('_pdf') ? 'application/pdf' : artifactType === 'structured_export' ? 'application/json' : 'text/plain',
      fileName,
      generatedAt,
      generatedByUserId: context.actorUserId,
      sourceFinalizedAt: entry.finalization.finalNote.finalizedAt,
      signedVersionLocked: true,
      ...(artifactType === 'patient_summary_pdf' || artifactType === 'patient_summary_copy'
        ? { patientSummaryInternalDetailsExcluded: true as const }
        : {}),
      content,
      checksum,
      ...storageDelivery
    };
  }

  private createExportStorageDelivery(input: {
    entry: StoredAppointment & { finalization: FinalizationSessionDto };
    exportArtifactId: string;
    artifactType: ExportArtifactDto['artifactType'];
    fileName: string;
    content: string;
    checksum: string;
    generatedAt: string;
    context: RequestContext;
  }): Partial<ExportArtifactDto> {
    const retentionClass = input.artifactType === 'structured_export' ? 'audit' : 'standard';
    if (process.env.AURA_ENABLE_STORAGE_BACKED_EXPORTS !== 'true') {
      return {
        retentionClass,
        deliveryMode: 'inline_synthetic',
        contentLengthBytes: Buffer.byteLength(input.content, 'utf8'),
        signedDownloadAvailable: false
      };
    }

    const storage = new InMemoryObjectStorageAdapter(() => input.generatedAt);
    const storageKey = buildStorageKey({
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      recordClass: 'exports',
      recordId: input.exportArtifactId,
      fileName: input.fileName
    });
    const stored = storage.putObject({
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      storageKey,
      body: input.content,
      contentType: input.artifactType.endsWith('_pdf') ? 'application/pdf' : input.artifactType === 'structured_export' ? 'application/json' : 'text/plain',
      retentionClass,
      traceId: input.context.traceId
    });
    const signed = storage.createSignedDownload({
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      storageKey,
      requestedByUserId: input.context.actorUserId,
      permission:
        input.artifactType === 'patient_summary_pdf' || input.artifactType === 'patient_summary_copy'
          ? 'patient_summary:export'
          : 'final_note:export',
      expiresAt: new Date(new Date(input.generatedAt).getTime() + 15 * 60_000).toISOString(),
      traceId: input.context.traceId
    });

    return {
      retentionClass,
      deliveryMode: 'storage_backed',
      storageProvider: 'azure_blob',
      storageKey: stored.storageKey,
      contentLengthBytes: stored.contentLengthBytes,
      signedDownloadAvailable: true,
      signedDownloadToken: signed.signedDownloadToken,
      signedDownloadExpiresAt: signed.signedDownloadExpiresAt
    };
  }

  private exportArtifactContent(
    entry: StoredAppointment & { finalization: FinalizationSessionDto },
    artifactType: ExportArtifactDto['artifactType'],
    generatedAt: string
  ): string {
    const finalNote = entry.finalization.finalNote;
    const patientSummary = entry.finalization.patientSummary;
    if (!finalNote || !patientSummary) {
      throw new BadRequestException('export artifact requires signed final records');
    }
    const header = [
      'AURA Note Synthetic Export',
      `Clinic: ${SITE_ID}`,
      `Patient: ${entry.appointment.safePatientId}`,
      `Visit: ${entry.appointment.visitType} on ${entry.appointment.startsAt.slice(0, 10)}`,
      `Clinician: ${entry.appointment.clinicianId}`
    ].join('\n');
    const footer = `Generated: ${generatedAt}\nDocument type: ${artifactType}\nSigned source timestamp: ${finalNote.finalizedAt}`;

    if (artifactType === 'structured_export') {
      return JSON.stringify(
        {
          header: {
            clinic: SITE_ID,
            patient: entry.appointment.safePatientId,
            visitType: entry.appointment.visitType,
            clinician: entry.appointment.clinicianId,
            generatedAt
          },
          finalNote: finalNote.finalNoteText,
          patientSummary: patientSummary.patientSummaryText,
          draftClaimPreview: entry.finalization.draftClaimPreview ?? null,
          signedVersionLocked: true,
          claimSubmissionPerformed: false
        },
        null,
        2
      );
    }

    const body =
      artifactType === 'patient_summary_pdf' || artifactType === 'patient_summary_copy'
        ? patientSummary.patientSummaryText
        : finalNote.finalNoteText;
    if (artifactType.endsWith('_pdf')) {
      return [`%PDF-1.4 synthetic`, header, body, footer, '%%EOF'].join('\n\n');
    }
    return [header, body, footer].join('\n\n');
  }

  private exportFileName(
    entry: StoredAppointment & { finalization: FinalizationSessionDto },
    artifactType: ExportArtifactDto['artifactType']
  ): string {
    const base = `${entry.note.noteId}-${artifactType.replaceAll('_', '-')}`;
    if (artifactType.endsWith('_pdf')) return `${base}.pdf`;
    if (artifactType === 'structured_export') return `${base}.json`;
    return `${base}.txt`;
  }

  private syntheticChecksum(content: string): string {
    let hash = 0;
    for (let index = 0; index < content.length; index += 1) {
      hash = (hash * 31 + content.charCodeAt(index)) >>> 0;
    }
    return `synthetic-${hash.toString(16).padStart(8, '0')}`;
  }

  private createFinalNoteRecord(
    entry: StoredAppointment & { finalization: FinalizationSessionDto },
    finalizedAt: string
  ): FinalNoteRecordDto {
    if (!entry.finalization.composeOutput) {
      throw new BadRequestException('final note requires compose output');
    }

    return {
      finalNoteId: this.nextId('final-note'),
      noteId: entry.note.noteId,
      appointmentId: entry.appointment.appointmentId,
      safePatientId: entry.appointment.safePatientId,
      clinicianId: entry.appointment.clinicianId,
      finalNoteText: entry.finalization.composeOutput.enhancedNoteText,
      finalizedAt,
      readOnly: true
    };
  }

  private createPatientSummaryRecord(
    entry: StoredAppointment & { finalization: FinalizationSessionDto },
    finalizedAt: string
  ): PatientSummaryRecordDto {
    if (!entry.finalization.composeOutput) {
      throw new BadRequestException('patient summary requires compose output');
    }

    return {
      patientSummaryId: this.nextId('patient-summary'),
      noteId: entry.note.noteId,
      patientSummaryText: entry.finalization.composeOutput.patientSummaryText,
      finalizedAt,
      patientFacing: true,
      internalBillingDetailsExcluded: true
    };
  }

  private createFinalizationSession(entry: StoredAppointment): FinalizationSessionDto {
    const now = new Date().toISOString();
    const finalPassSuggestions = (entry.suggestions ?? this.createDeterministicSuggestions(entry)).filter(
      (suggestion) => suggestion.status === 'candidate' && suggestion.confidence > 0.5
    );

    return {
      finalizationSessionId: this.nextId('finalization'),
      noteId: entry.note.noteId,
      appointmentId: entry.appointment.appointmentId,
      currentStep: 'code_review',
      completedSteps: [],
      stepStatuses: {
        code_review: 'in_progress',
        suggestion_review: 'not_started',
        compose: 'not_started',
        compare_edit: 'not_started',
        billing_attest: 'not_started',
        sign_dispatch: 'not_started'
      },
      frozenSnapshot: {
        originalNoteText: this.createDeterministicOriginalNote(entry),
        visitSelections: entry.visitSelections ?? [],
        finalPassSuggestions,
        transcriptSegmentCount: entry.transcript?.segments.length ?? 0,
        historyGapQuestionCount: entry.historyGaps?.length ?? 0
      },
      selectionDecisions: [],
      suggestionDecisions: [],
      unusedAuditItems: [],
      composePhases: [],
      patientOpportunities: this.createDeterministicPatientOpportunities(entry),
      exportArtifacts: [],
      writeback: this.createWritebackQueue(entry, 'final_note', 'disabled', false),
      finalNoteApproved: false,
      patientSummaryApproved: false,
      readyForBillingAttest: false,
      billingAttested: false,
      signedAndDispatched: false,
      createdAt: now,
      updatedAt: now
    };
  }

  private createDeterministicOriginalNote(entry: StoredAppointment): string {
    const selectionLabels = (entry.visitSelections ?? []).map((selection) => selection.label).join('; ') || 'No selections yet';
    return [
      `Synthetic draft note for ${entry.appointment.visitType}.`,
      `Visit selections at wizard launch: ${selectionLabels}.`,
      'Clinician-authored source text is represented as deterministic scaffold content for WO-006.'
    ].join('\n');
  }

  private createDeterministicPatientOpportunities(entry: StoredAppointment): FinalizationSessionDto['patientOpportunities'] {
    return [
      {
        patientOpportunityId: 'opportunity-demo-care-gap',
        noteId: entry.note.noteId,
        category: 'clinical',
        title: 'Confirm follow-up plan',
        detail: 'Synthetic clinical opportunity to make the patient follow-up plan explicit.',
        patientFacingAllowed: true,
        revenueHiddenFromPatient: true
      },
      {
        patientOpportunityId: 'opportunity-demo-quality',
        noteId: entry.note.noteId,
        category: 'quality',
        title: 'Quality measure follow-up',
        detail: 'Synthetic quality opportunity remains human-review-required before it appears in any output.',
        patientFacingAllowed: false,
        revenueHiddenFromPatient: true
      }
    ];
  }

  private completedComposePhases(): FinalizationSessionDto['composePhases'] {
    return [
      { phase: 'analyzing_content', status: 'completed' },
      { phase: 'enhancing_structure', status: 'completed' },
      { phase: 'beautifying_language', status: 'completed' },
      { phase: 'final_review', status: 'completed' }
    ];
  }

  private generateComposeOutput(
    entry: StoredAppointment & { finalization: FinalizationSessionDto },
    generatedAt: string,
    version: number,
    staleDueToEdit: boolean
  ): FinalizationComposeOutputDto {
    const keptSelectionLabels = entry.finalization.frozenSnapshot.visitSelections
      .filter((selection) => {
        const decision = entry.finalization.selectionDecisions.find((candidate) => candidate.visitSelectionId === selection.visitSelectionId);
        return !decision || decision.decision === 'keep';
      })
      .map((selection) => selection.label);
    const keptSuggestionLabels = entry.finalization.suggestionDecisions
      .filter((decision) => decision.decision === 'keep')
      .map((decision) => entry.finalization.frozenSnapshot.finalPassSuggestions.find((suggestion) => suggestion.suggestionId === decision.suggestionId)?.label)
      .filter((label): label is string => Boolean(label));
    const supportItems = [...keptSelectionLabels, ...keptSuggestionLabels];
    const payerSupport =
      supportItems.length > 0
        ? `Payer-readable support is limited to clinician-reviewed synthetic items: ${supportItems.join('; ')}.`
        : 'No payer-readable support items were kept in the synthetic finalization snapshot.';
    const patientSummary =
      'Today we reviewed your follow-up plan. Bring your medication list to the next visit and contact the clinic if symptoms change.';

    return {
      composeOutputId: this.nextId('compose-output'),
      noteId: entry.note.noteId,
      version,
      enhancedNoteText: [
        'Enhanced Synthetic Clinician Note',
        entry.finalization.frozenSnapshot.originalNoteText,
        payerSupport,
        'All generated content remains draft-only until clinician approval.'
      ].join('\n\n'),
      patientSummaryText: patientSummary,
      payerReadableSupportSection: payerSupport,
      planTaskMapping: ['Synthetic follow-up plan item remains available for staff task routing in later work orders.'],
      sourceIntegrityWarnings: [
        'WO-006 compose uses deterministic synthetic content only.',
        'No unsupported symptoms, diagnoses, procedures, time, or billing finalization were added.'
      ],
      patientSummaryInternalDetailsDetected: patientSummaryContainsInternalDetails(patientSummary),
      staleDueToEdit,
      generatedAt,
      draftOnly: true
    };
  }

  private upsertUnusedAuditItem(
    session: FinalizationSessionDto,
    item: UnusedAuditItemDto
  ): UnusedAuditItemDto[] {
    return [...session.unusedAuditItems.filter((candidate) => candidate.sourceId !== item.sourceId), item];
  }

  private countUnresolvedBlockerTasks(entry: StoredAppointment): number {
    return (entry.tasks ?? []).filter((task) => task.blocksSigning && task.adjudicationStatus === 'open').length;
  }

  private getActiveFinalization(
    noteId: string,
    context: RequestContext,
    expectedStep: FinalizationSessionDto['currentStep']
  ): StoredAppointment & { finalization: FinalizationSessionDto } {
    const stored = this.getReviewableNote(noteId, context);
    this.assertFinalizationManageAllowed(context);
    if (!stored.finalization) {
      throw new NotFoundException('finalization session not found');
    }
    if (stored.finalization.currentStep !== expectedStep) {
      throw new BadRequestException(`finalization is currently on ${stored.finalization.currentStep}`);
    }
    return stored as StoredAppointment & { finalization: FinalizationSessionDto };
  }

  private advanceFinalizationStep(
    entry: StoredAppointment & { finalization: FinalizationSessionDto },
    completedStep: FinalizationSessionDto['currentStep'],
    nextStep: FinalizationSessionDto['currentStep'],
    updatedAt = new Date().toISOString()
  ): void {
    entry.finalization.completedSteps = Array.from(new Set([...entry.finalization.completedSteps, completedStep]));
    entry.finalization.stepStatuses = {
      ...entry.finalization.stepStatuses,
      [completedStep]: 'completed',
      [nextStep]: 'in_progress'
    };
    entry.finalization.currentStep = nextStep;
    entry.finalization.updatedAt = updatedAt;
    entry.note = { ...entry.note, state: this.noteStateForWizardStep(nextStep) };
    entry.lifecycle = {
      ...entry.lifecycle,
      noteState: entry.note.state,
      appointmentState: 'finalization_in_progress',
      noteVisibleInDrafts: true
    };
  }

  private noteStateForWizardStep(step: FinalizationSessionDto['currentStep']): NoteState {
    switch (step) {
      case 'code_review':
        return 'finalization_code_review';
      case 'suggestion_review':
        return 'finalization_suggestion_review';
      case 'compose':
        return 'finalization_compose';
      case 'compare_edit':
        return 'finalization_compare_edit';
      case 'billing_attest':
        return 'finalization_billing_attest';
      case 'sign_dispatch':
        return 'finalization_sign_dispatch';
    }
  }

  private approveCompareEditArtifact(
    noteId: string,
    request: ApprovalRequestDto,
    context: RequestContext,
    artifact: 'final_note' | 'patient_summary'
  ): ApiEnvelope<FinalizationActionResponseDto> {
    const stored = this.getActiveFinalization(noteId, context, 'compare_edit');
    if (!request.approved || !request.attestation.trim()) {
      throw new BadRequestException('approval requires an affirmative attestation');
    }
    if (!stored.finalization.composeOutput || stored.finalization.composeOutput.staleDueToEdit) {
      throw new BadRequestException('current compose output must be available and not stale before approval');
    }

    if (artifact === 'final_note') {
      stored.finalization.finalNoteApproved = true;
    } else {
      stored.finalization.patientSummaryApproved = true;
    }
    const eventTypes: CoreEventType[] = [artifact === 'final_note' ? 'final_note.approved.v1' : 'patient_summary.approved.v1'];
    if (
      canCompleteCompareEdit({
        finalNoteApproved: stored.finalization.finalNoteApproved,
        patientSummaryApproved: stored.finalization.patientSummaryApproved,
        enhancedOutputStale: stored.finalization.composeOutput.staleDueToEdit
      })
    ) {
      stored.finalization.readyForBillingAttest = true;
      this.advanceFinalizationStep(stored, 'compare_edit', 'billing_attest');
      eventTypes.push('finalization.step_completed.v1');
    } else {
      stored.finalization.updatedAt = new Date().toISOString();
    }

    return this.createFinalizationEnvelope(
      stored,
      context,
      artifact === 'final_note' ? 'finalization.final_note_approve' : 'finalization.patient_summary_approve',
      eventTypes
    );
  }

  private assertFinalizationManageAllowed(context: RequestContext): void {
    if (!canPerform('finalization:manage', this.createLinkedVisitContext(context.access))) {
      throw new ForbiddenException('role cannot manage finalization');
    }
  }

  private createFinalizationEnvelope(
    entry: StoredAppointment & { finalization?: FinalizationSessionDto },
    context: RequestContext,
    auditAction: string,
    eventTypes: CoreEventType[]
  ): ApiEnvelope<FinalizationActionResponseDto> {
    if (!entry.finalization) {
      throw new BadRequestException('finalization session is not active');
    }
    const finalization = entry.finalization;

    return createApiEnvelope(
      {
        finalizationSession: finalization,
        auditEvent: this.createAuditEvent(auditAction, 'Note', entry.note.noteId, context),
        domainEvents: eventTypes.map((eventType) =>
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType,
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            appointmentId: entry.appointment.appointmentId,
            noteId: entry.note.noteId,
            ...(entry.visitSession ? { visitSessionId: entry.visitSession.visitSessionId } : {}),
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'phi_reference',
            retentionClass: 'audit',
            payload: {
              currentStep: finalization.currentStep,
              completedSteps: finalization.completedSteps,
              selectionDecisions: finalization.selectionDecisions.length,
              suggestionDecisions: finalization.suggestionDecisions.length,
              unusedAuditItems: finalization.unusedAuditItems.length,
              finalNoteApproved: finalization.finalNoteApproved,
              patientSummaryApproved: finalization.patientSummaryApproved,
              readyForBillingAttest: finalization.readyForBillingAttest,
              billingAttested: finalization.billingAttested,
              signedAndDispatched: finalization.signedAndDispatched,
              draftClaimPreviewGenerated: Boolean(finalization.draftClaimPreview)
            }
          })
        )
      },
      this.createMeta(context)
    );
  }

  private getSignedFinalizedNote(
    noteId: string,
    context: RequestContext
  ): StoredAppointment & { finalization: FinalizationSessionDto } {
    const stored = this.getStoredByNoteId(noteId);
    if (!canPerform('final_note:view', context.access)) {
      throw new ForbiddenException('role cannot view finalized notes');
    }
    if (!stored.finalization?.signedAndDispatched || stored.note.state !== 'finalized') {
      throw new BadRequestException('final note actions require Sign & Dispatch completion');
    }
    return stored as StoredAppointment & { finalization: FinalizationSessionDto };
  }

  private resolveScaffoldWritebackStatus(
    entry: StoredAppointment & { finalization: FinalizationSessionDto },
    request: EhrWritebackRequestDto
  ): EhrWritebackQueueDto['status'] {
    const mode = request.scaffoldMode ?? 'not_configured';
    if (mode === 'simulate_failure') return 'failed';
    return resolveEhrWritebackStatus({
      signedAndDispatched: entry.finalization.signedAndDispatched,
      finalNoteAvailable: Boolean(entry.finalization.finalNote),
      destinationConfigured: mode === 'mock_queue' || mode === 'unsupported_by_vendor',
      humanApproved: request.humanApproved,
      vendorSupportsWriteback: mode !== 'unsupported_by_vendor'
    });
  }

  private createWritebackQueue(
    entry: StoredAppointment,
    target: EhrWritebackQueueDto['target'],
    status: EhrWritebackQueueDto['status'],
    humanApproved: boolean,
    timestamp = new Date().toISOString()
  ): EhrWritebackQueueDto {
    const configured = status !== 'disabled' && status !== 'not_configured';
    return {
      writebackJobId: this.nextId('writeback'),
      noteId: entry.note.noteId,
      target,
      vendor: 'athenahealth',
      status,
      configured,
      humanApproved,
      retryable: status === 'failed',
      ...(status === 'queued' ? { queuedAt: timestamp, externalJobId: `synthetic-athena-writeback-${entry.note.noteId}` } : {}),
      ...(status === 'failed' ? { failedAt: timestamp, failureReason: 'Synthetic writeback failure state.' } : {})
    };
  }

  private createDomainEventForNote(
    entry: StoredAppointment,
    context: RequestContext,
    eventType: CoreEventType,
    payload: Record<string, unknown>
  ) {
    return createEventEnvelope({
      eventId: this.nextId('evt'),
      eventType,
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      appointmentId: entry.appointment.appointmentId,
      noteId: entry.note.noteId,
      ...(entry.visitSession ? { visitSessionId: entry.visitSession.visitSessionId } : {}),
      producer: 'aura-note-api',
      traceId: context.traceId,
      idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
      sensitivity: 'phi_reference',
      retentionClass: 'audit',
      payload
    });
  }

  private createDeterministicSuggestions(entry: StoredAppointment): SuggestionDto[] {
    return [
      {
        suggestionId: 'suggestion-demo-cpt-99214',
        noteId: entry.note.noteId,
        category: 'cpt',
        label: 'CPT 99214 candidate',
        confidence: 0.82,
        rationale: 'Synthetic chronic follow-up complexity signal.',
        supportingEvidence: ['Synthetic medication review', 'Synthetic chronic condition follow-up'],
        missingEvidence: ['Final MDM support not completed'],
        status: 'candidate',
        lowConfidenceOverrideRequired: false,
        draftOnly: true
      },
      {
        suggestionId: 'suggestion-demo-icd10-e119',
        noteId: entry.note.noteId,
        category: 'icd10',
        label: 'ICD-10 E11.9 candidate',
        confidence: 0.74,
        rationale: 'Synthetic diagnosis candidate below locked 75 percent threshold.',
        supportingEvidence: ['Synthetic historical problem list reference'],
        missingEvidence: ['No confirming assessment text in current draft'],
        status: 'candidate',
        lowConfidenceOverrideRequired: true,
        draftOnly: true
      },
      {
        suggestionId: 'suggestion-demo-quality-bp',
        noteId: entry.note.noteId,
        category: 'quality_measure',
        label: 'Quality measure follow-up candidate',
        confidence: 0.88,
        rationale: 'Synthetic quality review signal.',
        supportingEvidence: ['Synthetic vitals review placeholder'],
        missingEvidence: ['Final plan text not completed'],
        status: 'candidate',
        lowConfidenceOverrideRequired: false,
        draftOnly: true
      }
    ];
  }

  private createDeterministicHistoryGaps(entry: StoredAppointment): HistoryGapQuestionDto[] {
    return [
      {
        historyGapQuestionId: 'history-gap-demo-001',
        noteId: entry.note.noteId,
        question: 'Confirm whether the synthetic follow-up history supports the selected diagnosis candidate.',
        supportsItem: 'ICD-10 E11.9 candidate',
        category: 'diagnosis_confidence',
        confidenceImpact: 'high',
        status: 'open',
        blockerEligible: true
      }
    ];
  }

  private evaluateComplianceIssues(entry: StoredAppointment): ComplianceIssueDto[] {
    const issues: ComplianceIssueDto[] = [];
    const unresolvedBlockers = (entry.tasks ?? []).filter((task) => task.blocksSigning && task.adjudicationStatus === 'open');

    if ((entry.visitSelections ?? []).length === 0) {
      issues.push({
        complianceIssueId: 'compliance-demo-selection-empty',
        noteId: entry.note.noteId,
        severity: 'soft_block',
        title: 'Visit Selections not reviewed',
        detail: 'Synthetic CP-1 review requires human review of candidate selections before finalize preparation.',
        blocksFinalize: false,
        source: 'deterministic_mock'
      });
    }

    if (unresolvedBlockers.length > 0) {
      issues.push({
        complianceIssueId: 'compliance-demo-history-gap-blocker',
        noteId: entry.note.noteId,
        severity: 'hard_block',
        title: 'Open MA History Gap blocker',
        detail: 'A History Gap follow-up task blocks signing until answered, closed, or reassigned nonblocking.',
        blocksFinalize: true,
        source: 'deterministic_mock'
      });
    }

    return issues;
  }

  private toComplianceReview(entry: StoredAppointment): ComplianceReviewDto {
    const issues = entry.complianceIssues ?? this.evaluateComplianceIssues(entry);
    const hardBlockCount = issues.filter((issue) => issue.blocksFinalize || issue.severity === 'hard_block').length;
    const unresolvedBlockerTaskCount = (entry.tasks ?? []).filter(
      (task) => task.blocksSigning && task.adjudicationStatus === 'open'
    ).length;

    return {
      noteId: entry.note.noteId,
      issues,
      finalizeDisabled: complianceBlocksFinalize({ hardBlockCount, unresolvedBlockerTaskCount })
    };
  }

  private getReviewableNote(noteId: string, context: RequestContext): StoredAppointment {
    const stored = this.getStoredByNoteId(noteId);
    if (!canPerform('draft_note:view', this.createLinkedVisitContext(context.access))) {
      throw new ForbiddenException('role cannot review note');
    }
    return stored;
  }

  private getSuggestion(entry: StoredAppointment, suggestionId: string): SuggestionDto {
    const suggestion = (entry.suggestions ?? []).find((candidate) => candidate.suggestionId === suggestionId);
    if (!suggestion) {
      throw new NotFoundException('suggestion not found');
    }
    return suggestion;
  }

  private createVisitControlEnvelope(
    entry: StoredAppointment,
    context: RequestContext,
    auditAction: string,
    eventTypes: CoreEventType[]
  ): ApiEnvelope<VisitSessionControlResponseDto> {
    if (!entry.visitSession) {
      throw new BadRequestException('visit session is not active');
    }
    const visitSession = entry.visitSession;

    return createApiEnvelope(
      {
        appointment: entry.appointment,
        note: entry.note,
        visitSession,
        ...(entry.rawAudioRetention ? { rawAudioRetention: entry.rawAudioRetention } : {}),
        ...(entry.transcript ? { transcript: entry.transcript } : {}),
        auditEvent: this.createAuditEvent(auditAction, 'Appointment', entry.appointment.appointmentId, context),
        domainEvents: eventTypes.map((eventType) =>
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType,
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            appointmentId: entry.appointment.appointmentId,
            noteId: entry.note.noteId,
            visitSessionId: visitSession.visitSessionId,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'phi_reference',
            retentionClass: eventType === 'transcript.segment_appended.v1' ? 'transcript' : 'audit',
            payload: {
              appointmentState: entry.appointment.state,
              noteState: entry.note.state,
              timerState: visitSession.timerState,
              recordingState: visitSession.recordingState,
              transcriptSegments: entry.transcript?.segments.length ?? 0
            }
          })
        )
      },
      this.createMeta(context)
    );
  }

  private getStartedAppointmentForControl(appointmentId: string, context: RequestContext): StoredAppointment & {
    visitSession: VisitSessionDto;
  } {
    const stored = this.getStoredAppointment(appointmentId);
    this.assertVisitControlAllowed(context);
    if (!stored.visitSession) {
      throw new BadRequestException('visit session has not started');
    }
    return stored as StoredAppointment & { visitSession: VisitSessionDto };
  }

  private assertVisitControlAllowed(context: RequestContext): void {
    if (!canPerform('visit:start', this.createLinkedVisitContext(context.access))) {
      throw new ForbiddenException('role cannot control visit session');
    }
  }

  private toDocumentationWorkspace(entry: StoredAppointment, context: RequestContext): DocumentationWorkspaceDto {
    const linkedContext = this.createLinkedVisitContext(context.access);
    if (!canPerform('draft_note:view', linkedContext)) {
      throw new ForbiddenException('role cannot open documentation workspace');
    }

    const gate = entry.visitSession ?? {
      visitSessionId: 'visit-session-not-started',
      noteId: entry.note.noteId,
      timerState: 'not_started' as const,
      recordingState: 'not_started' as const,
      editorUnlocked: false
    };
    const editorUnlocked = canEditNote(gate);
    const editorLockedReason = editorUnlocked ? undefined : this.editorLockedReason(gate);
    const finalizedReadOnly = entry.note.state === 'finalized';

    return {
      appointment: entry.appointment,
      note: entry.note,
      ...(entry.visitSession ? { visitSession: entry.visitSession } : {}),
      ...(entry.rawAudioRetention ? { rawAudioRetention: entry.rawAudioRetention } : {}),
      ...(entry.transcript ? { transcript: entry.transcript } : {}),
      editorLocked: !editorUnlocked || finalizedReadOnly,
      ...(editorLockedReason ? { editorLockedReason } : {}),
      finalizedReadOnly,
      availableStates: [
        'empty',
        'loading',
        'ready',
        'saving',
        'warning',
        'blocked',
        'failed',
        'permission_denied',
        'finalized_read_only',
        'demo_fixture'
      ],
      panels: [
        { panelId: 'visit_context', label: 'Visit Context', state: 'ready', itemCount: 1 },
        {
          panelId: 'controls',
          label: 'Visit Controls',
          state: entry.visitSession ? 'ready' : 'blocked',
          itemCount: entry.visitSession ? 1 : 0,
          ...(entry.visitSession ? {} : { blockedReason: 'Start Visit is required before timer controls are active.' })
        },
        {
          panelId: 'editor',
          label: 'Note Editor',
          state: finalizedReadOnly ? 'finalized_read_only' : editorUnlocked ? 'ready' : 'blocked',
          itemCount: editorUnlocked ? 1 : 0,
          ...(editorLockedReason ? { blockedReason: editorLockedReason } : {})
        },
        {
          panelId: 'visit_selections',
          label: 'Visit Selections',
          state: (entry.visitSelections ?? []).length > 0 ? 'ready' : 'empty',
          itemCount: entry.visitSelections?.length ?? 0
        },
        {
          panelId: 'suggestions',
          label: 'Suggestions',
          state: (entry.suggestions ?? []).length > 0 ? 'ready' : 'empty',
          itemCount: entry.suggestions?.length ?? 0
        },
        {
          panelId: 'transcript',
          label: 'Transcript',
          state: entry.transcript && entry.transcript.segments.length > 0 ? 'ready' : 'empty',
          itemCount: entry.transcript?.segments.length ?? 0
        },
        {
          panelId: 'compliance',
          label: 'Compliance & Quality Review',
          state: (entry.complianceIssues ?? []).some((issue) => issue.blocksFinalize) ? 'blocked' : (entry.complianceIssues ?? []).length > 0 ? 'warning' : 'empty',
          itemCount: entry.complianceIssues?.length ?? 0
        },
        {
          panelId: 'history_gap',
          label: 'History Gap Review',
          state: (entry.historyGaps ?? []).length > 0 ? 'ready' : 'empty',
          itemCount: entry.historyGaps?.length ?? 0
        }
      ]
    };
  }

  private toFinalizedNoteSummary(entry: StoredAppointment, access: AccessContext): FinalizedNoteSummaryDto {
    const transcriptContext =
      entry.finalization?.draftClaimPreview?.billingReviewTriggered && access.role === 'billing_staff'
        ? { ...access, billingReviewTriggered: true }
        : access;
    const exportStatus =
      (entry.finalization?.exportArtifacts.length ?? 0) > 0
        ? 'generated'
        : entry.note.state === 'finalized'
          ? 'not_generated'
          : undefined;

    return {
      noteId: entry.note.noteId,
      appointmentId: entry.appointment.appointmentId,
      safePatientId: entry.appointment.safePatientId,
      clinicianId: entry.appointment.clinicianId,
      ...(entry.finalization?.finalNote ? { finalizedAt: entry.finalization.finalNote.finalizedAt } : {}),
      readOnly: true,
      finalNoteAvailable: entry.note.state === 'finalized',
      patientSummaryAvailable: entry.note.state === 'finalized',
      transcriptAvailableForRole: canViewTranscript(transcriptContext),
      ...(exportStatus ? { exportStatus } : {}),
      patientSummaryStatus: entry.finalization?.patientSummary ? 'final' : 'not_available',
      billingReviewStatus: entry.finalization?.draftClaimPreview?.billingReviewTriggered ? 'routed' : 'not_routed',
      writebackStatus: entry.finalization?.writeback.status ?? 'disabled'
    };
  }

  private toFinalizedNoteDetail(entry: StoredAppointment, access: AccessContext): FinalizedNoteDetailDto {
    const summary = this.toFinalizedNoteSummary(entry, access);
    const finalNoteAvailable = Boolean(entry.finalization?.signedAndDispatched && entry.finalization.finalNote);
    const patientSummaryAvailable = Boolean(entry.finalization?.signedAndDispatched && entry.finalization.patientSummary);

    return {
      ...summary,
      finalNoteAvailable,
      patientSummaryAvailable,
      ...(entry.finalization?.finalNote ? { finalNote: entry.finalization.finalNote } : {}),
      ...(entry.finalization?.patientSummary ? { patientSummary: entry.finalization.patientSummary } : {}),
      ...(entry.finalization?.draftClaimPreview ? { draftClaimPreview: entry.finalization.draftClaimPreview } : {}),
      exportArtifacts: entry.finalization?.exportArtifacts ?? [],
      writeback: entry.finalization?.writeback ?? this.createWritebackQueue(entry, 'final_note', 'disabled', false),
      availableActions: {
        copyFinalNote: finalNoteAvailable && canPerform('final_note:export', access),
        copyPatientSummary: patientSummaryAvailable && canPerform('patient_summary:export', access),
        downloadFinalNotePdf: finalNoteAvailable && canPerform('final_note:export', access),
        downloadPatientSummaryPdf: patientSummaryAvailable && canPerform('patient_summary:export', access),
        exportStructured:
          finalNoteAvailable &&
          patientSummaryAvailable &&
          canPerform('final_note:export', access) &&
          canPerform('patient_summary:export', access),
        queueEhrWriteback: finalNoteAvailable && canPerform('ehr_writeback:queue', access)
      }
    };
  }

  private workflowStatusLabel(noteState: NoteDto['state']): string {
    const labels: Record<NoteDto['state'], string> = {
      shell_created: 'Shell created',
      draft_not_started: 'Draft not started',
      visit_active: 'Visit active',
      visit_paused: 'Visit paused',
      documentation_in_progress: 'Documentation in progress',
      ready_to_finalize: 'Ready to finalize',
      finalization_code_review: 'Finalization: code review',
      finalization_suggestion_review: 'Finalization: suggestion review',
      finalization_compose: 'Finalization: compose',
      finalization_compare_edit: 'Finalization: compare/edit',
      finalization_billing_attest: 'Finalization: billing & attest',
      finalization_sign_dispatch: 'Finalization: sign & dispatch',
      blocked_compliance: 'Blocked by compliance',
      blocked_history_gap: 'Blocked by History Gap',
      blocked_billing_review: 'Blocked by billing review',
      finalized: 'Finalized',
      exported: 'Exported',
      writeback_pending: 'Writeback pending',
      writeback_complete: 'Writeback complete',
      writeback_failed: 'Writeback failed'
    };
    return labels[noteState];
  }

  private editorLockedReason(gate: VisitSessionDto): string {
    if (gate.timerState === 'running') {
      return 'Editor is available.';
    }
    if (gate.recordingState === 'exception_approved') {
      return 'Editor is available through an approved recording exception.';
    }
    if (gate.timerState === 'not_started') {
      return 'Start Visit and run the timer before documenting.';
    }
    return 'Resume the visit timer or approve a recording exception before documenting.';
  }

  private toCreateResponse(
    entry: StoredAppointment,
    context: RequestContext,
    replayed: boolean
  ): CreateAppointmentResponseDto {
    const idempotencyKey = context.idempotencyKey ?? this.nextId('idem');
    return {
      appointment: entry.appointment,
      note: entry.note,
      auditEvent: this.createAuditEvent(
        replayed ? 'appointment.create.idempotent_replay' : 'appointment.create',
        'Appointment',
        entry.appointment.appointmentId,
        context
      ),
      domainEvents: replayed
        ? []
        : [
            createEventEnvelope({
              eventId: this.nextId('evt'),
              eventType: 'appointment.created.v1',
              tenantId: TENANT_ID,
              siteId: SITE_ID,
              appointmentId: entry.appointment.appointmentId,
              noteId: entry.note.noteId,
              producer: 'aura-note-api',
              traceId: context.traceId,
              idempotencyKey,
              sensitivity: 'phi_reference',
              retentionClass: 'audit',
              payload: {
                source: entry.appointment.source,
                appointmentState: entry.appointment.state
              }
            }),
            createEventEnvelope({
              eventId: this.nextId('evt'),
              eventType: 'note.shell_created.v1',
              tenantId: TENANT_ID,
              siteId: SITE_ID,
              appointmentId: entry.appointment.appointmentId,
              noteId: entry.note.noteId,
              producer: 'aura-note-api',
              traceId: context.traceId,
              idempotencyKey,
              sensitivity: 'phi_reference',
              retentionClass: 'audit',
              payload: {
                noteState: entry.note.state,
                noteVisibleInDrafts: entry.lifecycle.noteVisibleInDrafts
              }
            })
          ]
    };
  }

  private createAuditEvent(action: string, entityType: string, entityId: string, context: RequestContext): AuditEventDto {
    return {
      auditEventId: this.nextId('audit'),
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      actorUserId: context.actorUserId,
      action,
      entityType,
      entityId,
      traceId: context.traceId,
      createdAt: new Date().toISOString()
    };
  }

  private createMeta(context: RequestContext) {
    return {
      requestId: context.requestId,
      traceId: context.traceId,
      mode: APP_MODE,
      generatedAt: new Date().toISOString()
    };
  }

  private getStoredAppointment(appointmentId: string): StoredAppointment {
    const stored = this.repository.getAppointment(appointmentId);
    if (!stored) {
      throw new NotFoundException('appointment not found');
    }
    return stored;
  }

  private getStoredByNoteId(noteId: string): StoredAppointment {
    const stored = this.repository.getByNoteId(noteId);
    if (!stored) {
      throw new NotFoundException('note not found');
    }
    return stored;
  }

  private createLinkedVisitContext(access: AccessContext): AccessContext {
    return {
      ...access,
      linkedToPatient: true,
      linkedToVisit: true,
      treatingClinician: access.role === 'clinician' || access.treatingClinician
    };
  }

  private createLinkedPatientContext(access: AccessContext): AccessContext {
    return {
      ...access,
      linkedToPatient: true
    };
  }

  private nextId(prefix: string): string {
    const id = `${prefix}-synthetic-${this.sequence.toString().padStart(4, '0')}`;
    this.sequence += 1;
    return id;
  }

}

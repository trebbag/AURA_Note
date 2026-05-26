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
  type RawAudioRetentionMetadataDto,
  type RecordingExceptionRequestDto,
  type ComplianceIssueDto,
  type ComplianceReviewDto,
  type CreateHistoryGapTaskRequestDto,
  type ApprovalRequestDto,
  type CompareEditUpdateRequestDto,
  type ScheduleAppointmentDto,
  type ScheduleViewDto,
  type FinalizationActionResponseDto,
  type FinalizationComposeOutputDto,
  type FinalizationSelectionDecisionRequestDto,
  type FinalizationSessionDto,
  type FinalizationSuggestionDecisionRequestDto,
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
  canAcceptSuggestion,
  complianceBlocksFinalize,
  canStartFinalization,
  canStartVisit,
  createAppointmentLifecycle,
  createAppointmentNoteInvariant,
  createRawAudioRetentionMetadata,
  createTranscriptRetentionMetadata,
  pauseVisitGate,
  patientSummaryContainsInternalDetails,
  resumeVisitGate,
  startVisitLifecycle,
  stopVisitGate,
  validateAppointmentDraft,
  type AppointmentLifecycle,
  type NoteState
} from '@aura-note/domain';
import { canPerform, canViewTranscript, type AccessContext, type Role } from '@aura-note/security';

const TENANT_ID = 'tenant-synthetic-primary';
const SITE_ID = 'site-synthetic-primary';
const APP_MODE = 'standalone' as const;

interface StoredAppointment {
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
}

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
  private readonly appointments = new Map<string, StoredAppointment>();
  private readonly noteByAppointment = new Map<string, string>();
  private readonly idempotencyIndex = new Map<string, string>();

  listAppointments(context: RequestContext): ApiEnvelope<ScheduleViewDto> {
    if (!canPerform('schedule:view', context.access)) {
      throw new ForbiddenException('role cannot view schedule');
    }

    return createApiEnvelope(
      {
        appointments: [...this.appointments.values()].map((entry) => this.toScheduleCard(entry)),
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

    const existingAppointmentId = context.idempotencyKey ? this.idempotencyIndex.get(context.idempotencyKey) : undefined;
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
    if (this.noteByAppointment.has(appointmentId)) {
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

    this.appointments.set(appointmentId, { appointment, note, lifecycle });
    this.noteByAppointment.set(appointmentId, noteId);
    if (context.idempotencyKey) {
      this.idempotencyIndex.set(context.idempotencyKey, appointmentId);
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

    const notes = [...this.appointments.values()]
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
    if (!canPerform('final_note:view', this.createLinkedPatientContext(context.access))) {
      throw new ForbiddenException('role cannot view finalized notes');
    }

    const notes = [...this.appointments.values()]
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

  getFinalizedNote(noteId: string, context: RequestContext): ApiEnvelope<FinalizedNoteSummaryDto> {
    if (!canPerform('final_note:view', this.createLinkedPatientContext(context.access))) {
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
          transcriptAvailableForRole: false
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

    return createApiEnvelope(this.toFinalizedNoteSummary(stored, context.access), this.createMeta(context));
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
    if (!canPerform('transcript:view', this.createLinkedVisitContext(context.access))) {
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

  createRequestContext(headers: Record<string, string | string[] | undefined>): RequestContext {
    const roleHeader = this.headerValue(headers['x-aura-role']);
    const role = this.parseRole(roleHeader);
    const requestId = this.headerValue(headers['x-request-id']) ?? this.nextId('req');
    const traceId = this.headerValue(headers['x-trace-id']) ?? this.nextId('trace');
    const idempotencyKey = this.headerValue(headers['idempotency-key']);

    const context: RequestContext = {
      requestId,
      traceId,
      actorUserId: this.headerValue(headers['x-aura-user-id']) ?? `synthetic-${role}`,
      access: {
        role,
        linkedToPatient: role !== 'billing_staff',
        linkedToVisit: role === 'clinician',
        treatingClinician: role === 'clinician',
        billingReviewTriggered: false,
        authorizedAdmin: role === 'authorized_admin' || role === 'admin'
      }
    };

    if (idempotencyKey) {
      context.idempotencyKey = idempotencyKey;
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
      finalNoteApproved: false,
      patientSummaryApproved: false,
      readyForBillingAttest: false,
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
              readyForBillingAttest: finalization.readyForBillingAttest
            }
          })
        )
      },
      this.createMeta(context)
    );
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
    return {
      noteId: entry.note.noteId,
      appointmentId: entry.appointment.appointmentId,
      safePatientId: entry.appointment.safePatientId,
      clinicianId: entry.appointment.clinicianId,
      readOnly: true,
      finalNoteAvailable: entry.note.state === 'finalized',
      patientSummaryAvailable: entry.note.state === 'finalized',
      transcriptAvailableForRole: canViewTranscript(this.createLinkedVisitContext(access))
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
    const stored = this.appointments.get(appointmentId);
    if (!stored) {
      throw new NotFoundException('appointment not found');
    }
    return stored;
  }

  private getStoredByNoteId(noteId: string): StoredAppointment {
    const stored = [...this.appointments.values()].find((entry) => entry.note.noteId === noteId);
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

  private headerValue(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value;
  }

  private parseRole(value: string | undefined): Role {
    const allowedRoles: Role[] = [
      'clinician',
      'ma',
      'billing_staff',
      'admin',
      'authorized_admin',
      'clinic_manager',
      'compliance_privacy_lead',
      'support',
      'service_account'
    ];
    return allowedRoles.includes(value as Role) ? (value as Role) : 'clinician';
  }
}

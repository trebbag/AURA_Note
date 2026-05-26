import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  createApiEnvelope,
  createEventEnvelope,
  type ApiEnvelope,
  type AppointmentDto,
  type AuditEventDto,
  type CreateAppointmentRequestDto,
  type CreateAppointmentResponseDto,
  type DocumentationWorkspaceDto,
  type DraftNotesViewDto,
  type FinalizedNoteSummaryDto,
  type FinalizedNotesViewDto,
  type NoteDto,
  type ScheduleAppointmentDto,
  type ScheduleViewDto,
  type StartVisitResponseDto,
  type VisitSessionDto
} from '@aura-note/contracts';
import {
  canEditNote,
  canStartVisit,
  createAppointmentLifecycle,
  createAppointmentNoteInvariant,
  startVisitLifecycle,
  validateAppointmentDraft,
  type AppointmentLifecycle
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
    const visitSession: VisitSessionDto = {
      visitSessionId: this.nextId('visit-session'),
      noteId: stored.note.noteId,
      timerState: 'running',
      recordingState: 'recording',
      editorUnlocked: true
    };

    stored.lifecycle = lifecycle;
    stored.appointment = { ...stored.appointment, state: lifecycle.appointmentState };
    stored.note = { ...stored.note, state: lifecycle.noteState };
    stored.visitSession = visitSession;

    return createApiEnvelope(
      {
        appointment: stored.appointment,
        note: stored.note,
        visitSession,
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
        { panelId: 'visit_selections', label: 'Visit Selections', state: 'empty', itemCount: 0 },
        { panelId: 'suggestions', label: 'Suggestions', state: 'empty', itemCount: 0 },
        { panelId: 'transcript', label: 'Transcript', state: 'empty', itemCount: 0 },
        { panelId: 'compliance', label: 'Compliance & Quality Review', state: 'empty', itemCount: 0 },
        { panelId: 'history_gap', label: 'History Gap Review', state: 'empty', itemCount: 0 }
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

import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import {
  createApiEnvelope,
  createEventEnvelope,
  type ApiEnvelope,
  type AppointmentDto,
  type AuditEventDto,
  type CreateAppointmentRequestDto,
  type CreateAppointmentResponseDto,
  type NoteDto,
  type ScheduleAppointmentDto,
  type ScheduleViewDto,
  type StartVisitResponseDto,
  type VisitSessionDto
} from '@aura-note/contracts';
import {
  canStartVisit,
  createAppointmentLifecycle,
  createAppointmentNoteInvariant,
  startVisitLifecycle,
  validateAppointmentDraft,
  type AppointmentLifecycle
} from '@aura-note/domain';
import { canPerform, type AccessContext, type Role } from '@aura-note/security';

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

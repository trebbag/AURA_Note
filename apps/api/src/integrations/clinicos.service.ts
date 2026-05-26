import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import {
  CLINICOS_MOCK_MODE_SETTINGS,
  MockClinicOsAdapter,
  STANDALONE_MODE_SETTINGS,
  type AuraNoteHostMode,
  type ClinicOsModeContext,
  type ClinicOsPublishedEvent
} from '@aura-note/clinicos-adapter';
import {
  createApiEnvelope,
  createEventEnvelope,
  type ApiEnvelope,
  type ApiMeta,
  type AuditEventDto,
  type ClinicOsIntegrationStatusDto,
  type ClinicOsMapVisitRequestDto,
  type ClinicOsMapVisitResponseDto,
  type ClinicOsModeContextDto,
  type ClinicOsPublishedEventDto
} from '@aura-note/contracts';
import { canPerform, type AccessContext, type Role } from '@aura-note/security';

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
export class ClinicOsService {
  private sequence = 1;

  async getStatus(headers: Record<string, string | string[] | undefined>): Promise<ApiEnvelope<ClinicOsIntegrationStatusDto>> {
    const context = this.createRequestContext(headers);
    if (!canPerform('clinicos_adapter:view', context.access)) {
      throw new ForbiddenException('role cannot view ClinicOS adapter status');
    }

    const adapter = this.createAdapter(headers);
    const modeContext = await adapter.getModeContext();
    const status: ClinicOsIntegrationStatusDto = {
      modeContext: this.toModeContextDto(modeContext),
      mappings: await adapter.listMappings(),
      publishedEvents: await adapter.getPublishedEvents(),
      permissionsStillEnforcedByAuraNote: true,
      auditEvent: this.createAuditEvent('clinicos.status', 'ClinicOsAdapter', modeContext.hostMode, context),
      domainEvents: [
        createEventEnvelope({
          eventId: this.nextId('evt'),
          eventType: modeContext.availability === 'unavailable' ? 'clinicos.unavailable.v1' : 'clinicos.mode_resolved.v1',
          tenantId: TENANT_ID,
          siteId: SITE_ID,
          producer: 'aura-note-api',
          traceId: context.traceId,
          idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
          sensitivity: 'restricted',
          retentionClass: 'audit',
          payload: {
            hostMode: modeContext.hostMode,
            enabled: modeContext.enabled,
            availability: modeContext.availability,
            permissionsStillEnforcedByAuraNote: true
          }
        })
      ]
    };

    return createApiEnvelope(status, this.createMeta(context));
  }

  async mapVisit(
    body: ClinicOsMapVisitRequestDto,
    headers: Record<string, string | string[] | undefined>
  ): Promise<ApiEnvelope<ClinicOsMapVisitResponseDto>> {
    const context = this.createRequestContext(headers);
    if (!canPerform('clinicos_mapping:write', context.access)) {
      throw new ForbiddenException('role cannot record ClinicOS mappings');
    }
    if (!body.localAppointmentId?.trim() || !body.localNoteId?.trim()) {
      throw new BadRequestException('localAppointmentId and localNoteId are required');
    }

    const adapter = this.createAdapter(headers);
    const modeContext = await adapter.getModeContext();
    const mapped = await adapter.mapVisitContext({
      localAppointmentId: body.localAppointmentId,
      localNoteId: body.localNoteId
    });
    const publishedEvent = await adapter.publishAuraNoteEvent({ eventType: 'visit.started.v1' });

    return createApiEnvelope(
      {
        modeContext: this.toModeContextDto(modeContext),
        ...(mapped.visitGraphId ? { visitGraphId: mapped.visitGraphId } : {}),
        ...(mapped.m17ContextId ? { m17ContextId: mapped.m17ContextId } : {}),
        mappings: mapped.mappings,
        publishedEvent: this.toPublishedEventDto(publishedEvent),
        auditEvent: this.createAuditEvent('clinicos.map_visit', 'ClinicOsAdapter', body.localAppointmentId, context),
        domainEvents: [
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType: mapped.mappings.length > 0 ? 'clinicos.mapping_recorded.v1' : 'clinicos.unavailable.v1',
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'restricted',
            retentionClass: 'audit',
            payload: {
              localAppointmentId: body.localAppointmentId,
              localNoteId: body.localNoteId,
              mappingCount: mapped.mappings.length,
              hostMode: modeContext.hostMode,
              availability: modeContext.availability
            }
          }),
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType: 'clinicos.event_published.v1',
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'restricted',
            retentionClass: 'audit',
            payload: {
              eventType: publishedEvent.eventType,
              targetModules: publishedEvent.targetModules,
              outboxStatus: publishedEvent.status
            }
          })
        ]
      },
      this.createMeta(context)
    );
  }

  private createAdapter(headers: Record<string, string | string[] | undefined>): MockClinicOsAdapter {
    const hostMode = this.parseHostMode(this.headerValue(headers['x-aura-clinicos-mode']));
    const enabled = hostMode !== 'standalone';
    const unavailable = this.parseBooleanHeader(this.headerValue(headers['x-aura-clinicos-unavailable'])) ?? false;
    return new MockClinicOsAdapter({
      ...(enabled ? CLINICOS_MOCK_MODE_SETTINGS : STANDALONE_MODE_SETTINGS),
      hostMode,
      enabled,
      unavailable,
      tenantId: TENANT_ID,
      siteId: SITE_ID
    });
  }

  private toModeContextDto(modeContext: ClinicOsModeContext): ClinicOsModeContextDto {
    return {
      enabled: modeContext.enabled,
      hostMode: modeContext.hostMode,
      tenantId: modeContext.tenantId,
      siteId: modeContext.siteId,
      availability: modeContext.availability,
      ...(modeContext.visitGraphId ? { visitGraphId: modeContext.visitGraphId } : {}),
      ...(modeContext.workOsQueueId ? { workOsQueueId: modeContext.workOsQueueId } : {}),
      ...(modeContext.npCockpitContextId ? { npCockpitContextId: modeContext.npCockpitContextId } : {}),
      ...(modeContext.chargeIntegrityContextId ? { chargeIntegrityContextId: modeContext.chargeIntegrityContextId } : {}),
      ...(modeContext.copilotRuntimeContextId ? { copilotRuntimeContextId: modeContext.copilotRuntimeContextId } : {}),
      ...(modeContext.governanceContextId ? { governanceContextId: modeContext.governanceContextId } : {}),
      ...(modeContext.integrationHubContextId ? { integrationHubContextId: modeContext.integrationHubContextId } : {}),
      ...(modeContext.dataCloudContextId ? { dataCloudContextId: modeContext.dataCloudContextId } : {}),
      warnings: modeContext.warnings
    };
  }

  private toPublishedEventDto(event: ClinicOsPublishedEvent): ClinicOsPublishedEventDto {
    return {
      outboxId: event.outboxId,
      tenantId: event.tenantId,
      siteId: event.siteId,
      eventType: event.eventType,
      targetModules: event.targetModules,
      status: event.status,
      createdAt: event.createdAt
    };
  }

  createRequestContext(headers: Record<string, string | string[] | undefined>): RequestContext {
    const roleHeader = this.headerValue(headers['x-aura-role']);
    const role = this.parseRole(roleHeader);
    const requestId = this.headerValue(headers['x-request-id']) ?? this.nextId('req');
    const traceId = this.headerValue(headers['x-trace-id']) ?? this.nextId('trace');
    const idempotencyKey = this.headerValue(headers['idempotency-key']);
    const linkedToPatient =
      this.parseBooleanHeader(this.headerValue(headers['x-aura-linked-patient'])) ?? role !== 'billing_staff';
    const linkedToVisit = this.parseBooleanHeader(this.headerValue(headers['x-aura-linked-visit'])) ?? role === 'clinician';
    const billingReviewTriggered =
      this.parseBooleanHeader(this.headerValue(headers['x-aura-billing-review-triggered'])) ?? false;

    const requestContext: RequestContext = {
      requestId,
      traceId,
      actorUserId: this.headerValue(headers['x-aura-user-id']) ?? `synthetic-${role}`,
      access: {
        role,
        linkedToPatient,
        linkedToVisit,
        treatingClinician: role === 'clinician' && linkedToVisit,
        billingReviewTriggered,
        authorizedAdmin: role === 'authorized_admin' || role === 'admin'
      }
    };

    if (idempotencyKey) {
      requestContext.idempotencyKey = idempotencyKey;
    }

    return requestContext;
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

  private createMeta(context: RequestContext): ApiMeta {
    return {
      requestId: context.requestId,
      traceId: context.traceId,
      mode: APP_MODE,
      generatedAt: new Date().toISOString()
    };
  }

  private headerValue(value: string | string[] | undefined): string | undefined {
    return Array.isArray(value) ? value[0] : value;
  }

  private parseHostMode(value: string | undefined): AuraNoteHostMode {
    switch (value) {
      case 'clinicos_integrated':
      case 'ehr_embedded':
      case 'hybrid_transition':
      case 'standalone':
        return value;
      default:
        return 'standalone';
    }
  }

  private parseRole(value: string | undefined): Role {
    switch (value) {
      case 'ma':
      case 'billing_staff':
      case 'admin':
      case 'authorized_admin':
      case 'clinic_manager':
      case 'compliance_privacy_lead':
      case 'support':
      case 'service_account':
        return value;
      default:
        return 'clinician';
    }
  }

  private parseBooleanHeader(value: string | undefined): boolean | undefined {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  }

  private nextId(prefix: string): string {
    const id = `${prefix}-${this.sequence.toString().padStart(4, '0')}`;
    this.sequence += 1;
    return id;
  }
}

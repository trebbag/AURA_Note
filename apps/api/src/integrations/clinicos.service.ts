import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import {
  MockClinicOsAdapter,
  type ClinicOsModuleBoundary,
  type ClinicOsMappingRecord,
  type ClinicOsModeContext,
  type ClinicOsPublishedEvent,
} from '@aura-note/clinicos-adapter';
import {
  createApiEnvelope,
  createEventEnvelope,
  type AuraModeAdapterBoundaryDto,
  type ApiEnvelope,
  type ApiMeta,
  type AuditEventDto,
  type ClinicOsEventPublishRequestDto,
  type ClinicOsEventPublishResponseDto,
  type ClinicOsIntegrationStatusDto,
  type ClinicOsMappingRecordDto,
  type ClinicOsMappingUpsertRequestDto,
  type ClinicOsMappingUpsertResponseDto,
  type ClinicOsMapVisitRequestDto,
  type ClinicOsMapVisitResponseDto,
  type ClinicOsModeContextDto,
  type ClinicOsModuleBoundaryDto,
  type ClinicOsPublishedEventDto
} from '@aura-note/contracts';
import { canPerform, createSyntheticLocalSession, type AccessContext } from '@aura-note/security';
import { resolveAuraRuntimeModeFromHeaders, type AuraModeAdapterBoundary, type AuraRuntimeModeResolution } from '../runtime/mode-resolver';

const TENANT_ID = 'tenant-synthetic-primary';
const SITE_ID = 'site-synthetic-primary';
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
  private readonly mappingRecords: ClinicOsMappingRecordDto[] = [
    {
      mappingId: 'clinicos-map-active-m03-001',
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      localObjectType: 'appointment',
      localObjectId: 'appt-demo-001',
      clinicosModuleId: 'M03',
      clinicosObjectId: 'clinicos-m03-visitgraph-synthetic-001',
      sourceOfTruth: 'clinicos',
      status: 'active',
      traceId: 'trace-clinicos-seed-active',
      lastCheckedAt: '2026-05-28T00:00:00.000Z',
      lastPublishedAt: '2026-05-28T00:01:00.000Z',
      createdAt: '2026-05-28T00:00:00.000Z'
    },
    {
      mappingId: 'clinicos-map-stale-m04-001',
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      localObjectType: 'task',
      localObjectId: 'task-ma-follow-up-001',
      clinicosModuleId: 'M04',
      clinicosObjectId: 'clinicos-m04-task-stale-synthetic-001',
      sourceOfTruth: 'clinicos',
      status: 'stale',
      staleReason: 'Last ClinicOS task projection is older than the local blocker task state.',
      traceId: 'trace-clinicos-seed-stale',
      lastCheckedAt: '2026-05-28T00:00:00.000Z',
      createdAt: '2026-05-28T00:00:00.000Z'
    },
    {
      mappingId: 'clinicos-map-degraded-m25-001',
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      localObjectType: 'event',
      localObjectId: 'ehr-wb-pending-001',
      clinicosModuleId: 'M25',
      clinicosObjectId: 'clinicos-m25-writeback-degraded-synthetic-001',
      sourceOfTruth: 'hybrid',
      status: 'degraded',
      degradedReason: 'Integration Hub delegation is metadata-only; live writeback routing remains disabled.',
      traceId: 'trace-clinicos-seed-degraded',
      lastCheckedAt: '2026-05-28T00:00:00.000Z',
      createdAt: '2026-05-28T00:00:00.000Z'
    }
  ];
  private readonly publishedEvents: ClinicOsPublishedEventDto[] = [
    {
      outboxId: 'clinicos-outbox-skipped-001',
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      eventType: 'note.signed.v1',
      targetModules: ['M17'],
      status: 'skipped_disabled',
      payloadStored: false,
      permissionBoundaryEnforced: true,
      createdAt: '2026-05-28T00:00:00.000Z'
    },
    {
      outboxId: 'clinicos-outbox-failed-001',
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      eventType: 'ehr.writeback_approval_recorded.v1',
      targetModules: ['M25'],
      status: 'failed_unavailable',
      payloadStored: false,
      permissionBoundaryEnforced: true,
      failedReason: 'ClinicOS mock adapter unavailable; no payload was stored or delivered.',
      createdAt: '2026-05-28T00:00:00.000Z'
    }
  ];

  async getStatus(headers: Record<string, string | string[] | undefined>): Promise<ApiEnvelope<ClinicOsIntegrationStatusDto>> {
    const context = this.createRequestContext(headers);
    if (!canPerform('clinicos_adapter:view', context.access)) {
      throw new ForbiddenException('role cannot view ClinicOS adapter status');
    }

    const runtime = this.resolveRuntime(headers);
    const adapter = this.createAdapter(runtime);
    const modeContext = await adapter.getModeContext();
    const moduleBoundaries = this.toModuleBoundaryDtos(runtime.clinicOsModuleBoundaries);
    const status: ClinicOsIntegrationStatusDto = {
      modeContext: this.toModeContextDto(modeContext),
      moduleBoundaries,
      modeAdapterBoundaries: this.toModeAdapterBoundaryDtos(runtime.adapterBoundaries),
      mappings: this.projectMappingsForContext(modeContext),
      publishedEvents: this.projectPublishedEventsForContext(modeContext),
      permissionsStillEnforcedByAuraNote: true,
      rawPayloadsStored: false,
      liveClinicOsSyncEnabled: false,
      states: [
        'empty',
        'loading',
        'ready',
        'saving',
        'degraded',
        'failed',
        'permission-denied',
        'disabled',
        'stale-mapping',
        'read-only',
        'demo-fixture'
      ],
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
            permissionsStillEnforcedByAuraNote: true,
            modeAdapterBoundaryCount: runtime.adapterBoundaries.length,
            liveDelegationEnabled: false,
            rawPayloadStorageEnabled: false
          }
        })
      ]
    };

    return createApiEnvelope(status, this.createMeta(context, runtime));
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

    const runtime = this.resolveRuntime(headers);
    const adapter = this.createAdapter(runtime);
    const modeContext = await adapter.getModeContext();
    const mapped = await adapter.mapVisitContext({
      localAppointmentId: body.localAppointmentId,
      localNoteId: body.localNoteId
    });
    const publishedEvent = await adapter.publishAuraNoteEvent({ eventType: 'visit.started.v1' });
    this.mappingRecords.push(...mapped.mappings.map((mapping) => this.toMappingRecordDto(mapping)));
    this.publishedEvents.push(this.toPublishedEventDto(publishedEvent));

    return createApiEnvelope(
      {
        modeContext: this.toModeContextDto(modeContext),
        modeAdapterBoundaries: this.toModeAdapterBoundaryDtos(runtime.adapterBoundaries),
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
              availability: modeContext.availability,
              modeAdapterBoundaryCount: runtime.adapterBoundaries.length,
              liveDelegationEnabled: false,
              rawPayloadStorageEnabled: false
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
              outboxStatus: publishedEvent.status,
              permissionsStillEnforcedByAuraNote: true
            }
          })
        ]
      },
      this.createMeta(context, runtime)
    );
  }

  async upsertMapping(
    body: ClinicOsMappingUpsertRequestDto,
    headers: Record<string, string | string[] | undefined>
  ): Promise<ApiEnvelope<ClinicOsMappingUpsertResponseDto>> {
    const context = this.createRequestContext(headers);
    if (!canPerform('clinicos_mapping:write', context.access)) {
      throw new ForbiddenException('role cannot record ClinicOS mappings');
    }
    if (!body.localObjectType || !body.localObjectId?.trim() || !body.clinicosModuleId) {
      throw new BadRequestException('localObjectType, localObjectId, and clinicosModuleId are required');
    }

    const runtime = this.resolveRuntime(headers);
    const modeContext = await this.createAdapter(runtime).getModeContext();
    const now = new Date().toISOString();
    const status = body.status ?? (modeContext.availability === 'available' ? 'active' : 'unavailable');
    const mapping: ClinicOsMappingRecordDto = {
      mappingId: this.nextId('clinicos-map'),
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      localObjectType: body.localObjectType,
      localObjectId: body.localObjectId,
      clinicosModuleId: body.clinicosModuleId,
      clinicosObjectId: body.clinicosObjectId ?? `clinicos-${body.clinicosModuleId.toLowerCase()}-${body.localObjectId}`,
      sourceOfTruth: body.sourceOfTruth ?? (modeContext.enabled ? 'clinicos' : 'aura_note'),
      status,
      ...(status === 'stale' ? { staleReason: body.reason ?? 'Mapping review flagged the ClinicOS reference as stale.' } : {}),
      ...(status === 'degraded' ? { degradedReason: body.reason ?? 'Mapping is metadata-only while ClinicOS live sync is disabled.' } : {}),
      traceId: context.traceId,
      lastCheckedAt: now,
      createdAt: now
    };
    this.mappingRecords.push(mapping);

    const eventType = status === 'stale' ? 'clinicos.mapping_stale_detected.v1' : 'clinicos.mapping_recorded.v1';
    return createApiEnvelope(
      {
        modeContext: this.toModeContextDto(modeContext),
        modeAdapterBoundaries: this.toModeAdapterBoundaryDtos(runtime.adapterBoundaries),
        mapping,
        auditEvent: this.createAuditEvent('clinicos.mapping_upsert', 'ClinicOsModeMapping', mapping.mappingId, context),
        domainEvents: [
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType,
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'restricted',
            retentionClass: 'audit',
            payload: {
              mappingId: mapping.mappingId,
              moduleId: mapping.clinicosModuleId,
              status: mapping.status,
              payloadStored: false,
              permissionsStillEnforcedByAuraNote: true,
              modeAdapterBoundaryCount: runtime.adapterBoundaries.length
            }
          })
        ]
      },
      this.createMeta(context, runtime)
    );
  }

  async publishEvent(
    body: ClinicOsEventPublishRequestDto,
    headers: Record<string, string | string[] | undefined>
  ): Promise<ApiEnvelope<ClinicOsEventPublishResponseDto>> {
    const context = this.createRequestContext(headers);
    if (!canPerform('clinicos_mapping:write', context.access)) {
      throw new ForbiddenException('role cannot publish ClinicOS event metadata');
    }
    if (!body.eventType?.trim()) {
      throw new BadRequestException('eventType is required');
    }

    const runtime = this.resolveRuntime(headers);
    const adapter = this.createAdapter(runtime);
    const modeContext = await adapter.getModeContext();
    const published = this.toPublishedEventDto(await adapter.publishAuraNoteEvent({ eventType: body.eventType }));
    const overridden: ClinicOsPublishedEventDto = {
      ...published,
      ...(body.targetModules ? { targetModules: body.targetModules } : {})
    };
    this.publishedEvents.push(overridden);

    const eventType =
      overridden.status === 'failed_unavailable' || overridden.status === 'degraded'
        ? 'clinicos.event_publication_failed.v1'
        : 'clinicos.event_published.v1';

    return createApiEnvelope(
      {
        modeContext: this.toModeContextDto(modeContext),
        modeAdapterBoundaries: this.toModeAdapterBoundaryDtos(runtime.adapterBoundaries),
        publishedEvent: overridden,
        auditEvent: this.createAuditEvent('clinicos.event_publish', 'ClinicOsOutbox', overridden.outboxId, context),
        domainEvents: [
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType,
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'restricted',
            retentionClass: 'audit',
            payload: {
              sourceEventType: body.eventType,
              targetModules: overridden.targetModules,
              outboxStatus: overridden.status,
              payloadStored: false,
              permissionsStillEnforcedByAuraNote: true,
              modeAdapterBoundaryCount: runtime.adapterBoundaries.length,
              liveDelegationEnabled: false
            }
          })
        ]
      },
      this.createMeta(context, runtime)
    );
  }

  private resolveRuntime(headers: Record<string, string | string[] | undefined>): AuraRuntimeModeResolution {
    return resolveAuraRuntimeModeFromHeaders(headers, {
      tenantId: TENANT_ID,
      siteId: SITE_ID
    });
  }

  private createAdapter(runtime: AuraRuntimeModeResolution): MockClinicOsAdapter {
    return new MockClinicOsAdapter(runtime.adapterSettings);
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
      payloadStored: event.payloadStored,
      permissionBoundaryEnforced: event.permissionBoundaryEnforced,
      ...(event.degradedReason ? { degradedReason: event.degradedReason } : {}),
      ...(event.failedReason ? { failedReason: event.failedReason } : {}),
      createdAt: event.createdAt
    };
  }

  private toMappingRecordDto(mapping: ClinicOsMappingRecord): ClinicOsMappingRecordDto {
    return {
      mappingId: mapping.mappingId,
      tenantId: mapping.tenantId,
      siteId: mapping.siteId,
      localObjectType: mapping.localObjectType,
      localObjectId: mapping.localObjectId,
      clinicosModuleId: mapping.clinicosModuleId,
      clinicosObjectId: mapping.clinicosObjectId,
      sourceOfTruth: mapping.sourceOfTruth,
      status: mapping.status,
      ...(mapping.staleReason ? { staleReason: mapping.staleReason } : {}),
      ...(mapping.degradedReason ? { degradedReason: mapping.degradedReason } : {}),
      traceId: mapping.traceId,
      lastCheckedAt: mapping.lastCheckedAt,
      ...(mapping.lastPublishedAt ? { lastPublishedAt: mapping.lastPublishedAt } : {}),
      createdAt: mapping.createdAt
    };
  }

  private toModuleBoundaryDtos(boundaries: ClinicOsModuleBoundary[]): ClinicOsModuleBoundaryDto[] {
    return boundaries.map((boundary) => ({
      moduleId: boundary.moduleId,
      moduleName: boundary.moduleName,
      maps: boundary.maps,
      sourceOfTruth: boundary.sourceOfTruth,
      delegationEnabled: boundary.delegationEnabled,
      permissionBoundary: boundary.permissionBoundary
    }));
  }

  private toModeAdapterBoundaryDtos(boundaries: AuraModeAdapterBoundary[]): AuraModeAdapterBoundaryDto[] {
    return boundaries.map((boundary) => ({
      seam: boundary.seam,
      displayName: boundary.displayName,
      sourceOfTruth: boundary.sourceOfTruth,
      adapterStatus: boundary.adapterStatus,
      permissionBoundary: boundary.permissionBoundary,
      liveDelegationEnabled: boundary.liveDelegationEnabled,
      rawPayloadStorageEnabled: boundary.rawPayloadStorageEnabled,
      humanReviewRequired: boundary.humanReviewRequired,
      writesFailClosed: boundary.writesFailClosed,
      notes: boundary.notes,
      ...(boundary.clinicOsModuleId ? { clinicOsModuleId: boundary.clinicOsModuleId } : {})
    }));
  }

  private projectMappingsForContext(modeContext: ClinicOsModeContext): ClinicOsMappingRecordDto[] {
    if (!modeContext.enabled) {
      return this.mappingRecords.map((mapping) => ({ ...mapping, status: 'unavailable', degradedReason: 'ClinicOS disabled; standalone mode is authoritative.' }));
    }
    if (modeContext.availability === 'unavailable') {
      return this.mappingRecords.map((mapping) => ({ ...mapping, status: mapping.status === 'active' ? 'unavailable' : mapping.status }));
    }
    return [...this.mappingRecords];
  }

  private projectPublishedEventsForContext(modeContext: ClinicOsModeContext): ClinicOsPublishedEventDto[] {
    if (modeContext.enabled) return [...this.publishedEvents];
    return this.publishedEvents.map((event) => ({ ...event, status: 'skipped_disabled' }));
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

    const requestContext: RequestContext = {
      requestId: session.requestId,
      traceId: session.traceId,
      actorUserId: session.actorUserId,
      access: session.access
    };

    if (session.idempotencyKey) {
      requestContext.idempotencyKey = session.idempotencyKey;
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

  private createMeta(context: RequestContext, runtime?: AuraRuntimeModeResolution): ApiMeta {
    return {
      requestId: context.requestId,
      traceId: context.traceId,
      mode: runtime?.apiMode ?? 'standalone',
      generatedAt: new Date().toISOString()
    };
  }

  private nextId(prefix: string): string {
    const id = `${prefix}-${this.sequence.toString().padStart(4, '0')}`;
    this.sequence += 1;
    return id;
  }
}

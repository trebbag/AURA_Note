import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import {
  createEhrAdapter,
  validateChartContextPackage,
  type ChartContextPackage,
  type ChartContextSliceType,
  type EhrAdapter,
  type EhrAdapterMode,
  type EhrVendor
} from '@aura-note/ehr-adapters';
import {
  createApiEnvelope,
  createEventEnvelope,
  type ApiEnvelope,
  type ApiMeta,
  type AuditEventDto,
  type EhrChartContextPackageDto,
  type EhrChartContextResponseDto,
  type EhrChartContextSliceTypeDto,
  type EhrIntegrationStatusDto,
  type EhrWritebackQueueActionRequestDto,
  type EhrWritebackQueueActionResponseDto,
  type EhrWritebackQueueItemDto,
  type EhrWritebackQueueResponseDto,
  type EhrWritebackTarget
} from '@aura-note/contracts';
import { canPerform, createSyntheticLocalSession, scanForForbiddenPhiKeys, scanForForbiddenPhiText, type AccessContext } from '@aura-note/security';

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
export class EhrService {
  private sequence = 1;
  private readonly writebackJobs = new Map<string, EhrWritebackQueueItemDto>();
  private readonly idempotencyReplay = new Map<string, EhrWritebackQueueItemDto>();

  async getStatus(headers: Record<string, string | string[] | undefined>): Promise<ApiEnvelope<EhrIntegrationStatusDto>> {
    const context = this.createRequestContext(headers);
    if (!canPerform('ehr_adapter:view', context.access)) {
      throw new ForbiddenException('role cannot view EHR adapter status');
    }

    const adapter = this.createAdapter(headers);
    const health = await adapter.healthCheck();
    const status: EhrIntegrationStatusDto = {
      status: health.status,
      capabilities: health.capabilities,
      checkedAt: health.checkedAt,
      standaloneSafe: true,
      auditEvent: this.createAuditEvent('ehr.status_check', 'EhrAdapter', health.status.vendor, context),
      domainEvents: [
        createEventEnvelope({
          eventId: this.nextId('evt'),
          eventType: 'ehr.adapter_status_checked.v1',
          tenantId: TENANT_ID,
          siteId: SITE_ID,
          producer: 'aura-note-api',
          traceId: context.traceId,
          idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
          sensitivity: 'restricted',
          retentionClass: 'audit',
          payload: {
            vendor: health.status.vendor,
            mode: health.status.mode,
            health: health.status.health,
            connected: health.status.connected,
            standaloneSafe: true
          }
        })
      ]
    };

    return createApiEnvelope(status, this.createMeta(context));
  }

  async getChartContext(
    safePatientId: string,
    externalEncounterId: string,
    slices: string | undefined,
    headers: Record<string, string | string[] | undefined>
  ): Promise<ApiEnvelope<EhrChartContextResponseDto>> {
    const context = this.createRequestContext(headers);
    if (!canPerform('ehr_chart_context:view', context.access)) {
      throw new ForbiddenException('role cannot view EHR chart context');
    }

    const adapter = this.createAdapter(headers);
    const requestedSlices = this.parseSlices(slices);
    const externalPatientRef =
      this.headerValue(headers['x-aura-external-patient-ref']) ?? `${adapter.vendor}-patient-ref-synthetic-001`;
    const chartContext = await adapter.getChartContext({
      safePatientId,
      externalPatientRef,
      externalEncounterId,
      requestedSlices
    });
    const validationErrors = validateChartContextPackage(chartContext);
    const auditEvent = this.createAuditEvent('ehr.chart_context_loaded', 'EhrAdapter', externalEncounterId, context);

    return createApiEnvelope(
      {
        chartContext: this.toChartContextDto(chartContext),
        auditEvent,
        domainEvents: [
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType: 'ehr.chart_context_loaded.v1',
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'restricted',
            retentionClass: 'audit',
            payload: {
              vendor: chartContext.sourceSystem,
              chartContextPackageId: chartContext.chartContextPackageId,
              externalEncounterId: chartContext.externalEncounterId,
              requestedSlices: chartContext.requestedSlices,
              sliceCount: chartContext.slices.length,
              staleSliceCount: chartContext.staleSliceCount,
              validationErrors
            }
          })
        ]
      },
      this.createMeta(context),
      validationErrors.map((message) => ({ code: 'EHR_CHART_CONTEXT_VALIDATION', message, severity: 'warning' as const }))
    );
  }

  async listWritebackQueue(headers: Record<string, string | string[] | undefined>): Promise<ApiEnvelope<EhrWritebackQueueResponseDto>> {
    const context = this.createRequestContext(headers);
    if (!canPerform('ehr_writeback:view', context.access)) {
      throw new ForbiddenException('role cannot view EHR writeback queue');
    }

    this.ensureSeedWritebackJobs(context);
    const adapter = this.createAdapter(headers);
    const health = await adapter.healthCheck();
    const items = [...this.writebackJobs.values()].map((job) => this.projectJobForRole(job, context));

    return createApiEnvelope(
      {
        queue: {
          items,
          sandboxMode: health.status.mode === 'production' ? 'sandbox' : health.status.mode,
          liveProductionWritebackEnabled: false,
          payloadsExcluded: true,
          states: ['disabled', 'pending_approval', 'approved', 'queued', 'retrying', 'failed', 'dead_lettered', 'reconciled'],
          warnings: [
            'Writeback queue contains audit-safe metadata only.',
            'Live production EHR delivery remains disabled until a later approved work order.'
          ]
        },
        auditEvent: this.createAuditEvent('ehr.writeback_queue_viewed', 'EhrWritebackQueue', 'synthetic-ehr-writeback-queue', context),
        domainEvents: [
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType: 'ehr.adapter_status_checked.v1',
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'restricted',
            retentionClass: 'audit',
            payload: {
              queueItemCount: items.length,
              payloadsExcluded: true,
              liveProductionWritebackEnabled: false,
              vendor: health.status.vendor,
              mode: health.status.mode
            }
          })
        ]
      },
      this.createMeta(context)
    );
  }

  async actOnWritebackJob(
    writebackJobId: string,
    body: EhrWritebackQueueActionRequestDto,
    headers: Record<string, string | string[] | undefined>
  ): Promise<ApiEnvelope<EhrWritebackQueueActionResponseDto>> {
    const context = this.createRequestContext(headers);
    this.validateWritebackActionRequest(body);

    const requiredPermission = body.action === 'approve' ? 'ehr_writeback:approve' : 'ehr_writeback:manage';
    if (!canPerform(requiredPermission, context.access)) {
      throw new ForbiddenException('role cannot update EHR writeback queue');
    }

    this.ensureSeedWritebackJobs(context);
    const replayKey = context.idempotencyKey ? `${body.action}:${writebackJobId}:${context.idempotencyKey}` : undefined;
    const replayed = replayKey ? this.idempotencyReplay.get(replayKey) : undefined;
    if (replayed) {
      return this.writebackActionEnvelope(replayed, body.action, context, true);
    }

    const existing = this.writebackJobs.get(writebackJobId);
    if (!existing) {
      throw new BadRequestException('writeback job does not exist in synthetic queue');
    }

    const now = new Date().toISOString();
    const updated = this.applyWritebackAction(existing, body, context, now);
    this.writebackJobs.set(writebackJobId, updated);
    if (replayKey) {
      this.idempotencyReplay.set(replayKey, updated);
    }

    return this.writebackActionEnvelope(updated, body.action, context, false);
  }

  private validateWritebackActionRequest(body: EhrWritebackQueueActionRequestDto): void {
    if (!body || !['approve', 'retry', 'dead_letter', 'reconcile'].includes(body.action)) {
      throw new BadRequestException('EHR writeback action is not supported');
    }
    if (body.action === 'approve' && !body.approvalId) {
      throw new BadRequestException('approvalId is required before EHR writeback approval');
    }
    if (body.action === 'reconcile' && !body.reconciliationId) {
      throw new BadRequestException('reconciliationId is required for reconciliation evidence');
    }
    const phiKeyScan = scanForForbiddenPhiKeys(body);
    const phiTextScan = scanForForbiddenPhiText(body);
    if (phiKeyScan.containsForbiddenPhi || phiTextScan.containsForbiddenPhiText) {
      throw new BadRequestException('EHR writeback evidence must not contain PHI');
    }
  }

  private applyWritebackAction(
    existing: EhrWritebackQueueItemDto,
    body: EhrWritebackQueueActionRequestDto,
    context: RequestContext,
    now: string
  ): EhrWritebackQueueItemDto {
    switch (body.action) {
      case 'approve': {
        const { failureReason: _failureReason, ...base } = existing;
        const approvalId = body.approvalId;
        if (!approvalId) {
          throw new BadRequestException('approvalId is required before EHR writeback approval');
        }
        return {
          ...base,
          status: existing.configured ? 'approved' : 'pending_approval',
          humanApproved: true,
          approvedAt: now,
          approvedBy: context.actorUserId,
          approvalId,
          ...(existing.configured ? {} : { failureReason: 'Sandbox credentials are not configured; approval recorded without delivery.' })
        };
      }
      case 'retry': {
        const { failureReason: _failureReason, nextRetryAt: _nextRetryAt, ...base } = existing;
        return {
          ...base,
          status: existing.configured ? 'retrying' : 'failed',
          retryable: existing.configured,
          retryCount: existing.retryCount + 1,
          lastAttemptAt: now,
          ...(existing.configured
            ? { nextRetryAt: new Date(Date.parse(now) + 15 * 60 * 1000).toISOString() }
            : { failureReason: 'Retry blocked because EHR sandbox credentials are not configured.' })
        };
      }
      case 'dead_letter':
        return {
          ...existing,
          status: 'dead_lettered',
          retryable: false,
          deadLetteredAt: now,
          deadLetterReason: body.reason ?? 'Synthetic dead-letter evidence recorded after retry review.'
        };
      case 'reconcile': {
        const reconciliationId = body.reconciliationId;
        if (!reconciliationId) {
          throw new BadRequestException('reconciliationId is required for reconciliation evidence');
        }
        return {
          ...existing,
          status: 'reconciled',
          retryable: false,
          reconciliationId,
          reconciledAt: now,
          externalJobId: existing.externalJobId ?? `sandbox-reconcile-${existing.writebackJobId}`
        };
      }
    }
  }

  private writebackActionEnvelope(
    writeback: EhrWritebackQueueItemDto,
    action: EhrWritebackQueueActionRequestDto['action'],
    context: RequestContext,
    replayed: boolean
  ): ApiEnvelope<EhrWritebackQueueActionResponseDto> {
    const eventType = this.eventTypeForWritebackAction(action, writeback);
    return createApiEnvelope(
      {
        writeback: this.projectJobForRole(writeback, context),
        auditEvent: this.createAuditEvent(`ehr.writeback_${action}`, 'EhrWritebackJob', writeback.writebackJobId, context),
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
              writebackJobId: writeback.writebackJobId,
              noteId: writeback.noteId,
              target: writeback.target,
              vendor: writeback.vendor,
              status: writeback.status,
              humanApproved: writeback.humanApproved,
              retryCount: writeback.retryCount,
              liveDeliveryEnabled: false,
              payloadStored: false,
              replayed
            }
          })
        ]
      },
      this.createMeta(context)
    );
  }

  private eventTypeForWritebackAction(
    action: EhrWritebackQueueActionRequestDto['action'],
    writeback: EhrWritebackQueueItemDto
  ) {
    if (writeback.status === 'disabled') return 'ehr.writeback_disabled.v1' as const;
    switch (action) {
      case 'approve':
        return 'ehr.writeback_approval_recorded.v1' as const;
      case 'retry':
        return 'ehr.writeback_retry_scheduled.v1' as const;
      case 'dead_letter':
        return 'ehr.writeback_dead_lettered.v1' as const;
      case 'reconcile':
        return 'ehr.writeback_reconciliation_checked.v1' as const;
    }
  }

  private ensureSeedWritebackJobs(context: RequestContext): void {
    if (this.writebackJobs.size > 0) {
      return;
    }
    const now = new Date().toISOString();
    const seed = [
      this.createQueueJob('ehr-wb-disabled-001', 'note-demo-finalized-001', 'final_note', 'disabled', false, false, false, context.traceId, now),
      this.createQueueJob('ehr-wb-pending-001', 'note-demo-finalized-001', 'final_note', 'pending_approval', true, false, true, context.traceId, now),
      this.createQueueJob('ehr-wb-failed-001', 'note-demo-finalized-001', 'patient_summary', 'failed', true, true, true, context.traceId, now)
    ];
    for (const job of seed) {
      this.writebackJobs.set(job.writebackJobId, job);
    }
  }

  private createQueueJob(
    writebackJobId: string,
    noteId: string,
    target: EhrWritebackTarget,
    status: EhrWritebackQueueItemDto['status'],
    configured: boolean,
    humanApproved: boolean,
    retryable: boolean,
    traceId: string,
    now: string
  ): EhrWritebackQueueItemDto {
    return {
      writebackJobId,
      noteId,
      target,
      vendor: 'athenahealth',
      externalEncounterId: 'athena-encounter-synthetic-001',
      status,
      configured,
      humanApproved,
      liveDeliveryEnabled: false,
      retryable,
      retryCount: status === 'failed' ? 1 : 0,
      maxRetries: 3,
      idempotencyKey: `idem-${writebackJobId}`,
      traceId,
      auditSafe: true,
      payloadStored: false,
      ...(status === 'pending_approval' || status === 'failed' ? { queuedAt: now } : {}),
      ...(status === 'failed'
        ? {
            failedAt: now,
            failureReason: 'Synthetic sandbox writeback failure awaiting retry or dead-letter review.'
          }
        : {})
    };
  }

  private projectJobForRole(job: EhrWritebackQueueItemDto, context: RequestContext): EhrWritebackQueueItemDto {
    if (context.access.role === 'support') {
      const metadataOnly = { ...job };
      delete metadataOnly.externalJobId;
      return {
        ...metadataOnly,
        externalEncounterId: 'redacted-support-metadata-only'
      };
    }
    return job;
  }

  private createAdapter(headers: Record<string, string | string[] | undefined>): EhrAdapter {
    const vendor = this.parseVendor(this.headerValue(headers['x-aura-ehr-vendor']));
    const mode = this.parseMode(this.headerValue(headers['x-aura-ehr-mode']));
    return createEhrAdapter({
      vendor,
      mode,
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      clientIdConfigured: this.parseBooleanHeader(this.headerValue(headers['x-aura-ehr-client-id-configured'])) ?? false,
      clientSecretConfigured:
        this.parseBooleanHeader(this.headerValue(headers['x-aura-ehr-client-secret-configured'])) ?? false,
      simulateFailure: this.parseBooleanHeader(this.headerValue(headers['x-aura-ehr-simulate-failure'])) ?? false
    });
  }

  private parseSlices(slices: string | undefined): ChartContextSliceType[] {
    const requested = slices?.split(',').map((slice) => slice.trim()).filter(Boolean) ?? [
      'problems',
      'medications',
      'allergies',
      'labs',
      'documents'
    ];
    return requested.filter((slice): slice is ChartContextSliceType => this.isChartContextSlice(slice));
  }

  private toChartContextDto(context: ChartContextPackage): EhrChartContextPackageDto {
    return {
      chartContextPackageId: context.chartContextPackageId,
      tenantId: context.tenantId,
      siteId: context.siteId,
      safePatientId: context.safePatientId,
      externalPatientRef: context.externalPatientRef,
      externalEncounterId: context.externalEncounterId,
      sourceSystem: context.sourceSystem,
      requestedSlices: context.requestedSlices as EhrChartContextSliceTypeDto[],
      slices: context.slices.map((slice) => ({
        sliceType: slice.sliceType,
        sourceSystem: slice.sourceSystem,
        sourceRecordRef: slice.sourceRecordRef,
        value: slice.value,
        effectiveAt: slice.effectiveAt,
        freshness: slice.freshness,
        sourceQuality: slice.sourceQuality,
        phiClassification: slice.phiClassification,
        allowedPurposes: slice.allowedPurposes,
        evidenceIds: slice.evidenceIds
      })),
      staleSliceCount: context.staleSliceCount,
      createdAt: context.createdAt,
      warnings: context.warnings
    };
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

  private parseVendor(value: string | undefined): EhrVendor {
    switch (value) {
      case 'generic_mock':
      case 'athenahealth':
      case 'epic':
      case 'eclinicalworks':
        return value;
      default:
        return 'athenahealth';
    }
  }

  private parseMode(value: string | undefined): EhrAdapterMode {
    switch (value) {
      case 'mock':
      case 'sandbox':
      case 'production':
      case 'disabled':
        return value;
      default:
        return 'disabled';
    }
  }

  private parseBooleanHeader(value: string | undefined): boolean | undefined {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return undefined;
  }

  private isChartContextSlice(value: string): value is ChartContextSliceType {
    return [
      'demographics',
      'encounter',
      'appointment',
      'problems',
      'diagnoses_history',
      'medications',
      'allergies',
      'immunizations',
      'vitals',
      'labs',
      'documents',
      'prior_notes',
      'procedures',
      'social_history',
      'quality',
      'payer',
      'tasks',
      'billing_context'
    ].includes(value);
  }

  private nextId(prefix: string): string {
    const id = `${prefix}-${this.sequence.toString().padStart(4, '0')}`;
    this.sequence += 1;
    return id;
  }
}

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
  type EhrAppointmentImportDto,
  type EhrAppointmentImportResponseDto,
  type EhrChartContextPackageDto,
  type EhrChartContextResponseDto,
  type EhrChartContextSliceTypeDto,
  type EhrEncounterContextDto,
  type EhrEncounterContextResponseDto,
  type EhrIntegrationStatusDto,
  type EhrPatientLookupResponseDto,
  type EhrRuntimeBoundaryDto,
  type EhrRuntimeBoundaryResponseDto,
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

  async getRuntimeBoundary(headers: Record<string, string | string[] | undefined>): Promise<ApiEnvelope<EhrRuntimeBoundaryResponseDto>> {
    const context = this.createRequestContext(headers);
    if (!canPerform('ehr_adapter:view', context.access)) {
      throw new ForbiddenException('role cannot view EHR runtime boundary');
    }

    const adapter = this.createAdapter(headers);
    const boundary = await adapter.getRuntimeBoundary();
    const auditEvent = this.createAuditEvent('ehr.runtime_boundary_reviewed', 'EhrRuntimeBoundary', boundary.primaryVendor, context);

    return createApiEnvelope(
      {
        boundary,
        auditEvent,
        domainEvents: [
          this.createEhrDomainEvent(context, 'ehr.config_reviewed.v1', {
            vendor: boundary.primaryVendor,
            mode: boundary.mode,
            adapterBoundary: boundary.adapterBoundary,
            liveApiCallsEnabled: boundary.liveApiCallsEnabled,
            rawPayloadStorageEnabled: boundary.rawPayloadStorageEnabled
          }),
          this.createEhrDomainEvent(context, 'ehr.credential_disabled.v1', {
            vendor: boundary.primaryVendor,
            credentialState: boundary.credentialState,
            credentialReference: boundary.credentialReference,
            liveWritebackEnabled: boundary.liveWritebackEnabled
          })
        ]
      },
      this.createMeta(context)
    );
  }

  async searchPatients(
    query: { safePatientId?: string; externalPatientRef?: string; searchToken?: string },
    headers: Record<string, string | string[] | undefined>
  ): Promise<ApiEnvelope<EhrPatientLookupResponseDto>> {
    const context = this.createRequestContext(headers);
    if (!canPerform('ehr_chart_context:view', context.access)) {
      throw new ForbiddenException('role cannot search EHR patient context');
    }

    const adapter = this.createAdapter(headers);
    const [runtimeBoundary, results] = await Promise.all([adapter.getRuntimeBoundary(), adapter.searchPatients(query)]);
    const auditEvent = this.createAuditEvent('ehr.patient_lookup_performed', 'EhrPatient', query.safePatientId ?? 'synthetic-search', context);

    return createApiEnvelope(
      {
        results: results.map((result) => ({
          safePatientId: result.patient.safePatientId,
          externalPatientRef: result.patient.externalPatientRef,
          sourceSystem: result.patient.sourceSystem,
          displayLabel: result.patient.displayLabel,
          matchConfidence: result.matchConfidence,
          source: result.source
        })),
        runtimeBoundary,
        auditEvent,
        domainEvents: [
          this.createEhrDomainEvent(context, 'ehr.patient_lookup_performed.v1', {
            vendor: runtimeBoundary.primaryVendor,
            resultCount: results.length,
            liveApiCallsEnabled: runtimeBoundary.liveApiCallsEnabled,
            rawPayloadStorageEnabled: runtimeBoundary.rawPayloadStorageEnabled
          })
        ]
      },
      this.createMeta(context)
    );
  }

  async importAppointments(
    startIso: string | undefined,
    endIso: string | undefined,
    headers: Record<string, string | string[] | undefined>
  ): Promise<ApiEnvelope<EhrAppointmentImportResponseDto>> {
    const context = this.createRequestContext(headers);
    if (!canPerform('ehr_adapter:view', context.access)) {
      throw new ForbiddenException('role cannot import EHR appointment metadata');
    }

    const adapter = this.createAdapter(headers);
    const runtimeBoundary = await adapter.getRuntimeBoundary();
    const start = startIso ?? '2026-05-26T14:00:00.000Z';
    const end = endIso ?? '2026-05-26T22:00:00.000Z';
    const appointments = (await adapter.getSchedule(start, end)).map(
      (appointment): EhrAppointmentImportDto => ({
        externalAppointmentId: appointment.externalAppointmentId,
        safePatientId: appointment.safePatientId,
        externalPatientRef: appointment.externalPatientRef,
        clinicianId: appointment.clinicianId,
        startsAt: appointment.startsAt,
        durationMinutes: appointment.durationMinutes,
        visitType: appointment.visitType,
        sourceSystem: appointment.sourceSystem,
        importMode: 'sandbox_metadata_only',
        localAppointmentCreated: false
      })
    );
    const auditEvent = this.createAuditEvent('ehr.appointment_imported', 'EhrAppointmentImport', 'synthetic-sandbox-import', context);

    return createApiEnvelope(
      {
        appointments,
        runtimeBoundary,
        auditEvent,
        domainEvents: [
          this.createEhrDomainEvent(context, 'ehr.appointment_imported.v1', {
            vendor: runtimeBoundary.primaryVendor,
            appointmentCount: appointments.length,
            localAppointmentCreated: false,
            liveApiCallsEnabled: runtimeBoundary.liveApiCallsEnabled
          })
        ]
      },
      this.createMeta(context)
    );
  }

  async getEncounterContext(
    externalEncounterId: string,
    headers: Record<string, string | string[] | undefined>
  ): Promise<ApiEnvelope<EhrEncounterContextResponseDto>> {
    const context = this.createRequestContext(headers);
    if (!canPerform('ehr_chart_context:view', context.access)) {
      throw new ForbiddenException('role cannot view EHR encounter context');
    }

    const adapter = this.createAdapter(headers);
    const [runtimeBoundary, encounter] = await Promise.all([adapter.getRuntimeBoundary(), adapter.getEncounter(externalEncounterId)]);
    const encounterDto: EhrEncounterContextDto = {
      externalEncounterId: encounter.externalEncounterId,
      externalAppointmentId: encounter.externalAppointmentId,
      safePatientId: encounter.safePatientId,
      externalPatientRef: encounter.externalPatientRef,
      visitType: encounter.visitType,
      sourceSystem: encounter.sourceSystem,
      status: encounter.status,
      contextMode: 'sandbox_metadata_only',
      rawPayloadStored: false
    };
    const auditEvent = this.createAuditEvent('ehr.encounter_context_loaded', 'EhrEncounter', externalEncounterId, context);

    return createApiEnvelope(
      {
        encounter: encounterDto,
        runtimeBoundary,
        auditEvent,
        domainEvents: [
          this.createEhrDomainEvent(context, 'ehr.encounter_context_loaded.v1', {
            vendor: runtimeBoundary.primaryVendor,
            externalEncounterId,
            rawPayloadStored: false,
            liveApiCallsEnabled: runtimeBoundary.liveApiCallsEnabled
          })
        ]
      },
      this.createMeta(context)
    );
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
          states: [
            'disabled',
            'pending_approval',
            'denied',
            'approved',
            'prepared',
            'attempted',
            'acknowledged',
            'queued',
            'retrying',
            'failed',
            'dead_lettered',
            'reconciled'
          ],
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

    const requiredPermission = ['approve', 'deny', 'prepare_payload'].includes(body.action) ? 'ehr_writeback:approve' : 'ehr_writeback:manage';
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
    if (!body || !['approve', 'deny', 'prepare_payload', 'record_attempt', 'acknowledge', 'retry', 'dead_letter', 'reconcile'].includes(body.action)) {
      throw new BadRequestException('EHR writeback action is not supported');
    }
    if (body.action === 'approve' && !body.approvalId) {
      throw new BadRequestException('approvalId is required before EHR writeback approval');
    }
    if (body.action === 'deny' && !body.reason) {
      throw new BadRequestException('reason is required before EHR writeback denial');
    }
    if (body.action === 'acknowledge' && !body.acknowledgementId) {
      throw new BadRequestException('acknowledgementId is required for sandbox acknowledgement evidence');
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
      case 'deny':
        return {
          ...existing,
          status: 'denied',
          humanApproved: false,
          retryable: false,
          failedAt: now,
          failureReason: body.reason ?? 'Synthetic EHR writeback denial recorded before payload preparation.'
        };
      case 'prepare_payload':
        return {
          ...existing,
          status: existing.humanApproved ? 'prepared' : 'pending_approval',
          payloadStored: false,
          ...(existing.humanApproved
            ? {}
            : { failureReason: 'Human approval is required before payload preparation metadata can proceed.' })
        };
      case 'record_attempt': {
        const { failureReason: _failureReason, nextRetryAt: _nextRetryAt, ...base } = existing;
        return {
          ...base,
          status: 'attempted',
          retryable: true,
          retryCount: existing.retryCount + 1,
          lastAttemptAt: now,
          externalJobId: existing.externalJobId ?? `athena-sandbox-attempt-${existing.writebackJobId}`,
          ...(existing.configured && existing.humanApproved
            ? {}
            : { failureReason: 'Attempt recorded as metadata only; sandbox credential or approval gate is incomplete.' })
        };
      }
      case 'acknowledge': {
        const acknowledgementId = body.acknowledgementId;
        if (!acknowledgementId) {
          throw new BadRequestException('acknowledgementId is required for sandbox acknowledgement evidence');
        }
        return {
          ...existing,
          status: 'acknowledged',
          retryable: false,
          acknowledgementId,
          externalJobId: existing.externalJobId ?? `athena-sandbox-ack-${existing.writebackJobId}`,
          failureReason: 'Acknowledgement is synthetic metadata only and requires reconciliation before closure.'
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
      case 'deny':
        return 'ehr.writeback_denied.v1' as const;
      case 'prepare_payload':
        return 'ehr.writeback_payload_prepared.v1' as const;
      case 'record_attempt':
        return 'ehr.writeback_attempt_recorded.v1' as const;
      case 'acknowledge':
        return 'ehr.writeback_acknowledged.v1' as const;
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

  private createEhrDomainEvent(context: RequestContext, eventType: Parameters<typeof createEventEnvelope>[0]['eventType'], payload: Record<string, unknown>) {
    return createEventEnvelope({
      eventId: this.nextId('evt'),
      eventType,
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      producer: 'aura-note-api',
      traceId: context.traceId,
      idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
      sensitivity: 'restricted',
      retentionClass: 'audit',
      payload
    });
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

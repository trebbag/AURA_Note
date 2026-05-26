import { ForbiddenException, Injectable } from '@nestjs/common';
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
  type EhrIntegrationStatusDto
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
export class EhrService {
  private sequence = 1;

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

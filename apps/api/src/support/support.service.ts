import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import {
  createApiEnvelope,
  createEventEnvelope,
  type ApiEnvelope,
  type ApiMeta,
  type AuditEventDto,
  type AuditExportRequestDto,
  type AuditExportResponseDto,
  type FeatureFlagDecisionDto,
  type RetentionPolicyStatusDto,
  type SupportFailureStateDto,
  type SupportStatusResponseDto,
  type StructuredLogEntryDto
} from '@aura-note/contracts';
import {
  buildExternalIntegrationFeatureFlags,
  canPerform,
  createStructuredLogEntry,
  redactForStructuredLog,
  type AccessContext,
  type FeatureFlagDecision,
  type Role
} from '@aura-note/security';

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
export class SupportService {
  private sequence = 1;

  getStatus(headers: Record<string, string | string[] | undefined>): ApiEnvelope<SupportStatusResponseDto> {
    const context = this.createRequestContext(headers);
    if (!canPerform('support_status:view', context.access)) {
      throw new ForbiddenException('role cannot view support status');
    }

    const generatedAt = new Date().toISOString();
    const featureFlags = this.featureFlags();
    const retention = this.retentionPolicies(generatedAt);
    const sampleLog = createStructuredLogEntry({
      service: 'aura-note-api',
      level: 'info',
      message: 'Synthetic support status checked',
      requestId: context.requestId,
      traceId: context.traceId,
      eventName: 'support.status_checked',
      timestamp: generatedAt,
      payload: {
        service: 'aura-note',
        health: 'ok',
        safeTenantId: TENANT_ID
      }
    }) as StructuredLogEntryDto;

    return createApiEnvelope(
      {
        status: {
          service: 'aura-note',
          checkpoint: 'CP-4',
          mode: APP_MODE,
          generatedAt,
          overallHealth: featureFlags.some((flag) => flag.enabled) ? 'degraded' : 'ok',
          featureFlags,
          logging: {
            structured: true,
            requestCorrelated: true,
            phiRedaction: 'forbidden_keys_and_obvious_text',
            sample: sampleLog
          },
          retention,
          auditExport: {
            enabled: true,
            downloadEnabled: false,
            format: 'jsonl',
            redactedByDefault: true
          },
          failureStates: this.failureStates(),
          ciRuntime: {
            nodeVersion: '20',
            pnpmVersion: '9.12.0',
            node20ActionWarningAcceptedUntil: 'WO-013'
          }
        },
        auditEvent: this.createAuditEvent('support.status_check', 'SupportStatus', 'cp4-hardening', context)
      },
      this.createMeta(context)
    );
  }

  requestAuditExport(
    headers: Record<string, string | string[] | undefined>,
    body: AuditExportRequestDto
  ): ApiEnvelope<AuditExportResponseDto> {
    const context = this.createRequestContext(headers);
    if (!canPerform('audit:export', context.access)) {
      throw new ForbiddenException('role cannot request audit export');
    }
    this.validateAuditExportRequest(body);

    const now = new Date().toISOString();
    const auditExportId = this.nextId('audit-export');
    const rawPayload = {
      artifactType: 'final_note_pdf',
      safePatientId: 'safe-patient-synthetic-001',
      result: 'generated'
    };
    const redacted = redactForStructuredLog(rawPayload);
    const auditEvent = this.createAuditEvent('audit.export_request', 'AuditExport', auditExportId, context);

    return createApiEnvelope(
      {
        auditExport: {
          auditExportId,
          status: 'ready_synthetic',
          requestedByUserId: context.actorUserId,
          requestedAt: now,
          traceId: context.traceId,
          format: 'jsonl',
          includePhi: false,
          redacted: true,
          downloadEnabled: false,
          retentionClass: 'audit',
          recordCount: 1,
          records: [
            {
              auditEvent: {
                auditEventId: this.nextId('audit'),
                tenantId: TENANT_ID,
                siteId: SITE_ID,
                actorUserId: 'user-clinician-synthetic-001',
                action: 'export.generated',
                entityType: 'ExportArtifact',
                entityId: 'export-synthetic-001',
                traceId: context.traceId,
                createdAt: now
              },
              domainEventType: 'export.generated.v1',
              requestId: context.requestId,
              redactedPayload: redacted.value as Record<string, unknown>,
              redactedPaths: redacted.redactedPaths
            }
          ]
        },
        auditEvent,
        domainEvents: [
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType: 'audit.export_requested.v1',
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'restricted',
            retentionClass: 'audit',
            payload: {
              auditExportId,
              format: body.format,
              includePhi: false,
              recordCount: 1,
              downloadEnabled: false
            }
          })
        ]
      },
      this.createMeta(context)
    );
  }

  private featureFlags(): FeatureFlagDecisionDto[] {
    const flags: FeatureFlagDecision[] = buildExternalIntegrationFeatureFlags({
      externalAiEnabled: process.env.AURA_ENABLE_EXTERNAL_AI === 'true',
      ehrWritebackEnabled: process.env.AURA_ENABLE_EHR_WRITEBACK === 'true',
      clinicOsSyncEnabled: process.env.AURA_ENABLE_CLINICOS_SYNC === 'true',
      productionAnalyticsEnabled: process.env.AURA_ENABLE_PRODUCTION_ANALYTICS === 'true',
      auditExportDownloadEnabled: process.env.AURA_ENABLE_AUDIT_EXPORT_DOWNLOAD === 'true'
    });
    return flags.map((flag) => ({ ...flag }));
  }

  private retentionPolicies(evaluatedAt: string): RetentionPolicyStatusDto[] {
    return [
      {
        policyId: 'raw-audio-one-week',
        recordClass: 'audio_ephemeral',
        retentionRule: 'one_week',
        enforcedByJob: 'raw_audio_retention_candidate_scan',
        lastEvaluatedAt: evaluatedAt,
        candidateCount: 2,
        purgeEligibleCount: 1,
        destructivePurgeEnabled: false
      },
      {
        policyId: 'transcript-indefinite',
        recordClass: 'transcript',
        retentionRule: 'indefinite',
        enforcedByJob: 'transcript_retention_indefinite_scan',
        lastEvaluatedAt: evaluatedAt,
        candidateCount: 1,
        purgeEligibleCount: 0,
        destructivePurgeEnabled: false
      },
      {
        policyId: 'audit-tenant-policy',
        recordClass: 'audit',
        retentionRule: 'tenant_policy',
        enforcedByJob: 'audit_export_bundle_generation',
        lastEvaluatedAt: evaluatedAt,
        candidateCount: 1,
        purgeEligibleCount: 0,
        destructivePurgeEnabled: false
      }
    ];
  }

  private failureStates(): SupportFailureStateDto[] {
    return [
      {
        component: 'external_ai',
        status: 'disabled',
        operatorMessage: 'External AI provider calls are feature-flag disabled.',
        safeDegradedMode: 'Use deterministic mock suggestions and human review only.'
      },
      {
        component: 'ehr_writeback',
        status: 'metadata_only',
        operatorMessage: 'Live EHR writeback is configuration-gated.',
        safeDegradedMode: 'Copy/PDF/export artifacts remain available from signed final records.'
      },
      {
        component: 'audit_export',
        status: 'metadata_only',
        operatorMessage: 'Audit exports are redacted JSONL metadata bundles without download delivery.',
        safeDegradedMode: 'Compliance users can review synthetic export records in the API response.'
      },
      {
        component: 'structured_logging',
        status: 'ok',
        operatorMessage: 'Structured logs are request-correlated and PHI-redacted.',
        safeDegradedMode: 'Unsafe PHI-like fields are replaced or omitted before log persistence.'
      }
    ];
  }

  private validateAuditExportRequest(body: AuditExportRequestDto): void {
    if (!body || body.format !== 'jsonl') {
      throw new BadRequestException('audit export format must be jsonl');
    }
    if (body.includePhi !== false) {
      throw new BadRequestException('audit export must exclude PHI in CP-4 scaffold');
    }
    const startAt = new Date(body.startAt);
    const endAt = new Date(body.endAt);
    if (Number.isNaN(startAt.valueOf()) || Number.isNaN(endAt.valueOf()) || startAt > endAt) {
      throw new BadRequestException('audit export requires a valid startAt/endAt window');
    }
  }

  createRequestContext(headers: Record<string, string | string[] | undefined>): RequestContext {
    const role = this.parseRole(this.headerValue(headers['x-aura-role']));
    const requestId = this.headerValue(headers['x-request-id']) ?? this.nextId('req');
    const traceId = this.headerValue(headers['x-trace-id']) ?? this.nextId('trace');
    const idempotencyKey = this.headerValue(headers['idempotency-key']);

    const requestContext: RequestContext = {
      requestId,
      traceId,
      actorUserId: this.headerValue(headers['x-aura-user-id']) ?? `synthetic-${role}`,
      access: {
        role,
        linkedToPatient: false,
        linkedToVisit: false,
        treatingClinician: false,
        billingReviewTriggered: false,
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

  private nextId(prefix: string): string {
    const id = `${prefix}-${this.sequence.toString().padStart(4, '0')}`;
    this.sequence += 1;
    return id;
  }
}

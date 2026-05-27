import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import {
  createApiEnvelope,
  createEventEnvelope,
  type ApiEnvelope,
  type ApiMeta,
  type AuditEventDto,
  type AuditExportRequestDto,
  type AuditExportResponseDto,
  type DeploymentEnvironmentDto,
  type FeatureFlagDecisionDto,
  type ObservabilityStatusDto,
  type RetentionPolicyStatusDto,
  type RunbookIndexItemDto,
  type SupportFailureStateDto,
  type SupportStatusResponseDto,
  type StructuredLogEntryDto
} from '@aura-note/contracts';
import {
  buildLocalObservabilitySnapshot,
  buildExternalIntegrationFeatureFlags,
  canPerform,
  createSyntheticLocalSession,
  createStructuredLogEntry,
  redactForStructuredLog,
  type AccessContext,
  type FeatureFlagDecision
} from '@aura-note/security';
import { InMemoryObjectStorageAdapter, buildStorageKey, syntheticChecksum } from '@aura-note/storage';

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
          observability: this.observability(generatedAt, context),
          deployment: this.deploymentEnvironments(),
          runbooks: this.runbooks(),
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
    const records = [
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
        domainEventType: 'export.generated.v1' as const,
        requestId: context.requestId,
        redactedPayload: redacted.value as Record<string, unknown>,
        redactedPaths: redacted.redactedPaths
      }
    ];
    const storageDelivery = this.createAuditExportStorageDelivery({
      auditExportId,
      records,
      requestedAt: now,
      context
    });

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
          retentionClass: 'audit',
          recordCount: 1,
          records,
          ...storageDelivery
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
              downloadEnabled: storageDelivery.downloadEnabled ?? false,
              deliveryMode: storageDelivery.deliveryMode ?? 'inline_synthetic'
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

  private createAuditExportStorageDelivery(input: {
    auditExportId: string;
    records: unknown[];
    requestedAt: string;
    context: RequestContext;
  }) {
    if (process.env.AURA_ENABLE_AUDIT_EXPORT_DOWNLOAD !== 'true') {
      return {
        deliveryMode: 'inline_synthetic' as const,
        contentLengthBytes: Buffer.byteLength(JSON.stringify(input.records), 'utf8'),
        checksum: syntheticChecksum(JSON.stringify(input.records)),
        signedDownloadAvailable: false,
        downloadEnabled: false
      };
    }

    const content = input.records.map((record) => JSON.stringify(record)).join('\n');
    const storage = new InMemoryObjectStorageAdapter(() => input.requestedAt);
    const storageKey = buildStorageKey({
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      recordClass: 'audit-exports',
      recordId: input.auditExportId,
      fileName: `${input.auditExportId}.jsonl`
    });
    const stored = storage.putObject({
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      storageKey,
      body: content,
      contentType: 'application/json',
      retentionClass: 'audit',
      traceId: input.context.traceId
    });
    const signed = storage.createSignedDownload({
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      storageKey,
      requestedByUserId: input.context.actorUserId,
      permission: 'audit:export',
      expiresAt: new Date(new Date(input.requestedAt).getTime() + 15 * 60_000).toISOString(),
      traceId: input.context.traceId
    });

    return {
      deliveryMode: 'storage_backed' as const,
      storageProvider: 'azure_blob' as const,
      storageKey: stored.storageKey,
      contentLengthBytes: stored.contentLengthBytes,
      checksum: stored.checksum,
      signedDownloadAvailable: true,
      signedDownloadToken: signed.signedDownloadToken,
      signedDownloadExpiresAt: signed.signedDownloadExpiresAt,
      downloadEnabled: true
    };
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

  private observability(evaluatedAt: string, context: RequestContext): ObservabilityStatusDto {
    const snapshot = buildLocalObservabilitySnapshot({
      requestId: context.requestId,
      traceId: context.traceId,
      timestamp: evaluatedAt
    });
    return {
      sinks: snapshot.sinks,
      metricProbes: snapshot.metricProbes,
      traceProbes: snapshot.traceProbes
    };
  }

  private deploymentEnvironments(): DeploymentEnvironmentDto[] {
    return [
      {
        environment: 'local',
        mode: APP_MODE,
        readiness: 'ready_local',
        nodeVersion: '20',
        pnpmVersion: '9.12.0',
        secretsRequired: [],
        externalIntegrations: [],
        productionDataAllowed: false
      },
      {
        environment: 'preview',
        mode: APP_MODE,
        readiness: 'configuration_required',
        nodeVersion: '20',
        pnpmVersion: '9.12.0',
        secretsRequired: ['DATABASE_URL', 'SESSION_SIGNING_KEY', 'AUDIT_LOG_SALT'],
        externalIntegrations: ['audit_export_download'],
        productionDataAllowed: false
      },
      {
        environment: 'staging',
        mode: APP_MODE,
        readiness: 'configuration_required',
        nodeVersion: '20',
        pnpmVersion: '9.12.0',
        secretsRequired: ['DATABASE_URL', 'SESSION_SIGNING_KEY', 'OBJECT_STORAGE_BUCKET', 'OBSERVABILITY_EXPORTER_URL'],
        externalIntegrations: ['ehr_writeback', 'clinicos_sync', 'production_analytics', 'audit_export_download'],
        productionDataAllowed: false
      },
      {
        environment: 'production',
        mode: APP_MODE,
        readiness: 'blocked_until_security_review',
        nodeVersion: '20',
        pnpmVersion: '9.12.0',
        secretsRequired: [
          'DATABASE_URL',
          'SESSION_SIGNING_KEY',
          'OBJECT_STORAGE_BUCKET',
          'OBSERVABILITY_EXPORTER_URL',
          'SIEM_EXPORTER_URL',
          'KMS_KEY_ID'
        ],
        externalIntegrations: [
          'external_ai',
          'ehr_writeback',
          'clinicos_sync',
          'production_analytics',
          'audit_export_download'
        ],
        productionDataAllowed: false
      }
    ];
  }

  private runbooks(): RunbookIndexItemDto[] {
    return [
      {
        runbookId: 'WO-013',
        title: 'Support Hardening Runbook',
        path: 'docs/runbooks/WO-013_SUPPORT_HARDENING_RUNBOOK.md',
        covers: ['audit_export', 'retention_review', 'disabled_integrations', 'incident_triage'],
        productionApprovalRequired: true
      },
      {
        runbookId: 'WO-018',
        title: 'Observability Deployment Runbook',
        path: 'docs/runbooks/WO-018_OBSERVABILITY_DEPLOYMENT_RUNBOOK.md',
        covers: ['deploy', 'rollback', 'incident_triage', 'audit_export', 'retention_review', 'disabled_integrations'],
        productionApprovalRequired: true
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
    const session = createSyntheticLocalSession(headers, {
      defaultTenantId: TENANT_ID,
      defaultSiteId: SITE_ID,
      requestId: this.nextId('req'),
      traceId: this.nextId('trace'),
      defaultLinkedToPatient: false,
      defaultLinkedToVisit: false
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

  private nextId(prefix: string): string {
    const id = `${prefix}-${this.sequence.toString().padStart(4, '0')}`;
    this.sequence += 1;
    return id;
  }
}

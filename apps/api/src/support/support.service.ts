import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import {
  createApiEnvelope,
  createEventEnvelope,
  type ApiEnvelope,
  type ApiMeta,
  type AuditEventDto,
  type AuditExportRequestDto,
  type AuditExportResponseDto,
  type BackupRestoreReadinessResponseDto,
  type CommercialReadinessChecklistItemDto,
  type CommercialReadinessResponseDto,
  type CommercialReadinessSectionDto,
  type DeploymentEnvironmentDto,
  type FeatureFlagDecisionDto,
  type ObservabilityStatusDto,
  type OperationalEvidenceActionDto,
  type OperationalEvidenceRequestDto,
  type OperationalEvidenceResponseDto,
  type OperationalReadinessResponseDto,
  type RetentionPolicyStatusDto,
  type RunbookIndexItemDto,
  type SupportFailureStateDto,
  type SupportStatusResponseDto,
  type SecureDownloadResponseDto,
  type StructuredLogEntryDto
} from '@aura-note/contracts';
import {
  buildLocalObservabilitySnapshot,
  buildExternalIntegrationFeatureFlags,
  canPerform,
  createSyntheticLocalSession,
  createStructuredLogEntry,
  redactForStructuredLog,
  scanForForbiddenPhiKeys,
  scanForForbiddenPhiText,
  type AccessContext,
  type FeatureFlagDecision
} from '@aura-note/security';
import { InMemoryObjectStorageAdapter, buildStorageKey, evaluateBackupRestoreReadiness, syntheticChecksum } from '@aura-note/storage';

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
  private readonly storage = new InMemoryObjectStorageAdapter();
  private readonly auditExports = new Map<string, AuditExportResponseDto['auditExport']>();

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
          checkpoint: 'P8',
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
        auditEvent: this.createAuditEvent('support.status_check', 'SupportStatus', 'p8-operations', context),
        domainEvents: [
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType: 'support.status_checked.v1',
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'restricted',
            retentionClass: 'audit',
            payload: {
              checkpoint: 'P8',
              overallHealth: featureFlags.some((flag) => flag.enabled) ? 'degraded' : 'ok',
              requestCorrelated: true,
              phiSafe: true
            }
          }),
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType: 'observability.status_checked.v1',
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'restricted',
            retentionClass: 'audit',
            payload: {
              localSinksReady: true,
              productionSinksConfigured: false,
              requestCorrelated: true,
              phiSafe: true
            }
          })
        ]
      },
      this.createMeta(context)
    );
  }

  getOperationalReadiness(headers: Record<string, string | string[] | undefined>): ApiEnvelope<OperationalReadinessResponseDto> {
    const context = this.createRequestContext(headers);
    if (!canPerform('support_status:view', context.access)) {
      throw new ForbiddenException('role cannot view operational readiness');
    }

    const now = new Date().toISOString();
    const observability = this.observability(now, context);
    const localSinksReady = observability.sinks
      .filter((sink) => sink.adapter === 'local_development')
      .every((sink) => sink.redacted && sink.requestCorrelated && sink.status === 'ready_local');
    const productionSinksConfigured = observability.sinks
      .filter((sink) => sink.adapter === 'disabled_production_placeholder')
      .every((sink) => sink.status !== 'disabled_until_configured');
    const incidentRunbooksReady = this.runbooks().some((runbook) => runbook.covers.includes('incident_triage'));
    const accessReviewEvidenceReady = true;
    const missing = [
      ...(productionSinksConfigured ? [] : ['production_siem_apm_vendor_configuration']),
      'production_launch_approval'
    ];

    return createApiEnvelope(
      {
        readiness: {
          status: localSinksReady && incidentRunbooksReady && accessReviewEvidenceReady ? 'ready_synthetic' : 'blocked_review',
          checkpoint: 'P8',
          observabilityReadyLocal: localSinksReady,
          vendorSinksConfigured: false,
          supportOperationsReady: true,
          incidentRunbooksReady,
          accessReviewEvidenceReady,
          productionLaunchReady: false,
          missing,
          traceId: context.traceId
        },
        auditEvent: this.createAuditEvent('operational.readiness_check', 'OperationalReadiness', 'p8-operational-readiness', context),
        domainEvents: [
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType: 'operational.readiness_checked.v1',
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'restricted',
            retentionClass: 'audit',
            payload: {
              checkpoint: 'P8',
              observabilityReadyLocal: localSinksReady,
              vendorSinksConfigured: false,
              productionLaunchReady: false,
              missing
            }
          })
        ]
      },
      this.createMeta(context)
    );
  }

  getCommercialReadiness(headers: Record<string, string | string[] | undefined>): ApiEnvelope<CommercialReadinessResponseDto> {
    const context = this.createRequestContext(headers);
    if (!canPerform('support_status:view', context.access) && !canPerform('audit:view', context.access)) {
      throw new ForbiddenException('role cannot view commercial readiness review package');
    }

    const now = new Date().toISOString();
    const sections = this.commercialReadinessSections();
    const disabledCapabilities = [
      'live_phi',
      'production_credentials',
      'live_external_ai',
      'live_transcription_vendor',
      'live_ehr_writeback',
      'live_clinicos_event_bus',
      'live_azure_phi_storage',
      'claim_submission',
      'charge_finalization',
      'medical_necessity_determination',
      'autonomous_clinical_coding_billing_behavior',
      'patient_facing_financial_conclusion',
      'production_launch'
    ];

    return createApiEnvelope(
      {
        readiness: {
          checkpoint: 'CR-4',
          status: 'review_ready_synthetic',
          generatedAt: now,
          traceId: context.traceId,
          sections,
          decisionGate: {
            checkpoint: 'CR-4',
            status: 'review_ready_synthetic',
            completedWorkOrders: ['WO-071', 'WO-072', 'WO-073', 'WO-074', 'WO-075'],
            figmaReady: true,
            betaPilotPackageReady: true,
            commercialReviewReady: true,
            productionLaunchReady: false,
            noActiveSpecGaps: true,
            liveVendorDecisionRequired: true,
            finalReviewRoles: ['founder', 'clinical', 'compliance_privacy', 'security']
          },
          disabledCapabilities,
          requiredApprovals: [
            'founder commercial readiness review',
            'clinical workflow and safety review',
            'compliance/privacy review',
            'security review',
            'live vendor credentialing and BAA review before any live integration'
          ],
          nextStep: 'Founder, clinical, compliance/privacy, and security review of the CR-4 decision packet.',
          productionLaunchReady: false
        },
        auditEvent: this.createAuditEvent('commercial.readiness_check', 'CommercialReadiness', 'CR-4', context),
        domainEvents: [
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType: 'security.privacy_review_checked.v1',
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'restricted',
            retentionClass: 'audit',
            payload: {
              workOrder: 'WO-071',
              productionLaunchReady: false,
              phiSafe: true
            }
          }),
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType: 'threat_model.reviewed.v1',
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'restricted',
            retentionClass: 'audit',
            payload: {
              workOrder: 'WO-071',
              noCertificationClaim: true
            }
          }),
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType: 'support.incident_taxonomy_checked.v1',
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'restricted',
            retentionClass: 'audit',
            payload: {
              workOrder: 'WO-072',
              liveTelemetryVendorConfigured: false
            }
          }),
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType: 'billing.revenue_integrity_checked.v1',
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'restricted',
            retentionClass: 'audit',
            payload: {
              workOrder: 'WO-073',
              submittedClaim: false,
              autonomousBilling: false
            }
          }),
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType: 'beta.pilot_package_checked.v1',
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'restricted',
            retentionClass: 'audit',
            payload: {
              workOrder: 'WO-074',
              betaPilotPackageReady: true,
              liveTenantOnboarding: false
            }
          }),
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType: 'commercial.readiness_decision_checked.v1',
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'restricted',
            retentionClass: 'audit',
            payload: {
              workOrder: 'WO-075',
              commercialReviewReady: true,
              productionLaunchReady: false
            }
          })
        ]
      },
      this.createMeta(context)
    );
  }

  recordOperationalEvidence(
    headers: Record<string, string | string[] | undefined>,
    body: OperationalEvidenceRequestDto
  ): ApiEnvelope<OperationalEvidenceResponseDto> {
    const context = this.createRequestContext(headers);
    if (!canPerform('support_operations:record', context.access)) {
      throw new ForbiddenException('role cannot record operational evidence');
    }
    this.validateOperationalEvidenceRequest(body);

    const now = new Date().toISOString();
    const evidenceId = this.nextId('ops-evidence');
    const eventType = this.eventTypeForOperationalEvidence(body.actionType);

    return createApiEnvelope(
      {
        evidence: {
          evidenceId,
          actionType: body.actionType,
          subjectId: body.subjectId,
          status: 'recorded_synthetic',
          tenantId: TENANT_ID,
          siteId: SITE_ID,
          actorUserId: context.actorUserId,
          requestId: context.requestId,
          traceId: context.traceId,
          recordedAt: now,
          phiSafe: true,
          launchReadinessClaimed: false
        },
        auditEvent: this.createAuditEvent('support.operational_evidence_record', 'OperationalEvidence', evidenceId, context),
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
              evidenceId,
              actionType: body.actionType,
              subjectId: body.subjectId,
              phiSafe: true,
              launchReadinessClaimed: false
            }
          })
        ]
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

  deliverAuditExportDownload(
    auditExportId: string,
    signedDownloadToken: string,
    headers: Record<string, string | string[] | undefined>
  ): ApiEnvelope<SecureDownloadResponseDto> {
    const context = this.createRequestContext(headers);
    if (!canPerform('audit:export', context.access)) {
      throw new ForbiddenException('role cannot download audit export');
    }
    const auditExport = this.auditExports.get(auditExportId);
    if (!auditExport || auditExport.deliveryMode !== 'storage_backed' || !auditExport.storageKey) {
      throw new BadRequestException('storage-backed audit export download is not available');
    }

    const delivered = this.storage.deliverSignedDownload({
      token: signedDownloadToken,
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      requestedByUserId: context.actorUserId,
      permission: 'audit:export',
      nowIso: new Date().toISOString(),
      traceId: context.traceId
    });

    return createApiEnvelope(
      {
        download: {
          ...delivered,
          deliveryMode: 'storage_backed',
          storageProvider: 'azure_blob'
        },
        auditEvent: this.createAuditEvent('storage.object_deliver', 'AuditExport', auditExportId, context),
        domainEvents: [
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType: 'storage.object_delivered.v1',
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'restricted',
            retentionClass: 'audit',
            payload: {
              auditExportId,
              storageKey: delivered.storageKey,
              contentLengthBytes: delivered.contentLengthBytes,
              serverMediated: true,
              publicUrl: null
            }
          })
        ]
      },
      this.createMeta(context)
    );
  }

  getBackupRestoreReadiness(headers: Record<string, string | string[] | undefined>): ApiEnvelope<BackupRestoreReadinessResponseDto> {
    const context = this.createRequestContext(headers);
    if (!canPerform('config:view', context.access)) {
      throw new ForbiddenException('role cannot view backup restore readiness');
    }

    const readiness = evaluateBackupRestoreReadiness({
      azureSoftDeleteEnabled: process.env.AURA_AZURE_BLOB_SOFT_DELETE_ENABLED === 'true',
      azureVersioningEnabled: process.env.AURA_AZURE_BLOB_VERSIONING_ENABLED === 'true',
      databaseBackupConfigured: process.env.AURA_DATABASE_BACKUP_CONFIGURED === 'true',
      restoreDrillEvidenceRecorded: process.env.AURA_RESTORE_DRILL_EVIDENCE_RECORDED === 'true',
      evidenceRetentionDays: Number(process.env.AURA_EVIDENCE_RETENTION_DAYS ?? '365'),
      productionRestoreExecutionApproved: false,
      traceId: context.traceId
    });

    return createApiEnvelope(
      {
        readiness,
        auditEvent: this.createAuditEvent('restore.readiness_check', 'BackupRestoreReadiness', 'restore-readiness-synthetic', context),
        domainEvents: [
          createEventEnvelope({
            eventId: this.nextId('evt'),
            eventType: 'restore.readiness_checked.v1',
            tenantId: TENANT_ID,
            siteId: SITE_ID,
            producer: 'aura-note-api',
            traceId: context.traceId,
            idempotencyKey: context.idempotencyKey ?? this.nextId('idem'),
            sensitivity: 'restricted',
            retentionClass: 'audit',
            payload: {
              status: readiness.status,
              missing: readiness.missing,
              restoreExecutionEnabled: false
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
    const storageKey = buildStorageKey({
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      recordClass: 'audit-exports',
      recordId: input.auditExportId,
      fileName: `${input.auditExportId}.jsonl`
    });
    const stored = this.storage.putObject({
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      storageKey,
      body: content,
      contentType: 'application/json',
      retentionClass: 'audit',
      traceId: input.context.traceId
    });
    const signed = this.storage.createSignedDownload({
      tenantId: TENANT_ID,
      siteId: SITE_ID,
      storageKey,
      requestedByUserId: input.context.actorUserId,
      permission: 'audit:export',
      expiresAt: new Date(new Date(input.requestedAt).getTime() + 15 * 60_000).toISOString(),
      traceId: input.context.traceId
    });

    const delivery = {
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
    this.auditExports.set(input.auditExportId, {
      auditExportId: input.auditExportId,
      status: 'ready_synthetic',
      requestedByUserId: input.context.actorUserId,
      requestedAt: input.requestedAt,
      traceId: input.context.traceId,
      format: 'jsonl',
      includePhi: false,
      redacted: true,
      retentionClass: 'audit',
      recordCount: input.records.length,
      records: [],
      ...delivery
    });
    return delivery;
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
      },
      {
        component: 'clinicos_sync',
        status: 'disabled',
        operatorMessage: 'ClinicOS operational delegation is disabled until configured.',
        safeDegradedMode: 'AURA Note local support metadata remains authoritative.'
      }
    ];
  }

  private validateOperationalEvidenceRequest(body: OperationalEvidenceRequestDto): void {
    if (!body || !['incident_runbook_viewed', 'degraded_mode_acknowledged', 'access_review_recorded'].includes(body.actionType)) {
      throw new BadRequestException('operational evidence actionType is not supported');
    }
    if (!body.subjectId || body.subjectId.length > 120) {
      throw new BadRequestException('operational evidence subjectId is required');
    }
    const phiKeyScan = scanForForbiddenPhiKeys(body);
    const phiTextScan = scanForForbiddenPhiText(body);
    if (phiKeyScan.containsForbiddenPhi || phiTextScan.containsForbiddenPhiText) {
      throw new BadRequestException('operational evidence must not contain PHI');
    }
  }

  private eventTypeForOperationalEvidence(actionType: OperationalEvidenceActionDto) {
    switch (actionType) {
      case 'incident_runbook_viewed':
        return 'incident.runbook_viewed.v1' as const;
      case 'degraded_mode_acknowledged':
        return 'degraded_mode.acknowledged.v1' as const;
      case 'access_review_recorded':
        return 'access_review.evidence_recorded.v1' as const;
    }
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

  private commercialReadinessSections(): CommercialReadinessSectionDto[] {
    const states: CommercialReadinessSectionDto['states'] = [
      'empty',
      'loading',
      'ready',
      'saving',
      'blocked',
      'failed',
      'permission-denied',
      'read-only',
      'demo fixture'
    ];

    return [
      {
        sectionId: 'security_privacy_compliance',
        workOrder: 'WO-071',
        title: 'Security, Privacy, Compliance, And Threat Model',
        status: 'review_ready',
        states,
        checklist: [
          this.commercialChecklistItem('threat-model', 'Threat model and privacy checklist', 'ready_synthetic', 'docs/SECURITY_PRIVACY_COMPLIANCE_THREAT_MODEL.md', 'security', true),
          this.commercialChecklistItem('minimum-necessary', 'Minimum necessary and support scope restrictions', 'ready_synthetic', 'docs/RBAC_ABAC_MATRIX.md', 'compliance_privacy', true),
          this.commercialChecklistItem('break-glass', 'Break-glass placeholder remains disabled', 'disabled_by_default', 'apps/api/src/platform/platform.service.ts', 'security', true),
          this.commercialChecklistItem('certification', 'No HIPAA or SOC 2 certification claim', 'review_required', 'docs/SECURITY_PRIVACY_COMPLIANCE_THREAT_MODEL.md', 'compliance_privacy', true)
        ],
        missingApprovals: ['formal security approval', 'formal compliance/privacy approval'],
        productionLaunchReady: false,
        liveVendorEnabled: false,
        phiSafe: true
      },
      {
        sectionId: 'observability_support_incident_operations',
        workOrder: 'WO-072',
        title: 'Observability, SRE, Support, And Incident Operations',
        status: 'review_ready',
        states,
        checklist: [
          this.commercialChecklistItem('incident-taxonomy', 'Incident severity taxonomy and runbooks', 'ready_synthetic', 'docs/COMMERCIAL_OBSERVABILITY_SUPPORT_OPERATIONS.md', 'support', true),
          this.commercialChecklistItem('telemetry', 'SIEM/APM placeholders remain disabled', 'disabled_by_default', 'docs/OBSERVABILITY_SINKS.md', 'engineering', true),
          this.commercialChecklistItem('support-status', 'Support status route is metadata-only', 'ready_synthetic', 'apps/web/app/aura-note/support/status/page.tsx', 'support', true)
        ],
        missingApprovals: ['SRE/on-call owner approval', 'SIEM/APM vendor approval'],
        productionLaunchReady: false,
        liveVendorEnabled: false,
        phiSafe: true
      },
      {
        sectionId: 'billing_revenue_integrity',
        workOrder: 'WO-073',
        title: 'Billing, Revenue Integrity, Claim Decision, And Compliance Boundary',
        status: 'review_ready',
        states,
        checklist: [
          this.commercialChecklistItem('draft-claim', 'Draft claim preview remains submittedClaim=false', 'ready_synthetic', 'docs/BILLING_REVENUE_INTEGRITY_BOUNDARY.md', 'billing', true),
          this.commercialChecklistItem('candidate-only', 'Codes and billing items remain candidate-only', 'ready_synthetic', 'apps/api/src/operations/operations.service.ts', 'billing', true),
          this.commercialChecklistItem('patient-summary-exclusion', 'Patient summaries exclude internal revenue and billing detail', 'ready_synthetic', 'apps/api/src/schedule/schedule.service.ts', 'clinical', true),
          this.commercialChecklistItem('claim-submission', 'Live claim submission remains disabled', 'disabled_by_default', 'docs/CLAIM_PAYER_DECISION_GATE.md', 'billing', true)
        ],
        missingApprovals: ['founder billing strategy approval', 'legal/compliance payer review'],
        productionLaunchReady: false,
        liveVendorEnabled: false,
        phiSafe: true
      },
      {
        sectionId: 'beta_pilot_package',
        workOrder: 'WO-074',
        title: 'Beta Pilot Commercial Readiness Package',
        status: 'review_ready',
        states,
        checklist: [
          this.commercialChecklistItem('onboarding', 'Beta onboarding and tenant setup checklist', 'ready_synthetic', 'docs/BETA_PILOT_READINESS_PACKAGE.md', 'founder', true),
          this.commercialChecklistItem('training', 'Role training checklists', 'ready_synthetic', 'docs/BETA_PILOT_READINESS_PACKAGE.md', 'clinical', true),
          this.commercialChecklistItem('pilot-smoke', 'Synthetic pilot smoke remains API-backed', 'ready_synthetic', 'scripts/simulate-pilot-launch-smoke.js', 'engineering', true),
          this.commercialChecklistItem('disabled-features', 'Disabled feature inventory is visible', 'ready_synthetic', 'docs/BETA_PILOT_READINESS_PACKAGE.md', 'support', true)
        ],
        missingApprovals: ['real beta participant approval', 'privacy/security beta approval'],
        productionLaunchReady: false,
        liveVendorEnabled: false,
        phiSafe: true
      },
      {
        sectionId: 'commercial_readiness_decision_gate',
        workOrder: 'WO-075',
        title: 'Commercial Readiness Decision Gate',
        status: 'review_ready',
        states,
        checklist: [
          this.commercialChecklistItem('review-packet', 'Commercial readiness review packet', 'ready_synthetic', 'docs/COMMERCIAL_READINESS_REVIEW_PACKET.md', 'founder', true),
          this.commercialChecklistItem('readiness-matrix', 'Readiness matrix and disabled-capability inventory', 'ready_synthetic', 'docs/COMMERCIAL_READINESS_REVIEW_PACKET.md', 'engineering', true),
          this.commercialChecklistItem('launch-posture', 'Production-launch-ready remains false', 'blocked_until_approval', 'repo_status.json', 'founder', true)
        ],
        missingApprovals: ['founder approval', 'clinical approval', 'compliance/privacy approval', 'security approval'],
        productionLaunchReady: false,
        liveVendorEnabled: false,
        phiSafe: true
      }
    ];
  }

  private commercialChecklistItem(
    itemId: string,
    label: string,
    status: CommercialReadinessChecklistItemDto['status'],
    evidence: string,
    ownerRole: CommercialReadinessChecklistItemDto['ownerRole'],
    productionLaunchBlocker: boolean
  ): CommercialReadinessChecklistItemDto {
    return {
      itemId,
      label,
      status,
      evidence,
      ownerRole,
      productionLaunchBlocker
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

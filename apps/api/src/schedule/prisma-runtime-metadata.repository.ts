import { Prisma, type PrismaClient } from '@prisma/client';
import type {
  AuditEventDto,
  AuraNoteEvent,
  CoachingReportDto,
  FeatureFlagDecisionDto,
  SupportStatusResponseDto
} from '@aura-note/contracts';
import { toDeterministicPersistenceUuid } from '@aura-note/persistence';
import { canPerform, type AccessContext } from '@aura-note/security';

type TransactionClient = Prisma.TransactionClient;

export interface TemplateMetadataDto {
  templateId: string;
  tenantId: string;
  siteId?: string;
  name: string;
  visitType: string;
  specialty?: string;
  body: string;
  status: 'draft' | 'active' | 'retired';
}

export interface DotPhraseMetadataDto {
  dotPhraseId: string;
  tenantId: string;
  siteId?: string;
  phrase: string;
  body: string;
  status: 'active' | 'retired';
}

export interface IntegrationConnectionMetadataDto {
  integrationConnectionId: string;
  tenantId: string;
  siteId?: string;
  kind: 'ehr' | 'clinicos' | 'ai_gateway' | 'storage' | 'analytics' | 'audit_export';
  vendor: string;
  mode: 'standalone' | 'mock' | 'sandbox' | 'disabled';
  enabled: boolean;
  status: 'disabled' | 'metadata_only' | 'ready_mock' | 'failed';
  config: Record<string, unknown>;
}

export interface ModeMappingMetadataDto {
  modeMappingId: string;
  tenantId: string;
  siteId?: string;
  localObjectType: string;
  localObjectId: string;
  externalSystem: string;
  externalObjectType: string;
  externalObjectId: string;
  sourceOfTruth: 'aura_note' | 'clinicos' | 'ehr';
  status: 'active' | 'disabled' | 'metadata_only';
}

export interface RuntimeMetadataSnapshot {
  tenantId: string;
  siteId: string;
  auditEvents: AuditEventDto[];
  domainEvents: Array<AuraNoteEvent<Record<string, unknown>>>;
  supportStatus?: SupportStatusResponseDto;
  featureFlags: FeatureFlagDecisionDto[];
  templates: TemplateMetadataDto[];
  dotPhrases: DotPhraseMetadataDto[];
  coachingReports: CoachingReportDto[];
  integrationConnections: IntegrationConnectionMetadataDto[];
  modeMappings: ModeMappingMetadataDto[];
}

export interface AsyncRuntimeMetadataRepository {
  saveRuntimeMetadata(snapshot: RuntimeMetadataSnapshot): Promise<void>;
  getRuntimeMetadata(): Promise<RuntimeMetadataSnapshot>;
}

export interface PrismaRuntimeMetadataRepositoryOptions {
  tenantId: string;
  siteId: string;
}

export type RuntimeMetadataAccessScope = 'support' | 'audit' | 'coaching' | 'admin';

export function createPrismaRuntimeMetadataRepository(
  prisma: PrismaClient,
  options: PrismaRuntimeMetadataRepositoryOptions
): AsyncRuntimeMetadataRepository {
  return new PrismaRuntimeMetadataRepository(prisma, options);
}

export class PrismaRuntimeMetadataRepository implements AsyncRuntimeMetadataRepository {
  private readonly tenantUuid: string;
  private readonly siteUuid: string;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly options: PrismaRuntimeMetadataRepositoryOptions
  ) {
    this.tenantUuid = toDeterministicPersistenceUuid('tenant', options.tenantId);
    this.siteUuid = toDeterministicPersistenceUuid('site', options.tenantId, options.siteId);
  }

  async saveRuntimeMetadata(snapshot: RuntimeMetadataSnapshot): Promise<void> {
    this.assertScopeMatchesSnapshot(snapshot);
    await this.prisma.$transaction(async (tx) => {
      await this.upsertTenantAndSite(tx);
      await this.syncAuditEvents(tx, snapshot.auditEvents);
      await this.syncDomainEvents(tx, snapshot.domainEvents);
      await this.syncSupportStatus(tx, snapshot.supportStatus);
      await this.syncFeatureFlags(tx, snapshot.featureFlags);
      await this.syncTemplates(tx, snapshot.templates);
      await this.syncDotPhrases(tx, snapshot.dotPhrases);
      await this.syncCoachingReports(tx, snapshot.coachingReports);
      await this.syncIntegrationConnections(tx, snapshot.integrationConnections);
      await this.syncModeMappings(tx, snapshot.modeMappings);
    });
  }

  async getRuntimeMetadata(): Promise<RuntimeMetadataSnapshot> {
    const [
      auditEvents,
      domainEvents,
      supportStatuses,
      featureFlags,
      templates,
      dotPhrases,
      coachingReports,
      integrationConnections,
      modeMappings
    ] = await Promise.all([
      this.prisma.auditEvent.findMany({ where: this.scopedWhere(), orderBy: { createdAt: 'asc' } }),
      this.prisma.domainEvent.findMany({ where: this.scopedWhere(), orderBy: { createdAt: 'asc' } }),
      this.prisma.supportStatusSnapshot.findMany({ where: this.scopedWhere(), orderBy: { createdAt: 'desc' } }),
      this.prisma.featureFlag.findMany({ where: this.scopedWhere(), orderBy: { flagKey: 'asc' } }),
      this.prisma.template.findMany({ where: this.scopedWhere(), orderBy: { name: 'asc' } }),
      this.prisma.dotPhrase.findMany({ where: this.scopedWhere(), orderBy: { phrase: 'asc' } }),
      this.prisma.coachingReport.findMany({ where: this.scopedWhere(), orderBy: { generatedAt: 'asc' } }),
      this.prisma.integrationConnection.findMany({ where: this.scopedWhere(), orderBy: { vendor: 'asc' } }),
      this.prisma.modeMapping.findMany({ where: this.scopedWhere(), orderBy: { localObjectId: 'asc' } })
    ]);

    const snapshot: RuntimeMetadataSnapshot = {
      tenantId: this.options.tenantId,
      siteId: this.options.siteId,
      auditEvents: auditEvents.map(toAuditEventDto),
      domainEvents: domainEvents.map(toDomainEventDto),
      featureFlags: featureFlags.map(toFeatureFlagDto),
      templates: templates.map((template) => toTemplateDto(template, this.options.tenantId, this.options.siteId)),
      dotPhrases: dotPhrases.map((dotPhrase) => toDotPhraseDto(dotPhrase, this.options.tenantId, this.options.siteId)),
      coachingReports: coachingReports.map(toCoachingReportDto),
      integrationConnections: integrationConnections.map((connection) =>
        toIntegrationConnectionDto(connection, this.options.tenantId, this.options.siteId)
      ),
      modeMappings: modeMappings.map((mapping) => toModeMappingDto(mapping, this.options.tenantId, this.options.siteId))
    };
    const supportStatus = supportStatuses[0] ? jsonObject<SupportStatusResponseDto>(supportStatuses[0].snapshotJson) : undefined;
    if (supportStatus) {
      snapshot.supportStatus = supportStatus;
    }
    return snapshot;
  }

  private async upsertTenantAndSite(tx: TransactionClient): Promise<void> {
    await tx.tenant.upsert({
      where: { id: this.tenantUuid },
      create: {
        id: this.tenantUuid,
        name: this.options.tenantId,
        mode: 'standalone'
      },
      update: {
        name: this.options.tenantId,
        mode: 'standalone'
      }
    });
    await tx.site.upsert({
      where: { id: this.siteUuid },
      create: {
        id: this.siteUuid,
        tenantId: this.tenantUuid,
        name: this.options.siteId,
        timezone: 'America/New_York'
      },
      update: {
        name: this.options.siteId,
        timezone: 'America/New_York'
      }
    });
  }

  private async syncAuditEvents(tx: TransactionClient, events: AuditEventDto[]): Promise<void> {
    const ids = events.map((event) => this.toAuditEventUuid(event.auditEventId));
    await tx.auditEvent.deleteMany({
      where: {
        tenantId: this.tenantUuid,
        siteId: this.siteUuid,
        ...(ids.length > 0 ? { id: { notIn: ids } } : {})
      }
    });

    for (const event of events) {
      await tx.auditEvent.upsert({
        where: { id: this.toAuditEventUuid(event.auditEventId) },
        create: {
          id: this.toAuditEventUuid(event.auditEventId),
          tenantId: this.tenantUuid,
          siteId: this.siteUuid,
          actorUserId: null,
          action: event.action,
          entityType: event.entityType,
          entityId: event.entityId,
          requestId: `request-${event.traceId}`,
          traceId: event.traceId,
          retentionClass: 'audit',
          metadataJson: jsonInput({ auditEventId: event.auditEventId }),
          createdAt: new Date(event.createdAt)
        },
        update: {
          action: event.action,
          entityType: event.entityType,
          entityId: event.entityId,
          requestId: `request-${event.traceId}`,
          traceId: event.traceId,
          metadataJson: jsonInput({ auditEventId: event.auditEventId })
        }
      });
    }
  }

  private async syncDomainEvents(
    tx: TransactionClient,
    events: Array<AuraNoteEvent<Record<string, unknown>>>
  ): Promise<void> {
    const ids = events.map((event) => this.toDomainEventUuid(event.eventId));
    await tx.domainEvent.deleteMany({
      where: {
        tenantId: this.tenantUuid,
        siteId: this.siteUuid,
        ...(ids.length > 0 ? { id: { notIn: ids } } : {})
      }
    });

    for (const event of events) {
      await tx.domainEvent.upsert({
        where: { id: this.toDomainEventUuid(event.eventId) },
        create: {
          id: this.toDomainEventUuid(event.eventId),
          tenantId: this.tenantUuid,
          siteId: this.siteUuid,
          eventType: event.eventType,
          aggregateType: event.payload.aggregateType?.toString() ?? 'RuntimeMetadata',
          aggregateId: event.noteId ?? event.appointmentId ?? event.eventId,
          payloadJson: jsonInput(event.payload),
          publishedAt: new Date(event.eventTime)
        },
        update: {
          eventType: event.eventType,
          aggregateType: event.payload.aggregateType?.toString() ?? 'RuntimeMetadata',
          aggregateId: event.noteId ?? event.appointmentId ?? event.eventId,
          payloadJson: jsonInput(event.payload),
          publishedAt: new Date(event.eventTime)
        }
      });
    }
  }

  private async syncSupportStatus(tx: TransactionClient, supportStatus: SupportStatusResponseDto | undefined): Promise<void> {
    await tx.supportStatusSnapshot.deleteMany({ where: this.scopedWhere() });
    if (!supportStatus) {
      return;
    }

    await tx.supportStatusSnapshot.create({
      data: {
        id: toDeterministicPersistenceUuid('support-status', this.options.tenantId, this.options.siteId, supportStatus.status.generatedAt),
        tenantId: this.tenantUuid,
        siteId: this.siteUuid,
        status: supportStatus.status.overallHealth,
        snapshotJson: jsonInput(supportStatus),
        createdAt: new Date(supportStatus.status.generatedAt)
      }
    });
  }

  private async syncFeatureFlags(tx: TransactionClient, flags: FeatureFlagDecisionDto[]): Promise<void> {
    const flagKeys = flags.map((flag) => flag.key);
    await tx.featureFlag.deleteMany({
      where: {
        ...this.scopedWhere(),
        ...(flagKeys.length > 0 ? { flagKey: { notIn: flagKeys } } : {})
      }
    });

    for (const flag of flags) {
      await tx.featureFlag.upsert({
        where: {
          tenantId_siteId_flagKey: {
            tenantId: this.tenantUuid,
            siteId: this.siteUuid,
            flagKey: flag.key
          }
        },
        create: {
          id: toDeterministicPersistenceUuid('feature-flag', this.options.tenantId, this.options.siteId, flag.key),
          tenantId: this.tenantUuid,
          siteId: this.siteUuid,
          flagKey: flag.key,
          enabled: flag.enabled,
          disabledReason: flag.disabledReason ?? null
        },
        update: {
          enabled: flag.enabled,
          disabledReason: flag.disabledReason ?? null
        }
      });
    }
  }

  private async syncTemplates(tx: TransactionClient, templates: TemplateMetadataDto[]): Promise<void> {
    const names = templates.map((template) => template.name);
    await tx.template.deleteMany({
      where: {
        ...this.scopedWhere(),
        ...(names.length > 0 ? { name: { notIn: names } } : {})
      }
    });

    for (const template of templates) {
      await tx.template.upsert({
        where: {
          tenantId_siteId_name: {
            tenantId: this.tenantUuid,
            siteId: this.siteUuid,
            name: template.name
          }
        },
        create: {
          id: this.toTemplateUuid(template.templateId),
          tenantId: this.tenantUuid,
          siteId: this.siteUuid,
          name: template.name,
          visitType: template.visitType,
          specialty: template.specialty ?? null,
          body: template.body,
          status: template.status
        },
        update: {
          visitType: template.visitType,
          specialty: template.specialty ?? null,
          body: template.body,
          status: template.status
        }
      });
    }
  }

  private async syncDotPhrases(tx: TransactionClient, dotPhrases: DotPhraseMetadataDto[]): Promise<void> {
    const phrases = dotPhrases.map((dotPhrase) => dotPhrase.phrase);
    await tx.dotPhrase.deleteMany({
      where: {
        ...this.scopedWhere(),
        ...(phrases.length > 0 ? { phrase: { notIn: phrases } } : {})
      }
    });

    for (const dotPhrase of dotPhrases) {
      await tx.dotPhrase.upsert({
        where: {
          tenantId_siteId_phrase: {
            tenantId: this.tenantUuid,
            siteId: this.siteUuid,
            phrase: dotPhrase.phrase
          }
        },
        create: {
          id: this.toDotPhraseUuid(dotPhrase.dotPhraseId),
          tenantId: this.tenantUuid,
          siteId: this.siteUuid,
          phrase: dotPhrase.phrase,
          body: dotPhrase.body,
          status: dotPhrase.status
        },
        update: {
          body: dotPhrase.body,
          status: dotPhrase.status
        }
      });
    }
  }

  private async syncCoachingReports(tx: TransactionClient, reports: CoachingReportDto[]): Promise<void> {
    const ids = reports.map((report) => this.toCoachingReportUuid(report.reportId));
    await tx.coachingReport.deleteMany({
      where: {
        tenantId: this.tenantUuid,
        siteId: this.siteUuid,
        ...(ids.length > 0 ? { id: { notIn: ids } } : {})
      }
    });

    for (const report of reports) {
      await tx.coachingReport.upsert({
        where: { id: this.toCoachingReportUuid(report.reportId) },
        create: {
          id: this.toCoachingReportUuid(report.reportId),
          tenantId: this.tenantUuid,
          siteId: this.siteUuid,
          clinicianId: toDeterministicPersistenceUuid('user', this.options.tenantId, report.clinicianId),
          noteId: toDeterministicPersistenceUuid('note', this.options.tenantId, report.noteId),
          privacyLabel: report.privacyLabel,
          aggregateOnly: false,
          patientFacingExcluded: report.patientFacingExcluded,
          reportJson: jsonInput(report),
          generatedAt: new Date(report.generatedAt)
        },
        update: {
          privacyLabel: report.privacyLabel,
          aggregateOnly: false,
          patientFacingExcluded: report.patientFacingExcluded,
          reportJson: jsonInput(report),
          generatedAt: new Date(report.generatedAt)
        }
      });
    }
  }

  private async syncIntegrationConnections(
    tx: TransactionClient,
    connections: IntegrationConnectionMetadataDto[]
  ): Promise<void> {
    await tx.integrationConnection.deleteMany({ where: this.scopedWhere() });
    for (const connection of connections) {
      await tx.integrationConnection.upsert({
        where: {
          tenantId_siteId_kind_vendor: {
            tenantId: this.tenantUuid,
            siteId: this.siteUuid,
            kind: connection.kind,
            vendor: connection.vendor
          }
        },
        create: {
          id: this.toIntegrationConnectionUuid(connection.integrationConnectionId),
          tenantId: this.tenantUuid,
          siteId: this.siteUuid,
          kind: connection.kind,
          vendor: connection.vendor,
          mode: connection.mode,
          enabled: connection.enabled,
          status: connection.status,
          configJson: jsonInput(connection.config)
        },
        update: {
          mode: connection.mode,
          enabled: connection.enabled,
          status: connection.status,
          configJson: jsonInput(connection.config)
        }
      });
    }
  }

  private async syncModeMappings(tx: TransactionClient, mappings: ModeMappingMetadataDto[]): Promise<void> {
    await tx.modeMapping.deleteMany({ where: this.scopedWhere() });
    for (const mapping of mappings) {
      await tx.modeMapping.upsert({
        where: {
          tenantId_localObjectType_localObjectId_externalSystem: {
            tenantId: this.tenantUuid,
            localObjectType: mapping.localObjectType,
            localObjectId: mapping.localObjectId,
            externalSystem: mapping.externalSystem
          }
        },
        create: {
          id: this.toModeMappingUuid(mapping.modeMappingId),
          tenantId: this.tenantUuid,
          siteId: this.siteUuid,
          localObjectType: mapping.localObjectType,
          localObjectId: mapping.localObjectId,
          externalSystem: mapping.externalSystem,
          externalObjectType: mapping.externalObjectType,
          externalObjectId: mapping.externalObjectId,
          sourceOfTruth: mapping.sourceOfTruth,
          status: mapping.status
        },
        update: {
          siteId: this.siteUuid,
          externalObjectType: mapping.externalObjectType,
          externalObjectId: mapping.externalObjectId,
          sourceOfTruth: mapping.sourceOfTruth,
          status: mapping.status
        }
      });
    }
  }

  private scopedWhere() {
    return {
      tenantId: this.tenantUuid,
      siteId: this.siteUuid
    };
  }

  private assertScopeMatchesSnapshot(snapshot: RuntimeMetadataSnapshot): void {
    if (snapshot.tenantId !== this.options.tenantId || snapshot.siteId !== this.options.siteId) {
      throw new Error('runtime metadata adapter blocks cross-scope persistence');
    }
  }

  private toAuditEventUuid(auditEventId: string): string {
    return toDeterministicPersistenceUuid('audit-event', this.options.tenantId, auditEventId);
  }

  private toDomainEventUuid(eventId: string): string {
    return toDeterministicPersistenceUuid('domain-event', this.options.tenantId, eventId);
  }

  private toTemplateUuid(templateId: string): string {
    return toDeterministicPersistenceUuid('template', this.options.tenantId, templateId);
  }

  private toDotPhraseUuid(dotPhraseId: string): string {
    return toDeterministicPersistenceUuid('dot-phrase', this.options.tenantId, dotPhraseId);
  }

  private toCoachingReportUuid(reportId: string): string {
    return toDeterministicPersistenceUuid('coaching-report', this.options.tenantId, reportId);
  }

  private toIntegrationConnectionUuid(connectionId: string): string {
    return toDeterministicPersistenceUuid('integration-connection', this.options.tenantId, connectionId);
  }

  private toModeMappingUuid(mappingId: string): string {
    return toDeterministicPersistenceUuid('mode-mapping', this.options.tenantId, mappingId);
  }
}

export async function getPersistedRuntimeMetadataForAccessContext(
  prisma: PrismaClient,
  access: AccessContext,
  scope: RuntimeMetadataAccessScope
): Promise<RuntimeMetadataSnapshot | undefined> {
  if (!access.tenantId || !access.siteId) {
    throw new Error('persisted runtime metadata access requires tenant and site scope');
  }
  if (!canAccessRuntimeMetadata(scope, access)) {
    return undefined;
  }

  return createPrismaRuntimeMetadataRepository(prisma, {
    tenantId: access.tenantId,
    siteId: access.siteId
  }).getRuntimeMetadata();
}

function canAccessRuntimeMetadata(scope: RuntimeMetadataAccessScope, access: AccessContext): boolean {
  switch (scope) {
    case 'support':
      return canPerform('support_status:view', access);
    case 'audit':
      return canPerform('audit:view', access);
    case 'coaching':
      return canPerform('coaching_dashboard:view', access) || canPerform('coaching_own:view', access);
    case 'admin':
      return access.authorizedAdmin;
  }
}

function toAuditEventDto(record: { id: string; tenantId: string; siteId: string | null; actorUserId: string | null; action: string; entityType: string; entityId: string; traceId: string | null; createdAt: Date; metadataJson: Prisma.JsonValue | null }): AuditEventDto {
  const metadata = jsonObject<{ auditEventId?: string }>(record.metadataJson);
  return {
    auditEventId: metadata?.auditEventId ?? record.id,
    tenantId: record.tenantId,
    ...(record.siteId ? { siteId: record.siteId } : {}),
    ...(record.actorUserId ? { actorUserId: record.actorUserId } : {}),
    action: record.action,
    entityType: record.entityType,
    entityId: record.entityId,
    traceId: record.traceId ?? `trace-${record.id}`,
    createdAt: record.createdAt.toISOString()
  };
}

function toDomainEventDto(record: {
  id: string;
  tenantId: string;
  siteId: string | null;
  eventType: string;
  aggregateId: string;
  payloadJson: Prisma.JsonValue;
  publishedAt: Date | null;
  createdAt: Date;
}): AuraNoteEvent<Record<string, unknown>> {
  return {
    eventId: record.id,
    eventType: record.eventType as AuraNoteEvent<Record<string, unknown>>['eventType'],
    schemaVersion: 'v1',
    tenantId: record.tenantId,
    siteId: record.siteId ?? 'site-unavailable',
    noteId: record.aggregateId,
    producer: 'aura-note-api',
    traceId: `trace-${record.id}`,
    idempotencyKey: `idem-${record.id}`,
    sensitivity: 'non_phi',
    retentionClass: 'audit',
    eventTime: (record.publishedAt ?? record.createdAt).toISOString(),
    payload: jsonRecord(record.payloadJson)
  };
}

function toFeatureFlagDto(record: { flagKey: string; enabled: boolean; disabledReason: string | null }): FeatureFlagDecisionDto {
  return {
    key: record.flagKey,
    enabled: record.enabled,
    governs: toFeatureFlagGovernance(record.flagKey),
    defaultValue: false,
    ...(record.disabledReason ? { disabledReason: record.disabledReason } : {})
  };
}

function toTemplateDto(
  record: { id: string; tenantId: string; siteId: string | null; name: string; visitType: string; specialty: string | null; body: string; status: string },
  tenantId: string,
  siteId: string
): TemplateMetadataDto {
  return {
    templateId: record.id,
    tenantId,
    siteId,
    name: record.name,
    visitType: record.visitType,
    ...(record.specialty ? { specialty: record.specialty } : {}),
    body: record.body,
    status: toTemplateStatus(record.status)
  };
}

function toDotPhraseDto(
  record: { id: string; tenantId: string; siteId: string | null; phrase: string; body: string; status: string },
  tenantId: string,
  siteId: string
): DotPhraseMetadataDto {
  return {
    dotPhraseId: record.id,
    tenantId,
    siteId,
    phrase: record.phrase,
    body: record.body,
    status: record.status === 'retired' ? 'retired' : 'active'
  };
}

function toCoachingReportDto(record: { reportJson: Prisma.JsonValue }): CoachingReportDto {
  const report = jsonObject<CoachingReportDto>(record.reportJson);
  if (!report) {
    throw new Error('persisted coaching report JSON was not an object');
  }
  return report;
}

function toIntegrationConnectionDto(
  record: { id: string; kind: string; vendor: string; mode: string; enabled: boolean; status: string; configJson: Prisma.JsonValue | null },
  tenantId: string,
  siteId: string
): IntegrationConnectionMetadataDto {
  return {
    integrationConnectionId: record.id,
    tenantId,
    siteId,
    kind: toIntegrationKind(record.kind),
    vendor: record.vendor,
    mode: toIntegrationMode(record.mode),
    enabled: record.enabled,
    status: toIntegrationStatus(record.status),
    config: jsonRecord(record.configJson)
  };
}

function toModeMappingDto(
  record: {
    id: string;
    localObjectType: string;
    localObjectId: string;
    externalSystem: string;
    externalObjectType: string;
    externalObjectId: string;
    sourceOfTruth: string;
    status: string;
  },
  tenantId: string,
  siteId: string
): ModeMappingMetadataDto {
  return {
    modeMappingId: record.id,
    tenantId,
    siteId,
    localObjectType: record.localObjectType,
    localObjectId: record.localObjectId,
    externalSystem: record.externalSystem,
    externalObjectType: record.externalObjectType,
    externalObjectId: record.externalObjectId,
    sourceOfTruth: toSourceOfTruth(record.sourceOfTruth),
    status: toModeMappingStatus(record.status)
  };
}

function jsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function jsonObject<T>(value: Prisma.JsonValue | null): T | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as T) : undefined;
}

function jsonRecord(value: Prisma.JsonValue | null): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function toFeatureFlagGovernance(value: string): FeatureFlagDecisionDto['governs'] {
  if (value.includes('ai')) return 'external_ai';
  if (value.includes('writeback') || value.includes('ehr')) return 'ehr_writeback';
  if (value.includes('clinicos')) return 'clinicos_sync';
  if (value.includes('analytics')) return 'production_analytics';
  return 'audit_export_download';
}

function toTemplateStatus(value: string): TemplateMetadataDto['status'] {
  return value === 'active' || value === 'retired' ? value : 'draft';
}

function toIntegrationKind(value: string): IntegrationConnectionMetadataDto['kind'] {
  const allowed: IntegrationConnectionMetadataDto['kind'][] = ['ehr', 'clinicos', 'ai_gateway', 'storage', 'analytics', 'audit_export'];
  return allowed.includes(value as IntegrationConnectionMetadataDto['kind']) ? (value as IntegrationConnectionMetadataDto['kind']) : 'ehr';
}

function toIntegrationMode(value: string): IntegrationConnectionMetadataDto['mode'] {
  const allowed: IntegrationConnectionMetadataDto['mode'][] = ['standalone', 'mock', 'sandbox', 'disabled'];
  return allowed.includes(value as IntegrationConnectionMetadataDto['mode']) ? (value as IntegrationConnectionMetadataDto['mode']) : 'disabled';
}

function toIntegrationStatus(value: string): IntegrationConnectionMetadataDto['status'] {
  const allowed: IntegrationConnectionMetadataDto['status'][] = ['disabled', 'metadata_only', 'ready_mock', 'failed'];
  return allowed.includes(value as IntegrationConnectionMetadataDto['status']) ? (value as IntegrationConnectionMetadataDto['status']) : 'disabled';
}

function toSourceOfTruth(value: string): ModeMappingMetadataDto['sourceOfTruth'] {
  return value === 'clinicos' || value === 'ehr' ? value : 'aura_note';
}

function toModeMappingStatus(value: string): ModeMappingMetadataDto['status'] {
  return value === 'active' || value === 'metadata_only' ? value : 'disabled';
}

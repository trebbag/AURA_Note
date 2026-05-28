export type AuraNoteHostMode = 'standalone' | 'clinicos_integrated' | 'ehr_embedded' | 'hybrid_transition';
export type ClinicOsModuleId = 'M03' | 'M04' | 'M17' | 'M21' | 'M23' | 'M24' | 'M25' | 'M26';
export type ClinicOsAvailability = 'available' | 'disabled' | 'unavailable' | 'degraded';
export type ClinicOsSourceOfTruth = 'aura_note' | 'clinicos' | 'ehr' | 'hybrid';
export type ClinicOsMappingStatus = 'active' | 'pending' | 'stale' | 'degraded' | 'unavailable' | 'failed';
export type ClinicOsPublishedEventStatus = 'queued' | 'sent_mock' | 'skipped_disabled' | 'failed_unavailable' | 'degraded';

export interface ClinicOsModeSettings {
  hostMode: AuraNoteHostMode;
  enabled: boolean;
  tenantId: string;
  siteId: string;
  sourceOfTruth: {
    schedule: ClinicOsSourceOfTruth;
    patientDemographics: ClinicOsSourceOfTruth;
    tasks: ClinicOsSourceOfTruth;
    aiRuntime: ClinicOsSourceOfTruth;
    chargeIntegrity: ClinicOsSourceOfTruth;
    analytics: ClinicOsSourceOfTruth;
  };
  unavailable?: boolean;
  degraded?: boolean;
}

export interface ClinicOsModeContext {
  enabled: boolean;
  hostMode: AuraNoteHostMode;
  tenantId: string;
  siteId: string;
  availability: ClinicOsAvailability;
  visitGraphId?: string;
  workOsQueueId?: string;
  npCockpitContextId?: string;
  chargeIntegrityContextId?: string;
  copilotRuntimeContextId?: string;
  governanceContextId?: string;
  integrationHubContextId?: string;
  dataCloudContextId?: string;
  warnings: string[];
}

export interface ClinicOsMappingRecord {
  mappingId: string;
  tenantId: string;
  siteId: string;
  localObjectType: 'appointment' | 'note' | 'task' | 'ai_request' | 'charge_preview' | 'event' | 'analytics_signal';
  localObjectId: string;
  clinicosModuleId: ClinicOsModuleId;
  clinicosObjectId: string;
  sourceOfTruth: ClinicOsSourceOfTruth;
  status: ClinicOsMappingStatus;
  staleReason?: string;
  degradedReason?: string;
  traceId: string;
  lastCheckedAt: string;
  lastPublishedAt?: string;
  createdAt: string;
}

export interface ClinicOsPublishedEvent {
  outboxId: string;
  tenantId: string;
  siteId: string;
  eventType: string;
  targetModules: ClinicOsModuleId[];
  status: ClinicOsPublishedEventStatus;
  payloadStored: false;
  permissionBoundaryEnforced: true;
  degradedReason?: string;
  failedReason?: string;
  createdAt: string;
}

export interface ClinicOsModuleBoundary {
  moduleId: ClinicOsModuleId;
  moduleName: string;
  maps: string;
  sourceOfTruth: ClinicOsSourceOfTruth;
  delegationEnabled: boolean;
  permissionBoundary: 'aura_note_authoritative';
}

export interface ClinicOsVisitContextMapping {
  visitGraphId?: string;
  m17ContextId?: string;
  mappings: ClinicOsMappingRecord[];
}

export interface ClinicOsAdapter {
  getModeContext(): Promise<ClinicOsModeContext>;
  resolveMode(settings: ClinicOsModeSettings): ClinicOsModeContext;
  publishAuraNoteEvent(event: { eventType: string; payload?: Record<string, unknown> }): Promise<ClinicOsPublishedEvent>;
  mapVisitContext(input: { localAppointmentId: string; localNoteId: string }): Promise<ClinicOsVisitContextMapping>;
  mapTaskContext(input: { localTaskId: string; noteId: string }): Promise<ClinicOsMappingRecord>;
  mapAiGovernanceContext(input: { localAiRequestId: string }): Promise<ClinicOsMappingRecord>;
  mapChargeIntegrityContext(input: { localDraftClaimPreviewId: string }): Promise<ClinicOsMappingRecord>;
  mapIntegrationHubContext(input: { localEhrContextId: string }): Promise<ClinicOsMappingRecord>;
  mapDataCloudContext(input: { localAnalyticsSignalId: string }): Promise<ClinicOsMappingRecord>;
  listMappings(): Promise<ClinicOsMappingRecord[]>;
  getPublishedEvents(): Promise<ClinicOsPublishedEvent[]>;
}

const DEFAULT_TENANT_ID = 'tenant-synthetic-primary';
const DEFAULT_SITE_ID = 'site-synthetic-primary';

export const STANDALONE_MODE_SETTINGS: ClinicOsModeSettings = {
  hostMode: 'standalone',
  enabled: false,
  tenantId: DEFAULT_TENANT_ID,
  siteId: DEFAULT_SITE_ID,
  sourceOfTruth: {
    schedule: 'aura_note',
    patientDemographics: 'aura_note',
    tasks: 'aura_note',
    aiRuntime: 'aura_note',
    chargeIntegrity: 'aura_note',
    analytics: 'aura_note'
  }
};

export const CLINICOS_MOCK_MODE_SETTINGS: ClinicOsModeSettings = {
  hostMode: 'clinicos_integrated',
  enabled: true,
  tenantId: DEFAULT_TENANT_ID,
  siteId: DEFAULT_SITE_ID,
  sourceOfTruth: {
    schedule: 'clinicos',
    patientDemographics: 'clinicos',
    tasks: 'clinicos',
    aiRuntime: 'clinicos',
    chargeIntegrity: 'clinicos',
    analytics: 'clinicos'
  }
};

export class ClinicOsModeResolver {
  resolve(settings: ClinicOsModeSettings): ClinicOsModeContext {
    if (!settings.enabled || settings.hostMode === 'standalone') {
      return {
        enabled: false,
        hostMode: 'standalone',
        tenantId: settings.tenantId,
        siteId: settings.siteId,
        availability: 'disabled',
        warnings: ['ClinicOS disabled; AURA Note standalone services remain the source of truth.']
      };
    }

    if (settings.unavailable) {
      return {
        enabled: true,
        hostMode: settings.hostMode,
        tenantId: settings.tenantId,
        siteId: settings.siteId,
        availability: 'unavailable',
        warnings: ['ClinicOS is configured but unavailable; AURA Note must degrade to local safe behavior.']
      };
    }

    if (settings.degraded) {
      return {
        enabled: true,
        hostMode: settings.hostMode,
        tenantId: settings.tenantId,
        siteId: settings.siteId,
        availability: 'degraded',
        visitGraphId: 'clinicos-m03-visitgraph-synthetic-001',
        npCockpitContextId: 'clinicos-m17-np-cockpit-synthetic-001',
        warnings: ['ClinicOS is degraded; AURA Note must keep local permissions and fail closed for writes.']
      };
    }

    return {
      enabled: true,
      hostMode: settings.hostMode,
      tenantId: settings.tenantId,
      siteId: settings.siteId,
      availability: 'available',
      visitGraphId: 'clinicos-m03-visitgraph-synthetic-001',
      workOsQueueId: 'clinicos-m04-workos-synthetic-001',
      npCockpitContextId: 'clinicos-m17-np-cockpit-synthetic-001',
      chargeIntegrityContextId: 'clinicos-m21-charge-integrity-synthetic-001',
      copilotRuntimeContextId: 'clinicos-m23-copilot-runtime-synthetic-001',
      governanceContextId: 'clinicos-m24-governance-synthetic-001',
      integrationHubContextId: 'clinicos-m25-integration-hub-synthetic-001',
      dataCloudContextId: 'clinicos-m26-data-cloud-synthetic-001',
      warnings: ['ClinicOS mock mode uses synthetic mappings only.']
    };
  }
}

export class MockClinicOsAdapter implements ClinicOsAdapter {
  private sequence = 1;
  private readonly settings: ClinicOsModeSettings;
  private readonly resolver = new ClinicOsModeResolver();
  private readonly mappings: ClinicOsMappingRecord[] = [];
  private readonly outbox: ClinicOsPublishedEvent[] = [];

  constructor(settings: Partial<ClinicOsModeSettings> = {}) {
    this.settings = {
      ...(settings.enabled ? CLINICOS_MOCK_MODE_SETTINGS : STANDALONE_MODE_SETTINGS),
      ...settings,
      tenantId: settings.tenantId ?? DEFAULT_TENANT_ID,
      siteId: settings.siteId ?? DEFAULT_SITE_ID,
      sourceOfTruth: settings.sourceOfTruth ?? (settings.enabled ? CLINICOS_MOCK_MODE_SETTINGS : STANDALONE_MODE_SETTINGS).sourceOfTruth
    };
  }

  async getModeContext(): Promise<ClinicOsModeContext> {
    return this.resolveMode(this.settings);
  }

  resolveMode(settings: ClinicOsModeSettings): ClinicOsModeContext {
    return this.resolver.resolve(settings);
  }

  async publishAuraNoteEvent(event: { eventType: string; payload?: Record<string, unknown> }): Promise<ClinicOsPublishedEvent> {
    const context = await this.getModeContext();
    const status: ClinicOsPublishedEventStatus = !context.enabled
      ? 'skipped_disabled'
      : context.availability === 'unavailable'
        ? 'failed_unavailable'
        : context.availability === 'degraded'
          ? 'degraded'
          : 'queued';
    const published: ClinicOsPublishedEvent = {
      outboxId: this.nextId('clinicos-outbox'),
      tenantId: context.tenantId,
      siteId: context.siteId,
      eventType: event.eventType,
      targetModules: resolveTargetModules(event.eventType),
      status,
      payloadStored: false,
      permissionBoundaryEnforced: true,
      ...(status === 'degraded' ? { degradedReason: 'ClinicOS mock publication is degraded; AURA Note retains authority.' } : {}),
      ...(status === 'failed_unavailable' ? { failedReason: 'ClinicOS mock adapter unavailable; publication failed closed.' } : {}),
      createdAt: new Date().toISOString()
    };
    this.outbox.push(published);
    return published;
  }

  async mapVisitContext(input: { localAppointmentId: string; localNoteId: string }): Promise<ClinicOsVisitContextMapping> {
    const context = await this.getModeContext();
    if (!context.enabled || context.availability !== 'available') {
      return { mappings: [] };
    }

    const visitGraph = this.recordMapping('appointment', input.localAppointmentId, 'M03', context.visitGraphId!, 'clinicos');
    const noteContext = this.recordMapping('note', input.localNoteId, 'M17', context.npCockpitContextId!, 'clinicos');
    return {
      ...(context.visitGraphId ? { visitGraphId: context.visitGraphId } : {}),
      ...(context.npCockpitContextId ? { m17ContextId: context.npCockpitContextId } : {}),
      mappings: [visitGraph, noteContext]
    };
  }

  async mapTaskContext(input: { localTaskId: string; noteId: string }): Promise<ClinicOsMappingRecord> {
    return this.recordMapping('task', input.localTaskId, 'M04', `clinicos-m04-task-${input.localTaskId}`, 'clinicos');
  }

  async mapAiGovernanceContext(input: { localAiRequestId: string }): Promise<ClinicOsMappingRecord> {
    return this.recordMapping('ai_request', input.localAiRequestId, 'M24', `clinicos-m24-ai-${input.localAiRequestId}`, 'clinicos');
  }

  async mapChargeIntegrityContext(input: { localDraftClaimPreviewId: string }): Promise<ClinicOsMappingRecord> {
    return this.recordMapping(
      'charge_preview',
      input.localDraftClaimPreviewId,
      'M21',
      `clinicos-m21-claimguard-${input.localDraftClaimPreviewId}`,
      'clinicos'
    );
  }

  async mapIntegrationHubContext(input: { localEhrContextId: string }): Promise<ClinicOsMappingRecord> {
    return this.recordMapping('event', input.localEhrContextId, 'M25', `clinicos-m25-integration-${input.localEhrContextId}`, 'clinicos');
  }

  async mapDataCloudContext(input: { localAnalyticsSignalId: string }): Promise<ClinicOsMappingRecord> {
    return this.recordMapping(
      'analytics_signal',
      input.localAnalyticsSignalId,
      'M26',
      `clinicos-m26-data-${input.localAnalyticsSignalId}`,
      'clinicos'
    );
  }

  async listMappings(): Promise<ClinicOsMappingRecord[]> {
    return [...this.mappings];
  }

  async getPublishedEvents(): Promise<ClinicOsPublishedEvent[]> {
    return [...this.outbox];
  }

  private recordMapping(
    localObjectType: ClinicOsMappingRecord['localObjectType'],
    localObjectId: string,
    clinicosModuleId: ClinicOsModuleId,
    clinicosObjectId: string,
    sourceOfTruth: ClinicOsSourceOfTruth
  ): ClinicOsMappingRecord {
    const context = this.resolver.resolve(this.settings);
    const record: ClinicOsMappingRecord = {
      mappingId: this.nextId('clinicos-map'),
      tenantId: context.tenantId,
      siteId: context.siteId,
      localObjectType,
      localObjectId,
      clinicosModuleId,
      clinicosObjectId,
      sourceOfTruth,
      status: context.enabled && context.availability === 'available' ? 'active' : 'unavailable',
      traceId: this.nextId('trace-clinicos-map'),
      lastCheckedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    this.mappings.push(record);
    return record;
  }

  private nextId(prefix: string): string {
    const id = `${prefix}-${this.sequence.toString().padStart(4, '0')}`;
    this.sequence += 1;
    return id;
  }
}

export function getClinicOsModuleBoundaries(sourceOfTruth: ClinicOsModeSettings['sourceOfTruth']): ClinicOsModuleBoundary[] {
  return [
    {
      moduleId: 'M03',
      moduleName: 'VisitGraph',
      maps: 'appointment and visit context',
      sourceOfTruth: sourceOfTruth.schedule,
      delegationEnabled: sourceOfTruth.schedule === 'clinicos',
      permissionBoundary: 'aura_note_authoritative'
    },
    {
      moduleId: 'M04',
      moduleName: 'WorkOS Tasks',
      maps: 'tasks and blocker follow-up',
      sourceOfTruth: sourceOfTruth.tasks,
      delegationEnabled: sourceOfTruth.tasks === 'clinicos',
      permissionBoundary: 'aura_note_authoritative'
    },
    {
      moduleId: 'M17',
      moduleName: 'NP Cockpit',
      maps: 'documentation workspace launch context',
      sourceOfTruth: sourceOfTruth.schedule,
      delegationEnabled: sourceOfTruth.schedule === 'clinicos',
      permissionBoundary: 'aura_note_authoritative'
    },
    {
      moduleId: 'M21',
      moduleName: 'Charge Integrity',
      maps: 'draft claim preview metadata',
      sourceOfTruth: sourceOfTruth.chargeIntegrity,
      delegationEnabled: sourceOfTruth.chargeIntegrity === 'clinicos',
      permissionBoundary: 'aura_note_authoritative'
    },
    {
      moduleId: 'M23',
      moduleName: 'Copilot Runtime',
      maps: 'AI request metadata only',
      sourceOfTruth: sourceOfTruth.aiRuntime,
      delegationEnabled: sourceOfTruth.aiRuntime === 'clinicos',
      permissionBoundary: 'aura_note_authoritative'
    },
    {
      moduleId: 'M24',
      moduleName: 'AI Governance',
      maps: 'prompt, policy, and review metadata',
      sourceOfTruth: sourceOfTruth.aiRuntime,
      delegationEnabled: sourceOfTruth.aiRuntime === 'clinicos',
      permissionBoundary: 'aura_note_authoritative'
    },
    {
      moduleId: 'M25',
      moduleName: 'Integration Hub',
      maps: 'EHR adapter and writeback metadata',
      sourceOfTruth: 'hybrid',
      delegationEnabled: true,
      permissionBoundary: 'aura_note_authoritative'
    },
    {
      moduleId: 'M26',
      moduleName: 'Data Cloud',
      maps: 'analytics and coaching signal metadata',
      sourceOfTruth: sourceOfTruth.analytics,
      delegationEnabled: sourceOfTruth.analytics === 'clinicos',
      permissionBoundary: 'aura_note_authoritative'
    }
  ];
}

export function resolveTargetModules(eventType: string): ClinicOsModuleId[] {
  if (eventType.startsWith('ai.')) return ['M23', 'M24'];
  if (eventType.startsWith('ehr.')) return ['M25'];
  if (eventType.startsWith('draft_claim') || eventType.startsWith('billing')) return ['M21'];
  if (eventType.startsWith('task.') || eventType.startsWith('history_gap.')) return ['M04'];
  if (eventType.startsWith('appointment.') || eventType.startsWith('visit.')) return ['M03', 'M17'];
  if (eventType.startsWith('coaching.')) return ['M26'];
  return ['M17'];
}

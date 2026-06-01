import {
  CLINICOS_MOCK_MODE_SETTINGS,
  ClinicOsModeResolver,
  STANDALONE_MODE_SETTINGS,
  getClinicOsModuleBoundaries,
  type AuraNoteHostMode,
  type ClinicOsModeContext,
  type ClinicOsModeSettings,
  type ClinicOsModuleBoundary,
  type ClinicOsModuleId,
  type ClinicOsSourceOfTruth
} from '@aura-note/clinicos-adapter';
import type { AppMode } from '@aura-note/domain';

export const AURA_MODE_DEFAULT_TENANT_ID = 'tenant-synthetic-primary';
export const AURA_MODE_DEFAULT_SITE_ID = 'site-synthetic-primary';

export type AuraModeAdapterSeam =
  | 'scheduleSource'
  | 'patientContext'
  | 'visitGraph'
  | 'tasks'
  | 'audit'
  | 'aiGovernance'
  | 'chargeIntegrity'
  | 'ehr'
  | 'export'
  | 'identity';

export type AuraModeAdapterStatus = 'standalone_authoritative' | 'mock_available' | 'mock_degraded' | 'unavailable' | 'disabled';

export interface AuraModeAdapterBoundary {
  seam: AuraModeAdapterSeam;
  displayName: string;
  sourceOfTruth: ClinicOsSourceOfTruth;
  adapterStatus: AuraModeAdapterStatus;
  permissionBoundary: 'aura_note_authoritative';
  liveDelegationEnabled: false;
  rawPayloadStorageEnabled: false;
  humanReviewRequired: true;
  writesFailClosed: boolean;
  notes: string;
  clinicOsModuleId?: ClinicOsModuleId;
}

export interface AuraRuntimeModeResolution {
  apiMode: AppMode;
  modeContext: ClinicOsModeContext;
  adapterSettings: ClinicOsModeSettings;
  clinicOsModuleBoundaries: ClinicOsModuleBoundary[];
  adapterBoundaries: AuraModeAdapterBoundary[];
  permissionsStillEnforcedByAuraNote: true;
  liveClinicOsSyncEnabled: false;
  rawPayloadsStored: false;
  delegatedIdentityEnabled: false;
  liveEventBusEnabled: false;
}

interface ResolveModeOptions {
  tenantId?: string;
  siteId?: string;
}

export function resolveAuraRuntimeModeFromHeaders(
  headers: Record<string, string | string[] | undefined>,
  options: ResolveModeOptions = {}
): AuraRuntimeModeResolution {
  const hostMode = parseHostMode(headerValue(headers['x-aura-clinicos-mode']));
  const enabled = hostMode !== 'standalone';
  const unavailable = parseBooleanHeader(headerValue(headers['x-aura-clinicos-unavailable'])) ?? false;
  const degraded = parseBooleanHeader(headerValue(headers['x-aura-clinicos-degraded'])) ?? false;
  const tenantId = options.tenantId ?? AURA_MODE_DEFAULT_TENANT_ID;
  const siteId = options.siteId ?? AURA_MODE_DEFAULT_SITE_ID;
  const baseSettings = enabled ? CLINICOS_MOCK_MODE_SETTINGS : STANDALONE_MODE_SETTINGS;
  const adapterSettings: ClinicOsModeSettings = {
    ...baseSettings,
    hostMode,
    enabled,
    tenantId,
    siteId,
    sourceOfTruth: baseSettings.sourceOfTruth,
    ...(enabled && unavailable ? { unavailable: true } : {}),
    ...(enabled && degraded ? { degraded: true } : {})
  };
  const modeContext = new ClinicOsModeResolver().resolve(adapterSettings);
  const clinicOsModuleBoundaries = getClinicOsModuleBoundaries(adapterSettings.sourceOfTruth);

  return {
    apiMode: resolveApiModeForHostMode(modeContext.hostMode),
    modeContext,
    adapterSettings,
    clinicOsModuleBoundaries,
    adapterBoundaries: createAdapterBoundaries(modeContext, adapterSettings),
    permissionsStillEnforcedByAuraNote: true,
    liveClinicOsSyncEnabled: false,
    rawPayloadsStored: false,
    delegatedIdentityEnabled: false,
    liveEventBusEnabled: false
  };
}

export function resolveApiModeForHostMode(hostMode: AuraNoteHostMode | undefined): AppMode {
  return hostMode && hostMode !== 'standalone' ? 'clinicos_integrated' : 'standalone';
}

function createAdapterBoundaries(modeContext: ClinicOsModeContext, settings: ClinicOsModeSettings): AuraModeAdapterBoundary[] {
  const adapterStatus = adapterStatusForContext(modeContext);
  const writesFailClosed = modeContext.enabled && modeContext.availability !== 'available';
  const disabledNotes = 'Standalone AURA Note remains authoritative; ClinicOS is not required for the local workflow.';
  const mockNotes = 'ClinicOS mock mode is metadata-only; AURA Note permissions, tenant/site scope, and human review remain authoritative.';
  const degradedNotes = 'ClinicOS is unavailable or degraded; writes fail closed and no raw payloads are stored.';
  const notes = !modeContext.enabled ? disabledNotes : modeContext.availability === 'available' ? mockNotes : degradedNotes;

  return [
    boundary('scheduleSource', 'Schedule source', settings.sourceOfTruth.schedule, adapterStatus, writesFailClosed, notes, 'M03'),
    boundary('patientContext', 'Patient context', settings.sourceOfTruth.patientDemographics, adapterStatus, writesFailClosed, notes, 'M03'),
    boundary('visitGraph', 'VisitGraph context', settings.sourceOfTruth.schedule, adapterStatus, writesFailClosed, notes, 'M03'),
    boundary('tasks', 'WorkOS task context', settings.sourceOfTruth.tasks, adapterStatus, writesFailClosed, notes, 'M04'),
    boundary('audit', 'AURA Note audit context', 'aura_note', adapterStatus, writesFailClosed, notes, 'M26'),
    boundary('aiGovernance', 'AI governance context', settings.sourceOfTruth.aiRuntime, adapterStatus, writesFailClosed, notes, 'M24'),
    boundary('chargeIntegrity', 'Charge Integrity context', settings.sourceOfTruth.chargeIntegrity, adapterStatus, writesFailClosed, notes, 'M21'),
    boundary('ehr', 'EHR adapter context', 'hybrid', adapterStatus, writesFailClosed, notes, 'M25'),
    boundary('export', 'Export delivery context', 'aura_note', adapterStatus, writesFailClosed, notes, 'M25'),
    boundary('identity', 'Identity context', modeContext.enabled ? 'hybrid' : 'aura_note', adapterStatus, true, notes, 'M17')
  ];
}

function boundary(
  seam: AuraModeAdapterSeam,
  displayName: string,
  sourceOfTruth: ClinicOsSourceOfTruth,
  adapterStatus: AuraModeAdapterStatus,
  writesFailClosed: boolean,
  notes: string,
  clinicOsModuleId?: ClinicOsModuleId
): AuraModeAdapterBoundary {
  return {
    seam,
    displayName,
    sourceOfTruth,
    adapterStatus,
    permissionBoundary: 'aura_note_authoritative',
    liveDelegationEnabled: false,
    rawPayloadStorageEnabled: false,
    humanReviewRequired: true,
    writesFailClosed,
    notes,
    ...(clinicOsModuleId ? { clinicOsModuleId } : {})
  };
}

function adapterStatusForContext(modeContext: ClinicOsModeContext): AuraModeAdapterStatus {
  if (!modeContext.enabled) return 'standalone_authoritative';
  if (modeContext.availability === 'unavailable') return 'unavailable';
  if (modeContext.availability === 'degraded') return 'mock_degraded';
  if (modeContext.availability === 'disabled') return 'disabled';
  return 'mock_available';
}

function parseHostMode(value: string | undefined): AuraNoteHostMode {
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

function parseBooleanHeader(value: string | undefined): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
